/**
 * WebRTC DataChannel manager with backpressure flow control.
 */

export const DATA_CHANNEL_LABEL = 'tabvault-transfer';
export const BUFFERED_AMOUNT_LOW_THRESHOLD = 64 * 1024; // 64KB
export const MAX_BUFFERED_AMOUNT = 8 * 1024 * 1024;     // 8MB limit before pausing transmission

export interface DataChannelOptions {
  ordered?: boolean;
  maxRetransmits?: number;
}

export class DataChannelWrapper {
  private channel: RTCDataChannel;
  private isPaused: boolean = false;
  private resumeResolve?: () => void;

  constructor(channel: RTCDataChannel) {
    this.channel = channel;
    this.channel.binaryType = 'arraybuffer';
    this.channel.bufferedAmountLowThreshold = BUFFERED_AMOUNT_LOW_THRESHOLD;

    this.channel.onbufferedamountlow = () => {
      if (this.isPaused && this.resumeResolve) {
        this.isPaused = false;
        const resolve = this.resumeResolve;
        this.resumeResolve = undefined;
        resolve();
      }
    };
  }

  public get rawChannel(): RTCDataChannel {
    return this.channel;
  }

  public get readyState(): RTCDataChannelState {
    return this.channel.readyState;
  }

  /**
   * Sends binary data with flow control (awaits when buffer fills up).
   */
  public async sendSafe(data: ArrayBuffer): Promise<void> {
    if (this.channel.readyState !== 'open') {
      throw new Error(`Cannot send on DataChannel: state is ${this.channel.readyState}`);
    }

    if (this.channel.bufferedAmount > MAX_BUFFERED_AMOUNT) {
      this.isPaused = true;
      await new Promise<void>((resolve) => {
        this.resumeResolve = resolve;
      });
    }

    this.channel.send(data);
  }

  public close(): void {
    if (this.channel.readyState === 'open' || this.channel.readyState === 'connecting') {
      this.channel.close();
    }
  }
}
