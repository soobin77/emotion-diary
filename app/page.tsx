'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  AnalysisResult,
  formatDate,
  getDateKey,
  getEmotionColor,
  getStreak,
  getWeeklyEntries,
  MOOD_CONFIG,
  readEntries,
  saveEntry,
} from './diary'
import { DiaryEntry } from './types'

type Phase = 'write' | 'loading' | 'result'

export default function Home() {
  const [entries, setEntries] = useState<DiaryEntry[]>([])
  const [content, setContent] = useState('')
  const [phase, setPhase] = useState<Phase>('write')
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    queueMicrotask(() => {
      const stored = readEntries()
      const today = stored.find((entry) => entry.date === getDateKey())

      setEntries(stored)
      if (today) {
        setContent(today.content)
        setResult({
          emotions: today.emotions,
          mood: today.mood,
          comfort: today.comfort,
          insight: today.insight,
        })
        setPhase('result')
      }
    })
  }, [])

  const streak = getStreak(entries)
  const weeklyEntries = getWeeklyEntries(entries)
  const mood = result ? MOOD_CONFIG[result.mood] : null

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
      if (!res.ok || data.error) throw new Error(data.error ?? '분석에 실패했어요.')

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

      const updated = saveEntry(entry)
      setEntries(updated)
      setResult(data)
      setPhase('result')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '오류가 발생했어요. 잠시 후 다시 시도해주세요.')
      setPhase('write')
    }
  }

  return (
    <main className="min-h-screen bg-stone-100 px-4 py-8">
      <div className="mx-auto max-w-lg space-y-4">
        <header className="flex items-center justify-between px-1">
          <div>
            <p className="text-xs text-stone-400">
              {formatDate(getDateKey(), { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
            </p>
            <h1 className="text-xl font-bold text-stone-800 tracking-tight">오늘의 감정 일기</h1>
          </div>
          <Link href="/history" className="text-xs text-stone-400 hover:text-stone-600 transition-colors">
            지난 기록 →
          </Link>
        </header>

        <section className="grid grid-cols-2 gap-3">
          <Stat label="연속 기록" value={streak} unit="일" caption="🔥 streak" />
          <Stat label="총 일기" value={entries.length} unit="개" caption="📖 total" />
        </section>

        <section className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-stone-400">최근 7일 감정 흐름</p>
            <p className="text-[11px] text-stone-300">{weeklyEntries.filter(({ entry }) => entry).length}/7</p>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {weeklyEntries.map(({ date, entry }) => {
              const config = entry ? MOOD_CONFIG[entry.mood] : null
              return (
                <div key={date} className="text-center">
                  <div className="h-10 rounded-xl bg-stone-100 flex items-center justify-center text-lg">
                    {config?.emoji ?? '·'}
                  </div>
                  <p className="mt-1 text-[10px] text-stone-400">{formatDate(date, { weekday: 'short' }).replace('요일', '')}</p>
                </div>
              )
            })}
          </div>
        </section>

        {phase === 'loading' && (
          <section className="bg-white rounded-2xl border border-stone-100 shadow-sm p-10 text-center fade-in">
            <p className="text-4xl mb-3 pulse-soft">✨</p>
            <p className="text-sm text-stone-500">감정을 읽고 있어요...</p>
            <p className="text-xs text-stone-300 mt-1">잠깐만 기다려 주세요</p>
          </section>
        )}

        {phase === 'result' && result && mood && (
          <>
            <section className={`fade-in rounded-2xl bg-gradient-to-br ${mood.bg} border border-white/80 shadow-sm p-5`}>
              <p className="text-xs text-stone-400">오늘의 감정 상태</p>
              <p className="text-2xl font-bold text-stone-700 mt-0.5">{mood.emoji} {mood.label}</p>

              <div className="my-5">
                <div className="flex justify-between text-xs text-stone-400 mb-1.5">
                  <span>😞 힘듦</span>
                  <span>😊 좋음</span>
                </div>
                <div className="h-2.5 bg-white/70 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-700 ${mood.bar}`} style={{ width: `${mood.score}%` }} />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {result.emotions.map((emotion) => (
                  <span key={emotion} className={`px-3 py-1 rounded-full text-sm font-medium border ${getEmotionColor(emotion)}`}>
                    {emotion}
                  </span>
                ))}
              </div>
            </section>

            <Message title="💬 오늘의 위로" body={result.comfort} />
            <Message title="🔍 AI 감정 인사이트" body={result.insight} />

            <button
              onClick={() => { setPhase('write'); setResult(null) }}
              className="w-full py-3 rounded-2xl border border-stone-200 text-sm text-stone-500 hover:bg-stone-50 active:scale-[0.98] transition-all"
            >
              다시 쓰기
            </button>
          </>
        )}

        {phase === 'write' && (
          <>
            <section className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
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
            </section>

            {error && <p className="text-sm text-red-400 text-center">{error}</p>}

            <button
              onClick={handleAnalyze}
              disabled={!content.trim()}
              className="w-full py-4 rounded-2xl bg-stone-800 text-white text-sm font-semibold tracking-wide hover:bg-stone-700 active:scale-[0.98] transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
            >
              AI로 감정 분석하기
            </button>
          </>
        )}
      </div>
    </main>
  )
}

function Stat({ label, value, unit, caption }: { label: string; value: number; unit: string; caption: string }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
      <p className="text-xs text-stone-400 mb-1">{label}</p>
      <p className="text-3xl font-bold text-stone-800">{value}<span className="text-base font-normal text-stone-400 ml-0.5">{unit}</span></p>
      <p className="text-xs text-stone-300 mt-1">{caption}</p>
    </div>
  )
}

function Message({ title, body }: { title: string; body: string }) {
  return (
    <section className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
      <p className="text-xs text-stone-400 mb-2">{title}</p>
      <p className="text-[15px] text-stone-600 leading-relaxed">{body}</p>
    </section>
  )
}
