
import React, { useState, useCallback, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import sdk from '@farcaster/frame-sdk';
import { GenerationStatus, Impression } from './types';
import { analyzeVibe, generateImpressionImage } from './services/geminiService';
import { ImpressionCard } from './components/ImpressionCard';

const Home: React.FC = () => {
  const [handle, setHandle] = useState('');
  const [bio, setBio] = useState('');
  const [status, setStatus] = useState<GenerationStatus>(GenerationStatus.IDLE);
  const [impressions, setImpressions] = useState<Impression[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isFarcaster, setIsFarcaster] = useState(false);

  // Farcaster SDK Initialization
  useEffect(() => {
    const init = async () => {
      try {
        const context = await sdk.context;
        if (context?.user) {
          setIsFarcaster(true);
          setHandle(context.user.username || '');
          // If the user has a bio in context, we could use it, 
          // but usually we want them to input their current "vibe"
        }
        sdk.actions.ready();
      } catch (e) {
        console.warn("Farcaster SDK not detected, running in browser mode.");
      }
    };
    init();
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('base_impressions');
    if (saved) {
      try {
        setImpressions(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved impressions", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('base_impressions', JSON.stringify(impressions));
  }, [impressions]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!handle || !bio) return;

    setStatus(GenerationStatus.ANALYZING);
    setError(null);

    try {
      const vibe = await analyzeVibe(handle, bio);
      setStatus(GenerationStatus.GENERATING);
      const imageUrl = await generateImpressionImage(vibe.visualPrompt);

      const newImpression: Impression = {
        id: crypto.randomUUID(),
        handle: handle.startsWith('@') ? handle.slice(1) : handle,
        vibe: vibe.keywords.join(', '),
        imageUrl,
        timestamp: Date.now(),
        description: vibe.description
      };

      setImpressions(prev => [newImpression, ...prev]);
      setStatus(GenerationStatus.SUCCESS);
      setTimeout(() => setStatus(GenerationStatus.IDLE), 3000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Something went wrong while generating your impression.');
      setStatus(GenerationStatus.ERROR);
    }
  };

  const handleShare = useCallback((imp: Impression) => {
    const shareText = `Check out my Base Impression! Generated via @baseimpression mini-app. 🔵✨`;
    
    // If inside Farcaster, use the native composer
    if (isFarcaster) {
      sdk.actions.cast({
        text: shareText,
        embeds: [window.location.href] // In a real app, this would be the permalink to the impression
      });
    } else if (navigator.share) {
      navigator.share({
        title: 'Base Impression',
        text: shareText,
        url: window.location.href
      }).catch(console.error);
    } else {
      const warpcastUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(shareText)}&embeds[]=${encodeURIComponent(window.location.href)}`;
      window.open(warpcastUrl, '_blank');
    }
  }, [isFarcaster]);

  return (
    <div className="w-full max-w-2xl space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <section className="glass p-8 rounded-3xl shadow-xl border border-blue-500/20 relative overflow-hidden">
        {/* Abstract Background Element */}
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <form onSubmit={handleGenerate} className="relative z-10 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-blue-400 mb-2 uppercase tracking-wider">
              Farcaster Handle
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">@</span>
              <input
                type="text"
                placeholder="username"
                value={handle}
                onChange={(e) => setHandle(e.target.value.replace('@', ''))}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-3 focus:outline-none focus:border-blue-500 transition-colors text-white placeholder-gray-600"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-blue-400 mb-2 uppercase tracking-wider">
              Your Vibe / Vision
            </label>
            <textarea
              placeholder="What are you building on Base? What's your current social mood?"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors text-white placeholder-gray-600 resize-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={status !== GenerationStatus.IDLE}
            className={`w-full py-4 rounded-xl font-bold text-lg transition-all transform active:scale-95 flex items-center justify-center space-x-3
              ${status === GenerationStatus.IDLE 
                ? 'base-gradient text-white hover:shadow-[0_0_30px_rgba(0,82,255,0.4)]' 
                : 'bg-gray-800 text-gray-400 cursor-not-allowed'}`}
          >
            {status === GenerationStatus.ANALYZING && (
              <span className="flex items-center">
                <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Analyzing Context...
              </span>
            )}
            {status === GenerationStatus.GENERATING && (
              <span className="flex items-center">
                <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating Visual Soul...
              </span>
            )}
            {status === GenerationStatus.SUCCESS && <span>✨ Impression Visualized!</span>}
            {status === GenerationStatus.ERROR && <span>Failed. Try Again?</span>}
            {status === GenerationStatus.IDLE && <span>Generate Impression</span>}
          </button>

          {error && (
            <p className="text-red-400 text-sm text-center font-medium mt-2">
              {error}
            </p>
          )}
        </form>
      </section>

      <section className="space-y-6 pb-20">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold flex items-center">
            <span className="w-10 h-10 rounded-xl base-gradient flex items-center justify-center mr-4 text-lg shadow-lg">🖼️</span>
            Vault
          </h2>
          <span className="bg-white/10 px-3 py-1 rounded-full text-xs font-bold text-blue-300 uppercase tracking-tighter">
            {impressions.length} Collected
          </span>
        </div>

        {impressions.length === 0 ? (
          <div className="glass p-16 rounded-3xl text-center border border-dashed border-white/10">
            <div className="text-5xl mb-6 opacity-50 animate-float">💠</div>
            <p className="text-gray-500 font-medium">Your artistic legacy on Base begins here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {impressions.map((imp) => (
              <ImpressionCard 
                key={imp.id} 
                impression={imp} 
                onShare={handleShare}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

const About: React.FC = () => (
  <div className="w-full max-w-2xl glass p-10 rounded-3xl animate-in fade-in duration-700 border border-blue-500/10">
    <h2 className="text-3xl font-bold mb-8 text-blue-400 tracking-tight">The Vision</h2>
    <div className="space-y-6 text-gray-300 text-lg leading-relaxed">
      <p>
        Base Impression is an <span className="text-white font-semibold">AI-Synthesizer</span> for your social presence. 
        It translates the noise of social bios into the signal of abstract digital art.
      </p>
      <div className="p-4 bg-white/5 rounded-2xl border border-white/5 italic text-sm">
        "On Base, everyone is a builder. Every builder has a vibe. We just make it visible."
      </div>
      <p>
        Powered by <span className="text-blue-400 font-medium">Gemini Flash</span> for lightning-fast analysis and image generation, 
        running natively within the Farcaster ecosystem.
      </p>
    </div>
    <Link to="/" className="mt-12 inline-flex items-center text-blue-500 font-bold hover:gap-2 transition-all">
      <span className="mr-2">&larr;</span> Back to Vault
    </Link>
  </div>
);

const App: React.FC = () => {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col items-center bg-black text-white px-4 py-8 md:py-16 selection:bg-blue-500/30">
      {/* Dynamic Header */}
      <header className="w-full max-w-2xl text-center mb-16">
        <nav className="flex justify-center items-center space-x-2 mb-10">
          <Link to="/" className={`px-4 py-2 rounded-full transition-all text-sm font-bold ${location.pathname === '/' ? 'bg-white/10 text-blue-400' : 'text-gray-500 hover:text-white'}`}>Generator</Link>
          <div className="w-1 h-1 bg-white/20 rounded-full"></div>
          <Link to="/about" className={`px-4 py-2 rounded-full transition-all text-sm font-bold ${location.pathname === '/about' ? 'bg-white/10 text-blue-400' : 'text-gray-500 hover:text-white'}`}>Manifesto</Link>
        </nav>
        
        <div className="inline-block p-[2px] rounded-full base-gradient mb-8">
          <div className="bg-black rounded-full px-5 py-2 flex items-center space-x-3">
            <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
            </div>
            <span className="font-bold tracking-widest text-[10px] uppercase text-blue-200">Base Frame Protocol</span>
          </div>
        </div>
        
        <h1 className="text-6xl md:text-8xl font-black mb-6 tracking-tighter italic">
          BASE <span className="bg-clip-text text-transparent bg-gradient-to-b from-blue-400 to-blue-800">IMPRESSION</span>
        </h1>
        <p className="text-gray-400 text-xl font-medium max-w-md mx-auto leading-tight">
          Visualizing your social identity through the lens of artificial intelligence.
        </p>
      </header>

      <main className="w-full flex justify-center">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </main>

      {/* Futuristic Footer */}
      <footer className="mt-auto text-center py-16 w-full border-t border-white/5">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex justify-center space-x-8 mb-6">
            <div className="text-left">
              <p className="text-[10px] text-gray-600 uppercase font-black tracking-[0.2em] mb-1">Ecosystem</p>
              <p className="text-xs text-gray-400 font-bold">Base Network</p>
            </div>
            <div className="text-left border-l border-white/10 pl-8">
              <p className="text-[10px] text-gray-600 uppercase font-black tracking-[0.2em] mb-1">Protocol</p>
              <p className="text-xs text-gray-400 font-bold">Farcaster Frame v2</p>
            </div>
          </div>
          <p className="text-gray-700 text-[10px] font-medium uppercase tracking-[0.3em]">
            &copy; 2024 Base Impression AI // Open Source Synthesis
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
