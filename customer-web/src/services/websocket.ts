// WebSocket Real-time Listener for Customer Web

export type WsStatus = 'CONNECTED' | 'RECONNECTING' | 'DISCONNECTED';

type MessageListener = (msg: { type: string; data: any; eventType?: string; payload?: any }) => void;

class CustomerWsService {
  private ws: WebSocket | null = null;
  private baseUrl: string =
    (import.meta as any).env?.VITE_WS_URL ||
    (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
      ? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.hostname}:8080/ws`
      : 'ws://localhost:8080/ws');
  private connectionParams: { restaurantId?: string; userId?: string; tableNumber?: string } = {};
  private listeners: Set<MessageListener> = new Set();
  private reconnectTimeout: any = null;

  connect(params?: { restaurantId?: string; userId?: string; tableNumber?: string }) {
    if (params) {
      this.connectionParams = { ...this.connectionParams, ...params };
    }

    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const queryParams = new URLSearchParams();
    if (this.connectionParams.restaurantId) queryParams.append('restaurantId', this.connectionParams.restaurantId);
    if (this.connectionParams.userId) queryParams.append('userId', this.connectionParams.userId);
    if (this.connectionParams.tableNumber) queryParams.append('tableNumber', this.connectionParams.tableNumber);

    const fullUrl = queryParams.toString() ? `${this.baseUrl}?${queryParams.toString()}` : this.baseUrl;

    try {
      this.ws = new WebSocket(fullUrl);

      this.ws.onmessage = (event) => {
        try {
          const raw = JSON.parse(event.data);
          const normalized = {
            type: raw.eventType || raw.type || 'UNKNOWN',
            data: raw.payload !== undefined ? raw.payload : raw.data,
            eventType: raw.eventType,
            payload: raw.payload
          };
          this.listeners.forEach((l) => l(normalized));
        } catch (e) {
          // ignore
        }
      };

      this.ws.onclose = () => {
        this.ws = null;
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        if (this.ws) this.ws.close();
      };
    } catch (e) {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, 2000);
  }

  onMessage(listener: MessageListener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  disconnect() {
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const customerWs = new CustomerWsService();
