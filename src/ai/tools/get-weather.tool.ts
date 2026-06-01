import { InternalServerErrorException } from '@nestjs/common';
import { z } from 'genkit';

export const weatherInputSchema = z.object({ city: z.string() });
export const weatherOutputSchema = z.object({
  city: z.string(),
  temperature: z.number(),
  condition: z.string(),
});

export const GET_WEATHER_TOOL_NAME = 'getWeather';
export const GET_WEATHER_TOOL_DESCRIPTION =
  'Returns the current weather for a given city';

// Maps WMO weather codes to human-readable conditions
function wmoToCondition(code: number): string {
  if (code === 0) return 'Clear sky';
  if (code <= 3) return 'Partly cloudy';
  if (code <= 48) return 'Foggy';
  if (code <= 67) return 'Rainy';
  if (code <= 77) return 'Snowy';
  if (code <= 82) return 'Rain showers';
  if (code <= 86) return 'Snow showers';
  return 'Thunderstorm';
}

interface GeoResult {
  results?: { latitude: number; longitude: number; name: string }[];
}

interface WeatherResult {
  current: { temperature_2m: number; weathercode: number };
}

export async function getWeatherHandler({
  city,
}: {
  city: string;
}): Promise<{ city: string; temperature: number; condition: string }> {
  // Step 1: Geocode city → lat/lon (Open-Meteo geocoding, free, no API key)
  const geoRes = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`,
  );
  const geoData = (await geoRes.json()) as GeoResult;

  if (!geoData.results?.length) {
    throw new InternalServerErrorException(`City "${city}" not found`);
  }

  const { latitude, longitude, name } = geoData.results[0];

  // Step 2: Fetch current weather (Open-Meteo, free, no API key)
  const weatherRes = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weathercode&temperature_unit=celsius`,
  );
  const weatherData = (await weatherRes.json()) as WeatherResult;

  const { temperature_2m, weathercode } = weatherData.current;

  return {
    city: name,
    temperature: Math.round(temperature_2m),
    condition: wmoToCondition(weathercode),
  };
}
