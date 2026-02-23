const App = {
  currentView: 'home',
  currentTest: null,
  currentQuestions: [],
  currentQuestionIndex: 0,
  userAnswers: [],
  testProgress: {},

  init() {
    this.navigate('home');
    window.app = this;
  },

  async navigate(view) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    
    document.getElementById(view).classList.add('active');
    document.querySelector(`[onclick*="'${view}'"]`).classList.add('active');
    
    this.currentView = view;
    
    if (view === 'tests') {
      await this.loadTests();
    }
  },

  async loadTests() {
    const loader = document.getElementById('tests-loader');
    const listDiv = document.getElementById('tests-list');
    
    loader.classList.remove('hidden');
    listDiv.innerHTML = '';
    
    try {
      const tests = await API.getTests();
      loader.classList.add('hidden');
      
      if (tests.length === 0) {
        listDiv.innerHTML = '<div class="card">Пока нет доступных тестов</div>';
        return;
      }
      
      let html = '';
      tests.forEach(test => {
        html += `
          <div class="test-card" onclick="App.startTest('${test.id}')">
            <div class="test-title">${test.title}</div>
            <div class="test-description">${test.description || 'Нет описания'}</div>
            <div class="test-meta">
              <span class="badge ${test.free ? 'free' : 'test'}">
                ${test.free ? 'Бесплатно' : 'Подписка'}
              </span>
              <span>Проходной балл: ${test.passingScore || 70}%</span>
            </div>
          </div>
        `;
      });
      listDiv.innerHTML = html;
      
    } catch (error) {
      loader.classList.add('hidden');
      listDiv.innerHTML = '<div class="card" style="color: #e74c3c;">Ошибка загрузки тестов</div>';
      console.error(error);
    }
  },

  async startTest(testId) {
    try {
      const test = await API.getTestFull(testId);
      this.currentTest = test;
      this.currentQuestions = test.questions || [];
      this.currentQuestionIndex = 0;
      this.userAnswers = new Array(this.currentQuestions.length).fill(null);
      
      this.showTest();
    } catch (error) {
      alert('Не удалось загрузить тест');
    }
  },

  showTest() {
    document.getElementById('tests-list').classList.add('hidden');
    document.getElementById('test-detail').classList.remove('hidden');
    document.getElementById('test-results').classList.add('hidden');
    
    this.renderQuestion();
  },

  renderQuestion() {
    const question = this.currentQuestions[this.currentQuestionIndex];
    const container = document.getElementById('test-detail');
    const progress = ((this.currentQuestionIndex + 1) / this.currentQuestions.length) * 100;
    
    const answered = this.userAnswers[this.currentQuestionIndex] !== null;
    const userAnswer = this.userAnswers[this.currentQuestionIndex];
    
    let answersHtml = '';
    question.answers.forEach(answer => {
      let className = 'answer-btn';
      if (answered) {
        if (answer.isCorrect) className += ' correct';
        else if (userAnswer && userAnswer.answerId === answer.id) className += ' wrong';
      }
      
      answersHtml += `
        <button class="${className}" 
                onclick="App.selectAnswer('${answer.id}')"
                ${answered ? 'disabled' : ''}>
          ${answer.text}
        </button>
      `;
    });
    
    let explanationHtml = '';
    if (answered) {
      explanationHtml = `<div class="explanation">${question.explanation || 'Нет объяснения'}</div>`;
    }
    
    let nextButton = '';
    if (answered) {
      if (this.currentQuestionIndex < this.currentQuestions.length - 1) {
        nextButton = '<button class="button" onclick="App.nextQuestion()">Следующий вопрос</button>';
      } else {
        nextButton = '<button class="button" onclick="App.showResults()">Завершить тест</button>';
      }
    }
    
    container.innerHTML = `
      <div class="card">
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${progress}%"></div>
        </div>
        <div class="question-text">${question.text}</div>
        ${answersHtml}
        ${explanationHtml}
        ${nextButton}
        <button class="button secondary" onclick="App.backToTests()">← К списку тестов</button>
      </div>
    `;
  },

  selectAnswer(answerId) {
    const question = this.currentQuestions[this.currentQuestionIndex];
    const answer = question.answers.find(a => a.id === answerId);
    
    this.userAnswers[this.currentQuestionIndex] = {
      questionId: question.id,
      answerId,
      isCorrect: answer.isCorrect
    };
    
    this.renderQuestion();
  },

  nextQuestion() {
    if (this.currentQuestionIndex < this.currentQuestions.length - 1) {
      this.currentQuestionIndex++;
      this.renderQuestion();
    }
  },

  showResults() {
    const correctCount = this.userAnswers.filter(a => a && a.isCorrect).length;
    const total = this.currentQuestions.length;
    const score = Math.round((correctCount / total) * 100);
    const passed = score >= (this.currentTest.passingScore || 70);
    
    document.getElementById('test-detail').classList.add('hidden');
    document.getElementById('test-results').classList.remove('hidden');
    
    const container = document.getElementById('test-results');
    container.innerHTML = `
      <div class="card">
        <h3>Результаты</h3>
        <div class="result-stats">
          <div class="stat-row">
            <span class="stat-label">Правильных ответов:</span>
            <span class="stat-value">${correctCount} из ${total}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Результат:</span>
            <span class="stat-value">${score}%</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Статус:</span>
            <span class="stat-value" style="color: ${passed ? '#2ecc71' : '#e74c3c'}">
              ${passed ? '✅ Тест пройден' : '❌ Тест не пройден'}
            </span>
          </div>
        </div>
        <button class="button" onclick="App.backToTests()">К списку тестов</button>
      </div>
    `;
  },

  backToTests() {
    document.getElementById('tests-list').classList.remove('hidden');
    document.getElementById('test-detail').classList.add('hidden');
    document.getElementById('test-results').classList.add('hidden');
    this.loadTests();
  }
};

// Запуск при загрузке страницы
document.addEventListener('DOMContentLoaded', () => App.init());
