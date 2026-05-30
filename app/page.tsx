'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { DiaryEntry, Mood } from './types'

const EMOTION_COLORS: Record<string, string> = {
  기쁨: 'bg-amber-100 text-amber-700',
  행복: 'bg-amber-100 text-amber-700',
  설렘: 'bg-pink-100 text-pink-700',
  기대감: 'bg-pink-100 text-pink-700',
  평온: 'bg-emerald-100 text-emerald-700',
  감사함: 'bg-emerald-100 text-emerald-700',
  뿌듯함: 'bg-teal-100 text-teal-700',
  슬픔: 'bg-blue-100 text-blue-700',
  외로움: 'bg-blue-100 text-blue-700',
  그리움: 'bg-indigo-100 text-indigo-700',
  불안: 'bg-purple-100 text-purple-700',
  걱정: 'bg-purple-100 text-purple-700',
  답답함: 'bg-orange-100 text-orange-700',
  피로: 'bg-stone-200 text-stone-600',
  분노: 'bg-red-100 text-red-700',
  후회: 'bg-slate-100 text-slate-600',
}

const MOOD_BG: Record<Mood, string> = {
  positive: 'from-amber-50 to-orange-50 border-amber-100',
  neutral: 'from-stone-50 to-slate-50 border-stone-100',
  negative: 'from-blue-50 to-indigo-50 border-blue-100',
}

const MOOD_ICON: Record<Mood, string> = {
  positive: '🌤',
  neutral: '🌥',
  negative: '🌧',
}

function getEmotionColor(emotion: string): string {
  return EMOTION_COLORS[emotion] ?? 'bg-stone-100 text-stone-600'
}

function getTodayString(): string {
  return new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  })
}

function getDateKey(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function Home() {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ emotions: string[]; mood: Mood; comfort: string } | null>(null)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const today = getDateKey()
    const entries: DiaryEntry[] = JSON.parse(localStorage.getItem('diary_entries') || '[]')
    const todayEntry = entries.find((e) => e.date === today)
    if (todayEntry) {
      setContent(todayEntry.content)
      setResult({ emotions: todayEntry.emotions, mood: todayEntry.mood, comfort: todayEntry.comfort })
      setSaved(true)
    }
  }, [])

  async function handleAnalyze() {
    if (!content.trim() || loading) return
    setLoading(true)
    setError('')
    setResult(null)
    setSaved(false)

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setResult(data)

      const entry: DiaryEntry = {
        id: crypto.randomUUID(),
        date: getDateKey(),
        content,
        emotions: data.emotions,
        mood: data.mood,
        comfort: data.comfort,
        createdAt: Date.now(),
      }
      const entries: DiaryEntry[] = JSON.parse(localStorage.getItem('diary_entries') || '[]')
      const filtered = entries.filter((e) => e.date !== entry.date)
      localStorage.setItem('diary_entries', JSON.stringify([entry, ...filtered]))
      setSaved(true)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '오류가 발생했어요. 잠시 후 다시 시도해주세요.')
    } finally {
      setLoading(false)
    }
  }

  const charCount = content.length

  return (
    <main className="min-h-screen bg-stone-50 px-4 py-10">
      <div className="mx-auto max-w-xl">

        {/* 헤더 */}
        <header className="mb-10 flex items-start justify-between">
          <div>
            <p className="text-sm text-stone-400 mb-1">{getTodayString()}</p>
            <h1 className="text-2xl font-semibold text-stone-800 tracking-tight">오늘의 감정 일기</h1>
          </div>
          <Link
            href="/history"
            className="mt-1 text-sm text-stone-400 hover:text-stone-700 transition-colors underline-offset-2 hover:underline"
          >
            지난 일기 →
          </Link>
        </header>

        {/* 입력 영역 */}
        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-6 mb-4">
          <textarea
            className="w-full resize-none text-stone-700 text-[15px] leading-relaxed placeholder:text-stone-300 outline-none min-h-[220px]"
            placeholder="오늘 어떤 하루였나요? 자유롭게 적어보세요."
            value={content}
            onChange={(e) => {
              setContent(e.target.value)
              if (result) { setResult(null); setSaved(false) }
            }}
            maxLength={2000}
          />
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-stone-50">
            <span className="text-xs text-stone-300">{charCount} / 2000</span>
            {saved && <span className="text-xs text-emerald-500">✓ 저장됨</span>}
          </div>
        </div>

        {/* 분석 버튼 */}
        <button
          onClick={handleAnalyze}
          disabled={!content.trim() || loading}
          className="w-full py-3.5 rounded-xl bg-stone-800 text-white text-sm font-medium tracking-wide
            hover:bg-stone-700 active:scale-[0.98] transition-all duration-150
            disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="pulse-soft inline-block">감정 분석 중...</span>
          ) : (
            'AI로 감정 분석하기'
          )}
        </button>

        {/* 에러 */}
        {error && (
          <p className="mt-4 text-sm text-red-500 text-center">{error}</p>
        )}

        {/* 결과 카드 */}
        {result && (
          <div className={`mt-6 fade-in rounded-2xl border bg-gradient-to-br p-6 ${MOOD_BG[result.mood]}`}>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">{MOOD_ICON[result.mood]}</span>
              <span className="text-sm font-medium text-stone-600">오늘의 감정</span>
            </div>
            <div className="flex flex-wrap gap-2 mb-5">
              {result.emotions.map((e) => (
                <span
                  key={e}
                  className={`px-3 py-1 rounded-full text-sm font-medium ${getEmotionColor(e)}`}
                >
                  {e}
                </span>
              ))}
            </div>
            <p className="text-[15px] text-stone-600 leading-relaxed border-t border-white/60 pt-4">
              {result.comfort}
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
