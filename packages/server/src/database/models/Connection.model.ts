import mongoose, { Schema, Document } from 'mongoose';

export interface IConnection extends Document {
  connectionId: string;
  vaultId: string;
  deviceId: string;
  deviceName: string;
  platform: string;
  publicKeyBase64: string;
  connectedAt: Date;
  expiresAt: Date;
}

const ConnectionSchema = new Schema<IConnection>(
  {
    connectionId: { type: String, required: true, unique: true, index: true },
    vaultId: { type: String, required: true, index: true },
    deviceId: { type: String, required: true },
    deviceName: { type: String, required: true },
    platform: { type: String, required: true },
    publicKeyBase64: { type: String, default: '' },
    connectedAt: { type: Date, default: Date.now },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 12 * 60 * 60 * 1000),
      index: { expires: 0 },
    },
  },
  { timestamps: true }
);

export const ConnectionModel =
  mongoose.models.Connection || mongoose.model<IConnection>('Connection', ConnectionSchema);
