export type Mood = 'positive' | 'neutral' | 'negative'

export interface DiaryEntry {
  id: string
  date: string
  content: string
  emotions: string[]
  mood: Mood
  comfort: string
  createdAt: number
}
