'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import {
  ALL_MOODS,
  formatDate,
  getEmotionColor,
  getStreak,
  getTopEmotions,
  MOOD_CONFIG,
  readEntries,
  STORAGE_KEY,
} from '../diary'
import { DiaryEntry, Mood } from '../types'

type MoodFilter = 'all' | Mood

export default function HistoryPage() {
  const [entries, setEntries] = useState<DiaryEntry[]>([])
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<MoodFilter>('all')

  useEffect(() => {
    queueMicrotask(() => {
      setEntries(readEntries().sort((a, b) => b.createdAt - a.createdAt))
    })
  }, [])

  const filteredEntries = useMemo(() => {
    const keyword = query.trim().toLowerCase()

    return entries.filter((entry) => {
      const matchesMood = filter === 'all' || entry.mood === filter
      const haystack = [entry.content, entry.comfort, entry.insight, ...entry.emotions].join(' ').toLowerCase()
      return matchesMood && (!keyword || haystack.includes(keyword))
    })
  }, [entries, filter, query])

  const topEmotions = getTopEmotions(entries)
  const maxEmotionCount = topEmotions[0]?.count ?? 1
  const moodCounts = ALL_MOODS.reduce<Record<Mood, number>>((acc, mood) => {
    acc[mood] = entries.filter((entry) => entry.mood === mood).length
    return acc
  }, {} as Record<Mood, number>)
  const maxMoodCount = Math.max(...Object.values(moodCounts), 1)

  function downloadEntries() {
    const blob = new Blob([JSON.stringify(entries, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${STORAGE_KEY}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <main className="min-h-screen bg-stone-100 px-4 py-8">
      <div className="mx-auto max-w-lg space-y-4">
        <header className="flex items-center gap-3 px-1">
          <Link href="/" className="text-stone-400 hover:text-stone-600 transition-colors text-sm">←</Link>
          <h1 className="text-xl font-bold text-stone-800">지난 기록</h1>
          {entries.length > 0 && (
            <button onClick={downloadEntries} className="ml-auto text-xs text-stone-400 hover:text-stone-600 transition-colors">
              내보내기
            </button>
          )}
        </header>

        {entries.length === 0 ? (
          <section className="bg-white rounded-2xl p-16 text-center shadow-sm border border-stone-100">
            <p className="text-4xl mb-3">📖</p>
            <p className="text-sm text-stone-400">아직 기록된 일기가 없어요.</p>
            <Link href="/" className="mt-4 inline-block text-sm text-stone-600 underline">
              첫 일기 쓰러 가기 →
            </Link>
          </section>
        ) : (
          <>
            <section className="grid grid-cols-3 gap-3">
              <Summary label="총 기록" value={`${entries.length}개`} />
              <Summary label="연속 기록" value={`${getStreak(entries)}일`} />
              <Summary label="필터 결과" value={`${filteredEntries.length}개`} />
            </section>

            <section className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
              <p className="text-xs text-stone-400 mb-4">감정 상태 분포</p>
              <div className="grid grid-cols-4 gap-2">
                {ALL_MOODS.map((mood) => (
                  <button
                    key={mood}
                    onClick={() => setFilter(filter === mood ? 'all' : mood)}
                    className={`rounded-xl p-2 text-center transition-colors ${filter === mood ? 'bg-stone-100' : 'hover:bg-stone-50'}`}
                  >
                    <p className="text-xl mb-1">{MOOD_CONFIG[mood].emoji}</p>
                    <div className="h-12 bg-stone-100 rounded-lg flex items-end overflow-hidden mx-auto w-8">
                      <div
                        className={`w-full rounded-lg transition-all duration-500 ${MOOD_CONFIG[mood].dot}`}
                        style={{ height: `${(moodCounts[mood] / maxMoodCount) * 100}%`, minHeight: moodCounts[mood] > 0 ? '4px' : '0' }}
                      />
                    </div>
                    <p className="text-xs font-medium text-stone-700 mt-1">{moodCounts[mood]}</p>
                    <p className="text-[10px] text-stone-400 leading-tight">{MOOD_CONFIG[mood].shortLabel}</p>
                  </button>
                ))}
              </div>
            </section>

            {topEmotions.length > 0 && (
              <section className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
                <p className="text-xs text-stone-400 mb-4">자주 느낀 감정</p>
                <div className="space-y-2.5">
                  {topEmotions.map(({ emotion, count }) => (
                    <div key={emotion} className="flex items-center gap-3">
                      <span className={`text-xs px-2.5 py-0.5 rounded-full w-16 text-center shrink-0 border ${getEmotionColor(emotion)}`}>
                        {emotion}
                      </span>
                      <div className="flex-1 bg-stone-100 rounded-full h-1.5">
                        <div className="h-1.5 rounded-full bg-stone-400 transition-all duration-500" style={{ width: `${(count / maxEmotionCount) * 100}%` }} />
                      </div>
                      <span className="text-xs text-stone-400 w-4 text-right">{count}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="bg-white rounded-2xl border border-stone-100 shadow-sm p-3">
              <input
                className="w-full rounded-xl bg-stone-50 px-3 py-2.5 text-sm text-stone-600 outline-none placeholder:text-stone-300"
                placeholder="기록, 감정, 인사이트 검색"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              {filter !== 'all' && (
                <button onClick={() => setFilter('all')} className="mt-2 text-xs text-stone-400 hover:text-stone-600">
                  {MOOD_CONFIG[filter].shortLabel} 필터 해제
                </button>
              )}
            </section>

            <section className="space-y-3">
              {filteredEntries.map((entry) => {
                const mood = MOOD_CONFIG[entry.mood] ?? MOOD_CONFIG.neutral
                return (
                  <article key={entry.id} className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-stone-500">{formatDate(entry.date)}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">{mood.emoji}</span>
                        <span className="text-xs text-stone-400">{mood.label}</span>
                      </div>
                    </div>
                    <p className="text-sm text-stone-500 leading-relaxed line-clamp-2 mb-3">{entry.content}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {entry.emotions.map((emotion) => (
                        <span key={emotion} className={`text-xs px-2.5 py-0.5 rounded-full border ${getEmotionColor(emotion)}`}>
                          {emotion}
                        </span>
                      ))}
                    </div>
                  </article>
                )
              })}
              {filteredEntries.length === 0 && (
                <p className="py-10 text-center text-sm text-stone-400">조건에 맞는 기록이 없어요.</p>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  )
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4">
      <p className="text-xs text-stone-400 mb-1">{label}</p>
      <p className="text-xl font-bold text-stone-800">{value}</p>
    </div>
  )
}
