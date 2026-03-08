import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../api/auth';
import { session } from '../auth/session';
import { Button } from '../components/ui/Button';
import { SeoMeta } from '../components/seo/SeoMeta';
import { externalApi } from '../api/external';
import type { WeatherResponse } from '../types/external';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const role = session.getRole();
  const [city, setCity] = useState('Moscow');
  const [weather, setWeather] = useState<WeatherResponse | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState('');

  const loadWeather = async (targetCity: string) => {
    setWeatherLoading(true);
    setWeatherError('');
    try {
      const data = await externalApi.getWeather(targetCity);
      setWeather(data);
    } catch (err: any) {
      setWeather(null);
      const status = err?.response?.status;
      if (status === 503) {
        setWeatherError('Сервис погоды временно недоступен. Основной функционал приложения работает в штатном режиме.');
      } else if (status === 429) {
        setWeatherError('Слишком много запросов к сервису погоды. Попробуйте чуть позже.');
      } else {
        setWeatherError('Не удалось получить данные погоды.');
      }
    } finally {
      setWeatherLoading(false);
    }
  };

  useEffect(() => {
    void loadWeather(city);
  }, []);

  const handleLogout = async () => {
    const refreshToken = session.getRefreshToken() || undefined;
    try {
      await authApi.logout(refreshToken);
    } catch (error) {
    } finally {
      session.clear();
      navigate('/login');
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <SeoMeta
        title="Личный кабинет - AnonifyNeuro"
        description="Личный кабинет для обработки изображений в AnonifyNeuro."
        path="/"
        noindex
      />
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6 flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">AnonifyNeuro</h1>
          <div className="flex gap-4 items-center">
            <Link to="/chats" className="text-indigo-600 hover:text-indigo-800 font-medium">
              Чаты
            </Link>
            <Link to="/profile" className="text-indigo-600 hover:text-indigo-800 font-medium">
              Профиль
            </Link>
            {role === 'admin' && (
              <Link to="/admin" className="text-indigo-600 hover:text-indigo-800 font-medium">
                Админ
              </Link>
            )}
            <div className="w-32">
              <Button variant="outline" onClick={handleLogout}>
                Выйти
              </Button>
            </div>
          </div>
        </div>

        <section className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Добро пожаловать!</h2>
          <p className="text-gray-600 mb-4">
            Вы успешно вошли в систему. Здесь вы можете загружать изображения для скрытия номерных знаков.
          </p>
          <Link to="/chats">
            <Button variant="gradient">Перейти к чатам</Button>
          </Link>
        </section>

        <section className="bg-white rounded-xl shadow-lg p-6" aria-labelledby="weather-widget-title">
          <h2 id="weather-widget-title" className="text-xl font-semibold text-gray-900 mb-2">Внешние данные: погода</h2>
          <p className="text-gray-600 mb-4">Данные загружаются через серверный адаптер внешнего API.</p>

          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="Город"
            />
            <Button onClick={() => void loadWeather(city)} isLoading={weatherLoading} variant="outline">Обновить погоду</Button>
          </div>

          {weatherLoading ? (
            <div className="h-24 rounded-lg border border-gray-200 bg-gray-50 animate-pulse" />
          ) : weatherError ? (
            <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">{weatherError}</div>
          ) : weather ? (
            <article className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900">{weather.city}, {weather.country}</h3>
              <p className="text-gray-600 mt-1">{weather.description}</p>
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div><span className="text-gray-500">Темп.</span><p>{weather.temperature_c.toFixed(1)} C</p></div>
                <div><span className="text-gray-500">Ощущается</span><p>{weather.feels_like_c.toFixed(1)} C</p></div>
                <div><span className="text-gray-500">Влажность</span><p>{weather.humidity}%</p></div>
                <div><span className="text-gray-500">Ветер</span><p>{weather.wind_speed.toFixed(1)} м/с</p></div>
              </div>
            </article>
          ) : (
            <div className="text-sm text-gray-600">Нет данных для отображения.</div>
          )}
        </section>
      </div>
    </main>
  );
};
