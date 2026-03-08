import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { authApi } from '../api/auth';
import { getErrorStatus } from '../utils/httpError';
import type { User, UserRole } from '../types/auth';

export const AdminPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [draftRoles, setDraftRoles] = useState<Record<number, UserRole>>({});
  const [savingUserId, setSavingUserId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let mounted = true;
    authApi
      .listUsers()
      .then((responseUsers) => {
        if (!mounted) {
          return;
        }
        setUsers(responseUsers);
        const nextDrafts: Record<number, UserRole> = {};
        responseUsers.forEach((user) => {
          nextDrafts[user.id] = user.role;
        });
        setDraftRoles(nextDrafts);
      })
      .catch((err: unknown) => {
        if (!mounted) {
          return;
        }
        if (getErrorStatus(err) === 403) {
          setError('Недостаточно прав для управления ролями.');
        } else {
          setError('Не удалось загрузить пользователей.');
        }
      })
      .finally(() => {
        if (mounted) {
          setIsLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const sortedUsers = useMemo(
    () => [...users].sort((a, b) => a.id - b.id),
    [users]
  );

  const onRoleChange = (userId: number, role: UserRole) => {
    setDraftRoles((prev) => ({ ...prev, [userId]: role }));
    setSuccess('');
    setError('');
  };

  const handleSaveRole = async (user: User) => {
    const nextRole = draftRoles[user.id];
    if (!nextRole || nextRole === user.role) {
      return;
    }

    setSavingUserId(user.id);
    setSuccess('');
    setError('');
    try {
      const updated = await authApi.updateUserRole(user.id, nextRole);
      setUsers((prev) => prev.map((u) => (u.id === user.id ? updated : u)));
      setSuccess(`Роль пользователя ${updated.username} обновлена на ${updated.role}.`);
    } catch (err: unknown) {
      const status = getErrorStatus(err);
      if (status === 403) {
        setError('Недостаточно прав для изменения ролей.');
      } else if (status === 404) {
        setError('Пользователь не найден. Обновите страницу.');
      } else {
        setError('Ошибка обновления роли. Попробуйте еще раз.');
      }
    } finally {
      setSavingUserId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto bg-white rounded-xl border border-gray-200 shadow-sm p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Панель администратора</h1>
            <p className="text-gray-600">Управление ролями пользователей</p>
          </div>
          <Link
            to="/"
            className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
          >
            На главную
          </Link>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-lg border border-red-200 bg-red-50 text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 px-4 py-3 rounded-lg border border-green-200 bg-green-50 text-green-700">
            {success}
          </div>
        )}

        {isLoading ? (
          <div className="py-10 text-center text-gray-600">Загрузка пользователей...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200 rounded-lg overflow-hidden">
              <thead className="bg-gray-100 text-left text-sm text-gray-700">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Username</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Текущая роль</th>
                  <th className="px-4 py-3">Новая роль</th>
                  <th className="px-4 py-3">Действие</th>
                </tr>
              </thead>
              <tbody>
                {sortedUsers.map((user) => {
                  const isDirty = draftRoles[user.id] !== user.role;
                  const isSaving = savingUserId === user.id;
                  return (
                    <tr key={user.id} className="border-t border-gray-200 text-sm">
                      <td className="px-4 py-3">{user.id}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{user.username}</td>
                      <td className="px-4 py-3 text-gray-700">{user.email}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-1 rounded bg-indigo-50 text-indigo-700">
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={draftRoles[user.id] ?? user.role}
                          onChange={(e) => onRoleChange(user.id, e.target.value as UserRole)}
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        >
                          <option value="user">user</option>
                          <option value="admin">admin</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleSaveRole(user)}
                          disabled={!isDirty || isSaving}
                          className="px-3 py-2 rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                          {isSaving ? 'Сохранение...' : 'Сохранить'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
