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
  clampNumber
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
  getDeviceId
} from './supabase-client.js';

import { ChronographService } from './chronograph.js';
import { UIManager } from './ui-manager.js';

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

    // Initialize decoupled UI & Timing subsystems
    this.ui = new UIManager();
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
      const message = `✨ Te invito a jugar a *ChemBlind* (Química para dos):\n\nEntra aquí para conectarte a mi sala: ${this.roomSession.inviteUrl}`;
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
    });

    el.cancelRoomBtn?.addEventListener('click', () => {
      this.teardownRoomSession();
      this.ui.showScreen('onboarding');
    });

    // Change Players (Back to Setup)
    el.changePlayersBtn?.addEventListener('click', () => {
      this.teardownRoomSession();
      this.chrono.stop();
      this.ui.showScreen('onboarding');
      window.history.replaceState({}, document.title, window.location.pathname);
    });

    // Intensity Level Tabs
    el.levelTabs.forEach((btn) => {
      btn.addEventListener('click', () => {
        if (!this.state) return;
        const targetLevel = Number(btn.getAttribute('data-level-btn'));
        if (targetLevel === this.state.currentLevel) return;

        this.chrono.stop();
        this.ui.resetResponseSection();
        this.state = setIntensityLevel(this.state, targetLevel);
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
      this.state = completeCurrentTurn(this.state);
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
      this.state = result.state;
      this.syncRoomState('WILDCARD_SKIP');
      this.ui.animateCardTransition(() => {
        this.syncTimerWithCurrentCard();
        this.ui.renderGameStage(this.state, this.roomSession);
      });
      this.ui.showToast('Carta saltada con comodín');
    });

    // Card Response: Live Character Counter
    el.cardResponseInput?.addEventListener('input', (e) => {
      this.ui.updateResponseCharCount(e.target.value.length);
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

    // Partner Response Modal Actions
    el.closeResponseModalBtn?.addEventListener('click', () => {
      this.ui.setPartnerResponseModalOpen(false);
    });

    el.ackResponseModalBtn?.addEventListener('click', () => {
      this.ui.setPartnerResponseModalOpen(false);
    });

    el.partnerResponseModal?.addEventListener('click', (e) => {
      if (e.target === el.partnerResponseModal) {
        this.ui.setPartnerResponseModalOpen(false);
      }
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
      p2Name: roomData.player_two_name
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
    this.state = createInitialGameState({
      playerOne: roomData.player_one_name,
      playerTwo: guestName,
      gameMode: roomData.mode,
      initialLevel: roomData.level || 1,
      customCards: this.savedCustomCards
    });

    if (roomData.current_card_id) {
      const allCards = [...this.savedCustomCards, ...DEFAULT_CARDS];
      const foundCard = allCards.find((c) => c.id === roomData.current_card_id);
      if (foundCard) {
        this.state.currentCard = foundCard;
      }
    }

    if (typeof roomData.active_turn === 'number' && roomData.active_turn >= 1) {
      this.state.activePlayerIndex = roomData.active_turn - 1;
    }

    if (typeof roomData.chemistry_score === 'number') {
      this.state.chemistryScore = clampNumber(roomData.chemistry_score, 0, 100);
    }

    if (roomData.level) {
      this.state.currentLevel = roomData.level;
    }
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
      const roomResult = await createGameRoom({
        playerName: p1,
        mode: selectedMode,
        level: initialLevel
      });

      if (!roomResult.success) {
        this.ui.showToast(roomResult.error || 'Error al crear la sala');
        return;
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
        p1Name: p1
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
        customCards: this.savedCustomCards
      });

      this.connectToRealtimeRoom(joinResult.code);

      broadcastRoomEvent(this.roomSession.channel, 'PLAYER_JOINED', {
        playerTwoName: guestName
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

    this.roomSession.channel = subscribeToRoomChannel(roomCode, {
      onPlayerJoined: (payload) => {
        if (this.roomSession.role === 'player_one') {
          const p2Name = payload.playerTwoName || 'Tu pareja';
          this.roomSession.p2Name = p2Name;

          if (!this.state) {
            this.state = createInitialGameState({
              playerOne: this.roomSession.p1Name,
              playerTwo: p2Name,
              gameMode: this.roomSession.mode,
              initialLevel: this.roomSession.level,
              customCards: this.savedCustomCards
            });

            this.ui.showScreen('game');
            this.syncTimerWithCurrentCard();
            this.ui.renderGameStage(this.state, this.roomSession);
            this.ui.showToast(`¡${p2Name} se ha conectado a la sala!`);
          } else {
            this.ui.showToast(`¡${p2Name} se ha reconectado a la sala!`);
            this.syncRoomState('SYNC_REFRESH');
          }
        }
      },
      onCardAction: (payload) => {
        if (!this.state || !payload) return;
        // Anti-Split-Brain: discard stale packets with older turn counts
        if (payload.turnCount && payload.turnCount < this.state.turnCount) {
          return;
        }
        this.handleRemoteCardAction(payload);
      },
      onCardResponse: (payload) => {
        if (!payload || !payload.text) return;
        // Don't re-render if it's our own broadcast
        if (payload.authorRole && payload.authorRole === this.roomSession?.role) return;

        // 1. Update the inline card display
        this.ui.showResponseDisplay(payload.authorName || 'Tu pareja', payload.text, false);

        // 2. Open dedicated intimate modal with partner's answer
        const promptContext = payload.cardPrompt || this.ui.elements.cardPromptText?.textContent || '';
        this.ui.setPartnerResponseModalOpen(true, {
          authorName: payload.authorName || 'Tu pareja',
          text: payload.text,
          cardPrompt: promptContext
        });

        // 3. Affinity score & toast
        if (typeof payload.chemistryScore === 'number' && this.state) {
          this.state.chemistryScore = payload.chemistryScore;
          this.ui.renderChemistry(payload.chemistryScore);
        }
        this.ui.showToast(`¡${payload.authorName || 'Tu pareja'} ha respondido a la carta! ✦`);
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
      }
    });
  }

  syncRoomState(actionType) {
    if (!this.roomSession?.channel || !this.state) return;

    const payload = {
      actionType,
      activePlayerIndex: this.state.activePlayerIndex,
      turnCount: this.state.turnCount,
      chemistryScore: this.state.chemistryScore,
      currentLevel: this.state.currentLevel,
      currentCardId: this.state.currentCard?.id
    };

    // 1. Instant sub-second Peer-to-Peer synchronization via WebSocket
    broadcastRoomEvent(this.roomSession.channel, 'CARD_ACTION', payload);

    // 2. Debounced background checkpoint to PostgreSQL (eliminates write amplification)
    if (this.roomSession.roomId) {
      updateRoomRecord(this.roomSession.roomId, {
        active_turn: this.state.activePlayerIndex + 1,
        chemistry_score: this.state.chemistryScore,
        current_card_id: this.state.currentCard?.id,
        level: this.state.currentLevel
      });
    }
  }

  handleRemoteCardAction(payload) {
    if (!payload.currentCardId) return;

    this.ui.resetResponseSection();

    const allCards = [...this.state.customCards, ...DEFAULT_CARDS];
    const targetCard = allCards.find((c) => c.id === payload.currentCardId);

    this.state = {
      ...this.state,
      activePlayerIndex: payload.activePlayerIndex,
      turnCount: Math.max(this.state.turnCount, payload.turnCount || 0),
      chemistryScore: payload.chemistryScore ?? this.state.chemistryScore,
      currentLevel: payload.currentLevel || this.state.currentLevel,
      currentCard: targetCard || this.state.currentCard
    };

    this.ui.animateCardTransition(() => {
      this.syncTimerWithCurrentCard();
      this.ui.renderGameStage(this.state, this.roomSession);
    });
  }

  /**
   * Handles in-app submission of a card response.
   */
  handleSendResponse() {
    if (!this.state || !this.state.currentCard) return;

    const inputEl = this.ui.elements.cardResponseInput;
    const text = inputEl ? inputEl.value.trim() : '';

    if (!text) {
      this.ui.showToast('Escribe tu respuesta antes de enviar');
      inputEl?.focus();
      return;
    }

    // Determine author name based on session role or local active player
    let authorName = 'Tú';
    let authorRole = 'local';

    if (this.roomSession) {
      authorRole = this.roomSession.role;
      if (this.roomSession.role === 'player_one') {
        authorName = this.roomSession.p1Name || 'Anfitrión';
      } else {
        authorName = this.roomSession.p2Name || 'Invitado';
      }
    } else {
      const activePlayer = this.state.players[this.state.activePlayerIndex];
      authorName = activePlayer?.name || 'Jugador';
    }

    // Display locally with edit permission
    this.ui.showResponseDisplay(authorName, text, true);

    // Chemistry affinity bonus (+3%)
    const newScore = Math.min(100, (this.state.chemistryScore || 0) + 3);
    this.state.chemistryScore = newScore;
    this.ui.renderChemistry(newScore);

    // Broadcast in 2-phone room session
    if (this.roomSession?.channel) {
      const cardPrompt = this.ui.elements.cardPromptText?.textContent || '';
      broadcastRoomEvent(this.roomSession.channel, 'CARD_RESPONSE', {
        cardId: this.state.currentCard.id,
        cardPrompt,
        authorName,
        authorRole,
        text,
        chemistryScore: newScore,
        timestamp: Date.now()
      });

      this.syncRoomState('CARD_RESPONSE');
      this.ui.showToast('¡Respuesta enviada a tu cita! ✦');
    } else {
      this.ui.showToast('¡Respuesta guardada! ✦');
    }
  }

  teardownRoomSession() {
    if (this.roomSession?.channel) {
      try {
        this.roomSession.channel.unsubscribe();
      } catch (e) {
        console.warn('Error cerrando canal:', e);
      }
    }
    this.roomSession = null;
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
    if (this.pendingInvite || this.roomSession?.role === 'player_two') return;
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
