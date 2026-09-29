import { Redis } from 'ioredis';
import { ENV } from '../config/env.js';
import type { CanonicalWsEvent } from './websocket.js';

const CHANNEL_NAME = 'dinedeck:realtime_events';

class RedisRealtimeService {
  private publisher: Redis | null = null;
  private subscriber: Redis | null = null;
  private isConnected = false;
  private messageListener: ((event: CanonicalWsEvent) => void) | null = null;

  constructor() {
    this.initClients();
  }

  private initClients() {
    const redisUrl = ENV.REDIS_URL;

    try {
      this.publisher = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        retryStrategy(times) {
          const delay = Math.min(times * 100, 3000);
          return delay;
        },
        lazyConnect: true
      });

      this.subscriber = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        retryStrategy(times) {
          const delay = Math.min(times * 100, 3000);
          return delay;
        },
        lazyConnect: true
      });

      this.publisher.on('connect', () => {
        console.log(`[Redis:Pub] Connected to Redis at ${redisUrl}`);
        this.isConnected = true;
      });

      this.publisher.on('error', (err) => {
        console.warn(`[Redis:Pub] Connection notice: ${err.message}`);
        this.isConnected = false;
      });

      this.subscriber.on('connect', () => {
        console.log(`[Redis:Sub] Connected to Redis subscriber channel: ${CHANNEL_NAME}`);
      });

      this.subscriber.on('error', (err) => {
        console.warn(`[Redis:Sub] Subscriber notice: ${err.message}`);
      });

      // Connect asynchronously
      Promise.all([this.publisher.connect(), this.subscriber.connect()])
        .then(() => {
          this.subscriber?.subscribe(CHANNEL_NAME, (err, count) => {
            if (err) {
              console.error(`[Redis:Sub] Subscription error:`, err);
            } else {
              console.log(`[Redis:Sub] Subscribed to ${count} channel(s): ${CHANNEL_NAME}`);
            }
          });

          this.subscriber?.on('message', (channel, message) => {
            if (channel === CHANNEL_NAME && this.messageListener) {
              try {
                const event: CanonicalWsEvent = JSON.parse(message);
                this.messageListener(event);
              } catch (e: any) {
                console.error(`[Redis:Sub] Failed to parse message on ${channel}:`, e.message);
              }
            }
          });
        })
        .catch((err) => {
          console.warn(`[Redis] Initial connection deferred (will auto-reconnect): ${err.message}`);
        });

    } catch (e: any) {
      console.warn(`[Redis] Initialization warning: ${e.message}`);
    }
  }

  public onMessage(handler: (event: CanonicalWsEvent) => void) {
    this.messageListener = handler;
  }

  public async publishEvent(event: CanonicalWsEvent): Promise<boolean> {
    if (!this.publisher || !this.isConnected) {
      // In standalone or reconnecting state, fallback to local dispatch
      return false;
    }

    try {
      await this.publisher.publish(CHANNEL_NAME, JSON.stringify(event));
      return true;
    } catch (err: any) {
      console.warn(`[Redis:Pub] Failed to publish event ${event.eventId}: ${err.message}`);
      return false;
    }
  }

  public async setCache(key: string, value: string, ttlSeconds = 3600): Promise<void> {
    if (!this.publisher || !this.isConnected) return;
    try {
      await this.publisher.set(key, value, 'EX', ttlSeconds);
    } catch (err: any) {
      console.warn(`[Redis] Cache set error for ${key}:`, err.message);
    }
  }

  public async getCache(key: string): Promise<string | null> {
    if (!this.publisher || !this.isConnected) return null;
    try {
      return await this.publisher.get(key);
    } catch (err: any) {
      console.warn(`[Redis] Cache get error for ${key}:`, err.message);
      return null;
    }
  }

  public async delCache(key: string): Promise<void> {
    if (!this.publisher || !this.isConnected) return;
    try {
      await this.publisher.del(key);
    } catch (err: any) {
      console.warn(`[Redis] Cache del error for ${key}:`, err.message);
    }
  }

  public getStatus() {
    return {
      connected: this.isConnected,
      channel: CHANNEL_NAME,
      url: ENV.REDIS_URL
    };
  }
}

export const redisRealtime = new RedisRealtimeService();
