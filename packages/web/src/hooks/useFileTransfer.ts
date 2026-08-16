import { useState, useCallback } from 'react';
import { nanoid } from 'nanoid';
import { TransferProgress, TransferRoute } from '@tabvault/core';
import { LocalIdentity } from '../services/crypto.service.js';
import { WebStorageService } from '../services/storage.service.js';

export function useFileTransfer(identity: LocalIdentity | null) {
  const [activeTransfers, setActiveTransfers] = useState<TransferProgress[]>([]);
  const [transferHistory, setTransferHistory] = useState<TransferProgress[]>([]);

  const startTransfer = useCallback(
    async (file: File, targetDeviceId: string, route: TransferRoute = 'webrtc_lan') => {
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
        route,
      };

      setActiveTransfers((prev) => [initialProgress, ...prev]);

      // Read file buffer
      const buffer = await file.arrayBuffer();
      const startTime = Date.now();
      const chunkSize = 64 * 1024;

      // Simulate streaming chunks across WebRTC with velocity updates
      for (let chunk = 0; chunk < totalChunks; chunk++) {
        await new Promise((r) => setTimeout(r, Math.max(10, 50 - totalChunks)));

        const currentBytes = Math.min((chunk + 1) * chunkSize, totalBytes);
        const elapsedSec = (Date.now() - startTime) / 1000 || 0.01;
        const speed = currentBytes / elapsedSec;
        const remainingBytes = totalBytes - currentBytes;
        const eta = remainingBytes / (speed || 1);

        setActiveTransfers((prev) =>
          prev.map((t) =>
            t.transferId === transferId
              ? {
                  ...t,
                  bytesTransferred: currentBytes,
                  chunksCompleted: chunk + 1,
                  speedBytesPerSec: speed,
                  estimatedSecondsRemaining: eta,
                }
              : t
          )
        );
      }

      // Complete transfer
      const completedItem: TransferProgress = {
        ...initialProgress,
        bytesTransferred: totalBytes,
        chunksCompleted: totalChunks,
        state: 'completed',
      };

      setActiveTransfers((prev) => prev.filter((t) => t.transferId !== transferId));
      setTransferHistory((prev) => [completedItem, ...prev]);
    },
    [identity]
  );

  return {
    activeTransfers,
    transferHistory,
    startTransfer,
  };
}
