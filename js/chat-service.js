/**
 * @file chat-service.js
 * @description Standalone Realtime Chat API with Active Heartbeat Polling and WebSocket Transport.
 * Fully decoupled from game logic, maintaining strict Clean Architecture (SOLID).
 */

const SUPABASE_URL = 'https://vdwdqniekhxisewuffnc.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkd2Rxbmlla2h4aXNld3VmZm5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM4MTk5ODcsImV4cCI6MjEwOTM5NTk4N30.lU3QIqEXK6rKsNTlzZN0VWlYtmStpHItpdtxJl9MLEY';

export class ChatRoomAPI {
  constructor() {
    this.roomCode = null;
    this.senderId = null;
    this.authorName = null;
    this.authorRole = null;
    this.seenMessageIds = new Set();
    this.pollInterval = null;
    this.realtimeChannel = null;
    this.onMessageCallback = null;
    this.onStateSyncCallback = null;
    this.isPolling = false;
    this.lastKnownCardId = null;
    this.lastKnownActiveTurn = null;
    this.lastKnownLevel = null;
  }

  /**
   * Connects to a room chat with active server heartbeat polling and WebSocket broadcast.
   * @param {Object} params
   * @param {string} params.roomCode
   * @param {string} params.senderId
   * @param {string} params.authorName
   * @param {string} params.authorRole
   * @param {Function} params.onMessage - Called for every incoming or initial message
   * @param {Function} [params.onInitialHistory] - Called with full history array on first load
   * @param {Function} [params.onStateSync] - Called when server room card/turn/level changes
   */
  async connect({ roomCode, senderId, authorName, authorRole, onMessage, onInitialHistory, onStateSync }) {
    this.disconnect();

    this.roomCode = String(roomCode || '').trim().toUpperCase();
    this.senderId = senderId;
    this.authorName = authorName;
    this.authorRole = authorRole;
    this.onMessageCallback = onMessage;
    this.onStateSyncCallback = onStateSync;

    // 1. Fetch initial room state snapshot & chat history
    try {
      const snapshot = await this.fetchRoomSnapshot();
      if (snapshot) {
        if (Array.isArray(snapshot.chat_history)) {
          snapshot.chat_history.forEach((msg) => {
            if (msg?.id) this.seenMessageIds.add(msg.id);
          });
          if (typeof onInitialHistory === 'function') {
            onInitialHistory(snapshot.chat_history);
          }
        }

        if (snapshot.current_card_id) {
          this.lastKnownCardId = snapshot.current_card_id;
          this.lastKnownActiveTurn = snapshot.active_turn;
          this.lastKnownLevel = snapshot.level;

          if (typeof this.onStateSyncCallback === 'function') {
            this.onStateSyncCallback(snapshot);
          }
        }
      }
    } catch (e) {
      console.warn('[ChatAPI] Error al cargar estado o historial inicial:', e);
    }

    // 2. Start continuous active server polling (every 1.5 seconds)
    // Constantly checks if messages or active card changed on server
    this.pollInterval = setInterval(() => {
      this.pollNewMessages();
    }, 1500);

    // 3. Subscribe to Realtime WebSocket channel for instant sub-second delivery
    this.initRealtimeSocket();
  }

  /**
   * Initializes Supabase Realtime channel for zero-latency peer broadcast.
   */
  initRealtimeSocket() {
    if (typeof window === 'undefined' || !window.supabase || !this.roomCode) return;
    try {
      const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      const channelName = `chemblind_chat:${this.roomCode}`;

      this.realtimeChannel = client.channel(channelName, {
        config: { broadcast: { ack: false, self: false } }
      });

      this.realtimeChannel
        .on('broadcast', { event: 'CHAT_MSG' }, (payload) => {
          const msg = payload.payload || payload;
          this.processIncomingMessage(msg);
        })
        .subscribe();
    } catch (e) {
      console.warn('[ChatAPI] Realtime WebSocket no disponible, operando en modo sondeo continuo:', e);
    }
  }

  /**
   * Active server polling: checks PostgreSQL for new messages and room state changes.
   */
  async pollNewMessages() {
    if (this.isPolling || !this.roomCode) return;
    this.isPolling = true;

    try {
      const snapshot = await this.fetchRoomSnapshot();
      if (!snapshot) return;

      // 1. Synchronize card and game state if changed on server
      const cardChanged = Boolean(snapshot.current_card_id && snapshot.current_card_id !== this.lastKnownCardId);
      const turnChanged = typeof snapshot.active_turn === 'number' && snapshot.active_turn !== this.lastKnownActiveTurn;
      const levelChanged = typeof snapshot.level === 'number' && snapshot.level !== this.lastKnownLevel;

      if (cardChanged || turnChanged || levelChanged) {
        this.lastKnownCardId = snapshot.current_card_id;
        this.lastKnownActiveTurn = snapshot.active_turn;
        this.lastKnownLevel = snapshot.level;

        if (typeof this.onStateSyncCallback === 'function') {
          this.onStateSyncCallback(snapshot);
        }
      }

      // 2. Dispatch any new messages in chat_history
      if (Array.isArray(snapshot.chat_history)) {
        snapshot.chat_history.forEach((msg) => {
          this.processIncomingMessage(msg);
        });
      }
    } catch (e) {
      // Network hiccup: silent retry on next tick
    } finally {
      this.isPolling = false;
    }
  }

  /**
   * Fetches room snapshot (current_card_id, active_turn, chemistry_score, level, chat_history) via fast REST query.
   * @returns {Promise<Object|null>}
   */
  async fetchRoomSnapshot() {
    if (!this.roomCode) return null;
    try {
      const url = `${SUPABASE_URL}/rest/v1/rooms?select=current_card_id,active_turn,chemistry_score,level,chat_history&code=eq.${encodeURIComponent(this.roomCode)}`;
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Accept': 'application/json'
        }
      });

      if (!res.ok) return null;
      const rows = await res.json();
      const row = rows[0];
      if (!row) return null;

      return {
        chat_history: row.chat_history || [],
        current_card_id: row.current_card_id || null,
        active_turn: row.active_turn,
        chemistry_score: row.chemistry_score,
        level: row.level
      };
    } catch (e) {
      return null;
    }
  }

  /**
   * Backward-compatible fetchHistory method.
   * @returns {Promise<Array<Object>>}
   */
  async fetchHistory() {
    const snapshot = await this.fetchRoomSnapshot();
    return snapshot?.chat_history || [];
  }

  /**
   * Dispatches a message to the UI callback if it hasn't been seen yet.
   * @param {Object} msg
   */
  processIncomingMessage(msg) {
    if (!msg || !msg.text) return;
    const msgId = msg.id || `msg_${msg.timestamp || Date.now()}_${msg.authorName || 'user'}`;

    if (this.seenMessageIds.has(msgId)) return;
    this.seenMessageIds.add(msgId);

    const isOutgoing = Boolean(msg.senderId && msg.senderId === this.senderId);

    if (typeof this.onMessageCallback === 'function') {
      this.onMessageCallback({
        ...msg,
        id: msgId,
        isOutgoing
      });
    }
  }

  /**
   * Sends a message atomically to PostgreSQL and broadcasts via Realtime.
   * @param {string} text
   * @param {Object} [extraParams]
   * @returns {Promise<Object|null>}
   */
  async sendMessage(text, extraParams = {}) {
    const cleanText = String(text || '').trim();
    if (!cleanText || !this.roomCode) return null;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const msgId = `chat_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    const messageObj = {
      id: msgId,
      senderId: this.senderId,
      authorName: this.authorName || 'Jugador',
      authorRole: this.authorRole || 'player',
      text: cleanText,
      timeStr,
      timestamp: Date.now(),
      ...extraParams
    };

    // Mark as seen locally to prevent duplicate rendering
    this.seenMessageIds.add(msgId);

    // 1. Broadcast over Realtime WebSocket for instant arrival (< 50ms)
    if (this.realtimeChannel && typeof this.realtimeChannel.send === 'function') {
      this.realtimeChannel.send({
        type: 'broadcast',
        event: 'CHAT_MSG',
        payload: messageObj
      }).catch(() => {});
    }

    // 2. Persist atomically in PostgreSQL via RPC
    try {
      const url = `${SUPABASE_URL}/rest/v1/rpc/append_room_message`;
      await fetch(url, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          p_code: this.roomCode,
          p_message: messageObj
        })
      });
    } catch (e) {
      console.warn('[ChatAPI] Error al persistir mensaje en servidor:', e);
    }

    return messageObj;
  }

  /**
   * Disconnects polling and channel listeners cleanly.
   */
  disconnect() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    if (this.realtimeChannel) {
      try {
        this.realtimeChannel.unsubscribe();
      } catch (e) {}
      this.realtimeChannel = null;
    }
    this.roomCode = null;
    this.onMessageCallback = null;
    this.onStateSyncCallback = null;
    this.seenMessageIds.clear();
    this.lastKnownCardId = null;
    this.lastKnownActiveTurn = null;
    this.lastKnownLevel = null;
  }
}
