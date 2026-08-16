import { useState, useEffect } from 'react';
import { LocalIdentity, WebCryptoService } from '../services/crypto.service.js';

export function useVaultIdentity() {
  const [identity, setIdentity] = useState<LocalIdentity | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    WebCryptoService.getOrCreateIdentity().then((id) => {
      setIdentity(id);
      setLoading(false);
    });
  }, []);

  const changeVault = async (newVaultId: string) => {
    setLoading(true);
    const updated = await WebCryptoService.getOrCreateIdentity(newVaultId);
    setIdentity(updated);
    setLoading(false);
  };

  return { identity, loading, changeVault };
}
