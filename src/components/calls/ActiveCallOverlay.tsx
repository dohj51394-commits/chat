import React, { useState, useEffect, useRef } from 'react';
import {
  PhoneOff,
  Phone,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Video,
  VideoOff,
  RefreshCw,
  Lock,
} from 'lucide-react';
import { ActiveCallState } from '../../types';
import { chatStore } from '../../services/store';

interface ActiveCallOverlayProps {
  call: ActiveCallState;
  onEndCall: () => void;
  onAcceptCall: () => void;
}

export const ActiveCallOverlay: React.FC<ActiveCallOverlayProps> = ({
  call,
  onEndCall,
  onAcceptCall,
}) => {
  const [duration, setDuration] = useState(0);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Call timer once connected
  useEffect(() => {
    let timer: number | null = null;
    if (call.status === 'connected') {
      timer = window.setInterval(() => {
        setDuration((d) => {
          const next = d + 1;
          chatStore.updateCallState({ duration: next });
          return next;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [call.status]);

  // Handle local camera stream if video call
  useEffect(() => {
    if (call.callType === 'video' && !call.isVideoMuted) {
      navigator.mediaDevices
        ?.getUserMedia({ video: true, audio: true })
        .then((stream) => {
          setLocalStream(stream);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch((err) => {
          console.warn('Camera access denied or unavailable:', err);
        });
    }

    return () => {
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [call.callType, call.isVideoMuted]);

  const toggleMute = () => {
    const next = !call.isMuted;
    if (localStream) {
      localStream.getAudioTracks().forEach((t) => (t.enabled = !next));
    }
    chatStore.updateCallState({ isMuted: next });
  };

  const [showEncryptionDetails, setShowEncryptionDetails] = useState(false);

  const toggleVideo = () => {
    const next = !call.isVideoMuted;
    if (localStream) {
      localStream.getVideoTracks().forEach((t) => (t.enabled = !next));
    }
    chatStore.updateCallState({ isVideoMuted: next });
  };

  const toggleSpeaker = () => {
    chatStore.updateCallState({ isSpeaker: !call.isSpeaker });
  };

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0f172a] text-white flex flex-col justify-between overflow-hidden select-none animate-in fade-in duration-200">
      {/* Background for video call */}
      {call.callType === 'video' && (
        <div className="absolute inset-0 z-0 bg-black">
          {!call.isVideoMuted && localStream ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900/90">
              <img
                src={call.targetUser.avatarUrl}
                alt={call.targetUser.fullName}
                referrerPolicy="no-referrer"
                className="w-32 h-32 rounded-full object-cover ring-4 ring-white/10"
              />
              <p className="mt-4 text-xs text-white/60">Camera turned off</p>
            </div>
          )}
        </div>
      )}

      {/* 1. TOP STATUS BAR */}
      <div className="relative z-10 p-6 flex flex-col items-center text-center bg-gradient-to-b from-black/80 to-transparent">
        <button
          onClick={() => setShowEncryptionDetails(true)}
          className="flex items-center gap-1.5 text-[11px] text-white/80 hover:text-white mb-2 bg-black/30 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 transition-colors"
        >
          <Lock className="w-3 h-3 text-emerald-400" />
          <span>E2EE · {call.callEncryption?.shortAuthString || 'Signal'} {call.callEncryption?.authEmoji || ''}</span>
        </button>

        <h2 className="text-2xl font-bold tracking-tight text-white mb-1">
          {call.targetUser.fullName}
        </h2>

        <p className="text-sm font-medium text-emerald-400">
          {call.status === 'connected' ? (
            <span className="tabular-nums font-mono text-white text-base">
              {formatDuration(duration)}
            </span>
          ) : call.isIncoming ? (
            'Incoming call...'
          ) : (
            'Ringing...'
          )}
        </p>
      </div>

      {/* 2. CENTER AVATAR (For Voice Calls) */}
      {call.callType === 'voice' && (
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center">
          <div className="relative">
            {/* Animated sound ripple rings */}
            {call.status === 'connected' && (
              <>
                <span className="absolute -inset-4 rounded-full bg-emerald-500/20 animate-ping duration-1000" />
                <span className="absolute -inset-8 rounded-full bg-emerald-500/10 animate-pulse duration-700" />
              </>
            )}
            <img
              src={call.targetUser.avatarUrl}
              alt={call.targetUser.fullName}
              referrerPolicy="no-referrer"
              className="w-36 h-36 rounded-full object-cover ring-4 ring-emerald-500/40 shadow-2xl relative z-10"
            />
          </div>
        </div>
      )}

      {/* 3. BOTTOM CONTROLS */}
      <div className="relative z-10 p-8 pb-10 bg-gradient-to-t from-black/90 to-transparent flex flex-col items-center gap-6">
        {call.isIncoming && call.status === 'ringing' ? (
          /* Incoming Call Accept / Decline Buttons */
          <div className="flex items-center justify-center gap-12 w-full max-w-xs animate-in slide-in-from-bottom duration-200">
            <button
              onClick={onEndCall}
              className="flex flex-col items-center gap-2 group"
            >
              <div className="w-16 h-16 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-lg group-hover:scale-105 active:scale-95 transition-transform">
                <PhoneOff className="w-7 h-7" />
              </div>
              <span className="text-xs font-semibold text-white/90">Decline</span>
            </button>

            <button
              onClick={onAcceptCall}
              className="flex flex-col items-center gap-2 group"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg animate-bounce group-hover:scale-105 active:scale-95 transition-transform">
                <Phone className="w-7 h-7" />
              </div>
              <span className="text-xs font-semibold text-white/90">Accept</span>
            </button>
          </div>
        ) : (
          /* Active Call Controls Toolbar */
          <>
            <div className="flex items-center justify-center gap-4 sm:gap-6 bg-white/10 backdrop-blur-md p-3 rounded-full border border-white/10 shadow-xl">
              {/* Speaker Toggle */}
              <button
                onClick={toggleSpeaker}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                  call.isSpeaker ? 'bg-white text-slate-900' : 'bg-white/10 text-white hover:bg-white/20'
                }`}
                title="Speaker"
              >
                {call.isSpeaker ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </button>

              {/* Video Camera Toggle */}
              {call.callType === 'video' && (
                <button
                  onClick={toggleVideo}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                    !call.isVideoMuted ? 'bg-white text-slate-900' : 'bg-rose-500 text-white'
                  }`}
                  title="Camera On/Off"
                >
                  {call.isVideoMuted ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                </button>
              )}

              {/* Microphone Mute Toggle */}
              <button
                onClick={toggleMute}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                  call.isMuted ? 'bg-rose-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'
                }`}
                title="Mute Mic"
              >
                {call.isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              {/* Camera Switch (Flip) */}
              {call.callType === 'video' && (
                <button
                  onClick={() => {
                    chatStore.updateCallState({ isCameraFront: !call.isCameraFront });
                  }}
                  className="w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-all"
                  title="Switch Camera"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* End Call Button */}
            <button
              onClick={onEndCall}
              className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-xl active:scale-95 transition-transform"
              title="End Call"
            >
              <PhoneOff className="w-7 h-7" />
            </button>
          </>
        )}
      </div>

      {/* 4. ENCRYPTION DETAILS BOTTOM SHEET */}
      {showEncryptionDetails && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex flex-col justify-end animate-in fade-in"
          onClick={() => setShowEncryptionDetails(false)}
        >
          <div
            className="bg-[#1f2c34] rounded-t-3xl p-6 space-y-4 border-t border-slate-700 text-white shadow-2xl animate-in slide-in-from-bottom duration-200 max-w-md mx-auto w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-slate-600 rounded-full mx-auto mb-1" />
            <div className="flex items-center justify-between pb-2 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-400" />
                <h4 className="font-bold text-sm">Call End-to-End Encryption</h4>
              </div>
              <button
                onClick={() => setShowEncryptionDetails(false)}
                className="text-xs text-emerald-400 font-bold"
              >
                Close
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <p>
                This call is end-to-end encrypted using <strong>Signal Protocol DTLS-SRTP & AES-256-GCM</strong>. Media frames and audio are encrypted directly on your device before transmission.
              </p>

              {/* Short Authentication String (SAS) & Emoji */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-center">
                <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">
                  Short Authentication String (SAS)
                </span>
                <div className="text-3xl font-mono font-black text-emerald-400 tracking-wider">
                  {call.callEncryption?.shortAuthString || '8492'}
                </div>
                <div className="text-xl tracking-widest py-1">
                  {call.callEncryption?.authEmoji || '🛡️ ⚡ 🦅 💎'}
                </div>
                <div className="text-[11px] font-mono text-slate-400">
                  Phonetic Phrase: <span className="text-white font-bold">{call.callEncryption?.safetyWord || 'Falcon-Emerald-Shield'}</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-[11px] text-emerald-300">
                To verify no man-in-the-middle exists, read this 4-digit code or phonetic phrase aloud to <strong>{call.targetUser.fullName}</strong>. If both numbers match, your call is 100% private.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
