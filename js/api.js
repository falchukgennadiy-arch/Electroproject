const API = {
  baseURL: 'https://api.omavisual.ru/api',

  async getTests() {
    const response = await fetch(`${this.baseURL}/tests`);
    if (!response.ok) throw new Error('Ошибка загрузки тестов');
    return response.json();
  },

  async getTestFull(testId) {
    const response = await fetch(`${this.baseURL}/tests/${testId}/full`);
    if (!response.ok) throw new Error('Ошибка загрузки теста');
    return response.json();
  },

  async saveTestResult(testId, result) {
    const response = await fetch(`${this.baseURL}/tests/${testId}/attempts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result)
    });
    if (!response.ok) throw new Error('Ошибка сохранения результата');
    return response.json();
  },

  // ===== ТЕСТОВЫЕ ПОПЫТКИ =====
  async getTestAttemptsByUser(userId) {
    const response = await fetch(`${this.baseURL}/test-attempts/user/${userId}`);
    if (!response.ok) throw new Error('Ошибка загрузки попыток');
    return response.json();
  },

  async getTestAttempt(attemptId) {
    const response = await fetch(`${this.baseURL}/test-attempts/${attemptId}`);
    if (!response.ok) throw new Error('Ошибка загрузки попытки');
    return response.json();
  },

  async saveTestAttempt(attemptData) {
    const response = await fetch(`${this.baseURL}/test-attempts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(attemptData)
    });
    if (!response.ok) throw new Error('Ошибка сохранения попытки');
    return response.json();
  },

  async updateTestAttempt(attemptId, attemptData) {
    const response = await fetch(`${this.baseURL}/test-attempts/${attemptId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(attemptData)
    });
    if (!response.ok) throw new Error('Ошибка обновления попытки');
    return response.json();
  }
};

window.API = API;
