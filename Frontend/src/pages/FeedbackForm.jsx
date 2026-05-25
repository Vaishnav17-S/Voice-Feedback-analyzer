import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Mic, CheckCircle, Loader2, User, ChevronRight, BarChart3, MessageSquare } from 'lucide-react'
import VoiceRecorder from '../components/VoiceRecorder'

const QUESTIONS = [
  { id: 1, text: 'How would you describe your overall experience with our product or service?', category: 'Overall' },
  { id: 2, text: 'What did you like most about your experience? What went really well?', category: 'Positives' },
  { id: 3, text: 'What were the biggest challenges or frustrations you faced?', category: 'Pain Points' },
  { id: 4, text: 'If you could change one thing about our product or service, what would it be?', category: 'Improvements' },
  { id: 5, text: 'How likely are you to recommend us to a friend or colleague, and why?', category: 'NPS' },
]

const API_BASE = '/api'

export default function FeedbackForm() {
  const nav = useNavigate()
  const [step, setStep] = useState('name') // name | questions | done
  const [name, setName] = useState('')
  const [sessionId, setSessionId] = useState(null)
  const [currentQ, setCurrentQ] = useState(0)
  const [responses, setResponses] = useState([])
  const [uploading, setUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState(null)
  const [textFallback, setTextFallback] = useState(false)
  const [textInput, setTextInput] = useState('')

  const startSession = async () => {
    if (!name.trim()) return
    try {
      const res = await axios.post(`${API_BASE}/transcription/start-session`, { respondent_name: name })
      setSessionId(res.data.session_id)
      setStep('questions')
    } catch {
      alert('Could not connect to server. Make sure the backend is running.')
    }
  }

  const handleRecording = async (audioBlob) => {
    const question = QUESTIONS[currentQ]
    setUploading(true)
    setUploadStatus('Uploading audio...')

    try {
      const formData = new FormData()
      formData.append('session_id', sessionId)
      formData.append('question_id', question.id)
      formData.append('question_text', question.text)
      formData.append('audio', audioBlob, 'recording.webm')

      setUploadStatus('Transcribing with Whisper...')
      const res = await axios.post(`${API_BASE}/transcription/upload-audio`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      setUploadStatus('Analyzing sentiment...')
      setResponses(prev => [...prev, { question: question.text, transcript: res.data.transcript, sentiment: res.data.sentiment }])
      await new Promise(r => setTimeout(r, 800))

      advance()
    } catch (err) {
      console.error(err)
      alert('Upload failed. Please try the text option below.')
    } finally {
      setUploading(false)
      setUploadStatus(null)
    }
  }

  const handleTextSubmit = async () => {
    if (!textInput.trim()) return
    const question = QUESTIONS[currentQ]
    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('session_id', sessionId)
      formData.append('question_id', question.id)
      formData.append('question_text', question.text)
      formData.append('text_response', textInput)

      const res = await axios.post(`${API_BASE}/transcription/submit-text`, formData)
      setResponses(prev => [...prev, { question: question.text, transcript: res.data.transcript, sentiment: res.data.sentiment }])
      setTextInput('')
      setTextFallback(false)
      advance()
    } catch {
      alert('Submission failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const advance = () => {
    if (currentQ < QUESTIONS.length - 1) {
      setCurrentQ(q => q + 1)
    } else {
      setStep('done')
    }
  }

  const progress = ((currentQ) / QUESTIONS.length) * 100

  if (step === 'name') return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-md">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6" style={{ background: 'linear-gradient(135deg, #7c6dfa, #fa6d9a)' }}>
          <Mic size={24} color="white" />
        </div>
        <h1 className="font-display text-4xl font-bold mb-2" style={{ fontFamily: 'Syne' }}>Voice Feedback</h1>
        <p className="mb-8" style={{ color: 'var(--text-muted)' }}>Your voice helps us improve. Takes about 3 minutes.</p>

        <div className="p-6 rounded-2xl glass">
          <label className="block text-sm mb-2" style={{ color: 'var(--text-muted)' }}>Your name (optional)</label>
          <div className="flex items-center gap-3 p-3 rounded-xl mb-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <User size={18} style={{ color: 'var(--text-muted)' }} />
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && startSession()}
              placeholder="Anonymous is fine too..."
              className="flex-1 bg-transparent outline-none"
              style={{ color: 'var(--text)', fontFamily: 'DM Sans' }}
            />
          </div>
          <button
            onClick={startSession}
            className="w-full py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
            style={{ background: 'linear-gradient(135deg, #7c6dfa, #9b8cff)', boxShadow: '0 0 30px rgba(124,109,250,0.35)' }}
          >
            <Mic size={18} /> Start Voice Survey <ChevronRight size={16} />
          </button>
        </div>
        <p className="text-xs text-center mt-4" style={{ color: 'var(--text-muted)' }}>
          {QUESTIONS.length} questions · Voice or text · All answers are anonymous
        </p>
      </div>
    </div>
  )

  if (step === 'done') return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg)' }}>
      <div className="text-center max-w-md animate-fadeInUp">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ background: 'linear-gradient(135deg, #4ade80, #22c55e)', boxShadow: '0 0 40px rgba(74,222,128,0.3)' }}>
          <CheckCircle size={36} color="white" />
        </div>
        <h1 className="font-display text-4xl font-bold mb-3" style={{ fontFamily: 'Syne' }}>Thank you!</h1>
        <p className="mb-8" style={{ color: 'var(--text-muted)', lineHeight: 1.7 }}>
          Your feedback has been recorded and will be analyzed by our AI system.
          Your insights help us build a better product.
        </p>

        <div className="p-4 rounded-2xl mb-6 text-left" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <p className="text-xs mb-3 font-semibold" style={{ color: 'var(--text-muted)' }}>YOUR RESPONSES ({responses.length})</p>
          {responses.map((r, i) => (
            <div key={i} className="flex items-start gap-2 py-2" style={{ borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
              <div className="text-xs mt-0.5 px-2 py-0.5 rounded-full font-mono" style={{
                background: r.sentiment?.label === 'positive' ? 'rgba(74,222,128,0.15)' : r.sentiment?.label === 'negative' ? 'rgba(248,113,113,0.15)' : 'rgba(148,163,184,0.15)',
                color: r.sentiment?.label === 'positive' ? '#4ade80' : r.sentiment?.label === 'negative' ? '#f87171' : '#94a3b8'
              }}>
                {r.sentiment?.label}
              </div>
              <p className="text-sm flex-1" style={{ color: 'var(--text-muted)' }}>{r.transcript?.slice(0, 80)}...</p>
            </div>
          ))}
        </div>

        <button
          onClick={() => nav('/dashboard')}
          className="flex items-center gap-2 mx-auto px-6 py-3 rounded-xl text-sm font-semibold transition-all hover:scale-105"
          style={{ border: '1px solid var(--border)', color: 'var(--text)' }}
        >
          <BarChart3 size={16} /> View Analysis Dashboard
        </button>
      </div>
    </div>
  )

  const question = QUESTIONS[currentQ]

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      {/* Progress bar */}
      <div className="h-1 w-full" style={{ background: 'var(--surface)' }}>
        <div className="h-full transition-all duration-700 ease-out"
          style={{ width: `${((currentQ + 1) / QUESTIONS.length) * 100}%`, background: 'linear-gradient(90deg, #7c6dfa, #fa6d9a)' }} />
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-xl">
          {/* Question counter */}
          <div className="flex items-center justify-between mb-6">
            <span className="text-xs font-mono px-3 py-1 rounded-full" style={{ background: 'var(--surface)', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono' }}>
              {question.category}
            </span>
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {currentQ + 1} of {QUESTIONS.length}
            </span>
          </div>

          {/* Question */}
          <h2 className="text-2xl font-display font-semibold mb-8 leading-relaxed" style={{ fontFamily: 'Syne', lineHeight: 1.4 }}>
            {question.text}
          </h2>

          {/* Recording card */}
          <div className="p-6 rounded-2xl glass mb-4">
            {uploading ? (
              <div className="flex flex-col items-center gap-4 py-8">
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'var(--surface)' }}>
                  <Loader2 size={24} style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
                </div>
                <p className="shimmer-text font-medium">{uploadStatus}</p>
              </div>
            ) : textFallback ? (
              <div className="flex flex-col gap-3">
                <label className="text-sm" style={{ color: 'var(--text-muted)' }}>Type your response:</label>
                <textarea
                  value={textInput}
                  onChange={e => setTextInput(e.target.value)}
                  placeholder="Share your thoughts..."
                  rows={4}
                  className="w-full rounded-xl p-3 resize-none outline-none"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'DM Sans' }}
                />
                <div className="flex gap-2">
                  <button onClick={() => setTextFallback(false)} className="px-4 py-2 rounded-lg text-sm" style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                    Back to voice
                  </button>
                  <button onClick={handleTextSubmit} disabled={!textInput.trim()}
                    className="flex-1 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg, #7c6dfa, #9b8cff)' }}>
                    Submit text response
                  </button>
                </div>
              </div>
            ) : (
              <VoiceRecorder onRecordingComplete={handleRecording} />
            )}
          </div>

          {/* Text fallback */}
          {!textFallback && !uploading && (
            <button onClick={() => setTextFallback(true)} className="w-full text-sm flex items-center justify-center gap-2 py-2"
              style={{ color: 'var(--text-muted)' }}>
              <MessageSquare size={14} /> Can't record? Type instead
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
