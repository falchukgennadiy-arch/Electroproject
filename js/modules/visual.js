// ===== Визуальные блоки =====
// Используем уникальное имя, чтобы избежать конфликтов
let visualBlocksData = [];

async function renderVisualList() {
  const container = document.getElementById("visualList");
  if (!container) return;
  
  try {
    const blocks = await API.getVisualBlocks();
    visualBlocksData = blocks; // Сохраняем в переменную с уникальным именем
    
    let html = '';
    
    if (viewModes.visual === 'list') {
      html = blocks.map(block => `
        <div class="card visual-item" onclick="window.openVisualBlock('${block.id}')">
          <div class="visual-header">
            <h3>${escapeHtml(block.title)}</h3>
            <span class="badge ${block.type}">${block.type}</span>
          </div>
          <p class="visual-description">${escapeHtml(block.description || '')}</p>
          <div class="visual-meta">
            <span>📅 ${block.date || 'Нет даты'}</span>
            ${block.tags ? `<span>🏷️ ${block.tags.join(', ')}</span>` : ''}
          </div>
        </div>
      `).join('');
    } else {
      html = '<div class="grid">' + blocks.map(block => `
        <div class="card visual-grid-item" onclick="window.openVisualBlock('${block.id}')">
          <div class="visual-thumb">${block.thumbnail ? `<img src="${block.thumbnail}" alt="">` : '📷'}</div>
          <div class="visual-info">
            <h4>${escapeHtml(block.title)}</h4>
            <span class="badge ${block.type}">${block.type}</span>
          </div>
        </div>
      `).join('') + '</div>';
    }
    
    container.innerHTML = html;
  } catch (error) {
    console.error('Ошибка загрузки визуальных блоков:', error);
    container.innerHTML = '<div class="card error">Ошибка загрузки данных</div>';
  }
}

function openVisualBlock(blockId) {
  const block = visualBlocksData.find(b => b.id === blockId);
  if (!block) return;
  
  // Здесь логика открытия визуального блока
  console.log('Открытие блока:', block);
}

// ===== Экспорт функций =====
window.renderVisualList = renderVisualList;
window.openVisualBlock = openVisualBlock;
