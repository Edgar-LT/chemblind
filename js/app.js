/**
 * @file app.js
 * @description Clean, minimal UI controller for "CHEMBLIND — Chemistry Unfiltered".
 * Starts at the player & mode setup screen (`presencial` vs `online`) and transitions
 * into a focused single-card stage.
 */

import {
  GAME_MODES,
  MODE_METADATA,
  INTENSITY_LEVELS,
  LEVEL_METADATA,
  CATEGORY_LABELS,
  createInitialGameState,
  formatCardPrompt,
  completeCurrentTurn,
  useWildcardSkip,
  setIntensityLevel,
  addCustomCardToState,
  clampNumber
} from './engine.js';

const STORAGE_KEY_CUSTOM_CARDS = 'heure_confidentielle_custom_cards_v1';
const STORAGE_KEY_THEME = 'heure_confidentielle_theme_v1';

class ConexionAppController {
  constructor() {
    this.state = null;
    this.savedCustomCards = [];
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

  init() {
    this.cacheElements();
    this.loadStoredPreferences();
    this.bindEvents();
  }

  cacheElements() {
    const byId = (id) => document.getElementById(id);
    this.elements = {
      // Top Navigation
      changePlayersBtn: byId('change-players-btn'),
      navPlayersLabel: byId('nav-players-label'),
      navModeBadge: byId('nav-mode-badge'),
      openCustomModalBtn: byId('open-custom-modal-btn'),
      themeToggleBtn: byId('theme-toggle-btn'),
      themeLabel: byId('theme-label'),

      // View 1: Onboarding Setup Screen
      onboardingScreen: byId('onboarding-screen'),
      onboardingForm: byId('onboarding-form'),
      setupP1Input: byId('setup-p1-input'),
      setupP2Input: byId('setup-p2-input'),

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

      // Inline Timer (visible only on timed challenge cards)
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

    // Onboarding Submit -> Start Game
    this.elements.onboardingForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      const p1 = this.elements.setupP1Input?.value.trim() || '';
      const p2 = this.elements.setupP2Input?.value.trim() || '';

      if (!p1 || !p2) {
        this.showToast('Escribe ambos nombres para comenzar');
        return;
      }

      const modeRadio = document.querySelector('input[name="gameMode"]:checked');
      const selectedMode =
        modeRadio?.value === GAME_MODES.ONLINE
          ? GAME_MODES.ONLINE
          : GAME_MODES.PRESENCIAL;

      const levelRadio = document.querySelector('input[name="initialLevel"]:checked');
      const initialLevel = Number(levelRadio?.value) || INTENSITY_LEVELS.ICEBREAKER;

      this.startNewSession(p1, p2, selectedMode, initialLevel);
    });

    // Return to Setup Screen to change players or mode
    this.elements.changePlayersBtn?.addEventListener('click', () => {
      this.stopChronograph();
      this.elements.gameScreen?.classList.add('is-hidden');
      this.elements.changePlayersBtn?.classList.add('is-hidden');
      this.elements.openCustomModalBtn?.classList.add('is-hidden');
      this.elements.onboardingScreen?.classList.remove('is-hidden');
    });

    // Level selector tabs
    this.elements.levelTabs.forEach((btn) => {
      btn.addEventListener('click', () => {
        if (!this.state) return;
        const targetLevel = Number(btn.getAttribute('data-level-btn'));
        if (targetLevel === this.state.currentLevel) return;

        this.stopChronograph();
        this.state = setIntensityLevel(this.state, targetLevel);
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

  startNewSession(playerOne, playerTwo, gameMode, initialLevel) {
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
     Inline Timer for Live Challenges
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
     Custom Card Creation
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
     Rendering
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

    // Header pill with players & current mode
    if (this.elements.navPlayersLabel) {
      this.elements.navPlayersLabel.textContent = `${p1.name} & ${p2.name}`;
    }
    if (this.elements.navModeBadge) {
      this.elements.navModeBadge.textContent = modeMeta.shortLabel;
    }

    // Share button text adapts to Online vs Presencial
    if (this.elements.shareBtnLabel) {
      this.elements.shareBtnLabel.textContent =
        this.state.gameMode === GAME_MODES.ONLINE
          ? 'Enviar por WhatsApp ↗'
          : 'Compartir ↗';
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

    // Wildcards remaining for current player
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
  const app = new ConexionAppController();
  app.init();
});
