import { nanoid } from 'nanoid';
import { PairingPayload } from '@tabvault/core';
import { DeviceModel } from '../database/models/device.model.js';
import { VaultModel } from '../database/models/vault.model.js';
import { DatabaseClient } from '../database/mongo.client.js';

interface EphemeralPairingRequest {
  syncCode: string;
  payload: PairingPayload;
  expiresAt: number;
}

export class PairingService {
  private static pendingSyncCodes: Map<string, EphemeralPairingRequest> = new Map();

  /**
   * Generates a 6-digit sync code for device pairing with TTL.
   */
  public static createSyncCode(payload: PairingPayload, ttlSeconds: number = 300): string {
    const syncCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + ttlSeconds * 1000;

    this.pendingSyncCodes.set(syncCode, {
      syncCode,
      payload: { ...payload, syncCode },
      expiresAt,
    });

    // Cleanup expired codes
    setTimeout(() => {
      this.pendingSyncCodes.delete(syncCode);
    }, ttlSeconds * 1000);

    return syncCode;
  }

  /**
   * Resolves a 6-digit sync code into the initiator's pairing payload.
   */
  public static resolveSyncCode(code: string): PairingPayload | undefined {
    const entry = this.pendingSyncCodes.get(code);
    if (!entry) return undefined;

    if (Date.now() > entry.expiresAt) {
      this.pendingSyncCodes.delete(code);
      return undefined;
    }

    return entry.payload;
  }

  /**
   * Persists device registration into MongoDB when database is active.
   */
  public static async registerDeviceInVault(payload: PairingPayload): Promise<void> {
    if (!DatabaseClient.connected) return;

    try {
      // Ensure Vault document exists
      await VaultModel.findOneAndUpdate(
        { vaultId: payload.vaultId },
        { vaultId: payload.vaultId, vaultName: `Vault ${payload.vaultId.substring(0, 6)}` },
        { upsert: true, new: true }
      );

      // Upsert Device document
      await DeviceModel.findOneAndUpdate(
        { deviceId: payload.deviceId },
        {
          deviceId: payload.deviceId,
          vaultId: payload.vaultId,
          deviceName: payload.deviceName,
          platform: payload.platform,
          publicKeyBase64: payload.publicKeyBase64,
          status: 'online_local',
          lastSeen: new Date(),
        },
        { upsert: true, new: true }
      );
    } catch (err) {
      console.warn('Could not persist device to MongoDB:', err);
    }
  }
}
