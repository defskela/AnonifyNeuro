import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../api/auth';
import { Button } from '../components/ui/Button';
import type { User } from '../types/auth';

export const ProfilePage: React.FC = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);

    const [formData, setFormData] = useState({
        username: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const userData = await authApi.getProfile();
            setUser(userData);
            setFormData(prev => ({ ...prev, username: userData.username }));
        } catch (err) {
            if (err)
                navigate('/login');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (formData.password && formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        try {
            setIsLoading(true);
            const updateData: { username?: string; password?: string } = {};

            if (formData.username !== user?.username) {
                updateData.username = formData.username;
            }

            if (formData.password) {
                updateData.password = formData.password;
            }

            if (Object.keys(updateData).length === 0) {
                setIsEditing(false);
                return;
            }

            const response = await authApi.updateProfile(updateData);

            if (response.jwt_token) {
                localStorage.setItem('access_token', response.jwt_token);
            }

            setSuccess('Profile updated successfully');
            setIsEditing(false);
            fetchProfile();
        } catch (err) {
            setError('Failed to update profile');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading && !user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-xl shadow-lg p-6 flex justify-between items-center mb-8">
                    <Link to="/" className="text-2xl font-bold text-gray-900 hover:text-indigo-600 transition-colors">
                        AnonifyNeuro
                    </Link>
                    <div className="flex gap-4 items-center">
                        <Link to="/chats" className="text-gray-600 hover:text-indigo-600 font-medium">
                            Чаты
                        </Link>
                        <div className="w-32">
                            <Button variant="outline" onClick={() => navigate('/')}>
                                На главную
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-white">
                        <h1 className="text-3xl font-bold mb-2">Мой профиль</h1>
                        <p className="opacity-90">Управление настройками аккаунта</p>
                    </div>

                    <div className="p-8">
                        {error && (
                            <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="mb-6 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg">
                                {success}
                            </div>
                        )}

                        {!isEditing ? (
                            <div className="space-y-6">
                                <div>
                                    <label className="text-sm font-medium text-gray-500 uppercase tracking-wider">Username</label>
                                    <p className="mt-1 text-xl font-medium text-gray-900">{user?.username}</p>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-500 uppercase tracking-wider">Email</label>
                                    <p className="mt-1 text-xl font-medium text-gray-900">{user?.email}</p>
                                </div>

                                <div className="pt-6 border-t border-gray-100">
                                    <Button onClick={() => setIsEditing(true)}>
                                        Изменить
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                                    <input
                                        type="text"
                                        value={formData.username}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        New Password
                                        <span className="text-gray-400 font-normal ml-2">(leave blank to keep current)</span>
                                    </label>
                                    <input
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                                    <input
                                        type="password"
                                        value={formData.confirmPassword}
                                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                                    />
                                </div>

                                <div className="pt-6 border-t border-gray-100 flex gap-4">
                                    <Button type="submit" isLoading={isLoading} disabled={isLoading}>
                                        Save Changes
                                    </Button>
                                    <Button type="button" variant="outline" onClick={() => {
                                        setIsEditing(false);
                                        setFormData(prev => ({ ...prev, username: user?.username || '' }));
                                        setError('');
                                    }}>
                                        Cancel
                                    </Button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
