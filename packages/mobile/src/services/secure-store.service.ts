import * as SecureStore from 'expo-secure-store';

const KEY_VAULT_ID = 'tabvault_mobile_vault_id';
const KEY_DEVICE_ID = 'tabvault_mobile_device_id';
const KEY_PRIVATE_KEY = 'tabvault_mobile_private_key';
const KEY_PUBLIC_KEY = 'tabvault_mobile_public_key';

export class MobileSecureStoreService {
  public static async saveCredentials(
    vaultId: string,
    deviceId: string,
    privateKey: string,
    publicKey: string
  ): Promise<void> {
    await SecureStore.setItemAsync(KEY_VAULT_ID, vaultId);
    await SecureStore.setItemAsync(KEY_DEVICE_ID, deviceId);
    await SecureStore.setItemAsync(KEY_PRIVATE_KEY, privateKey);
    await SecureStore.setItemAsync(KEY_PUBLIC_KEY, publicKey);
  }

  public static async getCredentials(): Promise<{
    vaultId: string | null;
    deviceId: string | null;
    privateKey: string | null;
    publicKey: string | null;
  }> {
    const vaultId = await SecureStore.getItemAsync(KEY_VAULT_ID);
    const deviceId = await SecureStore.getItemAsync(KEY_DEVICE_ID);
    const privateKey = await SecureStore.getItemAsync(KEY_PRIVATE_KEY);
    const publicKey = await SecureStore.getItemAsync(KEY_PUBLIC_KEY);

    return { vaultId, deviceId, privateKey, publicKey };
  }

  public static async clearCredentials(): Promise<void> {
    await SecureStore.deleteItemAsync(KEY_VAULT_ID);
    await SecureStore.deleteItemAsync(KEY_DEVICE_ID);
    await SecureStore.deleteItemAsync(KEY_PRIVATE_KEY);
    await SecureStore.deleteItemAsync(KEY_PUBLIC_KEY);
  }
}
