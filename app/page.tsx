'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { DiaryEntry, Mood } from './types'

const EMOTION_COLORS: Record<string, string> = {
  기쁨: 'bg-amber-100 text-amber-700 border-amber-200',
  행복: 'bg-amber-100 text-amber-700 border-amber-200',
  설렘: 'bg-pink-100 text-pink-700 border-pink-200',
  기대감: 'bg-pink-100 text-pink-700 border-pink-200',
  평온: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  감사함: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  뿌듯함: 'bg-teal-100 text-teal-700 border-teal-200',
  슬픔: 'bg-blue-100 text-blue-700 border-blue-200',
  외로움: 'bg-blue-100 text-blue-700 border-blue-200',
  그리움: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  불안: 'bg-purple-100 text-purple-700 border-purple-200',
  걱정: 'bg-purple-100 text-purple-700 border-purple-200',
  답답함: 'bg-orange-100 text-orange-700 border-orange-200',
  피로: 'bg-stone-200 text-stone-600 border-stone-300',
  분노: 'bg-red-100 text-red-700 border-red-200',
  후회: 'bg-slate-100 text-slate-600 border-slate-200',
}

const MOOD_CONFIG: Record<Mood, {
  label: string; emoji: string; bg: string; bar: string; score: number; barColor: string
}> = {
  happy:   { label: '행복해요',    emoji: '😊', bg: 'from-amber-50 to-yellow-50',   bar: 'bg-amber-400',   barColor: '#fbbf24', score: 95 },
  excited: { label: '설레요',     emoji: '✨', bg: 'from-pink-50 to-rose-50',      bar: 'bg-pink-400',    barColor: '#f472b6', score: 80 },
  calm:    { label: '평온해요',    emoji: '🌿', bg: 'from-emerald-50 to-teal-50',   bar: 'bg-emerald-400', barColor: '#34d399', score: 65 },
  neutral: { label: '그냥 그래요', emoji: '☁️', bg: 'from-stone-50 to-slate-50',    bar: 'bg-stone-400',   barColor: '#a8a29e', score: 50 },
  tired:   { label: '피곤해요',    emoji: '😮‍💨', bg: 'from-slate-50 to-zinc-100',   bar: 'bg-slate-400',   barColor: '#94a3b8', score: 35 },
  anxious: { label: '불안해요',    emoji: '🌀', bg: 'from-purple-50 to-violet-50',  bar: 'bg-purple-400',  barColor: '#c084fc', score: 25 },
  sad:     { label: '슬퍼요',     emoji: '🌧', bg: 'from-blue-50 to-indigo-50',    bar: 'bg-blue-400',    barColor: '#60a5fa', score: 15 },
  angry:   { label: '화나요',     emoji: '🔥', bg: 'from-red-50 to-orange-50',     bar: 'bg-red-400',     barColor: '#f87171', score: 10 },
}

function getEmotionColor(e: string) {
  return EMOTION_COLORS[e] ?? 'bg-stone-100 text-stone-600 border-stone-200'
}

function getTodayLabel() {
  return new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })
}

function getDateKey() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getStreak(entries: DiaryEntry[]): number {
  if (!entries.length) return 0
  const dates = [...new Set(entries.map((e) => e.date))].sort().reverse()
  let streak = 0
  const cursor = new Date(getDateKey())
  for (const d of dates) {
    const key = cursor.toISOString().slice(0, 10)
    if (d === key) { streak++; cursor.setDate(cursor.getDate() - 1) }
    else break
  }
  return streak
}

type Phase = 'write' | 'loading' | 'result'

interface AnalysisResult {
  emotions: string[]
  mood: Mood
  comfort: string
  insight: string
}

export default function Home() {
  const [content, setContent] = useState('')
  const [phase, setPhase] = useState<Phase>('write')
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState('')
  const [streak, setStreak] = useState(0)
  const [totalCount, setTotalCount] = useState(0)

  useEffect(() => {
    const entries: DiaryEntry[] = JSON.parse(localStorage.getItem('diary_entries') || '[]')
    setStreak(getStreak(entries))
    setTotalCount(entries.length)
    const today = entries.find((e) => e.date === getDateKey())
    if (today) {
      setContent(today.content)
      setResult({ emotions: today.emotions, mood: today.mood, comfort: today.comfort, insight: today.insight ?? '' })
      setPhase('result')
    }
  }, [])

  async function handleAnalyze() {
    if (!content.trim() || phase === 'loading') return
    setPhase('loading')
    setError('')
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setResult(data)
      setPhase('result')

      const entry: DiaryEntry = {
        id: crypto.randomUUID(),
        date: getDateKey(),
        content,
        emotions: data.emotions,
        mood: data.mood,
        comfort: data.comfort,
        insight: data.insight,
        createdAt: Date.now(),
      }
      const entries: DiaryEntry[] = JSON.parse(localStorage.getItem('diary_entries') || '[]')
      const filtered = entries.filter((e) => e.date !== entry.date)
      const updated = [entry, ...filtered]
      localStorage.setItem('diary_entries', JSON.stringify(updated))
      setStreak(getStreak(updated))
      setTotalCount(updated.length)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '오류가 발생했어요. 잠시 후 다시 시도해주세요.')
      setPhase('write')
    }
  }

  const mood = result ? MOOD_CONFIG[result.mood] : null

  return (
    <main className="min-h-screen bg-stone-100 px-4 py-8">
      <div className="mx-auto max-w-lg space-y-4">

        {/* 헤더 */}
        <header className="flex items-center justify-between px-1">
          <div>
            <p className="text-xs text-stone-400">{getTodayLabel()}</p>
            <h1 className="text-xl font-bold text-stone-800 tracking-tight">오늘의 감정 일기</h1>
          </div>
          <Link href="/history" className="text-xs text-stone-400 hover:text-stone-600 transition-colors">
            지난 기록 →
          </Link>
        </header>

        {/* 스탯 카드 */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
            <p className="text-xs text-stone-400 mb-1">연속 기록</p>
            <p className="text-3xl font-bold text-stone-800">{streak}<span className="text-base font-normal text-stone-400 ml-0.5">일</span></p>
            <p className="text-xs text-stone-300 mt-1">🔥 streak</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
            <p className="text-xs text-stone-400 mb-1">총 일기</p>
            <p className="text-3xl font-bold text-stone-800">{totalCount}<span className="text-base font-normal text-stone-400 ml-0.5">개</span></p>
            <p className="text-xs text-stone-300 mt-1">📖 total</p>
          </div>
        </div>

        {/* 로딩 */}
        {phase === 'loading' && (
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-10 text-center fade-in">
            <p className="text-4xl mb-3 pulse-soft">✨</p>
            <p className="text-sm text-stone-500">감정을 읽고 있어요...</p>
            <p className="text-xs text-stone-300 mt-1">잠깐만 기다려 주세요</p>
          </div>
        )}

        {/* 결과 대시보드 */}
        {phase === 'result' && result && mood && (
          <>
            {/* 무드 카드 */}
            <div className={`fade-in rounded-2xl bg-gradient-to-br ${mood.bg} border border-white/80 shadow-sm p-5`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs text-stone-400">오늘의 감정 상태</p>
                  <p className="text-2xl font-bold text-stone-700 mt-0.5">{mood.emoji} {mood.label}</p>
                </div>
              </div>

              {/* 무드 미터 */}
              <div className="mb-5">
                <div className="flex justify-between text-xs text-stone-400 mb-1.5">
                  <span>😞 힘듦</span>
                  <span>😊 좋음</span>
                </div>
                <div className="h-2.5 bg-white/70 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${mood.bar}`}
                    style={{ width: `${mood.score}%` }}
                  />
                </div>
              </div>

              {/* 감정 태그 */}
              <div className="flex flex-wrap gap-2">
                {result.emotions.map((e) => (
                  <span key={e} className={`px-3 py-1 rounded-full text-sm font-medium border ${getEmotionColor(e)}`}>
                    {e}
                  </span>
                ))}
              </div>
            </div>

            {/* 위로 메시지 */}
            <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
              <p className="text-xs text-stone-400 mb-2">💬 오늘의 위로</p>
              <p className="text-[15px] text-stone-600 leading-relaxed">{result.comfort}</p>
            </div>

            {/* AI 인사이트 */}
            <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
              <p className="text-xs text-stone-400 mb-2">🔍 AI 감정 인사이트</p>
              <p className="text-[15px] text-stone-600 leading-relaxed">{result.insight}</p>
            </div>

            <button
              onClick={() => { setPhase('write'); setResult(null) }}
              className="w-full py-3 rounded-2xl border border-stone-200 text-sm text-stone-500
                hover:bg-stone-50 active:scale-[0.98] transition-all"
            >
              다시 쓰기
            </button>
          </>
        )}

        {/* 입력 영역 */}
        {phase === 'write' && (
          <>
            <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
              <textarea
                className="w-full resize-none text-stone-700 text-[15px] leading-relaxed placeholder:text-stone-300 outline-none min-h-[200px]"
                placeholder="오늘 어떤 하루였나요? 자유롭게 적어보세요."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                maxLength={2000}
              />
              <div className="flex justify-end pt-3 border-t border-stone-50 mt-2">
                <span className="text-xs text-stone-300">{content.length} / 2000</span>
              </div>
            </div>

            {error && <p className="text-sm text-red-400 text-center">{error}</p>}

            <button
              onClick={handleAnalyze}
              disabled={!content.trim()}
              className="w-full py-4 rounded-2xl bg-stone-800 text-white text-sm font-semibold tracking-wide
                hover:bg-stone-700 active:scale-[0.98] transition-all duration-150
                disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
            >
              AI로 감정 분석하기
            </button>
          </>
        )}
      </div>
    </main>
  )
}
