import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  Video, VideoOff, Mic, MicOff, Phone, PhoneOff,
  Maximize2, Minimize2, Monitor, MonitorOff,
} from 'lucide-react';

interface VideoCallProps {
  chatId: string;
  userId: string;
  userName: string;
  userRole: 'doctor' | 'patient';
  onEnd: () => void;
}

type SignalPayload = {
  type: 'offer' | 'answer' | 'ice-candidate' | 'call-request' | 'call-accepted' | 'call-rejected' | 'call-ended';
  from: string;
  fromName: string;
  fromRole: string;
  data?: any;
};

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

const VideoCall: React.FC<VideoCallProps> = ({ chatId, userId, userName, userRole, onEnd }) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [callState, setCallState] = useState<'idle' | 'calling' | 'incoming' | 'connected'>('idle');
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [remoteName, setRemoteName] = useState('');
  const [callDuration, setCallDuration] = useState(0);
  const screenStreamRef = useRef<MediaStream | null>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Setup signaling channel
  useEffect(() => {
    const channel = supabase.channel(`video-call-${chatId}`, {
      config: { broadcast: { self: false } },
    });

    channel.on('broadcast', { event: 'signal' }, async ({ payload }: { payload: SignalPayload }) => {
      if (payload.from === userId) return;

      switch (payload.type) {
        case 'call-request':
          setRemoteName(payload.fromName);
          setCallState('incoming');
          break;
        case 'call-accepted':
          await createOffer();
          break;
        case 'call-rejected':
        case 'call-ended':
          endCall(false);
          if (payload.type === 'call-rejected') toast.info('Call was declined');
          break;
        case 'offer':
          await handleOffer(payload.data);
          break;
        case 'answer':
          await handleAnswer(payload.data);
          break;
        case 'ice-candidate':
          await handleIceCandidate(payload.data);
          break;
      }
    });

    channel.subscribe();
    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      endCall(false);
    };
  }, [chatId, userId]);

  const sendSignal = useCallback((type: SignalPayload['type'], data?: any) => {
    channelRef.current?.send({
      type: 'broadcast',
      event: 'signal',
      payload: { type, from: userId, fromName: userName, fromRole: userRole, data } as SignalPayload,
    });
  }, [userId, userName, userRole]);

  const getMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      return stream;
    } catch {
      // Fallback to audio only
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
        setLocalStream(stream);
        setIsVideoOn(false);
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        return stream;
      } catch (err) {
        toast.error('Cannot access camera or microphone');
        return null;
      }
    }
  };

  const createPeerConnection = (stream: MediaStream) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    pc.ontrack = (event) => {
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignal('ice-candidate', event.candidate.toJSON());
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        setCallState('connected');
        startTimer();
      }
      if (['disconnected', 'failed', 'closed'].includes(pc.connectionState)) {
        endCall(false);
      }
    };

    pcRef.current = pc;
    return pc;
  };

  const startCall = async () => {
    const stream = await getMedia();
    if (!stream) return;
    setCallState('calling');
    sendSignal('call-request');
  };

  const acceptCall = async () => {
    const stream = await getMedia();
    if (!stream) return;
    createPeerConnection(stream);
    setCallState('connected');
    sendSignal('call-accepted');
  };

  const rejectCall = () => {
    sendSignal('call-rejected');
    setCallState('idle');
  };

  const createOffer = async () => {
    if (!localStream) return;
    const pc = createPeerConnection(localStream);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    sendSignal('offer', offer);
  };

  const handleOffer = async (offer: RTCSessionDescriptionInit) => {
    if (!localStream) {
      const stream = await getMedia();
      if (!stream) return;
    }
    const pc = pcRef.current || createPeerConnection(localStream!);
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    sendSignal('answer', answer);
  };

  const handleAnswer = async (answer: RTCSessionDescriptionInit) => {
    await pcRef.current?.setRemoteDescription(new RTCSessionDescription(answer));
  };

  const handleIceCandidate = async (candidate: RTCIceCandidateInit) => {
    try {
      await pcRef.current?.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (e) {
      console.error('Error adding ICE candidate:', e);
    }
  };

  const startTimer = () => {
    setCallDuration(0);
    timerRef.current = setInterval(() => setCallDuration((d) => d + 1), 1000);
  };

  const endCall = (notify = true) => {
    if (notify) sendSignal('call-ended');
    pcRef.current?.close();
    pcRef.current = null;
    screenStreamRef.current?.getTracks().forEach(t => t.stop());
    screenStreamRef.current = null;
    localStream?.getTracks().forEach((t) => t.stop());
    setLocalStream(null);
    setIsScreenSharing(false);
    setCallState('idle');
    setCallDuration(0);
    if (timerRef.current) clearInterval(timerRef.current);
    onEnd();
  };

  const toggleVideo = () => {
    localStream?.getVideoTracks().forEach((t) => { t.enabled = !t.enabled; });
    setIsVideoOn((v) => !v);
  };

  const toggleAudio = () => {
    localStream?.getAudioTracks().forEach((t) => { t.enabled = !t.enabled; });
    setIsAudioOn((a) => !a);
  };

  const stopScreenShare = useCallback(async () => {
    if (!pcRef.current || !localStream) return;
    screenStreamRef.current?.getTracks().forEach(t => t.stop());
    screenStreamRef.current = null;
    const videoTrack = localStream.getVideoTracks()[0];
    if (videoTrack) {
      const sender = pcRef.current.getSenders().find(s => s.track?.kind === 'video');
      await sender?.replaceTrack(videoTrack);
    }
    if (localVideoRef.current) localVideoRef.current.srcObject = localStream;
    setIsScreenSharing(false);
  }, [localStream]);

  const toggleScreenShare = async () => {
    if (!pcRef.current || !localStream) {
      toast.error('You must be in a call to share screen');
      return;
    }
    try {
      if (isScreenSharing) {
        await stopScreenShare();
      } else {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
        screenStreamRef.current = screenStream;
        const screenTrack = screenStream.getVideoTracks()[0];
        const sender = pcRef.current.getSenders().find(s => s.track?.kind === 'video');
        await sender?.replaceTrack(screenTrack);
        // Show screen share in local PIP
        if (localVideoRef.current) localVideoRef.current.srcObject = screenStream;
        screenTrack.onended = () => {
          stopScreenShare();
        };
        setIsScreenSharing(true);
        toast.success('Screen sharing started');
      }
    } catch (err: any) {
      if (err.name !== 'NotAllowedError') {
        toast.error('Screen sharing failed');
      }
    }
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      containerRef.current?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullscreen((f) => !f);
  };

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  // Idle state — show call button
  if (callState === 'idle') {
    return (
      <Button
        onClick={startCall}
        className="bg-green-500 hover:bg-green-600 text-white rounded-full gap-2"
        size="sm"
      >
        <Video className="h-4 w-4" /> Video Call
      </Button>
    );
  }

  // Incoming call
  if (callState === 'incoming') {
    return (
      <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center backdrop-blur-sm">
        <div className="bg-card rounded-3xl p-8 text-center space-y-6 shadow-2xl max-w-sm mx-4 animate-in fade-in zoom-in">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto animate-pulse">
            <Phone className="h-10 w-10 text-green-500" />
          </div>
          <div>
            <h3 className="text-xl font-bold">Incoming Call</h3>
            <p className="text-muted-foreground">{remoteName}</p>
          </div>
          <div className="flex gap-6 justify-center">
            <Button onClick={rejectCall} className="bg-red-500 hover:bg-red-600 rounded-full h-14 w-14 p-0">
              <PhoneOff className="h-6 w-6" />
            </Button>
            <Button onClick={acceptCall} className="bg-green-500 hover:bg-green-600 rounded-full h-14 w-14 p-0">
              <Phone className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Calling / Connected
  return (
    <div
      ref={containerRef}
      className={`${isFullscreen ? 'fixed inset-0 z-50' : 'relative rounded-2xl overflow-hidden'} bg-black`}
      style={!isFullscreen ? { height: 400 } : undefined}
    >
      {/* Remote video */}
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover"
      />

      {/* Local video PIP */}
      <div className="absolute top-4 right-4 w-32 h-24 rounded-xl overflow-hidden border-2 border-white/30 shadow-lg">
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover mirror"
          style={{ transform: 'scaleX(-1)' }}
        />
      </div>

      {/* Status overlay */}
      <div className="absolute top-4 left-4 flex items-center gap-2">
        {callState === 'calling' && (
          <span className="bg-black/60 text-white text-sm px-3 py-1 rounded-full animate-pulse">
            Calling...
          </span>
        )}
        {callState === 'connected' && (
          <span className="bg-green-500/80 text-white text-sm px-3 py-1 rounded-full flex items-center gap-1">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
            {formatDuration(callDuration)}
          </span>
        )}
      </div>

      {/* Controls */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3">
        <Button
          onClick={toggleAudio}
          className={`rounded-full h-12 w-12 p-0 ${isAudioOn ? 'bg-white/20 hover:bg-white/30' : 'bg-red-500 hover:bg-red-600'}`}
        >
          {isAudioOn ? <Mic className="h-5 w-5 text-white" /> : <MicOff className="h-5 w-5 text-white" />}
        </Button>
        <Button
          onClick={toggleVideo}
          className={`rounded-full h-12 w-12 p-0 ${isVideoOn ? 'bg-white/20 hover:bg-white/30' : 'bg-red-500 hover:bg-red-600'}`}
        >
          {isVideoOn ? <Video className="h-5 w-5 text-white" /> : <VideoOff className="h-5 w-5 text-white" />}
        </Button>
        <Button
          onClick={() => endCall(true)}
          className="bg-red-500 hover:bg-red-600 rounded-full h-12 w-12 p-0"
        >
          <PhoneOff className="h-5 w-5 text-white" />
        </Button>
        <Button
          onClick={toggleScreenShare}
          className={`rounded-full h-12 w-12 p-0 ${isScreenSharing ? 'bg-primary hover:bg-primary/80' : 'bg-white/20 hover:bg-white/30'}`}
        >
          {isScreenSharing ? <MonitorOff className="h-5 w-5 text-white" /> : <Monitor className="h-5 w-5 text-white" />}
        </Button>
        <Button
          onClick={toggleFullscreen}
          className="rounded-full h-12 w-12 p-0 bg-white/20 hover:bg-white/30"
        >
          {isFullscreen ? <Minimize2 className="h-5 w-5 text-white" /> : <Maximize2 className="h-5 w-5 text-white" />}
        </Button>
      </div>
    </div>
  );
};

export default VideoCall;
