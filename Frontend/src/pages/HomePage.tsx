import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../api/auth';
import { session } from '../auth/session';
import { Button } from '../components/ui/Button';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const role = session.getRole();

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
    <div className="min-h-screen bg-gray-50 p-8">
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

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Добро пожаловать!</h2>
          <p className="text-gray-600 mb-4">
            Вы успешно вошли в систему. Здесь вы можете загружать изображения для скрытия номерных знаков.
          </p>
          <Link to="/chats">
            <Button variant="gradient">Перейти к чатам</Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
