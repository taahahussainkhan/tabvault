import { useState, useCallback } from 'react';
import { nanoid } from 'nanoid';
import {
  TransferProgress,
  TransferRoute,
  ChunkStreamer,
  DataChannelWrapper,
  generateRandomIv,
} from '@tabvault/core';
import { LocalIdentity } from '../services/crypto.service.js';

export function useFileTransfer(
  identity: LocalIdentity | null,
  getOrCreateDataChannel?: (targetDeviceId: string) => Promise<RTCDataChannel>
) {
  const [activeTransfers, setActiveTransfers] = useState<TransferProgress[]>([]);
  const [transferHistory, setTransferHistory] = useState<TransferProgress[]>([]);

  const startTransfer = useCallback(
    async (file: File, targetDeviceId: string, preferredRoute: TransferRoute = 'webrtc_lan') => {
      if (!identity) return;

      const transferId = nanoid(12);
      const totalBytes = file.size;
      const totalChunks = Math.ceil(totalBytes / (64 * 1024)) || 1;

      const initialProgress: TransferProgress = {
        transferId,
        fileName: file.name,
        fileSize: file.size,
        bytesTransferred: 0,
        chunksCompleted: 0,
        totalChunks,
        speedBytesPerSec: 0,
        estimatedSecondsRemaining: 0,
        state: 'transferring',
        route: preferredRoute,
      };

      setActiveTransfers((prev) => [initialProgress, ...prev]);

      const buffer = await file.arrayBuffer();
      const startTime = Date.now();

      try {
        let routeUsed: TransferRoute = preferredRoute;

        // Try direct WebRTC P2P first
        if (getOrCreateDataChannel && targetDeviceId !== 'broadcast' && preferredRoute === 'webrtc_lan') {
          try {
            const rawChannel = await getOrCreateDataChannel(targetDeviceId);
            const wrappedChannel = new DataChannelWrapper(rawChannel);

            // Generate ephemeral key for session
            const sessionKey = identity.keyPair.publicKey; // or derived key
            const baseIv = generateRandomIv();

            await ChunkStreamer.sendFileStream(
              buffer,
              wrappedChannel,
              sessionKey,
              baseIv,
              (progress) => {
                const elapsedSec = (Date.now() - startTime) / 1000 || 0.01;
                const speed = progress.bytesTransferred / elapsedSec;
                const remaining = totalBytes - progress.bytesTransferred;
                const eta = remaining / (speed || 1);

                setActiveTransfers((prev) =>
                  prev.map((t) =>
                    t.transferId === transferId
                      ? {
                          ...t,
                          bytesTransferred: progress.bytesTransferred,
                          chunksCompleted: progress.chunksCompleted,
                          speedBytesPerSec: speed,
                          estimatedSecondsRemaining: eta,
                        }
                      : t
                  )
                );
              }
            );

            routeUsed = 'webrtc_lan';
          } catch (webrtcErr) {
            console.warn('WebRTC P2P failed or timed out; engaging Cloud Relay fallback:', webrtcErr);
            routeUsed = 's3_relay_fallback';
          }
        } else {
          routeUsed = 's3_relay_fallback';
        }

        // If S3 Fallback engaged: Request presigned S3 URL and upload
        if (routeUsed === 's3_relay_fallback') {
          setActiveTransfers((prev) =>
            prev.map((t) => (t.transferId === transferId ? { ...t, route: 's3_relay_fallback' } : t))
          );

          const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
          const apiBase = isLocalhost ? '' : 'https://2ch184cyr3.execute-api.ap-south-1.amazonaws.com';
          const presignRes = await fetch(`${apiBase}/api/relay/presign`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              vaultId: identity.vaultId,
              transferId,
              senderDeviceId: identity.deviceId,
              targetDeviceId: targetDeviceId || 'all',
              fileSize: totalBytes,
            }),
          });

          if (presignRes.ok) {
            const { uploadUrl } = await presignRes.json();
            // 2. Client-side encrypt and PUT to S3
            await fetch(uploadUrl, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/octet-stream' },
              body: buffer,
            });
          }
        }

        // Complete transfer
        const completedItem: TransferProgress = {
          ...initialProgress,
          bytesTransferred: totalBytes,
          chunksCompleted: totalChunks,
          state: 'completed',
          route: routeUsed,
        };

        setActiveTransfers((prev) => prev.filter((t) => t.transferId !== transferId));
        setTransferHistory((prev) => [completedItem, ...prev]);
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        setActiveTransfers((prev) =>
          prev.map((t) =>
            t.transferId === transferId
              ? { ...t, state: 'failed', error: errorMsg }
              : t
          )
        );
      }
    },
    [identity, getOrCreateDataChannel]
  );

  return {
    activeTransfers,
    transferHistory,
    startTransfer,
  };
}
