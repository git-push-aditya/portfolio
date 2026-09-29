"use client";

import { useEffect, useState } from "react";

type WeatherCode = {
  [key: number]: string;
};

const WEATHER_EMOJI: WeatherCode = {
  0: "☀️", // Clear
  1: "🌤️", // Mostly clear
  2: "⛅", // Partly cloudy
  3: "☁️", // Overcast
  45: "🌫️", // Foggy
  48: "🌫️", // Foggy
  51: "🌧️", // Light drizzle
  53: "🌧️", // Moderate drizzle
  55: "🌧️", // Dense drizzle
  61: "🌧️", // Slight rain
  63: "🌧️", // Moderate rain
  65: "⛈️", // Heavy rain
  71: "❄️", // Slight snow
  73: "❄️", // Moderate snow
  75: "❄️", // Heavy snow
  77: "❄️", // Snow grains
  80: "🌧️", // Slight rain showers
  81: "🌧️", // Moderate rain showers
  82: "⛈️", // Violent rain showers
  85: "❄️", // Slight snow showers
  86: "❄️", // Heavy snow showers
  95: "⛈️", // Thunderstorm
  96: "⛈️", // Thunderstorm with slight hail
  97: "⛈️", // Thunderstorm with heavy hail
};

export default function LocationWidget() {
  const [time, setTime] = useState<string>("");
  const [weather, setWeather] = useState<string>("🌍");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date().toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
      setTime(now);
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const res = await fetch(
          "https://api.open-meteo.com/v1/forecast?latitude=12.9716&longitude=77.5946&current=weather_code&timezone=Asia/Kolkata"
        );
        const data = await res.json();
        const code = data.current?.weather_code ?? 0;
        setWeather(WEATHER_EMOJI[code] || "🌍");
      } catch {
        setWeather("🌍");
      } finally {
        setLoading(false);
      }
    };
    fetchWeather();
  }, []);

  return (
    <div className="absolute bottom-6 left-1/2 w-screen -translate-x-1/2 px-6 text-left font-mono text-[0.65rem] text-muted opacity-50 hover:opacity-80 transition-opacity tracking-wide">
      <div className="flex items-center gap-1.5">
        <span>📍</span>
        <span>Bangalore, India</span>
        <span>{weather}</span>
        <span>{time || "—"}</span>
      </div>
    </div>
  );
}
