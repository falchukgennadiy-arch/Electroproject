// ===== ТЕСТЫ =====
// Главный экран: статистика + 5 кнопок (Случайный тест, Экзамен, По темам, По сложности, Избранное)

let currentTestConfig = null;
let currentQuestions = [];
let currentQuestionIndex = 0;
let currentScore = 0;
let currentAnswered = false;
let currentAnsweredQuestions = [];
let currentUserId = null;
let currentAttemptId = null;
let currentTestMode = 'exam';
let currentMultipleSelected = [];
let currentFavoriteStatus = {};

// Локальные таймеры
let testStartTime = null;
let testTimerInterval = null;
let testAutoTransitionTimer = null;

// Глобальный прогресс
const sharedTestProgress = window.testProgress || {};
window.testProgress = sharedTestProgress;

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
  if (!currentUserId) return [];
  try {
    const favorites = await API.getFavorites(currentUserId);
    return favorites.map(q => q.id);
  } catch (err) {
    console.error('Ошибка загрузки избранного:', err);
    return [];
  }
}

async function checkFavoriteStatus(questionId) {
  if (!currentUserId) return false;
  if (currentFavoriteStatus[questionId] !== undefined) {
    return currentFavoriteStatus[questionId];
  }
  try {
    const result = await API.checkFavorite(currentUserId, questionId);
    currentFavoriteStatus[questionId] = result.is_favorite;
    return result.is_favorite;
  } catch (err) {
    console.error('Ошибка проверки избранного:', err);
    return false;
  }
}

async function toggleFavorite(questionId) {
  if (!currentUserId) {
    showNotification('Войдите в аккаунт, чтобы добавлять в избранное', 'warning');
    return false;
  }
  
  const isCurrentlyFavorite = await checkFavoriteStatus(questionId);
  
  try {
    if (isCurrentlyFavorite) {
      await API.removeFavorite(currentUserId, questionId);
      currentFavoriteStatus[questionId] = false;
      await updateFavoriteButton(questionId);
      return false;
    } else {
      await API.addFavorite(currentUserId, questionId);
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
  if (isFavorite) {
    favBtn.innerHTML = '★';
    favBtn.classList.add('active');
  } else {
    favBtn.innerHTML = '☆';
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
    if (el) el.textContent = "⏱ " + formatSeconds(getElapsedSeconds());
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
  if (favBtn && currentUserId) {
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
  if (!currentUserId) return false;
  try {
    const userRes = await fetch(`${CONFIG.API_URL}/users/vk/${currentUserId}`);
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

// ===== РАБОТА С ПРОГРЕССОМ =====
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
    
    Object.assign(sharedTestProgress, progressMap);
    window.testProgress = sharedTestProgress;
    console.log('📊 Прогресс загружен из БД');
  } catch (e) {
    console.error('Ошибка загрузки прогресса из БД:', e);
  }
}

async function saveTestProgressToDB(completed = false) {
  if (!currentTestConfig || !currentUserId) return;
  
  const key = `${currentTestConfig.type}_${currentTestConfig.id || 'quick'}`;
  const existingProgress = sharedTestProgress[key];
  
  const attemptData = {
    id: existingProgress?.attemptId || 'att_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
    user_id: currentUserId,
    test_id: key,
    questions_ids: JSON.stringify(currentQuestions.map(q => q.id)),
    answers: JSON.stringify(currentAnsweredQuestions),
    total_score: currentScore,
    correct_count: currentScore,
    wrong_count: currentQuestions.length - currentScore,
    time_spent: getElapsedSeconds(),
    started_at: new Date(testStartTime).toISOString(),
    completed_at: completed ? new Date().toISOString() : null,
    status: completed ? 'completed' : 'in_progress'
  };
  
  try {
    if (existingProgress?.attemptId) {
      await API.updateTestAttempt(existingProgress.attemptId, {
        total_score: attemptData.total_score,
        correct_count: attemptData.correct_count,
        wrong_count: attemptData.wrong_count,
        time_spent: attemptData.time_spent,
        completed_at: attemptData.completed_at,
        status: attemptData.status
      });
      currentAttemptId = existingProgress.attemptId;
    } else {
      const result = await API.saveTestAttempt(attemptData);
      currentAttemptId = result.id;
    }
    
    sharedTestProgress[key] = {
      ...sharedTestProgress[key],
      score: currentScore,
      answered: currentAnsweredQuestions,
      currentQuestion: currentQuestionIndex,
      total: currentQuestions.length,
      completed: completed,
      attemptId: currentAttemptId,
      questionsIds: currentQuestions.map(q => q.id)
    };
    window.testProgress = sharedTestProgress;
    
    console.log('💾 Прогресс сохранён в БД');
  } catch (e) {
    console.error('Ошибка сохранения прогресса в БД:', e);
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
  return { id: `theme_${themeId}`, title: `${themeTitle}`, type: 'theme', questions: questions };
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
  return { id: `difficulty_${difficultyId}`, title: `${difficultyTitle}`, type: 'difficulty', questions: questions };
}

async function generateFavoriteTest() {
  if (!currentUserId) {
    showNotification('Войдите в аккаунт, чтобы использовать избранное', 'warning');
    return null;
  }
  
  const favoriteIds = await loadFavorites();
  if (favoriteIds.length === 0) {
    showNotification('У вас нет избранных вопросов. Добавьте вопросы в избранное через кнопку ☆ во время тестирования', 'warning');
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

// ===== СТАТИСТИКА =====
async function getUserStats() {
  const activeQuestions = getActiveQuestions();
  const stats = {
    totalQuestions: activeQuestions.length,
    completedTests: 0,
    avgScore: 0,
    totalCorrect: 0,
    totalAnswered: 0
  };
  
  if (currentUserId) {
    try {
      const attempts = await API.getTestAttemptsByUser(currentUserId);
      const completed = attempts.filter(a => a.status === 'completed');
      stats.completedTests = completed.length;
      
      if (completed.length > 0) {
        let totalScore = 0;
        let totalQuestions = 0;
        for (const a of completed) {
          totalScore += a.total_score || 0;
          const qIds = a.questions_ids ? JSON.parse(a.questions_ids) : [];
          totalQuestions += qIds.length;
        }
        stats.avgScore = totalQuestions > 0 ? Math.round((totalScore / totalQuestions) * 100) : 0;
        stats.totalCorrect = totalScore;
        stats.totalAnswered = totalQuestions;
      }
    } catch (e) { console.error(e); }
  }
  
  return stats;
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

  let icon = 'ℹ️';
  if (type === 'error') icon = '❌';
  if (type === 'warning') icon = '⚠️';
  if (type === 'success') icon = '✅';

  const bg = type === 'error' ? 'rgba(231, 76, 60, 0.95)' :
              type === 'warning' ? 'rgba(243, 156, 18, 0.95)' :
              type === 'success' ? 'rgba(46, 204, 113, 0.95)' :
              'rgba(52, 152, 219, 0.95)';

  notification.innerHTML = `
    <div class="notification-content" style="background: ${bg}">
      <span class="notification-icon">${icon}</span>
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
  if (!listEl) return;
  
  const hasTestSub = await hasTestSubscription();
  window.userSubscriptions = window.userSubscriptions || {};
  window.userSubscriptions.test = hasTestSub;
  
  const stats = await getUserStats();
  const progressPercent = stats.totalAnswered > 0 ? Math.round((stats.totalCorrect / stats.totalAnswered) * 100) : 0;
  
  let html = `
    <div class="tests-main-screen">
      <div class="stats-block">
        <div class="stats-header-cards">
          <div class="stat-card">
            <div class="stat-number">${stats.totalQuestions}</div>
            <div class="stat-label">всего вопросов</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${stats.completedTests}</div>
            <div class="stat-label">пройдено тестов</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${stats.avgScore}%</div>
            <div class="stat-label">средний балл</div>
          </div>
        </div>
        <div class="stats-progress">
          <div class="progress-circle">
            <canvas id="statsPie" width="80" height="80"></canvas>
            <div class="progress-percent">${progressPercent}%</div>
          </div>
          <div class="progress-text">
            <div>✅ правильно: ${stats.totalCorrect}</div>
            <div>❌ неправильно: ${stats.totalAnswered - stats.totalCorrect}</div>
            <div>📊 всего ответов: ${stats.totalAnswered}</div>
          </div>
        </div>
      </div>
      
      <div class="test-card" onclick="window.startQuickTest()">
        <div class="test-icon">🎲</div>
        <div class="test-info">
          <div class="test-title">Случайный тест</div>
          <div class="test-subtitle">10 случайных вопросов</div>
         </div>
      </div>
  `;
  
  if (hasTestSub) {
    html += `<div class="test-card" onclick="window.startExam()"><div class="test-icon">🎓</div><div class="test-info"><div class="test-title">Экзамен</div><div class="test-subtitle">25 вопросов (по 5 на каждый уровень)</div></div></div>`;
  } else {
    html += `<div class="test-card locked" onclick="window.showSubscriptionRequired('Экзамен')"><div class="test-icon">🎓</div><div class="test-info"><div class="test-title">Экзамен</div><div class="test-subtitle">25 вопросов (по 5 на каждый уровень)</div><div class="test-badge locked">🔒 Требуется подписка</div></div><div class="subscribe-btn" onclick="event.stopPropagation(); window.openDonatSubscription('test')">💎 Оформить</div></div>`;
  }
  
  if (hasTestSub) {
    html += `<div class="test-card" onclick="window.showThemesScreen()"><div class="test-icon">📂</div><div class="test-info"><div class="test-title">По темам</div><div class="test-subtitle">Выберите тему для тренировки</div></div></div>`;
  } else {
    html += `<div class="test-card locked" onclick="window.showSubscriptionRequired('Тесты по темам')"><div class="test-icon">📂</div><div class="test-info"><div class="test-title">По темам</div><div class="test-subtitle">Выберите тему для тренировки</div><div class="test-badge locked">🔒 Требуется подписка</div></div><div class="subscribe-btn" onclick="event.stopPropagation(); window.openDonatSubscription('test')">💎 Оформить</div></div>`;
  }
  
  if (hasTestSub) {
    html += `<div class="test-card" onclick="window.showDifficultyScreen()"><div class="test-icon">⭐</div><div class="test-info"><div class="test-title">По сложности</div><div class="test-subtitle">Выберите уровень сложности</div></div></div>`;
  } else {
    html += `<div class="test-card locked" onclick="window.showSubscriptionRequired('Тесты по сложности')"><div class="test-icon">⭐</div><div class="test-info"><div class="test-title">По сложности</div><div class="test-subtitle">Выберите уровень сложности</div><div class="test-badge locked">🔒 Требуется подписка</div></div><div class="subscribe-btn" onclick="event.stopPropagation(); window.openDonatSubscription('test')">💎 Оформить</div></div>`;
  }
  
  html += `
    <div class="test-card" onclick="window.startFavoriteTest()">
      <div class="test-icon">★</div>
      <div class="test-info">
        <div class="test-title">Избранное</div>
        <div class="test-subtitle">Только ваши избранные вопросы</div>        
      </div>
    </div>
  `;
  
  html += `</div>`;
  listEl.innerHTML = html;
  
  setTimeout(() => drawStatsPie(progressPercent), 50);
}

function drawStatsPie(percent) {
  const canvas = document.getElementById("statsPie");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const correctAngle = (percent / 100) * 2 * Math.PI;
  const wrongAngle = 2 * Math.PI - correctAngle;
  
  ctx.clearRect(0, 0, 80, 80);
  ctx.beginPath();
  ctx.moveTo(40, 40);
  ctx.arc(40, 40, 35, 0, correctAngle);
  ctx.fillStyle = "#2ecc71";
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(40, 40);
  ctx.arc(40, 40, 35, correctAngle, correctAngle + wrongAngle);
  ctx.fillStyle = "#e74c3c";
  ctx.fill();
}

// ===== ЭКРАНЫ =====
async function showThemesScreen() {
  const listEl = document.getElementById("topicsList");
  if (!listEl) return;
  let html = `
    <div class="themes-screen">
      <button class="back-btn" onclick="window.renderTestsList()">← Назад</button>
      <h3>Выберите тему</h3>
      <div class="themes-list">
  `;
  for (let theme of window.allThemes || []) {
    if (theme.parent_id) continue;
    const questionsCount = getActiveQuestions().filter(q => q.theme_id === theme.id).length;
    const progress = sharedTestProgress[`theme_${theme.id}`];
    let progressText = '';
    if (progress && progress.completed) progressText = `<span class="progress-completed">✅ Пройден: ${progress.score}/${progress.total}</span>`;
    else if (progress && progress.currentQuestion > 0) progressText = `<span class="progress-inprogress">⏳ Прогресс: ${progress.currentQuestion}/${progress.total}</span>`;
    html += `
      <div class="theme-card" onclick="window.startTestByTheme('${theme.id}', '${escapeHtml(theme.title)}')">
        <div class="theme-icon">📂</div>
        <div class="theme-info">
          <div class="theme-title">${escapeHtml(theme.title)}</div>
          <div class="theme-count">${questionsCount} вопросов</div>
          ${progressText}
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
  let html = `
    <div class="difficulty-screen">
      <button class="back-btn" onclick="window.renderTestsList()">← Назад</button>
      <h3>Выберите уровень сложности</h3>
      <div class="difficulty-list">
  `;
  for (let diff of window.allDifficulty || []) {
    const questionsCount = getActiveQuestions().filter(q => q.difficulty_level_id === diff.id).length;
    const emoji = diff.id === 1 ? '🟢' : diff.id === 5 ? '🔴' : '🟡';
    html += `
      <div class="difficulty-card" onclick="window.startTestByDifficulty('${diff.id}', '${escapeHtml(diff.title)}')">
        <div class="difficulty-emoji">${emoji}</div>
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

// ===== ЗАПУСК ТЕСТОВ =====
async function startQuickTest() { const test = await generateQuickTest(); if (test) startTest(test); }
async function startExam() { const test = await generateExam(); if (test) startTest(test); }
async function startTestByTheme(themeId, themeTitle) { const test = await generateTestByTheme(themeId, themeTitle); if (test) startTest(test); }
async function startTestByDifficulty(difficultyId, difficultyTitle) { const test = await generateTestByDifficulty(difficultyId, difficultyTitle); if (test) startTest(test); }
async function startFavoriteTest() { const test = await generateFavoriteTest(); if (test) startTest(test); }

function startTest(testConfig) {
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
  const listEl = document.getElementById("topicsList");
  if (listEl) listEl.innerHTML = "";
  const testArea = document.getElementById("testArea");
  if (testArea) {
    testArea.classList.add('test-active');
    testArea.classList.add('padding-bottom');
  }
  testStartTime = Date.now();
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
  const progressPct = Math.round(((currentQuestionIndex) / total) * 100);
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
        ✓ Выберите несколько вариантов ответа
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
        <span class="pill" id="timer">⏱ 00:00</span>
        <span class="pill">Вопрос ${currentQuestionIndex + 1}/${total}</span>
      </div>
      <div class="progress-bar"><div class="progress" style="width:${progressPct}%"></div></div>
      <h3 class="question-title">${escapeHtml(q.text)}</h3>
      ${imageHtml}
      ${answersHtml}
      <div id="commentArea"></div>
    </div>
  `;
  
  const favBtn = document.getElementById("favoriteBtn");
  if (favBtn && !alreadyAnswered) {
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
        
        if (isCorrectAnswer) {
          answerDiv.classList.add('correct-permanent');
        } else if (wasSelected && !isCorrectAnswer) {
          answerDiv.classList.add('wrong-permanent');
        }
        
        answerDiv.style.cursor = 'default';
        answerDiv.style.pointerEvents = 'none';
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
  
  setTimeout(() => updateFavoriteButton(q.id), 50);
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

function submitMultipleAnswer() {
  if (currentAnswered) return;
  if (currentMultipleSelected.length === 0) return;
  
  const q = currentQuestions[currentQuestionIndex];
  const isCorrect = checkMultipleAnswer(q, currentMultipleSelected);
  
  currentAnswered = true;
  
  const correctIds = getCorrectAnswerIds(q);
  
  q.answers.forEach((ans, i) => {
    const answerDiv = document.getElementById(`ansMultiple${i}`);
    if (!answerDiv) return;
    
    const isCorrectAnswer = correctIds.includes(ans.id);
    const wasSelected = currentMultipleSelected.includes(ans.id);
    
    answerDiv.classList.remove('multiple-selected');
    
    if (isCorrectAnswer) {
      answerDiv.classList.add('correct-permanent');
    } else if (wasSelected && !isCorrectAnswer) {
      answerDiv.classList.add('wrong-permanent');
    }
    
    answerDiv.style.cursor = 'default';
    answerDiv.style.pointerEvents = 'none';
  });
  
  const submitBtn = document.getElementById("submitMultipleBtn");
  if (submitBtn) submitBtn.classList.add('hidden');
  
  if (isCorrect) {
    currentScore++;
    showComment(q.explanation);
    
    currentAnsweredQuestions.push({
      index: currentQuestionIndex,
      selectedAnswers: currentMultipleSelected,
      isCorrect: true
    });
    
    saveTestProgressToDB();
    
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
    
    saveTestProgressToDB();
    
    const nextBtn = document.getElementById("nextBtn");
    if (nextBtn) {
      nextBtn.classList.remove('hidden');
    }
  }
}

function selectAnswer(index) {
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
  
  if (isCorrect) {
    currentScore++;
    if (selectedBtn) {
      selectedBtn.classList.add("correct-flash");
      setTimeout(() => {
        selectedBtn.classList.remove("correct-flash");
        selectedBtn.classList.add("correct-permanent");
      }, 500);
    }
    showComment(q.explanation);
    
    currentAnsweredQuestions.push({
      index: currentQuestionIndex,
      selectedAnswers: [q.answers[index].id],
      isCorrect: true
    });
    
    saveTestProgressToDB();
    
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
    
    saveTestProgressToDB();
    
    const nextBtn = document.getElementById("nextBtn");
    if (nextBtn) {
      nextBtn.classList.remove('hidden');
    }
  }
}

function showComment(text) {
  const ca = document.getElementById("commentArea");
  if (ca) ca.innerHTML = `<div class="comment">💬 ${escapeHtml(text)}</div>`;
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
    showTestResult();
  }
}

function finishTest() {
  clearTestAutoTransition();
  saveTestProgressToDB(true);
  showTestResult();
}

function exitTest() {
  stopTestTimer();
  clearTestAutoTransition();
  saveTestProgressToDB();
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
    <div class="card">
      <div class="row">
        <div><div class="result-title">Результат</div><div class="subtle">${currentTestConfig?.title || 'Тест'} завершен</div></div>
        <span class="pill">⏱ ${formatSeconds(timeSpent)}</span>
      </div>
      <div class="stats-grid">
        <div class="center"><canvas id="pie" width="120" height="120"></canvas><div class="percent-number">${percent}%</div><div class="subtle">верных</div></div>
        <div><div class="statline"><span class="k">Правильных</span><span class="v">${currentScore}</span></div><div class="statline"><span class="k">Неправильных</span><span class="v">${wrong}</span></div><div class="statline"><span class="k">Всего</span><span class="v">${total}</span></div></div>
      </div>
      <button class="button primary" onclick="window.restartTest()">Пройти ещё раз</button>
      <button class="button" onclick="window.renderTestsList()">К списку тестов</button>
    </div>
  `;
  drawPieChart("pie", currentScore, wrong);
  showBottomNav();
}

function restartTest() {
  if (currentTestConfig) {
    const key = `${currentTestConfig.type}_${currentTestConfig.id || 'quick'}`;
    delete sharedTestProgress[key];
    window.testProgress = sharedTestProgress;
  }
  startTest(currentTestConfig);
}

function drawPieChart(canvasId, correct, wrong) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const total = correct + wrong;
  if (total === 0) return;
  const correctAngle = (correct / total) * 2 * Math.PI;
  const wrongAngle = (wrong / total) * 2 * Math.PI;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.beginPath();
  ctx.moveTo(60, 60);
  ctx.arc(60, 60, 50, 0, correctAngle);
  ctx.fillStyle = "#2ecc71";
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(60, 60);
  ctx.arc(60, 60, 50, correctAngle, correctAngle + wrongAngle);
  ctx.fillStyle = "#e74c3c";
  ctx.fill();
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
      currentUserId = window.currentUser.id;
      console.log('👤 Пользователь инициализирован:', currentUserId);
      await loadTestProgressFromDB();
      await loadFavorites();
      renderTestsList();
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
    currentUserId = e.detail.id;
    console.log('👤 Пользователь загружен из события:', currentUserId);
    await loadTestProgressFromDB();
    await loadFavorites();
    renderTestsList();
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

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initUser);
} else {
  initUser();
}
