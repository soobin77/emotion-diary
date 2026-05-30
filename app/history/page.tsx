'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { DiaryEntry, Mood } from '../types'

const MOOD_LABEL: Record<Mood, string> = {
  positive: '좋음',
  neutral: '보통',
  negative: '힘듦',
}

const MOOD_DOT: Record<Mood, string> = {
  positive: 'bg-amber-400',
  neutral: 'bg-stone-300',
  negative: 'bg-blue-400',
}

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

function getEmotionColor(emotion: string): string {
  return EMOTION_COLORS[emotion] ?? 'bg-stone-100 text-stone-600'
}

function formatDate(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  })
}

function getTopEmotions(entries: DiaryEntry[]): { emotion: string; count: number }[] {
  const counts: Record<string, number> = {}
  entries.forEach((e) => e.emotions.forEach((em) => { counts[em] = (counts[em] ?? 0) + 1 }))
  return Object.entries(counts)
    .map(([emotion, count]) => ({ emotion, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)
}

export default function HistoryPage() {
  const [entries, setEntries] = useState<DiaryEntry[]>([])

  useEffect(() => {
    const stored: DiaryEntry[] = JSON.parse(localStorage.getItem('diary_entries') || '[]')
    setEntries(stored.sort((a, b) => b.createdAt - a.createdAt))
  }, [])

  const topEmotions = getTopEmotions(entries)
  const maxCount = topEmotions[0]?.count ?? 1

  const moodCounts = {
    positive: entries.filter((e) => e.mood === 'positive').length,
    neutral: entries.filter((e) => e.mood === 'neutral').length,
    negative: entries.filter((e) => e.mood === 'negative').length,
  }

  return (
    <main className="min-h-screen bg-stone-50 px-4 py-10">
      <div className="mx-auto max-w-xl">

        {/* 헤더 */}
        <header className="mb-8 flex items-center gap-4">
          <Link href="/" className="text-stone-400 hover:text-stone-700 transition-colors text-sm">
            ← 오늘 일기
          </Link>
          <h1 className="text-xl font-semibold text-stone-800">지난 일기</h1>
        </header>

        {entries.length === 0 ? (
          <div className="text-center py-20 text-stone-300">
            <p className="text-4xl mb-4">📖</p>
            <p className="text-sm">아직 기록된 일기가 없어요.</p>
            <Link href="/" className="mt-4 inline-block text-sm text-stone-500 hover:underline">
              첫 일기 쓰러 가기 →
            </Link>
          </div>
        ) : (
          <>
            {/* 감정 통계 */}
            <section className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6 mb-6">
              <h2 className="text-sm font-medium text-stone-500 mb-5">나의 감정 패턴</h2>

              {/* 기분 분포 */}
              <div className="flex gap-3 mb-6">
                {(['positive', 'neutral', 'negative'] as Mood[]).map((m) => (
                  <div key={m} className="flex-1 text-center">
                    <div className={`w-2 h-2 rounded-full mx-auto mb-1.5 ${MOOD_DOT[m]}`} />
                    <p className="text-lg font-semibold text-stone-700">{moodCounts[m]}</p>
                    <p className="text-xs text-stone-400">{MOOD_LABEL[m]}</p>
                  </div>
                ))}
              </div>

              {/* 자주 나온 감정 */}
              {topEmotions.length > 0 && (
                <div>
                  <p className="text-xs text-stone-400 mb-3">자주 느낀 감정</p>
                  <div className="space-y-2">
                    {topEmotions.map(({ emotion, count }) => (
                      <div key={emotion} className="flex items-center gap-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full w-16 text-center ${getEmotionColor(emotion)}`}>
                          {emotion}
                        </span>
                        <div className="flex-1 bg-stone-100 rounded-full h-1.5">
                          <div
                            className="h-1.5 rounded-full bg-stone-400 transition-all duration-500"
                            style={{ width: `${(count / maxCount) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-stone-400 w-6 text-right">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* 일기 목록 */}
            <section className="space-y-3">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-stone-500">{formatDate(entry.date)}</span>
                    <div className="flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${MOOD_DOT[entry.mood]}`} />
                      <span className="text-xs text-stone-400">{MOOD_LABEL[entry.mood]}</span>
                    </div>
                  </div>
                  <p className="text-sm text-stone-500 leading-relaxed line-clamp-2 mb-3">
                    {entry.content}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {entry.emotions.map((em) => (
                      <span
                        key={em}
                        className={`text-xs px-2.5 py-0.5 rounded-full ${getEmotionColor(em)}`}
                      >
                        {em}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </section>
          </>
        )}
      </div>
    </main>
  )
}
