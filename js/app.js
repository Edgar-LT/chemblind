/**
 * @file app.js
 * @description Clean, minimal UI controller for "CHEMBLIND — Chemistry Unfiltered".
 * Supports both local shared device mode and Supabase Realtime multi-device rooms.
 */

import {
  GAME_MODES,
  MODE_METADATA,
  INTENSITY_LEVELS,
  LEVEL_METADATA,
  CATEGORY_LABELS,
  DEFAULT_CARDS,
  createInitialGameState,
  formatCardPrompt,
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

const STORAGE_KEY_CUSTOM_CARDS = 'chemblind_custom_cards_v1';
const STORAGE_KEY_THEME = 'chemblind_theme_v1';
const STORAGE_KEY_LAST_GUEST_NAME = 'chemblind_last_guest_name_v1';
const getGuestSessionKey = (code) => `chemblind_guest_session_${code}`;

class ChemBlindAppController {
  constructor() {
    this.state = null;
    this.savedCustomCards = [];
    this.roomSession = null; // { role: 'player_one' | 'player_two', code, accessToken, roomId, channel }
    this.timerState = {
      durationSec: 0,
      remainingSec: 0,
      isRunning: false,
      rafId: null,
      lastTimestamp: 0
    };
    this.toastTimeoutId = null;
    this.elements = {};
  }

  async init() {
    this.cacheElements();
    this.loadStoredPreferences();
    this.bindEvents();
    await this.refreshActiveRooms();
    await this.checkUrlInvitation();
  }

  cacheElements() {
    const byId = (id) => document.getElementById(id);
    this.elements = {
      // Top Navigation
      changePlayersBtn: byId('change-players-btn'),
      navPlayersLabel: byId('nav-players-label'),
      navModeBadge: byId('nav-mode-badge'),
      viewRoomsBtn: byId('view-rooms-btn'),
      activeRoomsCountLabel: byId('active-rooms-count-label'),
      openCustomModalBtn: byId('open-custom-modal-btn'),
      themeToggleBtn: byId('theme-toggle-btn'),
      themeLabel: byId('theme-label'),

      // View 1: Onboarding Setup Screen
      onboardingScreen: byId('onboarding-screen'),
      onboardingSubtitle: byId('onboarding-subtitle'),
      onboardingForm: byId('onboarding-form'),
      onboardingSubmitBtn: byId('onboarding-submit-btn'),
      setupP1Input: byId('setup-p1-input'),
      setupP2Container: byId('setup-p2-container'),
      setupP2Input: byId('setup-p2-input'),
      sessionTypeRadios: document.querySelectorAll('input[name="sessionType"]'),
      activeRoomsBanner: byId('active-rooms-banner'),
      activeRoomsBannerText: byId('active-rooms-banner-text'),
      bannerViewRoomsBtn: byId('banner-view-rooms-btn'),

      // Modal: Mis Salas Activas
      activeRoomsModal: byId('active-rooms-modal'),
      closeRoomsModalBtn: byId('close-rooms-modal-btn'),
      closeRoomsModalBtn2: byId('close-rooms-modal-btn-2'),
      activeRoomsList: byId('active-rooms-list'),

      // Guest Join Form (active if opened via invite link)
      guestJoinForm: byId('guest-join-form'),
      guestInviteRoomCode: byId('guest-invite-room-code'),
      guestInviteDetails: byId('guest-invite-details'),
      guestNameInput: byId('guest-name-input'),
      guestJoinBtn: byId('guest-join-btn'),

      // View 1.5: Room Waiting / Share Screen
      roomWaitingScreen: byId('room-waiting-screen'),
      waitingRoomCode: byId('waiting-room-code'),
      waitingRoomStatus: byId('waiting-room-status'),
      copyRoomLinkBtn: byId('copy-room-link-btn'),
      whatsappRoomLinkBtn: byId('whatsapp-room-link-btn'),
      cancelRoomBtn: byId('cancel-room-btn'),

      // View 2: Focused Game Stage
      gameScreen: byId('game-screen'),
      levelTabs: document.querySelectorAll('[data-level-btn]'),
      chemistryBarFill: byId('chemistry-bar-fill'),
      chemistryPercentage: byId('chemistry-percentage'),

      // Playing Card Elements
      stageCardWrapper: byId('stage-card-wrapper'),
      turnBadgeText: byId('turn-badge-text'),
      targetPlayerLabel: byId('target-player-label'),
      cardCategoryBadge: byId('card-category-badge'),
      cardPromptText: byId('card-prompt-text'),
      cardPromptHint: byId('card-prompt-hint'),

      // Inline Timer
      inlineTimerBox: byId('inline-timer-box'),
      chronoSecondsReadout: byId('chrono-seconds-readout'),
      chronoToggleBtn: byId('chrono-toggle-btn'),
      chronoResetBtn: byId('chrono-reset-btn'),

      // Card Footer Actions
      completeTurnBtn: byId('complete-turn-btn'),
      wildcardSkipBtn: byId('wildcard-skip-btn'),
      wildcardBtnCount: byId('wildcard-btn-count'),
      shareWhatsappBtn: byId('share-whatsapp-btn'),
      shareBtnLabel: byId('share-btn-label'),

      // Custom Card Modal
      customCardModal: byId('custom-card-modal'),
      closeCustomModalBtn: byId('close-custom-modal-btn'),
      customCardForm: byId('custom-card-form'),
      customPromptInput: byId('custom-prompt-input'),
      customLevelSelect: byId('custom-level-select'),
      customTimerSelect: byId('custom-timer-select'),

      // Toast
      toastEl: byId('toast-notification')
    };
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
        this.applyTheme(savedTheme);
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

  applyTheme(theme) {
    if (theme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
      if (this.elements.themeLabel) {
        this.elements.themeLabel.textContent = 'Obsidiana';
      }
    } else {
      document.documentElement.removeAttribute('data-theme');
      if (this.elements.themeLabel) {
        this.elements.themeLabel.textContent = 'Marfil';
      }
    }
    try {
      localStorage.setItem(STORAGE_KEY_THEME, theme);
    } catch (err) {
      console.warn('No se pudo guardar el tema:', err);
    }
  }

  bindEvents() {
    // Theme toggle
    this.elements.themeToggleBtn?.addEventListener('click', () => {
      const isLight = document.documentElement.getAttribute('data-theme') === 'light';
      this.applyTheme(isLight ? 'dark' : 'light');
    });

    // Session Type Change (1 Phone vs 2 Phones Room)
    this.elements.sessionTypeRadios.forEach((radio) => {
      radio.addEventListener('change', () => {
        const isRoom = radio.value === 'room';
        if (this.elements.setupP2Container) {
          this.elements.setupP2Container.style.display = isRoom ? 'none' : 'flex';
          if (this.elements.setupP2Input) {
            this.elements.setupP2Input.required = !isRoom;
          }
        }
        if (this.elements.onboardingSubmitBtn) {
          this.elements.onboardingSubmitBtn.querySelector('span:first-child').textContent = isRoom
            ? 'Crear Sala y Obtener Enlace'
            : 'Comenzar a Jugar';
        }
      });
    });

    // Onboarding Form Submit
    this.elements.onboardingForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleOnboardingSubmit();
    });

    // Guest Join Form Submit
    this.elements.guestJoinForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleGuestJoinSubmit();
    });

    // View & Switch Active Rooms Modal
    this.elements.viewRoomsBtn?.addEventListener('click', () => {
      this.openActiveRoomsModal();
    });

    this.elements.bannerViewRoomsBtn?.addEventListener('click', () => {
      this.openActiveRoomsModal();
    });

    this.elements.closeRoomsModalBtn?.addEventListener('click', () => {
      this.closeActiveRoomsModal();
    });

    this.elements.closeRoomsModalBtn2?.addEventListener('click', () => {
      this.closeActiveRoomsModal();
    });

    this.elements.activeRoomsModal?.addEventListener('click', (e) => {
      if (e.target === this.elements.activeRoomsModal) {
        this.closeActiveRoomsModal();
      }
    });

    // Room Share Actions
    this.elements.copyRoomLinkBtn?.addEventListener('click', () => {
      if (!this.roomSession?.inviteUrl) return;
      navigator.clipboard.writeText(this.roomSession.inviteUrl);
      this.showToast('Enlace de invitación copiado al portapapeles');
    });

    this.elements.whatsappRoomLinkBtn?.addEventListener('click', () => {
      if (!this.roomSession?.inviteUrl) return;
      const message = `✨ Te invito a jugar a *ChemBlind* (Química para dos):\n\nEntra aquí para conectarte a mi sala: ${this.roomSession.inviteUrl}`;
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
    });

    this.elements.cancelRoomBtn?.addEventListener('click', () => {
      this.teardownRoomSession();
      this.elements.roomWaitingScreen?.classList.add('is-hidden');
      this.elements.onboardingScreen?.classList.remove('is-hidden');
    });

    // Back to setup from game
    this.elements.changePlayersBtn?.addEventListener('click', () => {
      this.teardownRoomSession();
      this.stopChronograph();
      this.elements.gameScreen?.classList.add('is-hidden');
      this.elements.changePlayersBtn?.classList.add('is-hidden');
      this.elements.openCustomModalBtn?.classList.add('is-hidden');
      this.elements.onboardingScreen?.classList.remove('is-hidden');
      window.history.replaceState({}, document.title, window.location.pathname);
    });

    // Level selector tabs
    this.elements.levelTabs.forEach((btn) => {
      btn.addEventListener('click', () => {
        if (!this.state) return;
        const targetLevel = Number(btn.getAttribute('data-level-btn'));
        if (targetLevel === this.state.currentLevel) return;

        this.stopChronograph();
        this.state = setIntensityLevel(this.state, targetLevel);
        this.syncRoomState('LEVEL_CHANGED');
        this.animateCardTransition(() => {
          this.syncTimerWithCurrentCard();
          this.renderGameStage();
        });
      });
    });

    // Complete Turn -> Next Card
    this.elements.completeTurnBtn?.addEventListener('click', () => {
      if (!this.state) return;
      this.stopChronograph();
      this.state = completeCurrentTurn(this.state);
      this.syncRoomState('NEXT_CARD');
      this.animateCardTransition(() => {
        this.syncTimerWithCurrentCard();
        this.renderGameStage();
      });
    });

    // Wildcard Skip
    this.elements.wildcardSkipBtn?.addEventListener('click', () => {
      if (!this.state) return;
      const result = useWildcardSkip(this.state);
      if (!result.used) {
        this.showToast(result.reason || 'Ya no te quedan comodines');
        return;
      }
      this.stopChronograph();
      this.state = result.state;
      this.syncRoomState('WILDCARD_SKIP');
      this.animateCardTransition(() => {
        this.syncTimerWithCurrentCard();
        this.renderGameStage();
      });
      this.showToast('Carta saltada con comodín');
    });

    // Share via WhatsApp
    this.elements.shareWhatsappBtn?.addEventListener('click', () => {
      if (!this.state) return;
      const formattedText = this.getActiveFormattedPrompt();
      const levelMeta = LEVEL_METADATA[this.state.currentLevel];
      const shareMessage = `✨ *CHEMBLIND* (${levelMeta.name})\n\n"${formattedText}"`;
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    });

    // Inline Timer controls
    this.elements.chronoToggleBtn?.addEventListener('click', () => {
      if (this.timerState.isRunning) {
        this.stopChronograph();
      } else {
        this.startChronograph();
      }
    });

    this.elements.chronoResetBtn?.addEventListener('click', () => {
      this.resetChronograph(this.timerState.durationSec);
    });

    // Custom Card Modal
    this.elements.openCustomModalBtn?.addEventListener('click', () => {
      if (this.state && this.elements.customLevelSelect) {
        this.elements.customLevelSelect.value = String(this.state.currentLevel);
      }
      this.elements.customCardModal?.classList.add('is-open');
      this.elements.customPromptInput?.focus();
    });

    this.elements.closeCustomModalBtn?.addEventListener('click', () => {
      this.elements.customCardModal?.classList.remove('is-open');
    });

    this.elements.customCardModal?.addEventListener('click', (e) => {
      if (e.target === this.elements.customCardModal) {
        this.elements.customCardModal.classList.remove('is-open');
      }
    });

    this.elements.customCardForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleCreateCustomCard();
    });
  }

  /* ==========================================================================
     Multiplayer Room Logic (Supabase Realtime)
     ========================================================================== */

  async checkUrlInvitation() {
    try {
      const params = new URLSearchParams(window.location.search);
      const roomCode = params.get('room');
      const accessToken = params.get('key');

      if (!roomCode || !accessToken) return;

      const roomData = await fetchRoomData(roomCode, accessToken);
      if (!roomData) {
        this.showToast('Esta sala ha expirado o el enlace no es válido.');
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
      console.warn('Error verifying room invitation:', err);
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

    this.elements.onboardingScreen?.classList.add('is-hidden');

    if (!roomData.player_two_joined) {
      this.elements.gameScreen?.classList.add('is-hidden');
      this.elements.roomWaitingScreen?.classList.remove('is-hidden');
      if (this.elements.waitingRoomCode) {
        this.elements.waitingRoomCode.textContent = roomData.code;
      }
      this.connectToRealtimeRoom(roomData.code);
      this.showToast(`Sala ${roomData.code} activa. Esperando a tu cita.`);
    } else {
      const p2Name = roomData.player_two_name || 'Invitado';
      this.hydrateAndStartGame(roomData, p2Name);
      this.elements.roomWaitingScreen?.classList.add('is-hidden');
      this.elements.gameScreen?.classList.remove('is-hidden');
      this.elements.changePlayersBtn?.classList.remove('is-hidden');
      this.elements.openCustomModalBtn?.classList.remove('is-hidden');

      this.connectToRealtimeRoom(roomData.code);
      this.syncTimerWithCurrentCard();
      this.renderGameStage();
      this.showToast(`Reconectado a sala ${roomData.code} con ${p2Name}`);
    }

    this.refreshActiveRooms();
  }

  handleGuestInvitation(roomData, accessToken) {
    this.pendingInvite = { roomCode: roomData.code, accessToken, roomData };

    // Hide host controls for guests
    this.elements.viewRoomsBtn?.classList.add('is-hidden');
    this.elements.activeRoomsBanner?.classList.add('is-hidden');

    // Retrieve saved guest session if present
    const sessionKey = getGuestSessionKey(roomData.code);
    let savedGuestName = '';
    try {
      const rawSession = localStorage.getItem(sessionKey);
      if (rawSession) {
        const parsed = JSON.parse(rawSession);
        savedGuestName = parsed.name || '';
      }
    } catch (e) {
      console.warn('Could not read guest session', e);
    }

    if (!savedGuestName) {
      savedGuestName = localStorage.getItem(STORAGE_KEY_LAST_GUEST_NAME) || '';
    }

    // Direct entry if game is in progress and name is stored/known
    const alreadyJoined = roomData.player_two_joined;
    const hasNameMemory = Boolean(savedGuestName);

    if (alreadyJoined && (hasNameMemory || roomData.player_two_name)) {
      const guestName = savedGuestName || roomData.player_two_name || 'Invitado';
      this.resumeGuestSession(roomData, accessToken, guestName);
      return;
    }

    // Otherwise, show the guest join form to input their name
    if (this.elements.onboardingForm) {
      this.elements.onboardingForm.classList.add('is-hidden');
    }
    if (this.elements.guestJoinForm) {
      this.elements.guestJoinForm.classList.remove('is-hidden');
    }
    if (this.elements.guestInviteRoomCode) {
      this.elements.guestInviteRoomCode.textContent = `SALA ${roomData.code}`;
    }
    if (this.elements.guestInviteDetails) {
      const modeName = roomData.mode === 'online' ? 'Online (A distancia)' : 'Presencial';
      this.elements.guestInviteDetails.textContent = `${roomData.player_one_name} te ha invitado a jugar en Modo ${modeName}.`;
    }
    if (this.elements.onboardingSubtitle) {
      this.elements.onboardingSubtitle.textContent = `Invitación recibida de ${roomData.player_one_name}.`;
    }
    if (this.elements.guestNameInput && savedGuestName) {
      this.elements.guestNameInput.value = savedGuestName;
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
      console.warn('Could not persist guest session', e);
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

    // Connect Realtime Channel
    this.connectToRealtimeRoom(roomData.code);

    // Notify host that player 2 has joined/reconnected
    broadcastRoomEvent(this.roomSession.channel, 'PLAYER_JOINED', {
      playerTwoName: guestName
    });

    // Direct transition to game screen
    this.elements.onboardingScreen?.classList.add('is-hidden');
    this.elements.roomWaitingScreen?.classList.add('is-hidden');
    this.elements.guestJoinForm?.classList.add('is-hidden');
    this.elements.gameScreen?.classList.remove('is-hidden');
    this.elements.changePlayersBtn?.classList.remove('is-hidden');
    this.elements.openCustomModalBtn?.classList.remove('is-hidden');
    this.elements.viewRoomsBtn?.classList.add('is-hidden');
    this.elements.activeRoomsBanner?.classList.add('is-hidden');

    this.syncTimerWithCurrentCard();
    this.renderGameStage();
    this.showToast(`Reconectado a la sala con ${roomData.player_one_name}`);
  }

  hydrateAndStartGame(roomData, guestName) {
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
    const p1 = this.elements.setupP1Input?.value.trim() || 'Jugador 1';
    const modeRadio = document.querySelector('input[name="gameMode"]:checked');
    const selectedMode = modeRadio?.value === GAME_MODES.ONLINE ? GAME_MODES.ONLINE : GAME_MODES.PRESENCIAL;
    const levelRadio = document.querySelector('input[name="initialLevel"]:checked');
    const initialLevel = Number(levelRadio?.value) || INTENSITY_LEVELS.ICEBREAKER;
    const sessionTypeRadio = document.querySelector('input[name="sessionType"]:checked');
    const isRoomMode = sessionTypeRadio?.value === 'room';

    if (!isRoomMode) {
      // Local 1 Phone Mode
      const p2 = this.elements.setupP2Input?.value.trim() || 'Jugador 2';
      this.startLocalSession(p1, p2, selectedMode, initialLevel);
      return;
    }

    // 2 Phones Room Mode via Supabase
    if (this.elements.onboardingSubmitBtn) {
      this.elements.onboardingSubmitBtn.disabled = true;
      this.elements.onboardingSubmitBtn.querySelector('span:first-child').textContent = 'Creando sala...';
    }

    try {
      const roomResult = await createGameRoom({
        playerName: p1,
        mode: selectedMode,
        level: initialLevel
      });

      if (!roomResult.success) {
        this.showToast(roomResult.error || 'Error al crear la sala');
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

      // Show Waiting Screen
      this.elements.onboardingScreen?.classList.add('is-hidden');
      this.elements.roomWaitingScreen?.classList.remove('is-hidden');
      if (this.elements.waitingRoomCode) {
        this.elements.waitingRoomCode.textContent = roomResult.code;
      }

      // Connect to Realtime Channel
      this.connectToRealtimeRoom(roomResult.code);
      await this.refreshActiveRooms();
    } catch (err) {
      this.showToast('No se pudo conectar con el servidor.');
      console.error(err);
    } finally {
      if (this.elements.onboardingSubmitBtn) {
        this.elements.onboardingSubmitBtn.disabled = false;
        this.elements.onboardingSubmitBtn.querySelector('span:first-child').textContent = 'Crear Sala y Obtener Enlace';
      }
    }
  }

  async handleGuestJoinSubmit() {
    if (!this.pendingInvite) return;
    const guestName = this.elements.guestNameInput?.value.trim() || 'Invitado';

    if (this.elements.guestJoinBtn) {
      this.elements.guestJoinBtn.disabled = true;
      this.elements.guestJoinBtn.querySelector('span:first-child').textContent = 'Conectando a la sala...';
    }

    try {
      const joinResult = await joinGameRoom({
        code: this.pendingInvite.roomCode,
        accessToken: this.pendingInvite.accessToken,
        playerName: guestName
      });

      if (!joinResult || !joinResult.success) {
        this.showToast(joinResult?.error || 'No se pudo unir a la sala');
        return;
      }

      // Save guest session memory to localStorage
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
        console.warn('Could not save guest session to localStorage', e);
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

      // Initialize game state as Player 2
      this.state = createInitialGameState({
        playerOne: joinResult.player_one_name,
        playerTwo: guestName,
        gameMode: joinResult.mode,
        initialLevel: joinResult.level,
        customCards: this.savedCustomCards
      });

      // Connect Realtime Channel
      this.connectToRealtimeRoom(joinResult.code);

      // Broadcast join event
      broadcastRoomEvent(this.roomSession.channel, 'PLAYER_JOINED', {
        playerTwoName: guestName
      });

      // Transition to game stage
      this.elements.onboardingScreen?.classList.add('is-hidden');
      this.elements.gameScreen?.classList.remove('is-hidden');
      this.elements.changePlayersBtn?.classList.remove('is-hidden');
      this.elements.openCustomModalBtn?.classList.remove('is-hidden');
      // Ensure active rooms manager remains hidden for the invited guest
      this.elements.viewRoomsBtn?.classList.add('is-hidden');
      this.elements.activeRoomsBanner?.classList.add('is-hidden');

      this.syncTimerWithCurrentCard();
      this.renderGameStage();
      this.showToast(`¡Conectado a la sala con ${joinResult.player_one_name}!`);
    } catch (err) {
      this.showToast('Error al conectarse a la sala');
      console.error(err);
    } finally {
      if (this.elements.guestJoinBtn) {
        this.elements.guestJoinBtn.disabled = false;
        this.elements.guestJoinBtn.querySelector('span:first-child').textContent = 'Unirme a la Sala en Vivo';
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

            this.elements.roomWaitingScreen?.classList.add('is-hidden');
            this.elements.gameScreen?.classList.remove('is-hidden');
            this.elements.changePlayersBtn?.classList.remove('is-hidden');
            this.elements.openCustomModalBtn?.classList.remove('is-hidden');

            this.syncTimerWithCurrentCard();
            this.renderGameStage();
            this.showToast(`¡${p2Name} se ha conectado a la sala!`);
          } else {
            this.showToast(`¡${p2Name} se ha reconectado a la sala!`);
            this.syncRoomState('SYNC_REFRESH');
          }
        }
      },
      onCardAction: (payload) => {
        if (!this.state || !payload) return;
        this.handleRemoteCardAction(payload);
      },
      onStateUpdate: (newRecord) => {
        if (this.roomSession?.role === 'player_one' && newRecord.player_two_joined && !this.roomSession.p2Name) {
          const p2Name = newRecord.player_two_name || 'Invitado';
          this.roomSession.p2Name = p2Name;
          if (!this.state) {
            this.hydrateAndStartGame(newRecord, p2Name);
            this.elements.roomWaitingScreen?.classList.add('is-hidden');
            this.elements.gameScreen?.classList.remove('is-hidden');
            this.elements.changePlayersBtn?.classList.remove('is-hidden');
            this.elements.openCustomModalBtn?.classList.remove('is-hidden');
            this.syncTimerWithCurrentCard();
            this.renderGameStage();
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

    broadcastRoomEvent(this.roomSession.channel, 'CARD_ACTION', payload);

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

    const allCards = [...this.state.customCards, ...DEFAULT_CARDS];
    const targetCard = allCards.find((c) => c.id === payload.currentCardId);

    this.state = {
      ...this.state,
      activePlayerIndex: payload.activePlayerIndex,
      turnCount: payload.turnCount || this.state.turnCount,
      chemistryScore: payload.chemistryScore || this.state.chemistryScore,
      currentLevel: payload.currentLevel || this.state.currentLevel,
      currentCard: targetCard || this.state.currentCard
    };

    this.animateCardTransition(() => {
      this.syncTimerWithCurrentCard();
      this.renderGameStage();
    });
  }

  teardownRoomSession() {
    if (this.roomSession?.channel) {
      try {
        this.roomSession.channel.unsubscribe();
      } catch (e) {
        console.warn('Error closing channel', e);
      }
    }
    this.roomSession = null;
    this.refreshActiveRooms();
  }

  /* ==========================================================================
     Active Rooms Management & Switching
     ========================================================================== */

  async refreshActiveRooms() {
    // If current session is an invited guest, never show host rooms manager
    if (this.pendingInvite || this.roomSession?.role === 'player_two') {
      this.elements.viewRoomsBtn?.classList.add('is-hidden');
      this.elements.activeRoomsBanner?.classList.add('is-hidden');
      return;
    }

    try {
      this.activeRoomsList = await fetchClientActiveRooms();
      const count = this.activeRoomsList.length;

      if (this.elements.activeRoomsCountLabel) {
        this.elements.activeRoomsCountLabel.textContent = `Salas (${count}/3)`;
      }

      if (this.elements.activeRoomsBanner) {
        const isRoomSelected = document.querySelector('input[name="sessionType"]:checked')?.value === 'room';
        if (count > 0 && isRoomSelected) {
          this.elements.activeRoomsBanner.classList.remove('is-hidden');
          if (this.elements.activeRoomsBannerText) {
            this.elements.activeRoomsBannerText.textContent = count === 1
              ? 'Tienes 1 sala activa en este dispositivo.'
              : `Tienes ${count} salas activas (máximo 3).`;
          }
        } else {
          this.elements.activeRoomsBanner.classList.add('is-hidden');
        }
      }
    } catch (err) {
      console.warn('Error refreshing active rooms:', err);
    }
  }

  async openActiveRoomsModal() {
    if (this.pendingInvite || this.roomSession?.role === 'player_two') {
      return;
    }
    await this.refreshActiveRooms();
    const listEl = this.elements.activeRoomsList;
    if (!listEl) return;

    listEl.innerHTML = '';

    if (!this.activeRoomsList || this.activeRoomsList.length === 0) {
      const emptyP = document.createElement('p');
      emptyP.className = 'empty-rooms-msg';
      emptyP.textContent = 'No tienes salas activas creadas en este dispositivo.';
      listEl.appendChild(emptyP);
    } else {
      this.activeRoomsList.forEach((room) => {
        const card = document.createElement('div');
        card.className = 'active-room-card';

        const remainingMin = Math.max(1, Math.floor((room.seconds_remaining || 0) / 60));
        const hours = Math.floor(remainingMin / 60);
        const mins = remainingMin % 60;
        const timeText = hours > 0 ? `${hours}h ${mins}m restantes` : `${mins}m restantes`;

        const isConnected = room.player_two_joined;
        const partnerName = isConnected ? room.player_two_name : 'Esperando a tu pareja...';
        const modeLabel = room.mode === 'online' ? 'Online' : 'Presencial';
        const isCurrent = this.roomSession?.code === room.code;

        card.innerHTML = `
          <div class="room-card-header">
            <span class="room-card-code">${room.code} ${isCurrent ? '<span style="font-size: 0.72rem; color: var(--accent-champagne); font-weight: normal;">(Actual)</span>' : ''}</span>
            <span class="room-card-status ${isConnected ? 'is-connected' : 'is-waiting'}">
              ${isConnected ? 'En juego' : 'Esperando pareja'}
            </span>
          </div>
          <div class="room-card-details">
            <span><strong>Cita:</strong> ${partnerName}</span>
            <span>·</span>
            <span><strong>Modo:</strong> ${modeLabel}</span>
            <span>·</span>
            <span>⏱ ${timeText}</span>
          </div>
          <div class="room-card-actions">
            <button type="button" class="btn-flagship btn-switch-room" style="padding: 6px 14px; font-size: 0.8rem;">
              ${isCurrent ? 'Continuar Partida' : 'Entrar a esta Sala'}
            </button>
            <button type="button" class="btn-ghost btn-copy-room-link" style="padding: 6px 12px; font-size: 0.8rem;" title="Copiar enlace de invitación">
              Copiar Enlace
            </button>
            <button type="button" class="btn-ghost btn-close-room" style="padding: 6px 10px; font-size: 0.8rem; color: var(--text-secondary); margin-left: auto;" title="Cerrar sala y liberar espacio">
              ✕ Cerrar
            </button>
          </div>
        `;

        // Bind Actions
        const switchBtn = card.querySelector('.btn-switch-room');
        switchBtn?.addEventListener('click', () => {
          this.switchToRoom(room);
        });

        const copyBtn = card.querySelector('.btn-copy-room-link');
        copyBtn?.addEventListener('click', () => {
          const inviteUrl = `${window.location.origin}${window.location.pathname}?room=${room.code}&key=${room.access_token}`;
          navigator.clipboard.writeText(inviteUrl);
          this.showToast(`Enlace de sala ${room.code} copiado`);
        });

        const closeBtn = card.querySelector('.btn-close-room');
        closeBtn?.addEventListener('click', async () => {
          await this.handleCloseRoom(room);
        });

        listEl.appendChild(card);
      });
    }

    this.elements.activeRoomsModal?.classList.add('is-open');
  }

  closeActiveRoomsModal() {
    this.elements.activeRoomsModal?.classList.remove('is-open');
  }

  async handleCloseRoom(room) {
    const res = await closeGameRoom(room.code, room.host_token);
    if (res.success) {
      if (this.roomSession?.code === room.code) {
        this.teardownRoomSession();
        this.elements.gameScreen?.classList.add('is-hidden');
        this.elements.roomWaitingScreen?.classList.add('is-hidden');
        this.elements.changePlayersBtn?.classList.add('is-hidden');
        this.elements.openCustomModalBtn?.classList.add('is-hidden');
        this.elements.onboardingScreen?.classList.remove('is-hidden');
      }
      this.showToast(`Sala ${room.code} cerrada. Espacio liberado.`);
      await this.openActiveRoomsModal();
    } else {
      this.showToast(res.error || 'No se pudo cerrar la sala');
    }
  }

  switchToRoom(room) {
    this.teardownRoomSession();
    this.closeActiveRoomsModal();

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

    this.elements.onboardingScreen?.classList.add('is-hidden');

    if (!room.player_two_joined) {
      this.elements.gameScreen?.classList.add('is-hidden');
      this.elements.roomWaitingScreen?.classList.remove('is-hidden');
      if (this.elements.waitingRoomCode) {
        this.elements.waitingRoomCode.textContent = room.code;
      }
      this.connectToRealtimeRoom(room.code);
      this.showToast(`Cambiado a sala ${room.code} (esperando a tu cita)`);
    } else {
      const p2Name = room.player_two_name || 'Invitado';
      this.hydrateAndStartGame(room, p2Name);

      this.elements.roomWaitingScreen?.classList.add('is-hidden');
      this.elements.gameScreen?.classList.remove('is-hidden');
      this.elements.changePlayersBtn?.classList.remove('is-hidden');
      this.elements.openCustomModalBtn?.classList.remove('is-hidden');

      this.connectToRealtimeRoom(room.code);
      this.syncTimerWithCurrentCard();
      this.renderGameStage();
      this.showToast(`Cambiado a sala ${room.code} con ${p2Name}`);
    }

    window.history.replaceState({}, document.title, `${window.location.pathname}?room=${room.code}&key=${room.access_token}`);
  }

  /* ==========================================================================
     Local 1 Phone Session Logic
     ========================================================================== */

  startLocalSession(playerOne, playerTwo, gameMode, initialLevel) {
    this.teardownRoomSession();
    this.state = createInitialGameState({
      playerOne,
      playerTwo,
      gameMode,
      initialLevel,
      customCards: this.savedCustomCards
    });

    this.elements.onboardingScreen?.classList.add('is-hidden');
    this.elements.gameScreen?.classList.remove('is-hidden');
    this.elements.changePlayersBtn?.classList.remove('is-hidden');
    this.elements.openCustomModalBtn?.classList.remove('is-hidden');

    this.syncTimerWithCurrentCard();
    this.renderGameStage();
  }

  /* ==========================================================================
     Inline Timer
     ========================================================================== */

  syncTimerWithCurrentCard() {
    this.stopChronograph();
    const cardTimer = this.state?.currentCard?.timerSeconds || 0;
    if (cardTimer > 0) {
      this.elements.inlineTimerBox?.classList.remove('is-hidden');
      this.resetChronograph(cardTimer);
    } else {
      this.elements.inlineTimerBox?.classList.add('is-hidden');
    }
  }

  resetChronograph(durationSec) {
    this.stopChronograph();
    const safeSec = clampNumber(Number(durationSec) || 20, 5, 180);
    this.timerState.durationSec = safeSec;
    this.timerState.remainingSec = safeSec;
    this.renderTimerReadout();
  }

  startChronograph() {
    if (this.timerState.remainingSec <= 0) {
      this.timerState.remainingSec = this.timerState.durationSec;
    }
    this.timerState.isRunning = true;
    this.timerState.lastTimestamp = performance.now();
    this.renderTimerReadout();

    const tick = (now) => {
      if (!this.timerState.isRunning) return;
      const dt = (now - this.timerState.lastTimestamp) / 1000;
      this.timerState.lastTimestamp = now;

      this.timerState.remainingSec = Math.max(0, this.timerState.remainingSec - dt);
      this.renderTimerReadout();

      if (this.timerState.remainingSec <= 0) {
        this.stopChronograph();
        this.showToast('⏱ ¡Reto completado! +5% de Química');
        if (this.state) {
          this.state = {
            ...this.state,
            chemistryScore: clampNumber(this.state.chemistryScore + 5, 0, 100)
          };
          this.syncRoomState('TIMER_BONUS');
          this.renderGameStage();
        }
        return;
      }

      this.timerState.rafId = requestAnimationFrame(tick);
    };

    this.timerState.rafId = requestAnimationFrame(tick);
  }

  stopChronograph() {
    this.timerState.isRunning = false;
    if (this.timerState.rafId) {
      cancelAnimationFrame(this.timerState.rafId);
      this.timerState.rafId = null;
    }
    this.renderTimerReadout();
  }

  renderTimerReadout() {
    const displaySeconds = Math.ceil(this.timerState.remainingSec);
    if (this.elements.chronoSecondsReadout) {
      this.elements.chronoSecondsReadout.textContent = `${String(displaySeconds).padStart(2, '0')}s`;
    }
    if (this.elements.chronoToggleBtn) {
      this.elements.chronoToggleBtn.textContent = this.timerState.isRunning
        ? 'Pausar'
        : 'Iniciar Reto';
    }
  }

  /* ==========================================================================
     Custom Cards
     ========================================================================== */

  handleCreateCustomCard() {
    if (!this.state) return;
    const rawText = this.elements.customPromptInput?.value || '';
    const level = Number(this.elements.customLevelSelect?.value) || this.state.currentLevel;
    const timerSeconds = Number(this.elements.customTimerSelect?.value) || 0;
    const category = timerSeconds > 0 ? 'challenge' : 'question';

    try {
      const result = addCustomCardToState(
        this.state,
        { text: rawText, level, category, timerSeconds },
        true
      );
      this.state = result.state;
      this.saveCustomCardsToStorage();

      if (this.elements.customPromptInput) {
        this.elements.customPromptInput.value = '';
      }
      this.elements.customCardModal?.classList.remove('is-open');

      this.syncRoomState('CUSTOM_CARD_PLAYED');
      this.animateCardTransition(() => {
        this.syncTimerWithCurrentCard();
        this.renderGameStage();
      });
      this.showToast('Tu carta personalizada está en juego');
    } catch (error) {
      this.showToast(error.message || 'Escribe al menos 8 caracteres');
    }
  }

  /* ==========================================================================
     Rendering & Visual Sync
     ========================================================================== */

  getActiveFormattedPrompt() {
    if (!this.state?.currentCard) return '';
    const activePlayer = this.state.players[this.state.activePlayerIndex];
    const otherPlayer = this.state.players[(this.state.activePlayerIndex + 1) % 2];
    return formatCardPrompt(this.state.currentCard.text, activePlayer.name, otherPlayer.name);
  }

  animateCardTransition(callback) {
    const wrapper = this.elements.stageCardWrapper;
    if (!wrapper) {
      callback();
      return;
    }
    wrapper.classList.add('is-transitioning');
    setTimeout(() => {
      callback();
      wrapper.classList.remove('is-transitioning');
    }, 170);
  }

  renderGameStage() {
    if (!this.state) return;
    const [p1, p2] = this.state.players;
    const activePlayer = this.state.players[this.state.activePlayerIndex];
    const otherPlayer = this.state.players[(this.state.activePlayerIndex + 1) % 2];
    const card = this.state.currentCard;
    const modeMeta = MODE_METADATA[this.state.gameMode] || MODE_METADATA.presencial;

    // Header pill
    if (this.elements.navPlayersLabel) {
      this.elements.navPlayersLabel.textContent = `${p1.name} & ${p2.name}`;
    }
    if (this.elements.navModeBadge) {
      this.elements.navModeBadge.textContent = this.roomSession
        ? `Sala ${this.roomSession.code}`
        : modeMeta.shortLabel;
    }

    // Level tabs
    this.elements.levelTabs.forEach((tab) => {
      const lvl = Number(tab.getAttribute('data-level-btn'));
      tab.classList.toggle('active', lvl === this.state.currentLevel);
    });

    // Chemistry pill
    if (this.elements.chemistryPercentage) {
      this.elements.chemistryPercentage.textContent = `${this.state.chemistryScore}%`;
    }
    if (this.elements.chemistryBarFill) {
      this.elements.chemistryBarFill.style.width = `${this.state.chemistryScore}%`;
    }

    if (!card) return;

    // Card header & prompt
    if (this.elements.turnBadgeText) {
      this.elements.turnBadgeText.textContent = `Turno de ${activePlayer.name}`;
    }
    if (this.elements.targetPlayerLabel) {
      this.elements.targetPlayerLabel.textContent = `con ${otherPlayer.name}`;
    }

    const categoryLabel = CATEGORY_LABELS[card.category] || 'Pregunta';
    if (this.elements.cardCategoryBadge) {
      this.elements.cardCategoryBadge.textContent = card.isCustom
        ? `${categoryLabel} · A Medida`
        : categoryLabel;
    }

    if (this.elements.cardPromptText) {
      this.elements.cardPromptText.textContent = this.getActiveFormattedPrompt();
    }
    if (this.elements.cardPromptHint) {
      this.elements.cardPromptHint.textContent = formatCardPrompt(
        card.hint || '',
        activePlayer.name,
        otherPlayer.name
      );
    }

    // Wildcards
    if (this.elements.wildcardBtnCount) {
      this.elements.wildcardBtnCount.textContent = `(${activePlayer.wildcards})`;
    }
    if (this.elements.wildcardSkipBtn) {
      this.elements.wildcardSkipBtn.disabled = activePlayer.wildcards <= 0;
    }
  }

  showToast(message) {
    const toast = this.elements.toastEl;
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('is-visible');

    if (this.toastTimeoutId) {
      clearTimeout(this.toastTimeoutId);
    }
    this.toastTimeoutId = setTimeout(() => {
      toast.classList.remove('is-visible');
    }, 2800);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = new ChemBlindAppController();
  app.init();
});
