import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const TeacherProfile = () => {
  const { currentUser, tokens, userRole, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modules, setModules] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [selectedModule, setSelectedModule] = useState(null);
  const [topicMode, setTopicMode] = useState('view'); // 'view' or 'edit'
  const [topicFormData, setTopicFormData] = useState({
    name: '',
    description: '',
    order: 1
  });
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    level: 1,
    hours: 1,
    duration: 60
  });

  const API_URL = 'http://172.20.10.2:8080/api';

  useEffect(() => {
    // Check if user is a teacher
    if (userRole !== 'TEACHER') {
      navigate('/profile');
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch teacher profile
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

        // Fetch created modules
        const modulesResponse = await fetch(`${API_URL}/modules/created`, {
          headers: {
            'Authorization': `Bearer ${tokens?.access_token}`
          }
        });

        if (modulesResponse.ok) {
          const modulesData = await modulesResponse.json();
          setModules(modulesData);
        } else {
          // Mock data if API not available
          setModules([
            {
              id: '1',
              name: 'Основы программирования',
              description: 'Вводный курс по основам программирования и алгоритмизации',
              createdAt: '2023-01-15',
              studentCount: 78,
              completionRate: 65,
              difficulty: 1,
              duration: 60,
              questionNumbers: 24,
              passedUsersCount: 125,
              topics: [
                { id: '1', topicId: '1', topicName: 'Переменные и типы данных' },
                { id: '2', topicId: '2', topicName: 'Условные операторы' },
                { id: '3', topicId: '3', topicName: 'Циклы' }
              ]
            },
            {
              id: '2',
              name: 'Web-разработка',
              description: 'Введение в HTML, CSS и JavaScript',
              createdAt: '2023-02-20',
              studentCount: 54,
              completionRate: 42,
              difficulty: 2,
              duration: 45,
              questionNumbers: 30,
              passedUsersCount: 87,
              topics: [
                { id: '4', topicId: '4', topicName: 'HTML основы' },
                { id: '5', topicId: '5', topicName: 'CSS стили' },
                { id: '6', topicId: '6', topicName: 'JavaScript основы' }
              ]
            },
            {
              id: '3',
              name: 'Базы данных',
              description: 'Курс по основам баз данных и SQL',
              createdAt: '2023-03-10',
              studentCount: 45,
              completionRate: 38,
              difficulty: 3,
              duration: 90,
              questionNumbers: 40,
              passedUsersCount: 215,
              topics: [
                { id: '7', topicId: '7', topicName: 'Модели данных' },
                { id: '8', topicId: '8', topicName: 'SQL запросы' },
                { id: '9', topicId: '9', topicName: 'Нормализация' }
              ]
            }
          ]);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Ошибка при загрузке данных');
      } finally {
        setLoading(false);
      }
    };

    if (tokens?.access_token) {
      fetchData();
    }
  }, [tokens, navigate, userRole]);

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
      setLoading(true);

      // In a real app, this would send data to your API
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

      // Add the new module to the list (in a real app, you'd refetch or use the response)
      const newModule = {
        id: Date.now().toString(),
        name: formData.title,
        description: formData.description,
        createdAt: new Date().toISOString().split('T')[0],
        studentCount: 0,
        completionRate: 0,
        difficulty: formData.level,
        duration: formData.duration,
        questionNumbers: 0,
        passedUsersCount: 0,
        topics: []
      };

      setModules([newModule, ...modules]);
      setShowCreateModal(false);
      setFormData({
        title: '',
        description: '',
        level: 1,
        hours: 1,
        duration: 60
      });
    } catch (error) {
      console.error('Error creating module:', error);
      setError('Ошибка при создании модуля');
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyText = (level) => {
    switch (level) {
      case 1: return 'Начальный';
      case 2: return 'Средний';
      case 3: return 'Продвинутый';
      default: return 'Неизвестный';
    }
  };

  // Handle opening topic modal for viewing or editing
  const handleTopicClick = (topic, module, mode = 'view') => {
    setSelectedTopic(topic);
    setSelectedModule(module);
    setTopicMode(mode);

    if (mode === 'edit') {
      setTopicFormData({
        name: topic.topicName,
        description: topic.description || '',
        order: topic.order || 1
      });
    }

    setShowTopicModal(true);
  };

  // Handle for adding a new topic to a module
  const handleAddTopic = (module) => {
    setSelectedModule(module);
    setSelectedTopic(null);
    setTopicMode('edit');
    setTopicFormData({
      name: '',
      description: '',
      order: module.topics ? module.topics.length + 1 : 1
    });
    setShowTopicModal(true);
  };

  // Handle topic form input changes
  const handleTopicInputChange = (e) => {
    const { name, value } = e.target;
    setTopicFormData({
      ...topicFormData,
      [name]: name === 'order' ? parseInt(value) : value
    });
  };

  // Handle topic form submission
  const handleTopicSubmit = async (e) => {
    e.preventDefault();

    try {
      // In a real app, you would make an API call here
      // For now, we'll just update the local state

      const updatedModules = modules.map(module => {
        if (module.id === selectedModule.id) {
          const updatedTopics = [...module.topics];

          if (selectedTopic) {
            // Editing existing topic
            const topicIndex = updatedTopics.findIndex(
              t => t.id === selectedTopic.id || t.topicId === selectedTopic.topicId
            );

            if (topicIndex !== -1) {
              updatedTopics[topicIndex] = {
                ...updatedTopics[topicIndex],
                topicName: topicFormData.name,
                description: topicFormData.description,
                order: topicFormData.order
              };
            }
          } else {
            // Adding new topic
            const newTopic = {
              id: `new-${Date.now()}`,
              topicId: `new-${Date.now()}`,
              topicName: topicFormData.name,
              description: topicFormData.description,
              order: topicFormData.order
            };
            updatedTopics.push(newTopic);
          }

          return {
            ...module,
            topics: updatedTopics
          };
        }
        return module;
      });

      setModules(updatedModules);
      setShowTopicModal(false);

    } catch (error) {
      console.error('Error saving topic:', error);
    }
  };

  if (loading && !profile) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-6 py-4 rounded-lg max-w-md text-center">
          <h3 className="text-xl font-medium mb-2">Ошибка</h3>
          <p>{error}</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-4 py-2 bg-red-600/50 hover:bg-red-600/70 rounded-lg transition-colors"
          >
            На главную
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <header className="py-6 px-8 flex justify-between items-center border-b border-gray-700">
        <Link to="/" className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-600 bg-clip-text text-transparent">
          Qasqyr AI
        </Link>
        <h1 className="text-2xl font-semibold">Профиль преподавателя</h1>
        <nav className="flex items-center gap-4">
          <Link
            to="/teacher"
            className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors duration-200"
          >
            Панель преподавателя
          </Link>
          <Link
            to="/settings"
            className="px-4 py-2 text-sm bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors duration-200"
          >
            Настройки
          </Link>
          <button
            onClick={() => logout()}
            className="px-4 py-2 text-sm bg-red-600/50 hover:bg-red-600/70 rounded-lg transition-colors duration-200"
          >
            Выйти
          </button>
        </nav>
      </header>

      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {profile && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Teacher Info Card */}
            <div className="lg:col-span-1 bg-gray-800/60 backdrop-blur-sm p-6 rounded-xl shadow-xl border border-gray-700/50">
              <div className="flex flex-col items-center">
                <div className="w-28 h-28 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-3xl font-bold mb-4">
                  {profile.firstName?.[0] || profile.username?.[0] || 'П'}
                </div>

                <h2 className="text-xl font-bold mb-1">
                  {profile.firstName} {profile.lastName}
                </h2>
                <div className="px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-xs font-medium mt-1 mb-4">
                  Преподаватель
                </div>
                <p className="text-gray-400 mb-4">@{profile.username}</p>

                <div className="w-full border-t border-gray-700 my-4"></div>

                <div className="w-full space-y-4">
                  <div className="flex flex-col">
                    <span className="text-gray-400 text-sm">Электронная почта</span>
                    <span className="font-medium">{profile.email}</span>
                  </div>

                  <div className="flex flex-col">
                    <span className="text-gray-400 text-sm">Дата регистрации</span>
                    <span className="font-medium">{profile.joinedDate ? new Date(profile.joinedDate).toLocaleDateString() : 'Н/Д'}</span>
                  </div>

                  <div className="flex flex-col">
                    <span className="text-gray-400 text-sm">Специализация</span>
                    <span className="font-medium">{profile.specialization || 'Не указана'}</span>
                  </div>
                </div>

                <div className="w-full border-t border-gray-700 my-4"></div>

                <Link
                  to="/settings"
                  className="w-full px-4 py-2 bg-gray-700/50 hover:bg-gray-700 rounded-lg transition-colors text-center mt-2"
                >
                  Редактировать профиль
                </Link>
              </div>
            </div>

            {/* Modules Section */}
            <div className="lg:col-span-3 space-y-6">
              {/* Contact Information */}
              <div className="bg-gray-800/60 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-gray-700/50">
                <h2 className="text-xl font-semibold mb-6">Контактная информация</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="text-gray-400 text-sm mb-1">Телефон</div>
                    <div className="font-medium">{profile.phone || 'Не указан'}</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-sm mb-1">Альтернативный Email</div>
                    <div className="font-medium">{profile.alternativeEmail || 'Не указан'}</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-sm mb-1">Организация</div>
                    <div className="font-medium">{profile.organization || 'Не указана'}</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-sm mb-1">Должность</div>
                    <div className="font-medium">{profile.position || 'Не указана'}</div>
                  </div>
                </div>
              </div>

              {/* Education & Expertise */}
              <div className="bg-gray-800/60 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-gray-700/50">
                <h2 className="text-xl font-semibold mb-6">Образование и экспертиза</h2>
                <div className="space-y-4">
                  <div>
                    <div className="text-gray-400 text-sm mb-1">Образование</div>
                    <div className="font-medium">{profile.education || 'Информация не добавлена'}</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-sm mb-1">Области экспертизы</div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {profile.expertiseAreas ?
                        profile.expertiseAreas.map((area, index) => (
                          <span key={index} className="bg-purple-500/20 text-purple-300 px-2 py-1 text-xs rounded-full">
                            {area}
                          </span>
                        )) :
                        <span className="text-gray-400">Не указаны</span>
                      }
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* My Modules Section - Student Style */}
        <div className="col-span-1 md:col-span-3 bg-gray-800/60 backdrop-blur-sm p-6 rounded-xl shadow-xl border border-gray-700/50 mt-8">
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
                        <div className="flex justify-between items-center mb-2">
                          <div className="text-sm text-gray-400">Темы</div>
                          <button
                            onClick={() => handleAddTopic(module)}
                            className="text-xs text-blue-400 hover:text-blue-300"
                          >
                            + Добавить тему
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {module.topics.map(topic => (
                            <div
                              key={topic.id || topic.topicId}
                              className="group relative"
                            >
                              <span
                                className="bg-blue-500/20 text-blue-300 text-xs px-2 py-1 rounded-full cursor-pointer hover:bg-blue-500/30 transition-colors"
                                onClick={() => handleTopicClick(topic, module)}
                              >
                                {topic.topicName}
                              </span>
                              <div className="absolute top-0 right-0 -mt-1 -mr-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  className="bg-blue-600 hover:bg-blue-700 rounded-full w-4 h-4 flex items-center justify-center"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleTopicClick(topic, module, 'edit');
                                  }}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-4 border-t border-gray-700 flex justify-between">
                    <button
                      className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors"
                    >
                      Редактировать
                    </button>
                    <Link
                      to={`/modules/${module.id}`}
                      className="px-3 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 rounded-lg text-sm font-medium transition-all"
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

      {/* Topic View/Edit Modal */}
      {showTopicModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl border border-gray-700 shadow-2xl w-full max-w-md p-6 relative">
            <button
              onClick={() => setShowTopicModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h2 className="text-2xl font-bold mb-6">
              {topicMode === 'view' ? 'Просмотр темы' : (selectedTopic ? 'Редактировать тему' : 'Новая тема')}
            </h2>

            {topicMode === 'view' && selectedTopic && (
              <div className="space-y-4">
                <div>
                  <div className="text-gray-400 text-sm">Название темы</div>
                  <div className="text-xl font-medium mt-1">{selectedTopic.topicName}</div>
                </div>

                {selectedTopic.description && (
                  <div>
                    <div className="text-gray-400 text-sm">Описание</div>
                    <div className="mt-1">{selectedTopic.description}</div>
                  </div>
                )}

                <div>
                  <div className="text-gray-400 text-sm">Модуль</div>
                  <div className="mt-1">{selectedModule?.name}</div>
                </div>

                <div className="flex justify-between pt-4 mt-4 border-t border-gray-700">
                  <button
                    onClick={() => setShowTopicModal(false)}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors"
                  >
                    Закрыть
                  </button>
                  <button
                    onClick={() => setTopicMode('edit')}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm transition-colors"
                  >
                    Редактировать
                  </button>
                </div>
              </div>
            )}

            {topicMode === 'edit' && (
              <form onSubmit={handleTopicSubmit} className="space-y-4">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2" htmlFor="name">
                    Название темы
                  </label>
                  <input
                    id="name"
                    type="text"
                    name="name"
                    value={topicFormData.name}
                    onChange={handleTopicInputChange}
                    required
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-200"
                    placeholder="Название темы"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2" htmlFor="description">
                    Описание
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={topicFormData.description}
                    onChange={handleTopicInputChange}
                    rows="3"
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-200"
                    placeholder="Описание темы"
                  ></textarea>
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2" htmlFor="order">
                    Порядок
                  </label>
                  <input
                    id="order"
                    type="number"
                    name="order"
                    min="1"
                    value={topicFormData.order}
                    onChange={handleTopicInputChange}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-200"
                  />
                </div>

                <div className="flex justify-between pt-4 mt-4 border-t border-gray-700">
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedTopic) {
                        setTopicMode('view');
                      } else {
                        setShowTopicModal(false);
                      }
                    }}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors"
                  >
                    {selectedTopic ? 'Отменить' : 'Закрыть'}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm transition-colors"
                  >
                    {selectedTopic ? 'Сохранить' : 'Добавить'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherProfile; 