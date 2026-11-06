/**
 * @file chat-service.js
 * @description Standalone Realtime Chat API with Active Heartbeat Polling and WebSocket Transport.
 * Fully decoupled from game logic, maintaining strict Clean Architecture (SOLID).
 */

import { getSupabase, fetchRoomData, saveRoomMessage } from './supabase-client.js';

const POLL_INTERVAL_WS_ACTIVE_MS = 4500;
const POLL_INTERVAL_FALLBACK_MS = 1800;

export class ChatRoomAPI {
  constructor() {
    this.roomCode = null;
    this.accessToken = null;
    this.senderId = null;
    this.authorName = null;
    this.authorRole = null;
    this.seenMessageIds = new Set();
    this.pollInterval = null;
    this.realtimeChannel = null;
    this.isSocketHealthy = false;
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
   * @param {string} [params.accessToken]
   * @param {string} params.senderId
   * @param {string} params.authorName
   * @param {string} params.authorRole
   * @param {Function} params.onMessage - Called for every incoming or initial message
   * @param {Function} [params.onInitialHistory] - Called with full history array on first load
   * @param {Function} [params.onStateSync] - Called when server room card/turn/level changes
   */
  async connect({ roomCode, accessToken = null, senderId, authorName, authorRole, onMessage, onInitialHistory, onStateSync }) {
    this.disconnect();

    this.roomCode = String(roomCode || '').trim().toUpperCase();
    this.accessToken = accessToken || null;
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

    // 2. Subscribe to Realtime WebSocket channel for instant sub-second delivery
    this.initRealtimeSocket();

    // 3. Start adaptive server polling (pauses automatically when tab is hidden)
    this._restartPollingTimer();
  }

  _restartPollingTimer() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    const intervalMs = this.isSocketHealthy ? POLL_INTERVAL_WS_ACTIVE_MS : POLL_INTERVAL_FALLBACK_MS;
    this.pollInterval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      this.pollNewMessages();
    }, intervalMs);
  }

  /**
   * Initializes Supabase Realtime channel reusing the singleton client (zero connection leaks).
   */
  initRealtimeSocket() {
    const client = getSupabase();
    if (!client || !this.roomCode) return;

    try {
      const channelName = `chemblind_chat:${this.roomCode}`;

      // Remove any stale channel with the same topic before subscribing
      const existing = typeof client.getChannels === 'function' ? client.getChannels() : [];
      const stale = existing.find((ch) => ch.topic === `realtime:${channelName}` || ch.topic === channelName);
      if (stale) {
        client.removeChannel(stale).catch((err) => {
          console.warn('[ChatAPI] Advertencia limpiando canal previo:', err);
        });
      }

      this.realtimeChannel = client.channel(channelName, {
        config: { broadcast: { ack: false, self: false } }
      });

      this.realtimeChannel
        .on('broadcast', { event: 'CHAT_MSG' }, (payload) => {
          const msg = payload.payload || payload;
          this.processIncomingMessage(msg);
        })
        .subscribe((status) => {
          const healthy = status === 'SUBSCRIBED';
          if (healthy !== this.isSocketHealthy) {
            this.isSocketHealthy = healthy;
            this._restartPollingTimer();
          }
        });
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
    } catch (err) {
      console.debug('[ChatAPI] Reintento silencioso de sondeo tras interrupción temporal:', err?.message || err);
    } finally {
      this.isPolling = false;
    }
  }

  /**
   * Fetches room snapshot (current_card_id, active_turn, chemistry_score, level, chat_history) via hardened RPC.
   * @returns {Promise<Object|null>}
   */
  async fetchRoomSnapshot() {
    if (!this.roomCode) return null;
    try {
      const row = await fetchRoomData(this.roomCode, this.accessToken);
      if (!row) return null;

      return {
        chat_history: Array.isArray(row.chat_history) ? row.chat_history : [],
        current_card_id: row.current_card_id || null,
        active_turn: row.active_turn,
        chemistry_score: row.chemistry_score,
        level: row.level
      };
    } catch (err) {
      console.warn('[ChatAPI] Error consultando snapshot de sala:', err);
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
      }).catch((err) => {
        console.warn('[ChatAPI] Advertencia en broadcast WS, persistiendo vía RPC:', err);
      });
    }

    // 2. Persist atomically in PostgreSQL via hardened RPC
    await saveRoomMessage(this.roomCode, messageObj);

    return messageObj;
  }

  /**
   * Disconnects polling and channel listeners cleanly without leaking WebSocket instances.
   */
  disconnect() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    if (this.realtimeChannel) {
      const client = getSupabase();
      if (client && typeof client.removeChannel === 'function') {
        client.removeChannel(this.realtimeChannel).catch((err) => {
          console.warn('[ChatAPI] Advertencia al remover canal Realtime:', err);
        });
      } else {
        try {
          this.realtimeChannel.unsubscribe();
        } catch (err) {
          console.warn('[ChatAPI] Advertencia al desuscribir canal Realtime:', err);
        }
      }
      this.realtimeChannel = null;
    }
    this.isSocketHealthy = false;
    this.roomCode = null;
    this.accessToken = null;
    this.onMessageCallback = null;
    this.onStateSyncCallback = null;
    this.seenMessageIds.clear();
    this.lastKnownCardId = null;
    this.lastKnownActiveTurn = null;
    this.lastKnownLevel = null;
  }
}
