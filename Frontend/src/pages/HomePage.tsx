import React from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/auth';
import { Button } from '../components/ui/Button';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout failed', error);
    } finally {
      localStorage.removeItem('access_token');
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6 flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">AnonifyNeuro</h1>
          <div className="w-32">
            <Button variant="outline" onClick={handleLogout}>
              Sign out
            </Button>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Welcome!</h2>
          <p className="text-gray-600">
            You are successfully logged in. This is the dashboard where you will be able to upload images for license plate redaction.
          </p>
        </div>
      </div>
    </div>
  );
};
