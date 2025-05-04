import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';

export default function ProfilePage() {
  const { currentUser, tokens } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modules, setModules] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    level: 1,
    hours: 1,
    duration: 60 // in minutes
  });

  const API_URL = 'http://172.20.10.2:8080/api';

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch user profile
        const profileResponse = await fetch(`${API_URL}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${tokens?.access_token}`
          }
        });

        if (!profileResponse.ok) {
          throw new Error('Failed to fetch profile');
        }

        const profileData = await profileResponse.json();
        setProfile(profileData);

        // Fetch modules
        const modulesResponse = await fetch(`${API_URL}/modules/my-linked`, {
          headers: {
            'Authorization': `Bearer ${tokens?.access_token}`
          }
        });

        if (modulesResponse.ok) {
          const modulesData = await modulesResponse.json();
          setModules(modulesData);
        } else {
          // If API is not available, use sample data
          setModules([
            {
              id: '1',
              name: 'Введение в программирование',
              description: 'Основы программирования и алгоритмов',
              difficulty: 1,
              duration: 60,
              questionNumbers: 24,
              passedUsersCount: 125,
              topics: [
                { topicId: '1', topicName: 'Алгоритмы' },
                { topicId: '2', topicName: 'Переменные' }
              ]
            },
            {
              id: '2',
              name: 'Казахский язык',
              description: 'Изучение грамматики и лексики казахского языка',
              difficulty: 2,
              duration: 45,
              questionNumbers: 30,
              passedUsersCount: 87,
              topics: [
                { topicId: '3', topicName: 'Грамматика' },
                { topicId: '4', topicName: 'Лексика' }
              ]
            },
            {
              id: '3',
              name: 'Математика',
              description: 'Основы алгебры и геометрии',
              difficulty: 2,
              duration: 90,
              questionNumbers: 40,
              passedUsersCount: 215,
              topics: [
                { topicId: '5', topicName: 'Алгебра' },
                { topicId: '6', topicName: 'Геометрия' }
              ]
            }
          ]);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    if (tokens?.access_token) {
      fetchData();
    }
  }, [tokens?.access_token]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'level' || name === 'hours' || name === 'duration' ? parseInt(value) : value
    });
  };

  // Create a new module
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(`${API_URL}/modules/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokens?.access_token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Failed to create module');
      }

      // Refresh the modules list
      const refreshResponse = await fetch(`${API_URL}/modules/my-linked`, {
        headers: {
          'Authorization': `Bearer ${tokens?.access_token}`
        }
      });

      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json();
        setModules(refreshData);
      }

      // Close the modal and reset form
      setShowCreateModal(false);
      setFormData({
        title: '',
        description: '',
        level: 1,
        hours: 1,
        duration: 60
      });

    } catch (err) {
      console.error("Error creating module:", err);
      setError('Failed to create module');
    }
  };

  // Render difficulty level as a string
  const getDifficultyText = (level) => {
    switch (level) {
      case 1: return 'Начальный';
      case 2: return 'Средний';
      case 3: return 'Продвинутый';
      default: return 'Неизвестный';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="bg-red-500/10 border border-red-500/50 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <Link to="/" className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-indigo-600 bg-clip-text text-transparent">
            Qasqyr AI
          </Link>
          <h1 className="text-2xl font-medium">Мой Профиль</h1>
          <div className="flex space-x-4">
            <Link to="/settings" className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors duration-200">
              Настройки
            </Link>
            <Link to="/" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors duration-200">
              К занятиям
            </Link>
          </div>
        </div>

        {profile && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Profile Info Card */}
            <div className="col-span-1 bg-gray-800/60 backdrop-blur-sm p-6 rounded-xl shadow-xl border border-gray-700/50">
              <div className="flex flex-col items-center">
                <div className="w-28 h-28 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-3xl font-bold mb-4">
                  {profile.firstName?.[0] || profile.username?.[0] || '?'}
                </div>

                <h2 className="text-xl font-bold mb-1">
                  {profile.firstName} {profile.lastName}
                </h2>
                <p className="text-gray-400 mb-4">@{profile.username}</p>

                <div className="w-full border-t border-gray-700 my-4"></div>

                <div className="w-full space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Email:</span>
                    <span>{profile.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Joined:</span>
                    <span>{new Date(profile.joinedDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Card */}
            <div className="col-span-2 bg-gray-800/60 backdrop-blur-sm p-6 rounded-xl shadow-xl border border-gray-700/50">
              <h2 className="text-xl font-bold mb-6">Статистика</h2>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-gray-700/50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-400">{profile.fireDays || 0}</div>
                  <div className="text-sm text-gray-400">Дней подряд</div>
                </div>

                <div className="bg-gray-700/50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-400">{profile.accuracy ? Math.round(profile.accuracy * 100) : 0}%</div>
                  <div className="text-sm text-gray-400">Точность</div>
                </div>

                <div className="bg-gray-700/50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-purple-400">{(profile.score || 0).toLocaleString()}</div>
                  <div className="text-sm text-gray-400">Очки</div>
                </div>

                <div className="bg-gray-700/50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-400">{profile.answeredQuestionsCount || 0}</div>
                  <div className="text-sm text-gray-400">Ответов</div>
                </div>
              </div>

              <div className="flex space-x-4 mb-4">
                <div className={`py-2 px-4 rounded-full ${profile.wasPlayedToday ? 'bg-green-500/20 text-green-300' : 'bg-gray-700 text-gray-300'}`}>
                  {profile.wasPlayedToday ? '✓ Занимался сегодня' : '✗ Не занимался сегодня'}
                </div>

                <div className={`py-2 px-4 rounded-full ${profile.wasPlayedYesterday ? 'bg-green-500/20 text-green-300' : 'bg-gray-700 text-gray-300'}`}>
                  {profile.wasPlayedYesterday ? '✓ Занимался вчера' : '✗ Не занимался вчера'}
                </div>
              </div>
            </div>

            {/* My Modules Section */}
            <div className="col-span-1 md:col-span-3 bg-gray-800/60 backdrop-blur-sm p-6 rounded-xl shadow-xl border border-gray-700/50">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Мои Модули</h2>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors duration-200"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Создать модуль
                </button>
              </div>

              {modules.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {modules.map(module => (
                    <div key={module.id} className="bg-gray-800/60 backdrop-blur-sm rounded-xl border border-gray-700/50 shadow-xl h-full flex flex-col">
                      <div className="h-40 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-t-xl flex items-center justify-center p-4">
                        {module.imageUrl ? (
                          <img
                            src={module.imageUrl}
                            alt={module.name}
                            className="h-full object-contain rounded"
                          />
                        ) : (
                          <span className="text-2xl font-bold text-center">{module.name}</span>
                        )}
                      </div>

                      <div className="p-5 flex-grow">
                        <h3 className="text-xl font-bold mb-2">{module.name}</h3>
                        <p className="text-gray-300 mb-4 line-clamp-3">{module.description}</p>

                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div className="bg-gray-700/40 p-3 rounded-lg">
                            <div className="text-sm text-gray-400">Сложность</div>
                            <div className="font-medium">
                              {getDifficultyText(module.difficulty)}
                            </div>
                          </div>

                          <div className="bg-gray-700/40 p-3 rounded-lg">
                            <div className="text-sm text-gray-400">Вопросов</div>
                            <div className="font-medium">{module.questionNumbers}</div>
                          </div>

                          <div className="bg-gray-700/40 p-3 rounded-lg">
                            <div className="text-sm text-gray-400">Длительность</div>
                            <div className="font-medium">{module.duration} мин</div>
                          </div>

                          <div className="bg-gray-700/40 p-3 rounded-lg">
                            <div className="text-sm text-gray-400">Прошло</div>
                            <div className="font-medium">{module.passedUsersCount} чел.</div>
                          </div>
                        </div>

                        {module.topics && module.topics.length > 0 && (
                          <div className="mb-4">
                            <div className="text-sm text-gray-400 mb-2">Темы</div>
                            <div className="flex flex-wrap gap-2">
                              {module.topics.map(topic => (
                                <span
                                  key={topic.topicId}
                                  className="bg-blue-500/20 text-blue-300 text-xs px-2 py-1 rounded-full"
                                >
                                  {topic.topicName}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="p-4 border-t border-gray-700">
                        <Link
                          to={`/modules/${module.id}`}
                          className="block w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-center py-2 rounded-lg font-medium transition-all"
                        >
                          Открыть модуль
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-700/30 rounded-lg p-8 text-center">
                  <h3 className="text-xl font-medium mb-2">У вас пока нет модулей</h3>
                  <p className="text-gray-400 mb-4">Создайте свой первый учебный модуль</p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 rounded-lg font-medium transition-all"
                  >
                    Создать модуль
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Create Module Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl border border-gray-700 shadow-2xl w-full max-w-md p-6 relative">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h2 className="text-2xl font-bold mb-6">Создать новый модуль</h2>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Название
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-200"
                    placeholder="Название модуля"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Описание
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                    rows="3"
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-200"
                    placeholder="Описание модуля"
                  ></textarea>
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Уровень сложности
                  </label>
                  <select
                    name="level"
                    value={formData.level}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-200"
                  >
                    <option value={1}>Начальный</option>
                    <option value={2}>Средний</option>
                    <option value={3}>Продвинутый</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">
                      Часы
                    </label>
                    <input
                      type="number"
                      name="hours"
                      min="1"
                      max="100"
                      value={formData.hours}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-200"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">
                      Длительность (мин)
                    </label>
                    <input
                      type="number"
                      name="duration"
                      min="10"
                      max="500"
                      value={formData.duration}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-200"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 rounded-lg font-medium transition-all"
                >
                  Создать модуль
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 