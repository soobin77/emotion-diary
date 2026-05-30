export type Mood =
  | 'happy'
  | 'excited'
  | 'calm'
  | 'neutral'
  | 'tired'
  | 'anxious'
  | 'sad'
  | 'angry'

export interface DiaryEntry {
  id: string
  date: string
  content: string
  emotions: string[]
  mood: Mood
  comfort: string
  insight: string
  createdAt: number
}
