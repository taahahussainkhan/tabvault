/**
 * Device identity, platform, and presence definitions for TabVault.
 */

export type PlatformType = 'macos' | 'windows' | 'linux' | 'ios' | 'android' | 'web';

export type DeviceStatus = 'online_local' | 'online_relay' | 'idle' | 'offline';

export interface DeviceInfo {
  deviceId: string;
  deviceName: string;
  platform: PlatformType;
  browser?: string;
  publicKeyBase64: string;
  status: DeviceStatus;
  lastSeen: number; // Unix timestamp ms
  localIps?: string[];
  batteryLevel?: number;
}

export interface VaultProfile {
  vaultId: string;
  vaultName: string;
  createdAt: number;
  devices: DeviceInfo[];
}

export interface PairingPayload {
  version: 1;
  vaultId: string;
  deviceId: string;
  deviceName: string;
  platform: PlatformType;
  publicKeyBase64: string;
  relayRoomId: string;
  syncCode?: string; // 6-digit fallback sync code
  timestamp: number;
}
