import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link, useParams, useLocation } from 'react-router-dom';

export default function ModuleDetailsPage() {
  const { id } = useParams();
  const location = useLocation();
  const { currentUser, logout, tokens } = useAuth();
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const containerRef = useRef(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [currentTestIndex, setCurrentTestIndex] = useState(-1);
  const [completedTests, setCompletedTests] = useState([]);
  const [allCompleted, setAllCompleted] = useState(false);
  const [buttonPosition, setButtonPosition] = useState({ x: 0, y: 0 });
  const [hoveredCircle, setHoveredCircle] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const animationRef = useRef(null);
  const [module, setModule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [topics, setTopics] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });

  const API_URL = 'http://172.20.10.2:8080/api';

  // Fetch modules to find the one with matching ID
  useEffect(() => {
    const fetchModules = async () => {
      if (!tokens?.access_token) return;

      try {
        setLoading(true);
        console.log('Fetching modules with exact ID match:', id);

        const response = await fetch(`${API_URL}/modules/my-linked`, {
          headers: {
            'Authorization': `Bearer ${tokens.access_token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch modules');
        }

        const modules = await response.json();
        console.log('Fetched modules:', modules);

        // Find the exact module with the matching ID
        const foundModule = modules.find(m => m.id === id);
        console.log('Found module with exact ID match:', foundModule);

        if (foundModule) {
          setModule(foundModule);

          // Only set topics if the module actually has topics array with items
          if (foundModule.topics && foundModule.topics.length > 0) {
            // Map each topic to our format with index
            const moduleTopics = foundModule.topics.map((topic, index) => ({
              id: topic.topicId,
              name: topic.topicName,
              index
            }));

            setTopics(moduleTopics);
            // Show all topics from the beginning
            setCurrentTestIndex(moduleTopics.length - 1);
          } else {
            console.log('Module has no topics, setting empty array');
            // Don't set any default topics if the module doesn't have them
            setTopics([]);
          }
        } else {
          console.error('Module not found with ID:', id);
          throw new Error(`Module not found with ID: ${id}`);
        }
      } catch (error) {
        console.error('Error fetching module data:', error);
        setError(`Failed to load module data: ${error.message}`);

        // Don't set any fallback topics on error
        setTopics([]);
      } finally {
        setLoading(false);
      }
    };

    fetchModules();
  }, [id, tokens]);

  // Calculate positions for circles based on topics
  const getCirclePositions = useCallback(() => {
    const { width, height } = canvasSize;

    // Adjust spacing based on number of topics to fit all in view
    const topicsCount = topics.length;
    const scaleFactor = Math.max(0.6, Math.min(1, 10 / topicsCount)); // Scale down if more than 10 topics

    const baseRadius = Math.min(width, height) * 0.04 * scaleFactor;
    const horizontalSpacing = width * 0.13 * scaleFactor;
    const verticalSpacing = height * 0.09 * scaleFactor; // Reduce vertical spacing a bit
    const startX = width * 0.25; // Start more to the left
    const startY = height * 0.1; // Start more to the top
    const positions = [];

    // Generate positions based on the number of topics
    if (topicsCount === 0) return positions;

    // If there's only one topic, place it in the center
    if (topicsCount === 1) {
      positions.push({
        x: width / 2,
        y: height / 3,
        radius: baseRadius * 1.2 // Slightly larger for single topic
      });
      return positions;
    }

    // Calculate zigzag pattern based on topic count
    // First segment: right and down
    const firstSegmentCount = Math.min(5, topicsCount);
    for (let i = 0; i < firstSegmentCount; i++) {
      positions.push({
        x: startX + horizontalSpacing * i,
        y: startY + verticalSpacing * i,
        radius: baseRadius
      });
    }

    if (topicsCount <= firstSegmentCount) return positions;

    // Second segment: left and down
    const secondSegmentCount = Math.min(5, topicsCount - firstSegmentCount);
    let pivot = positions[firstSegmentCount - 1];
    for (let i = 1; i <= secondSegmentCount; i++) {
      positions.push({
        x: pivot.x - horizontalSpacing * i,
        y: pivot.y + verticalSpacing * i,
        radius: baseRadius
      });
    }

    if (topicsCount <= firstSegmentCount + secondSegmentCount) return positions;

    // Third segment: right and down
    const thirdSegmentCount = Math.min(5, topicsCount - firstSegmentCount - secondSegmentCount);
    pivot = positions[firstSegmentCount + secondSegmentCount - 1];
    for (let i = 1; i <= thirdSegmentCount; i++) {
      positions.push({
        x: pivot.x + horizontalSpacing * i,
        y: pivot.y + verticalSpacing * i,
        radius: baseRadius
      });
    }

    if (topicsCount <= firstSegmentCount + secondSegmentCount + thirdSegmentCount) return positions;

    // Fourth segment: continue zigzag pattern as needed
    const fourthSegmentCount = Math.min(5, topicsCount - firstSegmentCount - secondSegmentCount - thirdSegmentCount);
    pivot = positions[firstSegmentCount + secondSegmentCount + thirdSegmentCount - 1];
    for (let i = 1; i <= fourthSegmentCount; i++) {
      positions.push({
        x: pivot.x - horizontalSpacing * i,
        y: pivot.y + verticalSpacing * i,
        radius: baseRadius
      });
    }

    return positions;
  }, [canvasSize, topics]);

  // Auto-scroll to active content
  const scrollToActiveContent = useCallback(() => {
    if (!containerRef.current) return;

    // Calculate scroll position based on current test
    if (currentTestIndex >= 0) {
      const positions = getCirclePositions();
      if (positions[currentTestIndex]) {
        const { y } = positions[currentTestIndex];

        // Add some offset to ensure the element is in view
        const scrollY = Math.max(0, y - containerRef.current.clientHeight / 3);

        // Smooth scroll to the position
        containerRef.current.scrollTo({
          top: scrollY,
          behavior: 'smooth'
        });
      }
    }
  }, [currentTestIndex, getCirclePositions]);

  // Handle file upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadedFile(file);
      uploadFileToServer(file);
    }
  };

  // Upload file to server
  const uploadFileToServer = async (file) => {
    console.log('uploadFileToServer called with file:', file);
    console.log('Current module ID:', id);
    console.log('Current topics:', topics);

    if (!file || !id) {
      console.error('Missing file or module ID');
      return;
    }

    try {
      const formData = new FormData();
      // API wants 'file' for the file
      formData.append('file', file);

      // If topics exist, use the current index and topic ID
      if (topics.length > 0) {
        const uploadIndex = currentTestIndex;
        formData.append('index', -1);

        // Get the topic ID for the current index if available
        const topicId = uploadIndex >= 0 && topics[uploadIndex] ? topics[uploadIndex].id : null;

        // Add topicId to request if available
        if (topicId) {
          formData.append('topicId', topicId);
          console.log('Including topicId in upload:', topicId);
        } else {
          console.log('No topicId available for index:', uploadIndex);
        }
      } else {
        // For empty modules, just pass index 0
        formData.append('index', '0');
        console.log('Empty module, using index 0');
      }

      // The endpoint with no query params to avoid primitive type error
      const url = `${API_URL}/modules/${id}/upload`;
      console.log('Upload URL:', url);

      console.log('Sending upload request');
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
          // Don't set Content-Type header, it will be set automatically with the proper boundary
        },
        body: formData
      });
      console.log('Upload response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Upload error response:', errorText);
        throw new Error(`Failed to upload file: ${response.status} ${errorText}`);
      }

      console.log('Upload successful!');

      // For modules with topics, add a new topic after successful upload
      if (topics.length > 0) {
        // Add new topic after successful upload
        const newTopicName = `Topic ${topics.length + 1}`;
        const newTopic = {
          id: `generated-${Date.now()}`, // Generate a temporary ID
          name: newTopicName,
          index: topics.length
        };

        // Add the new topic to the topics array
        setTopics(prevTopics => [...prevTopics, newTopic]);

        // Mark current topic as completed
        if (currentTestIndex >= 0 && topics[currentTestIndex]) {
          setCompletedTests(prev => [...prev, topics[currentTestIndex].id]);
        }

        // Move to the newly added topic
        setCurrentTestIndex(topics.length);
      }

      // Set uploaded file to show success message
      setUploadedFile(file);

      // Clear the upload message after 8 seconds
      setTimeout(() => {
        setUploadedFile(null);
      }, 8000);

    } catch (error) {
      console.error('Error uploading file:', error);
      alert(`Failed to upload file: ${error.message}`);
    }
  };

  // Trigger file upload dialog
  const triggerFileUpload = () => {
    // Reset the file input so the same file can be selected multiple times
    if (fileInputRef.current) {
      fileInputRef.current.value = null;
      fileInputRef.current.click();
    }
  };

  // Handle mouse move over canvas
  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const positions = getCirclePositions();

    // Проверяем все круги, а не только текущий и предыдущие
    for (let i = 0; i < positions.length; i++) {
      const circle = positions[i];
      if (!circle) continue;

      const dx = x - circle.x;
      const dy = y - circle.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < circle.radius) {
        setHoveredCircle(i);
        canvas.style.cursor = 'pointer';
        return;
      }
    }

    setHoveredCircle(null);
    canvas.style.cursor = 'default';
  };

  // Handle canvas click
  const handleCanvasClick = (e) => {
    console.log('Canvas clicked, hovered circle:', hoveredCircle);

    // Если навели на круг, показываем popup с информацией о теме
    if (hoveredCircle !== null && topics[hoveredCircle]) {
      const topic = topics[hoveredCircle];
      setSelectedTopic(topic);

      // Рассчитываем позицию для popup относительно окна браузера
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const positions = getCirclePositions();
      const circlePos = positions[hoveredCircle];

      // Вычисляем абсолютную позицию круга в окне браузера
      const absoluteX = rect.left + circlePos.x;
      const absoluteY = rect.top + circlePos.y;

      // Вычисляем абсолютную позицию относительно документа (с учетом прокрутки)
      const scrollX = window.scrollX || document.documentElement.scrollLeft;
      const scrollY = window.scrollY || document.documentElement.scrollTop;

      // Устанавливаем позицию popup СЛЕВА от выбранного круга
      setPopupPosition({
        x: absoluteX - circlePos.radius - 240 + scrollX, // 220px ширина + 20px отступ
        y: absoluteY + scrollY
      });

      // Показываем popup
      setShowPopup(true);
    }
  };

  // Функция для закрытия popup
  const closePopup = () => {
    setShowPopup(false);
    setSelectedTopic(null);
  };

  // Функция для перехода к теме после нажатия на кнопку в popup
  const navigateToTopic = () => {
    if (selectedTopic) {
      navigate(`/topics/${selectedTopic.id}`);
      closePopup();
    }
  };

  // Resize observer to keep canvas responsive
  useEffect(() => {
    const updateCanvasSize = () => {
      if (!containerRef.current) return;

      const { width } = containerRef.current.getBoundingClientRect();

      // Calculate height based on number of topics
      // Minimum height is 600px, but increase height for more topics
      const minHeight = Math.max(600, topics.length * 120);

      // Only update if dimensions actually changed to prevent unnecessary re-renders
      if (width !== canvasSize.width || minHeight !== canvasSize.height) {
        setCanvasSize({ width, height: minHeight });
      }
    };

    // Initialize canvas size
    updateCanvasSize();

    // Create resize observer
    const resizeObserver = new ResizeObserver(() => {
      // Use requestAnimationFrame to throttle updates
      requestAnimationFrame(updateCanvasSize);
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Clean up
    return () => {
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
      resizeObserver.disconnect();
    };
  }, [canvasSize.width, canvasSize.height, topics.length]);

  // Separate effect for scrolling after resize
  useEffect(() => {
    // Apply scroll to active content with a delay to ensure canvas has updated
    const scrollTimer = setTimeout(scrollToActiveContent, 100);
    return () => clearTimeout(scrollTimer);
  }, [canvasSize, scrollToActiveContent]);

  // Draw canvas when size changes or state updates
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || topics.length === 0) return;

    // Update canvas dimensions to match state
    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;

    const drawCanvas = () => {
      const ctx = canvas.getContext('2d');
      const positions = getCirclePositions();

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Adjust font size based on canvas dimensions
      const fontSize = Math.max(12, Math.min(canvasSize.width, canvasSize.height) * 0.025);
      const lineWidth = Math.max(3, Math.min(canvasSize.width, canvasSize.height) * 0.008);

      if (positions.length === 0) {
        animationRef.current = requestAnimationFrame(drawCanvas);
        return;
      }

      // Draw connecting lines between all circles
      ctx.beginPath();
      ctx.moveTo(positions[0].x, positions[0].y);

      for (let i = 1; i < positions.length; i++) {
        if (positions[i]) {
          ctx.lineTo(positions[i].x, positions[i].y);
        }
      }

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = lineWidth;
      ctx.stroke();

      // Draw all circles
      for (let i = 0; i < positions.length; i++) {
        if (!positions[i] || !topics[i]) continue;

        const pos = positions[i];
        const isHovered = i === hoveredCircle;

        // Draw glow for hovered circles
        if (isHovered) {
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, pos.radius + pos.radius * 0.4, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(79, 70, 229, 0.3)';
          ctx.fill();
        }

        // Draw the circle - all circles are purple
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, pos.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#4F46E5'; // All circles are purple
        ctx.fill();

        drawDirectionArrow(ctx, pos.x, pos.y, i, pos.radius);

        // Draw topic name
        ctx.font = `${fontSize}px sans-serif`;
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.fillText(topics[i].name, pos.x, pos.y + pos.radius + fontSize);
      }

      // Position upload button next to the last circle
      if (positions.length > 0) {
        const lastPos = positions[positions.length - 1];

        // Position button to the RIGHT of the last circle
        const buttonX = lastPos.x + lastPos.radius * 3;

        // Ensure button is visible in container
        setButtonPosition({
          x: Math.min(canvasSize.width - 100, buttonX), // Prevent button from going too far right
          y: lastPos.y + 25
        });
      }

      animationRef.current = requestAnimationFrame(drawCanvas);
    };

    const drawDirectionArrow = (ctx, cx, cy, index, radius) => {
      ctx.save();
      ctx.fillStyle = 'white';

      // Scale arrow size based on circle radius
      const arrowSize = radius * 0.6;

      if (index < 3) {
        drawArrow(ctx, cx - arrowSize, cy - arrowSize, cx + arrowSize, cy + arrowSize, arrowSize * 0.8);
      } else if (index < 6) {
        drawArrow(ctx, cx + arrowSize, cy - arrowSize, cx - arrowSize, cy + arrowSize, arrowSize * 0.8);
      } else {
        drawArrow(ctx, cx - arrowSize, cy - arrowSize, cx + arrowSize, cy + arrowSize, arrowSize * 0.8);
      }

      ctx.restore();
    };

    const drawArrow = (ctx, fromX, fromY, toX, toY, headLength) => {
      const angle = Math.atan2(toY - fromY, toX - fromX);
      const lineWidth = Math.max(1, headLength * 0.2);

      ctx.beginPath();
      ctx.moveTo(fromX, fromY);
      ctx.lineTo(toX, toY);
      ctx.lineWidth = lineWidth;
      ctx.strokeStyle = 'white';
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(toX, toY);
      ctx.lineTo(
        toX - headLength * Math.cos(angle - Math.PI / 6),
        toY - headLength * Math.sin(angle - Math.PI / 6)
      );
      ctx.lineTo(
        toX - headLength * Math.cos(angle + Math.PI / 6),
        toY - headLength * Math.sin(angle + Math.PI / 6)
      );
      ctx.closePath();
      ctx.fillStyle = 'white';
      ctx.fill();
    };

    drawCanvas();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [canvasSize, currentTestIndex, completedTests, allCompleted, hoveredCircle, topics, getCirclePositions]);

  // Calculate button size based on canvas dimensions
  const getButtonStyles = () => {
    const fontSize = Math.max(14, Math.min(canvasSize.width, canvasSize.height) * 0.02);
    const paddingX = fontSize * 1.5;
    const paddingY = fontSize * 0.8;

    return {
      fontSize: `${fontSize}px`,
      padding: `${paddingY}px ${paddingX}px`,
    };
  };

  // Scroll when active test changes or when file is uploaded
  useEffect(() => {
    scrollToActiveContent();
  }, [currentTestIndex, uploadedFile, scrollToActiveContent]);

  // Handle logout
  const handleLogout = async () => {
    try {
      logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-6 py-4 rounded-lg max-w-md text-center">
          <h3 className="text-xl font-medium mb-2">Ошибка загрузки</h3>
          <p>{error}</p>
          <Link to="/profile" className="mt-4 inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors duration-200">
            Вернуться в профиль
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-8 sm:p-10">
      <div className="flex justify-between items-center mb-14 w-full max-w-5xl px-4">
        <div className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-indigo-600 bg-clip-text text-transparent p-2">
          Qasqyr AI
        </div>
        <h1 className="text-2xl font-medium text-center">
          <div className="text-lg text-blue-200 opacity-80 tracking-wide px-4 py-2">
            {module ? module.name : "Учебный модуль"}
          </div>
        </h1>
        <div className="flex items-center gap-4">
          {currentUser && (
            <>
              <div className="text-sm text-gray-300">
                <span className="opacity-70">Signed in as: </span>
                <span className="font-medium text-blue-300">{currentUser.username || currentUser.email}</span>
              </div>
              <Link
                to="/profile"
                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors duration-200"
              >
                Мой Профиль
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
      </div>

      {/* Content area */}
      <div
        ref={containerRef}
        className="relative w-full max-w-5xl rounded-xl shadow-2xl overflow-auto mx-4"
        style={{
          minHeight: '75vh',
          maxHeight: topics.length > 5 ? '90vh' : '85vh',
          width: 'calc(100% - 2rem)'
        }}
      >
        {topics.length > 0 ? (
          // Show canvas and interactive elements if there are topics
          <>
            <canvas
              ref={canvasRef}
              className="w-full h-full min-h-[600px]"
              onMouseMove={handleMouseMove}
              onClick={handleCanvasClick}
            />
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileUpload}
              accept="*/*"
            />
            {/* Navigation buttons */}
            <div className="absolute top-4 right-4 flex gap-2">
              <button
                onClick={() => {
                  if (containerRef.current) {
                    containerRef.current.scrollTo({
                      top: 0,
                      behavior: 'smooth'
                    });
                  }
                }}
                className="p-2 bg-gray-700 hover:bg-gray-600 rounded-full shadow-lg text-white"
                title="Прокрутить вверх"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              </button>
              <button
                onClick={() => {
                  if (containerRef.current) {
                    containerRef.current.scrollTo({
                      top: containerRef.current.scrollHeight,
                      behavior: 'smooth'
                    });
                  }
                }}
                className="p-2 bg-gray-700 hover:bg-gray-600 rounded-full shadow-lg text-white"
                title="Прокрутить вниз"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </button>
            </div>
            {/* Upload button for current topic */}
            {topics.length > 0 && (
              <button
                onClick={triggerFileUpload}
                className="absolute px-5 py-2.5 bg-green-500 hover:bg-green-600 rounded-lg text-white font-medium transition-all duration-200 shadow-lg"
                style={{
                  top: buttonPosition.y,
                  left: buttonPosition.x,
                  transform: 'translate(0, -50%)',
                  zIndex: 10,
                  ...getButtonStyles()
                }}
              >
                <span className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Загрузить файл
                </span>
              </button>
            )}
            {uploadedFile && (
              <div
                className="absolute px-8 py-5 bg-gray-800/95 backdrop-blur-md rounded-xl text-white shadow-xl border border-indigo-900/30 z-10 my-6 mx-auto"
                style={{
                  bottom: '40px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  fontSize: `${Math.max(12, Math.min(canvasSize.width, canvasSize.height) * 0.018)}px`,
                }}
              >
                <span className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="font-medium">Загружен:</span>
                  <span className="text-blue-300 ml-2">{uploadedFile.name}</span>
                </span>
              </div>
            )}
          </>
        ) : (
          // Empty module - just show upload button
          <div className="flex flex-col items-center justify-center h-full min-h-[600px] p-8">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileUpload}
              accept="*/*"
            />
            <button
              onClick={triggerFileUpload}
              className="px-6 py-3 bg-green-500 hover:bg-green-600 rounded-lg text-white font-medium transition-all duration-200 shadow-lg mb-6"
            >
              <span className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Загрузить файл
              </span>
            </button>
            {uploadedFile && (
              <div className="mt-4 px-6 py-4 bg-gray-800/90 rounded-lg border border-gray-700 text-center">
                <span className="flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="font-medium">Загружен:</span>
                  <span className="text-blue-300 ml-2">{uploadedFile.name}</span>
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Popup для темы - обновленный стиль и позиционирование */}
      {showPopup && selectedTopic && (
        <div
          className="fixed bg-gray-900 border border-gray-700 rounded-lg shadow-xl p-4 z-50"
          style={{
            left: `${popupPosition.x}px`,
            top: `${popupPosition.y}px`,
            transform: 'translate(0, -50%)', // Центрировать по вертикали
          
          }}
        >
          <button
            className="absolute top-2 right-2 text-gray-400 hover:text-white"
            onClick={closePopup}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>

          {/* Заголовок popup точно как на скриншоте */}
          <h3 className="text-xl font-semibold text-white">{selectedTopic.name}</h3>

          <div className='w-full'>
            <div className="text-gray-300 text-sm mb-4">
              Тема #{selectedTopic.index + 1}
            </div>

            <div className="flex justify-between gap-2">
              <button
                onClick={closePopup}
                className="w-full px-2 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md text-sm"
              >
                Редактировать
              </button>

              <button
                onClick={navigateToTopic}
                className=" w-full  px-1  py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm text-center"
              >
                Перейти к теме
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 