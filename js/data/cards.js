/**
 * @file data/cards.js
 * @description Curated deck of 165 cards for ChemBlind tagged by level and mode.
 * Extracted from engine.js to ensure strict separation of content and domain logic.
 */

import { GAME_MODES, INTENSITY_LEVELS, CARD_CATEGORIES } from '../constants.js';

export const DEFAULT_CARDS = Object.freeze([
  // =========================================================================
  // NIVEL I · ROMPER EL HIELO (ICEBREAKER)
  // =========================================================================
  {
    id: 'l1-both-1',
    level: INTENSITY_LEVELS.ICEBREAKER,
    category: CARD_CATEGORIES.GUESS,
    modes: [GAME_MODES.PRESENCIAL, GAME_MODES.ONLINE],
    text: 'Sin preguntar nada primero: adivina cuál sería el plan perfecto de {other} un domingo a las 7:00 PM.',
    hint: 'Luego {other} revela del 1 al 10 qué tan cerca estuviste.',
    timerSeconds: 0,
    chemistryDelta: 7
  },
  {
    id: 'l1-both-2',
    level: INTENSITY_LEVELS.ICEBREAKER,
    category: CARD_CATEGORIES.QUESTION,
    modes: [GAME_MODES.PRESENCIAL, GAME_MODES.ONLINE],
    text: 'Si tuvieras que describir la personalidad de {other} como una ciudad del mundo, una canción o una bebida, ¿cuál elegirías y por qué?',
    hint: 'Déjate llevar por tu primera intuición.',
    timerSeconds: 0,
    chemistryDelta: 6
  },
  {
    id: 'l1-both-3',
    level: INTENSITY_LEVELS.ICEBREAKER,
    category: CARD_CATEGORIES.CONFESSION,
    modes: [GAME_MODES.PRESENCIAL, GAME_MODES.ONLINE],
    text: 'Confiesa una "bandera verde" (green flag) que ya hayas notado en {other} desde que empezaron a hablar.',
    hint: 'Esos pequeños detalles que dan buena espina desde el inicio.',
    timerSeconds: 0,
    chemistryDelta: 8
  },
  {
    id: 'l1-both-4',
    level: INTENSITY_LEVELS.ICEBREAKER,
    category: CARD_CATEGORIES.GUESS,
    modes: [GAME_MODES.PRESENCIAL, GAME_MODES.ONLINE],
    text: 'Dos verdades y una mentira: cuenta tres anécdotas breves sobre ti. {other} debe adivinar cuál es la falsa.',
    hint: 'Haz que la mentira suene totalmente creíble.',
    timerSeconds: 0,
    chemistryDelta: 8
  },

  // --- Exclusivas Modo Presencial (Nivel I · 15 Pequeños Retos para Romper el Hielo) ---
  {
    id: 'l1-pres-1',
    level: INTENSITY_LEVELS.ICEBREAKER,
    category: CARD_CATEGORIES.QUESTION,
    modes: [GAME_MODES.PRESENCIAL],
    text: '¿Cuál fue el primer detalle sutil que notaste de {other} en los primeros cinco minutos de verse hoy en persona?',
    hint: 'Un gesto, su forma de caminar, la voz o su estilo.',
    timerSeconds: 0,
    chemistryDelta: 7
  },
  {
    id: 'l1-pres-2',
    level: INTENSITY_LEVELS.ICEBREAKER,
    category: CARD_CATEGORIES.CHALLENGE,
    modes: [GAME_MODES.PRESENCIAL],
    text: 'Duelo de miradas: mírense de frente sin hablar durante 20 segundos. El primero en reírse o desviar la mirada debe hacer un cumplido honesto.',
    hint: 'Usa el cronómetro integrado cuando estén listos.',
    timerSeconds: 20,
    chemistryDelta: 9
  },
  {
    id: 'l1-pres-3',
    level: INTENSITY_LEVELS.ICEBREAKER,
    category: CARD_CATEGORIES.CHALLENGE,
    modes: [GAME_MODES.PRESENCIAL],
    text: 'Intercambio musical: muéstrale a {other} en tu pantalla la última canción que escuchaste hoy y cuéntale por qué la pusiste.',
    hint: 'Prohibido esconder gustos culposos.',
    timerSeconds: 0,
    chemistryDelta: 7
  },
  {
    id: 'l1-pres-4',
    level: INTENSITY_LEVELS.ICEBREAKER,
    category: CARD_CATEGORIES.CHALLENGE,
    modes: [GAME_MODES.PRESENCIAL],
    text: 'Duelo de pulgares: jueguen una partida rápida de guerra de pulgares. Quien gane tiene derecho a hacerle una pregunta libre a {other}.',
    hint: 'La excusa perfecta para romper la barrera del contacto físico.',
    timerSeconds: 20,
    chemistryDelta: 9
  },
  {
    id: 'l1-pres-5',
    level: INTENSITY_LEVELS.ICEBREAKER,
    category: CARD_CATEGORIES.CHALLENGE,
    modes: [GAME_MODES.PRESENCIAL],
    text: 'Lectura de manos improvisada: toma la mano de {other} durante 20 segundos e inventa una "predicción" divertida sobre su futuro o sobre esta cita.',
    hint: 'No hace falta saber quiromancia, solo usar la creatividad.',
    timerSeconds: 20,
    chemistryDelta: 9
  },
  {
    id: 'l1-pres-6',
    level: INTENSITY_LEVELS.ICEBREAKER,
    category: CARD_CATEGORIES.CHALLENGE,
    modes: [GAME_MODES.PRESENCIAL],
    text: 'Brindis con intención: choquen sus vasos (o sus manos si no tienen bebida) y digan al mismo tiempo una sola palabra de lo que esperan de hoy.',
    hint: 'A la cuenta de tres, sin pensarlo.',
    timerSeconds: 0,
    chemistryDelta: 8
  },
  {
    id: 'l1-pres-7',
    level: INTENSITY_LEVELS.ICEBREAKER,
    category: CARD_CATEGORIES.CHALLENGE,
    modes: [GAME_MODES.PRESENCIAL],
    text: 'Adivina el perfume: acércate un poco a {other} para percibir su aroma o perfume y descríbelo con tres palabras o di a qué te recuerda.',
    hint: 'Un reto sutil de cercanía para romper el hielo.',
    timerSeconds: 0,
    chemistryDelta: 10
  },
  {
    id: 'l1-pres-8',
    level: INTENSITY_LEVELS.ICEBREAKER,
    category: CARD_CATEGORIES.CHALLENGE,
    modes: [GAME_MODES.PRESENCIAL],
    text: 'Reto del espejo: durante los próximos 20 segundos, imita disimuladamente la postura y los gestos de {other} mientras te cuenta algo breve.',
    hint: 'Risas garantizadas para soltar los nervios.',
    timerSeconds: 20,
    chemistryDelta: 8
  },
  {
    id: 'l1-pres-9',
    level: INTENSITY_LEVELS.ICEBREAKER,
    category: CARD_CATEGORIES.CHALLENGE,
    modes: [GAME_MODES.PRESENCIAL],
    text: 'Piedra, papel o tijera al mejor de tres: quien pierda debe confesar qué fue lo primero que pensó cuando vio llegar a {other} hoy.',
    hint: 'Sin revanchas: el que pierde confiesa.',
    timerSeconds: 0,
    chemistryDelta: 9
  },
  {
    id: 'l1-pres-10',
    level: INTENSITY_LEVELS.ICEBREAKER,
    category: CARD_CATEGORIES.CHALLENGE,
    modes: [GAME_MODES.PRESENCIAL],
    text: 'Foto espontánea: tómense una foto juntos ahora mismo haciendo un gesto divertido o espontáneo (queda prohibido borrarla o repetirla).',
    hint: 'El primer recuerdo oficial de esta partida.',
    timerSeconds: 0,
    chemistryDelta: 9
  },
  {
    id: 'l1-pres-11',
    level: INTENSITY_LEVELS.ICEBREAKER,
    category: CARD_CATEGORIES.CHALLENGE,
    modes: [GAME_MODES.PRESENCIAL],
    text: 'Comparación de manos: junten sus palmas frente a frente para ver quién tiene la mano más grande o más cálida en este momento.',
    hint: 'Simple, natural y directo.',
    timerSeconds: 0,
    chemistryDelta: 9
  },
  {
    id: 'l1-pres-12',
    level: INTENSITY_LEVELS.ICEBREAKER,
    category: CARD_CATEGORIES.CHALLENGE,
    modes: [GAME_MODES.PRESENCIAL],
    text: 'Memoria visual: cierra los ojos ahora mismo y describe de memoria de qué color son los ojos y qué lleva puesto {other} hoy.',
    hint: 'Prohibido abrir los ojos hasta terminar la descripción.',
    timerSeconds: 0,
    chemistryDelta: 8
  },
  {
    id: 'l1-pres-13',
    level: INTENSITY_LEVELS.ICEBREAKER,
    category: CARD_CATEGORIES.CHALLENGE,
    modes: [GAME_MODES.PRESENCIAL],
    text: 'Cambio de perspectiva: intercambien de silla o siéntense un poco más cerca el uno del otro durante los próximos tres turnos.',
    hint: 'Cambiar de lugar cambia la energía de la charla.',
    timerSeconds: 0,
    chemistryDelta: 9
  },
  {
    id: 'l1-pres-14',
    level: INTENSITY_LEVELS.ICEBREAKER,
    category: CARD_CATEGORIES.CHALLENGE,
    modes: [GAME_MODES.PRESENCIAL],
    text: 'Tres cumplidos en 20 segundos: di tres cosas que te hayan gustado de la personalidad o del aspecto de {other} antes de que se acabe el tiempo.',
    hint: 'Activa el reloj: la rapidez hace que salga lo más sincero.',
    timerSeconds: 20,
    chemistryDelta: 10
  },
  {
    id: 'l1-pres-15',
    level: INTENSITY_LEVELS.ICEBREAKER,
    category: CARD_CATEGORIES.CHALLENGE,
    modes: [GAME_MODES.PRESENCIAL],
    text: 'Dibujo a ciegas: usando solo un dedo, dibuja una palabra corta o símbolo en la palma o el brazo de {other} para que adivine qué es.',
    hint: '{other} tiene dos oportunidades para adivinar.',
    timerSeconds: 20,
    chemistryDelta: 10
  },

  // --- Preguntas para Romper el Hielo (Nivel I · Compartidas Online + Presencial, y Exclusivas Online) ---
  {
    id: 'l1-onl-1',
    level: INTENSITY_LEVELS.ICEBREAKER,
    category: CARD_CATEGORIES.GUESS,
    modes: [GAME_MODES.PRESENCIAL, GAME_MODES.ONLINE],
    text: 'Dinámica de galería: busca la última foto normal que tomaste con tu móvil (sin hacer trampa) y cuéntale a {other} la historia detrás de ella.',
    hint: 'Las fotos cotidianas cuentan las mejores historias.',
    timerSeconds: 0,
    chemistryDelta: 8
  },
  {
    id: 'l1-onl-2',
    level: INTENSITY_LEVELS.ICEBREAKER,
    category: CARD_CATEGORIES.QUESTION,
    modes: [GAME_MODES.PRESENCIAL, GAME_MODES.ONLINE],
    text: '¿Qué fue lo primero que te llamó la atención de {other} para que tuvieras ganas de conocerlo/a mejor?',
    hint: 'Sé totalmente sincero sobre tu primera impresión.',
    timerSeconds: 0,
    chemistryDelta: 7
  },
  {
    id: 'l1-onl-3',
    level: INTENSITY_LEVELS.ICEBREAKER,
    category: CARD_CATEGORIES.GUESS,
    modes: [GAME_MODES.ONLINE],
    text: 'Adivina cómo está vestido/a o en qué rincón de su casa está {other} ahora mismo. Luego {other} confirma cuántos detalles acertaste.',
    hint: 'Juega a ser detective a distancia.',
    timerSeconds: 0,
    chemistryDelta: 7
  },
  {
    id: 'l1-onl-4',
    level: INTENSITY_LEVELS.ICEBREAKER,
    category: CARD_CATEGORIES.QUESTION,
    modes: [GAME_MODES.PRESENCIAL, GAME_MODES.ONLINE],
    text: '¿Cuáles son los 3 emojis que más usas recientemente en tu teclado y qué revelan de tu humor de esta semana?',
    hint: 'Míralos ahora mismo en tus recientes sin hacer trampa.',
    timerSeconds: 0,
    chemistryDelta: 6
  },
  {
    id: 'l1-onl-5',
    level: INTENSITY_LEVELS.ICEBREAKER,
    category: CARD_CATEGORIES.QUESTION,
    modes: [GAME_MODES.PRESENCIAL, GAME_MODES.ONLINE],
    text: 'Cuando alguien te interesa, ¿eres de responder los mensajes al segundo, de mandar audios largos o de hacerte un poco el/la interesante?',
    hint: '{other} puede juzgar si se nota o no.',
    timerSeconds: 0,
    chemistryDelta: 7
  },
  {
    id: 'l1-onl-6',
    level: INTENSITY_LEVELS.ICEBREAKER,
    category: CARD_CATEGORIES.GUESS,
    modes: [GAME_MODES.PRESENCIAL, GAME_MODES.ONLINE],
    text: 'Adivina si {other} es más de café por la mañana o de quedarse despierto/a hasta la madrugada hablando.',
    hint: 'Explica por qué te da esa vibra.',
    timerSeconds: 0,
    chemistryDelta: 6
  },
  {
    id: 'l1-onl-7',
    level: INTENSITY_LEVELS.ICEBREAKER,
    category: CARD_CATEGORIES.QUESTION,
    modes: [GAME_MODES.PRESENCIAL, GAME_MODES.ONLINE],
    text: '¿Cuál es esa canción que siempre pones cuando vas viajando o caminando a solas y quieres sentirte en una película?',
    hint: 'Comparte el nombre con {other}.',
    timerSeconds: 0,
    chemistryDelta: 6
  },
  {
    id: 'l1-onl-8',
    level: INTENSITY_LEVELS.ICEBREAKER,
    category: CARD_CATEGORIES.CONFESSION,
    modes: [GAME_MODES.PRESENCIAL, GAME_MODES.ONLINE],
    text: 'Confiesa cuál es tu mayor "gusto culposo" en series, películas o música que casi nunca admites en una primera cita.',
    hint: 'Aquí no se juzga a nadie.',
    timerSeconds: 0,
    chemistryDelta: 7
  },
  {
    id: 'l1-onl-9',
    level: INTENSITY_LEVELS.ICEBREAKER,
    category: CARD_CATEGORIES.QUESTION,
    modes: [GAME_MODES.PRESENCIAL, GAME_MODES.ONLINE],
    text: 'Si ahora mismo tuvieras que elegir la cena o el postre perfecto para compartir con {other}, ¿qué pedirías para sorprenderlo/a?',
    hint: 'La comida dice mucho de una buena cita.',
    timerSeconds: 0,
    chemistryDelta: 6
  },
  {
    id: 'l1-onl-10',
    level: INTENSITY_LEVELS.ICEBREAKER,
    category: CARD_CATEGORIES.GUESS,
    modes: [GAME_MODES.PRESENCIAL, GAME_MODES.ONLINE],
    text: 'Sin que te dé pistas: adivina qué serie, película o tipo de videos suele ver {other} antes de quedarse dormido/a.',
    hint: '{other} te dice qué tan frío o caliente estás.',
    timerSeconds: 0,
    chemistryDelta: 7
  },
  {
    id: 'l1-onl-11',
    level: INTENSITY_LEVELS.ICEBREAKER,
    category: CARD_CATEGORIES.QUESTION,
    modes: [GAME_MODES.PRESENCIAL, GAME_MODES.ONLINE],
    text: '¿Qué detalle en un mensaje o nota de voz hace que sonrías inmediatamente mirando la pantalla del teléfono?',
    hint: 'Toma nota mental de la respuesta.',
    timerSeconds: 0,
    chemistryDelta: 7
  },
  {
    id: 'l1-onl-12',
    level: INTENSITY_LEVELS.ICEBREAKER,
    category: CARD_CATEGORIES.QUESTION,
    modes: [GAME_MODES.PRESENCIAL, GAME_MODES.ONLINE],
    text: 'Si mañana tuvieras el día completamente libre y presupuesto ilimitado, ¿a qué lugar invitarías a {other}?',
    hint: 'Vale desde un rincón escondido de la ciudad hasta otro país.',
    timerSeconds: 0,
    chemistryDelta: 7
  },
  {
    id: 'l1-onl-13',
    level: INTENSITY_LEVELS.ICEBREAKER,
    category: CARD_CATEGORIES.GUESS,
    modes: [GAME_MODES.PRESENCIAL, GAME_MODES.ONLINE],
    text: 'Adivina cómo era {other} en la época del colegio o la universidad: ¿el alma de la fiesta, el/la aplicado/a o el/la rebelde silencioso/a?',
    hint: '{other} revela la verdad con una anécdota.',
    timerSeconds: 0,
    chemistryDelta: 7
  },
  {
    id: 'l1-onl-14',
    level: INTENSITY_LEVELS.ICEBREAKER,
    category: CARD_CATEGORIES.CONFESSION,
    modes: [GAME_MODES.PRESENCIAL, GAME_MODES.ONLINE],
    text: '¿Cuál ha sido la excusa más creativa o divertida que has usado para acercarte o hablarle a alguien que te llamaba la atención?',
    hint: 'Se vale confesar si alguna vez aplicaste una con {other}.',
    timerSeconds: 0,
    chemistryDelta: 8
  },
  {
    id: 'l1-onl-15',
    level: INTENSITY_LEVELS.ICEBREAKER,
    category: CARD_CATEGORIES.QUESTION,
    modes: [GAME_MODES.PRESENCIAL, GAME_MODES.ONLINE],
    text: 'Elige algo que lleves puesto o traigas contigo hoy (un reloj, anillo, prenda o fondo de pantalla): ¿qué historia tiene o por qué te gusta?',
    hint: 'Los pequeños objetos siempre guardan una historia.',
    timerSeconds: 0,
    chemistryDelta: 6
  },
  {
    id: 'l1-onl-16',
    level: INTENSITY_LEVELS.ICEBREAKER,
    category: CARD_CATEGORIES.QUESTION,
    modes: [GAME_MODES.PRESENCIAL, GAME_MODES.ONLINE],
    text: '¿Qué prefieres en una cita: un lugar tranquilo para hablar durante horas o un plan espontáneo con actividad y movimiento?',
    hint: 'Ideal para saber cómo conectan mejor.',
    timerSeconds: 0,
    chemistryDelta: 7
  },
  {
    id: 'l1-onl-17',
    level: INTENSITY_LEVELS.ICEBREAKER,
    category: CARD_CATEGORIES.GUESS,
    modes: [GAME_MODES.PRESENCIAL, GAME_MODES.ONLINE],
    text: 'Por la energía que transmite {other}, adivina en qué estación del año o en qué mes crees que cumple años.',
    hint: 'Veamos qué tan afinada está tu intuición.',
    timerSeconds: 0,
    chemistryDelta: 6
  },
  {
    id: 'l1-onl-18',
    level: INTENSITY_LEVELS.ICEBREAKER,
    category: CARD_CATEGORIES.QUESTION,
    modes: [GAME_MODES.PRESENCIAL, GAME_MODES.ONLINE],
    text: '¿Cuál es el talento más curioso o inútil que tienes y que casi nadie descubre hasta que te conoce bien?',
    hint: 'Imitar voces, adivinar canciones en 2 segundos, cocinar algo raro...',
    timerSeconds: 0,
    chemistryDelta: 6
  },
  {
    id: 'l1-onl-19',
    level: INTENSITY_LEVELS.ICEBREAKER,
    category: CARD_CATEGORIES.CONFESSION,
    modes: [GAME_MODES.PRESENCIAL, GAME_MODES.ONLINE],
    text: 'Sé sincero/a: antes de empezar a salir o hablar bien con {other}, ¿le hiciste un pequeño "stalkeo" a sus fotos o redes?',
    hint: 'Y si la respuesta es sí, ¿qué pensaste?',
    timerSeconds: 0,
    chemistryDelta: 8
  },
  {
    id: 'l1-onl-20',
    level: INTENSITY_LEVELS.ICEBREAKER,
    category: CARD_CATEGORIES.QUESTION,
    modes: [GAME_MODES.PRESENCIAL, GAME_MODES.ONLINE],
    text: '¿Qué es lo que más te hace reír en una conversación: el sarcasmo fino, el humor absurdo o las anécdotas desastrosas?',
    hint: 'Pon a prueba el sentido del humor de ambos.',
    timerSeconds: 0,
    chemistryDelta: 6
  },
  {
    id: 'l1-onl-21',
    level: INTENSITY_LEVELS.ICEBREAKER,
    category: CARD_CATEGORIES.GUESS,
    modes: [GAME_MODES.PRESENCIAL, GAME_MODES.ONLINE],
    text: 'Si {other} fuera un personaje de película o serie famosa, ¿quién sería según la impresión que te ha dado hasta ahora?',
    hint: 'Explica qué rasgo tienen en común.',
    timerSeconds: 0,
    chemistryDelta: 7
  },
  {
    id: 'l1-onl-22',
    level: INTENSITY_LEVELS.ICEBREAKER,
    category: CARD_CATEGORIES.QUESTION,
    modes: [GAME_MODES.PRESENCIAL, GAME_MODES.ONLINE],
    text: '¿Cuál es la última búsqueda rara o curiosa que hiciste en Google o YouTube a las 2 de la mañana?',
    hint: 'Esas dudas existenciales de medianoche.',
    timerSeconds: 0,
    chemistryDelta: 7
  },
  {
    id: 'l1-onl-23',
    level: INTENSITY_LEVELS.ICEBREAKER,
    category: CARD_CATEGORIES.QUESTION,
    modes: [GAME_MODES.PRESENCIAL, GAME_MODES.ONLINE],
    text: 'Si tuvieras que elegir entre viajar al pasado a un concierto histórico o viajar al futuro 50 años, ¿qué elegirías y por qué?',
    hint: 'Una pregunta clásica que revela mucho de tus gustos.',
    timerSeconds: 0,
    chemistryDelta: 6
  },
  {
    id: 'l1-onl-24',
    level: INTENSITY_LEVELS.ICEBREAKER,
    category: CARD_CATEGORIES.GUESS,
    modes: [GAME_MODES.PRESENCIAL, GAME_MODES.ONLINE],
    text: 'Adivina cuál es el plato de comida favorito de {other} cuando quiere darse un gusto el fin de semana.',
    hint: 'Tienes dos intentos para acertar.',
    timerSeconds: 0,
    chemistryDelta: 6
  },
  {
    id: 'l1-onl-25',
    level: INTENSITY_LEVELS.ICEBREAKER,
    category: CARD_CATEGORIES.CONFESSION,
    modes: [GAME_MODES.PRESENCIAL, GAME_MODES.ONLINE],
    text: '¿Qué cosa pequeña te conquista de inmediato cuando estás conociendo a alguien (la voz, que recuerde detalles, la mirada, el humor)?',
    hint: 'Pista directa para {other}.',
    timerSeconds: 0,
    chemistryDelta: 8
  },
  {
    id: 'l1-onl-26',
    level: INTENSITY_LEVELS.ICEBREAKER,
    category: CARD_CATEGORIES.QUESTION,
    modes: [GAME_MODES.PRESENCIAL, GAME_MODES.ONLINE],
    text: '¿Eres más de planear todo con agenda o de decir "vamos a ver qué sale hoy" a último minuto?',
    hint: 'Descubran si son polos opuestos o iguales.',
    timerSeconds: 0,
    chemistryDelta: 6
  },
  {
    id: 'l1-onl-27',
    level: INTENSITY_LEVELS.ICEBREAKER,
    category: CARD_CATEGORIES.GUESS,
    modes: [GAME_MODES.PRESENCIAL, GAME_MODES.ONLINE],
    text: 'Reto de intuición rápida: ¿crees que {other} es más de playa al atardecer, cabaña en la montaña o terraza en una gran ciudad?',
    hint: '{other} confirma cuál es su lugar ideal.',
    timerSeconds: 0,
    chemistryDelta: 7
  },
  {
    id: 'l1-onl-28',
    level: INTENSITY_LEVELS.ICEBREAKER,
    category: CARD_CATEGORIES.QUESTION,
    modes: [GAME_MODES.PRESENCIAL, GAME_MODES.ONLINE],
    text: '¿Cuál ha sido el mejor viaje o escapada improvisada que has hecho hasta ahora y qué lo hizo tan especial?',
    hint: 'Comparte tu mejor recuerdo de aventura.',
    timerSeconds: 0,
    chemistryDelta: 6
  },
  {
    id: 'l1-onl-29',
    level: INTENSITY_LEVELS.ICEBREAKER,
    category: CARD_CATEGORIES.CONFESSION,
    modes: [GAME_MODES.PRESENCIAL, GAME_MODES.ONLINE],
    text: 'En una escala del 1 al 10, ¿qué tan bueno/a te consideras coqueteando o dando el primer paso cuando alguien te gusta?',
    hint: '{other} tiene derecho a darte su propia calificación.',
    timerSeconds: 0,
    chemistryDelta: 8
  },
  {
    id: 'l1-onl-30',
    level: INTENSITY_LEVELS.ICEBREAKER,
    category: CARD_CATEGORIES.QUESTION,
    modes: [GAME_MODES.PRESENCIAL, GAME_MODES.ONLINE],
    text: '¿Qué canción, película o libro te gustó tanto que siempre terminas recomendándoselo a alguien que te importa?',
    hint: 'La mejor forma de conocer el mundo interior de alguien.',
    timerSeconds: 0,
    chemistryDelta: 6
  },
  {
    id: 'l1-onl-31',
    level: INTENSITY_LEVELS.ICEBREAKER,
    category: CARD_CATEGORIES.GUESS,
    modes: [GAME_MODES.PRESENCIAL, GAME_MODES.ONLINE],
    text: 'Adivina qué es lo primero que hace {other} apenas se despierta por la mañana (además de apagar la alarma).',
    hint: 'Mirar notificaciones, estirar, buscar café, quedarse 20 min más...',
    timerSeconds: 0,
    chemistryDelta: 6
  },
  {
    id: 'l1-onl-32',
    level: INTENSITY_LEVELS.ICEBREAKER,
    category: CARD_CATEGORIES.QUESTION,
    modes: [GAME_MODES.PRESENCIAL, GAME_MODES.ONLINE],
    text: '¿Cuál es tu opinión más impopular sobre comida, cine o música que siempre genera debate con tus amigos?',
    hint: 'Veamos si {other} está de tu lado o en contra.',
    timerSeconds: 0,
    chemistryDelta: 7
  },
  {
    id: 'l1-onl-33',
    level: INTENSITY_LEVELS.ICEBREAKER,
    category: CARD_CATEGORIES.QUESTION,
    modes: [GAME_MODES.PRESENCIAL, GAME_MODES.ONLINE],
    text: 'Si pudieras aprender instantáneamente cualquier habilidad (un idioma, un instrumento, un deporte, bailar), ¿cuál elegirías?',
    hint: 'Y cuenta por qué siempre te ha llamado la atención.',
    timerSeconds: 0,
    chemistryDelta: 6
  },
  {
    id: 'l1-onl-34',
    level: INTENSITY_LEVELS.ICEBREAKER,
    category: CARD_CATEGORIES.CONFESSION,
    modes: [GAME_MODES.PRESENCIAL, GAME_MODES.ONLINE],
    text: '¿Qué fue lo que pensaste justo cuando {other} te propuso o aceptó jugar a estas preguntas hoy?',
    hint: 'Sé totalmente honesto/a.',
    timerSeconds: 0,
    chemistryDelta: 8
  },
  {
    id: 'l1-onl-35',
    level: INTENSITY_LEVELS.ICEBREAKER,
    category: CARD_CATEGORIES.GUESS,
    modes: [GAME_MODES.PRESENCIAL, GAME_MODES.ONLINE],
    text: 'Adivina cómo te tiene agendado/a {other} en su teléfono o qué apodo te pondría si tuviera que elegir uno hoy.',
    hint: 'Si aún no tiene apodo, es buen momento para elegir uno.',
    timerSeconds: 0,
    chemistryDelta: 8
  },
  {
    id: 'l1-onl-36',
    level: INTENSITY_LEVELS.ICEBREAKER,
    category: CARD_CATEGORIES.QUESTION,
    modes: [GAME_MODES.ONLINE],
    text: '¿Qué prefieres cuando estás conociendo a alguien a distancia: mensajes durante el día, notas de voz o una llamada nocturna sin prisa?',
    hint: 'Para saber cómo conectan mejor.',
    timerSeconds: 0,
    chemistryDelta: 7
  },

  // =========================================================================
  // NIVEL II · CONEXIÓN PROFUNDA (DEEP · ~40 Preguntas + 15 Retos Presenciales)
  // =========================================================================
  {
    id: 'l2-both-1',
    level: INTENSITY_LEVELS.DEEP,
    category: CARD_CATEGORIES.QUESTION,
    modes: [GAME_MODES.PRESENCIAL, GAME_MODES.ONLINE],
    text: '¿Qué parte de tu personalidad suele malinterpretar la gente al principio, pero esperas que {other} sí logre entender de verdad?',
    hint: 'A veces la timidez parece distancia, o la calma parece desinterés.',
    timerSeconds: 0,
    chemistryDelta: 9
  },
  {
    id: 'l2-both-2',
    level: INTENSITY_LEVELS.DEEP,
    category: CARD_CATEGORIES.CONFESSION,
    modes: [GAME_MODES.PRESENCIAL, GAME_MODES.ONLINE],
    text: 'Si pudieras saber con certeza lo que {other} está pensando sobre ti en este minuto, ¿qué pregunta te daría más curiosidad hacerle?',
    hint: 'Puedes hacerla al aire... y {other} decide si la responde ya.',
    timerSeconds: 0,
    chemistryDelta: 10
  },
  {
    id: 'l2-both-3',
    level: INTENSITY_LEVELS.DEEP,
    category: CARD_CATEGORIES.QUESTION,
    modes: [GAME_MODES.PRESENCIAL, GAME_MODES.ONLINE],
    text: '¿Cuál ha sido el momento exacto de esta conversación en el que sentiste que entraste en confianza con {other}?',
    hint: 'Identifica el punto donde la charla dejó de sentirse casual.',
    timerSeconds: 0,
    chemistryDelta: 9
  },
  {
    id: 'l2-both-4',
    level: INTENSITY_LEVELS.DEEP,
    category: CARD_CATEGORIES.GUESS,
    modes: [GAME_MODES.PRESENCIAL, GAME_MODES.ONLINE],
    text: 'Adivina cuál es el lenguaje del afecto principal de {other}: ¿tiempo de calidad, contacto físico, palabras bonitas, detalles o actos de servicio?',
    hint: 'Explica por qué lo crees antes de que {other} revele la respuesta.',
    timerSeconds: 0,
    chemistryDelta: 9
  },
  {
    id: 'l2-both-5',
    level: INTENSITY_LEVELS.DEEP,
    category: CARD_CATEGORIES.QUESTION,
    modes: [GAME_MODES.PRESENCIAL, GAME_MODES.ONLINE],
    text: '¿Qué cualidad de {other} sientes que complementa o equilibra algo que a ti te hace falta?',
    hint: 'Piensa en cómo encajan sus dos personalidades.',
    timerSeconds: 0,
    chemistryDelta: 9
  },
  {
    id: 'l2-both-6',
    level: INTENSITY_LEVELS.DEEP,
    category: CARD_CATEGORIES.CONFESSION,
    modes: [GAME_MODES.PRESENCIAL, GAME_MODES.ONLINE],
    text: 'Comparte algo que rara vez cuentas al principio de conocer a alguien porque temes que suene demasiado intenso o idealista.',
    hint: 'La autenticidad es el camino más corto hacia la conexión.',
    timerSeconds: 0,
    chemistryDelta: 10
  },
  {
    id: 'l2-both-7',
    level: INTENSITY_LEVELS.DEEP,
    category: CARD_CATEGORIES.QUESTION,
    modes: [GAME_MODES.PRESENCIAL, GAME_MODES.ONLINE],
    text: '¿Cuál ha sido el cambio personal más importante que has vivido en los últimos dos años y qué aprendiste de él?',
    hint: 'Una mirada a cómo has evolucionado.',
    timerSeconds: 0,
    chemistryDelta: 9
  },
  {
    id: 'l2-both-8',
    level: INTENSITY_LEVELS.DEEP,
    category: CARD_CATEGORIES.GUESS,
    modes: [GAME_MODES.PRESENCIAL, GAME_MODES.ONLINE],
    text: 'Adivina qué es lo que más valora {other} en una relación o vínculo: ¿la lealtad absoluta, la complicidad para reírse, la admiración mutua o la paz mental?',
    hint: '{other} confirma cuál es su prioridad número uno.',
    timerSeconds: 0,
    chemistryDelta: 9
  },
  {
    id: 'l2-both-9',
    level: INTENSITY_LEVELS.DEEP,
    category: CARD_CATEGORIES.QUESTION,
    modes: [GAME_MODES.PRESENCIAL, GAME_MODES.ONLINE],
    text: '¿Cuándo fue la última vez que alguien hizo un gesto por ti que nunca olvidaste, y qué fue exactamente?',
    hint: 'Los detalles que marcan la diferencia.',
    timerSeconds: 0,
    chemistryDelta: 9
  },
  {
    id: 'l2-both-10',
    level: INTENSITY_LEVELS.DEEP,
    category: CARD_CATEGORIES.CONFESSION,
    modes: [GAME_MODES.PRESENCIAL, GAME_MODES.ONLINE],
    text: '¿Qué es lo que más te cuesta demostrar cuando alguien empieza a importarte de verdad: el cariño, los celos, la vulnerabilidad o el miedo a perderlo?',
    hint: 'Sé honesto/a sobre tu coraza.',
    timerSeconds: 0,
    chemistryDelta: 10
  },
  {
    id: 'l2-both-11',
    level: INTENSITY_LEVELS.DEEP,
    category: CARD_CATEGORIES.QUESTION,
    modes: [GAME_MODES.PRESENCIAL, GAME_MODES.ONLINE],
    text: 'Si pudieras volver a vivir una sola noche o un solo día de tu vida tal como ocurrió, ¿cuál elegirías y por qué?',
    hint: 'Un recuerdo que te defina.',
    timerSeconds: 0,
    chemistryDelta: 9
  },
  {
    id: 'l2-both-12',
    level: INTENSITY_LEVELS.DEEP,
    category: CARD_CATEGORIES.GUESS,
    modes: [GAME_MODES.PRESENCIAL, GAME_MODES.ONLINE],
    text: 'Intenta adivinar qué hace {other} cuando tiene un mal día: ¿prefiere aislarse en silencio, salir a distraerse o desahogarse con alguien de confianza?',
    hint: 'Importante saberlo para cuidar al otro.',
    timerSeconds: 0,
    chemistryDelta: 9
  },
  {
    id: 'l2-both-13',
    level: INTENSITY_LEVELS.DEEP,
    category: CARD_CATEGORIES.QUESTION,
    modes: [GAME_MODES.PRESENCIAL, GAME_MODES.ONLINE],
    text: '¿Qué sueño o proyecto personal tienes en mente ahora mismo que te ilusiona tanto que hasta te da un poco de vértigo?',
    hint: 'Hablar de lo que nos apasiona ilumina la mirada.',
    timerSeconds: 0,
    chemistryDelta: 9
  },
  {
    id: 'l2-both-14',
    level: INTENSITY_LEVELS.DEEP,
    category: CARD_CATEGORIES.CONFESSION,
    modes: [GAME_MODES.PRESENCIAL, GAME_MODES.ONLINE],
    text: '¿Qué impresión tenías de {other} antes de hoy que cambió por completo después de escuchar cómo piensa?',
    hint: 'Las sorpresas que da conocer a alguien más a fondo.',
    timerSeconds: 0,
    chemistryDelta: 10
  },
  {
    id: 'l2-both-15',
    level: INTENSITY_LEVELS.DEEP,
    category: CARD_CATEGORIES.QUESTION,
    modes: [GAME_MODES.PRESENCIAL, GAME_MODES.ONLINE],
    text: '¿Qué significa para ti sentirte realmente "en casa" con una persona?',
    hint: 'Descríbelo con una sensación o una escena.',
    timerSeconds: 0,
    chemistryDelta: 9
  },
  {
    id: 'l2-both-16',
    level: INTENSITY_LEVELS.DEEP,
    category: CARD_CATEGORIES.GUESS,
    modes: [GAME_MODES.PRESENCIAL, GAME_MODES.ONLINE],
    text: 'Adivina si {other} se guía más por la cabeza y la lógica o por el corazón y el impulso cuando se enamora.',
    hint: '{other} revela si acertaste con un ejemplo real.',
    timerSeconds: 0,
    chemistryDelta: 9
  },
  {
    id: 'l2-both-17',
    level: INTENSITY_LEVELS.DEEP,
    category: CARD_CATEGORIES.QUESTION,
    modes: [GAME_MODES.PRESENCIAL, GAME_MODES.ONLINE],
    text: '¿Cuál es esa lección sobre el amor o las relaciones que te costó aprender, pero que hoy agradeces haber entendido?',
    hint: 'Lo que hoy te hace elegir mejor.',
    timerSeconds: 0,
    chemistryDelta: 9
  },
  {
    id: 'l2-both-18',
    level: INTENSITY_LEVELS.DEEP,
    category: CARD_CATEGORIES.CONFESSION,
    modes: [GAME_MODES.PRESENCIAL, GAME_MODES.ONLINE],
    text: 'Si fueras completamente transparente ahora mismo, ¿qué es lo que más te gusta de cómo te trata o te escucha {other}?',
    hint: 'Díselo sin rodeos.',
    timerSeconds: 0,
    chemistryDelta: 10
  },
  {
    id: 'l2-both-19',
    level: INTENSITY_LEVELS.DEEP,
    category: CARD_CATEGORIES.QUESTION,
    modes: [GAME_MODES.PRESENCIAL, GAME_MODES.ONLINE],
    text: '¿Qué cosa no negociable tienes en tu vida cuando decides compartir tu tiempo con alguien?',
    hint: 'Tus estándares más importantes.',
    timerSeconds: 0,
    chemistryDelta: 9
  },
  {
    id: 'l2-both-20',
    level: INTENSITY_LEVELS.DEEP,
    category: CARD_CATEGORIES.GUESS,
    modes: [GAME_MODES.PRESENCIAL, GAME_MODES.ONLINE],
    text: 'Adivina cuál es el mayor orgullo personal de {other} hasta el día de hoy.',
    hint: 'Luego {other} cuenta cuál es realmente.',
    timerSeconds: 0,
    chemistryDelta: 9
  },
  {
    id: 'l2-both-21',
    level: INTENSITY_LEVELS.DEEP,
    category: CARD_CATEGORIES.QUESTION,
    modes: [GAME_MODES.PRESENCIAL, GAME_MODES.ONLINE],
    text: '¿En qué momentos sientes que eres tu versión más auténtica, libre y feliz?',
    hint: 'Con quiénes, dónde o haciendo qué.',
    timerSeconds: 0,
    chemistryDelta: 9
  },
  {
    id: 'l2-both-22',
    level: INTENSITY_LEVELS.DEEP,
    category: CARD_CATEGORIES.CONFESSION,
    modes: [GAME_MODES.PRESENCIAL, GAME_MODES.ONLINE],
    text: '¿Alguna vez has sentido conexión instantánea con alguien en el primer encuentro, o eres de construir la confianza poco a poco?',
    hint: 'Y cuenta cómo te estás sintiendo hoy con {other}.',
    timerSeconds: 0,
    chemistryDelta: 10
  },
  {
    id: 'l2-both-23',
    level: INTENSITY_LEVELS.DEEP,
    category: CARD_CATEGORIES.QUESTION,
    modes: [GAME_MODES.PRESENCIAL, GAME_MODES.ONLINE],
    text: '¿Qué pregunta te gustaría que te hicieran más seguido las personas que te quieren?',
    hint: 'Después de decirla, responde tú mismo/a a esa pregunta.',
    timerSeconds: 0,
    chemistryDelta: 9
  },
  {
    id: 'l2-both-24',
    level: INTENSITY_LEVELS.DEEP,
    category: CARD_CATEGORIES.GUESS,
    modes: [GAME_MODES.PRESENCIAL, GAME_MODES.ONLINE],
    text: 'Adivina qué detalle romántico o gesto de cariño derrite a {other} aunque intente disimularlo.',
    hint: 'Que le cocinen, un abrazo largo, un mensaje inesperado...',
    timerSeconds: 0,
    chemistryDelta: 9
  },
  {
    id: 'l2-both-25',
    level: INTENSITY_LEVELS.DEEP,
    category: CARD_CATEGORIES.QUESTION,
    modes: [GAME_MODES.PRESENCIAL, GAME_MODES.ONLINE],
    text: '¿Qué es lo primero que notas cuando alguien te mira con interés genuino y no solo por cortesía?',
    hint: 'La diferencia está en los ojos y la atención.',
    timerSeconds: 0,
    chemistryDelta: 9
  },
  {
    id: 'l2-both-26',
    level: INTENSITY_LEVELS.DEEP,
    category: CARD_CATEGORIES.CONFESSION,
    modes: [GAME_MODES.PRESENCIAL, GAME_MODES.ONLINE],
    text: 'Confiesa qué pensamiento sobre {other} te ha hecho sonreír por dentro durante esta sesión.',
    hint: 'No te guardes el cumplido.',
    timerSeconds: 0,
    chemistryDelta: 10
  },
  {
    id: 'l2-both-27',
    level: INTENSITY_LEVELS.DEEP,
    category: CARD_CATEGORIES.QUESTION,
    modes: [GAME_MODES.PRESENCIAL, GAME_MODES.ONLINE],
    text: 'Si un amigo cercano tuyo tuviera que advertirle algo bueno y algo difícil de ti a {other}, ¿qué le diría?',
    hint: 'Autocrítica con humor y honestidad.',
    timerSeconds: 0,
    chemistryDelta: 9
  },
  {
    id: 'l2-both-28',
    level: INTENSITY_LEVELS.DEEP,
    category: CARD_CATEGORIES.GUESS,
    modes: [GAME_MODES.PRESENCIAL, GAME_MODES.ONLINE],
    text: 'Adivina qué tipo de planes hacen que {other} pierda por completo la noción del tiempo.',
    hint: '{other} te dice si diste en el clavo.',
    timerSeconds: 0,
    chemistryDelta: 9
  },
  {
    id: 'l2-both-29',
    level: INTENSITY_LEVELS.DEEP,
    category: CARD_CATEGORIES.QUESTION,
    modes: [GAME_MODES.PRESENCIAL, GAME_MODES.ONLINE],
    text: '¿Qué es lo que más admiras en una persona cuando la conoces en la intimidad y fuera de las apariencias?',
    hint: 'La ternura, la determinación, la honestidad, la calma...',
    timerSeconds: 0,
    chemistryDelta: 9
  },
  {
    id: 'l2-both-30',
    level: INTENSITY_LEVELS.DEEP,
    category: CARD_CATEGORIES.CONFESSION,
    modes: [GAME_MODES.PRESENCIAL, GAME_MODES.ONLINE],
    text: '¿Qué te daba un poco de nervios o curiosidad antes de empezar a hablar hoy con {other}?',
    hint: 'Confesar los nervios iniciales siempre une más.',
    timerSeconds: 0,
    chemistryDelta: 10
  },
  {
    id: 'l2-both-31',
    level: INTENSITY_LEVELS.DEEP,
    category: CARD_CATEGORIES.QUESTION,
    modes: [GAME_MODES.PRESENCIAL, GAME_MODES.ONLINE],
    text: 'Si mañana despertaras y supieras que nada puede salir mal, ¿qué decisión arriesgada tomarías en tu vida personal?',
    hint: 'Lo que harías si no existiera el miedo.',
    timerSeconds: 0,
    chemistryDelta: 9
  },
  {
    id: 'l2-both-32',
    level: INTENSITY_LEVELS.DEEP,
    category: CARD_CATEGORIES.GUESS,
    modes: [GAME_MODES.PRESENCIAL, GAME_MODES.ONLINE],
    text: 'Mirando hacia atrás en lo que llevan conversando, adivina cuál fue la pregunta que más le gustó responder a {other}.',
    hint: 'A ver qué tanto has estado prestando atención.',
    timerSeconds: 0,
    chemistryDelta: 9
  },
  {
    id: 'l2-both-33',
    level: INTENSITY_LEVELS.DEEP,
    category: CARD_CATEGORIES.QUESTION,
    modes: [GAME_MODES.PRESENCIAL, GAME_MODES.ONLINE],
    text: '¿Qué canción, lugar o aroma te transporta inmediatamente a un momento feliz de tu vida?',
    hint: 'Comparte la historia detrás de ese recuerdo.',
    timerSeconds: 0,
    chemistryDelta: 9
  },
  {
    id: 'l2-both-34',
    level: INTENSITY_LEVELS.DEEP,
    category: CARD_CATEGORIES.CONFESSION,
    modes: [GAME_MODES.PRESENCIAL, GAME_MODES.ONLINE],
    text: '¿En qué te pareces más a {other} de lo que imaginabas al principio?',
    hint: 'Encuentra ese punto de conexión inesperado.',
    timerSeconds: 0,
    chemistryDelta: 10
  },
  {
    id: 'l2-both-35',
    level: INTENSITY_LEVELS.DEEP,
    category: CARD_CATEGORIES.QUESTION,
    modes: [GAME_MODES.PRESENCIAL, GAME_MODES.ONLINE],
    text: '¿Cómo sabes tú personalmente cuando alguien te gusta de verdad y no es solo un capricho pasajero?',
    hint: 'Las señales internas que no fallan.',
    timerSeconds: 0,
    chemistryDelta: 10
  },

  // --- Exclusivas Modo Online (Nivel II · Dinámicas de Conexión a Distancia) ---
  {
    id: 'l2-onl-1',
    level: INTENSITY_LEVELS.DEEP,
    category: CARD_CATEGORIES.GUESS,
    modes: [GAME_MODES.ONLINE],
    text: 'Dinámica de nota de voz: si están por chat, responde a esta carta enviándole un audio de 20 segundos a {other} confesando qué es lo que más te gusta de hablar con él/ella.',
    hint: 'El tono de voz transmite mucho más que el texto escrito.',
    timerSeconds: 20,
    chemistryDelta: 11
  },
  {
    id: 'l2-onl-2',
    level: INTENSITY_LEVELS.DEEP,
    category: CARD_CATEGORIES.QUESTION,
    modes: [GAME_MODES.ONLINE],
    text: 'Si ahora mismo pudieran teletransportarse al mismo lugar durante dos horas, ¿a dónde irían y qué sería lo primero que harían al verse?',
    hint: 'Describe la escena con todos los detalles.',
    timerSeconds: 0,
    chemistryDelta: 10
  },
  {
    id: 'l2-onl-3',
    level: INTENSITY_LEVELS.DEEP,
    category: CARD_CATEGORIES.GUESS,
    modes: [GAME_MODES.ONLINE],
    text: 'Dedicatoria musical: elige una canción que te recuerde a la energía de {other} y compártesela ahora mismo explicando el porqué.',
    hint: 'Una canción dice lo que a veces cuesta poner en palabras.',
    timerSeconds: 0,
    chemistryDelta: 9
  },
  {
    id: 'l2-onl-4',
    level: INTENSITY_LEVELS.DEEP,
    category: CARD_CATEGORIES.CONFESSION,
    modes: [GAME_MODES.ONLINE],
    text: '¿Qué es lo que más te hace falta o te da más curiosidad de poder ver a {other} frente a frente en persona?',
    hint: 'Sus gestos, su altura, su mirada, su abrazo...',
    timerSeconds: 0,
    chemistryDelta: 10
  },
  {
    id: 'l2-onl-5',
    level: INTENSITY_LEVELS.DEEP,
    category: CARD_CATEGORIES.GUESS,
    modes: [GAME_MODES.ONLINE],
    text: 'Foto con significado: busca en tu galería una foto de un momento en el que fuiste muy feliz y compártesela a {other} contándole por qué.',
    hint: 'Un puente visual para acortar la distancia.',
    timerSeconds: 0,
    chemistryDelta: 10
  },

  // --- Exclusivas Modo Presencial (Nivel II · 15 Retos de Conexión en Persona) ---
  {
    id: 'l2-pres-1',
    level: INTENSITY_LEVELS.DEEP,
    category: CARD_CATEGORIES.CHALLENGE,
    modes: [GAME_MODES.PRESENCIAL],
    text: 'Conexión sin palabras: sostengan el contacto visual durante 30 segundos en silencio. Al terminar, digan en una sola palabra qué les transmitió el otro.',
    hint: 'Inicia el reloj de 30s cuando ambos se miren.',
    timerSeconds: 30,
    chemistryDelta: 12
  },
  {
    id: 'l2-pres-2',
    level: INTENSITY_LEVELS.DEEP,
    category: CARD_CATEGORIES.CHALLENGE,
    modes: [GAME_MODES.PRESENCIAL],
    text: 'Reto de intuición en persona: toma la mano de {other} unos segundos y adivina qué actividad le apasiona o le relaja más hacer con las manos.',
    hint: 'Cocinar, escribir, tocar música, diseñar, entrenar...',
    timerSeconds: 20,
    chemistryDelta: 11
  },
  {
    id: 'l2-pres-3',
    level: INTENSITY_LEVELS.DEEP,
    category: CARD_CATEGORIES.CHALLENGE,
    modes: [GAME_MODES.PRESENCIAL],
    text: 'Ráfaga espontánea: durante 30 segundos, hazle tres preguntas rápidas a {other}. La única regla es responder con lo primero que venga a la mente.',
    hint: 'Sin pensar demasiado la respuesta.',
    timerSeconds: 30,
    chemistryDelta: 10
  },
  {
    id: 'l2-pres-4',
    level: INTENSITY_LEVELS.DEEP,
    category: CARD_CATEGORIES.CHALLENGE,
    modes: [GAME_MODES.PRESENCIAL],
    text: 'Confianza a ojos cerrados: {other} debe cerrar los ojos durante 20 segundos mientras tú le describes qué es lo que más te transmite su presencia hoy.',
    hint: 'Escuchar con los ojos cerrados multiplica la atención.',
    timerSeconds: 20,
    chemistryDelta: 12
  },
  {
    id: 'l2-pres-5',
    level: INTENSITY_LEVELS.DEEP,
    category: CARD_CATEGORIES.CHALLENGE,
    modes: [GAME_MODES.PRESENCIAL],
    text: 'El abrazo de pausa: dense un abrazo tranquilo de al menos 15 segundos sin hablar, solo para sentir la energía del otro.',
    hint: 'Un abrazo sincero cambia por completo el ritmo de la cita.',
    timerSeconds: 20,
    chemistryDelta: 12
  },
  {
    id: 'l2-pres-6',
    level: INTENSITY_LEVELS.DEEP,
    category: CARD_CATEGORIES.CHALLENGE,
    modes: [GAME_MODES.PRESENCIAL],
    text: 'Lectura de expresión: observa el rostro de {other} durante 15 segundos y dile qué emoción crees que esconde detrás de su mirada.',
    hint: 'Ternura, curiosidad, timidez, picardía...',
    timerSeconds: 20,
    chemistryDelta: 11
  },
  {
    id: 'l2-pres-7',
    level: INTENSITY_LEVELS.DEEP,
    category: CARD_CATEGORIES.CHALLENGE,
    modes: [GAME_MODES.PRESENCIAL],
    text: 'Manos entrelazadas: entrelacen sus manos sobre la mesa mientras {active} responde la siguiente carta del mazo.',
    hint: 'Mantengan el contacto hasta terminar el siguiente turno.',
    timerSeconds: 0,
    chemistryDelta: 11
  },
  {
    id: 'l2-pres-8',
    level: INTENSITY_LEVELS.DEEP,
    category: CARD_CATEGORIES.CHALLENGE,
    modes: [GAME_MODES.PRESENCIAL],
    text: 'Canción compartida: pongan una canción que te guste mucho en el teléfono y escúchenla juntos durante 30 segundos hombro con hombro.',
    hint: 'Compartir música en silencio crea una atmósfera única.',
    timerSeconds: 30,
    chemistryDelta: 11
  },
  {
    id: 'l2-pres-9',
    level: INTENSITY_LEVELS.DEEP,
    category: CARD_CATEGORIES.CHALLENGE,
    modes: [GAME_MODES.PRESENCIAL],
    text: 'Verdad a corta distancia: acércate un poco más a {other} y hazle una pregunta personal que no esté en las cartas.',
    hint: '{other} debe responder mirando a los ojos.',
    timerSeconds: 0,
    chemistryDelta: 11
  },
  {
    id: 'l2-pres-10',
    level: INTENSITY_LEVELS.DEEP,
    category: CARD_CATEGORIES.CHALLENGE,
    modes: [GAME_MODES.PRESENCIAL],
    text: 'El cumplido inesperado: toca suavemente el hombro o la mano de {other} y dile algo que admiras de su forma de ser.',
    hint: 'La combinación de contacto sutil y honestidad.',
    timerSeconds: 0,
    chemistryDelta: 11
  },
  {
    id: 'l2-pres-11',
    level: INTENSITY_LEVELS.DEEP,
    category: CARD_CATEGORIES.CHALLENGE,
    modes: [GAME_MODES.PRESENCIAL],
    text: 'Sincronía de respiración: tómense de las manos durante 20 segundos e intenten sincronizar su respiración mirándose con calma.',
    hint: 'Activa el cronómetro para llevar el tiempo.',
    timerSeconds: 20,
    chemistryDelta: 12
  },
  {
    id: 'l2-pres-12',
    level: INTENSITY_LEVELS.DEEP,
    category: CARD_CATEGORIES.CHALLENGE,
    modes: [GAME_MODES.PRESENCIAL],
    text: 'Historia en un minuto: cuéntale a {other} en 30 segundos un momento que haya cambiado tu vida, mirándolo/a a los ojos todo el tiempo.',
    hint: 'Sin desviar la vista.',
    timerSeconds: 30,
    chemistryDelta: 11
  },
  {
    id: 'l2-pres-13',
    level: INTENSITY_LEVELS.DEEP,
    category: CARD_CATEGORIES.CHALLENGE,
    modes: [GAME_MODES.PRESENCIAL],
    text: 'Adivina el pensamiento: mira a {other} en silencio durante 10 segundos y adivina qué está sintiendo en este momento de la cita.',
    hint: '{other} te dice qué tan cerca estuviste.',
    timerSeconds: 0,
    chemistryDelta: 10
  },
  {
    id: 'l2-pres-14',
    level: INTENSITY_LEVELS.DEEP,
    category: CARD_CATEGORIES.CHALLENGE,
    modes: [GAME_MODES.PRESENCIAL],
    text: 'Secreto al oído: acércate y cuéntale al oído a {other} algo sobre ti que casi nadie en este lugar sabe.',
    hint: 'Un secreto compartido crea complicidad inmediata.',
    timerSeconds: 0,
    chemistryDelta: 12
  },
  {
    id: 'l2-pres-15',
    level: INTENSITY_LEVELS.DEEP,
    category: CARD_CATEGORIES.CHALLENGE,
    modes: [GAME_MODES.PRESENCIAL],
    text: 'Reconstrucción del primer minuto: imita cómo saludó o cómo miró {other} cuando recién se encontraron hoy.',
    hint: 'Ternura y risas aseguradas.',
    timerSeconds: 0,
    chemistryDelta: 10
  },

  // =========================================================================
  // NIVEL III · TENSIÓN & CHISPA (SPARK · ~40 Preguntas + 15 Retos Presenciales)
  // =========================================================================
  {
    id: 'l3-both-1',
    level: INTENSITY_LEVELS.SPARK,
    category: CARD_CATEGORIES.CONFESSION,
    modes: [GAME_MODES.PRESENCIAL, GAME_MODES.ONLINE],
    text: 'Del 1 al 10, ¿qué tanta química o atracción sientes entre ustedes ahora mismo y qué haría que subiera un punto más?',
    hint: 'Sin respuestas diplomáticas.',
    timerSeconds: 0,
    chemistryDelta: 13
  },
  {
    id: 'l3-both-2',
    level: INTENSITY_LEVELS.SPARK,
    category: CARD_CATEGORIES.GUESS,
    modes: [GAME_MODES.PRESENCIAL, GAME_MODES.ONLINE],
    text: 'Adivina dónde prefiere {other} que le den un beso inesperado: ¿en los labios, en el cuello, en la frente o abrazados?',
    hint: '{other} confirma si acertaste.',
    timerSeconds: 0,
    chemistryDelta: 13
  },
  {
    id: 'l3-both-3',
    level: INTENSITY_LEVELS.SPARK,
    category: CARD_CATEGORIES.QUESTION,
    modes: [GAME_MODES.PRESENCIAL, GAME_MODES.ONLINE],
    text: '¿Qué es lo que más te atrae de {other} pero que todavía no te habías atrevido a decirle abiertamente?',
    hint: 'El momento perfecto para soltarlo es ahora.',
    timerSeconds: 0,
    chemistryDelta: 14
  },
  {
    id: 'l3-both-4',
    level: INTENSITY_LEVELS.SPARK,
    category: CARD_CATEGORIES.CONFESSION,
    modes: [GAME_MODES.PRESENCIAL, GAME_MODES.ONLINE],
    text: 'Confiesa en qué momento exacto pensaste por primera vez en cómo se sentiría besar o acercarte más a {other}.',
    hint: 'Sé tan directo/a como te atrevas.',
    timerSeconds: 0,
    chemistryDelta: 14
  },
  {
    id: 'l3-both-5',
    level: INTENSITY_LEVELS.SPARK,
    category: CARD_CATEGORIES.QUESTION,
    modes: [GAME_MODES.PRESENCIAL, GAME_MODES.ONLINE],
    text: 'Si el reloj se detuviera durante una hora y nadie pudiera interrumpirlos, ¿qué te gustaría que pasara entre ustedes?',
    hint: 'Imagina que no hay prisa ni reglas externas.',
    timerSeconds: 0,
    chemistryDelta: 13
  },
  {
    id: 'l3-both-6',
    level: INTENSITY_LEVELS.SPARK,
    category: CARD_CATEGORIES.GUESS,
    modes: [GAME_MODES.PRESENCIAL, GAME_MODES.ONLINE],
    text: 'Adivina qué prefiere {other} cuando hay mucha química: ¿que tomen la iniciativa de forma directa o que la tensión vaya subiendo lento?',
    hint: '{other} revela cómo le gusta más.',
    timerSeconds: 0,
    chemistryDelta: 13
  },
  {
    id: 'l3-both-7',
    level: INTENSITY_LEVELS.SPARK,
    category: CARD_CATEGORIES.QUESTION,
    modes: [GAME_MODES.PRESENCIAL, GAME_MODES.ONLINE],
    text: '¿Qué gesto, mirada o actitud de {other} te parece irresistiblemente sexy sin que él/ella se dé cuenta?',
    hint: 'Esos detalles magnéticos involuntarios.',
    timerSeconds: 0,
    chemistryDelta: 13
  },
  {
    id: 'l3-both-8',
    level: INTENSITY_LEVELS.SPARK,
    category: CARD_CATEGORIES.CONFESSION,
    modes: [GAME_MODES.PRESENCIAL, GAME_MODES.ONLINE],
    text: '¿Cuál es tu mayor debilidad física o sensorial cuando estás cerca de alguien que te gusta mucho (el perfume, la voz en el oído, las manos, el cuello)?',
    hint: 'Información privilegiada para {other}.',
    timerSeconds: 0,
    chemistryDelta: 14
  },
  {
    id: 'l3-both-9',
    level: INTENSITY_LEVELS.SPARK,
    category: CARD_CATEGORIES.QUESTION,
    modes: [GAME_MODES.PRESENCIAL, GAME_MODES.ONLINE],
    text: 'Si esta noche o esta cita tuviera un título de película según la tensión que hay entre ustedes, ¿cómo se llamaría?',
    hint: 'Usa tu creatividad más provocadora.',
    timerSeconds: 0,
    chemistryDelta: 12
  },
  {
    id: 'l3-both-10',
    level: INTENSITY_LEVELS.SPARK,
    category: CARD_CATEGORIES.GUESS,
    modes: [GAME_MODES.PRESENCIAL, GAME_MODES.ONLINE],
    text: 'Adivina quién de los dos sintió atracción primero y quién crees que dará el próximo paso.',
    hint: 'Debatan la respuesta.',
    timerSeconds: 0,
    chemistryDelta: 13
  },
  {
    id: 'l3-both-11',
    level: INTENSITY_LEVELS.SPARK,
    category: CARD_CATEGORIES.QUESTION,
    modes: [GAME_MODES.PRESENCIAL, GAME_MODES.ONLINE],
    text: '¿Qué es lo más atrevido o espontáneo que has hecho por alguien que te volvía loco/a de atracción?',
    hint: 'Y di si serías capaz de repetirlo con {other}.',
    timerSeconds: 0,
    chemistryDelta: 13
  },
  {
    id: 'l3-both-12',
    level: INTENSITY_LEVELS.SPARK,
    category: CARD_CATEGORIES.CONFESSION,
    modes: [GAME_MODES.PRESENCIAL, GAME_MODES.ONLINE],
    text: 'Si tuvieras que pedirle un deseo a {other} para que lo cumpla hoy o en su próximo encuentro, ¿qué le pedirías?',
    hint: 'Sin censura.',
    timerSeconds: 0,
    chemistryDelta: 14
  },
  {
    id: 'l3-both-13',
    level: INTENSITY_LEVELS.SPARK,
    category: CARD_CATEGORIES.QUESTION,
    modes: [GAME_MODES.PRESENCIAL, GAME_MODES.ONLINE],
    text: '¿Qué prefieres en un momento íntimo: las luces tenues con música de fondo o el silencio absoluto a oscuras?',
    hint: 'Descubran cómo imaginan la atmósfera ideal.',
    timerSeconds: 0,
    chemistryDelta: 13
  },
  {
    id: 'l3-both-14',
    level: INTENSITY_LEVELS.SPARK,
    category: CARD_CATEGORIES.GUESS,
    modes: [GAME_MODES.PRESENCIAL, GAME_MODES.ONLINE],
    text: 'Adivina qué parte de su propio cuerpo le gusta más a {other} y qué parte tuya crees que le ha llamado más la atención.',
    hint: 'Doble apuesta en un solo turno.',
    timerSeconds: 0,
    chemistryDelta: 14
  },
  {
    id: 'l3-both-15',
    level: INTENSITY_LEVELS.SPARK,
    category: CARD_CATEGORIES.QUESTION,
    modes: [GAME_MODES.PRESENCIAL, GAME_MODES.ONLINE],
    text: '¿Cómo describirías un beso perfecto: lento y pausado al principio o intenso e inesperado desde el primer segundo?',
    hint: 'Cada detalle cuenta.',
    timerSeconds: 0,
    chemistryDelta: 14
  },
  {
    id: 'l3-both-16',
    level: INTENSITY_LEVELS.SPARK,
    category: CARD_CATEGORIES.CONFESSION,
    modes: [GAME_MODES.PRESENCIAL, GAME_MODES.ONLINE],
    text: 'Confiesa si en algún momento de hoy te has quedado mirando los labios o los ojos de {other} perdiendo el hilo de lo que decía.',
    hint: 'Culpable o inocente, pero con la verdad.',
    timerSeconds: 0,
    chemistryDelta: 14
  },
  {
    id: 'l3-both-17',
    level: INTENSITY_LEVELS.SPARK,
    category: CARD_CATEGORIES.QUESTION,
    modes: [GAME_MODES.PRESENCIAL, GAME_MODES.ONLINE],
    text: '¿Qué te enciende más la chispa: una mirada cómplice en público donde nadie más sabe qué pasa, o una confesión directa a solas?',
    hint: 'El arte de la complicidad secreta.',
    timerSeconds: 0,
    chemistryDelta: 13
  },
  {
    id: 'l3-both-18',
    level: INTENSITY_LEVELS.SPARK,
    category: CARD_CATEGORIES.GUESS,
    modes: [GAME_MODES.PRESENCIAL, GAME_MODES.ONLINE],
    text: 'Del 1 al 10, adivina qué tan celoso/a o posesivo/a es {other} cuando alguien le gusta de verdad.',
    hint: '{other} confiesa su número real.',
    timerSeconds: 0,
    chemistryDelta: 12
  },
  {
    id: 'l3-both-19',
    level: INTENSITY_LEVELS.SPARK,
    category: CARD_CATEGORIES.QUESTION,
    modes: [GAME_MODES.PRESENCIAL, GAME_MODES.ONLINE],
    text: 'Si se fueran juntos de viaje un fin de semana completo a un hotel o cabaña, ¿qué es lo que seguro no faltaría en ese viaje?',
    hint: 'Describe el plan desde la noche del viernes.',
    timerSeconds: 0,
    chemistryDelta: 13
  },
  {
    id: 'l3-both-20',
    level: INTENSITY_LEVELS.SPARK,
    category: CARD_CATEGORIES.CONFESSION,
    modes: [GAME_MODES.PRESENCIAL, GAME_MODES.ONLINE],
    text: '¿Qué cosa te gustaría hacer con {other} que todavía te da un poco de timidez proponer en voz alta?',
    hint: 'Usa la carta como excusa para decirlo.',
    timerSeconds: 0,
    chemistryDelta: 14
  },
  {
    id: 'l3-both-21',
    level: INTENSITY_LEVELS.SPARK,
    category: CARD_CATEGORIES.QUESTION,
    modes: [GAME_MODES.PRESENCIAL, GAME_MODES.ONLINE],
    text: '¿Qué prenda o estilo en {other} te parece que le queda increíblemente bien?',
    hint: 'Un elogio directo que suba la temperatura.',
    timerSeconds: 0,
    chemistryDelta: 12
  },
  {
    id: 'l3-both-22',
    level: INTENSITY_LEVELS.SPARK,
    category: CARD_CATEGORIES.GUESS,
    modes: [GAME_MODES.PRESENCIAL, GAME_MODES.ONLINE],
    text: 'Adivina si {other} es más de cariños suaves y lentos o de pasión intensa y arrebatada.',
    hint: 'Veamos qué dice su lenguaje corporal.',
    timerSeconds: 0,
    chemistryDelta: 14
  },
  {
    id: 'l3-both-23',
    level: INTENSITY_LEVELS.SPARK,
    category: CARD_CATEGORIES.QUESTION,
    modes: [GAME_MODES.PRESENCIAL, GAME_MODES.ONLINE],
    text: '¿Cuál es el lugar más inesperado o emocionante donde has dado un beso que nunca se te olvidó?',
    hint: 'Comparte la historia.',
    timerSeconds: 0,
    chemistryDelta: 13
  },
  {
    id: 'l3-both-24',
    level: INTENSITY_LEVELS.SPARK,
    category: CARD_CATEGORIES.CONFESSION,
    modes: [GAME_MODES.PRESENCIAL, GAME_MODES.ONLINE],
    text: 'Si tuvieras que calificar la tensión entre ustedes ahora mismo como "tibia", "caliente" o "a punto de estallar", ¿cuál elegirías?',
    hint: 'Y explica por qué.',
    timerSeconds: 0,
    chemistryDelta: 14
  },
  {
    id: 'l3-both-25',
    level: INTENSITY_LEVELS.SPARK,
    category: CARD_CATEGORIES.QUESTION,
    modes: [GAME_MODES.PRESENCIAL, GAME_MODES.ONLINE],
    text: '¿Qué frase dicha al oído o por mensaje a medianoche logra ponerte nervioso/a al instante?',
    hint: 'Dale la clave exacta a {other}.',
    timerSeconds: 0,
    chemistryDelta: 13
  },
  {
    id: 'l3-both-26',
    level: INTENSITY_LEVELS.SPARK,
    category: CARD_CATEGORIES.GUESS,
    modes: [GAME_MODES.PRESENCIAL, GAME_MODES.ONLINE],
    text: 'Adivina qué pensaría {other} si en este momento decidieras acortar la distancia y darle un beso.',
    hint: '{other} solo puede responder con una sonrisa o diciendo "frío/caliente".',
    timerSeconds: 0,
    chemistryDelta: 15
  },
  {
    id: 'l3-both-27',
    level: INTENSITY_LEVELS.SPARK,
    category: CARD_CATEGORIES.QUESTION,
    modes: [GAME_MODES.PRESENCIAL, GAME_MODES.ONLINE],
    text: '¿Qué es lo que hace que una persona pase de gustarte físicamente a encantarte por completo?',
    hint: 'Esa mezcla entre mente y piel.',
    timerSeconds: 0,
    chemistryDelta: 13
  },
  {
    id: 'l3-both-28',
    level: INTENSITY_LEVELS.SPARK,
    category: CARD_CATEGORIES.CONFESSION,
    modes: [GAME_MODES.PRESENCIAL, GAME_MODES.ONLINE],
    text: 'Confiesa qué es lo primero que le contarías mañana a tu mejor amigo/a sobre la química que hubo hoy con {other}.',
    hint: 'Sé totalmente honesto/a.',
    timerSeconds: 0,
    chemistryDelta: 13
  },
  {
    id: 'l3-both-29',
    level: INTENSITY_LEVELS.SPARK,
    category: CARD_CATEGORIES.QUESTION,
    modes: [GAME_MODES.PRESENCIAL, GAME_MODES.ONLINE],
    text: '¿Te gusta más despertar abrazado/a a alguien por la mañana o quedarte hasta las 4:00 AM hablando y riendo en la cama?',
    hint: 'Los mejores momentos sin reloj.',
    timerSeconds: 0,
    chemistryDelta: 13
  },
  {
    id: 'l3-both-30',
    level: INTENSITY_LEVELS.SPARK,
    category: CARD_CATEGORIES.GUESS,
    modes: [GAME_MODES.PRESENCIAL, GAME_MODES.ONLINE],
    text: 'Adivina cuál es el cumplido más atrevido pero elegante que {other} quiere hacerte hoy y aún no se ha animado.',
    hint: 'Luego {other} dice si acertaste o te dice el verdadero.',
    timerSeconds: 0,
    chemistryDelta: 14
  },
  {
    id: 'l3-both-31',
    level: INTENSITY_LEVELS.SPARK,
    category: CARD_CATEGORIES.QUESTION,
    modes: [GAME_MODES.PRESENCIAL, GAME_MODES.ONLINE],
    text: '¿Qué señal sutil sueles dar cuando quieres que la otra persona se acerque más a ti o te bese?',
    hint: 'Para que {other} sepa leer tus señales sin equivocarse.',
    timerSeconds: 0,
    chemistryDelta: 14
  },
  {
    id: 'l3-both-32',
    level: INTENSITY_LEVELS.SPARK,
    category: CARD_CATEGORIES.CONFESSION,
    modes: [GAME_MODES.PRESENCIAL, GAME_MODES.ONLINE],
    text: 'Si esta partida terminara en este segundo, ¿te quedarías con ganas de hacer o decir algo? Dilo ahora.',
    hint: 'No dejes nada pendiente.',
    timerSeconds: 0,
    chemistryDelta: 15
  },
  {
    id: 'l3-both-33',
    level: INTENSITY_LEVELS.SPARK,
    category: CARD_CATEGORIES.QUESTION,
    modes: [GAME_MODES.PRESENCIAL, GAME_MODES.ONLINE],
    text: '¿Qué canción pondrías de fondo si estuvieras a solas con {other} con una copa de vino a medianoche?',
    hint: 'Elige la banda sonora perfecta.',
    timerSeconds: 0,
    chemistryDelta: 12
  },
  {
    id: 'l3-both-34',
    level: INTENSITY_LEVELS.SPARK,
    category: CARD_CATEGORIES.GUESS,
    modes: [GAME_MODES.PRESENCIAL, GAME_MODES.ONLINE],
    text: 'Adivina qué es lo que más le gusta a {other} de coquetear contigo.',
    hint: '{other} confirma y añade un detalle más.',
    timerSeconds: 0,
    chemistryDelta: 13
  },
  {
    id: 'l3-both-35',
    level: INTENSITY_LEVELS.SPARK,
    category: CARD_CATEGORIES.CONFESSION,
    modes: [GAME_MODES.PRESENCIAL, GAME_MODES.ONLINE],
    text: 'Completa la frase mirando o mencionando a {other}: "Lo que más me tienta de ti en este momento es..."',
    hint: 'Sin dudarlo.',
    timerSeconds: 0,
    chemistryDelta: 15
  },

  // --- Exclusivas Modo Online (Nivel III · Chispa y Tensión a Distancia) ---
  {
    id: 'l3-onl-1',
    level: INTENSITY_LEVELS.SPARK,
    category: CARD_CATEGORIES.CONFESSION,
    modes: [GAME_MODES.ONLINE],
    text: 'Cuando por fin se vean frente a frente en su próxima cita presencial, ¿qué es lo primero que vas a hacer en los primeros 10 segundos de tener a {other} cerca?',
    hint: 'Haz una promesa que tengas que cumplir cuando se vean.',
    timerSeconds: 0,
    chemistryDelta: 14
  },
  {
    id: 'l3-onl-2',
    level: INTENSITY_LEVELS.SPARK,
    category: CARD_CATEGORIES.QUESTION,
    modes: [GAME_MODES.ONLINE],
    text: 'Si estuvieras sentado/a al lado de {other} ahora mismo en vez de estar tras la pantalla, ¿qué estarías haciendo en vez de escribir o hablar?',
    hint: 'Sin filtros: deja que la imaginación hable.',
    timerSeconds: 0,
    chemistryDelta: 14
  },
  {
    id: 'l3-onl-3',
    level: INTENSITY_LEVELS.SPARK,
    category: CARD_CATEGORIES.GUESS,
    modes: [GAME_MODES.ONLINE],
    text: 'Reto de pregunta prohibida: tienes derecho a hacerle a {other} una pregunta picante o directa fuera del mazo, y {other} debe responderla con total honestidad.',
    hint: 'Aprovecha bien tu turno.',
    timerSeconds: 0,
    chemistryDelta: 15
  },
  {
    id: 'l3-onl-4',
    level: INTENSITY_LEVELS.SPARK,
    category: CARD_CATEGORIES.CONFESSION,
    modes: [GAME_MODES.ONLINE],
    text: 'Audio en voz baja: mándale una nota de voz de 15 segundos a {other} diciéndole en tono de susurro qué te gustaría hacer la próxima vez que coincidan en persona.',
    hint: 'La voz baja por auricular tiene un efecto inmediato.',
    timerSeconds: 20,
    chemistryDelta: 15
  },
  {
    id: 'l3-onl-5',
    level: INTENSITY_LEVELS.SPARK,
    category: CARD_CATEGORIES.QUESTION,
    modes: [GAME_MODES.ONLINE],
    text: 'Describe paso a paso cómo imaginas los últimos cinco minutos de su próxima cita en persona antes de despedirse.',
    hint: 'O antes de decidir no despedirse tan temprano.',
    timerSeconds: 0,
    chemistryDelta: 14
  },

  // --- Exclusivas Modo Presencial (Nivel III · 15 Retos de Tensión y Cercanía) ---
  {
    id: 'l3-pres-1',
    level: INTENSITY_LEVELS.SPARK,
    category: CARD_CATEGORIES.QUESTION,
    modes: [GAME_MODES.PRESENCIAL],
    text: 'Sé totalmente honesto/a: ¿qué rasgo físico, mirada o gesto de {other} te ha estado distrayendo más durante los últimos diez minutos?',
    hint: 'Míralo/a a los ojos mientras das tu respuesta.',
    timerSeconds: 0,
    chemistryDelta: 13
  },
  {
    id: 'l3-pres-2',
    level: INTENSITY_LEVELS.SPARK,
    category: CARD_CATEGORIES.CHALLENGE,
    modes: [GAME_MODES.PRESENCIAL],
    text: 'Susurro al oído: acércate a {other} y dile muy bajito al oído qué te gustaría que pasara antes de que termine esta cita.',
    hint: 'Lo que se dice al oído queda fuera del registro oficial.',
    timerSeconds: 20,
    chemistryDelta: 15
  },
  {
    id: 'l3-pres-3',
    level: INTENSITY_LEVELS.SPARK,
    category: CARD_CATEGORIES.CHALLENGE,
    modes: [GAME_MODES.PRESENCIAL],
    text: 'Contacto de manos: toma las manos de {other} durante 25 segundos mientras le describes cómo sería tu próxima cita ideal juntos.',
    hint: 'Mantén la cercanía hasta que termine el reloj.',
    timerSeconds: 25,
    chemistryDelta: 15
  },
  {
    id: 'l3-pres-4',
    level: INTENSITY_LEVELS.SPARK,
    category: CARD_CATEGORIES.CHALLENGE,
    modes: [GAME_MODES.PRESENCIAL],
    text: 'Juego de proximidad: acérquense a pocos centímetros durante 20 segundos sin hablar. Solo sostengan la mirada y la tensión.',
    hint: 'Cuando el reloj llegue a cero, {active} decide cómo romper la distancia.',
    timerSeconds: 20,
    chemistryDelta: 16
  },
  {
    id: 'l3-pres-5',
    level: INTENSITY_LEVELS.SPARK,
    category: CARD_CATEGORIES.CHALLENGE,
    modes: [GAME_MODES.PRESENCIAL],
    text: 'Mirada a los labios: mira alternadamente a los ojos y a los labios de {other} durante 15 segundos antes de hacerle un cumplido directo.',
    hint: 'Sin esconder la intención.',
    timerSeconds: 20,
    chemistryDelta: 15
  },
  {
    id: 'l3-pres-6',
    level: INTENSITY_LEVELS.SPARK,
    category: CARD_CATEGORIES.CHALLENGE,
    modes: [GAME_MODES.PRESENCIAL],
    text: 'Caricia sutil: pasa suavemente tus dedos por la mano, la muñeca o la mejilla de {other} durante 15 segundos mientras te mira.',
    hint: 'Un reto de tacto lento para subir la química.',
    timerSeconds: 20,
    chemistryDelta: 15
  },
  {
    id: 'l3-pres-7',
    level: INTENSITY_LEVELS.SPARK,
    category: CARD_CATEGORIES.CHALLENGE,
    modes: [GAME_MODES.PRESENCIAL],
    text: 'Beso a elección: dale un beso suave a {other} en la mano, en la mejilla o cerca del cuello (donde tú elijas).',
    hint: 'Toma la iniciativa con elegancia.',
    timerSeconds: 0,
    chemistryDelta: 16
  },
  {
    id: 'l3-pres-8',
    level: INTENSITY_LEVELS.SPARK,
    category: CARD_CATEGORIES.CHALLENGE,
    modes: [GAME_MODES.PRESENCIAL],
    text: 'El pulso: coloca dos dedos sobre la muñeca o el cuello de {other} durante 15 segundos para comprobar qué tan rápido le late el corazón ahora mismo.',
    hint: 'El pulso nunca miente.',
    timerSeconds: 20,
    chemistryDelta: 15
  },
  {
    id: 'l3-pres-9',
    level: INTENSITY_LEVELS.SPARK,
    category: CARD_CATEGORIES.CHALLENGE,
    modes: [GAME_MODES.PRESENCIAL],
    text: 'Sin distancia: siéntense justo al lado (sin mesa de por medio) durante el resto de este nivel.',
    hint: 'Elimina las barreras físicas entre los dos.',
    timerSeconds: 0,
    chemistryDelta: 15
  },
  {
    id: 'l3-pres-10',
    level: INTENSITY_LEVELS.SPARK,
    category: CARD_CATEGORIES.CHALLENGE,
    modes: [GAME_MODES.PRESENCIAL],
    text: 'Adivina con los ojos cerrados: {other} cierra los ojos por 15 segundos y tú debes darle un toque suave o un beso en la mano o mejilla para que adivine tu intención.',
    hint: 'La sorpresa despierta todos los sentidos.',
    timerSeconds: 20,
    chemistryDelta: 16
  },
  {
    id: 'l3-pres-11',
    level: INTENSITY_LEVELS.SPARK,
    category: CARD_CATEGORIES.CHALLENGE,
    modes: [GAME_MODES.PRESENCIAL],
    text: 'Abrazo al oído: dale un abrazo lento a {other} y, antes de soltarlo/a, dile al oído qué es lo que más te gusta de estar con él/ella hoy.',
    hint: 'Tómense su tiempo.',
    timerSeconds: 20,
    chemistryDelta: 16
  },
  {
    id: 'l3-pres-12',
    level: INTENSITY_LEVELS.SPARK,
    category: CARD_CATEGORIES.CHALLENGE,
    modes: [GAME_MODES.PRESENCIAL],
    text: 'Tres deseos al oído: susúrrale a {other} tres cosas que te encantaría hacer juntos y deja que {other} elija cuál de las tres se cumple primero.',
    hint: 'El poder de elegir en manos de {other}.',
    timerSeconds: 0,
    chemistryDelta: 16
  },
  {
    id: 'l3-pres-13',
    level: INTENSITY_LEVELS.SPARK,
    category: CARD_CATEGORIES.CHALLENGE,
    modes: [GAME_MODES.PRESENCIAL],
    text: 'Baile lento sin música (o con tu canción favorita): pónganse de pie o acérquense durante 25 segundos como si estuvieran bailando lento.',
    hint: 'Risas y cercanía garantizadas.',
    timerSeconds: 25,
    chemistryDelta: 15
  },
  {
    id: 'l3-pres-14',
    level: INTENSITY_LEVELS.SPARK,
    category: CARD_CATEGORIES.CHALLENGE,
    modes: [GAME_MODES.PRESENCIAL],
    text: 'Apuesta de miradas: mírense de cerca durante 25 segundos. Quien aparte la vista o se ría primero le debe un beso (donde ambos quieran) al ganador.',
    hint: 'Activa el cronómetro de 25s.',
    timerSeconds: 25,
    chemistryDelta: 16
  },
  {
    id: 'l3-pres-15',
    level: INTENSITY_LEVELS.SPARK,
    category: CARD_CATEGORIES.CHALLENGE,
    modes: [GAME_MODES.PRESENCIAL],
    text: 'Carta blanca por 20 segundos: {active} tiene 20 segundos para acercarse, tomar de la mano o hacer el gesto que lleva rato queriendo hacer con {other}.',
    hint: 'Si ambos quieren, el cronómetro es solo la excusa.',
    timerSeconds: 20,
    chemistryDelta: 16
  }
]);

