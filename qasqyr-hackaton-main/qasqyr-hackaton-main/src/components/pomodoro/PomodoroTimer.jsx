import { useState, useEffect, useRef } from 'react';

const PomodoroTimer = () => {
  // Timer states
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [mode, setMode] = useState('work'); // 'work', 'break', 'longBreak'
  const [cycles, setCycles] = useState(0);

  // Settings from localStorage
  const [settings, setSettings] = useState({
    workDuration: 25,
    breakDuration: 5,
    longBreakDuration: 15,
    cyclesBeforeLongBreak: 4,
    pomodoroEnabled: false
  });

  const timerRef = useRef(null);
  const audioRef = useRef(null);

  // Get settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('user_settings');
    if (savedSettings) {
      const parsedSettings = JSON.parse(savedSettings);
      setSettings({
        workDuration: parsedSettings.workDuration || 25,
        breakDuration: parsedSettings.breakDuration || 5,
        longBreakDuration: parsedSettings.longBreakDuration || 15,
        cyclesBeforeLongBreak: parsedSettings.cyclesBeforeLongBreak || 4,
        pomodoroEnabled: parsedSettings.pomodoroEnabled || false
      });

      if (!parsedSettings.pomodoroEnabled) {
        return; // Don't initialize timer if Pomodoro is disabled
      }
    }

    // Initialize with work duration
    resetTimer('work');

    // Create audio element for notifications
    audioRef.current = new Audio('/notification.mp3');

    return () => {
      // Clean up timer on unmount
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Watch for settings changes
  useEffect(() => {
    const handleStorageChange = () => {
      const savedSettings = localStorage.getItem('user_settings');
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings({
          workDuration: parsedSettings.workDuration || 25,
          breakDuration: parsedSettings.breakDuration || 5,
          longBreakDuration: parsedSettings.longBreakDuration || 15,
          cyclesBeforeLongBreak: parsedSettings.cyclesBeforeLongBreak || 4,
          pomodoroEnabled: parsedSettings.pomodoroEnabled || false
        });

        // Reset timer with new duration
        resetTimer(mode);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [mode]);

  // Timer logic
  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prevTime => prevTime - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      // Play notification sound
      if (audioRef.current) {
        audioRef.current.play().catch(e => console.log("Audio play failed:", e));
      }

      // Handle mode transitions
      if (mode === 'work') {
        // Increment cycle count
        const newCycles = cycles + 1;
        setCycles(newCycles);

        // Check if it's time for a long break
        if (newCycles % settings.cyclesBeforeLongBreak === 0) {
          resetTimer('longBreak');
        } else {
          resetTimer('break');
        }
      } else {
        // After any break, return to work mode
        resetTimer('work');
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isActive, timeLeft, mode, cycles, settings]);

  // Reset timer to a specific mode
  const resetTimer = (newMode) => {
    clearInterval(timerRef.current);

    let duration = 0;
    if (newMode === 'work') {
      duration = settings.workDuration * 60;
    } else if (newMode === 'break') {
      duration = settings.breakDuration * 60;
    } else if (newMode === 'longBreak') {
      duration = settings.longBreakDuration * 60;
    }

    setTimeLeft(duration);
    setMode(newMode);
    setIsActive(false);
  };

  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Mode text display
  const getModeText = () => {
    switch (mode) {
      case 'work': return 'Работа';
      case 'break': return 'Короткий перерыв';
      case 'longBreak': return 'Длинный перерыв';
      default: return '';
    }
  };

  // Skip to next mode
  const handleSkip = () => {
    if (mode === 'work') {
      const newCycles = cycles + 1;
      setCycles(newCycles);

      if (newCycles % settings.cyclesBeforeLongBreak === 0) {
        resetTimer('longBreak');
      } else {
        resetTimer('break');
      }
    } else {
      resetTimer('work');
    }
  };

  if (!settings.pomodoroEnabled) {
    return null; // Don't render anything if Pomodoro is disabled
  }

  return (
    <div className="fixed bottom-6 left-6 bg-gray-800/90 backdrop-blur-sm border border-gray-700/50 rounded-xl shadow-lg p-4 text-white z-50 w-64">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg font-medium">Помодоро</h2>
        <span className={`px-2 py-1 rounded-full text-xs ${mode === 'work' ? 'bg-blue-500/30 text-blue-200' :
            mode === 'break' ? 'bg-green-500/30 text-green-200' :
              'bg-purple-500/30 text-purple-200'
          }`}>
          {getModeText()}
        </span>
      </div>

      <div className={`text-center py-6 mb-3 rounded-lg ${mode === 'work' ? 'bg-blue-900/20 border border-blue-700/30' :
          mode === 'break' ? 'bg-green-900/20 border border-green-700/30' :
            'bg-purple-900/20 border border-purple-700/30'
        }`}>
        <div className="text-3xl font-bold">{formatTime(timeLeft)}</div>
        <div className="mt-1 text-xs opacity-70">Цикл {cycles % settings.cyclesBeforeLongBreak || settings.cyclesBeforeLongBreak}/{settings.cyclesBeforeLongBreak}</div>
      </div>

      <div className="flex justify-between gap-2">
        <button
          onClick={() => setIsActive(!isActive)}
          className={`flex-1 py-2 rounded-lg transition-colors ${isActive
              ? 'bg-red-600/50 hover:bg-red-600/70 text-white'
              : 'bg-green-600/50 hover:bg-green-600/70 text-white'
            }`}
        >
          {isActive ? 'Пауза' : 'Старт'}
        </button>

        <button
          onClick={() => resetTimer(mode)}
          className="py-2 px-3 rounded-lg bg-gray-700/70 hover:bg-gray-700 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>

        <button
          onClick={handleSkip}
          className="py-2 px-3 rounded-lg bg-gray-700/70 hover:bg-gray-700 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default PomodoroTimer; 