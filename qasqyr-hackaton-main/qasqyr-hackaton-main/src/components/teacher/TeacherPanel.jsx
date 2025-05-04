import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function TeacherPanel() {
  const { currentUser, tokens, logout, userRole } = useAuth();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [modules, setModules] = useState([]);
  const [topicAnalytics, setTopicAnalytics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analytics, setAnalytics] = useState({
    totalStudents: 0,
    completedModules: 0,
    averageProgress: 0,
    studentsWithoutProgress: 0,
    activeStudentsToday: 0,
    activeStudentsWeek: 0
  });

  const API_URL = 'http://172.20.10.2:8080/api';

  // Check if user has teacher role
  useEffect(() => {
    if (!tokens?.access_token) {
      navigate('/login');
      return;
    }

    // Verify the user has the teacher role
    if (!userRole || userRole !== 'TEACHER') {
      setError('У вас нет доступа к панели преподавателя');
      setTimeout(() => {
        navigate('/profile');
      }, 3000);
    }
  }, [tokens, navigate, userRole]);

  // Fetch students data
  useEffect(() => {
    // Mock data setup function
    const setupMockData = () => {
      // Mock students data
      const mockStudents = [
        { id: '1', name: 'Иван Иванов', email: 'ivan@example.com', progress: 75, lastActive: '2023-05-01', completedModules: 3, activeToday: true },
        { id: '2', name: 'Мария Петрова', email: 'maria@example.com', progress: 92, lastActive: '2023-05-03', completedModules: 4, activeToday: true },
        { id: '3', name: 'Алексей Смирнов', email: 'alexey@example.com', progress: 45, lastActive: '2023-04-25', completedModules: 2, activeToday: false },
        { id: '4', name: 'Екатерина Козлова', email: 'ekaterina@example.com', progress: 65, lastActive: '2023-05-02', completedModules: 3, activeToday: true },
        { id: '5', name: 'Дмитрий Новиков', email: 'dmitry@example.com', progress: 10, lastActive: '2023-04-15', completedModules: 0, activeToday: false },
        { id: '6', name: 'Ольга Соколова', email: 'olga@example.com', progress: 88, lastActive: '2023-05-03', completedModules: 4, activeToday: true },
        { id: '7', name: 'Сергей Морозов', email: 'sergey@example.com', progress: 33, lastActive: '2023-04-20', completedModules: 1, activeToday: false },
        { id: '8', name: 'Анна Волкова', email: 'anna@example.com', progress: 52, lastActive: '2023-04-28', completedModules: 2, activeToday: false },
        { id: '9', name: 'Павел Лебедев', email: 'pavel@example.com', progress: 78, lastActive: '2023-05-01', completedModules: 3, activeToday: false },
        { id: '10', name: 'Елена Кузнецова', email: 'elena@example.com', progress: 95, lastActive: '2023-05-03', completedModules: 4, activeToday: true },
      ];

      // Mock modules data
      const mockModules = [
        { id: '1', name: 'Основы программирования', students: 45, completionRate: 68, topPerformers: 12, averageScore: 82 },
        { id: '2', name: 'Алгоритмы и структуры данных', students: 32, completionRate: 54, topPerformers: 8, averageScore: 76 },
        { id: '3', name: 'Базы данных', students: 38, completionRate: 72, topPerformers: 14, averageScore: 85 },
        { id: '4', name: 'Веб-разработка', students: 41, completionRate: 65, topPerformers: 10, averageScore: 79 }
      ];

      // Mock topic analytics data
      const mockTopicAnalytics = [
        { id: '1', name: 'Python Syntax', completion: 87, difficulty: 'Low', averageAttempts: 1.2 },
        { id: '2', name: 'Data Structures', completion: 64, difficulty: 'Medium', averageAttempts: 2.5 },
        { id: '3', name: 'Algorithms', completion: 58, difficulty: 'High', averageAttempts: 3.1 },
        { id: '4', name: 'OOP Concepts', completion: 72, difficulty: 'Medium', averageAttempts: 1.8 },
        { id: '5', name: 'Web Frameworks', completion: 61, difficulty: 'Medium', averageAttempts: 2.2 }
      ];

      setStudents(mockStudents);
      setModules(mockModules);
      setTopicAnalytics(mockTopicAnalytics);

      // Calculate analytics
      const totalStudents = mockStudents.length;
      const completedModules = mockStudents.reduce((total, student) => total + student.completedModules, 0);
      const averageProgress = totalStudents > 0
        ? mockStudents.reduce((total, student) => total + student.progress, 0) / totalStudents
        : 0;
      const studentsWithoutProgress = mockStudents.filter(student => student.progress < 10).length;
      const activeStudentsToday = mockStudents.filter(student => student.activeToday).length;
      const activeStudentsWeek = mockStudents.filter(student =>
        new Date(student.lastActive) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      ).length;

      setAnalytics({
        totalStudents,
        completedModules,
        averageProgress,
        studentsWithoutProgress,
        activeStudentsToday,
        activeStudentsWeek
      });

      setLoading(false);
    };

    // Either fetch from API or use mock data
    if (tokens?.access_token) {
      setupMockData(); // For now, we'll use mock data
    }
  }, [tokens]);

  const handleLogout = async () => {
    try {
      logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-6 py-4 rounded-lg max-w-md text-center">
          <h3 className="text-xl font-medium mb-2">Ошибка</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      {/* Header */}
      <header className="py-6 px-8 flex justify-between items-center border-b border-gray-700">
        <div className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-600 bg-clip-text text-transparent">
          Qasqyr AI
        </div>
        <h1 className="text-2xl font-semibold">Панель преподавателя</h1>
        <div className="flex items-center gap-4">
          {currentUser && (
            <>
              <div className="text-sm text-gray-300">
                <span className="opacity-70">Преподаватель: </span>
                <span className="font-medium text-blue-300">{currentUser.username || currentUser.email || "Преподаватель"}</span>
              </div>
              <Link
                to="/teacher/profile"
                className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors duration-200"
              >
                Мой Профиль
              </Link>
              <Link
                to="/settings"
                className="px-4 py-2 text-sm bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors duration-200"
              >
                Настройки
              </Link>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors duration-200"
              >
                Выйти
              </button>
            </>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Analytics Overview */}
          <section>
            <h2 className="text-xl font-medium mb-4">Общая статистика</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-gray-800/60 p-6 rounded-xl border border-gray-700/50 shadow-lg">
                <div className="text-4xl font-bold text-blue-400 mb-2">{analytics.totalStudents}</div>
                <div className="text-gray-300">Всего студентов</div>
              </div>
              <div className="bg-gray-800/60 p-6 rounded-xl border border-gray-700/50 shadow-lg">
                <div className="text-4xl font-bold text-green-400 mb-2">{analytics.completedModules}</div>
                <div className="text-gray-300">Завершенных модулей</div>
              </div>
              <div className="bg-gray-800/60 p-6 rounded-xl border border-gray-700/50 shadow-lg">
                <div className="text-4xl font-bold text-yellow-400 mb-2">{Math.round(analytics.averageProgress)}%</div>
                <div className="text-gray-300">Средний прогресс</div>
              </div>
              <div className="bg-gray-800/60 p-6 rounded-xl border border-gray-700/50 shadow-lg">
                <div className="text-4xl font-bold text-red-400 mb-2">{analytics.studentsWithoutProgress}</div>
                <div className="text-gray-300">Студентов без прогресса</div>
              </div>
              <div className="bg-gray-800/60 p-6 rounded-xl border border-gray-700/50 shadow-lg">
                <div className="text-4xl font-bold text-purple-400 mb-2">{analytics.activeStudentsToday}</div>
                <div className="text-gray-300">Активных сегодня</div>
              </div>
              <div className="bg-gray-800/60 p-6 rounded-xl border border-gray-700/50 shadow-lg">
                <div className="text-4xl font-bold text-indigo-400 mb-2">{analytics.activeStudentsWeek}</div>
                <div className="text-gray-300">Активных за неделю</div>
              </div>
            </div>
          </section>

          {/* Module Statistics */}
          <section>
            <h2 className="text-xl font-medium mb-4">Статистика по модулям</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {modules.map((module) => (
                <div key={module.id} className="bg-gray-800/60 p-6 rounded-xl border border-gray-700/50 shadow-lg">
                  <h3 className="font-medium text-lg mb-3">{module.name}</h3>
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-300">Студентов записано:</span>
                      <span className="font-medium">{module.students}</span>
                    </div>
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-300">Процент завершения:</span>
                      <span className={`font-medium ${module.completionRate > 70 ? 'text-green-400' :
                        module.completionRate > 30 ? 'text-yellow-400' : 'text-red-400'
                        }`}>{module.completionRate}%</span>
                    </div>
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-300">Лучших учеников:</span>
                      <span className="font-medium text-indigo-400">{module.topPerformers}</span>
                    </div>
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-300">Средний балл:</span>
                      <span className="font-medium text-blue-400">{module.averageScore}/100</span>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-gray-700 rounded-full">
                    <div
                      className={`h-2 rounded-full ${module.completionRate > 70 ? 'bg-green-500' :
                        module.completionRate > 30 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                      style={{ width: `${module.completionRate}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Topic Difficulty Analysis */}
          <section>
            <h2 className="text-xl font-medium mb-4">Анализ сложности тем</h2>
            <div className="overflow-hidden rounded-xl border border-gray-700/50 shadow-lg bg-gray-800/60">
              <table className="w-full">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Тема</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Завершаемость</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Сложность</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Среднее число попыток</th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800/40 divide-y divide-gray-700">
                  {topicAnalytics.map((topic) => (
                    <tr key={topic.id} className="hover:bg-gray-700/30 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium">{topic.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-24 h-2 bg-gray-700 rounded-full mr-3">
                            <div
                              className={`h-2 rounded-full ${topic.completion > 70 ? 'bg-green-500' :
                                topic.completion > 30 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                              style={{ width: `${topic.completion}%` }}
                            ></div>
                          </div>
                          <span>{topic.completion}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${topic.difficulty === 'High' ? 'bg-red-500/20 text-red-300' :
                          topic.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-300' :
                            'bg-green-500/20 text-green-300'
                          }`}>
                          {topic.difficulty}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                        {topic.averageAttempts.toFixed(1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Student Progress */}
          <section>
            <h2 className="text-xl font-medium mb-4">Прогресс студентов</h2>
            <div className="overflow-hidden rounded-xl border border-gray-700/50 shadow-lg">
              <table className="w-full">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Студент</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Прогресс</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Завершено модулей</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Последняя активность</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Статус</th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800/40 divide-y divide-gray-700">
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-700/30 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-9 w-9 rounded-full bg-indigo-600 flex items-center justify-center mr-3 text-white font-medium">
                            {student.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-medium">{student.name}</div>
                            <div className="text-gray-400 text-sm">{student.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-24 h-2 bg-gray-700 rounded-full mr-3">
                            <div
                              className={`h-2 rounded-full ${student.progress > 70 ? 'bg-green-500' :
                                student.progress > 30 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                              style={{ width: `${student.progress}%` }}
                            ></div>
                          </div>
                          <span>{student.progress}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {student.completedModules}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                        {student.lastActive}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {student.activeToday ? (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-500/20 text-green-300">Активен</span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-500/20 text-gray-300">Не активен</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
} 