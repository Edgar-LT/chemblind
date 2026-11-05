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
    this.isPolling = false;
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
   */
  async connect({ roomCode, senderId, authorName, authorRole, onMessage, onInitialHistory }) {
    this.disconnect();

    this.roomCode = String(roomCode || '').trim().toUpperCase();
    this.senderId = senderId;
    this.authorName = authorName;
    this.authorRole = authorRole;
    this.onMessageCallback = onMessage;

    // 1. Fetch initial chat history
    try {
      const initialHistory = await this.fetchHistory();
      if (Array.isArray(initialHistory)) {
        initialHistory.forEach((msg) => {
          if (msg?.id) this.seenMessageIds.add(msg.id);
        });
        if (typeof onInitialHistory === 'function') {
          onInitialHistory(initialHistory);
        }
      }
    } catch (e) {
      console.warn('[ChatAPI] Error al cargar historial inicial:', e);
    }

    // 2. Start continuous active server polling (every 1.5 seconds)
    // Constantly checks if the other person sent a message to the server
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
   * Active server polling: checks PostgreSQL for new messages and dispatches them.
   */
  async pollNewMessages() {
    if (this.isPolling || !this.roomCode) return;
    this.isPolling = true;

    try {
      const messages = await this.fetchHistory();
      if (Array.isArray(messages)) {
        messages.forEach((msg) => {
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
   * Fetches chat_history directly via ultra-fast REST query.
   * @returns {Promise<Array<Object>>}
   */
  async fetchHistory() {
    if (!this.roomCode) return [];
    try {
      const url = `${SUPABASE_URL}/rest/v1/rooms?select=chat_history&code=eq.${encodeURIComponent(this.roomCode)}`;
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Accept': 'application/json'
        }
      });

      if (!res.ok) return [];
      const rows = await res.json();
      return rows[0]?.chat_history || [];
    } catch (e) {
      return [];
    }
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
    this.seenMessageIds.clear();
  }
}
