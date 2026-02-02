
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import HeartBackground from './components/HeartBackground';
import DodgingButton from './components/DodgingButton';
import { generateLoveNote } from './services/geminiService';
import { AppStage, LoveNote } from './types';

// Declare confetti globally (loaded via script in index.html)
declare var confetti: any;

const ROMANTIC_TRACK_URL = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3'; 
const YES_CHIME_URL = 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3';
const BURST_THRESHOLD = 12;

interface Sticker {
  id: string;
  emoji: string;
  label: string;
  phrase: string;
}

const STICKER_PACK: Sticker[] = [
  { id: 'heart', emoji: '💝', label: 'True Love', phrase: "Our hearts beat as one." },
  { id: 'rose', emoji: '🌹', label: 'For You', phrase: "A love as beautiful as a blooming rose." },
  { id: 'ring', emoji: '💍', label: 'Forever', phrase: "A promise that lasts for all eternity." },
  { id: 'cupid', emoji: '🏹', label: 'Hit!', phrase: "Struck by Cupid's most perfect arrow." },
  { id: 'letter', emoji: '💌', label: 'Accepted', phrase: "Every word I write is a love letter to you." },
  { id: 'bear', emoji: '🧸', label: 'Cuddles', phrase: "Feeling safe and warm in your embrace." },
  { id: 'kiss', emoji: '💋', label: 'Kisses', phrase: "A thousand kisses for my beautiful Irene." },
  { id: 'stars', emoji: '✨', label: 'Magic', phrase: "Our love is written across the stars." },
  { id: 'lock', emoji: '🔒', label: 'Locked', phrase: "Our love is safely locked forever." },
  { id: 'swan', emoji: '🦢', label: 'Grace', phrase: "Graceful and elegant, just like our bond." },
  { id: 'chocolate', emoji: '🍫', label: 'Sweet', phrase: "Life is sweeter with you by my side." },
  { id: 'wine', emoji: '🍷', label: 'Cheers', phrase: "A toast to our beautiful journey together." },
  { id: 'fire', emoji: '🔥', label: 'Spark', phrase: "The spark between us burns brighter every day." },
  { id: 'rainbow', emoji: '🌈', label: 'Promise', phrase: "Our future is bright and full of color." },
  { id: 'cloud', emoji: '☁️', label: 'Dreamy', phrase: "Floating on cloud nine when I'm with you." },
  { id: 'sunset', emoji: '🌅', label: 'Golden', phrase: "Every sunset is better when shared with you." },
];

const App: React.FC = () => {
  const [stage, setStage] = useState<AppStage>(AppStage.QUESTION);
  const [yesScale, setYesScale] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loveNote, setLoveNote] = useState<LoveNote | null>(null);
  const [dodgeCount, setDodgeCount] = useState(0);
  const [isPressed, setIsPressed] = useState(false);
  const [showCopied, setShowCopied] = useState(false);
  const [isAutoBursting, setIsAutoBursting] = useState(false);
  const [showManualCopy, setShowManualCopy] = useState(false);
  const [selectedStickers, setSelectedStickers] = useState<Set<string>>(new Set(['letter', 'heart', 'stars', 'ring']));
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const chimeRef = useRef<HTMLAudioElement | null>(null);
  const fadeIntervalRef = useRef<number | null>(null);

  const fadeAudioOut = useCallback(() => {
    if (!audioRef.current) return;
    if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);

    const startVolume = audioRef.current.volume;
    const fadeDuration = 2500;
    const intervalTime = 50;
    const steps = fadeDuration / intervalTime;
    const volumeStep = startVolume / steps;

    fadeIntervalRef.current = window.setInterval(() => {
      if (audioRef.current && audioRef.current.volume > volumeStep) {
        audioRef.current.volume -= volumeStep;
      } else {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.volume = 0;
        }
        if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
      }
    }, intervalTime);
  }, []);

  const handleYes = useCallback(async () => {
    if (isPressed) return;

    if (chimeRef.current) {
      chimeRef.current.currentTime = 0;
      chimeRef.current.play().catch(() => {});
    }

    confetti({
      particleCount: 300,
      spread: 120,
      origin: { y: 0.6 },
      colors: ['#ff0000', '#ff69b4', '#ffffff', '#ff1493', '#ffd700'],
    });

    setIsPressed(true);
    fadeAudioOut();

    setTimeout(async () => {
      setStage(AppStage.ACCEPTED);
      setIsGenerating(true);
      
      const duration = 15 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 35, spread: 360, ticks: 80, zIndex: 0 };

      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) return clearInterval(interval);
        const particleCount = 40 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: Math.random() * 0.3, y: Math.random() - 0.2 }, colors: ['#ff69b4', '#ff85a2', '#ffffff'] });
        confetti({ ...defaults, particleCount, origin: { x: Math.random() * 0.3 + 0.7, y: Math.random() - 0.2 }, colors: ['#ff69b4', '#ff85a2', '#ffffff'] });
      }, 300);

      const note = await generateLoveNote("Irene");
      setLoveNote(note);
      setIsGenerating(false);
    }, 500);
  }, [isPressed, fadeAudioOut]);

  useEffect(() => {
    audioRef.current = new Audio(ROMANTIC_TRACK_URL);
    if (audioRef.current) {
      audioRef.current.loop = true;
      audioRef.current.volume = 0.35;
    }
    chimeRef.current = new Audio(YES_CHIME_URL);
    if (chimeRef.current) chimeRef.current.volume = 0.5;

    const playMusic = () => {
      if (audioRef.current && audioRef.current.paused && !isPressed) audioRef.current.play().catch(() => {});
    };

    window.addEventListener('click', playMusic);
    window.addEventListener('touchstart', playMusic);
    return () => {
      window.removeEventListener('click', playMusic);
      window.removeEventListener('touchstart', playMusic);
      if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
    };
  }, []);

  const handleNoDodge = useCallback(() => {
    setDodgeCount(prev => {
      const nextCount = prev + 1;
      setYesScale(prevScale => Math.min(prevScale + 0.25, 5));
      if (nextCount >= BURST_THRESHOLD) {
        setIsAutoBursting(true);
        setTimeout(() => handleYes(), 1500);
      }
      return nextCount;
    });
  }, [handleYes]);

  const toggleSticker = (id: string) => {
    setSelectedStickers(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const stickerStory = useMemo(() => {
    const active = STICKER_PACK.filter(s => selectedStickers.has(s.id));
    if (active.length === 0) return "Our love story begins today...";
    return active.map(s => `${s.emoji} ${s.phrase}`).join(' ');
  }, [selectedStickers]);

  const fullShareText = useMemo(() => {
    if (!loveNote) return "";
    const stickersText = Array.from(selectedStickers)
      .map(id => STICKER_PACK.find(s => s.id === id)?.emoji)
      .filter(Boolean)
      .join(' ');

    const shareUrl = window.location.href;
    return `💖 A Special Love Note for Irene 💖\n\n` +
      `She said YES! 💍✨\n\n` +
      `Stickers of our Love: ${stickersText}\n\n` +
      `Our Story: ${stickerStory}\n\n` +
      `📜 A Poem for You:\n${loveNote.poem}\n\n` +
      `💭 My Message:\n${loveNote.message}\n\n` +
      `✨ "${loveNote.quote}" — ${loveNote.quoteAuthor}\n\n` +
      `Sent with all my love. Check out our romantic memory at: ${shareUrl}`;
  }, [loveNote, selectedStickers, stickerStory]);

  const handleShare = async () => {
    if (!loveNote) return;
    
    const shareTitle = "Irene said YES! ❤️";
    const currentUrl = window.location.href;
    
    // Safety check for navigator.share URL validation
    const shareData: ShareData = {
      title: shareTitle,
      text: fullShareText,
    };

    // Browsers often throw "Invalid URL" if the current location is not http/https
    // or if the URL is empty/malformed. We strictly check for protocol.
    if (currentUrl.startsWith('http')) {
      shareData.url = currentUrl;
    }

    // Try System Native Share
    if (navigator.share) {
      try {
        // canShare is the modern, safe way to check support
        if (navigator.canShare && navigator.canShare(shareData)) {
          await navigator.share(shareData);
          return;
        }
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        console.warn("Native share rejected by system:", err);
      }
    }

    // Fallback 1: Clipboard
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(fullShareText);
        setShowCopied(true);
        setTimeout(() => setShowCopied(false), 3000);
      } else {
        throw new Error("CLIPBOARD_UNAVAILABLE");
      }
    } catch (err) {
      console.warn("Clipboard failed:", err);
      // Fallback 2: Manual UI (Fail-safe for non-HTTPS or strictly blocked environments)
      setShowManualCopy(true);
    }
  };

  const getRotation = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
    return (hash % 30) - 15;
  };

  return (
    <div className="min-h-screen bg-rose-50 flex items-start justify-center p-4 md:p-8 relative overflow-y-auto transition-colors duration-1000">
      <HeartBackground />
      
      <div className={`max-w-xl w-full bg-white/80 backdrop-blur-lg rounded-[2.5rem] shadow-2xl p-8 md:p-12 text-center z-10 border border-rose-100 ring-1 ring-rose-200 transition-all duration-700 my-auto ${stage === AppStage.ACCEPTED ? 'shadow-rose-200 mt-4 mb-12' : ''}`}>
        {stage === AppStage.QUESTION ? (
          <div className="flex flex-col items-center space-y-6 animate-in fade-in zoom-in duration-700">
            <div className="relative group">
              <div className="absolute inset-0 bg-rose-200 rounded-full blur-2xl opacity-30 animate-pulse"></div>
              <div className="relative w-32 h-32 md:w-44 md:h-44 rounded-full overflow-hidden border-4 border-rose-300 shadow-2xl bg-rose-100 flex items-center justify-center">
                <img 
                  src="https://images.unsplash.com/photo-1518895949257-7621c3c786d7?q=80&w=400&h=400&auto=format&fit=crop" 
                  alt="Rose" 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              <div className="absolute -bottom-2 right-2 bg-rose-500 text-white rounded-full p-2 shadow-lg scale-110 animate-bounce">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
              </div>
            </div>

            <div className="flex flex-col items-center">
              <span className="text-rose-400 font-bold tracking-[0.2em] uppercase text-[10px] mb-2 opacity-80">Dedicated To</span>
              <h1 className="text-6xl md:text-8xl font-cursive text-rose-600 leading-tight drop-shadow-sm mb-4">Irene</h1>
              <div className="h-[1px] w-32 bg-gradient-to-r from-transparent via-rose-300 to-transparent mb-2" />
              <div className="text-rose-400 font-medium italic text-sm">My Forever & Always</div>
            </div>
            
            <p className="text-xl md:text-2xl text-rose-800 font-serif-elegant font-bold mt-4">Will you be my Valentine?</p>

            <div className="flex flex-col items-center justify-center gap-12 w-full pt-8 min-h-[300px] relative">
              <button 
                onClick={handleYes}
                style={{ '--base-scale': yesScale } as any}
                className={`
                  relative px-12 py-4 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-full shadow-lg 
                  transition-all duration-300 z-20 flex items-center gap-2
                  ${isPressed ? 'animate-acceptance-burst ring-8 ring-rose-400' : isAutoBursting ? 'animate-hyper-pulse ring-[12px] ring-rose-600' : 'animate-romantic-pulse hover:ring-8 hover:ring-rose-200/50'}
                  group
                `}
              >
                <div className={`absolute inset-0 rounded-full bg-rose-400 blur-2xl transition-opacity duration-300 ${dodgeCount > 3 ? 'opacity-40 animate-pulse' : 'opacity-0'}`}></div>
                <span className="relative z-10">{isAutoBursting ? "❤️ BURSTING WITH LOVE! ❤️" : "YES!"}</span>
                <span className="text-xl relative z-10 transition-transform group-hover:scale-125">💖</span>
              </button>
              
              {!isAutoBursting && (
                <div className="transition-all duration-500" style={{ opacity: Math.max(0, 1 - (dodgeCount / BURST_THRESHOLD)) }}>
                  <DodgingButton label="No... 🥺" onDodged={handleNoDodge} />
                </div>
              )}

              {dodgeCount > 0 && dodgeCount < BURST_THRESHOLD && (
                <div className="absolute -bottom-8 text-rose-300 font-bold uppercase tracking-widest text-[10px] animate-pulse">
                  The "Yes" button is getting heavy... {BURST_THRESHOLD - dodgeCount} tries left!
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-8 animate-in fade-in slide-in-from-bottom duration-1000">
            <div className="text-7xl mb-4 animate-bounce">💍</div>
            <h1 className="text-5xl md:text-7xl font-cursive text-rose-600 drop-shadow-md">Irene said Yes!</h1>
            
            <div className="w-full max-w-md mx-auto relative group">
              <div className="absolute -inset-2 bg-gradient-to-r from-rose-200 via-rose-100 to-rose-200 rounded-[3rem] blur-xl opacity-50 group-hover:opacity-100 transition duration-1000"></div>
              <div className="relative overflow-hidden rounded-[2.5rem] shadow-2xl border-4 border-white transform transition-all duration-500 hover:scale-[1.03] cursor-pointer">
                <div className="absolute top-4 right-4 z-20 bg-white/90 rounded-full p-2 shadow-lg animate-pulse">❤️</div>
                <img 
                  src="https://images.unsplash.com/photo-1518199266791-5375a83190b7?q=80&w=1000&auto=format&fit=crop" 
                  alt="Celebration" 
                  className="w-full h-72 object-cover"
                />
              </div>

              {/* STICKER STORY MESSAGE - Below Photo */}
              <div className="mt-6 reveal-item space-y-4" style={{ animationDelay: '0.2s' }}>
                <div className="bg-white/40 backdrop-blur-sm p-6 rounded-[2rem] border border-rose-100/50 shadow-inner">
                  <div className="text-rose-400 font-bold uppercase tracking-[0.2em] text-[10px] mb-2 opacity-60">Our Sticker Story</div>
                  <p className="text-rose-800 font-cursive text-2xl leading-relaxed animate-in fade-in zoom-in duration-1000 whitespace-pre-line" key={stickerStory}>
                    {stickerStory}
                  </p>
                </div>

                {/* THE STICKERS THEMSELVES - Below Sticker Story */}
                <div className="flex justify-center items-center gap-4 flex-wrap px-4 py-2 min-h-[80px]">
                  {Array.from(selectedStickers).map((id, index) => {
                    const sticker = STICKER_PACK.find(s => s.id === id);
                    return (
                      <span 
                        key={id} 
                        className="text-4xl md:text-5xl animate-in zoom-in duration-700 hover:scale-125 transition-transform cursor-pointer filter drop-shadow-md" 
                        style={{ 
                          transform: `rotate(${getRotation(id)}deg)`, 
                          animationDelay: `${0.3 + (index * 0.1)}s`
                        }}
                      >
                        {sticker?.emoji}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>

            {isGenerating ? (
              <div className="py-12 flex flex-col items-center space-y-4">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-rose-100 border-t-rose-500 rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center text-rose-400 animate-pulse">❤️</div>
                </div>
                <p className="text-rose-500 font-cursive text-2xl animate-pulse">Sealing our love in ink...</p>
              </div>
            ) : loveNote && (
              <div className="space-y-8 w-full relative">
                {/* Poem Container */}
                <div 
                  className="reveal-item paper-shimmer bg-rose-50/50 p-8 pt-10 rounded-[2.5rem] border-2 border-rose-100 shadow-inner italic text-rose-800 font-serif-elegant leading-relaxed text-xl relative group"
                  style={{ animationDelay: '0.4s' }}
                >
                  <div className="pt-4 border-t border-rose-100/30 whitespace-pre-line">
                    {loveNote.poem}
                  </div>
                </div>
                
                {/* Personal Message */}
                <p 
                  className="reveal-item text-rose-700 text-lg leading-relaxed font-medium px-4 whitespace-pre-line" 
                  style={{ animationDelay: '0.8s' }}
                >
                  {loveNote.message}
                </p>

                {/* Quote Block */}
                <div 
                  className="reveal-item relative py-6 px-10 border-y border-rose-200/50 bg-rose-100/30 rounded-2xl" 
                  style={{ animationDelay: '1.2s' }}
                >
                   <p className="text-rose-900 font-serif-elegant italic text-lg leading-snug whitespace-pre-line">
                     "{loveNote.quote}"
                   </p>
                   <p className="text-rose-400 font-bold uppercase tracking-widest text-[10px] mt-4">
                     — {loveNote.quoteAuthor}
                   </p>
                </div>

                {/* STICKER SELECTOR SHEET */}
                <section className="bg-white/60 rounded-[2rem] p-6 border-2 border-dashed border-rose-200 space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-rose-600 font-bold uppercase tracking-[0.15em] text-[12px]">Our Sticker Pack</h2>
                    <span className="text-rose-400 text-[10px] font-bold italic">{selectedStickers.size} stickers placed</span>
                  </div>
                  <div className="grid grid-cols-4 gap-3 md:gap-4">
                    {STICKER_PACK.map((sticker) => {
                      const isSelected = selectedStickers.has(sticker.id);
                      return (
                        <button
                          key={sticker.id}
                          onClick={() => toggleSticker(sticker.id)}
                          className={`group relative aspect-square flex flex-col items-center justify-center rounded-2xl transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] transform ${isSelected ? 'bg-rose-500 text-white shadow-lg scale-110 -rotate-2 opacity-100' : 'bg-rose-50 text-rose-300 opacity-60 scale-90 hover:opacity-100 hover:scale-100 hover:bg-white'}`}
                        >
                          <span className="text-2xl md:text-3xl mb-1 filter drop-shadow-sm group-hover:rotate-12 transition-transform">{sticker.emoji}</span>
                          <span className={`text-[7px] uppercase font-bold tracking-tighter ${isSelected ? 'text-rose-100' : 'text-rose-400'}`}>{sticker.label}</span>
                          {isSelected && (
                            <div className="absolute -top-1 -right-1 bg-white text-rose-500 rounded-full w-4 h-4 flex items-center justify-center text-[8px] shadow-md font-bold border border-rose-200 animate-in zoom-in">✓</div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </section>

                <div className="flex flex-col items-center gap-6 pt-4">
                  <button 
                    onClick={handleShare} 
                    className="px-10 py-4 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-full shadow-lg transition-all hover:scale-105 active:scale-95 hover:ring-8 hover:ring-rose-200/50"
                  >
                    {showCopied ? "Copied to your heart! ✨" : "Share our Love Note ❤️"}
                  </button>

                  {/* Manual Copy Fallback UI - Fail-safe for permission denied errors */}
                  {showManualCopy && (
                    <div className="fixed inset-0 bg-rose-900/70 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
                      <div className="bg-white rounded-[3rem] p-8 max-w-lg w-full shadow-2xl space-y-6 relative border-4 border-rose-200">
                        <button 
                          onClick={() => setShowManualCopy(false)}
                          className="absolute top-4 right-4 text-rose-300 hover:text-rose-600 transition-colors p-2"
                        >
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                        <div className="text-center space-y-2">
                          <h3 className="text-rose-600 font-cursive text-4xl">Save Our Story</h3>
                          <p className="text-rose-400 text-sm italic">Direct sharing is limited on this browser, but you can copy our note manually for Irene! ❤️</p>
                        </div>
                        <div className="relative">
                          <textarea
                            readOnly
                            value={fullShareText}
                            className="w-full h-64 p-4 bg-rose-50 rounded-2xl border-2 border-rose-100 text-rose-800 text-sm font-medium focus:ring-0 focus:border-rose-300 outline-none resize-none leading-relaxed"
                            onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                          />
                          <div className="absolute bottom-2 right-2 px-3 py-1 bg-rose-200/50 rounded-full text-[9px] font-bold text-rose-600 uppercase">Click to Select All</div>
                        </div>
                        <div className="text-center">
                          <button 
                            onClick={() => setShowManualCopy(false)}
                            className="mt-4 px-10 py-3 bg-rose-500 text-white font-bold rounded-full hover:bg-rose-600 transition-colors shadow-lg active:scale-95"
                          >
                            Done
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-8 border-t border-rose-100">
                  <div className="text-rose-500 font-cursive text-5xl mb-2">I love you, Irene.</div>
                  <div className="text-rose-300 text-sm font-bold tracking-widest uppercase">My Valentine, My Everything</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
