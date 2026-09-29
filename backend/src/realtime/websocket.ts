import { WebSocket } from 'ws';
import crypto from 'crypto';

export interface CanonicalWsEvent {
  eventId: string;
  eventType: string;
  entityId: string;
  restaurantId?: string;
  branchId?: string;
  orderId?: string;
  billId?: string;
  paymentId?: string;
  version: number;
  timestamp: string;
  payload: any;
}

export interface WsClient {
  id: string;
  socket: WebSocket;
  userId?: string;
  restaurantId?: string;
  role?: string;
  tableNumber?: string;
  connectedAt: Date;
  lastPingAt: Date;
}

class RealtimeHub {
  private clients: Map<string, WsClient> = new Map();
  private eventHistory: CanonicalWsEvent[] = [];
  private eventVersionMap: Map<string, number> = new Map(); // entityId -> version counter
  private readonly MAX_HISTORY = 500;

  public registerClient(client: { id: string; socket: WebSocket; userId?: string; restaurantId?: string; role?: string; tableNumber?: string }) {
    const fullClient: WsClient = {
      ...client,
      connectedAt: new Date(),
      lastPingAt: new Date()
    };

    this.clients.set(client.id, fullClient);
    console.log(`[WebSocket] Client connected: ${client.id} (role=${client.role}, restaurantId=${client.restaurantId}, userId=${client.userId})`);

    // Setup heartbeat ping/pong
    client.socket.on('pong', () => {
      fullClient.lastPingAt = new Date();
    });

    client.socket.on('close', () => {
      this.clients.delete(client.id);
      console.log(`[WebSocket] Client disconnected: ${client.id}`);
    });

    client.socket.on('error', (err) => {
      console.error(`[WebSocket] Error on client ${client.id}:`, err.message);
      this.clients.delete(client.id);
    });

    // Send connection handshake with current server state
    if (client.socket.readyState === WebSocket.OPEN) {
      client.socket.send(
        JSON.stringify({
          eventId: `evt_handshake_${Date.now()}`,
          eventType: 'CONNECTED',
          entityId: client.id,
          version: 1,
          timestamp: new Date().toISOString(),
          payload: {
            clientId: client.id,
            serverTime: new Date().toISOString(),
            message: 'Connected to DINEDECK Canonical Realtime Engine'
          }
        })
      );
    }
  }

  public createEvent(params: {
    eventType: string;
    entityId: string;
    restaurantId?: string;
    branchId?: string;
    orderId?: string;
    billId?: string;
    paymentId?: string;
    payload: any;
  }): CanonicalWsEvent {
    const currentVersion = (this.eventVersionMap.get(params.entityId) || 0) + 1;
    this.eventVersionMap.set(params.entityId, currentVersion);

    const event: CanonicalWsEvent = {
      eventId: `evt_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      eventType: params.eventType,
      entityId: params.entityId,
      restaurantId: params.restaurantId,
      branchId: params.branchId,
      orderId: params.orderId,
      billId: params.billId,
      paymentId: params.paymentId,
      version: currentVersion,
      timestamp: new Date().toISOString(),
      payload: params.payload
    };

    // Store in ring buffer for reconnect resynchronization
    this.eventHistory.push(event);
    if (this.eventHistory.length > this.MAX_HISTORY) {
      this.eventHistory.shift();
    }

    return event;
  }

  public dispatchEvent(event: CanonicalWsEvent) {
    const serialized = JSON.stringify(event);

    for (const client of this.clients.values()) {
      if (client.socket.readyState !== WebSocket.OPEN) continue;

      let shouldSend = false;

      // 1. Super Admins receive all platform events
      if (client.role === 'DINEDECK_ADMIN' || client.role === 'DINEDECK_SUPER_ADMIN') {
        shouldSend = true;
      }
      // 2. Staff receives events for their restaurant
      else if (event.restaurantId && client.restaurantId === event.restaurantId) {
        shouldSend = true;
      }
      // 3. User receives events specifically for their orders/bills/payments
      else if (event.payload?.userId && client.userId === event.payload.userId) {
        shouldSend = true;
      }
      // 3b. Assigned Waiter / Captain receives targeted table & food pickup alerts
      else if (event.payload?.waiterId && client.userId === event.payload.waiterId) {
        shouldSend = true;
      }
      // 4. Customer on matching table or session
      else if (client.tableNumber && (event.payload?.tableNumber === client.tableNumber || event.payload?.tableId === client.tableNumber)) {
        shouldSend = true;
      }
      // 5. Universal Client / Mobile / Web listener (connected without restrictive filter)
      else if (!client.restaurantId && !client.tableNumber && !client.role) {
        shouldSend = true;
      }
      // 6. Global & Menu broadcasts
      else if (['RESTAURANT_STATUS_CHANGED', 'MENU_ITEM_AVAILABILITY_CHANGED', 'MENU_AVAILABILITY_CHANGED', 'SYSTEM_BROADCAST', 'BANNER_UPDATED'].includes(event.eventType)) {
        shouldSend = true;
      }

      if (shouldSend) {
        try {
          client.socket.send(serialized);
        } catch (e: any) {
          console.error(`[WebSocket] Failed to send event to client ${client.id}:`, e.message);
        }
      }
    }
  }

  public emit(params: {
    eventType: string;
    entityId: string;
    restaurantId?: string;
    branchId?: string;
    orderId?: string;
    billId?: string;
    paymentId?: string;
    payload: any;
  }): CanonicalWsEvent {
    const event = this.createEvent(params);
    this.dispatchEvent(event);
    return event;
  }

  public broadcastEvent(eventType: string, payload: any): CanonicalWsEvent {
    return this.emit({
      eventType,
      entityId: `broadcast_${Date.now()}`,
      payload
    });
  }

  // Get historical events since a given timestamp or eventId for reconnection catch-up
  public getEventsSince(sinceTimestamp?: string, restaurantId?: string, userId?: string): CanonicalWsEvent[] {
    if (!sinceTimestamp) return this.eventHistory.slice(-50);
    const sinceDate = new Date(sinceTimestamp).getTime();
    return this.eventHistory.filter((e) => {
      const matchTime = new Date(e.timestamp).getTime() > sinceDate;
      if (!matchTime) return false;
      if (restaurantId && e.restaurantId === restaurantId) return true;
      if (userId && e.payload?.userId === userId) return true;
      return !restaurantId && !userId;
    });
  }

  // Legacy convenience wrappers updated to use canonical emit
  public notifyUser(userId: string, eventType: string, payload: any) {
    return this.emit({
      eventType,
      entityId: payload.orderId || payload.billId || userId,
      orderId: payload.orderId,
      billId: payload.billId,
      paymentId: payload.paymentId,
      payload: { ...payload, userId }
    });
  }

  public notifyRestaurantStaff(restaurantId: string, eventType: string, payload: any) {
    return this.emit({
      eventType,
      entityId: payload.orderId || payload.tableId || restaurantId,
      restaurantId,
      branchId: payload.branchId,
      orderId: payload.orderId,
      billId: payload.billId,
      paymentId: payload.paymentId,
      payload
    });
  }

  public notifyAssignedWaiter(waiterId: string, eventType: string, payload: any, restaurantId?: string) {
    return this.emit({
      eventType,
      entityId: waiterId,
      restaurantId: restaurantId || payload.restaurantId,
      orderId: payload.orderId,
      payload: { ...payload, waiterId }
    });
  }

  public broadcastToRestaurant(restaurantId: string, payload: any) {
    return this.emit({
      eventType: payload.event || 'RESTAURANT_UPDATE',
      entityId: payload.itemId || restaurantId,
      restaurantId,
      payload
    });
  }

  public getActiveConnectionsCount(): number {
    return this.clients.size;
  }

  public broadcastToAll(payload: any) {
    return this.emit({
      eventType: payload.event || 'SYSTEM_BROADCAST',
      entityId: payload.restaurantId || 'global',
      restaurantId: payload.restaurantId,
      payload
    });
  }
}

export const realtimeHub = new RealtimeHub();
