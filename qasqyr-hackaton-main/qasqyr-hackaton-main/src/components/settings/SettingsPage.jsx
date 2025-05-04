import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const SettingsPage = () => {
  const { currentUser, tokens, userRole, logout } = useAuth();
  const navigate = useNavigate();

  // Theme settings
  const [theme, setTheme] = useState('dark');

  // Pomodoro settings
  const [pomodoroEnabled, setPomodoroEnabled] = useState(false);
  const [workDuration, setWorkDuration] = useState(25);
  const [breakDuration, setBreakDuration] = useState(5);
  const [longBreakDuration, setLongBreakDuration] = useState(15);
  const [cyclesBeforeLongBreak, setCyclesBeforeLongBreak] = useState(4);

  // Study settings
  const [notifications, setNotifications] = useState(true);
  const [studyMethod, setStudyMethod] = useState('standard');
  const [autoSave, setAutoSave] = useState(true);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('user_settings');
    if (savedSettings) {
      const parsedSettings = JSON.parse(savedSettings);
      setTheme(parsedSettings.theme || 'dark');
      setPomodoroEnabled(parsedSettings.pomodoroEnabled || false);
      setWorkDuration(parsedSettings.workDuration || 25);
      setBreakDuration(parsedSettings.breakDuration || 5);
      setLongBreakDuration(parsedSettings.longBreakDuration || 15);
      setCyclesBeforeLongBreak(parsedSettings.cyclesBeforeLongBreak || 4);
      setNotifications(parsedSettings.notifications !== undefined ? parsedSettings.notifications : true);
      setStudyMethod(parsedSettings.studyMethod || 'standard');
      setAutoSave(parsedSettings.autoSave !== undefined ? parsedSettings.autoSave : true);
    }
  }, []);

  // Save settings to localStorage
  const saveSettings = () => {
    const settings = {
      theme,
      pomodoroEnabled,
      workDuration,
      breakDuration,
      longBreakDuration,
      cyclesBeforeLongBreak,
      notifications,
      studyMethod,
      autoSave
    };

    localStorage.setItem('user_settings', JSON.stringify(settings));

    // Show success toast
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const [showToast, setShowToast] = useState(false);

  // Reset settings to default
  const resetSettings = () => {
    setTheme('dark');
    setPomodoroEnabled(false);
    setWorkDuration(25);
    setBreakDuration(5);
    setLongBreakDuration(15);
    setCyclesBeforeLongBreak(4);
    setNotifications(true);
    setStudyMethod('standard');
    setAutoSave(true);

    localStorage.removeItem('user_settings');

    // Show reset toast
    setShowResetToast(true);
    setTimeout(() => setShowResetToast(false), 3000);
  };

  const [showResetToast, setShowResetToast] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      {/* Header */}
      <header className="py-6 px-8 flex justify-between items-center border-b border-gray-700">
        <Link to="/" className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-600 bg-clip-text text-transparent">
          Qasqyr AI
        </Link>
        <h1 className="text-2xl font-semibold">Настройки</h1>
        <nav className="flex items-center gap-4">
          <Link
            to="/profile"
            className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors duration-200"
          >
            Мой Профиль
          </Link>
          <Link
            to="/"
            className="px-4 py-2 text-sm bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors duration-200"
          >
            На главную
          </Link>
        </nav>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto py-8 px-4">
        <div className="bg-gray-800/60 backdrop-blur-sm rounded-xl shadow-lg border border-gray-700/50 p-6 mb-6">
          <h2 className="text-xl font-semibold mb-6 pb-3 border-b border-gray-700">Настройки учетной записи</h2>
          <div className="text-gray-300 mb-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
              <div>
                <h3 className="font-medium text-white">Пользователь</h3>
                <p className="text-sm">{currentUser?.username || currentUser?.email || "Пользователь"}</p>
              </div>
              <div className="mt-2 md:mt-0">
                <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs font-medium">
                  {userRole === 'TEACHER' ? 'Преподаватель' : 'Студент'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Appearance settings */}
        <div className="bg-gray-800/60 backdrop-blur-sm rounded-xl shadow-lg border border-gray-700/50 p-6 mb-6">
          <h2 className="text-xl font-semibold mb-6 pb-3 border-b border-gray-700">Внешний вид</h2>
          <div className="mb-4">
            <label className="block mb-2 text-gray-300">Тема</label>
            <div className="flex space-x-4">
              <div
                onClick={() => setTheme('dark')}
                className={`cursor-pointer rounded-lg p-4 border transition-all ${theme === 'dark'
                    ? 'border-blue-500 bg-gray-700'
                    : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                  }`}
              >
                <div className="w-full h-24 bg-gray-900 rounded-lg mb-2 flex items-center justify-center">
                  <div className="w-16 h-3 bg-blue-500 rounded"></div>
                </div>
                <div className="text-center">Темная</div>
              </div>
              <div
                onClick={() => setTheme('light')}
                className={`cursor-pointer rounded-lg p-4 border transition-all ${theme === 'light'
                    ? 'border-blue-500 bg-gray-700'
                    : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                  }`}
              >
                <div className="w-full h-24 bg-gray-200 rounded-lg mb-2 flex items-center justify-center">
                  <div className="w-16 h-3 bg-blue-500 rounded"></div>
                </div>
                <div className="text-center">Светлая</div>
              </div>
            </div>
          </div>
        </div>

        {/* Pomodoro settings */}
        <div className="bg-gray-800/60 backdrop-blur-sm rounded-xl shadow-lg border border-gray-700/50 p-6 mb-6">
          <h2 className="text-xl font-semibold mb-6 pb-3 border-b border-gray-700">Метод Помодоро</h2>

          <div className="mb-4">
            <div className="flex items-center justify-between">
              <label className="text-gray-300">Включить метод Помодоро</label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={pomodoroEnabled}
                  onChange={() => setPomodoroEnabled(!pomodoroEnabled)}
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>

          <div className={pomodoroEnabled ? "opacity-100" : "opacity-50 pointer-events-none"}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
              <div>
                <label className="block mb-2 text-gray-300">Рабочий цикл (минут)</label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={workDuration}
                  onChange={(e) => setWorkDuration(Number(e.target.value))}
                  className="w-full px-4 py-2 rounded-lg border border-gray-600 bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block mb-2 text-gray-300">Перерыв (минут)</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={breakDuration}
                  onChange={(e) => setBreakDuration(Number(e.target.value))}
                  className="w-full px-4 py-2 rounded-lg border border-gray-600 bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
              <div>
                <label className="block mb-2 text-gray-300">Длинный перерыв (минут)</label>
                <input
                  type="number"
                  min="5"
                  max="60"
                  value={longBreakDuration}
                  onChange={(e) => setLongBreakDuration(Number(e.target.value))}
                  className="w-full px-4 py-2 rounded-lg border border-gray-600 bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block mb-2 text-gray-300">Циклов до длинного перерыва</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={cyclesBeforeLongBreak}
                  onChange={(e) => setCyclesBeforeLongBreak(Number(e.target.value))}
                  className="w-full px-4 py-2 rounded-lg border border-gray-600 bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 text-sm text-blue-200">
              <h3 className="font-medium mb-2">О методе Помодоро</h3>
              <p>Метод Помодоро — это техника управления временем, которая помогает повысить продуктивность и концентрацию. Метод разбивает работу на интервалы, обычно по 25 минут, за которыми следуют короткие перерывы.</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Работайте {workDuration} минут</li>
                <li>Отдыхайте {breakDuration} минут</li>
                <li>После {cyclesBeforeLongBreak} циклов сделайте длинный перерыв ({longBreakDuration} минут)</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Study methods */}
        <div className="bg-gray-800/60 backdrop-blur-sm rounded-xl shadow-lg border border-gray-700/50 p-6 mb-6">
          <h2 className="text-xl font-semibold mb-6 pb-3 border-b border-gray-700">Метод обучения</h2>

          <div className="mb-6">
            <label className="block mb-3 text-gray-300">Выберите метод обучения</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div
                onClick={() => setStudyMethod('standard')}
                className={`cursor-pointer p-4 rounded-lg border transition-all ${studyMethod === 'standard'
                    ? 'border-blue-500 bg-gray-700'
                    : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                  }`}
              >
                <h3 className="font-medium mb-2">Стандартный</h3>
                <p className="text-sm text-gray-400">Обычный режим обучения без дополнительных методик.</p>
              </div>
              <div
                onClick={() => setStudyMethod('spaced')}
                className={`cursor-pointer p-4 rounded-lg border transition-all ${studyMethod === 'spaced'
                    ? 'border-blue-500 bg-gray-700'
                    : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                  }`}
              >
                <h3 className="font-medium mb-2">Интервальное повторение</h3>
                <p className="text-sm text-gray-400">Повторение материала через увеличивающиеся интервалы времени.</p>
              </div>
              <div
                onClick={() => setStudyMethod('active')}
                className={`cursor-pointer p-4 rounded-lg border transition-all ${studyMethod === 'active'
                    ? 'border-blue-500 bg-gray-700'
                    : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                  }`}
              >
                <h3 className="font-medium mb-2">Активное обучение</h3>
                <p className="text-sm text-gray-400">Практические задания и проверка знаний после каждого блока.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Other settings */}
        <div className="bg-gray-800/60 backdrop-blur-sm rounded-xl shadow-lg border border-gray-700/50 p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6 pb-3 border-b border-gray-700">Дополнительные настройки</h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-gray-300">Уведомления</label>
                <p className="text-sm text-gray-400">Получать уведомления о заданиях и событиях</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={notifications}
                  onChange={() => setNotifications(!notifications)}
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="block text-gray-300">Автосохранение</label>
                <p className="text-sm text-gray-400">Автоматически сохранять прогресс</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={autoSave}
                  onChange={() => setAutoSave(!autoSave)}
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Save and Reset buttons */}
        <div className="flex flex-col-reverse sm:flex-row justify-between gap-4">
          <button
            onClick={resetSettings}
            className="px-4 py-3 rounded-lg border border-red-500/30 hover:bg-red-500/10 text-red-300 transition-colors duration-200"
          >
            Сбросить настройки
          </button>

          <button
            onClick={saveSettings}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors duration-200"
          >
            Сохранить настройки
          </button>
        </div>
      </main>

      {/* Success toast */}
      <div className={`fixed bottom-6 right-6 px-6 py-3 bg-green-500 text-white rounded-lg shadow-lg transition-opacity duration-300 flex items-center ${showToast ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}>
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
        </svg>
        Настройки успешно сохранены
      </div>

      {/* Reset toast */}
      <div className={`fixed bottom-6 right-6 px-6 py-3 bg-blue-500 text-white rounded-lg shadow-lg transition-opacity duration-300 flex items-center ${showResetToast ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}>
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
        </svg>
        Настройки сброшены до значений по умолчанию
      </div>
    </div>
  );
};

export default SettingsPage; 