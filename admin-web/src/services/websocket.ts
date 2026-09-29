// WebSocket Real-time Service for DINEDECK Super Admin Control Center

export type WsStatus = 'CONNECTED' | 'RECONNECTING' | 'DISCONNECTED';

export interface AdminWsMessage {
  type: string;
  data: any;
  eventType?: string;
  payload?: any;
  eventId?: string;
  restaurantId?: string;
  orderId?: string;
  billId?: string;
  timestamp?: string;
}

type MessageListener = (message: AdminWsMessage) => void;
type StatusListener = (status: WsStatus) => void;

class AdminWebSocketService {
  private ws: WebSocket | null = null;
  private baseUrl: string =
    (import.meta as any).env?.VITE_WS_URL ||
    (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
      ? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.hostname}:8080/ws`
      : 'ws://localhost:8080/ws');
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 50;
  private baseReconnectDelay = 1000;
  private messageListeners: Set<MessageListener> = new Set();
  private statusListeners: Set<StatusListener> = new Set();
  private currentStatus: WsStatus = 'DISCONNECTED';
  private reconnectTimeout: any = null;

  connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const fullUrl = `${this.baseUrl}?role=DINEDECK_SUPER_ADMIN`;

    try {
      this.ws = new WebSocket(fullUrl);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.updateStatus('CONNECTED');
        console.log('[AdminWS] Connected to platform real-time stream at', fullUrl);
      };

      this.ws.onmessage = (event) => {
        try {
          const raw = JSON.parse(event.data);
          const normalized: AdminWsMessage = {
            type: raw.eventType || raw.type || 'UNKNOWN',
            data: raw.payload !== undefined ? raw.payload : raw.data,
            eventType: raw.eventType,
            payload: raw.payload,
            eventId: raw.eventId,
            restaurantId: raw.restaurantId,
            orderId: raw.orderId,
            billId: raw.billId,
            timestamp: raw.timestamp
          };
          this.messageListeners.forEach((listener) => listener(normalized));
        } catch (e) {
          console.warn('[AdminWS] Received unparseable message:', event.data);
        }
      };

      this.ws.onclose = () => {
        this.ws = null;
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        if (this.ws) {
          this.ws.close();
        }
      };
    } catch (e) {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    this.updateStatus('RECONNECTING');

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      const delay = Math.min(
        this.baseReconnectDelay * Math.pow(1.5, this.reconnectAttempts),
        15000
      );
      this.reconnectAttempts++;
      this.reconnectTimeout = setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      this.updateStatus('DISCONNECTED');
    }
  }

  private updateStatus(status: WsStatus) {
    this.currentStatus = status;
    this.statusListeners.forEach((listener) => listener(status));
  }

  getStatus(): WsStatus {
    return this.currentStatus;
  }

  onMessage(listener: MessageListener) {
    this.messageListeners.add(listener);
    return () => {
      this.messageListeners.delete(listener);
    };
  }

  onStatusChange(listener: StatusListener) {
    this.statusListeners.add(listener);
    listener(this.currentStatus);
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  disconnect() {
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.updateStatus('DISCONNECTED');
  }
}

export const adminWs = new AdminWebSocketService();
