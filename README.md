# 오늘의 감정 일기

AI가 일기 내용을 읽고 감정 태그, 대표 무드, 위로 메시지, 감정 인사이트를 제공하는 개인 감정 저널입니다. 기록은 브라우저 `localStorage`에 저장되어 가볍게 사용할 수 있습니다.

## 주요 기능

- 오늘의 일기 작성 및 AI 감정 분석
- 감정 태그, 무드 미터, 위로 메시지, 인사이트 제공
- 최근 7일 감정 흐름과 연속 기록 표시
- 지난 기록의 감정 분포, 자주 느낀 감정, 검색 및 무드 필터
- 저장된 기록 JSON 내보내기

## 기술 스택

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- OpenAI SDK

## 실행

```bash
npm install
npm run dev
```

`.env.local`에 OpenAI API 키를 설정합니다.

```bash
OPENAI_API_KEY=your_api_key
```

## 검증

```bash
npm run lint
npm run build
```
