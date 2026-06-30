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
- **FastAPI** (Python 3.11+)
- **Vercel** Serverless Functions

### AI / External APIs
- **Claude API** (`claude-sonnet-4-5`) — 의상 분석 · Outfit analysis
- **Google Gemini API** — 이미지 생성 보조 · Image generation assist
- **Pollinations.ai** — AI 이미지 생성 (Gemini 대체) · AI image generation (Gemini fallback)
- **OpenWeatherMap API** — 실시간 날씨 · Real-time weather
- **Supabase** — 사용자 인증 및 데이터 저장 · Auth & data storage

---

## 📸 스크린샷 · Screenshots

> 이미지는 추가 예정입니다 · Screenshots coming soon

| 홈 화면 | 분석 화면 | 결과 화면 |
|---------|---------|---------|
| *(준비 중)* | *(준비 중)* | *(준비 중)* |

---

## 🔑 필요한 API 키 · Required API Keys

이 앱을 실행하려면 아래 4가지 API 키가 필요합니다.
This app requires the following 4 API keys.

### 1. Anthropic API Key (Claude AI)
- **용도**: 의상 이미지 분석 및 코디 피드백 · Outfit image analysis & feedback
- **발급**: [console.anthropic.com](https://console.anthropic.com/)
- 회원가입 → API Keys → Create Key
- **설정 위치**: `backend/.env` → `ANTHROPIC_API_KEY`

### 2. Google Gemini API Key
- **용도**: AI 스타일 이미지 생성 · AI style image generation
- **발급**: [aistudio.google.com](https://aistudio.google.com/)
- Get API Key → Create API key in new project
- **설정 위치**: `backend/.env` → `GOOGLE_API_KEY`

### 3. OpenWeatherMap API Key
- **용도**: 실시간 날씨 데이터 조회 · Real-time weather data
- **발급**: [openweathermap.org/api](https://openweathermap.org/api)
- 회원가입 → My API Keys → Generate
- 무료 플랜(Free tier)으로 충분합니다 · Free tier is sufficient
- **설정 위치**: `frontend/.env` → `EXPO_PUBLIC_OPENWEATHER_API_KEY`

### 4. Supabase (URL + Anon Key)
- **용도**: 사용자 인증 및 옷장 데이터 저장 · User auth & wardrobe storage
- **발급**: [supabase.com](https://supabase.com/)
- New Project 생성 → Project Settings → API
- `Project URL`과 `anon public` 키를 복사
- **설정 위치**: `frontend/.env` 및 `backend/.env` 양쪽에 설정

---

## 🚀 설치 방법 · Getting Started

### 사전 준비 · Prerequisites

- Node.js 18 이상 · Node.js 18+
- Python 3.11 이상 · Python 3.11+
- Expo CLI (`npm install -g expo-cli`)
- 위 API 키 4개 · 4 API keys listed above

---

### 1. 저장소 클론 · Clone

```bash
git clone https://github.com/wings-willy/outfit-recommendation-app.git
cd outfit-recommendation-app
```

---

### 2. 백엔드 설정 · Backend Setup

```bash
cd backend
pip install -r requirements.txt
```

`backend/.env` 파일을 생성하고 아래 내용을 채워넣으세요.
Create `backend/.env` and fill in your values:

```env
# Anthropic Claude API (https://console.anthropic.com/)
ANTHROPIC_API_KEY=sk-ant-api03-...

# Google Gemini API (https://aistudio.google.com/)
GOOGLE_API_KEY=AIzaSy...

# Supabase (https://supabase.com/ → Project Settings → API)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...
JWT_SECRET=your-supabase-jwt-secret

# OpenWeatherMap (https://openweathermap.org/api)
OPENWEATHER_API_KEY=your-openweather-key

# Server
PORT=8000
ENVIRONMENT=development
```

백엔드 실행 · Run backend:

```bash
uvicorn app.main:app --reload --port 8000
```

정상 실행 시 `http://localhost:8000/docs` 에서 API 문서를 확인할 수 있습니다.
If running correctly, visit `http://localhost:8000/docs` to see the API docs.

---

### 3. 프론트엔드 설정 · Frontend Setup

저장소 루트(`outfit-recommendation-app/`)에서 실행합니다.
Run from the repo root (`outfit-recommendation-app/`):

```bash
npm install
```

`.env` 파일을 생성하고 아래 내용을 채워넣으세요.
Create `.env` and fill in your values:

```env
# Backend API URL (로컬 개발 시 · for local dev)
EXPO_PUBLIC_API_URL=http://localhost:8000

# OpenWeatherMap (https://openweathermap.org/api)
EXPO_PUBLIC_OPENWEATHER_API_KEY=your-openweather-key

# Supabase (https://supabase.com/ → Project Settings → API)
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

> **참고**: Vercel에 백엔드를 배포한 경우 `EXPO_PUBLIC_API_URL`을 배포된 URL로 변경하세요.
> **Note**: If you deployed the backend to Vercel, change `EXPO_PUBLIC_API_URL` to your deployed URL.

---

### 4. 앱 실행 · Run App

```bash
npx expo start
```

- **Android**: Expo Go 앱으로 QR 코드 스캔 · Scan QR code with Expo Go app
- **iOS**: Expo Go 앱으로 QR 코드 스캔 · Scan QR code with Expo Go app
- **에뮬레이터**: `a` (Android) / `i` (iOS) 키 입력 · Press `a` (Android) / `i` (iOS)

---

## 📦 배포 · Deployment

### 백엔드 (Vercel) · Backend

```bash
cd backend
vercel --prod
```

Vercel 대시보드에서 환경변수를 직접 등록하세요.
Register environment variables directly in the Vercel dashboard.

### 프론트엔드 APK (EAS Build) · Frontend APK

```bash
eas build --platform android --profile preview
```

---

## ⚠️ 주의사항 · Important Notes

- `.env` 파일은 `.gitignore`에 포함되어 있어 저장소에 커밋되지 않습니다.
  `.env` files are gitignored and will not be committed to the repository.
- API 키는 절대 소스코드에 직접 입력하지 마세요.
  Never hardcode API keys directly in source code.
- Vercel 배포 시 환경변수는 반드시 Vercel 대시보드에서 등록하세요.
  When deploying to Vercel, always register env vars in the Vercel dashboard.

---

## 📄 라이선스 · License

[MIT License](LICENSE)

Copyright (c) 2025 wings-willy
