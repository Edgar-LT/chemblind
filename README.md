# ChemBlind — Chemistry Unfiltered

> **Juego web interactivo de citas, complicidad y preguntas íntimas.** Diseñado bajo principios de **Clean Architecture**, estética editorial de alta gama (**Obsidiana, Titanio & Oro Champán**) y un mazo de **165 tarjetas únicas** divididas en modalidades **Presencial** y **Online**.

---

## Características Principales

### 1. Dos Modalidades Especializadas
- **Modo Presencial (Mixto)**: Combina preguntas para romper el hielo y conectar en profundidad con **15 retos pequeños en persona por cada nivel** (duelo de miradas, lectura de manos, sincronía de respiración, susurros al oído y retos de proximidad física con cronómetro integrado).
- **Modo Online (A Distancia)**: Filtra cualquier acción física para centrarse en **dinámicas interactivas por chat o videollamada** (adivinanzas cruzadas, notas de voz, intercambio de fotos cotidianas, dos verdades y una mentira, preguntas prohibidas y dedicatorias).

### 2. Progresión en 3 Niveles de Intensidad
1. **Nivel I · Romper el Hielo (55 cartas)**: Primeras impresiones, curiosidad, sentido del humor y complicidad ligera.
2. **Nivel II · Conexión Profunda (55 cartas)**: Vulnerabilidad, lenguajes del amor, historias no contadas y empatía emocional.
3. **Nivel III · Tensión & Chispa (55 cartas)**: Atracción directa, confesiones sin filtro, debilidades sensoriales y retos magnéticos.

*Verificado matemáticamente con 0 cartas duplicadas entre niveles.*

### 3. Mecánicas de Juego & Micro-Interacciones
- **Onboarding sin suposiciones**: Configuración previa donde cada pareja ingresa sus nombres y elige la modalidad e intensidad inicial.
- **Interpolación Dinámica de Nombres**: Cada carta reemplaza `{active}` y `{other}` en tiempo real para dirigirse a la persona correcta en su turno.
- **Cronómetro de Alta Precisión**: Calibre a 60 Hz basado en `requestAnimationFrame` y delta time que solo aparece de forma contextual cuando una carta requiere medir el tiempo.
- **Sistema de Comodines & Química**: 2 comodines por jugador para saltar preguntas comprometidas y medidor porcentual de afinidad que responde a la sesión.
- **Atelier de Cartas a Medida**: Permite redactar preguntas o retos propios con tiempo personalizado y guardado en `localStorage`.
- **Integración con WhatsApp**: Botón para exportar y compartir la carta activa por mensaje con formato elegante.
- **Infraestructura Supabase & Realtime**: Salas multijugador sincronizadas en tiempo real con WebSockets, enlaces protegidos con tokens de acceso, rate limiting de 30s y caducidad automática de 3 horas.
- **Despliegue Público**: Alojado en producción en [https://edgar-lt.github.io/chemblind/](https://edgar-lt.github.io/chemblind/).

---

## Diseño Visual & Sistema de Diseño (Luxury Editorial UI)

Inspirado en el minimalismo escultural de **Apple Flagship**, la precisión de **Haute Horlogerie Suiza** y los principios de diseño industrial de **Dieter Rams (Braun)**:
- **Materiales Nobles**: Superficies en **Obsidiana OLED** (`#0a0a0c`), **Titanio Cepillado** (`#141417`), **Alabastro/Marfil** (`#f5f5f7`) y detalles en **Oro Champán** (`#c5a059`).
- **Luz Cenital Sutil**: Bordes especulares de `1px` que reaccionan de manera suave al puntero.
- **Tipografía de Precisión**: Contraste entre titulares en Serif (*Cormorant Garamond*) y lecturas numéricas tabulares (*Plus Jakarta Sans* con `tabular-nums`).
- **Cero Neón / Cero Cyberpunk**: Estética sobria, atemporal y enfocada en el contenido.

---

## Estructura del Código (Clean Architecture)

```
juego-conexion/
├── index.html          # Marcado semántico, onboarding y escenario de cartas
├── css/
│   └── styles.css      # Tokens cromáticos, física horológica y responsividad
├── js/
│   ├── engine.js       # Capa de dominio pura (lógica, mazos, barajado inmutable)
│   └── app.js          # Controlador UI, sincronización DOM y cronógrafo
└── README.md           # Documentación técnica
```

---

## Ejecución Local

Dado que utiliza módulos nativos de JavaScript (`ES Modules`), debe servirse mediante un servidor HTTP local:

```bash
# Con Python (puerto 5173 u 8080)
python -m http.server 5173

# O con Node.js / npx serve
npx serve .
```

Abre en tu navegador: `http://localhost:5173`

---

## Licencia

Proyecto desarrollado con fines de portafolio profesional de desarrollo web, UI/UX de alta fidelidad y lógica desacoplada.
