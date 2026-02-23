const App = {
  // ===== State =====
  subscriptions: {
    course: false,
    visual: false,
    template: false,
    test: false
  },
  
  currentView: 'home',
  
  // Тесты
  currentTopic: null,
  currentQuestion: 0,
  score: 0,
  answered: false,
  answeredQuestions: [],
  startTime: null,
  timerInterval: null,
  autoTransitionTimer: null,
  
  // Прогресс тестов
  testProgress: {},
  
  // Режимы отображения
  viewModes: {
    visual: 'list',
    templates: 'list'
  },
  
  // Календарь
  calendarCurrentDate: new Date(),
  calendarSelectedDate: new Date(),
  calendarSection: 'visual',
  
  // Курсы
  currentCourse: null,
  currentLesson: null,
  courseInnerView: 'list',
  cameFromCourseCalendar: false,
  
  // Visual
  currentVisualItem: null,
  cameFromVisualCalendar: false,
  
  // Шаблоны
  currentTemplateItem: null,
  cameFromTemplateCalendar: false,
  
  // Профиль
  userName: "Алексей Александров",
  userEmail: "alex@example.com",
  registrationDate: new Date('2025-01-15'),

  letters: ["A","B","C","D"],
  
  // Сегодняшняя дата для определения активных материалов
  today: new Date(),

  // ===== Инициализация =====
  init() {
    this.today.setHours(0, 0, 0, 0);
    this.navigate('home');
    this.updateProfileDisplay();
    window.app = this;
  },

  // ⚠️ ВНИМАНИЕ: объект tests ПОЛНОСТЬЮ УДАЛЁН!
  // Тесты будут загружаться через API.getTests()

  // ===== Навигация =====
  navigate(section) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(section).classList.add('active');
    
    // Находим кнопку с соответствующим onclick
    const btn = Array.from(document.querySelectorAll('.nav-btn')).find(b => 
      b.getAttribute('onclick')?.includes(`'${section}'`)
    );
    if (btn) btn.classList.add('active');
    
    this.currentView = section;
    
    if (section === 'courses') {
      this.renderCoursesList();
    } else if (section === 'visual') {
      this.setViewMode('visual', this.viewModes.visual);
    } else if (section === 'templates') {
      this.setViewMode('templates', this.viewModes.templates);
    } else if (section === 'tests') {
      this.renderTestsList();
    } else if (section === 'profile') {
      this.updateProfileDisplay();
    }
    
    if (section !== 'tests') {
      this.hideTestControls();
      this.clearAutoTransition();
    }
  },

  // ===== Тесты =====
  async renderTestsList() {
    const listEl = document.getElementById("topicsList");
    const testArea = document.getElementById("testArea");
    testArea.innerHTML = "";
    this.hideTestControls();
    this.clearAutoTransition();
    
    let html = '<h3 style="margin-top:0; margin-bottom:12px;">Тесты</h3>';
    
    try {
      // ⭐ ЗАГРУЗКА ТЕСТОВ ИЗ БАЗЫ ДАННЫХ
      const tests = await API.getTests();
      
      for (let test of tests) {
        const progress = this.testProgress[test.id];
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
          <div class="test-item ${completedClass}" onclick="App.startTest('${test.id}')">
            <div class="test-row">
              <span class="test-title">${test.title}</span>
              <span class="test-badge ${test.free ? 'free' : 'test'}">${test.free ? 'FREE' : 'TEST'}</span>
            </div>
            <div class="subtle">${test.questions?.length || 0} вопросов</div>
            ${progressText}
          </div>
        `;
      }
    } catch (error) {
      console.error('Ошибка загрузки тестов:', error);
      html += '<div class="card" style="color: #e74c3c;">Ошибка загрузки тестов. Проверьте подключение к серверу.</div>';
    }
    
    listEl.innerHTML = html;
  },

  async startTest(topic) {
    // Здесь нужно получать тест из API по ID
    // Для демо пока используем заглушку
    alert('Функция startTest будет получать данные из API');
    
    // Реальная реализация:
    // try {
    //   const test = await API.getTestFull(topic);
    //   this.currentTest = test;
    //   this.currentQuestions = test.questions;
    //   this.currentTopic = test.title;
    //   this.currentQuestion = 0;
    //   this.score = 0;
    //   this.answeredQuestions = [];
    //   this.answered = false;
    //   this.startTime = Date.now();
    //   
    //   document.getElementById("topicsList").innerHTML = "";
    //   this.showTestControls();
    //   this.startTimer();
    //   this.showQuestion();
    // } catch (error) {
    //   alert('Ошибка загрузки теста');
    // }
  },

  // ... остальные методы (showQuestion, selectAnswer, nextQuestion и т.д.)
  // они остаются без изменений, но работают с this.currentQuestions
};
