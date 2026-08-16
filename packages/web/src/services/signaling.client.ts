import { SignalingMessage, DeviceInfo } from '@tabvault/core';

export type MessageListener = (msg: SignalingMessage) => void;
export type PresenceListener = (devices: DeviceInfo[]) => void;
export type StatusListener = (connected: boolean) => void;

export class SignalingClient {
  private ws?: WebSocket;
  private url: string;
  private vaultId: string;
  private localDevice: DeviceInfo;
  private isExplicitClose: boolean = false;
  private reconnectTimeout?: NodeJS.Timeout;
  private pingInterval?: NodeJS.Timeout;

  private messageListeners: Set<MessageListener> = new Set();
  private presenceListeners: Set<PresenceListener> = new Set();
  private statusListeners: Set<StatusListener> = new Set();

  constructor(url: string, vaultId: string, localDevice: DeviceInfo) {
    this.url = url;
    this.vaultId = vaultId;
    this.localDevice = localDevice;
  }

  public connect(): void {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.isExplicitClose = false;
    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.notifyStatus(true);
        this.sendPresenceJoin();
        this.startHeartbeat();
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data) as SignalingMessage;
          if (msg.type === 'presence:state') {
            const payload = msg.payload as { devices: DeviceInfo[] };
            this.notifyPresence(payload.devices || []);
          } else if (msg.type === 'pong') {
            // Heartbeat ACK
          } else {
            this.notifyMessage(msg);
          }
        } catch (err) {
          console.warn('Failed to parse WebSocket message:', err);
        }
      };

      this.ws.onclose = () => {
        this.notifyStatus(false);
        this.stopHeartbeat();
        if (!this.isExplicitClose) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = (err) => {
        console.warn('WebSocket signaling client error:', err);
      };
    } catch (err) {
      console.warn('Could not establish WebSocket connection:', err);
      this.scheduleReconnect();
    }
  }

  private sendPresenceJoin(): void {
    this.send({
      type: 'presence:join',
      vaultId: this.vaultId,
      senderDeviceId: this.localDevice.deviceId,
      payload: this.localDevice,
      timestamp: Date.now(),
    });
  }

  public send(message: SignalingMessage): boolean {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
      return true;
    }
    return false;
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.pingInterval = setInterval(() => {
      this.send({
        type: 'ping',
        vaultId: this.vaultId,
        senderDeviceId: this.localDevice.deviceId,
        payload: {},
        timestamp: Date.now(),
      });
    }, 20000);
  }

  private stopHeartbeat(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = undefined;
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimeout) return;
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = undefined;
      this.connect();
    }, 3000);
  }

  public onMessage(listener: MessageListener): () => void {
    this.messageListeners.add(listener);
    return () => this.messageListeners.delete(listener);
  }

  public onPresence(listener: PresenceListener): () => void {
    this.presenceListeners.add(listener);
    return () => this.presenceListeners.delete(listener);
  }

  public onStatus(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    return () => this.statusListeners.delete(listener);
  }

  private notifyMessage(msg: SignalingMessage): void {
    for (const listener of this.messageListeners) {
      listener(msg);
    }
  }

  private notifyPresence(devices: DeviceInfo[]): void {
    for (const listener of this.presenceListeners) {
      listener(devices);
    }
  }

  private notifyStatus(connected: boolean): void {
    for (const listener of this.statusListeners) {
      listener(connected);
    }
  }

  public disconnect(): void {
    this.isExplicitClose = true;
    this.stopHeartbeat();
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = undefined;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = undefined;
    }
  }
}
