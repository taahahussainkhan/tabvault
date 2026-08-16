import mongoose, { Schema, Document } from 'mongoose';

export interface ITransferLog extends Document {
  transferId: string;
  vaultId: string;
  senderDeviceId: string;
  targetDeviceId: string;
  fileSize: number;
  s3Key: string;
  route: 'webrtc_lan' | 's3_relay_fallback';
  status: 'pending' | 'uploaded' | 'downloaded' | 'expired';
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TransferSchema = new Schema<ITransferLog>(
  {
    transferId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    vaultId: {
      type: String,
      required: true,
      index: true,
    },
    senderDeviceId: {
      type: String,
      required: true,
    },
    targetDeviceId: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    s3Key: {
      type: String,
      required: true,
    },
    route: {
      type: String,
      enum: ['webrtc_lan', 's3_relay_fallback'],
      default: 's3_relay_fallback',
    },
    status: {
      type: String,
      enum: ['pending', 'uploaded', 'downloaded', 'expired'],
      default: 'pending',
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // MongoDB TTL index to auto-remove document after expiresAt
    },
  },
  {
    timestamps: true,
  }
);

export const TransferModel = mongoose.models.Transfer || mongoose.model<ITransferLog>('Transfer', TransferSchema);
