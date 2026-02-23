// ===== Тесты =====
let currentTestId = null;
let currentTestData = null;
let currentQuestions = [];
let currentQuestionIndex = 0;
let currentScore = 0;
let currentAnswered = false;
let currentAnsweredQuestions = [];

async function renderTestsList() {
  const listEl = document.getElementById("topicsList");
  const testArea = document.getElementById("testArea");
  testArea.innerHTML = "";
  hideTestControls();
  clearAutoTransition();
  
  let html = '<h3 style="margin-top:0; margin-bottom:12px;">Тесты</h3>';
  
  try {
    const tests = await API.getTests();
    
    for (let test of tests) {
      try {
        const testFull = await API.getTestFull(test.id);
        const questionsCount = testFull.questions?.length || 0;
        
        const progress = testProgress[test.id];
        let progressText = '';
        let completedClass = '';
        
        if (progress) {
          if (progress.completed) {
            completedClass = 'completed';
            progressText = `<div style="font-size:12px; margin-top:8px;"><span style="color:var(--good);">✅ Пройден: ${progress.score}/${progress.total}</span></div>`;
          } else if (progress.currentQuestion > 0) {
            progressText = `<div style="font-size:12px; margin-top:8px;"><span style="color:var(--accent);">⏳ Прогресс: ${progress.currentQuestion}/${progress.total}</span></div>`;
          }
        }
        
        html += `
          <div class="test-item ${completedClass}" onclick="window.startTest('${test.id}')">
            <div class="test-row">
              <span class="test-title">${test.title}</span>
              <span class="test-badge ${test.free ? 'free' : 'test'}">${test.free ? 'FREE' : 'TEST'}</span>
            </div>
            <div class="subtle">${questionsCount} вопросов</div>
            ${progressText}
          </div>
        `;
      } catch (e) {
        html += `
          <div class="test-item" onclick="window.startTest('${test.id}')">
            <div class="test-row">
              <span class="test-title">${test.title}</span>
              <span class="test-badge ${test.free ? 'free' : 'test'}">${test.free ? 'FREE' : 'TEST'}</span>
            </div>
            <div class="subtle">Нажмите чтобы начать</div>
          </div>
        `;
      }
    }
  } catch (error) {
    console.error('Ошибка загрузки тестов:', error);
    html += '<div class="card" style="color: #e74c3c;">Ошибка загрузки тестов</div>';
  }
  
  listEl.innerHTML = html;
}

async function startTest(testId) {
  console.log('Запуск теста:', testId);
  
  try {
    const testData = await API.getTestFull(testId);
    console.log('Данные теста:', testData);
    
    if (!testData.questions || testData.questions.length === 0) {
      alert('В этом тесте пока нет вопросов');
      return;
    }
    
    currentTestId = testId;
    currentTestData = testData;
    currentQuestions = testData.questions;
    currentQuestionIndex = 0;
    currentScore = 0;
    currentAnsweredQuestions = [];
    currentAnswered = false;
    
    document.getElementById("topicsList").innerHTML = "";
    document.getElementById("testArea").style.display = "block";
    
    startTime = Date.now();
    showTestControls();
    startTimer();
    showQuestion();
  } catch (error) {
    console.error('Ошибка загрузки теста:', error);
    alert('Не удалось загрузить тест. Проверьте подключение к серверу.');
  }
}

function showQuestion() {
  const testArea = document.getElementById("testArea");
  testArea.style.paddingBottom = "80px";
  
  currentAnswered = false;
  document.getElementById("nextBtn").style.display = "none";
  clearAutoTransition();

  const q = currentQuestions[currentQuestionIndex];
  const total = currentQuestions.length;
  const progressPct = Math.round(((currentQuestionIndex) / total) * 100);

  testArea.innerHTML = `
    <div class="card">
      <div class="row">
        <span class="pill" id="timer">⏱ ${formatSeconds(getElapsedSeconds())}</span>
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
    if (correctBtn) {
      correctBtn.classList.add("correct-permanent");
    }
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
    
    saveTestProgress();
    
    autoTransitionTimer = setTimeout(() => {
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
    
    saveTestProgress();
    document.getElementById("nextBtn").style.display = "inline-block";
  }
}

function showComment(text) {
  const ca = document.getElementById("commentArea");
  ca.innerHTML = `<div class="comment">💬 ${escapeHtml(text)}</div>`;
}

function nextQuestion() {
  clearAutoTransition();
  
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
  clearAutoTransition();
  saveTestProgress(true);
  showTestResult();
}

function exitTest() {
  stopTimer();
  clearAutoTransition();
  saveTestProgress();
  currentTestId = null;
  document.getElementById("testArea").innerHTML = "";
  document.getElementById("topicsList").innerHTML = "";
  renderTestsList();
}

function saveTestProgress(completed = false) {
  if (!currentTestId) return;
  
  const total = currentQuestions.length;
  testProgress[currentTestId] = {
    currentQuestion: currentQuestionIndex,
    score: currentScore,
    answered: currentAnsweredQuestions,
    completed: completed || (currentAnsweredQuestions.length === total),
    total: total,
    lastUpdated: Date.now()
  };
}

function showTestResult() {
  stopTimer();
  hideTestControls();
  clearAutoTransition();
  
  const total = currentQuestions.length;
  const wrong = total - currentScore;
  const percent = Math.round((currentScore / total) * 100);
  const timeSpent = getElapsedSeconds();

  const testArea = document.getElementById("testArea");
  testArea.innerHTML = `
    <div class="card">
      <div class="row">
        <div>
          <div style="font-size:16px; font-weight:900;">Результат</div>
          <div class="subtle">Тест завершен</div>
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
  if (currentTestId) {
    delete testProgress[currentTestId];
  }
  startTest(currentTestId);
}

// Экспорт функций
window.renderTestsList = renderTestsList;
window.startTest = startTest;
window.selectAnswer = selectAnswer;
window.nextQuestion = nextQuestion;
window.finishTest = finishTest;
window.exitTest = exitTest;
window.restartTest = restartTest;
