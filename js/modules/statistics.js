// ============================================
// statistics.js v1.3 - ИСПРАВЛЕННАЯ ВЕРСИЯ
// Отвечает за:
// 1. Создание и обновление test_attempts
// 2. Сохранение каждого ответа в test_attempt_answers
// 3. Расчёт статистики
// ============================================

// ============================================
// 1. ПРИВАТНЫЕ ПЕРЕМЕННЫЕ
// ============================================
let _currentAttemptId = null;
let _questionStartTime = null;
let _currentUserId = null;
let _currentQuestions = [];
let _currentScore = 0;
let _testStartTime = null;
let _currentQuestionIndex = 0; 

// Флаг для отладки
const DEBUG = false;

// Счётчик ответов для оптимизации updateTestAttemptSummary
let _answersSinceLastSummary = 0;
const SUMMARY_UPDATE_INTERVAL = 3;

// ============================================
// 2. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================
function _log(...args) {
    if (DEBUG) console.log(...args);
}

function _error(...args) {
    console.error(...args);
}

/**
 * Универсальная функция для безопасного fetch с проверкой response.ok
 */
async function _safeFetch(url, errorMsg) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`${errorMsg}: ${response.status}`);
        }
        return await response.json();
    } catch (err) {
        _error(errorMsg, err);
        return null;
    }
}

// ============================================
// 3. РАБОТА С ПОПЫТКОЙ (test_attempts)
// ============================================

/**
 * Собирает payload для создания test_attempts
 */
function _buildTestAttemptPayload(testConfig, questions) {
    const questionsIds = questions.map(q => q.id);
    const questionsCount = questions.length;
    
    return {
        id: `att_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        user_id: _currentUserId,
        test_type: testConfig.type,
        theme_id: testConfig.themeId || null,
        difficulty_level_id: testConfig.difficultyId || null,
        questions_ids: JSON.stringify(questionsIds),
        questions_count: questionsCount,
        total_score: 0,
        correct_count: 0,
        wrong_count: 0,
        accuracy_percent: 0,
        time_spent: 0,
        started_at: new Date().toISOString(),
        completed_at: null,
        status: 'in_progress'
    };
}

/**
 * Создаёт попытку в test_attempts
 * Вызывается в startTest()
 */
async function createTestAttempt(testConfig, questions) {
    if (!_currentUserId) {
        _error('❌ createTestAttempt: нет userId');
        return null;
    }
    
    _currentQuestions = questions;
    _answersSinceLastSummary = 0;
    
    const payload = _buildTestAttemptPayload(testConfig, questions);
    
    try {
        const response = await fetch(`${CONFIG.API_URL}/test-attempts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
            _error('❌ Ошибка создания попытки:', response.status);
            return null;
        }
        
        const result = await response.json();
        _currentAttemptId = result.id;
        _log('✅ Попытка создана:', _currentAttemptId);
        return _currentAttemptId;
        
    } catch (err) {
        _error('❌ Ошибка сети при создании попытки:', err);
        return null;
    }
}

/**
 * Собирает payload для обновления test_attempts
 */
function _buildAttemptSummaryPayload(completed = false) {
    const totalQuestions = _currentQuestions.length;
    const correctCount = _currentScore || 0;
    const wrongCount = totalQuestions - correctCount;
    const accuracyPercent = totalQuestions > 0 
        ? Math.round((correctCount / totalQuestions) * 100) 
        : 0;
    
    return {
        total_score: correctCount,
        correct_count: correctCount,
        wrong_count: wrongCount,
        questions_count: totalQuestions,
        accuracy_percent: accuracyPercent,
        time_spent: _getTotalTimeSpent(),
        completed_at: completed ? new Date().toISOString() : null,
        status: completed ? 'completed' : 'in_progress'
    };
}

/**
 * Возвращает общее время теста
 */
function _getTotalTimeSpent() {
    if (!_testStartTime) return 0;
    return Math.floor((Date.now() - _testStartTime) / 1000);
}

/**
 * Обновляет сводку test_attempts
 */
async function _updateTestAttemptSummaryInternal(completed = false, force = false) {
    if (!_currentAttemptId) {
        _error('⚠️ updateTestAttemptSummary: нет attemptId');
        return false;
    }
    
    if (!completed && !force && _answersSinceLastSummary < SUMMARY_UPDATE_INTERVAL) {
        _log(`⏭ Пропускаем обновление сводки (${_answersSinceLastSummary}/${SUMMARY_UPDATE_INTERVAL})`);
        return true;
    }
    
    const payload = _buildAttemptSummaryPayload(completed);
    
    try {
        const response = await fetch(`${CONFIG.API_URL}/test-attempts/${_currentAttemptId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
            _error('❌ Ошибка обновления сводки:', response.status);
            return false;
        }
        
        if (!completed) {
            _answersSinceLastSummary = 0;
        }
        
        _log('✅ Сводка обновлена', completed ? '(завершён)' : '');
        return true;
        
    } catch (err) {
        _error('❌ Ошибка сети при обновлении сводки:', err);
        return false;
    }
}

/**
 * Публичная обёртка для updateTestAttemptSummary
 */
async function updateTestAttemptSummary(completed = false) {
    if (completed) {
        return await _updateTestAttemptSummaryInternal(true, true);
    } else {
        _answersSinceLastSummary++;
        return await _updateTestAttemptSummaryInternal(false, false);
    }
}

// ============================================
// 4. РАБОТА С ОТВЕТАМИ (test_attempt_answers)
// ============================================

function startQuestionTimer() {
    _questionStartTime = Date.now();
}

function getQuestionTimeSpent() {
    if (!_questionStartTime) return 0;
    return Math.floor((Date.now() - _questionStartTime) / 1000);
}

function _resetQuestionTimer() {
    _questionStartTime = null;
}

function _buildAttemptAnswerPayload(question, selectedAnswerIds, isCorrect) {
    return {
        id: `ans_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        attempt_id: _currentAttemptId,
        user_id: _currentUserId,
        question_id: question.id,
        theme_id: question.theme_id || null,
        difficulty_level_id: question.difficulty_level_id || null,
        question_number: _currentQuestionIndex + 1,
        selected_answers: JSON.stringify(selectedAnswerIds),
        is_correct: isCorrect ? 1 : 0,
        time_spent: getQuestionTimeSpent(),
        answered_at: new Date().toISOString()
    };
}

async function saveAttemptAnswer(question, selectedAnswerIds, isCorrect) {
    if (!_currentAttemptId || !_currentUserId) {
        _error('⚠️ saveAttemptAnswer: нет attemptId или userId');
        return false;
    }
    
    const payload = _buildAttemptAnswerPayload(question, selectedAnswerIds, isCorrect);
    
    try {
        const response = await fetch(`${CONFIG.API_URL}/test-attempt-answers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
            _error('❌ Ошибка сохранения ответа:', response.status);
            return false;
        }
        
        _log('✅ Ответ сохранён');
        _resetQuestionTimer();
        return true;
        
    } catch (err) {
        _error('❌ Ошибка сети при сохранении ответа:', err);
        return false;
    }
}

// ============================================
// 5. ФУНКЦИИ СТАТИСТИКИ (ИСПРАВЛЕНЫ)
// ============================================

/**
 * Проверяет, является ли ответ правильным (работает и с 1, и с true)
 */
function _isAnswerCorrect(answer) {
    return answer.is_correct === 1 || answer.is_correct === true;
}

/**
 * Главная сводка для экрана тестов
 */
async function getStatsSummary(userId) {
    if (!userId) return null;
    
    try {
        const attempts = await _safeFetch(
            `${CONFIG.API_URL}/test-attempts?user_id=${userId}&status=completed`,
            'Ошибка получения попыток'
        );
        
        const answers = await _safeFetch(
            `${CONFIG.API_URL}/test-attempt-answers?user_id=${userId}`,
            'Ошибка получения ответов'
        );
        
        const allQuestions = await _safeFetch(
            `${CONFIG.API_URL}/questions?status=active`,
            'Ошибка получения вопросов'
        );
        
        if (!allQuestions) {
            throw new Error('Не удалось загрузить вопросы');
        }
        
        const totalQuestions = allQuestions.length;
        const completedTests = attempts ? attempts.length : 0;
        
        // ИСПРАВЛЕНО: правильно считаем правильные ответы (и 1, и true)
        const totalAnswers = answers ? answers.length : 0;
        const correctAnswers = answers ? answers.filter(a => _isAnswerCorrect(a)).length : 0;
        const accuracyPercent = totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0;
        
        // Среднее время на вопрос
        const totalTime = answers ? answers.reduce((sum, a) => sum + (a.time_spent || 0), 0) : 0;
        const averageTimePerQuestion = totalAnswers > 0 ? Math.round(totalTime / totalAnswers) : 0;
        
        // Уникально пройденные вопросы
        const uniqueQuestions = answers ? new Set(answers.map(a => a.question_id)).size : 0;
        
        // Освоенные вопросы (последний ответ правильный)
        const masteredQuestions = await _getMasteredQuestionsCount(userId, answers);
        
        // Лучший результат
        let bestResult = 0;
        if (attempts) {
            for (const attempt of attempts) {
                if (attempt.accuracy_percent > bestResult) {
                    bestResult = attempt.accuracy_percent;
                }
            }
        }
        
        return {
            totalQuestions,
            completedTests,
            accuracyPercent,
            averageTimePerQuestion,
            uniqueQuestionsAnswered: uniqueQuestions,
            masteredQuestions,
            bestResult
        };
        
    } catch (err) {
        _error('❌ Ошибка получения статистики:', err);
        return null;
    }
}

/**
 * Внутренняя: считает освоенные вопросы
 */
async function _getMasteredQuestionsCount(userId, answers = null) {
    if (!answers) {
        answers = await _safeFetch(
            `${CONFIG.API_URL}/test-attempt-answers?user_id=${userId}`,
            'Ошибка получения ответов'
        );
        if (!answers) return 0;
    }
    
    const lastAnswers = new Map();
    for (const answer of answers) {
        const existing = lastAnswers.get(answer.question_id);
        if (!existing || new Date(answer.answered_at) > new Date(existing.answered_at)) {
            lastAnswers.set(answer.question_id, answer);
        }
    }
    
    // ИСПРАВЛЕНО: правильно считаем освоенные вопросы
    let mastered = 0;
    for (const answer of lastAnswers.values()) {
        if (_isAnswerCorrect(answer)) mastered++;
    }
    
    return mastered;
}

/**
 * Статистика по темам
 */
async function getThemeStats(userId) {
    if (!userId) return [];
    
    try {
        const answers = await _safeFetch(
            `${CONFIG.API_URL}/test-attempt-answers?user_id=${userId}`,
            'Ошибка получения ответов'
        );
        
        if (!answers || answers.length === 0) return [];
        
        const themeMap = new Map();
        
        for (const answer of answers) {
            const themeId = answer.theme_id;
            if (!themeId) continue;
            
            if (!themeMap.has(themeId)) {
                themeMap.set(themeId, {
                    theme_id: themeId,
                    total_answers: 0,
                    correct_answers: 0,
                    total_time: 0,
                    unique_questions: new Set(),
                    last_answers: new Map()
                });
            }
            
            const stat = themeMap.get(themeId);
            stat.total_answers++;
            if (_isAnswerCorrect(answer)) stat.correct_answers++;
            stat.total_time += answer.time_spent || 0;
            stat.unique_questions.add(answer.question_id);
            
            const existing = stat.last_answers.get(answer.question_id);
            if (!existing || new Date(answer.answered_at) > new Date(existing.answered_at)) {
                stat.last_answers.set(answer.question_id, answer);
            }
        }
        
        const result = [];
        for (const [themeId, stat] of themeMap) {
            const mastered = Array.from(stat.last_answers.values()).filter(a => _isAnswerCorrect(a)).length;
            
            result.push({
                theme_id: themeId,
                total_answers: stat.total_answers,
                correct_answers: stat.correct_answers,
                accuracy_percent: Math.round((stat.correct_answers / stat.total_answers) * 100),
                average_time: Math.round(stat.total_time / stat.total_answers),
                unique_questions_answered: stat.unique_questions.size,
                mastered_questions: mastered
            });
        }
        
        return result;
        
    } catch (err) {
        _error('❌ Ошибка получения статистики по темам:', err);
        return [];
    }
}

/**
 * Статистика по сложности
 */
async function getDifficultyStats(userId) {
    if (!userId) return [];
    
    try {
        const answers = await _safeFetch(
            `${CONFIG.API_URL}/test-attempt-answers?user_id=${userId}`,
            'Ошибка получения ответов'
        );
        
        if (!answers || answers.length === 0) return [];
        
        const difficultyMap = new Map();
        
        for (const answer of answers) {
            const difficultyId = answer.difficulty_level_id;
            if (!difficultyId) continue;
            
            if (!difficultyMap.has(difficultyId)) {
                difficultyMap.set(difficultyId, {
                    difficulty_level_id: difficultyId,
                    total_answers: 0,
                    correct_answers: 0,
                    total_time: 0,
                    unique_questions: new Set(),
                    last_answers: new Map()
                });
            }
            
            const stat = difficultyMap.get(difficultyId);
            stat.total_answers++;
            if (_isAnswerCorrect(answer)) stat.correct_answers++;
            stat.total_time += answer.time_spent || 0;
            stat.unique_questions.add(answer.question_id);
            
            const existing = stat.last_answers.get(answer.question_id);
            if (!existing || new Date(answer.answered_at) > new Date(existing.answered_at)) {
                stat.last_answers.set(answer.question_id, answer);
            }
        }
        
        const result = [];
        for (const [difficultyId, stat] of difficultyMap) {
            const mastered = Array.from(stat.last_answers.values()).filter(a => _isAnswerCorrect(a)).length;
            
            result.push({
                difficulty_level_id: difficultyId,
                total_answers: stat.total_answers,
                correct_answers: stat.correct_answers,
                accuracy_percent: Math.round((stat.correct_answers / stat.total_answers) * 100),
                average_time: Math.round(stat.total_time / stat.total_answers),
                unique_questions_answered: stat.unique_questions.size,
                mastered_questions: mastered
            });
        }
        
        return result;
        
    } catch (err) {
        _error('❌ Ошибка получения статистики по сложности:', err);
        return [];
    }
}

/**
 * Слабые вопросы
 */
async function getWeakQuestions(userId) {
    if (!userId) return [];
    
    try {
        const answers = await _safeFetch(
            `${CONFIG.API_URL}/test-attempt-answers?user_id=${userId}`,
            'Ошибка получения ответов'
        );
        
        if (!answers || answers.length === 0) return [];
        
        const allQuestions = await _safeFetch(
            `${CONFIG.API_URL}/questions?status=active`,
            'Ошибка получения вопросов'
        );
        
        if (!allQuestions) return [];
        
        const questionsMap = new Map(allQuestions.map(q => [q.id, q]));
        const questionMap = new Map();
        
        for (const answer of answers) {
            const qId = answer.question_id;
            
            if (!questionMap.has(qId)) {
                questionMap.set(qId, {
                    question_id: qId,
                    total_attempts: 0,
                    wrong_attempts: 0,
                    last_answer: null,
                    last_is_correct: null
                });
            }
            
            const stat = questionMap.get(qId);
            stat.total_attempts++;
            if (!_isAnswerCorrect(answer)) stat.wrong_attempts++;
            
            if (!stat.last_answer || new Date(answer.answered_at) > new Date(stat.last_answer.answered_at)) {
                stat.last_answer = answer;
                stat.last_is_correct = _isAnswerCorrect(answer);
            }
        }
        
        const weakQuestions = [];
        for (const [qId, stat] of questionMap) {
            const isWeak = (!stat.last_is_correct) || (stat.wrong_attempts >= 2);
            
            if (isWeak) {
                const question = questionsMap.get(qId);
                if (question) {
                    weakQuestions.push({
                        question_id: qId,
                        question_text: question.text,
                        theme_id: question.theme_id,
                        difficulty_level_id: question.difficulty_level_id,
                        total_attempts: stat.total_attempts,
                        wrong_attempts: stat.wrong_attempts,
                        last_is_correct: stat.last_is_correct
                    });
                }
            }
        }
        
        return weakQuestions;
        
    } catch (err) {
        _error('❌ Ошибка получения слабых вопросов:', err);
        return [];
    }
}

// ============================================
// 6. НАСТРОЙКА И СБРОС
// ============================================

function setCurrentUser(userId) {
    _currentUserId = userId;
}

function setCurrentScore(score) {
    _currentScore = score;
}

function setTestStartTime(startTime) {
    _testStartTime = startTime;
}

function setCurrentQuestions(questions) {
    _currentQuestions = questions;
}

function setCurrentQuestionIndex(index) {
    _currentQuestionIndex = index;
}

function getCurrentAttemptId() {
    return _currentAttemptId;
}

function reset() {
    _currentAttemptId = null;
    _questionStartTime = null;
    _currentQuestions = [];
    _currentScore = 0;
    _testStartTime = null;
    _currentQuestionIndex = 0;
    _answersSinceLastSummary = 0;
    _log('🔄 Статистика сброшена');
}

// ============================================
// 7. ЭКСПОРТ
// ============================================
window.Statistics = {
    createTestAttempt,
    updateTestAttemptSummary,
    getCurrentAttemptId,
    startQuestionTimer,
    getQuestionTimeSpent,
    saveAttemptAnswer,
    getStatsSummary,
    getThemeStats,
    getDifficultyStats,
    getWeakQuestions,
    setCurrentUser,
    setCurrentScore,
    setTestStartTime,
    setCurrentQuestions,
    setCurrentQuestionIndex,  
    reset
};

_log('📊 Statistics.js v1.3 загружен');
