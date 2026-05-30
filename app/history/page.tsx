'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { DiaryEntry, Mood } from '../types'

const MOOD_CONFIG: Record<Mood, { label: string; emoji: string; dot: string }> = {
  happy:   { label: '행복해요',    emoji: '😊', dot: 'bg-amber-400' },
  excited: { label: '설레요',     emoji: '✨', dot: 'bg-pink-400' },
  calm:    { label: '평온해요',    emoji: '🌿', dot: 'bg-emerald-400' },
  neutral: { label: '그냥 그래요', emoji: '☁️', dot: 'bg-stone-300' },
  tired:   { label: '피곤해요',    emoji: '😮‍💨', dot: 'bg-slate-400' },
  anxious: { label: '불안해요',    emoji: '🌀', dot: 'bg-purple-400' },
  sad:     { label: '슬퍼요',     emoji: '🌧', dot: 'bg-blue-400' },
  angry:   { label: '화나요',     emoji: '🔥', dot: 'bg-red-400' },
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
  return new Date(y, m - 1, d).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })
}

function getTopEmotions(entries: DiaryEntry[]): { emotion: string; count: number }[] {
  const counts: Record<string, number> = {}
  entries.forEach((e) => e.emotions.forEach((em) => { counts[em] = (counts[em] ?? 0) + 1 }))
  return Object.entries(counts)
    .map(([emotion, count]) => ({ emotion, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)
}

const ALL_MOODS = Object.keys(MOOD_CONFIG) as Mood[]

export default function HistoryPage() {
  const [entries, setEntries] = useState<DiaryEntry[]>([])

  useEffect(() => {
    const stored: DiaryEntry[] = JSON.parse(localStorage.getItem('diary_entries') || '[]')
    setEntries(stored.sort((a, b) => b.createdAt - a.createdAt))
  }, [])

  const topEmotions = getTopEmotions(entries)
  const maxCount = topEmotions[0]?.count ?? 1

  const moodCounts = ALL_MOODS.reduce<Record<Mood, number>>((acc, m) => {
    acc[m] = entries.filter((e) => e.mood === m).length
    return acc
  }, {} as Record<Mood, number>)

  const maxMoodCount = Math.max(...Object.values(moodCounts), 1)

  return (
    <main className="min-h-screen bg-stone-100 px-4 py-8">
      <div className="mx-auto max-w-lg space-y-4">

        {/* 헤더 */}
        <header className="flex items-center gap-3 px-1">
          <Link href="/" className="text-stone-400 hover:text-stone-600 transition-colors text-sm">←</Link>
          <h1 className="text-xl font-bold text-stone-800">지난 기록</h1>
        </header>

        {entries.length === 0 ? (
          <div className="bg-white rounded-2xl p-16 text-center shadow-sm border border-stone-100">
            <p className="text-4xl mb-3">📖</p>
            <p className="text-sm text-stone-400">아직 기록된 일기가 없어요.</p>
            <Link href="/" className="mt-4 inline-block text-sm text-stone-600 underline">
              첫 일기 쓰러 가기 →
            </Link>
          </div>
        ) : (
          <>
            {/* 감정 상태 분포 */}
            <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
              <p className="text-xs text-stone-400 mb-4">감정 상태 분포</p>
              <div className="grid grid-cols-4 gap-2">
                {ALL_MOODS.map((m) => (
                  <div key={m} className="text-center">
                    <p className="text-xl mb-1">{MOOD_CONFIG[m].emoji}</p>
                    <div className="h-12 bg-stone-100 rounded-lg flex items-end overflow-hidden mx-auto w-8">
                      <div
                        className={`w-full rounded-lg transition-all duration-500 ${MOOD_CONFIG[m].dot}`}
                        style={{ height: `${(moodCounts[m] / maxMoodCount) * 100}%`, minHeight: moodCounts[m] > 0 ? '4px' : '0' }}
                      />
                    </div>
                    <p className="text-xs font-medium text-stone-700 mt-1">{moodCounts[m]}</p>
                    <p className="text-[10px] text-stone-400 leading-tight">{MOOD_CONFIG[m].label.replace('해요', '')}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 자주 느낀 감정 */}
            {topEmotions.length > 0 && (
              <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
                <p className="text-xs text-stone-400 mb-4">자주 느낀 감정</p>
                <div className="space-y-2.5">
                  {topEmotions.map(({ emotion, count }) => (
                    <div key={emotion} className="flex items-center gap-3">
                      <span className={`text-xs px-2.5 py-0.5 rounded-full w-16 text-center shrink-0 ${getEmotionColor(emotion)}`}>
                        {emotion}
                      </span>
                      <div className="flex-1 bg-stone-100 rounded-full h-1.5">
                        <div
                          className="h-1.5 rounded-full bg-stone-400 transition-all duration-500"
                          style={{ width: `${(count / maxCount) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-stone-400 w-4 text-right">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 일기 목록 */}
            <div className="space-y-3">
              {entries.map((entry) => {
                const m = MOOD_CONFIG[entry.mood] ?? MOOD_CONFIG.neutral
                return (
                  <div key={entry.id} className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-stone-500">{formatDate(entry.date)}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">{m.emoji}</span>
                        <span className="text-xs text-stone-400">{m.label}</span>
                      </div>
                    </div>
                    <p className="text-sm text-stone-500 leading-relaxed line-clamp-2 mb-3">{entry.content}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {entry.emotions.map((em) => (
                        <span key={em} className={`text-xs px-2.5 py-0.5 rounded-full ${getEmotionColor(em)}`}>
                          {em}
                        </span>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </main>
  )
}
