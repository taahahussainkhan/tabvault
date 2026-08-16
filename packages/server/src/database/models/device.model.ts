import mongoose, { Schema, Document } from 'mongoose';

export interface IDevice extends Document {
  deviceId: string;
  vaultId: string;
  deviceName: string;
  platform: 'macos' | 'windows' | 'linux' | 'ios' | 'android' | 'web';
  browser?: string;
  publicKeyBase64: string;
  status: 'online_local' | 'online_relay' | 'idle' | 'offline';
  lastSeen: Date;
  pushToken?: string;
  localIps: string[];
}

const DeviceSchema = new Schema<IDevice>(
  {
    deviceId: {
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
    deviceName: {
      type: String,
      required: true,
    },
    platform: {
      type: String,
      enum: ['macos', 'windows', 'linux', 'ios', 'android', 'web'],
      required: true,
    },
    browser: {
      type: String,
    },
    publicKeyBase64: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['online_local', 'online_relay', 'idle', 'offline'],
      default: 'offline',
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    pushToken: {
      type: String,
    },
    localIps: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export const DeviceModel = mongoose.models.Device || mongoose.model<IDevice>('Device', DeviceSchema);
