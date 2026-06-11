import { useEffect, useState, useCallback } from 'react';

export interface WeatherData {
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  condition: string;
  icon: string;
  city: string;
  code: number;
  isDay: boolean;
}

// Map WMO weather codes to label + emoji
// https://open-meteo.com/en/docs
const mapWmo = (code: number, isDay: boolean): { condition: string; icon: string } => {
  if (code === 0) return { condition: isDay ? 'Ensolarado' : 'Céu limpo', icon: isDay ? '☀️' : '🌙' };
  if (code === 1) return { condition: 'Predominantemente limpo', icon: isDay ? '🌤️' : '🌙' };
  if (code === 2) return { condition: 'Parcialmente nublado', icon: '⛅' };
  if (code === 3) return { condition: 'Nublado', icon: '☁️' };
  if (code === 45 || code === 48) return { condition: 'Neblina', icon: '🌫️' };
  if (code === 51) return { condition: 'Garoa fraca', icon: '🌦️' };
  if (code === 53) return { condition: 'Garoa moderada', icon: '🌦️' };
  if (code === 55) return { condition: 'Garoa intensa', icon: '🌧️' };
  if (code === 56 || code === 57) return { condition: 'Garoa congelante', icon: '🌧️' };
  if (code === 61) return { condition: 'Chuva fraca', icon: '🌧️' };
  if (code === 63) return { condition: 'Chuva moderada', icon: '🌧️' };
  if (code === 65) return { condition: 'Chuva forte', icon: '🌧️' };
  if (code === 66 || code === 67) return { condition: 'Chuva congelante', icon: '🌧️' };
  if (code === 71) return { condition: 'Neve fraca', icon: '🌨️' };
  if (code === 73) return { condition: 'Neve moderada', icon: '🌨️' };
  if (code === 75) return { condition: 'Neve forte', icon: '❄️' };
  if (code === 77) return { condition: 'Grãos de neve', icon: '🌨️' };
  if (code === 80) return { condition: 'Pancadas de chuva', icon: '🌧️' };
  if (code === 81) return { condition: 'Pancadas moderadas', icon: '🌧️' };
  if (code === 82) return { condition: 'Pancadas fortes', icon: '⛈️' };
  if (code === 85 || code === 86) return { condition: 'Pancadas de neve', icon: '🌨️' };
  if (code === 95) return { condition: 'Tempestade', icon: '⛈️' };
  if (code === 96 || code === 99) return { condition: 'Tempestade com granizo', icon: '⛈️' };
  return { condition: 'Indisponível', icon: '🌡️' };
};

const getPosition = (): Promise<GeolocationPosition> =>
  new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('Geolocalização não disponível'));
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 8000,
      maximumAge: 300000,
    });
  });

const reverseGeocode = async (lat: number, lon: number): Promise<string> => {
  // Primary: BigDataCloud (free, no key, accurate city names)
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=pt`
    );
    if (res.ok) {
      const d = await res.json();
      const city = d.city || d.locality || d.principalSubdivision;
      if (city) {
        const state = d.principalSubdivisionCode?.replace('BR-', '') || '';
        return state ? `${city}, ${state}` : city;
      }
    }
  } catch {}
  // Fallback: Open-Meteo forward search by coords (approximate)
  try {
    const res = await fetch(
      `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${lat}&longitude=${lon}&language=pt&count=1`
    );
    if (res.ok) {
      const data = await res.json();
      const r = data?.results?.[0];
      if (r) return `${r.name}${r.admin1 ? ', ' + r.admin1 : ''}`;
    }
  } catch {}
  // Last resort: IP-based city
  try {
    const res = await fetch('https://ipapi.co/json/');
    if (res.ok) {
      const d = await res.json();
      if (d.city) return `${d.city}${d.region_code ? ', ' + d.region_code : ''}`;
    }
  } catch {}
  return '';
};

const FALLBACK = { lat: -23.5505, lon: -46.6333, city: 'São Paulo, SP' };

export const useWeather = () => {
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = useCallback(async () => {
    setError(null);
    let lat = FALLBACK.lat;
    let lon = FALLBACK.lon;
    let cityFallback = FALLBACK.city;
    try {
      const pos = await getPosition();
      lat = pos.coords.latitude;
      lon = pos.coords.longitude;
      cityFallback = '';
    } catch {
      // use fallback
    }

    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m&timezone=auto&_=${Date.now()}`;
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error('Erro ao consultar clima');
      const json = await res.json();
      const c = json.current;
      const isDay = c.is_day === 1;
      const { condition, icon } = mapWmo(c.weather_code, isDay);
      const city = cityFallback || (await reverseGeocode(lat, lon)) || 'Sua localização';
      setData({
        temperature: Math.round(c.temperature_2m),
        feelsLike: Math.round(c.apparent_temperature),
        humidity: Math.round(c.relative_humidity_2m),
        windSpeed: Math.round(c.wind_speed_10m),
        condition,
        icon,
        city,
        code: c.weather_code,
        isDay,
      });
    } catch (e: any) {
      setError(e?.message || 'Erro ao obter clima');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWeather();
    const id = setInterval(fetchWeather, 10 * 60 * 1000);
    return () => clearInterval(id);
  }, [fetchWeather]);

  return { data, loading, error, refresh: fetchWeather };
};
