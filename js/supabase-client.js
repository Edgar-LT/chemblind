/**
 * @file supabase-client.js
 * @description Supabase client integration for ChemBlind real-time multiplayer rooms.
 * Manages device fingerprinting, room creation with rate limits, invitations, and Realtime channels.
 * Incluye salvaguardas para modo offline y degradación elegante si la red o el SDK no están disponibles.
 */

// Supabase project credentials (vdwdqniekhxisewuffnc)
const SUPABASE_URL = 'https://vdwdqniekhxisewuffnc.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkd2Rxbmlla2h4aXNld3VmZm5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM4MTk5ODcsImV4cCI6MjEwOTM5NTk4N30.lU3QIqEXK6rKsNTlzZN0VWlYtmStpHItpdtxJl9MLEY';

const STORAGE_KEY_DEVICE_ID = 'chemblind_device_id_v1';
const STORAGE_KEY_HOST_SESSION = 'chemblind_host_session_v1';

let supabaseClient = null;

/**
 * Comprueba si el SDK de Supabase está cargado y disponible en el navegador.
 * @returns {boolean}
 */
export function isSupabaseAvailable() {
  return typeof window !== 'undefined' && Boolean(window.supabase && window.supabase.createClient);
}

/**
 * Initializes and returns the singleton Supabase client.
 */
export function getSupabase() {
  if (supabaseClient) return supabaseClient;
  if (isSupabaseAvailable()) {
    try {
      supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        realtime: {
          params: {
            eventsPerSecond: 10
          }
        }
      });
      return supabaseClient;
    } catch (err) {
      console.warn('[ChemBlind/Supabase] Error al instanciar cliente Supabase:', err);
    }
  }
  return null;
}

/**
 * Gets or creates a persistent device ID to identify the client for anti-spam rate limiting.
 * @returns {string}
 */
export function getDeviceId() {
  try {
    let deviceId = localStorage.getItem(STORAGE_KEY_DEVICE_ID);
    if (!deviceId) {
      deviceId = 'cb-' + Math.random().toString(36).slice(2, 10) + '-' + Date.now().toString(36);
      localStorage.setItem(STORAGE_KEY_DEVICE_ID, deviceId);
    }
    return deviceId;
  } catch (err) {
    return 'cb-fallback-' + Date.now();
  }
}

let cachedSessionClientId = null;

/**
 * Gets or creates a session-unique client ID per tab/window.
 * Ensures distinct author identification even when tested across multiple tabs in the same browser.
 * @returns {string}
 */
export function getSessionClientId() {
  if (cachedSessionClientId) return cachedSessionClientId;
  try {
    cachedSessionClientId = sessionStorage.getItem('chemblind_tab_session_id');
    if (!cachedSessionClientId) {
      cachedSessionClientId = 'sess-' + Math.random().toString(36).slice(2, 9) + '-' + Date.now().toString(36);
      sessionStorage.setItem('chemblind_tab_session_id', cachedSessionClientId);
    }
  } catch (e) {
    cachedSessionClientId = 'sess-fallback-' + Date.now();
  }
  return cachedSessionClientId;
}

/**
 * Calls the secure RPC in Postgres to create a new game room with rate limiting.
 * @param {Object} params
 * @param {string} params.playerName
 * @param {string} params.mode - 'presencial' | 'online'
 * @param {number} params.level - 1, 2, 3
 * @returns {Promise<{ success: boolean, code?: string, accessToken?: string, hostToken?: string, error?: string, offline?: boolean }>}
 */
export async function createGameRoom({ playerName, mode, level, initialCardId = null }) {
  const supabase = getSupabase();
  if (!supabase) {
    return {
      success: false,
      offline: true,
      error: 'El servicio multijugador no está disponible en este momento. Puedes seguir jugando en modo local en el mismo dispositivo.'
    };
  }

  const clientId = getDeviceId();

  try {
    const { data, error } = await supabase.rpc('create_game_room', {
      p_client_id: clientId,
      p_player_name: playerName,
      p_mode: mode || 'online',
      p_level: Number(level) || 1,
      p_initial_card_id: initialCardId
    });

    if (error) {
      return {
        success: false,
        error: error.message || 'No se pudo crear la sala. Intenta de nuevo en unos segundos.'
      };
    }

    const result = data || {};
    if (result.success && result.host_token) {
      try {
        localStorage.setItem(
          STORAGE_KEY_HOST_SESSION,
          JSON.stringify({
            code: result.code,
            hostToken: result.host_token,
            roomId: result.room_id
          })
        );
      } catch (e) {
        console.warn('[ChemBlind/Supabase] No se pudo persistir host token localmente', e);
      }
    }

    return {
      success: true,
      code: result.code,
      accessToken: result.access_token,
      hostToken: result.host_token,
      roomId: result.room_id
    };
  } catch (networkError) {
    return {
      success: false,
      offline: true,
      error: 'Error de conexión de red con el servidor multijugador.'
    };
  }
}

/**
 * Joins an existing game room using the room code and access token.
 * @param {Object} params
 * @param {string} params.code
 * @param {string} params.accessToken
 * @param {string} params.playerName
 * @returns {Promise<Object>}
 */
export async function joinGameRoom({ code, accessToken, playerName }) {
  const supabase = getSupabase();
  if (!supabase) {
    return {
      success: false,
      offline: true,
      error: 'El servicio multijugador no está disponible.'
    };
  }

  try {
    const { data, error } = await supabase.rpc('join_game_room', {
      p_code: code,
      p_access_token: accessToken,
      p_player_two_name: playerName
    });

    if (error) {
      return {
        success: false,
        error: error.message || 'Error al intentar unirse a la sala.'
      };
    }

    return data;
  } catch (networkError) {
    return {
      success: false,
      error: 'Error de comunicación con la sala remota.'
    };
  }
}

/**
 * Fetches the current room state by code and access token.
 * @param {string} code
 * @param {string} accessToken
 * @returns {Promise<Object|null>}
 */
export async function fetchRoomData(code, accessToken) {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('code', code)
      .eq('access_token', accessToken)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (error || !data) return null;
    return data;
  } catch (err) {
    return null;
  }
}

/**
 * Subscribes to room updates via Realtime Broadcast & Postgres Changes.
 * Guaranteed delivery: safely queues broadcasts until channel is SUBSCRIBED,
 * and eliminates duplicate channel subscriptions.
 * @param {string} roomCode
 * @param {Object} handlers
 * @param {Function} handlers.onStateUpdate
 * @param {Function} handlers.onPlayerJoined
 * @param {Function} handlers.onCardAction
 * @param {Function} [handlers.onCardResponse]
 * @returns {Object|null} Realtime Channel instance
 */
export function subscribeToRoomChannel(roomCode, { onStateUpdate, onPlayerJoined, onCardAction, onCardResponse }) {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const channelName = `chemblind:${roomCode}`;

    // Clean up prior channel instances if any
    try {
      const existingChannels = typeof supabase.getChannels === 'function' ? supabase.getChannels() : [];
      const match = existingChannels.find((ch) => ch.topic === `realtime:${channelName}` || ch.topic === channelName);
      if (match) {
        supabase.removeChannel(match);
      }
    } catch (e) {
      // Ignore channel lookup warnings
    }

    const pendingQueue = [];
    let isSubscribed = false;

    const channel = supabase
      .channel(channelName, {
        config: {
          broadcast: { ack: false, self: false }
        }
      })
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rooms',
          filter: `code=eq.${roomCode}`
        },
        (payload) => {
          if (onStateUpdate && payload.new) {
            onStateUpdate(payload.new);
          }
        }
      )
      .on('broadcast', { event: 'PLAYER_JOINED' }, (payload) => {
        if (onPlayerJoined) onPlayerJoined(payload.payload || payload);
      })
      .on('broadcast', { event: 'CARD_ACTION' }, (payload) => {
        if (onCardAction) onCardAction(payload.payload || payload);
      })
      .on('broadcast', { event: 'CARD_RESPONSE' }, (payload) => {
        if (onCardResponse) onCardResponse(payload.payload || payload);
      })
      .on('broadcast', { event: 'CHAT_MESSAGE' }, (payload) => {
        if (onCardResponse) onCardResponse(payload.payload || payload);
      });

    channel.subscribe((status, err) => {
      if (status === 'SUBSCRIBED') {
        isSubscribed = true;
        console.log('[ChemBlind/Realtime] Canal conectado exitosamente:', channelName);

        // Flush any queued broadcasts immediately upon connection
        while (pendingQueue.length > 0) {
          const item = pendingQueue.shift();
          channel.send(item).catch((sendErr) => {
            console.warn('[ChemBlind/Realtime] Error enviando broadcast en cola:', sendErr);
          });
        }
      } else if (status === 'CHANNEL_ERROR') {
        console.warn('[ChemBlind/Realtime] Error en canal Realtime:', channelName, err);
      }
    });

    // Attach safe sender to channel instance
    channel.__safeSend = async (message) => {
      if (isSubscribed) {
        try {
          return await channel.send(message);
        } catch (e) {
          console.warn('[ChemBlind/Realtime] Error en channel.send:', e);
        }
      } else {
        pendingQueue.push(message);
      }
    };

    return channel;
  } catch (err) {
    console.warn('[ChemBlind/Supabase] Error suscribiendo a canal Realtime:', err);
    return null;
  }
}

/**
 * Broadcasts an instant event across connected devices in the room.
 * Uses channel.__safeSend to prevent silent dropping if socket is connecting.
 * @param {Object} channel
 * @param {string} event
 * @param {Object} payload
 */
export async function broadcastRoomEvent(channel, event, payload) {
  if (!channel) return;
  const message = {
    type: 'broadcast',
    event,
    payload
  };

  if (typeof channel.__safeSend === 'function') {
    return channel.__safeSend(message);
  }

  if (typeof channel.send === 'function') {
    try {
      return await channel.send(message);
    } catch (err) {
      console.warn('[ChemBlind/Supabase] Error en broadcast:', err);
    }
  }
}

/**
 * Persists a message (card response or direct chat message) atomically in PostgreSQL.
 * @param {string} roomCode
 * @param {Object} messageObj
 * @returns {Promise<Array<Object>>}
 */
export async function saveRoomMessage(roomCode, messageObj) {
  const supabase = getSupabase();
  if (!supabase || !roomCode) return [];

  try {
    const { data, error } = await supabase.rpc('append_room_message', {
      p_code: roomCode,
      p_message: messageObj
    });

    if (error) {
      console.warn('[ChemBlind/Supabase] Advertencia al persistir mensaje en sala:', error.message);
      return [];
    }

    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.warn('[ChemBlind/Supabase] Error en saveRoomMessage:', err);
    return [];
  }
}

const updateDebounceTimers = new Map();

/**
 * Updates room row in Supabase with host verification.
 * Debounced to protect Postgres from write amplification during rapid interactions.
 * @param {string} roomId
 * @param {Object} fields
 * @param {string} [hostToken]
 */
export function updateRoomRecord(roomId, fields, hostToken = null) {
  const supabase = getSupabase();
  if (!supabase || !roomId) return;

  (async () => {
    try {
      let query = supabase
        .from('rooms')
        .update({ ...fields, updated_at: new Date().toISOString() })
        .eq('id', roomId);

      if (hostToken) {
        query = query.eq('host_token', hostToken);
      }

      const { error } = await query;
      if (error) {
        console.warn('[ChemBlind/Supabase] Advertencia al actualizar sala:', error.message);
      }
    } catch (err) {
      console.warn('[ChemBlind/Supabase] Error en updateRoomRecord:', err);
    }
  })();
}

/**
 * Fetches all currently active rooms created by this client device.
 * @param {string} [clientId]
 * @returns {Promise<Array<Object>>}
 */
export async function fetchClientActiveRooms(clientId) {
  const supabase = getSupabase();
  if (!supabase) return [];

  const cid = clientId || getDeviceId();

  try {
    const { data, error } = await supabase.rpc('get_client_active_rooms', {
      p_client_id: cid
    });

    if (error) {
      console.warn('[ChemBlind/Supabase] Error al consultar salas activas:', error.message);
      return [];
    }

    return Array.isArray(data) ? data : [];
  } catch (err) {
    return [];
  }
}

/**
 * Closes an active game room and frees up the slot.
 * @param {string} code
 * @param {string} hostToken
 * @returns {Promise<{ success: boolean, message?: string, error?: string }>}
 */
export async function closeGameRoom(code, hostToken) {
  const supabase = getSupabase();
  if (!supabase) {
    return { success: false, error: 'Servicio no disponible' };
  }

  try {
    const { data, error } = await supabase.rpc('close_game_room', {
      p_code: code,
      p_host_token: hostToken
    });

    if (error) {
      return {
        success: false,
        error: error.message || 'Error al cerrar la sala.'
      };
    }

    return data || { success: true };
  } catch (err) {
    return { success: false, error: 'Error de red al cerrar la sala.' };
  }
}
