import React, { useState } from 'react';
import { ArrowLeft, Send, Palette, Type, Camera, Image as ImageIcon, X } from 'lucide-react';
import { chatStore } from '../../services/store';

interface CreateStatusModalProps {
  initialMode: 'text' | 'media';
  onClose: () => void;
}

const COLOR_PALETTES = [
  '#008069',
  '#b91c1c',
  '#6d28d9',
  '#2563eb',
  '#d97706',
  '#0f172a',
  '#059669',
  '#be185d',
];

const FONTS = [
  { name: 'Sans', family: 'sans-serif' },
  { name: 'Serif', family: 'serif' },
  { name: 'Mono', family: 'monospace' },
  { name: 'Cursive', family: 'cursive' },
];

export const CreateStatusModal: React.FC<CreateStatusModalProps> = ({
  initialMode,
  onClose,
}) => {
  const [mode, setMode] = useState<'text' | 'media'>(initialMode);
  const [text, setText] = useState('');
  const [caption, setCaption] = useState('');
  const [bgIndex, setBgIndex] = useState(0);
  const [fontIndex, setFontIndex] = useState(0);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);

  const currentColor = COLOR_PALETTES[bgIndex];
  const currentFont = FONTS[fontIndex];

  const handleNextColor = () => {
    setBgIndex((prev) => (prev + 1) % COLOR_PALETTES.length);
  };

  const handleNextFont = () => {
    setFontIndex((prev) => (prev + 1) % FONTS.length);
  };

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMediaUrl(URL.createObjectURL(file));
      setMode('media');
    }
  };

  const handlePost = () => {
    if (mode === 'text' && !text.trim()) return;
    if (mode === 'media' && !mediaUrl) return;

    if (mode === 'text') {
      chatStore.postStatus({
        type: 'text',
        content: text.trim(),
        backgroundColor: currentColor,
        fontStyle: currentFont.family,
      });
    } else {
      chatStore.postStatus({
        type: 'image',
        content: caption.trim() || undefined,
        mediaUrl: mediaUrl || '',
      });
    }

    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-between select-none animate-in fade-in"
      style={{
        backgroundColor: mode === 'text' ? currentColor : '#000',
      }}
    >
      {/* 1. TOP BAR */}
      <div className="p-4 flex items-center justify-between text-white z-20">
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-black/20 active:scale-95 transition-transform"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-2">
          {mode === 'text' && (
            <>
              <button
                onClick={handleNextFont}
                className="px-3 py-1.5 rounded-full bg-black/20 hover:bg-black/30 backdrop-blur-md text-xs font-bold transition-all"
                title="Change font"
              >
                {currentFont.name}
              </button>
              <button
                onClick={handleNextColor}
                className="p-2 rounded-full bg-black/20 hover:bg-black/30 backdrop-blur-md transition-all"
                title="Change color"
              >
                <Palette className="w-5 h-5" />
              </button>
            </>
          )}

          {mode === 'media' && mediaUrl && (
            <button
              onClick={() => setMediaUrl(null)}
              className="p-2 rounded-full bg-black/40 hover:bg-black/60 text-white"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* 2. BODY CONTENT */}
      <div className="flex-1 flex items-center justify-center p-6 text-center">
        {mode === 'text' ? (
          <textarea
            autoFocus
            rows={4}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a status update..."
            style={{ fontFamily: currentFont.family }}
            className="w-full max-w-lg bg-transparent text-white text-3xl sm:text-4xl font-bold placeholder-white/50 text-center focus:outline-none resize-none leading-relaxed"
          />
        ) : mediaUrl ? (
          <div className="relative max-h-full max-w-full flex items-center justify-center">
            <img
              src={mediaUrl}
              alt="Status preview"
              referrerPolicy="no-referrer"
              className="max-h-[65vh] max-w-full object-contain rounded-xl"
            />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 text-white">
            <label className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 transition-transform">
              <Camera className="w-10 h-10" />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleMediaUpload}
              />
            </label>
            <p className="text-sm font-medium">Select photo from gallery or camera</p>
          </div>
        )}
      </div>

      {/* 3. BOTTOM CONTROLS & SEND */}
      <div className="p-4 flex items-center justify-between gap-3 bg-gradient-to-t from-black/80 to-transparent z-20">
        {mode === 'media' && mediaUrl ? (
          <input
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Add a caption..."
            className="flex-1 px-4 py-2.5 rounded-full bg-white/20 text-white placeholder-white/60 text-sm focus:outline-none"
          />
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMode('text')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                mode === 'text' ? 'bg-white text-slate-900' : 'text-white/80'
              }`}
            >
              Text
            </button>
            <button
              onClick={() => setMode('media')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                mode === 'media' ? 'bg-white text-slate-900' : 'text-white/80'
              }`}
            >
              Media
            </button>
          </div>
        )}

        <button
          disabled={mode === 'text' ? !text.trim() : !mediaUrl}
          onClick={handlePost}
          className="w-12 h-12 rounded-full bg-[#00a884] text-white flex items-center justify-center hover:bg-[#008f70] active:scale-95 disabled:opacity-40 disabled:scale-100 shadow-lg transition-all shrink-0"
          title="Share status"
        >
          <Send className="w-5 h-5 ml-0.5" />
        </button>
      </div>
    </div>
  );
};
