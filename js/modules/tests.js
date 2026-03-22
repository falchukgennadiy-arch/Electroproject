// ===== ТЕСТЫ (динамическая генерация из банка вопросов) =====
// Использует window.testProgress из app.js

let currentTestConfig = null;
let currentQuestions = [];
let currentQuestionIndex = 0;
let currentScore = 0;
let currentAnswered = false;
let currentAnsweredQuestions = [];
let currentUserId = null;
let currentAttemptId = null;

// Локальные таймеры (принадлежат только тестам)
let testStartTime = null;
let testTimerInterval = null;
let testAutoTransitionTimer = null;

// Используем глобальный прогресс
const sharedTestProgress = window.testProgress || {};
window.testProgress = sharedTestProgress;

// Правила генерации тестов
const TEST_RULES = {
  exam: [
    { difficulty_level_id: 1, count: 5 },
    { difficulty_level_id: 2, count: 5 },
    { difficulty_level_id: 3, count: 5 },
    { difficulty_level_id: 4, count: 5 },
    { difficulty_level_id: 5, count: 5 }
  ],
  theme: { count: 15 },
  quick: { count: 10 }
};

// ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ТЕСТОВ =====
function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function getActiveQuestions() {
  return window.allQuestions ? window.allQuestions.filter(q => q.status === 'active') : [];
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
  if (controls) controls.style.display = "block";
  const nextBtn = document.getElementById("nextBtn");
  if (nextBtn) nextBtn.style.display = "none";
}

function hideTestControls() {
  const controls = document.getElementById("testControls");
  if (controls) controls.style.display = "none";
  const testArea = document.getElementById("testArea");
  if (testArea) testArea.style.paddingBottom = "0";
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
async function generateTestByTheme(themeId, themeTitle) {
  let questions = getActiveQuestions().filter(q => q.theme_id === themeId);
  
  if (questions.length === 0) {
    alert('Нет вопросов по этой теме');
    return null;
  }
  
  questions = shuffleArray(questions);
  questions = questions.slice(0, TEST_RULES.theme.count);
  
  return {
    id: `theme_${themeId}`,
    title: `${themeTitle}`,
    type: 'theme',
    questions: questions
  };
}

async function generateTestByDifficulty(difficultyId, difficultyTitle) {
  let questions = getActiveQuestions().filter(q => q.difficulty_level_id === difficultyId);
  
  if (questions.length === 0) {
    alert('Нет вопросов этого уровня сложности');
    return null;
  }
  
  questions = shuffleArray(questions);
  questions = questions.slice(0, TEST_RULES.quick.count);
  
  return {
    id: `difficulty_${difficultyId}`,
    title: `${difficultyTitle}`,
    type: 'difficulty',
    questions: questions
  };
}

async function generateExam() {
  let totalQuestions = [];
  
  for (let rule of TEST_RULES.exam) {
    const levelQuestions = getActiveQuestions().filter(q => q.difficulty_level_id === rule.difficulty_level_id);
    
    if (levelQuestions.length === 0) continue;
    
    const shuffled = shuffleArray(levelQuestions);
    const selected = shuffled.slice(0, rule.count);
    totalQuestions.push(...selected);
  }
  
  if (totalQuestions.length === 0) {
    alert('Недостаточно вопросов для формирования экзамена');
    return null;
  }
  
  totalQuestions = shuffleArray(totalQuestions);
  
  return {
    id: 'exam',
    title: 'Экзамен',
    type: 'exam',
    questions: totalQuestions
  };
}

async function generateQuickTest() {
  const activeQuestions = getActiveQuestions();
  
  if (activeQuestions.length === 0) {
    alert('Нет активных вопросов');
    return null;
  }
  
  const shuffled = shuffleArray(activeQuestions);
  const questions = shuffled.slice(0, TEST_RULES.quick.count);
  
  return {
    id: 'quick',
    title: 'Быстрый тест',
    type: 'quick',
    questions: questions
  };
}

// ===== ОТОБРАЖЕНИЕ СПИСКА ТЕСТОВ =====
async function renderTestsList() {
  const listEl = document.getElementById("topicsList");
  const testArea = document.getElementById("testArea");
  if (testArea) testArea.innerHTML = "";
  hideTestControls();
  clearTestAutoTransition();
  
  if (!listEl) return;
  
  const hasTestAccess = window.subscriptions?.test === true;
  
  let html = '<h3 style="margin-top:0; margin-bottom:12px;">Доступные тесты</h3>';
  
  html += `
    <div class="test-item" onclick="window.startQuickTest()">
      <div class="test-row">
        <span class="test-title">🎲 Быстрый тест</span>
        <span class="test-badge free">FREE</span>
      </div>
      <div class="subtle">10 случайных вопросов из всех тем</div>
    </div>
  `;
  
  html += `
    <div class="test-item ${hasTestAccess ? '' : 'locked'}" onclick="${hasTestAccess ? 'window.startExam()' : 'alert(\'Оформите подписку TEST для доступа к экзамену\')'}">
      <div class="test-row">
        <span class="test-title">🎓 Экзамен</span>
        <span class="test-badge ${hasTestAccess ? 'free' : 'locked'}">${hasTestAccess ? 'FREE' : '🔒'}</span>
      </div>
      <div class="subtle">25 вопросов (по 5 на каждый уровень сложности)</div>
    </div>
  `;
  
  if (window.allThemes && window.allThemes.length > 0) {
    html += '<h4 style="margin-top: 20px;">📂 По темам</h4>';
    for (let theme of window.allThemes) {
      const questionsCount = getActiveQuestions().filter(q => q.theme_id === theme.id).length;
      const progress = sharedTestProgress[`theme_${theme.id}`];
      let progressText = '';
      
      if (progress && progress.completed) {
        progressText = `<div style="font-size:12px; margin-top:8px;"><span style="color: #2ecc71;">✅ Пройден: ${progress.score}/${progress.total}</span></div>`;
      } else if (progress && progress.currentQuestion > 0) {
        progressText = `<div style="font-size:12px; margin-top:8px;"><span style="color: #f39c12;">⏳ Прогресс: ${progress.currentQuestion}/${progress.total}</span></div>`;
      }
      
      html += `
        <div class="test-item ${hasTestAccess ? '' : 'locked'}" onclick="${hasTestAccess ? `window.startTestByTheme('${theme.id}', '${escapeHtml(theme.title)}')` : 'alert(\'Оформите подписку TEST для доступа к тестам по темам\')'}">
          <div class="test-row">
            <span class="test-title">📂 ${escapeHtml(theme.title)}</span>
            <span class="test-badge ${hasTestAccess ? 'free' : 'locked'}">${hasTestAccess ? 'FREE' : '🔒'}</span>
          </div>
          <div class="subtle">${questionsCount} вопросов</div>
          ${progressText}
        </div>
      `;
    }
  }
  
  if (window.allDifficulty && window.allDifficulty.length > 0) {
    html += '<h4 style="margin-top: 20px;">⭐ По уровню сложности</h4>';
    for (let diff of window.allDifficulty) {
      const questionsCount = getActiveQuestions().filter(q => q.difficulty_level_id === diff.id).length;
      
      html += `
        <div class="test-item ${hasTestAccess ? '' : 'locked'}" onclick="${hasTestAccess ? `window.startTestByDifficulty('${diff.id}', '${escapeHtml(diff.title)}')` : 'alert(\'Оформите подписку TEST для доступа к тестам по сложности\')'}">
          <div class="test-row">
            <span class="test-title">${diff.id === 1 ? '🟢' : diff.id === 5 ? '🔴' : '🟡'} ${escapeHtml(diff.title)}</span>
            <span class="test-badge ${hasTestAccess ? 'free' : 'locked'}">${hasTestAccess ? 'FREE' : '🔒'}</span>
          </div>
          <div class="subtle">${questionsCount} вопросов</div>
        </div>
      `;
    }
  }
  
  listEl.innerHTML = html;
}

// ===== ЗАПУСК ТЕСТОВ =====
async function startQuickTest() {
  const test = await generateQuickTest();
  if (test) startTest(test);
}

async function startExam() {
  const test = await generateExam();
  if (test) startTest(test);
}

async function startTestByTheme(themeId, themeTitle) {
  const test = await generateTestByTheme(themeId, themeTitle);
  if (test) startTest(test);
}

async function startTestByDifficulty(difficultyId, difficultyTitle) {
  const test = await generateTestByDifficulty(difficultyId, difficultyTitle);
  if (test) startTest(test);
}

function startTest(testConfig) {
  if (!testConfig.questions || testConfig.questions.length === 0) {
    alert('В этом тесте пока нет вопросов');
    return;
  }
  
  currentTestConfig = testConfig;
  currentQuestions = testConfig.questions;
  currentQuestionIndex = 0;
  currentScore = 0;
  currentAnsweredQuestions = [];
  currentAnswered = false;
  currentAttemptId = null;
  
  const listEl = document.getElementById("topicsList");
  if (listEl) listEl.innerHTML = "";
  
  const testArea = document.getElementById("testArea");
  if (testArea) {
    testArea.style.display = "block";
    testArea.style.paddingBottom = "80px";
  }
  
  testStartTime = Date.now();
  showTestControls();
  startTestTimer();
  showQuestion();
}

function showQuestion() {
  const testArea = document.getElementById("testArea");
  if (!testArea) return;
  
  currentAnswered = false;
  document.getElementById("nextBtn").style.display = "none";
  clearTestAutoTransition();
  
  const q = currentQuestions[currentQuestionIndex];
  const total = currentQuestions.length;
  const progressPct = Math.round(((currentQuestionIndex) / total) * 100);
  
  const letters = ['А', 'Б', 'В', 'Г', 'Д', 'Е'];
  
  testArea.innerHTML = `
    <div class="card">
      <div class="row">
        <span class="pill" id="timer">⏱ 00:00</span>
        <span class="pill">Вопрос ${currentQuestionIndex + 1}/${total}</span>
      </div>
      <div class="progress-bar"><div class="progress" style="width:${progressPct}%"></div></div>
      <h3 style="margin:14px 0 10px;">${escapeHtml(q.text)}</h3>
      <div id="answers">
        ${q.answers.map((ans, i) => `
          <button class="button" id="ans${i}" onclick="window.selectAnswer(${i})" ${currentAnsweredQuestions.includes(currentQuestionIndex) ? 'disabled' : ''}>
            <div class="ans"><div class="badge">${letters[i]}</div><div class="ans-text">${escapeHtml(ans.text)}</div></div>
          </button>
        `).join("")}
      </div>
      <div id="commentArea"></div>
    </div>
  `;
  
  if (currentAnsweredQuestions.includes(currentQuestionIndex)) {
    const correctIndex = q.answers.findIndex(a => a.isCorrect);
    const correctBtn = document.getElementById("ans" + correctIndex);
    if (correctBtn) correctBtn.classList.add("correct-permanent");
    showComment(q.explanation);
    document.getElementById("nextBtn").style.display = "inline-block";
  }
}

function selectAnswer(index) {
  if (currentAnswered || currentAnsweredQuestions.includes(currentQuestionIndex)) return;
  
  currentAnswered = true;
  
  const q = currentQuestions[currentQuestionIndex];
  const isCorrect = q.answers[index].isCorrect;
  
  for (let i = 0; i < q.answers.length; i++) {
    const btn = document.getElementById("ans" + i);
    if (btn) btn.disabled = true;
  }
  
  if (isCorrect) {
    currentScore++;
    const correctBtn = document.getElementById("ans" + index);
    correctBtn.classList.add("correct-flash");
    showComment(q.explanation);
    
    if (!currentAnsweredQuestions.includes(currentQuestionIndex)) {
      currentAnsweredQuestions.push(currentQuestionIndex);
    }
    
    saveTestProgressToDB();
    
    testAutoTransitionTimer = setTimeout(() => {
      nextQuestion();
    }, 1200);
  } else {
    const wrongBtn = document.getElementById("ans" + index);
    const correctIndex = q.answers.findIndex(a => a.isCorrect);
    const correctBtn = document.getElementById("ans" + correctIndex);
    wrongBtn.classList.add("wrong-permanent");
    correctBtn.classList.add("correct-permanent");
    showComment(q.explanation);
    
    if (!currentAnsweredQuestions.includes(currentQuestionIndex)) {
      currentAnsweredQuestions.push(currentQuestionIndex);
    }
    
    saveTestProgressToDB();
    document.getElementById("nextBtn").style.display = "inline-block";
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
  
  while (nextQ < total && currentAnsweredQuestions.includes(nextQ)) {
    nextQ++;
  }
  
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
  if (testArea) testArea.innerHTML = "";
  renderTestsList();
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
        <div>
          <div style="font-size:16px; font-weight:900;">Результат</div>
          <div class="subtle">${currentTestConfig?.title || 'Тест'} завершен</div>
        </div>
        <span class="pill">⏱ ${formatSeconds(timeSpent)}</span>
      </div>
      <div style="height:12px;"></div>
      <div class="stats-grid">
        <div class="center">
          <canvas id="pie" width="120" height="120" style="width:120px; height:120px;"></canvas>
          <div style="margin-top:8px; font-size:18px; font-weight:900;">${percent}%</div>
          <div class="subtle">верных</div>
        </div>
        <div>
          <div class="statline"><span class="k">Правильных</span><span class="v">${currentScore}</span></div>
          <div class="statline"><span class="k">Неправильных</span><span class="v">${wrong}</span></div>
          <div class="statline"><span class="k">Всего</span><span class="v">${total}</span></div>
        </div>
      </div>
      <button class="button primary" onclick="window.restartTest()">Пройти ещё раз</button>
      <button class="button" onclick="window.renderTestsList()">К списку тестов</button>
    </div>
  `;
  drawPieChart("pie", currentScore, wrong);
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

// ===== ИНИЦИАЛИЗАЦИЯ ПОЛЬЗОВАТЕЛЯ =====
async function initUser() {
  if (window.currentUser && window.currentUser.id) {
    currentUserId = window.currentUser.id;
    console.log('👤 Пользователь инициализирован:', currentUserId);
    await loadTestProgressFromDB();
    renderTestsList();
  } else {
    console.log('⏳ Ожидание загрузки пользователя...');
    const checkInterval = setInterval(() => {
      if (window.currentUser && window.currentUser.id) {
        clearInterval(checkInterval);
        currentUserId = window.currentUser.id;
        console.log('👤 Пользователь загружен:', currentUserId);
        loadTestProgressFromDB().then(() => renderTestsList());
      }
    }, 500);
    setTimeout(() => clearInterval(checkInterval), 10000);
  }
}

// ===== ЭКСПОРТ =====
window.renderTestsList = renderTestsList;
window.startQuickTest = startQuickTest;
window.startExam = startExam;
window.startTestByTheme = startTestByTheme;
window.startTestByDifficulty = startTestByDifficulty;
window.startTest = startTest;
window.selectAnswer = selectAnswer;
window.nextQuestion = nextQuestion;
window.finishTest = finishTest;
window.exitTest = exitTest;
window.restartTest = restartTest;
window.initUser = initUser;
window.hideTestControls = hideTestControls;
window.showTestControls = showTestControls;
window.clearAutoTransition = clearTestAutoTransition;

// Автоматическая инициализация
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initUser);
} else {
  initUser();
}
