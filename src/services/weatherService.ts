import * as Location from 'expo-location';
import { WeatherData } from '@/types';

const OPENWEATHER_API_KEY = process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY;
const OPENWEATHER_BASE = 'https://api.openweathermap.org/data/2.5';

// 날씨 상태 코드 → 한국어 변환
function getKoreanCondition(weatherId: number, main: string): string {
  if (weatherId >= 200 && weatherId < 300) return '뇌우';
  if (weatherId >= 300 && weatherId < 400) return '이슬비';
  if (weatherId >= 500 && weatherId < 600) {
    if (weatherId === 500) return '약한 비';
    if (weatherId === 501) return '보통 비';
    return '강한 비';
  }
  if (weatherId >= 600 && weatherId < 700) return '눈';
  if (weatherId >= 700 && weatherId < 800) return '안개';
  if (weatherId === 800) return '맑음';
  if (weatherId === 801) return '구름 조금';
  if (weatherId === 802) return '구름 많음';
  if (weatherId >= 803) return '흐림';
  return main;
}

export async function getCurrentLocation(): Promise<{ lat: number; lng: number; city?: string }> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('위치 권한이 거부되었습니다.');
  }

  const location = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  // 역지오코딩으로 도시명 가져오기
  const geocode = await Location.reverseGeocodeAsync({
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
  });

  const city = geocode[0]?.city || geocode[0]?.region || undefined;

  return {
    lat: location.coords.latitude,
    lng: location.coords.longitude,
    city,
  };
}

export async function getWeatherByCoords(lat: number, lng: number): Promise<WeatherData> {
  if (!OPENWEATHER_API_KEY) {
    // 개발 환경에서는 Mock 날씨 반환
    return getMockWeather();
  }

  const url = `${OPENWEATHER_BASE}/weather?lat=${lat}&lon=${lng}&appid=${OPENWEATHER_API_KEY}&units=metric&lang=kr`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('날씨 정보를 불러오지 못했습니다.');
  }

  const data = await response.json();

  // 강수확률은 forecast API에서 가져와야 하지만 MVP에서는 현재 날씨만 사용
  const precipProb = data.rain ? Math.min(100, (data.rain['1h'] || 0) * 20) : 0;

  return {
    city: data.name,
    temperature: Math.round(data.main.temp),
    feels_like: Math.round(data.main.feels_like),
    condition: getKoreanCondition(data.weather[0].id, data.weather[0].main),
    condition_code: String(data.weather[0].id),
    humidity: data.main.humidity,
    precipitation_prob: precipProb,
    wind_speed: data.wind.speed,
    icon: data.weather[0].icon,
    updated_at: new Date().toISOString(),
  };
}

export async function getWeatherByCity(city: string): Promise<WeatherData> {
  if (!OPENWEATHER_API_KEY) {
    return getMockWeather(city);
  }

  const url = `${OPENWEATHER_BASE}/weather?q=${encodeURIComponent(city)}&appid=${OPENWEATHER_API_KEY}&units=metric&lang=kr`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('도시를 찾을 수 없습니다.');
  }

  const data = await response.json();

  return {
    city: data.name,
    temperature: Math.round(data.main.temp),
    feels_like: Math.round(data.main.feels_like),
    condition: getKoreanCondition(data.weather[0].id, data.weather[0].main),
    condition_code: String(data.weather[0].id),
    humidity: data.main.humidity,
    precipitation_prob: 0,
    wind_speed: data.wind.speed,
    icon: data.weather[0].icon,
    updated_at: new Date().toISOString(),
  };
}

// Mock 날씨 데이터 (API 키 없을 때 사용)
function getMockWeather(city = '서울'): WeatherData {
  return {
    city,
    temperature: 18,
    feels_like: 16,
    condition: '구름 조금',
    condition_code: '801',
    humidity: 60,
    precipitation_prob: 20,
    wind_speed: 2.5,
    icon: '02d',
    updated_at: new Date().toISOString(),
  };
}
