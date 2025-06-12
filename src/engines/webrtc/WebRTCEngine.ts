import { BaseEngine } from '../base/BaseEngine';

/**
 * WebRTC视频引擎 - 支持WebRTC实时视频流播放
 * 使用WebRTC技术加载和控制实时视频流
 */
export class WebRTCEngine extends BaseEngine {
  private peerConnection: RTCPeerConnection | null = null;
  private stream: MediaStream | null = null;
  private signallingUrl: string = '';
  private websocket: WebSocket | null = null;
  private iceServers: RTCIceServer[] = [];
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectTimeout: number | null = null;
  
  /**
   * 检查是否可以播放WebRTC视频流
   * @param type 视频类型或URL
   * @returns 是否支持播放
   */
  canPlayType(type: string): boolean {
    // 检查是否是WebRTC URL或协议
    return (
      type.startsWith('webrtc:') ||
      type.includes('protocol=webrtc') ||
      type.includes('application/webrtc')
    );
  }

  /**
   * 解析WebRTC URL
   * @param url WebRTC URL
   * @returns 解析后的配置
   */
  private parseWebRTCUrl(url: string): {
    signallingUrl: string;
    iceServers?: RTCIceServer[];
  } {
    let signallingUrl = '';
    let iceServers: RTCIceServer[] = [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ];

    // 处理webrtc:协议
    // 格式: webrtc:wss://signalling-server.com?iceServers=...
    if (url.startsWith('webrtc:')) {
      signallingUrl = url.substring(7); // 移除'webrtc:'
      
      // 解析查询参数
      const urlObj = new URL(signallingUrl);
      const iceServersParam = urlObj.searchParams.get('iceServers');
      
      if (iceServersParam) {
        try {
          const customIceServers = JSON.parse(decodeURIComponent(iceServersParam));
          if (Array.isArray(customIceServers) && customIceServers.length > 0) {
            iceServers = customIceServers;
          }
        } catch (e) {
          console.error('Failed to parse iceServers parameter:', e);
        }
      }
      
      // 移除查询参数，保留基本URL
      signallingUrl = urlObj.origin + urlObj.pathname;
    }
    // 处理常规URL带protocol=webrtc参数
    else if (url.includes('protocol=webrtc')) {
      const urlObj = new URL(url);
      signallingUrl = urlObj.searchParams.get('signalling') || '';
      
      const iceServersParam = urlObj.searchParams.get('iceServers');
      if (iceServersParam) {
        try {
          const customIceServers = JSON.parse(decodeURIComponent(iceServersParam));
          if (Array.isArray(customIceServers) && customIceServers.length > 0) {
            iceServers = customIceServers;
          }
        } catch (e) {
          console.error('Failed to parse iceServers parameter:', e);
        }
      }
    }

    return { signallingUrl, iceServers };
  }

  /**
   * 初始化WebRTC连接
   */
  private initPeerConnection(): void {
    if (this.peerConnection) {
      this.closePeerConnection();
    }

    // 创建新的PeerConnection
    this.peerConnection = new RTCPeerConnection({
      iceServers: this.iceServers
    });

    // 设置事件处理器
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.websocket && this.websocket.readyState === WebSocket.OPEN) {
        this.websocket.send(JSON.stringify({
          type: 'ice-candidate',
          candidate: event.candidate
        }));
      }
    };

    this.peerConnection.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        this.stream = event.streams[0];
        this.videoElement.srcObject = this.stream;
        this.emit('loadedmetadata');
        this.emit('canplay');
      }
    };

    this.peerConnection.oniceconnectionstatechange = () => {
      switch (this.peerConnection?.iceConnectionState) {
        case 'connected':
        case 'completed':
          this.reconnectAttempts = 0; // 重置重连计数
          break;
        case 'failed':
        case 'disconnected':
          this.attemptReconnect();
          break;
        case 'closed':
          this.emit('ended');
          break;
      }
    };
  }

  /**
   * 连接到信令服务器
   */
  private connectToSignallingServer(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.signallingUrl) {
        reject(new Error('Signalling server URL is not set'));
        return;
      }

      // 关闭现有连接
      if (this.websocket) {
        this.websocket.close();
      }

      // 创建新的WebSocket连接
      this.websocket = new WebSocket(this.signallingUrl);

      // 设置超时
      const connectionTimeout = setTimeout(() => {
        if (this.websocket?.readyState !== WebSocket.OPEN) {
          reject(new Error('Connection to signalling server timed out'));
          this.websocket?.close();
        }
      }, 10000); // 10秒超时

      this.websocket.onopen = () => {
        clearTimeout(connectionTimeout);
        this.emit('loadstart');
        resolve();
      };

      this.websocket.onclose = () => {
        clearTimeout(connectionTimeout);
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.attemptReconnect();
        } else {
          this.emit('error', new Error('Connection to signalling server closed'));
        }
      };

      this.websocket.onerror = (error) => {
        clearTimeout(connectionTimeout);
        reject(new Error(`WebSocket error: ${error}`));
        this.emit('error', new Error(`WebSocket error: ${error}`));
      };

      this.websocket.onmessage = (event) => this.handleSignallingMessage(event);
    });
  }

  /**
   * 处理来自信令服务器的消息
   * @param event WebSocket消息事件
   */
  private handleSignallingMessage(event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data);

      switch (message.type) {
        case 'offer':
          this.handleOffer(message);
          break;
        case 'ice-candidate':
          this.handleIceCandidate(message);
          break;
        case 'error':
          this.emit('error', new Error(`Signalling server error: ${message.error}`));
          break;
      }
    } catch (error) {
      console.error('Failed to parse signalling message:', error);
    }
  }

  /**
   * 处理SDP offer
   * @param message 包含offer的消息
   */
  private async handleOffer(message: any): Promise<void> {
    if (!this.peerConnection) return;

    try {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(message.offer));
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);

      if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
        this.websocket.send(JSON.stringify({
          type: 'answer',
          answer: this.peerConnection.localDescription
        }));
      }
    } catch (error) {
      this.emit('error', new Error(`Failed to handle offer: ${error}`));
    }
  }

  /**
   * 处理ICE候选
   * @param message 包含ICE候选的消息
   */
  private async handleIceCandidate(message: any): Promise<void> {
    if (!this.peerConnection) return;

    try {
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(message.candidate));
    } catch (error) {
      this.emit('error', new Error(`Failed to add ICE candidate: ${error}`));
    }
  }

  /**
   * 尝试重新连接
   */
  private attemptReconnect(): void {
    if (this.reconnectTimeout !== null) {
      clearTimeout(this.reconnectTimeout);
    }

    this.reconnectAttempts++;
    if (this.reconnectAttempts <= this.maxReconnectAttempts) {
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 30000);
      
      this.reconnectTimeout = window.setTimeout(() => {
        this.reconnectTimeout = null;
        this.initPeerConnection();
        this.connectToSignallingServer().catch(error => {
          this.emit('error', new Error(`Reconnection failed: ${error}`));
        });
      }, delay);
    } else {
      this.emit('error', new Error('Maximum reconnection attempts reached'));
    }
  }

  /**
   * 关闭对等连接
   */
  private closePeerConnection(): void {
    if (this.peerConnection) {
      this.peerConnection.onicecandidate = null;
      this.peerConnection.ontrack = null;
      this.peerConnection.oniceconnectionstatechange = null;
      this.peerConnection.close();
      this.peerConnection = null;
    }

    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    this.videoElement.srcObject = null;
  }

  /**
   * 加载WebRTC视频流
   * @param src WebRTC URL
   */
  async load(src: string): Promise<void> {
    try {
      const { signallingUrl, iceServers } = this.parseWebRTCUrl(src);
      
      if (!signallingUrl) {
        throw new Error('Invalid WebRTC URL: missing signalling server URL');
      }
      
      this.signallingUrl = signallingUrl;
      if (iceServers) {
        this.iceServers = iceServers;
      }
      
      this.initPeerConnection();
      await this.connectToSignallingServer();
      
      // 发送初始化消息
      if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
        this.websocket.send(JSON.stringify({
          type: 'init',
          clientId: `webrtc-player-${Date.now()}`
        }));
      }
    } catch (error) {
      this.emit('error', error as Error);
      throw error;
    }
  }

  /**
   * 播放视频
   */
  play(): Promise<void> {
    return this.videoElement.play();
  }

  /**
   * 暂停视频
   */
  pause(): void {
    this.videoElement.pause();
  }

  /**
   * 销毁播放器
   */
  destroy(): void {
    if (this.reconnectTimeout !== null) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }

    this.closePeerConnection();
    this.reconnectAttempts = 0;
  }
}