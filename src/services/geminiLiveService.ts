import { supabase } from '../lib/supabase';

// Helper: Convert ArrayBuffer to Base64
const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};

// Helper: Convert Base64 to ArrayBuffer
const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};

// Helper: Resample audio input buffer from inputRate to 16000Hz PCM
const resampleTo16k = (buffer: Float32Array, inputRate: number): Int16Array => {
  const outputRate = 16000;
  if (inputRate === outputRate) {
    const intBuffer = new Int16Array(buffer.length);
    for (let i = 0; i < buffer.length; i++) {
      intBuffer[i] = Math.min(1, Math.max(-1, buffer[i])) * 0x7FFF;
    }
    return intBuffer;
  }
  const sampleRateRatio = inputRate / outputRate;
  const newLength = Math.round(buffer.length / sampleRateRatio);
  const result = new Int16Array(newLength);
  let offsetResult = 0;
  let offsetBuffer = 0;
  while (offsetResult < result.length) {
    const nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);
    let accum = 0;
    let count = 0;
    for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
      accum += buffer[i];
      count++;
    }
    result[offsetResult] = Math.min(1, Math.max(-1, count > 0 ? accum / count : 0)) * 0x7FFF;
    offsetResult++;
    offsetBuffer = nextOffsetBuffer;
  }
  return result;
};

export class GeminiLiveSession {
  private ws: WebSocket | null = null;
  private audioContext: AudioContext | null = null;
  private nextPlayTime = 0;
  private micStream: MediaStream | null = null;
  private recordAudioContext: AudioContext | null = null;
  private audioProcessor: ScriptProcessorNode | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private isConnected = false;
  private isPlaying = false;

  constructor(
    private systemInstruction: string,
    private onTextReceived: (text: string) => void,
    private onAudioStateChange: (isPlaying: boolean) => void,
    private onError: (error: any) => void
  ) {}

  public async start() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || '';
      const studentCode = localStorage.getItem('soma_active_student') || '';

      // 1. Establish WebSocket Connection
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
      const wsProtocol = supabaseUrl.startsWith('https') ? 'wss' : 'ws';
      const cleanUrl = supabaseUrl.replace(/^https?:\/\//, '');
      const ws = new URL(wsProtocol + '://' + cleanUrl + '/functions/v1/gemini-proxy');
      if (token) ws.searchParams.set('access_token', token);
      if (studentCode) ws.searchParams.set('student_code', studentCode);
      const wsUrl = ws.toString();

      console.log("Connecting to Gemini Live WebSocket:", wsUrl);
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log("WebSocket connected. Sending setup message...");
        this.isConnected = true;
        
        // Send initial setup frame
        const setupMessage = {
          setup: {
            model: "models/gemini-2.0-flash-exp", // Gemini Live API capability model
            generationConfig: {
              responseModalities: ["AUDIO"],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: {
                    voiceName: "Aoede" // Warm, educational female voice
                  }
                }
              }
            },
            systemInstruction: {
              parts: [{ text: this.systemInstruction }]
            }
          }
        };
        this.ws?.send(JSON.stringify(setupMessage));
        
        // Start microphone capture
        this.startMic();
      };

      this.ws.onmessage = async (event) => {
        try {
          const message = JSON.parse(event.data);
          
          // Handle server audio response
          if (message.serverContent?.modelTurn?.parts) {
            for (const part of message.serverContent.modelTurn.parts) {
              if (part.inlineData && part.inlineData.mimeType.startsWith('audio/pcm')) {
                this.playAudioChunk(part.inlineData.data);
              }
              if (part.text) {
                this.onTextReceived(part.text);
              }
            }
          }

          // Handle server content completion
          if (message.serverContent?.turnComplete) {
            this.isPlaying = false;
            this.onAudioStateChange(false);
          }

          // Handle interruptions (learner started speaking)
          if (message.serverContent?.interrupted) {
            console.log("Gemini Live interrupted by user speech.");
            this.stopPlayback();
          }
        } catch (e) {
          console.error("WS Message parsing error:", e);
        }
      };

      this.ws.onerror = (err) => {
        console.error("WebSocket Error:", err);
        this.onError(err);
      };

      this.ws.onclose = (event) => {
        console.log("WebSocket closed:", event.code, event.reason);
        this.isConnected = false;
        this.stop();
      };

      // Initialize Playback AudioContext
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.nextPlayTime = this.audioContext.currentTime;

    } catch (err) {
      console.error("Failed to start Live Session:", err);
      this.onError(err);
      this.stop();
    }
  }

  private async startMic() {
    try {
      this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.recordAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const inputRate = this.recordAudioContext.sampleRate;

      this.sourceNode = this.recordAudioContext.createMediaStreamSource(this.micStream);
      this.audioProcessor = this.recordAudioContext.createScriptProcessor(4096, 1, 1);

      this.audioProcessor.onaudioprocess = (e) => {
        if (!this.isConnected || this.ws?.readyState !== WebSocket.OPEN) return;

        const float32 = e.inputBuffer.getChannelData(0);
        const pcm16 = resampleTo16k(float32, inputRate);
        const base64Data = arrayBufferToBase64(pcm16.buffer);

        const inputFrame = {
          realtimeInput: {
            mediaChunks: [
              {
                mimeType: "audio/pcm;rate=16000",
                data: base64Data
              }
            ]
          }
        };
        this.ws.send(JSON.stringify(inputFrame));
      };

      this.sourceNode.connect(this.audioProcessor);
      this.audioProcessor.connect(this.recordAudioContext.destination);
      console.log("Microphone recording active at rate:", inputRate);

    } catch (err) {
      console.error("Mic initialization failed:", err);
      this.onError(err);
    }
  }

  private playAudioChunk(base64Data: string) {
    if (!this.audioContext) return;
    
    if (this.audioContext.state === 'suspended') {
      void this.audioContext.resume();
    }

    const arrayBuf = base64ToArrayBuffer(base64Data);
    const int16 = new Int16Array(arrayBuf);
    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) {
      float32[i] = int16[i] / 32768.0;
    }

    // Server output is 24000Hz mono PCM
    const audioBuf = this.audioContext.createBuffer(1, float32.length, 24000);
    audioBuf.getChannelData(0).set(float32);

    const source = this.audioContext.createBufferSource();
    source.buffer = audioBuf;
    source.connect(this.audioContext.destination);

    const now = this.audioContext.currentTime;
    let startTime = this.nextPlayTime;
    if (startTime < now) {
      startTime = now + 0.02; // Small buffer to prevent overlap/gap pop
    }
    
    source.start(startTime);
    this.nextPlayTime = startTime + audioBuf.duration;

    if (!this.isPlaying) {
      this.isPlaying = true;
      this.onAudioStateChange(true);
    }
  }

  private stopPlayback() {
    this.nextPlayTime = this.audioContext?.currentTime ?? 0;
    this.isPlaying = false;
    this.onAudioStateChange(false);
  }

  public stop() {
    console.log("Stopping Gemini Live session...");
    this.isConnected = false;
    
    // Close WebSocket
    if (this.ws) {
      if (this.ws.readyState === WebSocket.OPEN) this.ws.close();
      this.ws = null;
    }

    // Stop mic stream
    if (this.micStream) {
      this.micStream.getTracks().forEach(track => track.stop());
      this.micStream = null;
    }

    // Close record context
    if (this.audioProcessor && this.sourceNode) {
      this.sourceNode.disconnect();
      this.audioProcessor.disconnect();
      this.audioProcessor = null;
      this.sourceNode = null;
    }
    if (this.recordAudioContext) {
      void this.recordAudioContext.close();
      this.recordAudioContext = null;
    }

    // Close playback context
    this.stopPlayback();
    if (this.audioContext) {
      void this.audioContext.close();
      this.audioContext = null;
    }
  }
}

