import { DiaryEntry, Mood } from './types'

export const STORAGE_KEY = 'diary_entries'

export const EMOTION_COLORS: Record<string, string> = {
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

export const MOOD_CONFIG: Record<Mood, {
  label: string
  shortLabel: string
  emoji: string
  bg: string
  bar: string
  dot: string
  score: number
}> = {
  happy: { label: '행복해요', shortLabel: '행복', emoji: '😊', bg: 'from-amber-50 to-yellow-50', bar: 'bg-amber-400', dot: 'bg-amber-400', score: 95 },
  excited: { label: '설레요', shortLabel: '설렘', emoji: '✨', bg: 'from-pink-50 to-rose-50', bar: 'bg-pink-400', dot: 'bg-pink-400', score: 80 },
  calm: { label: '평온해요', shortLabel: '평온', emoji: '🌿', bg: 'from-emerald-50 to-teal-50', bar: 'bg-emerald-400', dot: 'bg-emerald-400', score: 65 },
  neutral: { label: '그냥 그래요', shortLabel: '보통', emoji: '☁️', bg: 'from-stone-50 to-slate-50', bar: 'bg-stone-400', dot: 'bg-stone-300', score: 50 },
  tired: { label: '피곤해요', shortLabel: '피로', emoji: '😮‍💨', bg: 'from-slate-50 to-zinc-100', bar: 'bg-slate-400', dot: 'bg-slate-400', score: 35 },
  anxious: { label: '불안해요', shortLabel: '불안', emoji: '🌀', bg: 'from-purple-50 to-violet-50', bar: 'bg-purple-400', dot: 'bg-purple-400', score: 25 },
  sad: { label: '슬퍼요', shortLabel: '슬픔', emoji: '🌧', bg: 'from-blue-50 to-indigo-50', bar: 'bg-blue-400', dot: 'bg-blue-400', score: 15 },
  angry: { label: '화나요', shortLabel: '분노', emoji: '🔥', bg: 'from-red-50 to-orange-50', bar: 'bg-red-400', dot: 'bg-red-400', score: 10 },
}

export const ALL_MOODS = Object.keys(MOOD_CONFIG) as Mood[]

export interface AnalysisResult {
  emotions: string[]
  mood: Mood
  comfort: string
  insight: string
}

export function getEmotionColor(emotion: string) {
  return EMOTION_COLORS[emotion] ?? 'bg-stone-100 text-stone-600 border-stone-200'
}

export function getDateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function formatDate(dateKey: string, options: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric', weekday: 'short' }) {
  const [year, month, day] = dateKey.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('ko-KR', options)
}

export function readEntries(): DiaryEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveEntry(entry: DiaryEntry) {
  const entries = readEntries().filter((item) => item.date !== entry.date)
  const updated = [entry, ...entries].sort((a, b) => b.createdAt - a.createdAt)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  return updated
}

export function getStreak(entries: DiaryEntry[]) {
  const dates = new Set(entries.map((entry) => entry.date))
  const cursor = new Date()
  let streak = 0

  while (dates.has(getDateKey(cursor))) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }

  return streak
}

export function getTopEmotions(entries: DiaryEntry[], limit = 6) {
  const counts = entries.reduce<Record<string, number>>((acc, entry) => {
    entry.emotions.forEach((emotion) => {
      acc[emotion] = (acc[emotion] ?? 0) + 1
    })
    return acc
  }, {})

  return Object.entries(counts)
    .map(([emotion, count]) => ({ emotion, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
}

export function getWeeklyEntries(entries: DiaryEntry[]) {
  const keys = Array.from({ length: 7 }, (_, index) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - index))
    return getDateKey(date)
  })

  return keys.map((date) => ({ date, entry: entries.find((item) => item.date === date) }))
}

export function validateAnalysisResult(value: unknown): AnalysisResult | null {
  if (!value || typeof value !== 'object') return null
  const result = value as Partial<AnalysisResult>

  if (!result.mood || !ALL_MOODS.includes(result.mood)) return null
  if (!Array.isArray(result.emotions) || result.emotions.length === 0) return null
  if (typeof result.comfort !== 'string' || typeof result.insight !== 'string') return null

  return {
    mood: result.mood,
    emotions: result.emotions.filter((emotion): emotion is string => typeof emotion === 'string').slice(0, 4),
    comfort: result.comfort,
    insight: result.insight,
  }
}
