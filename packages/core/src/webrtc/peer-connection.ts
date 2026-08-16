/**
 * WebRTC Peer Connection manager.
 */

import { DEFAULT_RTC_CONFIGURATION } from './ice-config.js';
import { DataChannelWrapper, DATA_CHANNEL_LABEL } from './data-channel.js';

export interface PeerConnectionCallbacks {
  onIceCandidate: (candidate: RTCIceCandidate) => void;
  onDataChannel: (channel: DataChannelWrapper) => void;
  onConnectionStateChange?: (state: RTCPeerConnectionState) => void;
  onIceConnectionStateChange?: (state: RTCIceConnectionState) => void;
}

export class PeerConnectionManager {
  private pc: RTCPeerConnection;
  private dataChannelWrapper?: DataChannelWrapper;
  private callbacks: PeerConnectionCallbacks;

  constructor(callbacks: PeerConnectionCallbacks, config: RTCConfiguration = DEFAULT_RTC_CONFIGURATION) {
    this.callbacks = callbacks;
    this.pc = new RTCPeerConnection(config);
    this.setupListeners();
  }

  private setupListeners(): void {
    this.pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.callbacks.onIceCandidate(event.candidate);
      }
    };

    this.pc.ondatachannel = (event) => {
      this.dataChannelWrapper = new DataChannelWrapper(event.channel);
      this.callbacks.onDataChannel(this.dataChannelWrapper);
    };

    this.pc.onconnectionstatechange = () => {
      this.callbacks.onConnectionStateChange?.(this.pc.connectionState);
    };

    this.pc.oniceconnectionstatechange = () => {
      this.callbacks.onIceConnectionStateChange?.(this.pc.iceConnectionState);
    };
  }

  public createDataChannel(label: string = DATA_CHANNEL_LABEL): DataChannelWrapper {
    const rawChannel = this.pc.createDataChannel(label, {
      ordered: true,
    });
    this.dataChannelWrapper = new DataChannelWrapper(rawChannel);
    return this.dataChannelWrapper;
  }

  public async createOffer(): Promise<RTCSessionDescriptionInit> {
    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);
    return offer;
  }

  public async handleOfferAndCreateAnswer(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    await this.pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await this.pc.createAnswer();
    await this.pc.setLocalDescription(answer);
    return answer;
  }

  public async handleAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    await this.pc.setRemoteDescription(new RTCSessionDescription(answer));
  }

  public async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    await this.pc.addIceCandidate(new RTCIceCandidate(candidate));
  }

  public get connectionState(): RTCPeerConnectionState {
    return this.pc.connectionState;
  }

  public close(): void {
    this.dataChannelWrapper?.close();
    this.pc.close();
  }
}
