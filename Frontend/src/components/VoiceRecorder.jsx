import { Mic, MicOff, RotateCcw, CheckCircle } from 'lucide-react'
import { useAudioRecorder } from '../hooks/useAudioRecorder'

const bars = Array.from({ length: 16 }, (_, i) => i)

function formatTime(s) {
  return `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`
}

export default function VoiceRecorder({ onRecordingComplete }) {
  const { isRecording, audioBlob, audioURL, duration, start, stop, reset } = useAudioRecorder()

  const handleSubmit = () => {
    if (audioBlob) onRecordingComplete(audioBlob)
  }

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      {/* Waveform visualizer */}
      <div className="flex items-center justify-center gap-1 h-16">
        {bars.map((i) => (
          <div
            key={i}
            className="waveform-bar"
            style={{
              animationDelay: `${i * 0.05}s`,
              opacity: isRecording ? 1 : audioBlob ? 0.4 : 0.15,
              background: isRecording ? 'var(--accent-2)' : audioBlob ? 'var(--positive)' : 'var(--border)',
              height: isRecording ? undefined : '8px',
              animation: isRecording ? undefined : 'none'
            }}
          />
        ))}
      </div>

      {/* Timer */}
      <div className="font-mono text-3xl font-medium" style={{ color: isRecording ? 'var(--accent-2)' : 'var(--text-muted)', fontFamily: 'JetBrains Mono' }}>
        {formatTime(duration)}
      </div>

      {/* Main record button */}
      <div className="relative flex items-center justify-center">
        {isRecording && (
          <div className="recording-pulse absolute w-20 h-20 rounded-full" />
        )}
        <button
          onClick={isRecording ? stop : start}
          className="relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95"
          style={{
            background: isRecording
              ? 'linear-gradient(135deg, #fa6d9a, #f43f5e)'
              : audioBlob
                ? 'linear-gradient(135deg, #4ade80, #22c55e)'
                : 'linear-gradient(135deg, #7c6dfa, #9b8cff)',
            boxShadow: isRecording
              ? '0 0 40px rgba(250,109,154,0.5)'
              : '0 0 30px rgba(124,109,250,0.4)'
          }}
        >
          {isRecording ? <MicOff size={28} color="white" /> : <Mic size={28} color="white" />}
        </button>
      </div>

      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
        {isRecording ? 'Recording… click to stop' : audioBlob ? 'Recording complete' : 'Click to start recording'}
      </p>

      {/* Audio playback */}
      {audioURL && !isRecording && (
        <div className="w-full animate-fadeInUp">
          <audio src={audioURL} controls className="w-full rounded-lg" style={{ height: '40px' }} />
        </div>
      )}

      {/* Actions */}
      {audioBlob && !isRecording && (
        <div className="flex gap-3 animate-fadeInUp">
          <button
            onClick={() => { reset() }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all hover:scale-105"
            style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }}
          >
            <RotateCcw size={14} /> Re-record
          </button>
          <button
            onClick={handleSubmit}
            className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #7c6dfa, #9b8cff)', boxShadow: '0 0 20px rgba(124,109,250,0.3)' }}
          >
            <CheckCircle size={14} /> Use this recording
          </button>
        </div>
      )}
    </div>
  )
}

