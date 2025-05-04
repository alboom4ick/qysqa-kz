import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Navigation = () => {
  const { currentUser, userRole, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-gray-800/80 backdrop-blur-sm shadow-lg border-b border-gray-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-600 bg-clip-text text-transparent">
              Qasqyr AI
            </Link>
          </div>

          <nav className="flex items-center space-x-4">
            <Link
              to="/"
              className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
            >
              Главная
            </Link>

            <Link
              to="/profile"
              className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
            >
              Профиль
            </Link>

            <Link
              to="/settings"
              className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
            >
              Настройки
            </Link>

            {userRole === 'TEACHER' && (
              <Link
                to="/teacher"
                className="text-blue-300 hover:text-blue-200 px-3 py-2 rounded-md text-sm font-medium"
              >
                Панель учителя
              </Link>
            )}

            <button
              onClick={handleLogout}
              className="text-red-300 hover:text-red-200 hover:bg-red-500/10 px-3 py-2 rounded-md text-sm font-medium"
            >
              Выйти
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Navigation; 