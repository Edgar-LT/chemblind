/**
 * @file app.js
 * @description Orchestrator for ChemBlind (Chemistry Unfiltered).
 * Coordinates Domain State (engine.js), UI Presentation (ui-manager.js),
 * Timing Engine (chronograph.js), and Network Transport (supabase-client.js).
 */

import {
  GAME_MODES,
  INTENSITY_LEVELS,
  LEVEL_METADATA,
  DEFAULT_CARDS,
  createInitialGameState,
  completeCurrentTurn,
  useWildcardSkip,
  setIntensityLevel,
  addCustomCardToState,
  clampNumber,
  pickInitialCard
} from './engine.js';

import {
  createGameRoom,
  joinGameRoom,
  fetchRoomData,
  subscribeToRoomChannel,
  broadcastRoomEvent,
  updateRoomRecord,
  fetchClientActiveRooms,
  closeGameRoom,
  getDeviceId,
  getSessionClientId,
  saveRoomMessage
} from './supabase-client.js';

import { ChronographService } from './chronograph.js';
import { UIManager } from './ui-manager.js';
import { ChatRoomAPI } from './chat-service.js';

const STORAGE_KEY_CUSTOM_CARDS = 'chemblind_custom_cards_v1';
const STORAGE_KEY_THEME = 'chemblind_theme_v1';
const STORAGE_KEY_LAST_GUEST_NAME = 'chemblind_last_guest_name_v1';
const getGuestSessionKey = (code) => `chemblind_guest_session_${code}`;

class ChemBlindAppController {
  constructor() {
    this.state = null;
    this.savedCustomCards = [];
    this.roomSession = null;
    this.pendingInvite = null;
    this.activeRoomsList = [];
    this.renderedMessageIds = new Set();

    // Initialize decoupled UI, Timing & Standalone Chat API subsystems
    this.ui = new UIManager();
    this.chatAPI = new ChatRoomAPI();
    this.chrono = new ChronographService({
      onTick: ({ remainingSec, isRunning }) => {
        this.ui.renderTimer(remainingSec, this.chrono.isRunning);
      },
      onComplete: () => {
        this.ui.showToast('⏱ ¡Reto completado! +5% de Química');
        if (this.state) {
          this.state = {
            ...this.state,
            chemistryScore: clampNumber(this.state.chemistryScore + 5, 0, 100)
          };
          this.syncRoomState('TIMER_BONUS');
          this.ui.renderGameStage(this.state, this.roomSession);
        }
      },
      onStateChange: (isRunning) => {
        this.ui.renderTimer(this.chrono.getState().remainingSec, isRunning);
      }
    });
  }

  async init() {
    this.loadStoredPreferences();
    this.bindEvents();
    // Synchronize initial session type with DOM
    const initialSessionType = document.querySelector('input[name="sessionType"]:checked');
    this.ui.setSessionType(initialSessionType?.value === 'room');
    await this.refreshActiveRooms();
    await this.checkUrlInvitation();
  }

  loadStoredPreferences() {
    try {
      const rawCards = localStorage.getItem(STORAGE_KEY_CUSTOM_CARDS);
      if (rawCards) {
        const parsed = JSON.parse(rawCards);
        if (Array.isArray(parsed)) {
          this.savedCustomCards = parsed;
        }
      }

      const savedTheme = localStorage.getItem(STORAGE_KEY_THEME);
      if (savedTheme === 'light' || savedTheme === 'dark') {
        this.ui.applyTheme(savedTheme);
      }
    } catch (err) {
      console.warn('No se pudieron cargar las preferencias locales:', err);
    }
  }

  saveCustomCardsToStorage() {
    if (!this.state) return;
    try {
      this.savedCustomCards = this.state.customCards;
      localStorage.setItem(
        STORAGE_KEY_CUSTOM_CARDS,
        JSON.stringify(this.savedCustomCards)
      );
    } catch (err) {
      console.warn('No se pudieron guardar las cartas personalizadas:', err);
    }
  }

  bindEvents() {
    const el = this.ui.elements;

    // Theme toggle
    el.themeToggleBtn?.addEventListener('click', () => {
      const isLight = document.documentElement.getAttribute('data-theme') === 'light';
      const targetTheme = isLight ? 'dark' : 'light';
      this.ui.applyTheme(targetTheme);
      try {
        localStorage.setItem(STORAGE_KEY_THEME, targetTheme);
      } catch (e) {
        console.warn('No se pudo guardar el tema:', e);
      }
    });

    // Session Type Selection (1 Phone vs 2 Phones)
    el.sessionTypeRadios.forEach((radio) => {
      radio.addEventListener('change', () => {
        const isRoom = radio.value === 'room';
        this.ui.setSessionType(isRoom);
        this.refreshActiveRooms();
      });
    });

    // Explicit delegation on cards to guarantee click propagation on any browser/device
    document.querySelectorAll('.setup-mode-option').forEach((card) => {
      card.addEventListener('click', () => {
        const radio = card.querySelector('input[name="sessionType"]');
        if (radio && !radio.checked) {
          radio.checked = true;
          radio.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });
    });

    // Forms
    el.onboardingForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleOnboardingSubmit();
    });

    el.guestJoinForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleGuestJoinSubmit();
    });

    // Active rooms modal triggers
    el.viewRoomsBtn?.addEventListener('click', () => this.openActiveRoomsModal());
    el.bannerViewRoomsBtn?.addEventListener('click', () => this.openActiveRoomsModal());
    el.closeRoomsModalBtn?.addEventListener('click', () => this.ui.setRoomsModalOpen(false));
    el.closeRoomsModalBtn2?.addEventListener('click', () => this.ui.setRoomsModalOpen(false));
    el.activeRoomsModal?.addEventListener('click', (e) => {
      if (e.target === el.activeRoomsModal) {
        this.ui.setRoomsModalOpen(false);
      }
    });

    // Waiting Screen Actions
    el.copyRoomLinkBtn?.addEventListener('click', () => {
      if (!this.roomSession?.inviteUrl) return;
      navigator.clipboard.writeText(this.roomSession.inviteUrl);
      this.ui.showToast('Enlace de invitación copiado al portapapeles');
    });

    el.whatsappRoomLinkBtn?.addEventListener('click', () => {
      if (!this.roomSession?.inviteUrl) return;
      const message = `👋 Te invito a jugar a *ChemBlind* (Química para dos):\n\nEntra aquí para conectarte a mi sala: ${this.roomSession.inviteUrl}`;
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
    });

    el.cancelRoomBtn?.addEventListener('click', () => {
      this.teardownRoomSession();
      this.ui.showScreen('onboarding');
    });

    // Unified Room Hub & Change Players Button
    el.changePlayersBtn?.addEventListener('click', () => {
      if (this.roomSession) {
        this.openActiveRoomsModal();
      } else {
        this.teardownRoomSession();
        this.chrono.stop();
        this.ui.showScreen('onboarding');
        window.history.replaceState({}, document.title, window.location.pathname);
        const isRoom = document.querySelector('input[name="sessionType"]:checked')?.value === 'room';
        this.ui.setSessionType(Boolean(isRoom));
      }
    });

    // Exit Game Button inside Active Rooms Modal
    el.modalExitGameBtn?.addEventListener('click', () => {
      this.ui.setRoomsModalOpen(false);
      this.teardownRoomSession();
      this.chrono.stop();
      this.ui.showScreen('onboarding');
      window.history.replaceState({}, document.title, window.location.pathname);
      const isRoom = document.querySelector('input[name="sessionType"]:checked')?.value === 'room';
      this.ui.setSessionType(Boolean(isRoom));
      this.ui.showToast('Partida finalizada.');
    });

    // Intensity Level Tabs
    el.levelTabs.forEach((btn) => {
      btn.addEventListener('click', () => {
        if (!this.state) return;
        const targetLevel = Number(btn.getAttribute('data-level-btn'));
        if (targetLevel === this.state.currentLevel) return;

        this.chrono.stop();
        this.ui.resetResponseSection();
        this.clearDraftResponse();
        this.state = setIntensityLevel(this.state, targetLevel);
        this.persistLocalSession();
        this.syncRoomState('LEVEL_CHANGED');
        this.ui.animateCardTransition(() => {
          this.syncTimerWithCurrentCard();
          this.ui.renderGameStage(this.state, this.roomSession);
        });
      });
    });

    // Complete Turn -> Draw Next Card
    el.completeTurnBtn?.addEventListener('click', () => {
      if (!this.state) return;
      this.chrono.stop();
      this.ui.resetResponseSection();
      this.clearDraftResponse();
      this.state = completeCurrentTurn(this.state);
      this.persistLocalSession();
      this.syncRoomState('NEXT_CARD');
      this.ui.animateCardTransition(() => {
        this.syncTimerWithCurrentCard();
        this.ui.renderGameStage(this.state, this.roomSession);
      });
    });

    // Wildcard Skip
    el.wildcardSkipBtn?.addEventListener('click', () => {
      if (!this.state) return;
      const result = useWildcardSkip(this.state);
      if (!result.used) {
        this.ui.showToast(result.reason || 'Ya no te quedan comodines');
        return;
      }
      this.chrono.stop();
      this.ui.resetResponseSection();
      this.clearDraftResponse();
      this.state = result.state;
      this.persistLocalSession();
      this.syncRoomState('WILDCARD_SKIP');
      this.ui.animateCardTransition(() => {
        this.syncTimerWithCurrentCard();
        this.ui.renderGameStage(this.state, this.roomSession);
      });
      this.ui.showToast('Carta saltada con comodín');
    });

    // Card Response: Live Character Counter and Draft Autosave
    el.cardResponseInput?.addEventListener('input', (e) => {
      this.ui.updateResponseCharCount(e.target.value.length);
      this.saveDraftResponse(e.target.value);
    });

    // Card Response: Send Response
    el.sendResponseBtn?.addEventListener('click', () => {
      this.handleSendResponse();
    });

    // Card Response: Edit Sent Response
    el.editResponseBtn?.addEventListener('click', () => {
      const currentText = this.ui.elements.responseDisplayText?.textContent || '';
      this.ui.showResponseInput(currentText);
    });

    // Conversation Chat Modal Controls (All 4 triggers: card, display quote, nav, and floating)
    el.cardOpenChatBtn?.addEventListener('click', () => {
      this.ui.setChatModalOpen(true);
    });

    el.openChatModalBtn?.addEventListener('click', () => {
      this.ui.setChatModalOpen(true);
    });

    el.navChatBtn?.addEventListener('click', () => {
      this.ui.setChatModalOpen(true);
    });

    el.floatingChatTrigger?.addEventListener('click', () => {
      this.ui.setChatModalOpen(true);
    });

    el.closeChatModalBtn?.addEventListener('click', () => {
      this.ui.setChatModalOpen(false);
    });

    el.popoutChatBtn?.addEventListener('click', () => {
      if (this.roomSession?.code) {
        const myName = this.roomSession.role === 'player_one' ? this.roomSession.p1Name : this.roomSession.p2Name;
        window.open(`./chat.html?room=${this.roomSession.code}&name=${encodeURIComponent(myName || 'Jugador')}`, '_blank');
      } else {
        this.ui.showToast('La sala debe estar activa para abrir el chat en pestaña independiente');
      }
    });

    el.chatConversationModal?.addEventListener('click', (e) => {
      if (e.target === el.chatConversationModal) {
        this.ui.setChatModalOpen(false);
      }
    });

    el.chatModalForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSendChatMessage();
    });

    // Chrono Controls
    el.chronoToggleBtn?.addEventListener('click', () => {
      this.chrono.toggle();
    });

    el.chronoResetBtn?.addEventListener('click', () => {
      const cardTimer = this.state?.currentCard?.timerSeconds || 20;
      this.chrono.reset(cardTimer);
    });

    // Custom Cards Modal
    el.openCustomModalBtn?.addEventListener('click', () => {
      this.ui.setCustomCardModalOpen(true, this.state ? this.state.currentLevel : 1);
    });

    el.closeCustomModalBtn?.addEventListener('click', () => {
      this.ui.setCustomCardModalOpen(false);
    });

    el.customCardModal?.addEventListener('click', (e) => {
      if (e.target === el.customCardModal) {
        this.ui.setCustomCardModalOpen(false);
      }
    });

    el.customCardForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleCreateCustomCard();
    });
  }

  /* ==========================================================================
     Multiplayer & Network Bridge
     ========================================================================== */

  async checkUrlInvitation() {
    try {
      const params = new URLSearchParams(window.location.search);
      const roomCode = params.get('room');
      const accessToken = params.get('key');

      if (!roomCode || !accessToken) return;

      const roomData = await fetchRoomData(roomCode, accessToken);
      if (!roomData) {
        this.ui.showToast('Esta sala ha expirado o el enlace no es válido.');
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
      }

      const currentClientId = getDeviceId();
      const isHostDevice = roomData.creator_client_id === currentClientId;

      if (isHostDevice) {
        this.resumeHostSession(roomData, accessToken);
        return;
      }

      this.handleGuestInvitation(roomData, accessToken);
    } catch (err) {
      console.warn('Error verificando invitación a sala:', err);
    }
  }

  resumeHostSession(roomData, accessToken) {
    const inviteUrl = `${window.location.origin}${window.location.pathname}?room=${roomData.code}&key=${accessToken}`;
    this.roomSession = {
      role: 'player_one',
      code: roomData.code,
      accessToken,
      hostToken: roomData.host_token,
      roomId: roomData.id,
      inviteUrl,
      mode: roomData.mode,
      level: roomData.level || 1,
      p1Name: roomData.player_one_name,
      p2Name: roomData.player_two_name,
      startingCardId: roomData.current_card_id
    };

    if (!roomData.player_two_joined) {
      this.ui.showScreen('waiting');
      if (this.ui.elements.waitingRoomCode) {
        this.ui.elements.waitingRoomCode.textContent = roomData.code;
      }
      this.connectToRealtimeRoom(roomData.code);
      this.ui.showToast(`Sala ${roomData.code} activa. Esperando a tu cita.`);
    } else {
      const p2Name = roomData.player_two_name || 'Invitado';
      this.hydrateAndStartGame(roomData, p2Name);
      this.ui.showScreen('game');
      this.connectToRealtimeRoom(roomData.code);
      this.syncTimerWithCurrentCard();
      this.ui.renderGameStage(this.state, this.roomSession);
      this.ui.showToast(`Reconectado a sala ${roomData.code} con ${p2Name}`);
    }

    this.refreshActiveRooms();
  }

  handleGuestInvitation(roomData, accessToken) {
    this.pendingInvite = { roomCode: roomData.code, accessToken, roomData };

    const sessionKey = getGuestSessionKey(roomData.code);
    let savedGuestName = '';
    try {
      const rawSession = localStorage.getItem(sessionKey);
      if (rawSession) {
        const parsed = JSON.parse(rawSession);
        savedGuestName = parsed.name || '';
      }
    } catch (e) {
      console.warn('Error leyendo sesión guardada de invitado', e);
    }

    if (!savedGuestName) {
      savedGuestName = localStorage.getItem(STORAGE_KEY_LAST_GUEST_NAME) || '';
    }

    // Direct entry if game is in progress and guest name is known
    const alreadyJoined = roomData.player_two_joined;
    if (alreadyJoined && (savedGuestName || roomData.player_two_name)) {
      const guestName = savedGuestName || roomData.player_two_name || 'Invitado';
      this.resumeGuestSession(roomData, accessToken, guestName);
      return;
    }

    // Show guest join invitation form
    this.ui.showScreen('guest-join');
    if (this.ui.elements.guestInviteRoomCode) {
      this.ui.elements.guestInviteRoomCode.textContent = `SALA ${roomData.code}`;
    }
    if (this.ui.elements.guestInviteDetails) {
      const modeName = roomData.mode === 'online' ? 'Online (A distancia)' : 'Presencial';
      this.ui.elements.guestInviteDetails.textContent = `${roomData.player_one_name} te ha invitado a jugar en Modo ${modeName}.`;
    }
    if (this.ui.elements.onboardingSubtitle) {
      this.ui.elements.onboardingSubtitle.textContent = `Invitación recibida de ${roomData.player_one_name}.`;
    }
    if (this.ui.elements.guestNameInput && savedGuestName) {
      this.ui.elements.guestNameInput.value = savedGuestName;
    }
  }

  resumeGuestSession(roomData, accessToken, guestName) {
    try {
      localStorage.setItem(
        getGuestSessionKey(roomData.code),
        JSON.stringify({ name: guestName, accessToken })
      );
      localStorage.setItem(STORAGE_KEY_LAST_GUEST_NAME, guestName);
    } catch (e) {
      console.warn('No se pudo guardar sesión de invitado', e);
    }

    this.roomSession = {
      role: 'player_two',
      code: roomData.code,
      accessToken,
      roomId: roomData.id,
      mode: roomData.mode,
      level: roomData.level || 1,
      p1Name: roomData.player_one_name,
      p2Name: guestName
    };

    this.hydrateAndStartGame(roomData, guestName);
    this.connectToRealtimeRoom(roomData.code);

    broadcastRoomEvent(this.roomSession.channel, 'PLAYER_JOINED', {
      playerTwoName: guestName
    });

    this.ui.showScreen('game');
    this.syncTimerWithCurrentCard();
    this.ui.renderGameStage(this.state, this.roomSession);
    this.ui.showToast(`Reconectado a la sala con ${roomData.player_one_name}`);
  }

  hydrateAndStartGame(roomData, guestName) {
    this.ui.resetResponseSection();

    // Check if we have an active session snapshot in sessionStorage for this tab
    const localSnapshot = this.restoreLocalSessionSnapshot(roomData.code);

    const initialLevel = roomData.level || localSnapshot?.currentLevel || 1;
    const targetCardId = roomData.current_card_id || localSnapshot?.currentCardId;

    this.state = createInitialGameState({
      playerOne: roomData.player_one_name,
      playerTwo: guestName,
      gameMode: roomData.mode,
      initialLevel,
      initialCardId: targetCardId,
      customCards: this.savedCustomCards
    });

    if (targetCardId) {
      const allCards = [...this.savedCustomCards, ...DEFAULT_CARDS];
      const foundCard = allCards.find((c) => c.id === targetCardId);
      if (foundCard) {
        this.state.currentCard = foundCard;
      }
    }

    if (localSnapshot?.turnCount) {
      this.state.turnCount = localSnapshot.turnCount;
    }

    const activeTurn = typeof localSnapshot?.activePlayerIndex === 'number'
      ? localSnapshot.activePlayerIndex
      : (typeof roomData.active_turn === 'number' && roomData.active_turn >= 1 ? roomData.active_turn - 1 : 0);
    this.state.activePlayerIndex = activeTurn;

    const chemScore = typeof localSnapshot?.chemistryScore === 'number'
      ? localSnapshot.chemistryScore
      : (typeof roomData.chemistry_score === 'number' ? roomData.chemistry_score : 15);
    this.state.chemistryScore = clampNumber(chemScore, 0, 100);

    if (localSnapshot?.currentLevel) {
      this.state.currentLevel = localSnapshot.currentLevel;
    } else if (roomData.level) {
      this.state.currentLevel = roomData.level;
    }

    // Hydrate persistent chat history from PostgreSQL
    if (Array.isArray(roomData.chat_history) && roomData.chat_history.length > 0) {
      this.syncChatHistory(roomData.chat_history);
    }

    // Restore unsubmitted draft if the user was typing before refreshing
    this.restoreDraftResponse();
  }

  async handleOnboardingSubmit() {
    const p1 = this.ui.elements.setupP1Input?.value.trim() || 'Jugador 1';
    const modeRadio = document.querySelector('input[name="gameMode"]:checked');
    const selectedMode = modeRadio?.value === GAME_MODES.ONLINE ? GAME_MODES.ONLINE : GAME_MODES.PRESENCIAL;
    const levelRadio = document.querySelector('input[name="initialLevel"]:checked');
    const initialLevel = Number(levelRadio?.value) || INTENSITY_LEVELS.ICEBREAKER;
    const sessionTypeRadio = document.querySelector('input[name="sessionType"]:checked');
    const isRoomMode = sessionTypeRadio?.value === 'room';

    if (!isRoomMode) {
      const p2 = this.ui.elements.setupP2Input?.value.trim() || 'Jugador 2';
      this.startLocalSession(p1, p2, selectedMode, initialLevel);
      return;
    }

    if (this.ui.elements.onboardingSubmitBtn) {
      this.ui.elements.onboardingSubmitBtn.disabled = true;
      const label = this.ui.elements.onboardingSubmitBtn.querySelector('span:first-child');
      if (label) label.textContent = 'Creando sala...';
    }

    try {
      const startingCard = pickInitialCard(selectedMode, initialLevel, this.savedCustomCards);

      const roomResult = await createGameRoom({
        playerName: p1,
        mode: selectedMode,
        level: initialLevel,
        initialCardId: startingCard.id
      });

      if (!roomResult.success) {
        this.ui.showToast(roomResult.error || 'Error al crear la sala');
        return;
      }

      // Pre-set initial card in PostgreSQL so guest instantly loads the exact same card
      if (roomResult.roomId) {
        updateRoomRecord(roomResult.roomId, {
          current_card_id: startingCard.id
        }, roomResult.hostToken);
      }

      const inviteUrl = `${window.location.origin}${window.location.pathname}?room=${roomResult.code}&key=${roomResult.accessToken}`;
      this.roomSession = {
        role: 'player_one',
        code: roomResult.code,
        accessToken: roomResult.accessToken,
        hostToken: roomResult.hostToken,
        roomId: roomResult.roomId,
        inviteUrl,
        mode: selectedMode,
        level: initialLevel,
        p1Name: p1,
        startingCardId: startingCard.id
      };

      this.ui.showScreen('waiting');
      if (this.ui.elements.waitingRoomCode) {
        this.ui.elements.waitingRoomCode.textContent = roomResult.code;
      }

      this.connectToRealtimeRoom(roomResult.code);
      await this.refreshActiveRooms();
    } catch (err) {
      this.ui.showToast('No se pudo conectar con el servidor.');
      console.error(err);
    } finally {
      if (this.ui.elements.onboardingSubmitBtn) {
        this.ui.elements.onboardingSubmitBtn.disabled = false;
        const label = this.ui.elements.onboardingSubmitBtn.querySelector('span:first-child');
        if (label) label.textContent = 'Crear Sala y Obtener Enlace';
      }
    }
  }

  async handleGuestJoinSubmit() {
    if (!this.pendingInvite) return;
    const guestName = this.ui.elements.guestNameInput?.value.trim() || 'Invitado';

    if (this.ui.elements.guestJoinBtn) {
      this.ui.elements.guestJoinBtn.disabled = true;
      const label = this.ui.elements.guestJoinBtn.querySelector('span:first-child');
      if (label) label.textContent = 'Conectando a la sala...';
    }

    try {
      const joinResult = await joinGameRoom({
        code: this.pendingInvite.roomCode,
        accessToken: this.pendingInvite.accessToken,
        playerName: guestName
      });

      if (!joinResult || !joinResult.success) {
        this.ui.showToast(joinResult?.error || 'No se pudo unir a la sala');
        return;
      }

      try {
        localStorage.setItem(
          getGuestSessionKey(joinResult.code),
          JSON.stringify({
            name: guestName,
            accessToken: this.pendingInvite.accessToken
          })
        );
        localStorage.setItem(STORAGE_KEY_LAST_GUEST_NAME, guestName);
      } catch (e) {
        console.warn('No se pudo guardar sesión de invitado', e);
      }

      this.roomSession = {
        role: 'player_two',
        code: joinResult.code,
        accessToken: this.pendingInvite.accessToken,
        roomId: joinResult.room_id,
        mode: joinResult.mode,
        level: joinResult.level,
        p1Name: joinResult.player_one_name,
        p2Name: guestName
      };

      this.state = createInitialGameState({
        playerOne: joinResult.player_one_name,
        playerTwo: guestName,
        gameMode: joinResult.mode,
        initialLevel: joinResult.level,
        initialCardId: joinResult.current_card_id,
        customCards: this.savedCustomCards
      });

      this.connectToRealtimeRoom(joinResult.code);

      broadcastRoomEvent(this.roomSession.channel, 'PLAYER_JOINED', {
        playerTwoName: guestName,
        currentCardId: this.state.currentCard?.id
      });

      this.ui.showScreen('game');
      this.syncTimerWithCurrentCard();
      this.ui.renderGameStage(this.state, this.roomSession);
      this.ui.showToast(`¡Conectado a la sala con ${joinResult.player_one_name}!`);
    } catch (err) {
      this.ui.showToast('Error al conectarse a la sala');
      console.error(err);
    } finally {
      if (this.ui.elements.guestJoinBtn) {
        this.ui.elements.guestJoinBtn.disabled = false;
        const label = this.ui.elements.guestJoinBtn.querySelector('span:first-child');
        if (label) label.textContent = 'Unirme a la Sala en Vivo';
      }
    }
  }

  connectToRealtimeRoom(roomCode) {
    if (!this.roomSession) return;

    // Connect Decoupled Standalone Chat API with active 1.5s server polling + WebSockets
    const myChatName = this.roomSession.role === 'player_one' ? this.roomSession.p1Name : this.roomSession.p2Name;
    this.chatAPI.connect({
      roomCode,
      senderId: getSessionClientId(),
      authorName: myChatName,
      authorRole: this.roomSession.role,
      onMessage: (msg) => {
        this.handleIncomingChatMessage(msg);
      },
      onInitialHistory: (history) => {
        this.hydrateInitialChat(history);
      },
      onStateSync: (roomState) => {
        this.handleRemoteRoomStateSync(roomState);
      }
    });

    this.roomSession.channel = subscribeToRoomChannel(roomCode, {
      onPlayerJoined: (payload) => {
        if (this.roomSession.role === 'player_one') {
          const p2Name = payload.playerTwoName || 'Tu pareja';
          this.roomSession.p2Name = p2Name;
          const startingId = this.roomSession.startingCardId || payload.currentCardId;

          if (!this.state) {
            this.state = createInitialGameState({
              playerOne: this.roomSession.p1Name,
              playerTwo: p2Name,
              gameMode: this.roomSession.mode,
              initialLevel: this.roomSession.level,
              initialCardId: startingId,
              customCards: this.savedCustomCards
            });

            this.ui.showScreen('game');
            this.syncTimerWithCurrentCard();
            this.ui.renderGameStage(this.state, this.roomSession);
            this.ui.showToast(`¡${p2Name} se ha conectado a la sala!`);
            this.persistLocalSession();

            // Broadcast immediate sync to guarantee guest is on the exact same card
            broadcastRoomEvent(this.roomSession.channel, 'CARD_ACTION', {
              actionType: 'CARD_SYNC',
              currentCardId: this.state.currentCard.id,
              card: this.state.currentCard,
              activePlayerIndex: this.state.activePlayerIndex,
              turnCount: this.state.turnCount,
              chemistryScore: this.state.chemistryScore,
              currentLevel: this.state.currentLevel
            });
          } else {
            // Partner reconnected: gentle toast and confirm current card
            this.ui.showToast(`¡${p2Name} se ha reconectado!`);
            broadcastRoomEvent(this.roomSession.channel, 'CARD_ACTION', {
              actionType: 'CARD_SYNC',
              currentCardId: this.state.currentCard.id,
              card: this.state.currentCard,
              activePlayerIndex: this.state.activePlayerIndex,
              turnCount: this.state.turnCount,
              chemistryScore: this.state.chemistryScore,
              currentLevel: this.state.currentLevel
            });
          }
        }
      },
      onCardAction: (payload) => {
        if (!this.state || !payload) return;
        this.handleRemoteCardAction(payload);
      },
      onCardResponse: (payload) => {
        this.handleIncomingMessage(payload);
      },
      onStateUpdate: (newRecord) => {
        // Lifecycle fallback: detect player 2 initial join if broadcast missed
        if (this.roomSession?.role === 'player_one' && newRecord.player_two_joined && !this.roomSession.p2Name) {
          const p2Name = newRecord.player_two_name || 'Invitado';
          this.roomSession.p2Name = p2Name;
          if (!this.state) {
            this.hydrateAndStartGame(newRecord, p2Name);
            this.ui.showScreen('game');
            this.syncTimerWithCurrentCard();
            this.ui.renderGameStage(this.state, this.roomSession);
          }
        }

        // Card & Turn Synchronization fallback via PostgreSQL Realtime replication
        if (this.state && newRecord.current_card_id && (!this.state.currentCard || this.state.currentCard.id !== newRecord.current_card_id)) {
          this.handleRemoteCardAction({
            actionType: 'CARD_SYNC',
            currentCardId: newRecord.current_card_id,
            activePlayerIndex: typeof newRecord.active_turn === 'number' && newRecord.active_turn >= 1 ? newRecord.active_turn - 1 : this.state.activePlayerIndex,
            chemistryScore: typeof newRecord.chemistry_score === 'number' ? newRecord.chemistry_score : this.state.chemistryScore,
            currentLevel: newRecord.level || this.state.currentLevel
          });
        }

        // Guaranteed delivery fallback: sync persistent messages from PostgreSQL
        if (Array.isArray(newRecord.chat_history) && newRecord.chat_history.length > 0) {
          this.syncChatHistory(newRecord.chat_history);
        }
      }
    });
  }

  hydrateInitialChat(messages) {
    if (!Array.isArray(messages)) return;
    messages.forEach((msg) => {
      if (!msg || !msg.text) return;
      const msgId = msg.id || `msg_${msg.timestamp || Date.now()}`;
      if (this.renderedMessageIds.has(msgId)) return;
      this.renderedMessageIds.add(msgId);

      const isOutgoing = Boolean(msg.senderId && msg.senderId === getSessionClientId());
      this.ui.addChatMessage({
        authorName: msg.authorName || (isOutgoing ? 'Tú' : 'Tu Cita'),
        isOutgoing,
        text: msg.text,
        timeStr: msg.timeStr || '',
        isCardResponse: Boolean(msg.isCardResponse),
        cardPrompt: msg.cardPrompt || ''
      });

      if (!isOutgoing && msg.isCardResponse && (!msg.cardId || msg.cardId === this.state?.currentCard?.id)) {
        this.ui.showResponseDisplay(msg.authorName || 'Tu Cita', msg.text, false);
      }
    });
  }

  /**
   * Processes incoming chat message from ChatRoomAPI (via active polling heartbeat or WebSocket).
   * @param {Object} msg
   */
  /**
   * Handles guaranteed state synchronization received from active server polling heartbeat.
   * Ensures both players stay on the exact same card at all times.
   * @param {Object} roomState
   */
  handleRemoteRoomStateSync(roomState) {
    if (!this.state || !roomState?.current_card_id) return;

    if (this.state.currentCard?.id !== roomState.current_card_id) {
      this.handleRemoteCardAction({
        actionType: 'CARD_SYNC',
        currentCardId: roomState.current_card_id,
        activePlayerIndex: typeof roomState.active_turn === 'number' && roomState.active_turn >= 1 ? roomState.active_turn - 1 : this.state.activePlayerIndex,
        chemistryScore: typeof roomState.chemistry_score === 'number' ? roomState.chemistry_score : this.state.chemistryScore,
        currentLevel: roomState.level || this.state.currentLevel
      });
    }
  }

  handleIncomingChatMessage(msg) {
    if (!msg || !msg.text) return;
    const msgId = msg.id || `msg_${msg.timestamp || Date.now()}`;

    if (this.renderedMessageIds.has(msgId)) return;
    this.renderedMessageIds.add(msgId);

    if (msg.isOutgoing) return;

    // 1. Add bubble to chat thread
    this.ui.addChatMessage({
      authorName: msg.authorName || 'Tu Cita',
      isOutgoing: false,
      text: msg.text,
      timeStr: msg.timeStr || '',
      isCardResponse: Boolean(msg.isCardResponse),
      cardPrompt: msg.cardPrompt || ''
    });

    // 2. Discrete toast notification (WITHOUT forcing the modal open on the partner)
    this.ui.showToast(`💬 ${msg.authorName || 'Tu Cita'}: ${msg.text.slice(0, 32)}...`);

    // 3. Update affinity score if present
    if (typeof msg.chemistryScore === 'number' && this.state) {
      this.state.chemistryScore = clampNumber(msg.chemistryScore, 0, 100);
      this.ui.renderChemistry(this.state.chemistryScore);
    }
  }

  syncRoomState(actionType) {
    if (!this.roomSession || !this.state) return;

    const payload = {
      actionType,
      activePlayerIndex: this.state.activePlayerIndex,
      turnCount: this.state.turnCount,
      chemistryScore: this.state.chemistryScore,
      currentLevel: this.state.currentLevel,
      currentCardId: this.state.currentCard?.id,
      card: this.state.currentCard
    };

    // 1. Instant sub-second Peer-to-Peer synchronization via WebSocket (if channel is ready)
    if (this.roomSession.channel) {
      broadcastRoomEvent(this.roomSession.channel, 'CARD_ACTION', payload);
    }

    // 2. Direct checkpoint to PostgreSQL for guaranteed delivery
    if (this.roomSession.roomId) {
      updateRoomRecord(this.roomSession.roomId, {
        active_turn: this.state.activePlayerIndex + 1,
        chemistry_score: this.state.chemistryScore,
        current_card_id: this.state.currentCard?.id,
        level: this.state.currentLevel
      });
    }
  }

  /**
   * Persists the active game state snapshot in sessionStorage for seamless refresh resilience.
   */
  persistLocalSession() {
    if (!this.state || !this.roomSession?.code) return;
    try {
      const snapshot = {
        activePlayerIndex: this.state.activePlayerIndex,
        turnCount: this.state.turnCount,
        chemistryScore: this.state.chemistryScore,
        currentLevel: this.state.currentLevel,
        currentCardId: this.state.currentCard?.id,
        savedAt: Date.now()
      };
      sessionStorage.setItem(`chemblind_session_${this.roomSession.code}`, JSON.stringify(snapshot));
    } catch (e) {
      // Storage unavailable or disabled
    }
  }

  /**
   * Retrieves any cached session snapshot from sessionStorage for this room.
   * @param {string} roomCode
   * @returns {Object|null}
   */
  restoreLocalSessionSnapshot(roomCode) {
    if (!roomCode) return null;
    try {
      const raw = sessionStorage.getItem(`chemblind_session_${roomCode}`);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  /**
   * Autosaves unsubmitted response draft text in sessionStorage.
   * @param {string} text
   */
  saveDraftResponse(text) {
    if (!this.roomSession?.code) return;
    try {
      if (text) {
        sessionStorage.setItem(`chemblind_draft_${this.roomSession.code}`, text);
      } else {
        sessionStorage.removeItem(`chemblind_draft_${this.roomSession.code}`);
      }
    } catch (e) {}
  }

  /**
   * Restores unsubmitted draft text into the card textarea upon page reload.
   */
  restoreDraftResponse() {
    if (!this.roomSession?.code) return;
    try {
      const draft = sessionStorage.getItem(`chemblind_draft_${this.roomSession.code}`);
      if (draft && this.ui.elements.cardResponseInput) {
        this.ui.showResponseInput(draft);
      }
    } catch (e) {}
  }

  /**
   * Clears unsubmitted draft after response has been submitted or card changed.
   */
  clearDraftResponse() {
    if (!this.roomSession?.code) return;
    try {
      sessionStorage.removeItem(`chemblind_draft_${this.roomSession.code}`);
    } catch (e) {}
  }

  handleRemoteCardAction(payload) {
    if (!payload.currentCardId) return;

    // Guard: if it's already the exact same card, update state without re-animating or wiping drafts
    const isSameCard = this.state?.currentCard?.id === payload.currentCardId;

    const allCards = [...this.state.customCards, ...DEFAULT_CARDS];
    let targetCard = allCards.find((c) => c.id === payload.currentCardId);

    if (!targetCard && payload.card) {
      targetCard = payload.card;
      if (!this.state.customCards.some((c) => c.id === targetCard.id)) {
        this.state.customCards = [targetCard, ...this.state.customCards];
      }
    }

    if (!targetCard) {
      console.warn('[ChemBlind] Carta no encontrada en baraja:', payload.currentCardId);
      return;
    }

    this.state = {
      ...this.state,
      activePlayerIndex: payload.activePlayerIndex ?? this.state.activePlayerIndex,
      turnCount: Math.max(this.state.turnCount, payload.turnCount || 0),
      chemistryScore: payload.chemistryScore ?? this.state.chemistryScore,
      currentLevel: payload.currentLevel || this.state.currentLevel,
      currentCard: targetCard
    };

    this.persistLocalSession();

    if (isSameCard) {
      // Do NOT interrupt the partner's typing or stop their timer if the card hasn't actually changed
      this.ui.renderGameStage(this.state, this.roomSession);
      return;
    }

    // New card arrived from partner: animate and advance
    this.ui.resetResponseSection();
    this.clearDraftResponse();

    this.ui.animateCardTransition(() => {
      this.syncTimerWithCurrentCard();
      this.ui.renderGameStage(this.state, this.roomSession);
    });
  }

  /**
   * Handles in-app submission of a card response.
   */
  async handleSendResponse() {
    if (!this.state || !this.state.currentCard) return;

    const inputEl = this.ui.elements.cardResponseInput;
    const text = inputEl ? inputEl.value.trim() : '';

    if (!text) {
      this.ui.showToast('Escribe tu respuesta antes de enviar');
      inputEl?.focus();
      return;
    }

    let authorName = 'Tú';
    if (this.roomSession) {
      authorName = this.roomSession.role === 'player_one'
        ? (this.roomSession.p1Name || 'Anfitrión')
        : (this.roomSession.p2Name || 'Invitado');
    }

    // 1. Display locally on the card with edit permission
    this.ui.showResponseDisplay(authorName, text, true);
    this.clearDraftResponse();
    this.persistLocalSession();

    // 2. Open chat modal
    this.ui.setChatModalOpen(true);

    // 3. Chemistry affinity bonus (+3%)
    const newScore = Math.min(100, (this.state.chemistryScore || 0) + 3);
    this.state.chemistryScore = newScore;
    this.ui.renderChemistry(newScore);

    // 4. Send atomically via Standalone Chat API
    if (this.roomSession && this.chatAPI) {
      const cardPrompt = this.ui.elements.cardPromptText?.textContent || '';
      const sent = await this.chatAPI.sendMessage(text, {
        isCardResponse: true,
        cardId: this.state.currentCard.id,
        cardPrompt,
        chemistryScore: newScore
      });

      if (sent) {
        this.renderedMessageIds.add(sent.id);
        this.ui.addChatMessage({
          ...sent,
          isOutgoing: true,
          isCardResponse: true,
          cardPrompt
        });
      }

      this.syncRoomState('CARD_RESPONSE');
      this.ui.showToast('¡Respuesta enviada a tu cita!');
    } else {
      this.ui.addChatMessage({
        authorName,
        isOutgoing: true,
        text,
        timeStr: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isCardResponse: true,
        cardPrompt
      });
      this.ui.showToast('¡Respuesta guardada en la conversación!');
    }
  }

  /**
   * Handles sending a direct chat message from the conversation modal using ChatRoomAPI.
   */
  async handleSendChatMessage() {
    const inputEl = this.ui.elements.chatModalInput;
    const text = inputEl ? inputEl.value.trim() : '';
    if (!text) return;

    if (inputEl) {
      inputEl.value = '';
    }

    const activePrompt = this.ui.elements.cardPromptText?.textContent || '';
    if (this.roomSession && this.chatAPI) {
      const sent = await this.chatAPI.sendMessage(text, {
        isCardResponse: false,
        cardPrompt: activePrompt
      });
      if (sent) {
        this.renderedMessageIds.add(sent.id);
        this.ui.addChatMessage({
          ...sent,
          isOutgoing: true,
          cardPrompt: activePrompt
        });
      }
    } else {
      const activePlayer = this.state?.players[this.state.activePlayerIndex];
      this.ui.addChatMessage({
        authorName: activePlayer?.name || 'Tú',
        isOutgoing: true,
        text,
        timeStr: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isCardResponse: false,
        cardPrompt: activePrompt
      });
    }
  }

  teardownRoomSession() {
    this.chatAPI?.disconnect();
    if (this.roomSession?.code) {
      try {
        sessionStorage.removeItem(`chemblind_session_${this.roomSession.code}`);
        sessionStorage.removeItem(`chemblind_draft_${this.roomSession.code}`);
      } catch (e) {}
    }
    if (this.roomSession?.channel) {
      try {
        this.roomSession.channel.unsubscribe();
      } catch (e) {
        console.warn('Error cerrando canal:', e);
      }
    }
    this.roomSession = null;
    this.renderedMessageIds.clear();
    this.ui.clearChatMessages();
    this.refreshActiveRooms();
  }

  async refreshActiveRooms() {
    if (this.pendingInvite || this.roomSession?.role === 'player_two') {
      this.ui.elements.viewRoomsBtn?.classList.add('is-hidden');
      this.ui.elements.activeRoomsBanner?.classList.add('is-hidden');
      return;
    }

    try {
      this.activeRoomsList = await fetchClientActiveRooms();
      const count = this.activeRoomsList.length;
      const isRoomSelected = document.querySelector('input[name="sessionType"]:checked')?.value === 'room';
      this.ui.updateActiveRoomsCount(count, isRoomSelected);
    } catch (err) {
      console.warn('Error actualizando salas activas:', err);
    }
  }

  async openActiveRoomsModal() {
    if (this.pendingInvite) return;
    await this.refreshActiveRooms();

    this.ui.renderActiveRooms(
      this.activeRoomsList,
      this.roomSession?.code,
      (room) => this.switchToRoom(room),
      (room) => {
        const inviteUrl = `${window.location.origin}${window.location.pathname}?room=${room.code}&key=${room.access_token}`;
        navigator.clipboard.writeText(inviteUrl);
        this.ui.showToast(`Enlace de sala ${room.code} copiado`);
      },
      async (room) => {
        await this.handleCloseRoom(room);
      }
    );

    this.ui.setRoomsModalOpen(true);
  }

  async handleCloseRoom(room) {
    const res = await closeGameRoom(room.code, room.host_token);
    if (res.success) {
      if (this.roomSession?.code === room.code) {
        this.teardownRoomSession();
        this.ui.showScreen('onboarding');
      }
      this.ui.showToast(`Sala ${room.code} cerrada. Espacio liberado.`);
      await this.openActiveRoomsModal();
    } else {
      this.ui.showToast(res.error || 'No se pudo cerrar la sala');
    }
  }

  switchToRoom(room) {
    this.teardownRoomSession();
    this.ui.setRoomsModalOpen(false);

    const inviteUrl = `${window.location.origin}${window.location.pathname}?room=${room.code}&key=${room.access_token}`;
    this.roomSession = {
      role: 'player_one',
      code: room.code,
      accessToken: room.access_token,
      hostToken: room.host_token,
      roomId: room.id,
      inviteUrl,
      mode: room.mode,
      level: room.level,
      p1Name: room.player_one_name,
      p2Name: room.player_two_name
    };

    if (!room.player_two_joined) {
      this.ui.showScreen('waiting');
      if (this.ui.elements.waitingRoomCode) {
        this.ui.elements.waitingRoomCode.textContent = room.code;
      }
      this.connectToRealtimeRoom(room.code);
      this.ui.showToast(`Cambiado a sala ${room.code} (esperando a tu cita)`);
    } else {
      const p2Name = room.player_two_name || 'Invitado';
      this.hydrateAndStartGame(room, p2Name);
      this.ui.showScreen('game');
      this.connectToRealtimeRoom(room.code);
      this.syncTimerWithCurrentCard();
      this.ui.renderGameStage(this.state, this.roomSession);
      this.ui.showToast(`Cambiado a sala ${room.code} con ${p2Name}`);
    }

    window.history.replaceState({}, document.title, `${window.location.pathname}?room=${room.code}&key=${room.access_token}`);
  }

  startLocalSession(playerOne, playerTwo, gameMode, initialLevel) {
    this.teardownRoomSession();
    this.ui.resetResponseSection();
    this.state = createInitialGameState({
      playerOne,
      playerTwo,
      gameMode,
      initialLevel,
      customCards: this.savedCustomCards
    });

    this.ui.showScreen('game');
    this.syncTimerWithCurrentCard();
    this.ui.renderGameStage(this.state, this.roomSession);
  }

  syncTimerWithCurrentCard() {
    this.chrono.stop();
    const cardTimer = this.state?.currentCard?.timerSeconds || 0;
    if (cardTimer > 0) {
      this.ui.setTimerBoxVisible(true);
      this.chrono.reset(cardTimer);
    } else {
      this.ui.setTimerBoxVisible(false);
    }
  }

  handleCreateCustomCard() {
    if (!this.state) return;
    const rawText = this.ui.elements.customPromptInput?.value || '';
    const level = Number(this.ui.elements.customLevelSelect?.value) || this.state.currentLevel;
    const timerSeconds = Number(this.ui.elements.customTimerSelect?.value) || 0;
    const category = timerSeconds > 0 ? 'challenge' : 'question';

    try {
      const result = addCustomCardToState(
        this.state,
        { text: rawText, level, category, timerSeconds },
        true
      );
      this.state = result.state;
      this.saveCustomCardsToStorage();

      if (this.ui.elements.customPromptInput) {
        this.ui.elements.customPromptInput.value = '';
      }
      this.ui.setCustomCardModalOpen(false);

      this.syncRoomState('CUSTOM_CARD_PLAYED');
      this.ui.animateCardTransition(() => {
        this.syncTimerWithCurrentCard();
        this.ui.renderGameStage(this.state, this.roomSession);
      });
      this.ui.showToast('Tu carta personalizada está en juego');
    } catch (error) {
      this.ui.showToast(error.message || 'Escribe al menos 8 caracteres');
    }
  }
}

// Bootstrap Application on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new ChemBlindAppController();
  app.init().catch((err) => {
    console.error('[ChemBlind] Error inicializando aplicación:', err);
  });
});
