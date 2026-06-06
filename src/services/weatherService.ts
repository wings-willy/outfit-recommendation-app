import * as Location from 'expo-location';
import { WeatherData } from '@/types';

const OPENWEATHER_API_KEY = process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY;
const BASE = 'https://api.openweathermap.org/data/2.5';

// 날씨 상태 코드 → 한국어
function getKoreanCondition(id: number): string {
  if (id >= 200 && id < 300) return '뇌우';
  if (id >= 300 && id < 400) return '이슬비';
  if (id === 500) return '약한 비';
  if (id === 501) return '보통 비';
  if (id >= 502 && id < 600) return '강한 비';
  if (id >= 600 && id < 700) return '눈';
  if (id >= 700 && id < 800) return '안개';
  if (id === 800) return '맑음';
  if (id === 801) return '구름 조금';
  if (id === 802) return '구름 많음';
  if (id >= 803) return '흐림';
  return '기타';
}

export async function getCurrentLocation(): Promise<{ lat: number; lng: number; city?: string }> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') throw new Error('위치 권한이 거부되었습니다.');

  const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  const geo = await Location.reverseGeocodeAsync({
    latitude: loc.coords.latitude,
    longitude: loc.coords.longitude,
  });
  const city = geo[0]?.city || geo[0]?.region || undefined;
  return { lat: loc.coords.latitude, lng: loc.coords.longitude, city };
}

export async function getWeatherByCoords(lat: number, lng: number): Promise<WeatherData> {
  if (!OPENWEATHER_API_KEY) return getMockWeather();

  // 현재 날씨 + 3시간 예보(강수확률) 병렬 요청
  const [currentRes, forecastRes] = await Promise.all([
    fetch(`${BASE}/weather?lat=${lat}&lon=${lng}&appid=${OPENWEATHER_API_KEY}&units=metric&lang=kr`),
    fetch(`${BASE}/forecast?lat=${lat}&lon=${lng}&appid=${OPENWEATHER_API_KEY}&units=metric&cnt=2`),
  ]);

  if (!currentRes.ok) throw new Error('날씨 정보를 불러오지 못했습니다.');

  const current = await currentRes.json();
  let precipProb = 0;

  if (forecastRes.ok) {
    const forecast = await forecastRes.json();
    // forecast.list[0].pop = probability of precipitation (0~1)
    precipProb = Math.round((forecast.list?.[0]?.pop ?? 0) * 100);
  }

  return {
    city: current.name,
    temperature: Math.round(current.main.temp),
    feels_like: Math.round(current.main.feels_like),
    condition: getKoreanCondition(current.weather[0].id),
    condition_code: String(current.weather[0].id),
    humidity: current.main.humidity,
    precipitation_prob: precipProb,
    wind_speed: Math.round(current.wind.speed * 10) / 10,
    icon: current.weather[0].icon,
    updated_at: new Date().toISOString(),
  };
}

export async function getWeatherByCity(city: string): Promise<WeatherData> {
  if (!OPENWEATHER_API_KEY) return getMockWeather(city);

  const [currentRes, forecastRes] = await Promise.all([
    fetch(`${BASE}/weather?q=${encodeURIComponent(city)}&appid=${OPENWEATHER_API_KEY}&units=metric&lang=kr`),
    fetch(`${BASE}/forecast?q=${encodeURIComponent(city)}&appid=${OPENWEATHER_API_KEY}&units=metric&cnt=2`),
  ]);

  if (!currentRes.ok) throw new Error('도시를 찾을 수 없습니다.');

  const current = await currentRes.json();
  let precipProb = 0;
  if (forecastRes.ok) {
    const forecast = await forecastRes.json();
    precipProb = Math.round((forecast.list?.[0]?.pop ?? 0) * 100);
  }

  return {
    city: current.name,
    temperature: Math.round(current.main.temp),
    feels_like: Math.round(current.main.feels_like),
    condition: getKoreanCondition(current.weather[0].id),
    condition_code: String(current.weather[0].id),
    humidity: current.main.humidity,
    precipitation_prob: precipProb,
    wind_speed: Math.round(current.wind.speed * 10) / 10,
    icon: current.weather[0].icon,
    updated_at: new Date().toISOString(),
  };
}

function getMockWeather(city = '서울'): WeatherData {
  return {
    city,
    temperature: 22,
    feels_like: 21,
    condition: '맑음',
    condition_code: '800',
    humidity: 55,
    precipitation_prob: 10,
    wind_speed: 2.5,
    icon: '01d',
    updated_at: new Date().toISOString(),
  };
}
