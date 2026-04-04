// ===== ТЕСТЫ =====
// Главный экран: 5 кнопок (Случайный тест, Экзамен, По темам, По сложности, Избранное)
// Кнопка "Статистика" внизу

let currentTestConfig = null;
let currentQuestions = [];
let currentQuestionIndex = 0;
let currentScore = 0;
let currentAnswered = false;
let currentAnsweredQuestions = [];
let currentUserId = null;      // UUID для статистики
let currentVkId = null;        // VK ID для избранного
let currentAttemptId = null;
let currentTestMode = 'exam';
let currentMultipleSelected = [];
let currentFavoriteStatus = {};

// Локальные таймеры
let testStartTime = null;
let testTimerInterval = null;
let testAutoTransitionTimer = null;

// Правила генерации
const TEST_RULES = {
  exam: [
    { difficulty_level_id: 1, count: 5 },
    { difficulty_level_id: 2, count: 5 },
    { difficulty_level_id: 3, count: 5 },
    { difficulty_level_id: 4, count: 5 },
    { difficulty_level_id: 5, count: 5 }
  ],
  theme: { count: 15 },
  quick: { count: 10 },
  favorite: { count: 999 }
};

// ===== УПРАВЛЕНИЕ НИЖНЕЙ НАВИГАЦИЕЙ =====
function hideBottomNav() {
  const bottomNav = document.querySelector('.bottom-nav');
  if (bottomNav) {
    bottomNav.style.display = 'none';
  }
}

function showBottomNav() {
  const bottomNav = document.querySelector('.bottom-nav');
  if (bottomNav) {
    bottomNav.style.display = 'flex';
  }
}

// ===== ЗАГРУЗКА ВОПРОСОВ, ТЕМ, СЛОЖНОСТЕЙ =====
async function loadQuestions() {
  try {
    const response = await fetch(`${CONFIG.API_URL}/questions`);
    if (response.ok) {
      window.allQuestions = await response.json();
      console.log(`✅ Загружено вопросов: ${window.allQuestions.length}`);
    } else {
      console.error('❌ Ошибка загрузки вопросов');
    }
  } catch (err) {
    console.error('❌ Ошибка:', err);
  }
}

async function loadThemes() {
  try {
    const response = await fetch(`${CONFIG.API_URL}/themes`);
    if (response.ok) {
      const themesTree = await response.json();
      function flatten(items, result = []) {
        for (const item of items) {
          result.push({ id: item.id, title: item.title, parent_id: item.parent_id });
          if (item.children && item.children.length) flatten(item.children, result);
        }
        return result;
      }
      window.allThemes = flatten(themesTree);
      console.log(`✅ Загружено тем: ${window.allThemes.length}`);
      
      window.allSubthemes = window.allThemes.filter(t => t.parent_id);
      console.log(`✅ Загружено подтем: ${window.allSubthemes.length}`);
    } else {
      console.error('❌ Ошибка загрузки тем');
    }
  } catch (err) {
    console.error('❌ Ошибка:', err);
  }
}

async function loadDifficultyLevels() {
  try {
    const response = await fetch(`${CONFIG.API_URL}/difficulty-levels`);
    if (response.ok) {
      window.allDifficulty = await response.json();
      console.log(`✅ Загружено уровней сложности: ${window.allDifficulty.length}`);
    } else {
      console.error('❌ Ошибка загрузки уровней сложности');
    }
  } catch (err) {
    console.error('❌ Ошибка:', err);
  }
}

// ===== ИЗБРАННОЕ =====
async function loadFavorites() {
  if (!currentVkId) return [];
  try {
    const favorites = await API.getFavorites(currentVkId);
    return favorites.map(q => q.id);
  } catch (err) {
    console.error('Ошибка загрузки избранного:', err);
    return [];
  }
}

async function checkFavoriteStatus(questionId) {
  if (!currentVkId) return false;
  if (currentFavoriteStatus[questionId] !== undefined) {
    return currentFavoriteStatus[questionId];
  }
  try {
    const result = await API.checkFavorite(currentVkId, questionId);
    currentFavoriteStatus[questionId] = result.is_favorite;
    return result.is_favorite;
  } catch (err) {
    console.error('Ошибка проверки избранного:', err);
    return false;
  }
}

async function toggleFavorite(questionId) {
  if (!currentVkId) {
    showNotification('Войдите в аккаунт, чтобы добавлять в избранное', 'warning');
    return false;
  }
  
  const isCurrentlyFavorite = await checkFavoriteStatus(questionId);
  
  try {
    if (isCurrentlyFavorite) {
      await API.removeFavorite(currentVkId, questionId);
      currentFavoriteStatus[questionId] = false;
      await updateFavoriteButton(questionId);
      return false;
    } else {
      await API.addFavorite(currentVkId, questionId);
      currentFavoriteStatus[questionId] = true;
      await updateFavoriteButton(questionId);
      return true;
    }
  } catch (err) {
    console.error('Ошибка переключения избранного:', err);
    showNotification('Не удалось изменить статус избранного', 'error');
    return isCurrentlyFavorite;
  }
}

async function updateFavoriteButton(questionId) {
  const favBtn = document.getElementById("favoriteBtn");
  if (!favBtn) return;
  
  const isFavorite = await checkFavoriteStatus(questionId);
  const icon = favBtn.querySelector('.icon');
  
  if (isFavorite) {
    if (icon) {
      icon.className = 'icon icon-favorite-on';
    } else {
      favBtn.innerHTML = '<div class="icon icon-favorite-on"></div> Избранное';
    }
    favBtn.classList.add('active');
  } else {
    if (icon) {
      icon.className = 'icon icon-favorite-off';
    } else {
      favBtn.innerHTML = '<div class="icon icon-favorite-off"></div> Избранное';
    }
    favBtn.classList.remove('active');
  }
}

// ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====
function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function getActiveQuestions() {
  if (!window.allQuestions) return [];
  const hasSubscription = window.userSubscriptions?.test === true;
  return window.allQuestions.filter(q => {
    if (q.status !== 'active') return false;
    if (!hasSubscription && q.is_paid === 1) return false;
    return true;
  });
}

function getFreeQuestionsCount() {
  if (!window.allQuestions) return 0;
  return window.allQuestions.filter(q => q.status === 'active' && q.is_paid !== 1).length;
}

function getElapsedSeconds() {
  if (!testStartTime) return 0;
  return Math.floor((Date.now() - testStartTime) / 1000);
}

function formatSeconds(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function startTestTimer() {
  stopTestTimer();
  testTimerInterval = setInterval(() => {
    const el = document.getElementById("timer");
    if (el) {
      el.innerHTML = '<div class="icon icon-timer" style="width: 14px; height: 14px; background-color: currentColor;"></div> ' + formatSeconds(getElapsedSeconds());
    }
  }, 1000);
}

function stopTestTimer() {
  if (testTimerInterval) {
    clearInterval(testTimerInterval);
    testTimerInterval = null;
  }
}

function clearTestAutoTransition() {
  if (testAutoTransitionTimer) {
    clearTimeout(testAutoTransitionTimer);
    testAutoTransitionTimer = null;
  }
}

function showTestControls() {
  const controls = document.getElementById("testControls");
  if (controls) controls.classList.add('active');
  const nextBtn = document.getElementById("nextBtn");
  if (nextBtn) nextBtn.classList.add('hidden');
  
  const favBtn = document.getElementById("favoriteBtn");
  if (favBtn && currentVkId) {
    favBtn.classList.remove('hidden');
  } else if (favBtn) {
    favBtn.classList.add('hidden');
  }
  
  if (currentQuestions[currentQuestionIndex]?.type === 'multiple' && !currentAnswered) {
    const submitBtn = document.getElementById("submitMultipleBtn");
    if (submitBtn) submitBtn.classList.remove('hidden');
  }
}

function hideTestControls() {
  const controls = document.getElementById("testControls");
  if (controls) controls.classList.remove('active');
  const testArea = document.getElementById("testArea");
  if (testArea) testArea.classList.remove('test-active');
}

// ===== ПОЛУЧЕНИЕ ПОДПИСКИ ИЗ БД =====
async function hasTestSubscription() {
  if (!currentVkId) return false;
  try {
    const userRes = await fetch(`${CONFIG.API_URL}/users/vk/${currentVkId}`);
    if (!userRes.ok) return false;
    const user = await userRes.json();
    const subsRes = await fetch(`${CONFIG.API_URL}/users/user/${user.id}`);
    if (!subsRes.ok) return false;
    const subs = await subsRes.json();
    return subs.some(s => s.type === 'test' && s.active === 1);
  } catch (err) {
    console.error('Ошибка проверки подписки:', err);
    return false;
  }
}

// ===== РАБОТА С ПРОГРЕССОМ (LEGACY) =====
async function loadTestProgressFromDB() {
  if (!currentUserId) return;
  
  try {
    const attempts = await API.getTestAttemptsByUser(currentUserId);
    const progressMap = {};
    
    for (let attempt of attempts) {
      const questionsIds = attempt.questions_ids ? JSON.parse(attempt.questions_ids) : [];
      const answers = attempt.answers ? JSON.parse(attempt.answers) : [];
      
      if (attempt.status === 'in_progress') {
        progressMap[attempt.test_id] = {
          currentQuestion: answers.length,
          score: attempt.total_score || 0,
          answered: answers,
          completed: false,
          total: questionsIds.length,
          attemptId: attempt.id,
          questionsIds: questionsIds
        };
      } else if (attempt.status === 'completed') {
        progressMap[attempt.test_id] = {
          completed: true,
          score: attempt.total_score,
          total: questionsIds.length,
          attemptId: attempt.id
        };
      }
    }
    
    Object.assign(window.testProgress || {}, progressMap);
    console.log('📊 Прогресс загружен из БД (legacy)');
  } catch (e) {
    console.error('Ошибка загрузки прогресса из БД:', e);
  }
}

// ===== ГЕНЕРАЦИЯ ТЕСТОВ =====
async function generateQuickTest() {
  const activeQuestions = getActiveQuestions();
  if (activeQuestions.length === 0) {
    showNotification('Нет доступных вопросов', 'error');
    return null;
  }
  const shuffled = shuffleArray(activeQuestions);
  const questions = shuffled.slice(0, TEST_RULES.quick.count);
  return { id: 'quick', title: 'Случайный тест', type: 'quick', questions: questions };
}

async function generateExam() {
  const activeQuestions = getActiveQuestions();
  if (activeQuestions.length === 0) {
    showNotification('Нет доступных вопросов', 'error');
    return null;
  }
  let totalQuestions = [];
  for (let rule of TEST_RULES.exam) {
    const levelQuestions = activeQuestions.filter(q => q.difficulty_level_id === rule.difficulty_level_id);
    if (levelQuestions.length === 0) continue;
    const shuffled = shuffleArray(levelQuestions);
    const selected = shuffled.slice(0, rule.count);
    totalQuestions.push(...selected);
  }
  if (totalQuestions.length === 0) {
    showNotification('Недостаточно вопросов для формирования экзамена', 'error');
    return null;
  }
  totalQuestions = shuffleArray(totalQuestions);
  return { id: 'exam', title: 'Экзамен', type: 'exam', questions: totalQuestions };
}

async function generateTestByTheme(themeId, themeTitle) {
  const activeQuestions = getActiveQuestions();
  let questions = activeQuestions.filter(q => q.theme_id === themeId);
  if (questions.length === 0) {
    showNotification('Нет вопросов по этой теме', 'error');
    return null;
  }
  questions = shuffleArray(questions);
  questions = questions.slice(0, TEST_RULES.theme.count);
  return { id: `theme_${themeId}`, title: `${themeTitle}`, type: 'theme', questions: questions, themeId: themeId };
}

async function generateTestByDifficulty(difficultyId, difficultyTitle) {
  const activeQuestions = getActiveQuestions();
  let questions = activeQuestions.filter(q => q.difficulty_level_id === difficultyId);
  if (questions.length === 0) {
    showNotification('Нет вопросов этого уровня сложности', 'error');
    return null;
  }
  questions = shuffleArray(questions);
  questions = questions.slice(0, TEST_RULES.quick.count);
  return { id: `difficulty_${difficultyId}`, title: `${difficultyTitle}`, type: 'difficulty', questions: questions, difficultyId: difficultyId };
}

async function generateFavoriteTest() {
  if (!currentVkId) {
    showNotification('Войдите в аккаунт, чтобы использовать избранное', 'warning');
    return null;
  }
  
  const favoriteIds = await loadFavorites();
  if (favoriteIds.length === 0) {
    showNotification('У вас нет избранных вопросов. Добавьте вопросы в избранное через кнопку во время тестирования', 'warning');
    return null;
  }
  
  const activeQuestions = getActiveQuestions();
  let questions = activeQuestions.filter(q => favoriteIds.includes(q.id));
  
  if (questions.length === 0) {
    showNotification('Избранные вопросы не найдены или недоступны по подписке', 'error');
    return null;
  }
  
  questions = shuffleArray(questions);
  return { id: 'favorite', title: 'Избранное', type: 'favorite', questions: questions };
}

// ===== ФУНКЦИИ ДЛЯ РАБОТЫ С ИЗОБРАЖЕНИЯМИ =====
function getQuestionImageUrl(imagePath) {
  if (!imagePath) return '';

  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath.replace('/api/uploads/', '/uploads/');
  }

  let baseURL = CONFIG?.API_URL || '';
  baseURL = baseURL.replace(/\/api$/, '');
  let cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  if (!cleanPath.startsWith('/uploads/')) {
    cleanPath = `/uploads${cleanPath}`;
  }
  return `${baseURL}${cleanPath}`;
}

// ===== ПОЛУЧЕНИЕ ПРАВИЛЬНЫХ ID ОТВЕТОВ =====
function getCorrectAnswerIds(question) {
  return question.answers
    .filter(a => a.is_correct === 1 || a.is_correct === true)
    .map(a => a.id);
}

// ===== ПРОВЕРКА MULTIPLE ВОПРОСА =====
function checkMultipleAnswer(question, selectedIds) {
  const correctIds = getCorrectAnswerIds(question);
  if (selectedIds.length !== correctIds.length) return false;
  return selectedIds.every(id => correctIds.includes(id));
}

// ===== КАСТОМНЫЕ УВЕДОМЛЕНИЯ =====
function showNotification(message, type = 'info') {
  const existing = document.querySelector('.custom-notification');
  if (existing) existing.remove();

  const notification = document.createElement('div');
  notification.className = `custom-notification ${type}`;

  let iconSvg = '';
  if (type === 'error') iconSvg = '<div class="icon icon-cross" style="width: 16px; height: 16px; background-color: white;"></div>';
  else if (type === 'warning') iconSvg = '<div class="icon icon-warning" style="width: 16px; height: 16px; background-color: white;"></div>';
  else if (type === 'success') iconSvg = '<div class="icon icon-check" style="width: 16px; height: 16px; background-color: white;"></div>';
  else iconSvg = '<div class="icon icon-info" style="width: 16px; height: 16px; background-color: white;"></div>';

  const bg = type === 'error' ? 'rgba(231, 76, 60, 0.95)' :
              type === 'warning' ? 'rgba(243, 156, 18, 0.95)' :
              type === 'success' ? 'rgba(46, 204, 113, 0.95)' :
              'rgba(52, 152, 219, 0.95)';

  notification.innerHTML = `
    <div class="notification-content" style="background: ${bg}">
      <span class="notification-icon">${iconSvg}</span>
      <span class="notification-message">${escapeHtml(message)}</span>
    </div>
  `;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transition = 'opacity 0.3s';
    setTimeout(() => notification.remove(), 300);
  }, 2500);
}

// ===== ОТОБРАЖЕНИЕ ГЛАВНОГО ЭКРАНА =====
async function renderTestsList() {
  const listEl = document.getElementById("topicsList");
  const testArea = document.getElementById("testArea");
  if (testArea) {
    testArea.innerHTML = "";
    testArea.classList.remove('test-active');
  }
  hideTestControls();
  clearTestAutoTransition();
  
  // Скрываем кнопку "Назад"
  const backBtn = document.getElementById("backBtn");
  if (backBtn) backBtn.classList.add('hidden');
  
  if (!listEl) return;
  
  const hasTestSub = await hasTestSubscription();
  window.userSubscriptions = window.userSubscriptions || {};
  window.userSubscriptions.test = hasTestSub;
  
  const themesCount = window.allThemes ? window.allThemes.filter(t => !t.parent_id).length : 0;
  const subthemesCount = window.allSubthemes ? window.allSubthemes.length : 0;
  const questionsCount = window.allQuestions ? window.allQuestions.length : 0;
  const freeQuestionsCount = getFreeQuestionsCount();
  
  let favoritesCount = 0;
  if (currentVkId) {
    const favoriteIds = await loadFavorites();
    favoritesCount = favoriteIds.length;
  }
  
  let html = `
    <div class="tests-main-screen">
      <div class="stats-cards">
        <div class="stat-card">
          <div class="stat-number">${themesCount}</div>
          <div class="stat-label">Разделы</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">${subthemesCount}</div>
          <div class="stat-label">Темы</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">${questionsCount}</div>
          <div class="stat-label">Вопросы</div>
        </div>
  `;
  
  if (!hasTestSub) {
    html += `
        <div class="stat-card">
          <div class="stat-number">${freeQuestionsCount}</div>
          <div class="stat-label">Доступно</div>
        </div>
    `;
  }
  
  html += `
      </div>
      
      <div class="test-card" onclick="window.startQuickTest()">
        <div class="test-icon"><div class="icon icon-random" style="width: 28px; height: 28px; background-color: var(--accent);"></div></div>
        <div class="test-info">
          <div class="test-title">Случайный тест</div>
          <div class="test-subtitle">10 случайных вопросов</div>
        </div>
      </div>
  `;
  
  if (hasTestSub) {
    html += `<div class="test-card" onclick="window.startExam()"><div class="test-icon"><div class="icon icon-exam" style="width: 28px; height: 28px; background-color: var(--accent);"></div></div><div class="test-info"><div class="test-title">Экзамен</div><div class="test-subtitle">25 вопросов (по 5 на каждый уровень)</div></div></div>`;
  } else {
    html += `<div class="test-card locked" onclick="window.showSubscriptionRequired('Экзамен')"><div class="test-icon"><div class="icon icon-exam" style="width: 28px; height: 28px; background-color: #888;"></div></div><div class="test-info"><div class="test-title">Экзамен</div><div class="test-subtitle">25 вопросов (по 5 на каждый уровень)</div><div class="test-badge locked"><div class="icon icon-lock" style="width: 10px; height: 10px; background-color: currentColor; display: inline-block;"></div> Требуется подписка</div></div><div class="subscribe-btn" onclick="event.stopPropagation(); window.openDonatSubscription('test')"><div class="icon icon-diamond" style="width: 14px; height: 14px; background-color: currentColor;"></div> Оформить</div></div>`;
  }
  
  if (hasTestSub) {
    html += `<div class="test-card" onclick="window.showThemesScreen()"><div class="test-icon"><div class="icon icon-folder" style="width: 28px; height: 28px; background-color: var(--accent);"></div></div><div class="test-info"><div class="test-title">По разделам</div><div class="test-subtitle">Выберите раздел для тренировки</div></div></div>`;
  } else {
    html += `<div class="test-card locked" onclick="window.showSubscriptionRequired('Тесты по разделам')"><div class="test-icon"><div class="icon icon-folder" style="width: 28px; height: 28px; background-color: #888;"></div></div><div class="test-info"><div class="test-title">По разделам</div><div class="test-subtitle">Выберите раздел для тренировки</div><div class="test-badge locked"><div class="icon icon-lock" style="width: 10px; height: 10px; background-color: currentColor; display: inline-block;"></div> Требуется подписка</div></div><div class="subscribe-btn" onclick="event.stopPropagation(); window.openDonatSubscription('test')"><div class="icon icon-diamond" style="width: 14px; height: 14px; background-color: currentColor;"></div> Оформить</div></div>`;
  }
  
  if (hasTestSub) {
    html += `<div class="test-card" onclick="window.showDifficultyScreen()"><div class="test-icon"><div class="icon icon-difficulty" style="width: 28px; height: 28px; background-color: var(--accent);"></div></div><div class="test-info"><div class="test-title">По сложности</div><div class="test-subtitle">Выберите уровень сложности</div></div></div>`;
  } else {
    html += `<div class="test-card locked" onclick="window.showSubscriptionRequired('Тесты по сложности')"><div class="test-icon"><div class="icon icon-difficulty" style="width: 28px; height: 28px; background-color: #888;"></div></div><div class="test-info"><div class="test-title">По сложности</div><div class="test-subtitle">Выберите уровень сложности</div><div class="test-badge locked"><div class="icon icon-lock" style="width: 10px; height: 10px; background-color: currentColor; display: inline-block;"></div> Требуется подписка</div></div><div class="subscribe-btn" onclick="event.stopPropagation(); window.openDonatSubscription('test')"><div class="icon icon-diamond" style="width: 14px; height: 14px; background-color: currentColor;"></div> Оформить</div></div>`;
  }
  
  html += `
    <div class="test-card" onclick="window.startFavoriteTest()">
      <div class="test-icon"><div class="icon icon-favorite-off" style="width: 28px; height: 28px; background-color: var(--accent);"></div></div>
      <div class="test-info">
        <div class="test-title">Избранное ${favoritesCount > 0 ? `(${favoritesCount})` : ''}</div>
        <div class="test-subtitle">Только ваши избранные вопросы</div>        
      </div>
    </div>
    
    <div class="test-card" onclick="window.showStatsScreen()">
      <div class="test-icon"><div class="icon icon-chart" style="width: 28px; height: 28px; background-color: var(--accent);"></div></div>
      <div class="test-info">
        <div class="test-title">Статистика</div>
        <div class="test-subtitle">Ваша успеваемость и прогресс</div>
      </div>
    </div>
  `;
  
  html += `</div>`;
  listEl.innerHTML = html;
}

// ===== ЭКРАНЫ =====
async function showThemesScreen() {
  const listEl = document.getElementById("topicsList");
  if (!listEl) return;
  
  // Показываем кнопку "Назад"
  const backBtn = document.getElementById("backBtn");
  if (backBtn) backBtn.classList.remove('hidden');
  
  // Скрываем остальные кнопки
  const favBtn = document.getElementById("favoriteBtn");
  if (favBtn) favBtn.classList.add('hidden');
  const submitBtn = document.getElementById("submitMultipleBtn");
  if (submitBtn) submitBtn.classList.add('hidden');
  const nextBtn = document.getElementById("nextBtn");
  if (nextBtn) nextBtn.classList.add('hidden');
  
  // Показываем testControls
  const controls = document.getElementById("testControls");
  if (controls) controls.classList.add('active');
  
  let html = `
    <div class="themes-screen">
      <h3>Выберите раздел</h3>
      <div class="themes-list">
  `;
  for (let theme of window.allThemes || []) {
    if (theme.parent_id) continue;
    const questionsCount = getActiveQuestions().filter(q => q.theme_id === theme.id).length;
    html += `
      <div class="theme-card" onclick="window.startTestByTheme('${theme.id}', '${escapeHtml(theme.title)}')">
        <div class="theme-icon"><div class="icon icon-theme" style="width: 28px; height: 28px; background-color: var(--accent);"></div></div>
        <div class="theme-info">
          <div class="theme-title">${escapeHtml(theme.title)}</div>
          <div class="theme-count">${questionsCount} вопросов</div>
        </div>
      </div>
    `;
  }
  html += `</div></div>`;
  listEl.innerHTML = html;
}

async function showDifficultyScreen() {
  const listEl = document.getElementById("topicsList");
  if (!listEl) return;
  
  // Показываем кнопку "Назад"
  const backBtn = document.getElementById("backBtn");
  if (backBtn) backBtn.classList.remove('hidden');
  
  // Скрываем остальные кнопки
  const favBtn = document.getElementById("favoriteBtn");
  if (favBtn) favBtn.classList.add('hidden');
  const submitBtn = document.getElementById("submitMultipleBtn");
  if (submitBtn) submitBtn.classList.add('hidden');
  const nextBtn = document.getElementById("nextBtn");
  if (nextBtn) nextBtn.classList.add('hidden');
  
  // Показываем testControls
  const controls = document.getElementById("testControls");
  if (controls) controls.classList.add('active');
  
  const levelIcons = {
    1: 'icon-level-novice',
    2: 'icon-level-experienced',
    3: 'icon-level-specialist',
    4: 'icon-level-top',
    5: 'icon-level-expert'
  };
  
  let html = `
    <div class="difficulty-screen">
      <h3>Выберите уровень сложности</h3>
      <div class="difficulty-list">
  `;
  for (let diff of window.allDifficulty || []) {
    const questionsCount = getActiveQuestions().filter(q => q.difficulty_level_id === diff.id).length;
    const iconClass = levelIcons[diff.id] || 'level-novice';
    html += `
      <div class="difficulty-card" onclick="window.startTestByDifficulty(${diff.id}, '${escapeHtml(diff.title)}')">
        <div class="difficulty-emoji"><div class="icon ${iconClass}" style="width: 32px; height: 32px;"></div></div>
        <div class="difficulty-info">
          <div class="difficulty-title">${escapeHtml(diff.title)}</div>
          <div class="difficulty-count">${questionsCount} вопросов</div>
        </div>
      </div>
    `;
  }
  html += `</div></div>`;
  listEl.innerHTML = html;
}

function showSubscriptionRequired(testName) {
  if (confirm(`Для доступа к "${testName}" требуется подписка TEST.\nОформить подписку?`)) {
    window.openDonatSubscription('test');
  }
}

// ===== СТАТИСТИКА =====
async function showStatsScreen() {
  const listEl = document.getElementById("topicsList");
  if (!listEl) return;
  
  // Показываем кнопку "Назад"
  const backBtn = document.getElementById("backBtn");
  if (backBtn) backBtn.classList.remove('hidden');
  
  // Скрываем остальные кнопки
  const favBtn = document.getElementById("favoriteBtn");
  if (favBtn) favBtn.classList.add('hidden');
  const submitBtn = document.getElementById("submitMultipleBtn");
  if (submitBtn) submitBtn.classList.add('hidden');
  const nextBtn = document.getElementById("nextBtn");
  if (nextBtn) nextBtn.classList.add('hidden');
  
  // Показываем testControls
  const controls = document.getElementById("testControls");
  if (controls) controls.classList.add('active');
  
  if (!currentUserId) {
    listEl.innerHTML = `
      <div class="stats-screen">
        <div class="stats-empty">Авторизуйтесь для просмотра статистики</div>
      </div>
    `;
    return;
  }
  
  const summary = await Statistics.getStatsSummary(currentUserId);
  const themeStats = await Statistics.getThemeStats(currentUserId);
  const difficultyStats = await Statistics.getDifficultyStats(currentUserId);
  const allQuestions = window.allQuestions || [];
  const totalQuestionsCount = allQuestions.length;
  
  const topThemes = [...themeStats]
    .sort((a, b) => b.unique_questions_answered - a.unique_questions_answered)
    .slice(0, 5);
  
  const themesMap = new Map();
  if (window.allThemes) {
    window.allThemes.forEach(t => themesMap.set(t.id, t.title));
  }
  
  let html = `
    <div class="stats-screen">
      <h3>Общая статистика</h3>
      <div class="stats-section">
        <div class="stats-item">
          <div class="stats-item-header">
            <span class="stats-item-label">Уникально пройдено</span>
            <span class="stats-item-value">${summary.uniqueQuestionsAnswered} / ${totalQuestionsCount}</span>
          </div>
          <div class="progress-bar-container">
            <div class="progress-bar-fill" style="width: ${(summary.uniqueQuestionsAnswered / totalQuestionsCount * 100)}%"></div>
          </div>
          <div class="stats-item-hint">Количество уникальных вопросов, на которые вы отвечали</div>
        </div>
        
        <div class="stats-item">
          <div class="stats-item-header">
            <span class="stats-item-label">Освоено вопросов</span>
            <span class="stats-item-value">${summary.masteredQuestions} / ${totalQuestionsCount}</span>
          </div>
          <div class="progress-bar-container">
            <div class="progress-bar-fill" style="width: ${(summary.masteredQuestions / totalQuestionsCount * 100)}%"></div>
          </div>
          <div class="stats-item-hint">Вопросы, где последний ответ правильный</div>
        </div>
        
        <div class="stats-item">
          <div class="stats-item-header">
            <span class="stats-item-label">Общая точность</span>
            <span class="stats-item-value">${summary.accuracyPercent}%</span>
          </div>
          <div class="progress-bar-container">
            <div class="progress-bar-fill" style="width: ${summary.accuracyPercent}%"></div>
          </div>
          <div class="stats-item-hint">Процент правильных ответов от всех</div>
        </div>
        
        <div class="stats-item">
          <div class="stats-item-header">
            <span class="stats-item-label">Среднее время на вопрос</span>
            <span class="stats-item-value">${summary.averageTimePerQuestion} сек</span>
          </div>
          <div class="stats-item-hint">Среднее время на один ответ</div>
        </div>
      </div>
      
      <h3>ТОП-5 тем по активности</h3>
      <div class="stats-section">
  `;
  
  for (const theme of topThemes) {
    const themeTitle = themesMap.get(theme.theme_id) || 'Без темы';
    const totalInTheme = allQuestions.filter(q => q.theme_id === theme.theme_id).length;
    const percent = totalInTheme > 0 ? (theme.unique_questions_answered / totalInTheme * 100) : 0;
    
    html += `
      <div class="stats-item">
        <div class="stats-item-header">
          <span class="stats-item-label">${escapeHtml(themeTitle)}</span>
          <span class="stats-item-value">${theme.unique_questions_answered} / ${totalInTheme}</span>
        </div>
        <div class="progress-bar-container">
          <div class="progress-bar-fill" style="width: ${percent}%"></div>
        </div>
        <div class="stats-item-hint">Точность: ${theme.accuracy_percent}%</div>
      </div>
    `;
  }
  
  html += `
        <button class="stats-all-btn" onclick="window.showAllThemesStats()">Все темы →</button>
      </div>
      
      <h3>По уровням сложности</h3>
      <div class="stats-section">
  `;
  
  const difficultyMap = new Map();
  if (window.allDifficulty) {
    window.allDifficulty.forEach(d => difficultyMap.set(d.id, d.title));
  }
  
  for (const diff of difficultyStats) {
    const diffTitle = difficultyMap.get(diff.difficulty_level_id) || `Уровень ${diff.difficulty_level_id}`;
    const totalInDiff = allQuestions.filter(q => q.difficulty_level_id === diff.difficulty_level_id).length;
    const percent = totalInDiff > 0 ? (diff.unique_questions_answered / totalInDiff * 100) : 0;
    
    html += `
      <div class="stats-item">
        <div class="stats-item-header">
          <span class="stats-item-label">${escapeHtml(diffTitle)}</span>
          <span class="stats-item-value">${diff.unique_questions_answered} / ${totalInDiff}</span>
        </div>
        <div class="progress-bar-container">
          <div class="progress-bar-fill" style="width: ${percent}%"></div>
        </div>
        <div class="stats-item-hint">Точность: ${diff.accuracy_percent}%</div>
      </div>
    `;
  }
  
  html += `
      </div>
    </div>
  `;
  
  listEl.innerHTML = html;
}

async function showAllThemesStats() {
  const listEl = document.getElementById("topicsList");
  if (!listEl) return;
  
  // Показываем кнопку "Назад"
  const backBtn = document.getElementById("backBtn");
  if (backBtn) backBtn.classList.remove('hidden');
  
  // Скрываем остальные кнопки
  const favBtn = document.getElementById("favoriteBtn");
  if (favBtn) favBtn.classList.add('hidden');
  const submitBtn = document.getElementById("submitMultipleBtn");
  if (submitBtn) submitBtn.classList.add('hidden');
  const nextBtn = document.getElementById("nextBtn");
  if (nextBtn) nextBtn.classList.add('hidden');
  
  // Показываем testControls
  const controls = document.getElementById("testControls");
  if (controls) controls.classList.add('active');
  
  const themeStats = await Statistics.getThemeStats(currentUserId);
  const allQuestions = window.allQuestions || [];
  const themesMap = new Map();
  if (window.allThemes) {
    window.allThemes.forEach(t => themesMap.set(t.id, t.title));
  }
  
  const sortedThemes = [...themeStats].sort((a, b) => b.unique_questions_answered - a.unique_questions_answered);
  
  let html = `
    <div class="stats-screen">
      <h3>Статистика по всем темам</h3>
      <div class="stats-section all-themes">
  `;
  
  for (const theme of sortedThemes) {
    const themeTitle = themesMap.get(theme.theme_id) || 'Без темы';
    const totalInTheme = allQuestions.filter(q => q.theme_id === theme.theme_id).length;
    const percent = totalInTheme > 0 ? (theme.unique_questions_answered / totalInTheme * 100) : 0;
    
    html += `
      <div class="stats-item">
        <div class="stats-item-header">
          <span class="stats-item-label">${escapeHtml(themeTitle)}</span>
          <span class="stats-item-value">${theme.unique_questions_answered} / ${totalInTheme}</span>
        </div>
        <div class="progress-bar-container">
          <div class="progress-bar-fill" style="width: ${percent}%"></div>
        </div>
        <div class="stats-item-hint">Точность: ${theme.accuracy_percent}% | Освоено: ${theme.mastered_questions}</div>
      </div>
    `;
  }
  
  html += `
      </div>
    </div>
  `;
  
  listEl.innerHTML = html;
}

// ===== ЗАПУСК ТЕСТОВ =====
async function startQuickTest() { const test = await generateQuickTest(); if (test) startTest(test); }
async function startExam() { const test = await generateExam(); if (test) startTest(test); }
async function startTestByTheme(themeId, themeTitle) { const test = await generateTestByTheme(themeId, themeTitle); if (test) startTest(test); }
async function startTestByDifficulty(difficultyId, difficultyTitle) { const test = await generateTestByDifficulty(difficultyId, difficultyTitle); if (test) startTest(test); }
async function startFavoriteTest() { const test = await generateFavoriteTest(); if (test) startTest(test); }

// ОСНОВНАЯ ФУНКЦИЯ ЗАПУСКА ТЕСТА
async function startTest(testConfig) {
  if (!testConfig.questions || testConfig.questions.length === 0) {
    showNotification('В этом тесте пока нет вопросов', 'error');
    return;
  }

  currentTestConfig = testConfig;
  currentQuestions = testConfig.questions;
  currentQuestionIndex = 0;
  currentScore = 0;
  currentAnsweredQuestions = [];
  currentAnswered = false;
  currentMultipleSelected = [];
  currentAttemptId = null;

  const startedAt = Date.now();

  if (currentUserId) {
    Statistics.reset();
    Statistics.setCurrentUser(currentUserId);
    Statistics.setCurrentQuestions(currentQuestions);
    Statistics.setCurrentScore(0);
    Statistics.setTestStartTime(startedAt);

    currentAttemptId = await Statistics.createTestAttempt(testConfig, currentQuestions);
    console.log('📊 Попытка создана:', currentAttemptId);
  }

  // Скрываем кнопку "Назад" во время теста
  const backBtn = document.getElementById("backBtn");
  if (backBtn) backBtn.classList.add('hidden');

  const listEl = document.getElementById("topicsList");
  if (listEl) listEl.innerHTML = "";

  const testArea = document.getElementById("testArea");
  if (testArea) {
    testArea.classList.add('test-active');
    testArea.classList.add('padding-bottom');
  }

  testStartTime = startedAt;
  showTestControls();
  startTestTimer();
  showQuestion();
  hideBottomNav();
}

function showQuestion() {
  const testArea = document.getElementById("testArea");
  if (!testArea) return;
  
  currentAnswered = false;
  currentMultipleSelected = [];
  const nextBtn = document.getElementById("nextBtn");
  if (nextBtn) nextBtn.classList.add('hidden');
  clearTestAutoTransition();
  
  const q = currentQuestions[currentQuestionIndex];
  const total = currentQuestions.length;
  const progressPct = Math.round(((currentQuestionIndex + 1) / total) * 100);
  const letters = ['А', 'Б', 'В', 'Г', 'Д', 'Е'];
  
  const isMultiple = q.type === 'multiple';
  
  const existingAnswer = currentAnsweredQuestions.find(a => a.index === currentQuestionIndex);
  const alreadyAnswered = !!existingAnswer;
  let restoredSelectedIds = [];
  if (alreadyAnswered && isMultiple) {
    restoredSelectedIds = existingAnswer.selectedAnswers || [];
    currentMultipleSelected = [...restoredSelectedIds];
  }
  
  const hasImage = q.image && q.image.trim() !== '';
  const imageUrl = hasImage ? getQuestionImageUrl(q.image) : '';
  const imageHtml = hasImage ? `
    <div class="question-image-container">
      <img src="${imageUrl}" class="question-image" alt="Изображение к вопросу" onerror="console.log('Ошибка загрузки изображения:', this.src); this.style.display='none'; if(this.parentElement) this.parentElement.style.display='none';">
    </div>
  ` : '';
  
  let answersHtml = '';
  if (isMultiple) {
    answersHtml = `
      <div class="multiple-hint">
        <div class="icon icon-info" style="width: 14px; height: 14px; background-color: var(--accent); display: inline-block;"></div>
        Выберите несколько вариантов ответа
      </div>
      <div id="answers">
        ${q.answers.map((ans, i) => {
          return `
            <div class="answer-multiple" id="ansMultiple${i}" data-answer-id="${ans.id}" data-index="${i}">
              <div class="badge">${letters[i]}</div>
              <div class="ans-text">${escapeHtml(ans.text)}</div>
            </div>
          `;
        }).join("")}
      </div>
    `;
  } else {
    answersHtml = `
      <div id="answers">
        ${q.answers.map((ans, i) => {
          return `<button class="button" id="ans${i}" onclick="window.selectAnswer(${i})" ${alreadyAnswered ? 'disabled' : ''}><div class="ans"><div class="badge">${letters[i]}</div><div class="ans-text">${escapeHtml(ans.text)}</div></div></button>`;
        }).join("")}
      </div>
    `;
  }
  
  testArea.innerHTML = `
    <div class="card">
      <div class="row">
        <span class="pill" id="timer"><div class="icon icon-timer" style="width: 14px; height: 14px; background-color: currentColor;"></div> 00:00</span>
        <span class="pill">Вопрос ${currentQuestionIndex + 1}/${total}</span>
      </div>
      <div class="progress-bar" style="--total: ${total}"><div class="progress" style="--total: ${total}; width: ${progressPct}%"></div></div>
      <h3 class="question-title">${escapeHtml(q.text)}</h3>
      ${imageHtml}
      ${answersHtml}
      <div id="commentArea"></div>
    </div>
  `;
  
  if (currentUserId && !alreadyAnswered) {
    Statistics.setCurrentQuestionIndex(currentQuestionIndex);
    Statistics.startQuestionTimer();
  }
  
  const favBtn = document.getElementById("favoriteBtn");
  if (favBtn && !alreadyAnswered && currentVkId) {
    favBtn.onclick = () => toggleFavorite(q.id);
  }
  
  if (alreadyAnswered) {
    const correctIds = getCorrectAnswerIds(q);
    
    if (isMultiple) {
      q.answers.forEach((ans, i) => {
        const answerDiv = document.getElementById(`ansMultiple${i}`);
        if (!answerDiv) return;
        
        const isCorrectAnswer = correctIds.includes(ans.id);
        const wasSelected = restoredSelectedIds.includes(ans.id);
        
        answerDiv.classList.remove('multiple-selected');
        answerDiv.classList.add('disabled');
        
        if (isCorrectAnswer) {
          answerDiv.classList.add('correct-permanent');
        } else if (wasSelected && !isCorrectAnswer) {
          answerDiv.classList.add('wrong-permanent');
        }
        
        answerDiv.style.cursor = 'default';
      });
    } else {
      const correctIndex = q.answers.findIndex(a => a.is_correct === 1 || a.is_correct === true);
      const correctBtn = document.getElementById("ans" + correctIndex);
      if (correctBtn) correctBtn.classList.add("correct-permanent");
    }
    
    showComment(q.explanation);
    if (nextBtn) nextBtn.classList.remove('hidden');
    
    const submitBtn = document.getElementById("submitMultipleBtn");
    if (submitBtn) submitBtn.classList.add('hidden');
  } else if (isMultiple) {
    q.answers.forEach((ans, i) => {
      const answerDiv = document.getElementById(`ansMultiple${i}`);
      if (answerDiv) {
        answerDiv.addEventListener('click', () => {
          if (currentAnswered) return;
          
          const answerId = ans.id;
          const wasSelected = currentMultipleSelected.includes(answerId);
          
          if (wasSelected) {
            currentMultipleSelected = currentMultipleSelected.filter(id => id !== answerId);
            answerDiv.classList.remove('multiple-selected');
          } else {
            currentMultipleSelected.push(answerId);
            answerDiv.classList.add('multiple-selected');
          }
          
          const submitBtn = document.getElementById("submitMultipleBtn");
          if (submitBtn) {
            submitBtn.disabled = currentMultipleSelected.length === 0;
          }
        });
        
        if (restoredSelectedIds.includes(ans.id)) {
          answerDiv.classList.add('multiple-selected');
        }
      }
    });
    
    const submitBtn = document.getElementById("submitMultipleBtn");
    if (submitBtn) {
      submitBtn.disabled = restoredSelectedIds.length === 0;
    }
  }
  
  updateSubmitButtonVisibility();
  
  setTimeout(() => {
    if (currentVkId) {
      updateFavoriteButton(q.id);
    }
  }, 50);
}

function updateSubmitButtonVisibility() {
  const q = currentQuestions[currentQuestionIndex];
  const isMultiple = q?.type === 'multiple';
  const alreadyAnswered = currentAnsweredQuestions.some(a => a.index === currentQuestionIndex);
  const submitBtn = document.getElementById("submitMultipleBtn");
  
  if (submitBtn) {
    if (isMultiple && !alreadyAnswered && !currentAnswered) {
      submitBtn.classList.remove('hidden');
    } else {
      submitBtn.classList.add('hidden');
    }
  }
}

async function submitMultipleAnswer() {
  if (currentAnswered) return;
  if (currentMultipleSelected.length === 0) return;
  
  const q = currentQuestions[currentQuestionIndex];
  const isCorrect = checkMultipleAnswer(q, currentMultipleSelected);
  
  currentAnswered = true;
  
  const correctIds = getCorrectAnswerIds(q);
  
  for (let i = 0; i < q.answers.length; i++) {
    const answerDiv = document.getElementById(`ansMultiple${i}`);
    if (answerDiv) {
      answerDiv.classList.add('disabled');
    }
  }
  
  q.answers.forEach((ans, i) => {
    const answerDiv = document.getElementById(`ansMultiple${i}`);
    if (!answerDiv) return;
    
    const isCorrectAnswer = correctIds.includes(ans.id);
    const wasSelected = currentMultipleSelected.includes(ans.id);
    
    answerDiv.classList.remove('multiple-selected');
    
    if (isCorrectAnswer && wasSelected) {
      answerDiv.classList.add('correct-flash');
      setTimeout(() => {
        answerDiv.classList.remove('correct-flash');
        answerDiv.classList.add('correct-permanent');
      }, 1000);
    } else if (isCorrectAnswer && !wasSelected) {
      answerDiv.classList.add('correct-permanent');
    } else if (wasSelected && !isCorrectAnswer) {
      answerDiv.classList.add('wrong-permanent');
    }
  });
  
  const submitBtn = document.getElementById("submitMultipleBtn");
  if (submitBtn) submitBtn.classList.add('hidden');
  
  if (currentUserId && currentAttemptId) {
    Statistics.saveAttemptAnswer(q, currentMultipleSelected, isCorrect).catch(e => console.error);
    if (isCorrect) {
      currentScore++;
      Statistics.setCurrentScore(currentScore);
    }
    Statistics.updateTestAttemptSummary(false).catch(e => console.error);
  } else {
    if (isCorrect) currentScore++;
  }
  
  if (isCorrect) {
    showComment(q.explanation);
    
    currentAnsweredQuestions.push({
      index: currentQuestionIndex,
      selectedAnswers: currentMultipleSelected,
      isCorrect: true
    });
    
    testAutoTransitionTimer = setTimeout(() => {
      nextQuestion();
    }, 1200);
  } else {
    showComment(q.explanation);
    
    currentAnsweredQuestions.push({
      index: currentQuestionIndex,
      selectedAnswers: currentMultipleSelected,
      isCorrect: false
    });
    
    const nextBtn = document.getElementById("nextBtn");
    if (nextBtn) {
      nextBtn.classList.remove('hidden');
    }
  }
}

async function selectAnswer(index) {
  if (currentAnswered) return;
  
  const q = currentQuestions[currentQuestionIndex];
  if (q.type === 'multiple') return;
  
  currentAnswered = true;
  
  const isCorrect = q.answers[index].is_correct === 1 || q.answers[index].is_correct === true;
  const selectedBtn = document.getElementById("ans" + index);
  
  for (let i = 0; i < q.answers.length; i++) {
    const btn = document.getElementById("ans" + i);
    if (btn) btn.disabled = true;
  }
  
  if (currentUserId && currentAttemptId) {
    const selectedAnswerIds = [q.answers[index].id];
    Statistics.saveAttemptAnswer(q, selectedAnswerIds, isCorrect).catch(e => console.error);
    if (isCorrect) {
      currentScore++;
      Statistics.setCurrentScore(currentScore);
    }
    Statistics.updateTestAttemptSummary(false).catch(e => console.error);
  }
  
  if (isCorrect) {
    if (selectedBtn) {
      selectedBtn.classList.add("correct-flash");
      setTimeout(() => {
        selectedBtn.classList.remove("correct-flash");
        selectedBtn.classList.add("correct-permanent");
      }, 1000);
    }
    showComment(q.explanation);
    
    currentAnsweredQuestions.push({
      index: currentQuestionIndex,
      selectedAnswers: [q.answers[index].id],
      isCorrect: true
    });
    
    testAutoTransitionTimer = setTimeout(() => {
      nextQuestion();
    }, 1200);
    
  } else {
    const correctIndex = q.answers.findIndex(a => a.is_correct === 1 || a.is_correct === true);
    const correctBtn = document.getElementById("ans" + correctIndex);
    
    if (selectedBtn) {
      selectedBtn.classList.add("wrong-permanent");
    }
    
    if (correctBtn) {
      correctBtn.classList.add("correct-permanent");
    }
    
    showComment(q.explanation);
    
    currentAnsweredQuestions.push({
      index: currentQuestionIndex,
      selectedAnswers: [q.answers[index].id],
      isCorrect: false
    });
    
    const nextBtn = document.getElementById("nextBtn");
    if (nextBtn) {
      nextBtn.classList.remove('hidden');
    }
  }
}

function showComment(text) {
  const ca = document.getElementById("commentArea");
  if (ca) ca.innerHTML = `<div class="comment"><div class="icon icon-comment" style="width: 16px; height: 16px; background-color: var(--accent); display: inline-block;"></div> ${escapeHtml(text)}</div>`;
}

function nextQuestion() {
  clearTestAutoTransition();
  const total = currentQuestions.length;
  let nextQ = currentQuestionIndex + 1;
  while (nextQ < total && currentAnsweredQuestions.some(a => a.index === nextQ)) nextQ++;
  if (nextQ < total) {
    currentQuestionIndex = nextQ;
    showQuestion();
  } else {
    finishTest();
  }
}

async function finishTest() {
  clearTestAutoTransition();
  
  if (currentUserId && currentAttemptId) {
    await Statistics.updateTestAttemptSummary(true);
  }
  
  showTestResult();
}

function exitTest() {
  stopTestTimer();
  clearTestAutoTransition();
  
  currentTestConfig = null;
  
  const testArea = document.getElementById("testArea");
  if (testArea) {
    testArea.innerHTML = "";
    testArea.classList.remove('test-active');
  }
  renderTestsList();
  showBottomNav();
}

function showTestResult() {
  stopTestTimer();
  hideTestControls();
  clearTestAutoTransition();
  const total = currentQuestions.length;
  const wrong = total - currentScore;
  const percent = Math.round((currentScore / total) * 100);
  const timeSpent = getElapsedSeconds();
  const testArea = document.getElementById("testArea");
  if (!testArea) return;
  
  testArea.innerHTML = `
    <div class="card result-card">
      <div class="result-title">Результат</div>
      <div class="subtle">${currentTestConfig?.title || 'Тест'} завершен</div>
      
      <div class="result-percent">${percent}%</div>
      
      <div class="progress-bar-container result-progress">
        <div class="progress-bar-fill" style="width: ${percent}%; background-color: #2ecc71;"></div>
      </div>
      
      <div class="result-stats">
        <div class="result-stat">
          <span class="stat-label">Правильно</span>
          <span class="stat-value">${currentScore}</span>
        </div>
        <div class="result-stat">
          <span class="stat-label">Неправильно</span>
          <span class="stat-value">${wrong}</span>
        </div>
        <div class="result-stat">
          <span class="stat-label">Всего</span>
          <span class="stat-value">${total}</span>
        </div>
        <div class="result-stat">
          <span class="stat-label">Время</span>
          <span class="stat-value">${formatSeconds(timeSpent)}</span>
        </div>
      </div>
      
      <div class="result-buttons">
        <button class="button primary" onclick="window.restartTest()">Пройти ещё раз</button>
        <button class="button" onclick="window.renderTestsList()">К списку тестов</button>
      </div>
    </div>
  `;
  
  showBottomNav();
}

function restartTest() {
  startTest(currentTestConfig);
}

function escapeHtml(text) {
  if (!text) return '';
  return text.replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
}

function goBack() {
  stopTestTimer();
  clearTestAutoTransition();
  currentTestConfig = null;
  const testArea = document.getElementById("testArea");
  if (testArea) {
    testArea.innerHTML = "";
    testArea.classList.remove('test-active');
  }
  renderTestsList();
  showBottomNav();
  
  const backBtn = document.getElementById("backBtn");
  if (backBtn) backBtn.classList.add('hidden');
}

// ===== ПОЛУЧЕНИЕ UUID ПОЛЬЗОВАТЕЛЯ =====
async function getUserUUID(vkId) {
  try {
    const response = await fetch(`${CONFIG.API_URL}/users/vk/${vkId}`);
    if (response.ok) {
      const userData = await response.json();
      return userData.id;
    }
  } catch (err) {
    console.error('Ошибка получения UUID:', err);
  }
  return null;
}

// ===== ИНИЦИАЛИЗАЦИЯ =====
async function initUser() {
  try {
    await Promise.all([
      loadQuestions(),
      loadThemes(),
      loadDifficultyLevels()
    ]);
    
    renderTestsList();
    
    if (window.currentUser?.id) {
      currentVkId = window.currentUser.id;
      const uuid = await getUserUUID(currentVkId);
      if (uuid) {
        currentUserId = uuid;
        console.log('👤 Пользователь инициализирован (UUID):', currentUserId);
        console.log('👤 VK ID:', currentVkId);
        Statistics.setCurrentUser(currentUserId);
        await loadTestProgressFromDB();
        await loadFavorites();
        renderTestsList();
      }
      return;
    }
    console.log('⏳ Пользователь ещё не загружен, ждём событие userLoaded...');
  } catch (err) {
    console.error('❌ Ошибка initUser:', err);
  }
}

window.addEventListener('userLoaded', async (e) => {
  try {
    if (!e.detail?.id) return;
    currentVkId = e.detail.id;
    const uuid = await getUserUUID(currentVkId);
    if (uuid) {
      currentUserId = uuid;
      console.log('👤 Пользователь загружен из события (UUID):', currentUserId);
      console.log('👤 VK ID:', currentVkId);
      Statistics.setCurrentUser(currentUserId);
      await loadTestProgressFromDB();
      await loadFavorites();
      renderTestsList();
    }
  } catch (err) {
    console.error('❌ Ошибка обработки userLoaded:', err);
  }
});

// ===== ЭКСПОРТ =====
window.loadQuestions = loadQuestions;
window.renderTestsList = renderTestsList;
window.startQuickTest = startQuickTest;
window.startExam = startExam;
window.startTestByTheme = startTestByTheme;
window.startTestByDifficulty = startTestByDifficulty;
window.startFavoriteTest = startFavoriteTest;
window.startTest = startTest;
window.selectAnswer = selectAnswer;
window.submitMultipleAnswer = submitMultipleAnswer;
window.nextQuestion = nextQuestion;
window.finishTest = finishTest;
window.exitTest = exitTest;
window.restartTest = restartTest;
window.initUser = initUser;
window.hideTestControls = hideTestControls;
window.showTestControls = showTestControls;
window.clearAutoTransition = clearTestAutoTransition;
window.showThemesScreen = showThemesScreen;
window.showDifficultyScreen = showDifficultyScreen;
window.showSubscriptionRequired = showSubscriptionRequired;
window.hasTestSubscription = hasTestSubscription;
window.getQuestionImageUrl = getQuestionImageUrl;
window.toggleFavorite = toggleFavorite;
window.updateFavoriteButton = updateFavoriteButton;
window.showNotification = showNotification;
window.showStatsScreen = showStatsScreen;
window.showAllThemesStats = showAllThemesStats;
window.goBack = goBack;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initUser);
} else {
  initUser();
}
