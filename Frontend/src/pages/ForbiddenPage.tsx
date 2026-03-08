import React from 'react';
import { Link } from 'react-router-dom';

export const ForbiddenPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-lg w-full bg-white border border-gray-200 rounded-xl shadow-sm p-8 text-center">
        <p className="text-sm font-medium text-red-600 mb-2">403 Forbidden</p>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Недостаточно прав доступа</h1>
        <p className="text-gray-600 mb-6">
          У вашей роли нет прав на просмотр этой страницы.
        </p>
        <Link
          to="/"
          className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
        >
          Вернуться на главную
        </Link>
      </div>
    </div>
  );
};
