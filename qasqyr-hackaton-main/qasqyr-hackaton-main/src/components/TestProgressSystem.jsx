import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function TestProgressSystem() {
  const { currentUser, tokens } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modules, setModules] = useState([]);

  const API_URL = 'http://172.20.10.2:8080/api';

  useEffect(() => {
    const fetchModules = async () => {
      if (!tokens?.access_token) return;

      try {
        setLoading(true);

        const response = await fetch(`${API_URL}/modules/my-linked`, {
          headers: {
            'Authorization': `Bearer ${tokens.access_token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch modules');
        }

        const modulesData = await response.json();
        setModules(modulesData);

        // If modules are available, redirect to the first one
        if (modulesData && modulesData.length > 0) {
          navigate(`/modules/${modulesData[0].id}`);
        }
      } catch (err) {
        console.error("Error fetching modules:", err);
        setError('Failed to load modules');
      } finally {
        setLoading(false);
      }
    };

    fetchModules();
  }, [tokens, navigate]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-8">
      <div className="max-w-lg w-full bg-gray-800/60 backdrop-blur-sm p-8 rounded-xl shadow-xl border border-gray-700/50 text-center">
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {modules.length === 0 ? (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-blue-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h1 className="text-2xl font-bold mb-4">У вас пока нет модулей</h1>
            <p className="text-gray-300 mb-6">Для начала работы создайте свой первый учебный модуль в профиле.</p>
            <Link
              to="/profile"
              className="inline-block px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 rounded-lg font-medium transition-all"
            >
              Перейти в профиль
            </Link>
          </>
        ) : (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <h1 className="text-xl font-medium">Перенаправление к вашему модулю...</h1>
          </>
        )}
      </div>
    </div>
  );
}