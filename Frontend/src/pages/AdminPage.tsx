import React from 'react';

export const AdminPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto bg-white rounded-xl border border-gray-200 shadow-sm p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Панель администратора</h1>
        <p className="text-gray-600">
          Техническая страница для проверки RBAC на frontend. Доступ только для роли <code>admin</code>.
        </p>
      </div>
    </div>
  );
};
