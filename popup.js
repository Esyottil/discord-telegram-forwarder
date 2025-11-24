document.addEventListener('DOMContentLoaded', function() {
  const botTokenInput = document.getElementById('botToken');
  const chatIdInput = document.getElementById('chatId');
  const keywordsInput = document.getElementById('keywords');
  const enabledCheckbox = document.getElementById('enabled');
  const saveBtn = document.getElementById('saveBtn');
  const resetBtn = document.getElementById('resetBtn');
  const statusDiv = document.getElementById('status');

  // Загружаем сохраненные настройки
  chrome.storage.sync.get(['botToken', 'chatId', 'keywords', 'enabled'], function(data) {
    if (data.botToken) botTokenInput.value = data.botToken;
    if (data.chatId) chatIdInput.value = data.chatId;
    if (data.keywords) keywordsInput.value = data.keywords;
    enabledCheckbox.checked = data.enabled !== false;
  });

  // Сохраняем настройки
  saveBtn.addEventListener('click', function() {
    const botToken = botTokenInput.value.trim();
    const chatId = chatIdInput.value.trim();
    const keywords = keywordsInput.value.trim();

    if (!botToken || !chatId) {
      showStatus('Заполните Token бота и ID чата!', 'error');
      return;
    }

    chrome.storage.sync.set({
      botToken: botToken,
      chatId: chatId,
      keywords: keywords,
      enabled: enabledCheckbox.checked
    }, function() {
      showStatus('Настройки сохранены! Пересылка начнется со СЛЕДУЮЩЕГО сообщения.', 'success');
      
      // Обновляем страницу Discord чтобы применить изменения
      setTimeout(() => {
        chrome.tabs.query({url: 'https://discord.com/*'}, function(tabs) {
          if (tabs.length > 0) {
            chrome.tabs.reload(tabs[0].id);
          }
        });
      }, 1000);
    });
  });

  function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = 'status ' + type;
    statusDiv.style.display = 'block';
    
    setTimeout(() => {
      statusDiv.style.display = 'none';
    }, 4000);
  }
});