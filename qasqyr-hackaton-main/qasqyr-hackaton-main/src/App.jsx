import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import TestProgressSystem from './components/TestProgressSystem'
import Login from './components/auth/Login'
import Signup from './components/auth/Signup'
import ProfilePage from './components/profile/ProfilePage'
import ModuleDetailsPage from './components/modules/ModuleDetailsPage'
import TeacherPanel from './components/teacher/TeacherPanel'
import TeacherProfile from './components/teacher/TeacherProfile'
import SettingsPage from './components/settings/SettingsPage'
import PomodoroTimer from './components/pomodoro/PomodoroTimer'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Topic from "./components/topic/Topic.jsx";
import PassingQuiz from "./components/modules/PassingQuiz.jsx";
import WelcomePage from "./components/WelcomePage.jsx";

function App() {
  // Protected route component
  const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, currentUser, tokens } = useAuth();
    console.log('ProtectedRoute - Tokens:', tokens);

    if (!isAuthenticated) {
      return <Navigate to="/login" />;
    }

    return children;
  };

  const TeacherRoute = ({ children }) => {
    const { isAuthenticated, currentUser, isTeacher } = useAuth();
    console.log('TeacherRoute - isAuthenticated:', isAuthenticated);
    console.log('TeacherRoute - isTeacher:', isTeacher);

    if (!isAuthenticated) {
      console.log('TeacherRoute - Not authenticated, redirecting to login');
      return <Navigate to="/login" />;
    }

    // Check if the user has the teacher role
    if (!isTeacher) {
      console.log('TeacherRoute - Not a teacher, redirecting to profile');
      return <Navigate to="/profile" />;
    }

    return children;
  };

  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/" element={<WelcomePage />} />
            <Route path="/profile" element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            } />
            <Route path="/topics/:id" element={
              <ProtectedRoute>
                <Topic />
              </ProtectedRoute>
            } />
            <Route path="/pass-topic/:id" element={
              <ProtectedRoute>
                <PassingQuiz />
              </ProtectedRoute>
            } />
            <Route path="/modules/:id" element={
              <ProtectedRoute>
                <ModuleDetailsPage />
              </ProtectedRoute>
            } />
            <Route path="/teacher" element={
              <TeacherRoute>
                <TeacherPanel />
              </TeacherRoute>
            } />
            <Route path="/teacher/profile" element={
              <TeacherRoute>
                <TeacherProfile />
              </TeacherRoute>
            } />
            <Route path="/" element={
              <ProtectedRoute>
                <TestProgressSystem />
              </ProtectedRoute>
            } />
          </Routes>

          {/* Pomodoro Timer (always rendered, but only displays when enabled in settings) */}
          <PomodoroTimer />
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App
