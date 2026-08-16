import { useState, useEffect, useCallback } from 'react';
import { nanoid } from 'nanoid';
import { ClipboardItemPayload, SignalingMessage } from '@tabvault/core';
import { LocalIdentity, WebCryptoService } from '../services/crypto.service.js';
import { SignalingClient } from '../services/signaling.client.js';

export interface ClipboardEntry {
  id: string;
  senderDeviceId: string;
  senderDeviceName: string;
  senderPlatform: string;
  text: string;
  timestamp: number;
  isCopied?: boolean;
}

export function useUniversalClipboard(
  identity: LocalIdentity | null,
  signalingClient: SignalingClient | null
) {
  const [history, setHistory] = useState<ClipboardEntry[]>([]);

  // 1. Listen for incoming encrypted clipboard events from WebSocket
  useEffect(() => {
    if (!signalingClient || !identity) return;

    const unsubscribe = signalingClient.onMessage(async (msg: SignalingMessage) => {
      if (msg.type === 'relay:clipboard') {
        const payload = msg.payload as ClipboardItemPayload;
        try {
          // Derive session key with sender device
          // For simplicity in the demo vault, use identity key or direct text
          let decryptedText = '';
          try {
            decryptedText = atob(payload.encryptedContent); // Base64 decode
          } catch {
            decryptedText = payload.encryptedContent;
          }

          const newEntry: ClipboardEntry = {
            id: payload.id,
            senderDeviceId: payload.senderDeviceId,
            senderDeviceName: payload.senderDeviceName,
            senderPlatform: payload.senderPlatform,
            text: decryptedText,
            timestamp: payload.timestamp,
          };

          setHistory((prev) => [newEntry, ...prev.filter((item) => item.id !== newEntry.id)].slice(0, 30));
        } catch (err) {
          console.warn('Failed to process clipboard payload:', err);
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [signalingClient, identity]);

  // 2. Broadcast a clipboard item to all paired devices in the vault
  const broadcastClipboard = useCallback(
    async (text: string) => {
      if (!text.trim() || !identity || !signalingClient) return;

      const id = nanoid(10);
      const encodedText = btoa(text); // Base64 encoded payload

      const payload: ClipboardItemPayload = {
        id,
        senderDeviceId: identity.deviceId,
        senderDeviceName: identity.deviceName,
        senderPlatform: WebCryptoService.detectPlatform(),
        contentType: 'text/plain',
        encryptedContent: encodedText,
        iv: 'ephemeral_iv',
        timestamp: Date.now(),
      };

      const msg: SignalingMessage<ClipboardItemPayload> = {
        type: 'relay:clipboard',
        vaultId: identity.vaultId,
        senderDeviceId: identity.deviceId,
        payload,
        timestamp: Date.now(),
      };

      signalingClient.send(msg);

      // Add to local history
      setHistory((prev) => [
        {
          id,
          senderDeviceId: identity.deviceId,
          senderDeviceName: 'This Device (You)',
          senderPlatform: WebCryptoService.detectPlatform(),
          text,
          timestamp: Date.now(),
        },
        ...prev,
      ].slice(0, 30));
    },
    [identity, signalingClient]
  );

  // 3. Global paste event listener (Ctrl+V / Cmd+V anywhere on window)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      // Don't intercept if user is typing in an input/textarea
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea') return;

      const pastedText = e.clipboardData?.getData('text');
      if (pastedText) {
        broadcastClipboard(pastedText);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [broadcastClipboard]);

  // 4. 1-Tap Copy Action
  const copyToClipboard = async (entry: ClipboardEntry) => {
    try {
      await navigator.clipboard.writeText(entry.text);
      setHistory((prev) =>
        prev.map((item) => (item.id === entry.id ? { ...item, isCopied: true } : item))
      );
      setTimeout(() => {
        setHistory((prev) =>
          prev.map((item) => (item.id === entry.id ? { ...item, isCopied: false } : item))
        );
      }, 2000);
    } catch (err) {
      console.warn('Could not write to clipboard:', err);
    }
  };

  return {
    history,
    broadcastClipboard,
    copyToClipboard,
  };
}
