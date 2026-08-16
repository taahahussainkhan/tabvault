import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../config/env.config.js';
import { SERVER_CONSTANTS } from '../config/constants.js';

export interface PresignedUploadResult {
  uploadUrl: string;
  downloadUrl: string;
  s3Key: string;
  expiresInSeconds: number;
}

export class S3RelayService {
  private static s3Client: S3Client = new S3Client({
    region: env.AWS_REGION,
    endpoint: env.S3_ENDPOINT || undefined,
    credentials: env.S3_ACCESS_KEY_ID && env.S3_SECRET_ACCESS_KEY
      ? {
          accessKeyId: env.S3_ACCESS_KEY_ID,
          secretAccessKey: env.S3_SECRET_ACCESS_KEY,
        }
      : undefined,
  });

  /**
   * Generates real presigned S3 PUT and GET URLs for client-side encrypted relay transfer.
   */
  public static async createPresignedDrop(
    vaultId: string,
    transferId: string
  ): Promise<PresignedUploadResult> {
    const s3Key = `vaults/${vaultId}/transfers/${transferId}.enc`;

    const putCommand = new PutObjectCommand({
      Bucket: env.S3_BUCKET_NAME,
      Key: s3Key,
      ContentType: 'application/octet-stream',
    });

    const getCommand = new GetObjectCommand({
      Bucket: env.S3_BUCKET_NAME,
      Key: s3Key,
    });

    const uploadUrl = await getSignedUrl(this.s3Client, putCommand, {
      expiresIn: SERVER_CONSTANTS.S3_PRESIGNED_PUT_EXPIRES_SECONDS,
    });

    const downloadUrl = await getSignedUrl(this.s3Client, getCommand, {
      expiresIn: SERVER_CONSTANTS.S3_PRESIGNED_GET_EXPIRES_SECONDS,
    });

    return {
      uploadUrl,
      downloadUrl,
      s3Key,
      expiresInSeconds: SERVER_CONSTANTS.S3_PRESIGNED_PUT_EXPIRES_SECONDS,
    };
  }

  /**
   * Generates a fresh presigned GET download URL for an S3 object key.
   */
  public static async getPresignedDownloadUrl(s3Key: string): Promise<string> {
    const getCommand = new GetObjectCommand({
      Bucket: env.S3_BUCKET_NAME,
      Key: s3Key,
    });
    return await getSignedUrl(this.s3Client, getCommand, {
      expiresIn: SERVER_CONSTANTS.S3_PRESIGNED_GET_EXPIRES_SECONDS,
    });
  }
}
