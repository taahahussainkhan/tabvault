import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
  ApiGatewayManagementApiClient,
  PostToConnectionCommand,
  GoneException,
} from '@aws-sdk/client-apigatewaymanagementapi';
import { DatabaseClient } from './database/mongo.client.js';
import { ConnectionModel } from './database/models/Connection.model.js';
import { S3RelayService } from './services/s3-relay.service.js';
import { PairingService } from './services/pairing.service.js';
import { env } from './config/env.config.js';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
};

function getApiGwClient(domainName: string, stage: string): ApiGatewayManagementApiClient {
  return new ApiGatewayManagementApiClient({
    endpoint: `https://${domainName}/${stage}`,
    region: env.AWS_REGION,
  });
}

async function postMessage(
  client: ApiGatewayManagementApiClient,
  connectionId: string,
  payload: unknown
): Promise<boolean> {
  try {
    const data = typeof payload === 'string' ? payload : JSON.stringify(payload);
    await client.send(
      new PostToConnectionCommand({
        ConnectionId: connectionId,
        Data: Buffer.from(data),
      })
    );
    return true;
  } catch (err: unknown) {
    if (err instanceof GoneException || (err as { name?: string }).name === 'GoneException') {
      await ConnectionModel.deleteOne({ connectionId });
    }
    return false;
  }
}

/**
 * AWS Lambda Unified Entry Point for API Gateway WebSockets & REST HTTP
 */
export async function handler(event: any): Promise<APIGatewayProxyResult> {
  await DatabaseClient.connect();

  const isHttpEvent = Boolean(event.requestContext?.http || event.httpMethod);

  // ===========================================================================
  // A. HTTP REST Routes (/health, /api/relay/presign, /api/pair/sync-code)
  // ===========================================================================
  if (isHttpEvent) {
    const rawPath = event.rawPath || event.path || '';
    const method = event.requestContext?.http?.method || event.httpMethod || '';

    if (method === 'OPTIONS') {
      return { statusCode: 200, headers: CORS_HEADERS, body: '' };
    }

    if (rawPath.endsWith('/health') || rawPath === '/health') {
      return {
        statusCode: 200,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'ok',
          service: 'tabvault-serverless-lambda',
          database: DatabaseClient.connected ? 'connected' : 'connecting',
          timestamp: Date.now(),
        }),
      };
    }

    if (rawPath.includes('/relay/presign') && method === 'POST') {
      try {
        const body = event.body ? JSON.parse(event.body) : {};
        const { vaultId, transferId, fileSize } = body;

        if (!vaultId || !transferId) {
          return {
            statusCode: 400,
            headers: CORS_HEADERS,
            body: JSON.stringify({ error: 'Missing vaultId or transferId' }),
          };
        }

        const { uploadUrl, objectKey } = await S3RelayService.generatePresignedUploadUrl(
          vaultId,
          transferId,
          fileSize
        );
        const downloadUrl = await S3RelayService.generatePresignedDownloadUrl(objectKey);

        return {
          statusCode: 200,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
          body: JSON.stringify({ uploadUrl, downloadUrl, objectKey, expiresIn: 3600 }),
        };
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Error generating presigned URL';
        return { statusCode: 500, headers: CORS_HEADERS, body: JSON.stringify({ error: errorMsg }) };
      }
    }

    if (rawPath.includes('/pair/sync-code') && method === 'POST') {
      try {
        const body = event.body ? JSON.parse(event.body) : {};
        const { vaultId, deviceId } = body;
        const code = await PairingService.generateSyncCode(vaultId, deviceId);
        return {
          statusCode: 200,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, expiresInSeconds: 300 }),
        };
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Error generating sync code';
        return { statusCode: 500, headers: CORS_HEADERS, body: JSON.stringify({ error: errorMsg }) };
      }
    }

    return {
      statusCode: 404,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Not Found' }),
    };
  }

  // ===========================================================================
  // B. WebSocket Routes ($connect, $disconnect, $default)
  // ===========================================================================
  const eventType = event.requestContext?.eventType;
  const routeKey = event.requestContext?.routeKey;
  const connectionId = event.requestContext?.connectionId;
  const domainName = event.requestContext?.domainName;
  const stage = event.requestContext?.stage;

  if (eventType === 'CONNECT' || routeKey === '$connect') {
    if (!connectionId) return { statusCode: 400, body: 'Missing connectionId' };

    const queryParams = event.queryStringParameters || {};
    const vaultId = queryParams.vaultId || 'vault_default';
    const deviceId = queryParams.deviceId || `dev_${connectionId.slice(0, 8)}`;
    const deviceName = queryParams.deviceName || 'Web Device';
    const platform = queryParams.platform || 'web';
    const publicKeyBase64 = queryParams.publicKey || '';

    await ConnectionModel.findOneAndUpdate(
      { connectionId },
      {
        connectionId,
        vaultId,
        deviceId,
        deviceName,
        platform,
        publicKeyBase64,
        connectedAt: new Date(),
        expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000),
      },
      { upsert: true }
    );

    console.log(`🔌 [Lambda WS Connect] Device "${deviceName}" (${deviceId}) registered in vault "${vaultId}"`);
    return { statusCode: 200, body: 'Connected.' };
  }

  if (eventType === 'DISCONNECT' || routeKey === '$disconnect') {
    if (!connectionId) return { statusCode: 400, body: 'Missing connectionId' };

    const existing = await ConnectionModel.findOneAndDelete({ connectionId });

    if (existing && domainName && stage) {
      const apigw = getApiGwClient(domainName, stage);
      const peers = await ConnectionModel.find({
        vaultId: existing.vaultId,
        connectionId: { $ne: connectionId },
      });

      await Promise.allSettled(
        peers.map((p) =>
          postMessage(apigw, p.connectionId, {
            type: 'device_left',
            deviceId: existing.deviceId,
            timestamp: Date.now(),
          })
        )
      );
    }

    return { statusCode: 200, body: 'Disconnected.' };
  }

  if (eventType === 'MESSAGE' || routeKey === '$default' || routeKey === 'sendmessage') {
    if (!connectionId || !event.body || !domainName || !stage) {
      return { statusCode: 400, body: 'Invalid payload' };
    }

    const sender = await ConnectionModel.findOne({ connectionId });
    if (!sender) return { statusCode: 403, body: 'Unauthenticated' };

    const message = JSON.parse(event.body);
    const apigw = getApiGwClient(domainName, stage);

    // Presence Query
    if (message.action === 'get_presence' || message.type === 'get_presence') {
      const peers = await ConnectionModel.find({ vaultId: sender.vaultId });
      const devices = peers.map((p) => ({
        deviceId: p.deviceId,
        deviceName: p.deviceName,
        platform: p.platform,
        publicKeyBase64: p.publicKeyBase64,
        status: 'online_local',
        lastSeen: Date.now(),
      }));

      await postMessage(apigw, connectionId, {
        type: 'presence_update',
        devices,
      });

      return { statusCode: 200, body: 'Presence sent.' };
    }

    // Direct Peer Message (WebRTC Offer/Answer/ICE)
    if (message.targetDeviceId && message.targetDeviceId !== 'broadcast') {
      const target = await ConnectionModel.findOne({
        vaultId: sender.vaultId,
        deviceId: message.targetDeviceId,
      });

      if (target) {
        await postMessage(apigw, target.connectionId, {
          ...message,
          senderDeviceId: sender.deviceId,
        });
      }

      return { statusCode: 200, body: 'Message forwarded.' };
    }

    // Vault Broadcast (Clipboard Sync / Announcements)
    const peers = await ConnectionModel.find({
      vaultId: sender.vaultId,
      connectionId: { $ne: connectionId },
    });

    await Promise.allSettled(
      peers.map((p) =>
        postMessage(apigw, p.connectionId, {
          ...message,
          senderDeviceId: sender.deviceId,
        })
      )
    );

    return { statusCode: 200, body: 'Broadcast sent.' };
  }

  return { statusCode: 200, body: 'OK' };
}
