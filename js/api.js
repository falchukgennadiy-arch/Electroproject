const API = {
  // ⚠️ ЗАМЕНИТЕ НА ВАШ АДРЕС
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
  }
};
