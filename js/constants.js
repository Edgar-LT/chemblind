/**
 * @file constants.js
 * @description Enumeraciones, metadatos y constantes globales de ChemBlind.
 */

export const GAME_MODES = Object.freeze({
  PRESENCIAL: 'presencial',
  ONLINE: 'online'
});

export const MODE_METADATA = Object.freeze({
  [GAME_MODES.PRESENCIAL]: {
    id: GAME_MODES.PRESENCIAL,
    name: 'Modo Presencial',
    shortLabel: 'Presencial',
    description: 'Preguntas para romper el hielo, conocerse mejor y pequeños retos en persona.'
  },
  [GAME_MODES.ONLINE]: {
    id: GAME_MODES.ONLINE,
    name: 'Modo Online',
    shortLabel: 'Online',
    description: 'Preguntas interactivas, intuición y dinámicas pensadas para jugar a distancia o por chat.'
  }
});

export const INTENSITY_LEVELS = Object.freeze({
  ICEBREAKER: 1,
  DEEP: 2,
  SPARK: 3
});

export const CARD_CATEGORIES = Object.freeze({
  QUESTION: 'question',
  CHALLENGE: 'challenge',
  GUESS: 'guess',
  CONFESSION: 'confession'
});

export const LEVEL_METADATA = Object.freeze({
  [INTENSITY_LEVELS.ICEBREAKER]: {
    id: 1,
    roman: 'I',
    name: 'Romper el Hielo',
    badge: 'NIVEL I · APERTURA'
  },
  [INTENSITY_LEVELS.DEEP]: {
    id: 2,
    roman: 'II',
    name: 'Conexión Profunda',
    badge: 'NIVEL II · INTIMIDAD'
  },
  [INTENSITY_LEVELS.SPARK]: {
    id: 3,
    roman: 'III',
    name: 'Tensión & Chispa',
    badge: 'NIVEL III · MAGNETISMO'
  }
});

export const CATEGORY_LABELS = Object.freeze({
  [CARD_CATEGORIES.QUESTION]: 'Pregunta',
  [CARD_CATEGORIES.CHALLENGE]: 'Reto en Persona',
  [CARD_CATEGORIES.GUESS]: 'Dinámica Interactiva',
  [CARD_CATEGORIES.CONFESSION]: 'Confesión Directa'
});

export const INITIAL_WILDCARDS = 2;
export const CHEMISTRY_MAX = 100;
export const CHEMISTRY_MIN = 0;
