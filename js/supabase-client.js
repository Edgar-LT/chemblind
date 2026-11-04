/**
 * @file supabase-client.js
 * @description Supabase client integration for ChemBlind real-time multiplayer rooms.
 * Manages device fingerprinting, room creation with rate limits, invitations, and Realtime channels.
 */

// Supabase project credentials (vdwdqniekhxisewuffnc)
const SUPABASE_URL = 'https://vdwdqniekhxisewuffnc.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkd2Rxbmlla2h4aXNld3VmZm5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM4MTk5ODcsImV4cCI6MjEwOTM5NTk4N30.lU3QIqEXK6rKsNTlzZN0VWlYtmStpHItpdtxJl9MLEY';

const STORAGE_KEY_DEVICE_ID = 'chemblind_device_id_v1';
const STORAGE_KEY_HOST_SESSION = 'chemblind_host_session_v1';

let supabaseClient = null;

/**
 * Initializes and returns the singleton Supabase client.
 */
export function getSupabase() {
  if (supabaseClient) return supabaseClient;
  if (typeof window !== 'undefined' && window.supabase && window.supabase.createClient) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    });
    return supabaseClient;
  }
  throw new Error('Supabase SDK not loaded on window.');
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

/**
 * Calls the secure RPC in Postgres to create a new game room with rate limiting.
 * @param {Object} params
 * @param {string} params.playerName
 * @param {string} params.mode - 'presencial' | 'online'
 * @param {number} params.level - 1, 2, 3
 * @returns {Promise<{ success: boolean, code?: string, accessToken?: string, hostToken?: string, error?: string }>}
 */
export async function createGameRoom({ playerName, mode, level }) {
  const supabase = getSupabase();
  const clientId = getDeviceId();

  const { data, error } = await supabase.rpc('create_game_room', {
    p_client_id: clientId,
    p_player_name: playerName,
    p_mode: mode || 'online',
    p_level: Number(level) || 1
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
      console.warn('Could not persist host token locally', e);
    }
  }

  return {
    success: true,
    code: result.code,
    accessToken: result.access_token,
    hostToken: result.host_token,
    roomId: result.room_id
  };
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
}

/**
 * Fetches the current room state by code and access token.
 * @param {string} code
 * @param {string} accessToken
 * @returns {Promise<Object|null>}
 */
export async function fetchRoomData(code, accessToken) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('code', code)
    .eq('access_token', accessToken)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

/**
 * Subscribes to room updates via Realtime Broadcast & Postgres Changes.
 * @param {string} roomCode
 * @param {Object} handlers
 * @param {Function} handlers.onStateUpdate
 * @param {Function} handlers.onPlayerJoined
 * @param {Function} handlers.onCardAction
 * @returns {Object} Realtime Channel instance
 */
export function subscribeToRoomChannel(roomCode, { onStateUpdate, onPlayerJoined, onCardAction }) {
  const supabase = getSupabase();
  const channelName = `chemblind:${roomCode}`;

  const channel = supabase
    .channel(channelName)
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
      if (onPlayerJoined) onPlayerJoined(payload.payload);
    })
    .on('broadcast', { event: 'CARD_ACTION' }, (payload) => {
      if (onCardAction) onCardAction(payload.payload);
    })
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        // Channel connected
      }
    });

  return channel;
}

/**
 * Broadcasts an instant event across connected devices in the room.
 * @param {Object} channel
 * @param {string} event
 * @param {Object} payload
 */
export async function broadcastRoomEvent(channel, event, payload) {
  if (!channel) return;
  await channel.send({
    type: 'broadcast',
    event,
    payload
  });
}

/**
 * Updates room row in Supabase.
 * @param {string} roomId
 * @param {Object} fields
 */
export async function updateRoomRecord(roomId, fields) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('rooms')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', roomId);

  if (error) {
    console.error('Error updating room in Supabase:', error);
  }
}
