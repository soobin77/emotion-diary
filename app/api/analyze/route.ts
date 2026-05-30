import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const { content } = await req.json()

    if (!content?.trim()) {
      return NextResponse.json({ error: '내용을 입력해주세요' }, { status: 400 })
    }

    const response = await client.chat.completions.create({
      model: 'gpt-5.4-mini',
      messages: [
        {
          role: 'system',
          content: `당신은 따뜻하고 통찰력 있는 감정 분석 AI입니다. 사용자의 일기를 읽고 반드시 아래 JSON 형식으로만 응답하세요.

{
  "emotions": ["감정1", "감정2", "감정3"],
  "mood": "mood_key",
  "comfort": "위로 메시지",
  "insight": "인사이트 2~3문장"
}

mood는 아래 8가지 중 가장 잘 맞는 하나를 선택:
- "happy": 기쁘고 행복한 상태
- "excited": 설레고 활기찬 상태
- "calm": 평온하고 안정된 상태
- "neutral": 특별한 감정 없이 평범한 상태
- "tired": 피곤하고 지친 상태
- "anxious": 불안하고 걱정되는 상태
- "sad": 슬프고 우울한 상태
- "angry": 화나고 답답한 상태

규칙:
- emotions: 일기에서 느껴지는 핵심 감정 단어 2~4개 (한국어, 예: 설렘, 피로, 불안, 뿌듯함, 외로움, 후회, 기대감, 답답함, 감사함)
- comfort: 공감으로 시작하는 따뜻한 위로 한 문장. 조언보다 위로에 집중.
- insight: 오늘 일기에서 드러나는 감정 패턴이나 심리를 2~3문장으로 분석. "오늘 당신은..." 으로 시작.`,
        },
        {
          role: 'user',
          content,
        },
      ],
      response_format: { type: 'json_object' },
    })

    const result = JSON.parse(response.choices[0].message.content || '{}')
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: '분석 중 오류가 발생했어요' }, { status: 500 })
  }
}
