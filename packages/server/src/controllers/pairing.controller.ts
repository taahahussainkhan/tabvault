import { FastifyRequest, FastifyReply } from 'fastify';
import { PairingPayloadSchema } from '@tabvault/core';
import { PairingService } from '../services/pairing.service.js';
import { env } from '../config/env.config.js';

export class PairingController {
  /**
   * Generates a 6-digit sync code for device pairing.
   */
  public static async createSyncCode(req: FastifyRequest, reply: FastifyReply): Promise<void> {
    const parseResult = PairingPayloadSchema.safeParse(req.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'Invalid pairing payload',
        details: parseResult.error.format(),
      });
    }

    const payload = parseResult.data;
    const syncCode = PairingService.createSyncCode(payload, env.SYNC_CODE_TTL_SECONDS);

    // Persist to MongoDB if connected
    await PairingService.registerDeviceInVault(payload);

    return reply.send({
      success: true,
      syncCode,
      expiresInSeconds: env.SYNC_CODE_TTL_SECONDS,
      qrDataUrl: `tabvault://pair?vaultId=${payload.vaultId}&syncCode=${syncCode}&pubKey=${encodeURIComponent(payload.publicKeyBase64)}`,
    });
  }

  /**
   * Resolves a 6-digit sync code entered on a peer device.
   */
  public static async resolveSyncCode(
    req: FastifyRequest<{ Params: { code: string } }>,
    reply: FastifyReply
  ): Promise<void> {
    const { code } = req.params;
    const payload = PairingService.resolveSyncCode(code);

    if (!payload) {
      return reply.status(404).send({
        error: 'Invalid or expired sync code',
      });
    }

    return reply.send({
      success: true,
      payload,
    });
  }
}
