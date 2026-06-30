# 오늘 뭐 입지? · Today What to Wear?

> **AI가 날씨와 상황에 맞는 의상을 추천해주는 패션 어시스턴트 앱**
> 
> **An AI-powered fashion assistant that recommends outfits based on weather and occasion**

---

## 📱 소개 · Introduction

**[한국어]**  
오늘 날씨와 오늘의 일정에 맞게 의상을 추천받으세요. 사진 한 장을 찍으면 Claude AI가 코디를 분석하고, AI가 생성한 스타일 이미지까지 제공합니다.

**[English]**  
Get outfit recommendations tailored to today's weather and your schedule. Take a photo of your outfit and Claude AI will analyze it, then generate an AI style reference image.

---

## ✨ 주요 기능 · Key Features

| 기능 | Feature |
|------|---------|
| 📸 실시간 날씨 기반 의상 분석 | Real-time weather-based outfit analysis |
| 🤖 Claude Vision AI 코디 피드백 | Claude Vision AI styling feedback |
| 🎨 AI 스타일 이미지 생성 | AI-generated style reference image |
| 🌡️ 체감온도 기준 7단계 날씨 적합성 판단 | 7-level weather suitability based on feels-like temp |
| 👗 옷장 관리 기능 | Wardrobe management |
| 🌍 한국어 / 영어 다국어 지원 | Korean / English multilingual support |
| 📋 개인 프로필 기반 맞춤 분석 | Personalized analysis based on user profile |

---

## 🛠 기술 스택 · Tech Stack

### Frontend
- **React Native** (Expo SDK 54)
- **Expo Router** v6 (파일 기반 라우팅 · File-based routing)
- **TypeScript** (strict mode)
- **Zustand** + AsyncStorage (상태 관리 · State management)
- **i18next** + react-i18next (다국어 · Multilingual)

### Backend
- **FastAPI** (Python)
- **Vercel** Serverless Functions

### AI / External APIs
- **Claude API** (`claude-sonnet-4-5`) — 의상 분석 · Outfit analysis
- **Pollinations.ai** — AI 이미지 생성 · AI image generation
- **OpenWeatherMap API** — 실시간 날씨 · Real-time weather

---

## 📸 스크린샷 · Screenshots

> 이미지는 추가 예정입니다 · Screenshots coming soon

| 홈 화면 | 분석 화면 | 결과 화면 |
|---------|---------|---------|
| *(준비 중)* | *(준비 중)* | *(준비 중)* |

---

## 🚀 설치 방법 · Getting Started

### 사전 준비 · Prerequisites

아래 API 키가 필요합니다 · The following API keys are required:

- [Anthropic API Key](https://console.anthropic.com/) — Claude AI 분석
- [OpenWeatherMap API Key](https://openweathermap.org/api) — 날씨 데이터

### 1. 저장소 클론 · Clone

```bash
git clone https://github.com/wings-willy/outfit-recommendation-app.git
cd outfit-recommendation-app
```

### 2. 프론트엔드 설정 · Frontend Setup

```bash
npm install
```

`.env` 파일 생성 (`.env.example` 참고) · Create `.env` file (see `.env.example`):

```env
EXPO_PUBLIC_API_URL=http://localhost:8000
EXPO_PUBLIC_OPENWEATHER_API_KEY=your_openweather_key_here
```

### 3. 백엔드 설정 · Backend Setup

```bash
cd backend
pip install -r requirements.txt
```

`backend/.env` 파일 생성 · Create `backend/.env`:

```env
ANTHROPIC_API_KEY=your_anthropic_key_here
```

백엔드 실행 · Run backend:

```bash
uvicorn app.main:app --reload
```

### 4. 앱 실행 · Run App

```bash
# 프론트엔드 루트에서 · From frontend root
npx expo start
```

---

## 📦 배포 · Deployment

- **Backend**: [Vercel](https://vercel.com/) serverless 배포
- **Frontend**: [EAS Build](https://expo.dev/eas) Android APK 빌드

---

## ⚠️ 주의사항 · Important Notes

- API 키는 절대 코드에 하드코딩하지 마세요 · Never hardcode API keys in source code
- `.env` 파일은 `.gitignore`에 포함되어 있습니다 · `.env` files are gitignored
- 본인의 API 키로 `.env`를 직접 설정해야 합니다 · You must configure `.env` with your own API keys

---

## 📄 라이선스 · License

[MIT License](LICENSE)

Copyright (c) 2025 wings-willy
