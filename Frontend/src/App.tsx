import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { HomePage } from './pages/HomePage';
import { AboutPage } from './pages/AboutPage';
import { ProfilePage } from './pages/ProfilePage';
import { ForbiddenPage } from './pages/ForbiddenPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { PrivateRoute } from './components/PrivateRoute';
import './App.css';

const ChatsPage = lazy(() => import('./pages/ChatsPage').then(m => ({ default: m.ChatsPage })));
const ChatPage = lazy(() => import('./pages/ChatPage').then(m => ({ default: m.ChatPage })));
const AdminPage = lazy(() => import('./pages/AdminPage').then(m => ({ default: m.AdminPage })));

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/forbidden" element={<ForbiddenPage />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <HomePage />
            </PrivateRoute>
          }
        />
        <Route
          path="/chats"
          element={
            <Suspense fallback={<div className="p-8">Loading...</div>}>
              <PrivateRoute>
                <ChatsPage />
              </PrivateRoute>
            </Suspense>
          }
        />
        <Route
          path="/chats/:chatId"
          element={
            <Suspense fallback={<div className="p-8">Loading...</div>}>
              <PrivateRoute>
                <ChatPage />
              </PrivateRoute>
            </Suspense>
          }
        />
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <ProfilePage />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <Suspense fallback={<div className="p-8">Loading...</div>}>
              <PrivateRoute allowedRoles={['admin']}>
                <AdminPage />
              </PrivateRoute>
            </Suspense>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
}

export default App;
