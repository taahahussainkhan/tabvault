import { WebSocket } from 'ws';
import { DeviceInfo } from '@tabvault/core';

export interface ConnectedPeer {
  ws: WebSocket;
  vaultId: string;
  deviceId: string;
  deviceInfo: DeviceInfo;
  isAlive: boolean;
  connectedAt: number;
}

export class SignalingService {
  // Map of vaultId -> Map of deviceId -> ConnectedPeer
  private static rooms: Map<string, Map<string, ConnectedPeer>> = new Map();

  /**
   * Registers a connected peer into their vault room.
   */
  public static registerPeer(peer: ConnectedPeer): void {
    let vaultRoom = this.rooms.get(peer.vaultId);
    if (!vaultRoom) {
      vaultRoom = new Map();
      this.rooms.set(peer.vaultId, vaultRoom);
    }

    // Replace old socket if already connected
    const existing = vaultRoom.get(peer.deviceId);
    if (existing && existing.ws !== peer.ws) {
      try {
        existing.ws.close(1000, 'Replaced by new connection');
      } catch {
        // ignore
      }
    }

    vaultRoom.set(peer.deviceId, peer);

    // Broadcast updated presence to all peers in the vault
    this.broadcastPresence(peer.vaultId);
  }

  /**
   * Unregisters a peer on disconnect.
   */
  public static unregisterPeer(vaultId: string, deviceId: string): void {
    const vaultRoom = this.rooms.get(vaultId);
    if (!vaultRoom) return;

    vaultRoom.delete(deviceId);
    if (vaultRoom.size === 0) {
      this.rooms.delete(vaultId);
    } else {
      this.broadcastPresence(vaultId);
    }
  }

  /**
   * Returns all active devices in a vault room.
   */
  public static getActiveDevices(vaultId: string): DeviceInfo[] {
    const vaultRoom = this.rooms.get(vaultId);
    if (!vaultRoom) return [];

    return Array.from(vaultRoom.values()).map((p) => ({
      ...p.deviceInfo,
      status: 'online_local',
      lastSeen: Date.now(),
    }));
  }

  /**
   * Broadcasts presence state to all devices in the vault.
   */
  public static broadcastPresence(vaultId: string): void {
    const vaultRoom = this.rooms.get(vaultId);
    if (!vaultRoom) return;

    const devices = this.getActiveDevices(vaultId);
    const message = JSON.stringify({
      type: 'presence:state',
      vaultId,
      senderDeviceId: 'server',
      payload: { devices },
      timestamp: Date.now(),
    });

    for (const peer of vaultRoom.values()) {
      if (peer.ws.readyState === WebSocket.OPEN) {
        peer.ws.send(message);
      }
    }
  }

  /**
   * Relays a message to a specific target device or broadcasts to all peers in the vault.
   */
  public static relayMessage(
    vaultId: string,
    senderDeviceId: string,
    targetDeviceId: string | undefined,
    messageStr: string
  ): boolean {
    const vaultRoom = this.rooms.get(vaultId);
    if (!vaultRoom) return false;

    if (targetDeviceId) {
      const targetPeer = vaultRoom.get(targetDeviceId);
      if (targetPeer && targetPeer.ws.readyState === WebSocket.OPEN) {
        targetPeer.ws.send(messageStr);
        return true;
      }
      return false;
    } else {
      // Broadcast to all other peers in the vault except sender
      for (const [id, peer] of vaultRoom.entries()) {
        if (id !== senderDeviceId && peer.ws.readyState === WebSocket.OPEN) {
          peer.ws.send(messageStr);
        }
      }
      return true;
    }
  }

  public static getPeer(vaultId: string, deviceId: string): ConnectedPeer | undefined {
    return this.rooms.get(vaultId)?.get(deviceId);
  }
}
