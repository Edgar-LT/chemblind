/**
 * @file engine.js
 * @description Pure domain logic and state transitions for ChemBlind (Chemistry Unfiltered).
 * Re-exports constants and curated card decks, maintaining strict Clean Architecture.
 */

import {
  GAME_MODES,
  MODE_METADATA,
  INTENSITY_LEVELS,
  CARD_CATEGORIES,
  LEVEL_METADATA,
  CATEGORY_LABELS,
  INITIAL_WILDCARDS,
  CHEMISTRY_MAX,
  CHEMISTRY_MIN,
  INITIAL_CHEMISTRY_SCORE,
  MIN_CUSTOM_CARD_LENGTH,
  MAX_CUSTOM_TIMER_SEC,
  DEFAULT_CARD_CHEMISTRY_DELTA
} from './constants.js';

import { DEFAULT_CARDS } from './data/cards.js';

// Re-exportar para compatibilidad hacia atrás
export {
  GAME_MODES,
  MODE_METADATA,
  INTENSITY_LEVELS,
  CARD_CATEGORIES,
  LEVEL_METADATA,
  CATEGORY_LABELS,
  INITIAL_WILDCARDS,
  CHEMISTRY_MAX,
  CHEMISTRY_MIN,
  INITIAL_CHEMISTRY_SCORE,
  MIN_CUSTOM_CARD_LENGTH,
  MAX_CUSTOM_TIMER_SEC,
  DEFAULT_CARD_CHEMISTRY_DELTA,
  DEFAULT_CARDS
};

/**
 * Clamps a numeric value inside [min, max].
 */
export function clampNumber(value, min, max) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return min;
  }
  return Math.min(Math.max(value, min), max);
}

/**
 * Sanitizes user input strings at the boundary.
 */
export function sanitizeString(rawText, maxLength = 240, fallback = '') {
  if (typeof rawText !== 'string') {
    return fallback;
  }
  const trimmed = rawText.trim().replace(/\s+/g, ' ');
  if (trimmed.length === 0) {
    return fallback;
  }
  return trimmed.slice(0, maxLength);
}

/**
 * Interpolates `{active}` and `{other}` placeholders in a card text.
 */
export function formatCardPrompt(template, activeName, otherName) {
  if (typeof template !== 'string') {
    return '';
  }
  const safeActive = sanitizeString(activeName, 32, 'Jugador 1');
  const safeOther = sanitizeString(otherName, 32, 'Jugador 2');
  return template
    .replace(/\{active\}/gi, safeActive)
    .replace(/\{other\}/gi, safeOther)
    .replace(/\{player\}/gi, safeActive)
    .replace(/\{[a-zA-Z0-9_]+\}/g, '');
}

/**
 * Validates and builds a custom card object.
 */
export function createCustomCard({
  text,
  level,
  category,
  mode = 'both',
  timerSeconds = 0,
  hint = ''
}) {
  const cleanText = sanitizeString(text, 220, '');
  if (cleanText.length < MIN_CUSTOM_CARD_LENGTH) {
    throw new Error(`La pregunta o reto debe tener al menos ${MIN_CUSTOM_CARD_LENGTH} caracteres.`);
  }

  const validLevels = Object.values(INTENSITY_LEVELS);
  const safeLevel = validLevels.includes(Number(level))
    ? Number(level)
    : INTENSITY_LEVELS.ICEBREAKER;

  const validCategories = Object.values(CARD_CATEGORIES);
  const safeCategory = validCategories.includes(category)
    ? category
    : CARD_CATEGORIES.QUESTION;

  const modes =
    mode === GAME_MODES.PRESENCIAL
      ? [GAME_MODES.PRESENCIAL]
      : mode === GAME_MODES.ONLINE
      ? [GAME_MODES.ONLINE]
      : [GAME_MODES.PRESENCIAL, GAME_MODES.ONLINE];

  const safeTimer = clampNumber(Number(timerSeconds) || 0, 0, MAX_CUSTOM_TIMER_SEC);
  const defaultHint =
    safeTimer > 0
      ? 'Carta personalizada con reto de tiempo.'
      : 'Pregunta personalizada creada a medida.';

  return Object.freeze({
    id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    level: safeLevel,
    category: safeCategory,
    modes,
    text: cleanText,
    hint: sanitizeString(hint, 140, defaultHint),
    timerSeconds: safeTimer,
    chemistryDelta: safeLevel === 3 ? 13 : safeLevel === 2 ? 10 : DEFAULT_CARD_CHEMISTRY_DELTA,
    isCustom: true
  });
}

/**
 * Deterministically picks an initial card for a newly created room.
 * Ensures both players start on the exact same card.
 * @param {string} gameMode
 * @param {number} level
 * @param {Array<Object>} [customCards]
 * @param {number} [randomSeed]
 * @returns {Object}
 */
export function pickInitialCard(gameMode, level, customCards = [], randomSeed = Math.random()) {
  const allCards = [...customCards, ...DEFAULT_CARDS];
  const candidates = allCards.filter((card) => {
    const matchesLevel = card.level === Number(level);
    const cardModes = Array.isArray(card.modes)
      ? card.modes
      : [GAME_MODES.PRESENCIAL, GAME_MODES.ONLINE];
    const matchesMode = cardModes.includes(gameMode);
    return matchesLevel && matchesMode;
  });

  const list = candidates.length > 0 ? candidates : DEFAULT_CARDS;
  const safeSeed = clampNumber(randomSeed, 0, 0.999999);
  const pickedIndex = Math.floor(safeSeed * list.length);
  return list[pickedIndex] || DEFAULT_CARDS[0];
}

/**
 * Creates a fresh, deterministic initial game state.
 * Supports passing `initialCardId` so both multiplayer sessions guarantee the same card.
 */
export function createInitialGameState(options = {}) {
  const playerOne = sanitizeString(options.playerOne, 28, 'Jugador 1');
  const playerTwo = sanitizeString(options.playerTwo, 28, 'Jugador 2');
  const gameMode =
    options.gameMode === GAME_MODES.ONLINE
      ? GAME_MODES.ONLINE
      : GAME_MODES.PRESENCIAL;
  const initialLevel = [1, 2, 3].includes(Number(options.initialLevel))
    ? Number(options.initialLevel)
    : INTENSITY_LEVELS.ICEBREAKER;
  const customCards = Array.isArray(options.customCards) ? [...options.customCards] : [];

  let initialCard = null;
  if (options.initialCardId) {
    const allPool = [...customCards, ...DEFAULT_CARDS];
    initialCard = allPool.find((c) => c.id === options.initialCardId) || null;
  }

  const baseState = {
    players: [
      { id: 0, name: playerOne, wildcards: INITIAL_WILDCARDS },
      { id: 1, name: playerTwo, wildcards: INITIAL_WILDCARDS }
    ],
    activePlayerIndex: 0,
    gameMode,
    currentLevel: initialLevel,
    chemistryScore: INITIAL_CHEMISTRY_SCORE,
    turnCount: 1,
    completedCardIds: [],
    customCards,
    currentCard: initialCard
  };

  if (initialCard) {
    return {
      ...baseState,
      completedCardIds: [initialCard.id]
    };
  }

  return drawNextCard(baseState, { advanceTurn: false });
}

/**
 * Returns the pool of cards matching both the current `gameMode` and `currentLevel`.
 */
export function getFilteredDeck(state) {
  const allCards = [...state.customCards, ...DEFAULT_CARDS];
  return allCards.filter((card) => {
    const matchesLevel = card.level === state.currentLevel;
    const cardModes = Array.isArray(card.modes)
      ? card.modes
      : [GAME_MODES.PRESENCIAL, GAME_MODES.ONLINE];
    const matchesMode = cardModes.includes(state.gameMode);
    return matchesLevel && matchesMode;
  });
}

/**
 * Selects the next card from the filtered deck, prioritizing unseen cards.
 */
export function drawNextCard(state, options = {}) {
  const { advanceTurn = true, randomSeed = Math.random() } = options;

  const pool = getFilteredDeck(state);
  const unseen = pool.filter(
    (card) =>
      !state.completedCardIds.includes(card.id) &&
      (!state.currentCard || card.id !== state.currentCard.id)
  );

  const candidates =
    unseen.length > 0
      ? unseen
      : pool.filter((card) => !state.currentCard || card.id !== state.currentCard.id);

  const finalList = candidates.length > 0 ? candidates : pool;
  const safeSeed = clampNumber(randomSeed, 0, 0.999999);
  const pickedIndex = Math.floor(safeSeed * finalList.length);
  const nextCard = finalList[pickedIndex] || DEFAULT_CARDS[0];

  const nextActivePlayerIndex = advanceTurn
    ? (state.activePlayerIndex + 1) % state.players.length
    : state.activePlayerIndex;

  return {
    ...state,
    activePlayerIndex: nextActivePlayerIndex,
    turnCount: advanceTurn ? state.turnCount + 1 : state.turnCount,
    currentCard: nextCard
  };
}

/**
 * Completes the current card, increments chemistry affinity, and draws the next card.
 */
export function completeCurrentTurn(state, options = {}) {
  if (!state.currentCard) {
    return drawNextCard(state, { advanceTurn: false });
  }

  const bonus = Number(options.bonusChemistry) || 0;
  const delta = (state.currentCard.chemistryDelta || DEFAULT_CARD_CHEMISTRY_DELTA) + bonus;
  const nextChemistry = clampNumber(
    state.chemistryScore + delta,
    CHEMISTRY_MIN,
    CHEMISTRY_MAX
  );

  const updatedCompleted = state.completedCardIds.includes(state.currentCard.id)
    ? state.completedCardIds
    : [...state.completedCardIds, state.currentCard.id];

  return drawNextCard(
    {
      ...state,
      chemistryScore: nextChemistry,
      completedCardIds: updatedCompleted
    },
    { advanceTurn: true, randomSeed: options.randomSeed }
  );
}

/**
 * Uses a wildcard for the active player to skip the current card without penalty.
 */
export function useWildcardSkip(state, randomSeed = Math.random()) {
  const activePlayer = state.players[state.activePlayerIndex];
  if (!activePlayer || activePlayer.wildcards <= 0) {
    return {
      state,
      used: false,
      reason: `${activePlayer ? activePlayer.name : 'El jugador'} ya no tiene comodines disponibles.`
    };
  }

  const updatedPlayers = state.players.map((player, idx) =>
    idx === state.activePlayerIndex
      ? { ...player, wildcards: player.wildcards - 1 }
      : player
  );

  const nextState = drawNextCard(
    { ...state, players: updatedPlayers },
    { advanceTurn: false, randomSeed }
  );

  return { state: nextState, used: true };
}

/**
 * Changes the intensity level and draws a matching card.
 */
export function setIntensityLevel(state, targetLevel, randomSeed = Math.random()) {
  const validLevels = Object.values(INTENSITY_LEVELS);
  const safeLevel = validLevels.includes(Number(targetLevel))
    ? Number(targetLevel)
    : state.currentLevel;

  if (safeLevel === state.currentLevel) {
    return state;
  }

  return drawNextCard(
    { ...state, currentLevel: safeLevel },
    { advanceTurn: false, randomSeed }
  );
}

/**
 * Switches between `presencial` and `online` mode dynamically and draws a matching card.
 */
export function setGameMode(state, targetMode, randomSeed = Math.random()) {
  const safeMode =
    targetMode === GAME_MODES.ONLINE ? GAME_MODES.ONLINE : GAME_MODES.PRESENCIAL;

  if (safeMode === state.gameMode) {
    return state;
  }

  return drawNextCard(
    { ...state, gameMode: safeMode },
    { advanceTurn: false, randomSeed }
  );
}

/**
 * Adds a newly created custom card to the deck and sets it as the active card.
 */
export function addCustomCardToState(state, cardParams, playImmediately = true) {
  const newCard = createCustomCard({
    ...cardParams,
    mode: state.gameMode
  });
  const updatedCustomCards = [newCard, ...state.customCards];

  const nextState = {
    ...state,
    customCards: updatedCustomCards,
    currentLevel: playImmediately ? newCard.level : state.currentLevel,
    currentCard: playImmediately ? newCard : state.currentCard
  };

  return { state: nextState, card: newCard };
}
