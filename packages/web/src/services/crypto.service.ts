import {
  generateIdentityKeyPair,
  exportPublicKeyBase64,
  importPublicKeyBase64,
  deriveSessionKey,
  encryptText,
  decryptText,
  EncryptedPayload,
} from '@tabvault/core';

const STORAGE_KEY_IDENTITY = 'tabvault_identity_key_v1';

export interface LocalIdentity {
  deviceId: string;
  vaultId: string;
  deviceName: string;
  publicKeyBase64: string;
  keyPair: CryptoKeyPair;
}

export class WebCryptoService {
  private static cachedIdentity?: LocalIdentity;
  private static sessionKeys: Map<string, CryptoKey> = new Map(); // targetDeviceId -> CryptoKey

  /**
   * Initializes or loads existing cryptographic identity from localStorage.
   */
  public static async getOrCreateIdentity(vaultIdOverride?: string): Promise<LocalIdentity> {
    if (this.cachedIdentity) return this.cachedIdentity;

    const savedRaw = localStorage.getItem(STORAGE_KEY_IDENTITY);
    let deviceId = '';
    let vaultId = vaultIdOverride || '';
    let deviceName = '';

    if (savedRaw) {
      try {
        const parsed = JSON.parse(savedRaw);
        deviceId = parsed.deviceId;
        vaultId = vaultIdOverride || parsed.vaultId;
        deviceName = parsed.deviceName;
      } catch {
        // ignore
      }
    }

    if (!deviceId) {
      deviceId = `dev_${Math.random().toString(36).substring(2, 10)}`;
    }
    if (!vaultId) {
      vaultId = `vault_${Math.random().toString(36).substring(2, 10)}`;
    }
    if (!deviceName) {
      const platform = this.detectPlatform();
      deviceName = `${platform.toUpperCase()} Browser (${deviceId.substring(4, 8)})`;
    }

    // Generate fresh in-memory CryptoKeyPair for the session
    const keyPair = await generateIdentityKeyPair();
    const publicKeyBase64 = await exportPublicKeyBase64(keyPair.publicKey);

    this.cachedIdentity = {
      deviceId,
      vaultId,
      deviceName,
      publicKeyBase64,
      keyPair,
    };

    localStorage.setItem(
      STORAGE_KEY_IDENTITY,
      JSON.stringify({ deviceId, vaultId, deviceName, publicKeyBase64 })
    );

    return this.cachedIdentity;
  }

  /**
   * Derives an authenticated AES-256-GCM session key for a remote peer device.
   */
  public static async getSessionKeyForPeer(
    targetDeviceId: string,
    targetPublicKeyBase64: string,
    vaultId: string
  ): Promise<CryptoKey> {
    let key = this.sessionKeys.get(targetDeviceId);
    if (!key) {
      const local = await this.getOrCreateIdentity();
      const remotePublicKey = await importPublicKeyBase64(targetPublicKeyBase64);
      key = await deriveSessionKey(local.keyPair.privateKey, remotePublicKey, vaultId);
      this.sessionKeys.set(targetDeviceId, key);
    }
    return key;
  }

  public static async encryptClipboardText(text: string, sessionKey: CryptoKey): Promise<EncryptedPayload> {
    return await encryptText(text, sessionKey);
  }

  public static async decryptClipboardText(payload: EncryptedPayload, sessionKey: CryptoKey): Promise<string> {
    return await decryptText(payload, sessionKey);
  }

  public static detectPlatform(): 'macos' | 'windows' | 'linux' | 'ios' | 'android' | 'web' {
    if (typeof navigator === 'undefined') return 'web';
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes('macintosh') || ua.includes('mac os')) return 'macos';
    if (ua.includes('windows')) return 'windows';
    if (ua.includes('android')) return 'android';
    if (ua.includes('iphone') || ua.includes('ipad')) return 'ios';
    if (ua.includes('linux')) return 'linux';
    return 'web';
  }
}
