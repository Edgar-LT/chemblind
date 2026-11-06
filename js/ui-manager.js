/**
 * @file ui-manager.js
 * @description Dedicated UI Manager for ChemBlind.
 * Manages DOM caching, view transitions, stage rendering, and safe element creation (no unescaped innerHTML).
 */

import { MODE_METADATA } from './constants.js';
import { formatCardPrompt } from './engine.js';

export class UIManager {
  constructor() {
    this.elements = this._cacheElements();
    this.toastTimeoutId = null;
  }

  _cacheElements() {
    const byId = (id) => document.getElementById(id);
    return {
      // Top Navigation
      changePlayersBtn: byId('change-players-btn'),
      navPlayersLabel: byId('nav-players-label'),
      navModeBadge: byId('nav-mode-badge'),
      navRoomsAvailableTag: byId('nav-rooms-available-tag'),
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
      playersInputRow: byId('players-input-row'),
      p1FieldHint: byId('p1-field-hint'),
      sessionTypeRadios: document.querySelectorAll('input[name="sessionType"]'),
      activeRoomsBanner: byId('active-rooms-banner'),
      activeRoomsBannerText: byId('active-rooms-banner-text'),
      bannerViewRoomsBtn: byId('banner-view-rooms-btn'),

      // Modal: Mis Salas Activas
      activeRoomsModal: byId('active-rooms-modal'),
      closeRoomsModalBtn: byId('close-rooms-modal-btn'),
      closeRoomsModalBtn2: byId('close-rooms-modal-btn-2'),
      modalExitGameBtn: byId('modal-exit-game-btn'),
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

      // Interactive Card Response Section
      cardResponseSection: byId('card-response-section'),
      responseInputBox: byId('response-input-box'),
      cardResponseInput: byId('card-response-input'),
      responseCharCount: byId('response-char-count'),
      sendResponseBtn: byId('send-response-btn'),
      cardOpenChatBtn: byId('card-open-chat-btn'),
      responseDisplayBox: byId('response-display-box'),
      responseAuthorName: byId('response-author-name'),
      responseDisplayText: byId('response-display-text'),
      editResponseBtn: byId('edit-response-btn'),
      responseStatusBadge: byId('response-status-badge'),
      openChatModalBtn: byId('open-chat-modal-btn'),

      // Realtime Conversation Modal (Facebook Messenger / Haute Horlogerie Style)
      navChatBtn: byId('nav-chat-btn'),
      floatingChatTrigger: byId('floating-chat-trigger'),
      chatConversationModal: byId('chat-conversation-modal'),
      chatModalPartnerName: byId('chat-modal-partner-name'),
      closeChatModalBtn: byId('close-chat-modal-btn'),
      popoutChatBtn: byId('popout-chat-btn'),
      chatModalCardPrompt: byId('chat-modal-card-prompt'),
      chatModalMessages: byId('chat-modal-messages'),
      chatModalForm: byId('chat-modal-form'),
      chatModalInput: byId('chat-modal-input'),
      chatModalSendBtn: byId('chat-modal-send-btn'),

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

  showToast(message, durationMs = 2800) {
    const el = this.elements.toastEl;
    if (!el) return;

    if (this.toastTimeoutId) {
      clearTimeout(this.toastTimeoutId);
    }
    el.textContent = message;
    el.classList.add('is-visible');

    this.toastTimeoutId = setTimeout(() => {
      el.classList.remove('is-visible');
      this.toastTimeoutId = null;
    }, durationMs);
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
  }

  showScreen(screen) {
    // Hide all main screen views
    this.elements.onboardingScreen?.classList.add('is-hidden');
    this.elements.roomWaitingScreen?.classList.add('is-hidden');
    this.elements.gameScreen?.classList.add('is-hidden');
    this.elements.navChatBtn?.classList.add('is-hidden');
    this.elements.floatingChatTrigger?.classList.add('is-hidden');

    if (screen === 'onboarding') {
      this.elements.onboardingScreen?.classList.remove('is-hidden');
      this.elements.onboardingForm?.classList.remove('is-hidden');
      this.elements.guestJoinForm?.classList.add('is-hidden');
      this.elements.changePlayersBtn?.classList.add('is-hidden');
      this.elements.openCustomModalBtn?.classList.add('is-hidden');
      this.setChatModalOpen(false);
    } else if (screen === 'guest-join') {
      this.elements.onboardingScreen?.classList.remove('is-hidden');
      this.elements.onboardingForm?.classList.add('is-hidden');
      this.elements.guestJoinForm?.classList.remove('is-hidden');
      this.elements.changePlayersBtn?.classList.add('is-hidden');
      this.elements.openCustomModalBtn?.classList.add('is-hidden');
      this.elements.viewRoomsBtn?.classList.add('is-hidden');
      this.elements.activeRoomsBanner?.classList.add('is-hidden');
      this.setChatModalOpen(false);
    } else if (screen === 'waiting') {
      this.elements.roomWaitingScreen?.classList.remove('is-hidden');
      this.elements.changePlayersBtn?.classList.add('is-hidden');
      this.elements.openCustomModalBtn?.classList.add('is-hidden');
      this.setChatModalOpen(false);
    } else if (screen === 'game') {
      this.elements.gameScreen?.classList.remove('is-hidden');
      this.elements.changePlayersBtn?.classList.remove('is-hidden');
      this.elements.openCustomModalBtn?.classList.remove('is-hidden');
      this.elements.navChatBtn?.classList.remove('is-hidden');
      this.elements.floatingChatTrigger?.classList.remove('is-hidden');
    }
  }

  setSessionType(isRoom) {
    if (this.elements.setupP2Container) {
      if (isRoom) {
        this.elements.setupP2Container.classList.add('is-hidden');
        this.elements.setupP2Container.style.setProperty('display', 'none', 'important');
      } else {
        this.elements.setupP2Container.classList.remove('is-hidden');
        this.elements.setupP2Container.style.removeProperty('display');
      }
      if (this.elements.setupP2Input) {
        this.elements.setupP2Input.required = !isRoom;
        if (isRoom) {
          this.elements.setupP2Input.value = '';
        }
      }
    }
    if (this.elements.playersInputRow) {
      this.elements.playersInputRow.classList.toggle('is-single-column', isRoom);
    }
    if (this.elements.p1FieldHint) {
      this.elements.p1FieldHint.style.display = isRoom ? 'block' : 'none';
    }
    if (this.elements.onboardingSubmitBtn) {
      const label = this.elements.onboardingSubmitBtn.querySelector('span:first-child');
      if (label) {
        label.textContent = isRoom ? 'Crear Sala y Obtener Enlace' : 'Comenzar a Jugar';
      }
    }
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

  renderGameStage(state, roomSession = null) {
    if (!state) return;

    const [p1, p2] = state.players;
    const activePlayer = state.players[state.activePlayerIndex];
    const otherPlayer = state.players[(state.activePlayerIndex + 1) % 2];
    const card = state.currentCard;
    const modeMeta = MODE_METADATA[state.gameMode] || MODE_METADATA.presencial;

    // Header nav pill
    if (this.elements.navPlayersLabel) {
      this.elements.navPlayersLabel.textContent = `${p1.name} & ${p2.name}`;
    }
    if (this.elements.navModeBadge) {
      this.elements.navModeBadge.textContent = roomSession
        ? `Sala ${roomSession.code}`
        : modeMeta.shortLabel;
    }

    // Hide standalone view-rooms-btn in game (it is unified into change-players-btn)
    this.elements.viewRoomsBtn?.classList.add('is-hidden');

    if (this.elements.modalExitGameBtn) {
      if (roomSession) {
        this.elements.modalExitGameBtn.classList.remove('is-hidden');
      } else {
        this.elements.modalExitGameBtn.classList.add('is-hidden');
      }
    }

    // Level selector tabs
    this.elements.levelTabs.forEach((tab) => {
      const lvl = Number(tab.getAttribute('data-level-btn'));
      tab.classList.toggle('active', lvl === state.currentLevel);
    });

    // Chemistry meter
    if (this.elements.chemistryPercentage) {
      this.elements.chemistryPercentage.textContent = `${state.chemistryScore}%`;
    }
    if (this.elements.chemistryBarFill) {
      this.elements.chemistryBarFill.style.width = `${state.chemistryScore}%`;
    }

    // Card Details
    if (this.elements.turnBadgeText) {
      this.elements.turnBadgeText.textContent = `Turno de ${activePlayer.name}`;
    }
    if (this.elements.targetPlayerLabel) {
      this.elements.targetPlayerLabel.textContent =
        state.gameMode === 'online'
          ? `Responde a ${otherPlayer.name}`
          : `Mirando a ${otherPlayer.name}`;
    }

    if (card) {
      if (this.elements.cardCategoryBadge) {
        const catMap = {
          challenge: 'Reto en Persona',
          guess: 'Dinámica Interactiva',
          confession: 'Confesión Directa',
          question: 'Pregunta'
        };
        this.elements.cardCategoryBadge.textContent = catMap[card.category] || 'Pregunta';
      }

      if (this.elements.cardPromptText) {
        this.elements.cardPromptText.textContent = formatCardPrompt(
          card.text,
          activePlayer.name,
          otherPlayer.name
        );
      }

      if (this.elements.cardPromptHint) {
        this.elements.cardPromptHint.textContent = card.hint || '';
      }

      // Sync Facebook-style Chat Context & Partner Name
      this.setChatCardPrompt(card.text);
    }

    const partnerName = roomSession
      ? (roomSession.role === 'player_one' ? (roomSession.p2Name || 'Tu Pareja') : (roomSession.p1Name || 'Tu Pareja'))
      : (otherPlayer ? otherPlayer.name : 'Tu Cita');
    this.setChatPartnerName(partnerName);

    // Wildcards
    if (this.elements.wildcardBtnCount) {
      this.elements.wildcardBtnCount.textContent = `(${activePlayer.wildcards})`;
    }
    if (this.elements.wildcardSkipBtn) {
      this.elements.wildcardSkipBtn.disabled = activePlayer.wildcards <= 0;
    }
  }

  /**
   * Resets the interactive card response box to its empty drafting state.
   */
  resetResponseSection() {
    if (this.elements.cardResponseInput) {
      this.elements.cardResponseInput.value = '';
    }
    if (this.elements.responseCharCount) {
      this.elements.responseCharCount.textContent = '0 / 360';
    }
    if (this.elements.responseDisplayText) {
      this.elements.responseDisplayText.textContent = '';
    }
    if (this.elements.responseAuthorName) {
      this.elements.responseAuthorName.textContent = '';
    }
    this.elements.responseInputBox?.classList.remove('is-hidden');
    this.elements.responseDisplayBox?.classList.add('is-hidden');
    if (this.elements.editResponseBtn) {
      this.elements.editResponseBtn.style.display = '';
    }
  }

  /**
   * Displays a submitted card response in the refined quote container.
   * @param {string} authorName
   * @param {string} text
   * @param {boolean} canEdit
   */
  showResponseDisplay(authorName, text, canEdit = true) {
    if (this.elements.responseAuthorName) {
      this.elements.responseAuthorName.textContent = authorName;
    }
    if (this.elements.responseDisplayText) {
      this.elements.responseDisplayText.textContent = text;
    }
    if (this.elements.editResponseBtn) {
      this.elements.editResponseBtn.style.display = canEdit ? 'inline-flex' : 'none';
    }
    this.elements.responseInputBox?.classList.add('is-hidden');
    this.elements.responseDisplayBox?.classList.remove('is-hidden');
  }

  /**
   * Restores input mode for editing an existing response.
   * @param {string} prefilledText
   */
  showResponseInput(prefilledText = '') {
    if (this.elements.cardResponseInput) {
      if (prefilledText) {
        this.elements.cardResponseInput.value = prefilledText;
      }
      this.updateResponseCharCount(this.elements.cardResponseInput.value.length);
      this.elements.cardResponseInput.focus();
    }
    this.elements.responseInputBox?.classList.remove('is-hidden');
    this.elements.responseDisplayBox?.classList.add('is-hidden');
  }

  /**
   * Updates the character counter for the response textarea.
   * @param {number} count
   * @param {number} [max=360]
   */
  updateResponseCharCount(count, max = 360) {
    if (this.elements.responseCharCount) {
      this.elements.responseCharCount.textContent = `${count} / ${max}`;
    }
  }

  renderTimer(remainingSec, isRunning) {
    const displaySeconds = Math.ceil(remainingSec);
    if (this.elements.chronoSecondsReadout) {
      this.elements.chronoSecondsReadout.textContent = `${String(displaySeconds).padStart(2, '0')}s`;
    }
    if (this.elements.chronoToggleBtn) {
      this.elements.chronoToggleBtn.textContent = isRunning ? 'Pausar' : 'Iniciar Reto';
    }
  }

  setTimerBoxVisible(visible) {
    this.elements.inlineTimerBox?.classList.toggle('is-hidden', !visible);
  }

  /**
   * Safe, XSS-free rendering of active rooms modal using document.createElement.
   */
  renderActiveRooms(rooms, currentRoomCode, onSwitch, onCopy, onClose) {
    const listEl = this.elements.activeRoomsList;
    if (!listEl) return;

    listEl.textContent = ''; // Safe clear

    if (!rooms || rooms.length === 0) {
      const emptyP = document.createElement('p');
      emptyP.className = 'empty-rooms-msg';
      emptyP.textContent = 'No tienes salas activas creadas en este dispositivo.';
      listEl.appendChild(emptyP);
      return;
    }

    rooms.forEach((room) => {
      const card = document.createElement('div');
      card.className = 'active-room-card';

      const remainingMin = Math.max(1, Math.floor((room.seconds_remaining || 0) / 60));
      const hours = Math.floor(remainingMin / 60);
      const mins = remainingMin % 60;
      const timeText = hours > 0 ? `${hours}h ${mins}m restantes` : `${mins}m restantes`;

      const isConnected = Boolean(room.player_two_joined);
      const partnerName = isConnected
        ? String(room.player_two_name || 'Invitado')
        : 'Esperando a tu pareja...';
      const modeLabel = room.mode === 'online' ? 'Online' : 'Presencial';
      const isCurrent = currentRoomCode === room.code;

      // Header row
      const headerRow = document.createElement('div');
      headerRow.className = 'room-card-header';

      const codeSpan = document.createElement('span');
      codeSpan.className = 'room-card-code';
      codeSpan.textContent = room.code;

      if (isCurrent) {
        const currentBadge = document.createElement('span');
        currentBadge.style.cssText = 'font-size: 0.72rem; color: var(--accent-champagne); font-weight: normal; margin-left: 6px;';
        currentBadge.textContent = '(Actual)';
        codeSpan.appendChild(currentBadge);
      }

      const statusBadge = document.createElement('span');
      statusBadge.className = `room-card-status ${isConnected ? 'is-connected' : 'is-waiting'}`;
      statusBadge.textContent = isConnected ? 'En juego' : 'Esperando pareja';

      headerRow.appendChild(codeSpan);
      headerRow.appendChild(statusBadge);

      // Details row
      const detailsRow = document.createElement('div');
      detailsRow.className = 'room-card-details';

      const partnerSpan = document.createElement('span');
      partnerSpan.textContent = `Cita: ${partnerName}`;

      const sep1 = document.createElement('span');
      sep1.textContent = '·';

      const modeSpan = document.createElement('span');
      modeSpan.textContent = `Modo: ${modeLabel}`;

      const sep2 = document.createElement('span');
      sep2.textContent = '·';

      const timeSpan = document.createElement('span');
      timeSpan.textContent = `⏱ ${timeText}`;

      detailsRow.append(partnerSpan, sep1, modeSpan, sep2, timeSpan);

      // Actions row
      const actionsRow = document.createElement('div');
      actionsRow.className = 'room-card-actions';

      const switchBtn = document.createElement('button');
      switchBtn.type = 'button';
      switchBtn.className = 'btn-flagship';
      switchBtn.style.cssText = 'padding: 6px 14px; font-size: 0.8rem;';
      switchBtn.textContent = isCurrent ? 'Continuar Partida' : 'Entrar a esta Sala';
      switchBtn.addEventListener('click', () => onSwitch(room));

      const copyBtn = document.createElement('button');
      copyBtn.type = 'button';
      copyBtn.className = 'btn-ghost';
      copyBtn.style.cssText = 'padding: 6px 12px; font-size: 0.8rem;';
      copyBtn.textContent = 'Copiar Enlace';
      copyBtn.addEventListener('click', () => onCopy(room));

      const closeBtn = document.createElement('button');
      closeBtn.type = 'button';
      closeBtn.className = 'btn-ghost';
      closeBtn.style.cssText = 'padding: 6px 10px; font-size: 0.8rem; color: var(--text-secondary); margin-left: auto;';
      closeBtn.textContent = '✕ Cerrar';
      closeBtn.title = 'Cerrar sala y liberar espacio';
      closeBtn.addEventListener('click', () => onClose(room));

      actionsRow.append(switchBtn, copyBtn, closeBtn);

      card.append(headerRow, detailsRow, actionsRow);
      listEl.appendChild(card);
    });
  }

  setRoomsModalOpen(isOpen) {
    const modal = this.elements.activeRoomsModal;
    if (!modal) return;
    if (isOpen) {
      modal.style.display = 'grid';
      void modal.offsetWidth;
      modal.classList.add('is-open');
    } else {
      modal.classList.remove('is-open');
      modal.style.display = 'none';
    }
  }

  setCustomCardModalOpen(isOpen, currentLevel = 1) {
    const modal = this.elements.customCardModal;
    if (!modal) return;
    if (isOpen) {
      if (this.elements.customLevelSelect) {
        this.elements.customLevelSelect.value = String(currentLevel);
      }
      modal.style.display = 'grid';
      void modal.offsetWidth;
      modal.classList.add('is-open');
      this.elements.customPromptInput?.focus();
    } else {
      modal.classList.remove('is-open');
      modal.style.display = 'none';
    }
  }

  /**
   * Opens or closes the Facebook-style conversation modal.
   * @param {boolean} isOpen
   */
  setChatModalOpen(isOpen) {
    const modal = this.elements.chatConversationModal;
    if (!modal) return;

    if (isOpen) {
      modal.style.display = 'grid';
      void modal.offsetWidth;
      modal.classList.add('is-open');
      setTimeout(() => {
        this.elements.chatModalInput?.focus();
        if (this.elements.chatModalMessages) {
          this.elements.chatModalMessages.scrollTop = this.elements.chatModalMessages.scrollHeight;
        }
      }, 60);
    } else {
      modal.classList.remove('is-open');
      modal.style.display = 'none';
    }
  }

  /**
   * Returns whether the chat modal is currently visible.
   * @returns {boolean}
   */
  isChatModalOpen() {
    return Boolean(this.elements.chatConversationModal?.classList.contains('is-open'));
  }

  /**
   * Resets the chat messages feed to its initial empty placeholder state.
   */
  clearChatMessages() {
    const list = this.elements.chatModalMessages;
    if (!list) return;
    list.innerHTML = `
      <div class="chat-empty-state">
        <span class="chat-empty-icon">💬</span>
        <p>Aún no hay mensajes. ¡Sé el primero en escribir o responde a la carta!</p>
      </div>
    `;
  }

  /**
   * Sets the partner's display name in the chat header.
   * @param {string} name
   */
  setChatPartnerName(name) {
    if (this.elements.chatModalPartnerName) {
      this.elements.chatModalPartnerName.textContent = name || 'Tu Cita';
    }
  }

  /**
   * Updates the card context bar in the chat modal.
   * @param {string} promptText
   */
  setChatCardPrompt(promptText) {
    if (this.elements.chatModalCardPrompt) {
      this.elements.chatModalCardPrompt.textContent = promptText || 'Selecciona una carta para conversar.';
    }
  }

  /**
   * Appends a chat bubble to the thread using safe text nodes (zero innerHTML injection).
   * @param {Object} options
   * @param {string} options.authorName
   * @param {boolean} options.isOutgoing
   * @param {string} options.text
   * @param {string} [options.timeStr]
   * @param {boolean} [options.isCardResponse=false]
   */
  addChatMessage({ authorName, isOutgoing, text, timeStr, isCardResponse = false, cardPrompt = '' }) {
    const list = this.elements.chatModalMessages;
    if (!list) return;

    const emptyHint = list.querySelector('.chat-empty-state');
    if (emptyHint) {
      emptyHint.remove();
    }

    const row = document.createElement('div');
    row.className = `chat-bubble-row ${isOutgoing ? 'outgoing' : 'incoming'}`;

    const authorSpan = document.createElement('span');
    authorSpan.className = 'chat-bubble-author';
    authorSpan.textContent = authorName || (isOutgoing ? 'Tú' : 'Tu Cita');
    row.appendChild(authorSpan);

    const bubbleDiv = document.createElement('div');
    bubbleDiv.className = 'chat-bubble-bubble';

    // WhatsApp-Style Quoted Question / Prompt Header
    if (cardPrompt) {
      const quoteDiv = document.createElement('div');
      quoteDiv.className = 'chat-quoted-reply';

      const quoteLabel = document.createElement('span');
      quoteLabel.className = 'chat-quoted-label';
      quoteLabel.textContent = isCardResponse ? 'Respuesta a la carta' : 'Pregunta en juego';

      const quoteText = document.createElement('p');
      quoteText.className = 'chat-quoted-text';
      quoteText.textContent = `"${cardPrompt}"`;

      quoteDiv.appendChild(quoteLabel);
      quoteDiv.appendChild(quoteText);
      bubbleDiv.appendChild(quoteDiv);
    } else if (isCardResponse) {
      const badge = document.createElement('span');
      badge.className = 'chat-bubble-badge';
      badge.textContent = 'Respuesta a la carta';
      bubbleDiv.appendChild(badge);
    }

    const textNode = document.createTextNode(text);
    bubbleDiv.appendChild(textNode);
    row.appendChild(bubbleDiv);

    const timeSpan = document.createElement('span');
    timeSpan.className = 'chat-bubble-time';
    timeSpan.textContent = timeStr || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    row.appendChild(timeSpan);

    list.appendChild(row);
    list.scrollTop = list.scrollHeight;
  }

  updateActiveRoomsCount(count, isRoomSelected) {
    if (this.elements.activeRoomsCountLabel) {
      if (count <= 0) {
        this.elements.activeRoomsCountLabel.textContent = 'Salas disponibles';
      } else if (count === 1) {
        this.elements.activeRoomsCountLabel.textContent = '1 sala disponible';
      } else {
        this.elements.activeRoomsCountLabel.textContent = `${count} salas disponibles`;
      }
    }

    // Unified pill inside active game session
    if (this.elements.navRoomsAvailableTag) {
      if (count > 0) {
        this.elements.navRoomsAvailableTag.classList.remove('is-hidden');
        this.elements.navRoomsAvailableTag.textContent = `${count} ${count === 1 ? 'disponible' : 'disponibles'}`;
      } else {
        this.elements.navRoomsAvailableTag.classList.add('is-hidden');
      }
    }

    if (this.elements.activeRoomsBanner) {
      if (count > 0 && isRoomSelected) {
        this.elements.activeRoomsBanner.classList.remove('is-hidden');
        if (this.elements.activeRoomsBannerText) {
          this.elements.activeRoomsBannerText.textContent =
            count === 1
              ? 'Tienes 1 sala activa en tu dispositivo.'
              : `Tienes ${count} salas activas en tu dispositivo.`;
        }
      } else {
        this.elements.activeRoomsBanner.classList.add('is-hidden');
      }
    }
  }
}
