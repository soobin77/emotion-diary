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
          content: `당신은 따뜻한 공감 능력을 가진 감정 분석 AI입니다. 사용자의 일기를 읽고 반드시 아래 JSON 형식으로만 응답하세요.

{
  "emotions": ["감정1", "감정2", "감정3"],
  "mood": "positive" | "neutral" | "negative",
  "comfort": "위로 메시지"
}

규칙:
- emotions: 일기에서 느껴지는 핵심 감정 2~4개 (한국어, 예: 설렘, 피로, 불안, 뿌듯함, 외로움, 후회, 기대감, 답답함, 감사함)
- mood: 전체적인 감정의 방향 (positive/neutral/negative 중 하나)
- comfort: 진심 어린 공감으로 시작하는 따뜻한 한 문장. 조언보다 위로에 집중.`,
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
