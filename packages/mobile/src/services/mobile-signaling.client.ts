import { DeviceInfo, SignalingMessage } from '@tabvault/core';

export type MobileMessageListener = (msg: SignalingMessage) => void;
export type MobilePresenceListener = (devices: DeviceInfo[]) => void;
export type MobileStatusListener = (connected: boolean) => void;

export class MobileSignalingClient {
  private ws?: WebSocket;
  private url: string;
  private vaultId: string;
  private localDevice: DeviceInfo;
  private isExplicitClose: boolean = false;
  private reconnectTimeout?: any;
  private pingInterval?: any;

  private messageListeners: Set<MobileMessageListener> = new Set();
  private presenceListeners: Set<MobilePresenceListener> = new Set();
  private statusListeners: Set<MobileStatusListener> = new Set();

  constructor(url: string, vaultId: string, localDevice: DeviceInfo) {
    this.url = url;
    this.vaultId = vaultId;
    this.localDevice = localDevice;
  }

  public updateVault(newVaultId: string): void {
    if (this.vaultId === newVaultId) return;
    this.vaultId = newVaultId;
    this.disconnect();
    this.connect();
  }

  public connect(): void {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.isExplicitClose = false;
    try {
      const query = `?vaultId=${encodeURIComponent(this.vaultId)}&deviceId=${encodeURIComponent(
        this.localDevice.deviceId
      )}&deviceName=${encodeURIComponent(this.localDevice.deviceName)}&platform=android`;
      const fullUrl = this.url.includes('?') ? `${this.url}&${query.slice(1)}` : `${this.url}${query}`;

      this.ws = new WebSocket(fullUrl);

      this.ws.onopen = () => {
        console.log('⚡ [Mobile WS] Connected to Signaling Server');
        this.notifyStatus(true);
        this.sendPresenceJoin();
        this.startHeartbeat();
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data as string) as SignalingMessage;
          if (msg.type === 'presence:state' || msg.type === 'presence_update') {
            const payload = msg.payload as { devices?: DeviceInfo[] } | undefined;
            const devices = payload?.devices || (msg as any).devices || [];
            this.notifyPresence(devices);
          } else if (msg.type === 'pong') {
            // Heartbeat
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
        console.warn('Mobile WebSocket error:', err);
      };
    } catch (err) {
      console.warn('Could not establish Mobile WebSocket:', err);
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

  public onMessage(listener: MobileMessageListener): () => void {
    this.messageListeners.add(listener);
    return () => this.messageListeners.delete(listener);
  }

  public onPresence(listener: MobilePresenceListener): () => void {
    this.presenceListeners.add(listener);
    return () => this.presenceListeners.delete(listener);
  }

  public onStatus(listener: MobileStatusListener): () => void {
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
