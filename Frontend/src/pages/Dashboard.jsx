import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend
} from 'recharts'
import { 
  BarChart3, Mic, TrendingUp, TrendingDown, Minus, AlertCircle, 
  ThumbsUp, Lightbulb, FileText, Loader2, RefreshCw, ExternalLink,
  Users, MessageSquare, Activity
} from 'lucide-react'

const API_BASE = '/api'
const COLORS = { positive: '#4ade80', neutral: '#94a3b8', negative: '#f87171' }
const PRIORITY_COLORS = { critical: '#f43f5e', high: '#fb923c', medium: '#facc15', low: '#4ade80' }

export default function Dashboard() {
  const nav = useNavigate()
  const [stats, setStats] = useState(null)
  const [report, setReport] = useState(null)
  const [timeline, setTimeline] = useState([])
  const [analyzing, setAnalyzing] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [statsRes, timelineRes] = await Promise.all([
        axios.get(`${API_BASE}/dashboard/stats`),
        axios.get(`${API_BASE}/dashboard/sentiment-timeline`)
      ])
      setStats(statsRes.data)
      setTimeline(timelineRes.data.slice(-30))

      if (statsRes.data.latest_report_id) {
        const reportRes = await axios.get(`${API_BASE}/analysis/report/${statsRes.data.latest_report_id}`)
        setReport(reportRes.data)
      }
    } catch (err) {
      console.error('Failed to load data:', err)
    } finally {
      setLoading(false)
    }
  }

  const runAnalysis = async () => {
    setAnalyzing(true)
    try {
      const res = await axios.post(`${API_BASE}/analysis/run`, { session_ids: null })
      setReport(res.data.analysis)
      await loadData()
    } catch (err) {
      alert('Analysis failed: ' + (err.response?.data?.detail || 'Unknown error'))
    } finally {
      setAnalyzing(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <div className="flex flex-col items-center gap-4">
        <Loader2 size={32} style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
        <p style={{ color: 'var(--text-muted)' }}>Loading dashboard...</p>
      </div>
    </div>
  )

  const sentimentData = stats ? [
    { name: 'Positive', value: stats.sentiment_breakdown.positive, pct: stats.sentiment_breakdown.positive_pct },
    { name: 'Neutral', value: stats.sentiment_breakdown.neutral, pct: stats.sentiment_breakdown.neutral_pct },
    { name: 'Negative', value: stats.sentiment_breakdown.negative, pct: stats.sentiment_breakdown.negative_pct },
  ] : []

  const pieData = sentimentData.filter(d => d.value > 0)
  const sentimentScore = stats ? Math.round((stats.avg_sentiment + 1) * 50) : 0

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #7c6dfa, #fa6d9a)' }}>
              <BarChart3 size={16} color="white" />
            </div>
            <div>
              <h1 className="font-display font-bold text-lg leading-none" style={{ fontFamily: 'Syne' }}>Analytics Dashboard</h1>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>AI Voice Feedback Analyzer</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={loadData} className="p-2 rounded-lg transition-all hover:scale-105" style={{ border: '1px solid var(--border)' }}>
              <RefreshCw size={16} style={{ color: 'var(--text-muted)' }} />
            </button>
            <button onClick={() => nav('/feedback')} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105"
              style={{ border: '1px solid var(--border)', color: 'var(--text)' }}>
              <Mic size={14} /> Collect Feedback
            </button>
            <button
              onClick={runAnalysis}
              disabled={analyzing || !stats?.total_responses}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:scale-105 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #7c6dfa, #9b8cff)' }}
            >
              {analyzing ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Activity size={14} />}
              {analyzing ? 'Analyzing...' : 'Run AI Analysis'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Sessions', value: stats?.total_sessions ?? 0, icon: Users, color: '#7c6dfa' },
            { label: 'Responses', value: stats?.total_responses ?? 0, icon: MessageSquare, color: '#fa6d9a' },
            { label: 'Sentiment Score', value: `${sentimentScore}/100`, icon: Activity, color: '#4ade80' },
            { label: 'Positive Rate', value: `${stats?.sentiment_breakdown?.positive_pct ?? 0}%`, icon: TrendingUp, color: '#facc15' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="p-5 rounded-2xl glass">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</p>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}22` }}>
                  <Icon size={16} style={{ color }} />
                </div>
              </div>
              <p className="text-3xl font-display font-bold" style={{ fontFamily: 'Syne' }}>{value}</p>
            </div>
          ))}
        </div>

        {/* No data state */}
        {!stats?.total_responses && (
          <div className="text-center py-24 rounded-2xl glass">
            <Mic size={48} className="mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
            <h2 className="font-display text-2xl font-semibold mb-2" style={{ fontFamily: 'Syne' }}>No feedback yet</h2>
            <p className="mb-6" style={{ color: 'var(--text-muted)' }}>Collect some voice responses to see analytics here.</p>
            <button onClick={() => nav('/feedback')} className="px-6 py-3 rounded-xl font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, #7c6dfa, #9b8cff)' }}>
              <Mic size={16} className="inline mr-2" /> Start Collecting Feedback
            </button>
          </div>
        )}

        {stats?.total_responses > 0 && (
          <>
            {/* Tab nav */}
            <div className="flex gap-2 mb-8 p-1 rounded-xl w-fit" style={{ background: 'var(--surface)' }}>
              {['overview', 'complaints', 'positives', 'suggestions', 'report'].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className="px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all"
                  style={{
                    background: activeTab === tab ? 'var(--surface-2)' : 'transparent',
                    color: activeTab === tab ? 'var(--text)' : 'var(--text-muted)',
                    border: activeTab === tab ? '1px solid var(--border)' : '1px solid transparent'
                  }}>
                  {tab}
                </button>
              ))}
            </div>

            {/* Overview tab */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Sentiment breakdown pie */}
                <div className="p-6 rounded-2xl glass">
                  <h3 className="font-display font-semibold mb-6" style={{ fontFamily: 'Syne' }}>Sentiment Distribution</h3>
                  {pieData.length > 0 ? (
                    <>
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                            {pieData.map((entry) => (
                              <Cell key={entry.name} fill={COLORS[entry.name.toLowerCase()]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(v, n) => [v, n]} contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8 }} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex justify-center gap-4 mt-2">
                        {sentimentData.map(({ name, value, pct }) => (
                          <div key={name} className="text-center">
                            <div className="w-3 h-3 rounded-full mx-auto mb-1" style={{ background: COLORS[name.toLowerCase()] }} />
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{name}</p>
                            <p className="font-semibold text-sm">{pct}%</p>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : <p style={{ color: 'var(--text-muted)' }}>No sentiment data yet.</p>}
                </div>

                {/* Sentiment bar chart */}
                <div className="p-6 rounded-2xl glass">
                  <h3 className="font-display font-semibold mb-6" style={{ fontFamily: 'Syne' }}>Response Counts</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={sentimentData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                      <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                      <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8 }} />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                        {sentimentData.map((entry) => (
                          <Cell key={entry.name} fill={COLORS[entry.name.toLowerCase()]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Timeline */}
                {timeline.length > 1 && (
                  <div className="p-6 rounded-2xl glass md:col-span-2">
                    <h3 className="font-display font-semibold mb-6" style={{ fontFamily: 'Syne' }}>Sentiment Over Time</h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={timeline}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis dataKey="timestamp" tickFormatter={v => new Date(v).toLocaleDateString()} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                        <YAxis domain={[-1, 1]} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                        <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8 }} />
                        <Line type="monotone" dataKey="score" stroke="#7c6dfa" strokeWidth={2} dot={{ fill: '#7c6dfa', r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Recent responses */}
                {stats.recent_responses?.length > 0 && (
                  <div className="p-6 rounded-2xl glass md:col-span-2">
                    <h3 className="font-display font-semibold mb-4" style={{ fontFamily: 'Syne' }}>Recent Responses</h3>
                    <div className="space-y-3">
                      {stats.recent_responses.map((r, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: 'var(--surface)' }}>
                          <span className="text-xs px-2 py-0.5 rounded-full mt-0.5 font-mono flex-shrink-0" style={{
                            background: r.sentiment === 'positive' ? 'rgba(74,222,128,0.15)' : r.sentiment === 'negative' ? 'rgba(248,113,113,0.15)' : 'rgba(148,163,184,0.15)',
                            color: COLORS[r.sentiment] || '#94a3b8'
                          }}>
                            {r.sentiment}
                          </span>
                          <p className="text-sm flex-1" style={{ color: 'var(--text-muted)' }}>{r.transcript}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Complaints tab */}
            {activeTab === 'complaints' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-6">
                  <AlertCircle style={{ color: '#f87171' }} />
                  <h2 className="font-display text-xl font-semibold" style={{ fontFamily: 'Syne' }}>Common Complaints</h2>
                </div>
                {!report?.common_complaints ? (
                  <EmptyAnalysis onRun={runAnalysis} analyzing={analyzing} />
                ) : report.common_complaints.map((c, i) => (
                  <div key={i} className="p-5 rounded-2xl glass">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <h3 className="font-semibold">{c.issue}</h3>
                      <FreqBadge freq={c.frequency} />
                    </div>
                    <p className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>{c.impact}</p>
                    {c.example_quote && (
                      <p className="text-sm italic pl-3" style={{ color: 'var(--text-muted)', borderLeft: '2px solid var(--border)' }}>
                        "{c.example_quote}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Positives tab */}
            {activeTab === 'positives' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-6">
                  <ThumbsUp style={{ color: '#4ade80' }} />
                  <h2 className="font-display text-xl font-semibold" style={{ fontFamily: 'Syne' }}>Positive Feedback</h2>
                </div>
                {!report?.positive_feedback ? (
                  <EmptyAnalysis onRun={runAnalysis} analyzing={analyzing} />
                ) : report.positive_feedback.map((p, i) => (
                  <div key={i} className="p-5 rounded-2xl glass" style={{ borderColor: 'rgba(74,222,128,0.2)' }}>
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <h3 className="font-semibold">{p.aspect}</h3>
                      <FreqBadge freq={p.frequency} color="positive" />
                    </div>
                    <p className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>{p.strength}</p>
                    {p.example_quote && (
                      <p className="text-sm italic pl-3" style={{ color: 'var(--text-muted)', borderLeft: '2px solid #4ade8044' }}>
                        "{p.example_quote}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Suggestions tab */}
            {activeTab === 'suggestions' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-6">
                  <Lightbulb style={{ color: '#facc15' }} />
                  <h2 className="font-display text-xl font-semibold" style={{ fontFamily: 'Syne' }}>Improvement Suggestions</h2>
                </div>
                {!report?.improvement_suggestions ? (
                  <EmptyAnalysis onRun={runAnalysis} analyzing={analyzing} />
                ) : report.improvement_suggestions.map((s, i) => (
                  <div key={i} className="p-5 rounded-2xl glass">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <h3 className="font-semibold">{s.suggestion}</h3>
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0" style={{
                        background: `${PRIORITY_COLORS[s.priority] || '#94a3b8'}22`,
                        color: PRIORITY_COLORS[s.priority] || '#94a3b8'
                      }}>{s.priority}</span>
                    </div>
                    <p className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>{s.rationale}</p>
                    {s.expected_impact && (
                      <p className="text-xs" style={{ color: 'var(--accent)' }}>→ {s.expected_impact}</p>
                    )}
                  </div>
                ))}

                {/* Action items */}
                {report?.action_items?.length > 0 && (
                  <>
                    <h2 className="font-display text-xl font-semibold mt-8 mb-4" style={{ fontFamily: 'Syne' }}>Action Items</h2>
                    {report.action_items.map((a, i) => (
                      <div key={i} className="p-4 rounded-xl flex items-start gap-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                          style={{ background: 'var(--accent)', color: 'white' }}>{i + 1}</div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{a.action}</p>
                          <div className="flex gap-3 mt-1">
                            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Owner: {a.owner}</span>
                            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Timeline: {a.timeline}</span>
                          </div>
                        </div>
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{
                          background: `${PRIORITY_COLORS[a.priority] || '#94a3b8'}22`,
                          color: PRIORITY_COLORS[a.priority] || '#94a3b8'
                        }}>{a.priority}</span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}

            {/* Report tab */}
            {activeTab === 'report' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <FileText style={{ color: 'var(--accent)' }} />
                  <h2 className="font-display text-xl font-semibold" style={{ fontFamily: 'Syne' }}>Executive Summary</h2>
                </div>

                {!report ? (
                  <EmptyAnalysis onRun={runAnalysis} analyzing={analyzing} />
                ) : (
                  <>
                    {/* Score cards */}
                    {(report.nps_estimate || report.overall_score) && (
                      <div className="grid grid-cols-2 gap-4">
                        {report.nps_estimate != null && (
                          <div className="p-5 rounded-2xl glass text-center">
                            <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>Estimated NPS</p>
                            <p className="text-5xl font-display font-bold" style={{ fontFamily: 'Syne', color: report.nps_estimate > 50 ? '#4ade80' : report.nps_estimate > 0 ? '#facc15' : '#f87171' }}>
                              {report.nps_estimate}
                            </p>
                          </div>
                        )}
                        {report.overall_score != null && (
                          <div className="p-5 rounded-2xl glass text-center">
                            <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>Overall Score</p>
                            <p className="text-5xl font-display font-bold" style={{ fontFamily: 'Syne', color: '#7c6dfa' }}>
                              {report.overall_score}<span className="text-xl">/10</span>
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Summary text */}
                    {report.executive_summary && (
                      <div className="p-6 rounded-2xl glass">
                        <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: 'var(--text-muted)', lineHeight: 1.8 }}>
                          {report.executive_summary}
                        </p>
                      </div>
                    )}

                    {/* Themes */}
                    {report.key_themes?.length > 0 && (
                      <div className="p-6 rounded-2xl glass">
                        <h3 className="font-display font-semibold mb-4" style={{ fontFamily: 'Syne' }}>Key Themes</h3>
                        <div className="flex flex-wrap gap-3">
                          {report.key_themes.map((t, i) => (
                            <span key={i} className="px-3 py-1.5 rounded-full text-sm flex items-center gap-2" style={{
                              background: 'var(--surface)',
                              border: '1px solid var(--border)'
                            }}>
                              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COLORS[t.sentiment] || '#94a3b8' }} />
                              {t.theme} <span style={{ color: 'var(--text-muted)' }}>×{t.occurrences}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Sentiment breakdown */}
                    {report.sentiment_breakdown && (
                      <div className="p-6 rounded-2xl glass">
                        <h3 className="font-display font-semibold mb-4" style={{ fontFamily: 'Syne' }}>Sentiment Breakdown</h3>
                        <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>
                          {report.sentiment_breakdown.overall_mood} · {report.sentiment_breakdown.trend}
                        </p>
                        <div className="flex gap-2 h-4 rounded-full overflow-hidden">
                          <div style={{ width: `${report.sentiment_breakdown.positive_percentage}%`, background: '#4ade80' }} />
                          <div style={{ width: `${report.sentiment_breakdown.neutral_percentage}%`, background: '#94a3b8' }} />
                          <div style={{ width: `${report.sentiment_breakdown.negative_percentage}%`, background: '#f87171' }} />
                        </div>
                        <div className="flex gap-4 mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                          <span>+{report.sentiment_breakdown.positive_percentage}% positive</span>
                          <span>{report.sentiment_breakdown.neutral_percentage}% neutral</span>
                          <span>-{report.sentiment_breakdown.negative_percentage}% negative</span>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}

function FreqBadge({ freq, color = 'default' }) {
  const colors = {
    high: 'rgba(248,113,113,0.15)',
    medium: 'rgba(250,204,21,0.15)',
    low: 'rgba(148,163,184,0.15)',
  }
  const textColors = { high: '#f87171', medium: '#facc15', low: '#94a3b8' }
  if (color === 'positive') return (
    <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: 'rgba(74,222,128,0.15)', color: '#4ade80' }}>{freq}</span>
  )
  return (
    <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: colors[freq] || colors.low, color: textColors[freq] || '#94a3b8' }}>
      {freq}
    </span>
  )
}

function EmptyAnalysis({ onRun, analyzing }) {
  return (
    <div className="text-center py-16 rounded-2xl glass">
      <Activity size={40} className="mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
      <h3 className="font-display text-xl font-semibold mb-2" style={{ fontFamily: 'Syne' }}>No analysis yet</h3>
      <p className="mb-6" style={{ color: 'var(--text-muted)' }}>Run AI analysis to see insights from collected feedback.</p>
      <button onClick={onRun} disabled={analyzing}
        className="px-6 py-3 rounded-xl font-semibold text-white flex items-center gap-2 mx-auto transition-all hover:scale-105 disabled:opacity-50"
        style={{ background: 'linear-gradient(135deg, #7c6dfa, #9b8cff)' }}>
        {analyzing ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Activity size={16} />}
        {analyzing ? 'Analyzing...' : 'Run AI Analysis'}
      </button>
    </div>
  )
}
