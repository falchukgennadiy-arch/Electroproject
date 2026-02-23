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
    window.app = this; // делаем доступным глобально
  },

  // ===== ТЕСТЫ (ПОЛНАЯ ВЕРСИЯ) =====
  tests: {
    "ПУЭ": {
      free: true,
      questions: [
        {
          q: "Что означает ПУЭ?",
          img: null,
          a: [
            "Правила устройства электроустановок",
            "Питание узлов электроэнергии",
            "Провод универсальный электрический"
          ],
          correct: 0,
          comment: "ПУЭ — Правила устройства электроустановок, основной нормативный документ."
        },
        {
          q: "Какой тип сети изображён?",
          img: "placeholder",
          a: [
            "Однофазная сеть",
            "Трёхфазная сеть",
            "Постоянный ток"
          ],
          correct: 1,
          comment: "На схеме изображена трёхфазная сеть (три фазы L1, L2, L3)."
        }
      ]
    },
    "Автоматы": {
      free: false,
      questions: [
        {
          q: "Что изображено на фото?",
          img: "placeholder",
          a: [
            "Реле напряжения",
            "Автоматический выключатель",
            "Трансформатор"
          ],
          correct: 1,
          comment: "Это автоматический выключатель для защиты сети."
        }
      ]
    },
    
    "Расчёт электрических нагрузок и токов": { 
      free: false, 
      questions: [
        {
          q: "Формула тока однофазной нагрузки:",
          img: null,
          a: [
            "I = P × U",
            "I = U / P",
            "I = P / (U × cosφ)",
            "I = √3 × P / U"
          ],
          correct: 2,
          comment: "Для однофазной сети: I = P / (U × cosφ), где P — мощность, U — напряжение, cosφ — коэффициент мощности."
        },
        {
          q: "Формула тока трёхфазной нагрузки (400 В):",
         
