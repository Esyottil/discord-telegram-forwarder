// Фонный скрипт для обработки ответов из Telegram
let pollingInterval = null;
let lastUpdateId = 0;

// Запускаем опрос сообщений от Telegram бота
function startTelegramPolling() {
  if (pollingInterval) clearInterval(pollingInterval);
  
  pollingInterval = setInterval(async () => {
    try {
      const data = await chrome.storage.sync.get(['botToken', 'enabled']);
      if (!data.botToken || !data.enabled) return;

      const response = await fetch(`https://api.telegram.org/bot${data.botToken}/getUpdates?offset=${lastUpdateId + 1}&timeout=10`);
      const updates = await response.json();
      
      if (updates.ok && updates.result.length > 0) {
        for (const update of updates.result) {
          lastUpdateId = update.update_id;
          
          // Обрабатываем только текстовые сообщения
          if (update.message && update.message.text) {
            await handleTelegramMessage(update.message);
          }
        }
      }
    } catch (error) {
      console.error('Ошибка опроса Telegram:', error);
    }
  }, 3000); // Опрос каждые 3 секунды
}

// Обрабатываем сообщение из Telegram
async function handleTelegramMessage(telegramMessage) {
  const data = await chrome.storage.sync.get(['botToken', 'chatId']);
  
  if (!data.botToken || !data.chatId) return;
  
  const messageText = telegramMessage.text;
  const chatId = telegramMessage.chat.id;
  
  // Проверяем, что сообщение пришло из нужного чата
  if (chatId.toString() !== data.chatId.toString()) return;
  
  // Игнорируем команды
  if (messageText.startsWith('/')) return;
  
  console.log('Получено сообщение из Telegram для отправки в Discord:', messageText);
  
  // Отправляем сообщение в Discord
  const success = await sendToDiscord(messageText);
  
  if (success) {
    // Отправляем подтверждение в Telegram
    await sendTelegramConfirmation(chatId, '✅ Сообщение отправлено в Discord');
  } else {
    await sendTelegramConfirmation(chatId, '❌ Ошибка отправки в Discord');
  }
}

// Отправляем сообщение в Discord
async function sendToDiscord(message) {
  try {
    // Находим активную вкладку Discord
    const tabs = await chrome.tabs.query({url: 'https://discord.com/*'});
    
    if (tabs.length === 0) {
      console.error('Не найдена открытая вкладка Discord');
      return false;
    }

    // Отправляем сообщение в content script
    const response = await chrome.tabs.sendMessage(tabs[0].id, {
      type: 'SEND_TO_DISCORD',
      message: message
    });

    return response && response.status === 'processing';
    
  } catch (error) {
    console.error('Ошибка отправки в Discord:', error);
    return false;
  }
}

// Отправляем подтверждение в Telegram
async function sendTelegramConfirmation(chatId, text) {
  try {
    const data = await chrome.storage.sync.get(['botToken']);
    if (!data.botToken) return;

    const url = `https://api.telegram.org/bot${data.botToken}/sendMessage`;
    
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML'
      })
    });
  } catch (error) {
    console.error('Ошибка отправки подтверждения в Telegram:', error);
  }
}

// Запускаем при установке расширения
chrome.runtime.onInstalled.addListener(() => {
  console.log('Discord Telegram Forwarder установлен');
  startTelegramPolling();
  
  // Устанавливаем настройки по умолчанию
  chrome.storage.sync.set({
    enabled: true,
    keywords: ''
  });
});

// Перезапускаем при старте браузера
chrome.runtime.onStartup.addListener(() => {
  startTelegramPolling();
});

// Останавливаем при выгрузке расширения
chrome.runtime.onSuspend.addListener(() => {
  if (pollingInterval) {
    clearInterval(pollingInterval);
  }
});