import { useNavigate } from 'react-router-dom'
import { Mic, BarChart3, Brain, Zap, ArrowRight, Shield } from 'lucide-react'

const features = [
  { icon: Mic, title: 'Voice-First', desc: 'Speak naturally, just like a conversation. No typing required.' },
  { icon: Brain, title: 'AI Analysis', desc: 'GPT-4 extracts themes, complaints, and praise from every response.' },
  { icon: BarChart3, title: 'Live Dashboard', desc: 'Real-time sentiment charts and executive-ready reports.' },
  { icon: Shield, title: 'Privacy First', desc: 'Audio processed and discarded. Only transcripts stored.' },
]

export default function Landing() {
  const nav = useNavigate()
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Background grid */}
      <div className="fixed inset-0 opacity-[0.03]" style={{
        backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)',
        backgroundSize: '60px 60px'
      }} />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent)' }}>
            <Mic size={16} color="white" />
          </div>
          <span className="font-display font-700 text-lg" style={{ fontFamily: 'Syne', fontWeight: 700 }}>VoiceIQ</span>
        </div>
        <button
          onClick={() => nav('/dashboard')}
          className="text-sm px-4 py-2 rounded-lg transition-all"
          style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}
        >
          Admin Dashboard
        </button>
      </nav>

      {/* Hero */}
      <section className="relative z-10 text-center px-8 pt-20 pb-32">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs mb-8" style={{
          background: 'rgba(124,109,250,0.1)', border: '1px solid rgba(124,109,250,0.3)', color: 'var(--accent)'
        }}>
          <Zap size={12} /> Powered by OpenAI Whisper + GPT-4
        </div>

        <h1 className="text-6xl md:text-8xl font-display font-800 leading-none mb-6" style={{ fontFamily: 'Syne', fontWeight: 800 }}>
          Feedback that<br />
          <span style={{
            background: 'linear-gradient(135deg, #7c6dfa 0%, #fa6d9a 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>actually talks.</span>
        </h1>

        <p className="text-xl max-w-xl mx-auto mb-12" style={{ color: 'var(--text-muted)', lineHeight: 1.7 }}>
          Collect voice feedback from your users. AI converts speech to text, 
          analyzes sentiment, and surfaces insights automatically.
        </p>

        <div className="flex items-center justify-center gap-4 flex-wrap">
          <button
            onClick={() => nav('/feedback')}
            className="flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-white transition-all hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #7c6dfa, #9b8cff)', boxShadow: '0 0 40px rgba(124,109,250,0.4)' }}
          >
            <Mic size={18} /> Give Feedback <ArrowRight size={16} />
          </button>
          <button
            onClick={() => nav('/dashboard')}
            className="flex items-center gap-2 px-8 py-4 rounded-xl font-semibold transition-all hover:scale-105"
            style={{ border: '1px solid var(--border)', color: 'var(--text)' }}
          >
            <BarChart3 size={18} /> View Dashboard
          </button>
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 max-w-5xl mx-auto px-8 pb-32 grid grid-cols-1 md:grid-cols-2 gap-6">
        {features.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="p-6 rounded-2xl glass hover:border-[var(--accent)] transition-all duration-300"
            style={{ borderColor: 'var(--border)' }}>
            <div className="w-10 h-10 rounded-lg mb-4 flex items-center justify-center"
              style={{ background: 'rgba(124,109,250,0.15)' }}>
              <Icon size={20} style={{ color: 'var(--accent)' }} />
            </div>
            <h3 className="font-display font-semibold text-lg mb-2" style={{ fontFamily: 'Syne' }}>{title}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>{desc}</p>
          </div>
        ))}
      </section>
    </div>
  )
}

