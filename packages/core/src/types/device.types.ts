/**
 * Device identity, platform, and presence definitions for TabVault.
 */

import { DeviceInfo } from '../protocol/schemas/device.schema.js';

export * from '../protocol/schemas/device.schema.js';
export * from '../protocol/schemas/pairing.schema.js';

export interface VaultProfile {
  vaultId: string;
  vaultName: string;
  createdAt: number;
  devices: DeviceInfo[];
}
