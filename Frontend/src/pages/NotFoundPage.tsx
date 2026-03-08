import React from 'react';
import { Link } from 'react-router-dom';
import { SeoMeta } from '../components/seo/SeoMeta';

export const NotFoundPage: React.FC = () => {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <SeoMeta
        title="Страница не найдена - AnonifyNeuro"
        description="Запрошенная страница отсутствует или была перемещена."
        path="/404"
        noindex
      />
      <section className="bg-white border border-gray-200 rounded-2xl p-10 text-center max-w-lg w-full">
        <h1 className="text-4xl font-bold text-gray-900">404</h1>
        <p className="text-gray-600 mt-2">Страница не найдена.</p>
        <Link to="/about" className="inline-block mt-6 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
          На публичную страницу
        </Link>
      </section>
    </main>
  );
};
