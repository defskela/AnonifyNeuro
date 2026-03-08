import React from 'react';
import { Link } from 'react-router-dom';
import { SeoMeta } from '../components/seo/SeoMeta';

export const AboutPage: React.FC = () => {
  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <SeoMeta
        title="AnonifyNeuro - Анонимизация изображений с ИИ"
        description="Публичная страница AnonifyNeuro: безопасная обработка изображений и скрытие конфиденциальных данных с помощью нейросетей."
        path="/about"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: 'AnonifyNeuro',
          applicationCategory: 'SecurityApplication',
          operatingSystem: 'Web',
          description: 'Веб-приложение для скрытия конфиденциальных данных на изображениях.',
        }}
      />

      <div className="max-w-4xl mx-auto bg-white rounded-2xl border border-gray-200 shadow-sm p-8 space-y-8">
        <header>
          <h1 className="text-3xl font-bold text-gray-900">AnonifyNeuro</h1>
          <p className="mt-3 text-gray-600">
            Платформа для автоматической анонимизации изображений и защиты персональных данных.
          </p>
        </header>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-3">Что делает сервис</h2>
          <div className="space-y-2 text-gray-700">
            <h3 className="font-semibold">Обнаружение чувствительных фрагментов</h3>
            <p>Нейросеть находит потенциально опасные зоны, включая автомобильные номера.</p>
            <h3 className="font-semibold">Безопасная обработка</h3>
            <p>Пользователь получает результат с закрытыми конфиденциальными областями.</p>
            <h3 className="font-semibold">Работа в формате чатов</h3>
            <p>Все действия сгруппированы по чатам для удобства и прозрачной истории обработки.</p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-3">Как начать</h2>
          <p className="text-gray-700 mb-4">
            Зарегистрируйте аккаунт и начните работу с изображениями через защищенный личный кабинет.
          </p>
          <div className="flex gap-3">
            <Link to="/register" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Регистрация</Link>
            <Link to="/login" className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Вход</Link>
          </div>
        </section>
      </div>
    </main>
  );
};
