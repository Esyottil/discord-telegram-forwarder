class MessageForwarder {
    constructor() {
        this.processedMessages = new Set();
        this.settings = {};
        this.lastMessageId = null;
        this.isRunning = false;
        this.messageInputSelector = '[role="textbox"][aria-label*="Message"]';
        this.init();
    }

    async init() {
        await this.loadSettings();
        this.findLastMessage();
        this.start();
        this.setupMessageListener();
    }

    async loadSettings() {
        return new Promise((resolve) => {
            chrome.storage.sync.get(['enabled', 'botToken', 'chatId', 'keywords'], (data) => {
                this.settings = data;
                resolve();
            });
        });
    }

    setupMessageListener() {
        // Слушаем сообщения от background script
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.type === 'SEND_TO_DISCORD') {
                this.sendMessageToDiscord(request.message);
                sendResponse({status: 'processing'});
            }
            return true;
        });
    }

    findLastMessage() {
        const messageSelectors = [
            '[class*="message"][class*="groupStart"]',
            '[class*="message"][class*="cozyMessage"]',
            '[data-list-item-id*="messages"]'
        ];

        const allMessages = document.querySelectorAll(messageSelectors.join(','));
        
        if (allMessages.length > 0) {
            const lastMessage = allMessages[allMessages.length - 1];
            this.lastMessageId = this.getMessageId(lastMessage);
            console.log('Найдено последнее сообщение:', this.lastMessageId);
        } else {
            console.log('Сообщений не найдено, начнем с следующих новых');
        }
    }

    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.startObserving();
        
        chrome.storage.onChanged.addListener((changes) => {
            this.loadSettings();
        });

        console.log('Message forwarder started. Last message:', this.lastMessageId);
    }

    startObserving() {
        const findMessagesContainer = () => {
            const selectors = [
                '[class*="messagesWrapper"]',
                '[class*="messageContainer"]',
                '[class*="chatContent"]',
                'main [role="log"]'
            ];
            
            for (const selector of selectors) {
                const container = document.querySelector(selector);
                if (container) return container;
            }
            return document.body;
        };

        const container = findMessagesContainer();
        
        const observer = new MutationObserver((mutations) => {
            if (!this.settings.enabled) return;
            
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) {
                        setTimeout(() => this.checkNewMessage(node), 100);
                    }
                });
            });
        });

        observer.observe(container, {
            childList: true,
            subtree: true
        });
    }

    async checkNewMessage(node) {
        const messageElements = node.querySelectorAll ? node.querySelectorAll([
            '[class*="message"][class*="groupStart"]',
            '[class*="message"][class*="cozyMessage"]',
            '[data-list-item-id*="messages"]'
        ].join(',')) : [];

        for (const message of messageElements) {
            await this.processMessage(message);
        }

        if (this.isMessageElement(node)) {
            await this.processMessage(node);
        }
    }

    isMessageElement(element) {
        const className = element.className || '';
        return (
            typeof className === 'string' && 
            className.includes('message') &&
            !className.includes('bot') &&
            !className.includes('system')
        );
    }

    async processMessage(messageElement) {
        try {
            const messageId = this.getMessageId(messageElement);
            
            if (!messageId || this.processedMessages.has(messageId)) {
                return;
            }

            if (messageId === this.lastMessageId) {
                console.log('Пропущено существующее сообщение:', messageId);
                this.processedMessages.add(messageId);
                return;
            }

            if (this.lastMessageId === null) {
                this.lastMessageId = messageId;
                console.log('Установлено первое сообщение как последнее:', messageId);
                this.processedMessages.add(messageId);
                return;
            }

            const messageData = this.extractMessageData(messageElement);
            if (!messageData.text) return;

            if (!this.shouldForward(messageData.text)) {
                this.processedMessages.add(messageId);
                return;
            }

            this.processedMessages.add(messageId);
            await this.sendToTelegram(messageData);
            
            console.log('Переслано НОВОЕ сообщение от:', messageData.username, messageData.text.substring(0, 100));

            this.lastMessageId = messageId;

        } catch (error) {
            console.error('Ошибка обработки сообщения:', error);
        }
    }

    getMessageId(messageElement) {
        const listItemId = messageElement.getAttribute('data-list-item-id');
        if (listItemId) return listItemId;

        return messageElement.id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    extractMessageData(messageElement) {
        const messageData = {
            text: '',
            username: 'Неизвестный',
            timestamp: new Date().toLocaleTimeString()
        };

        // Получаем текст сообщения
        const contentSelectors = [
            '[class*="messageContent"]',
            '[class*="content"]',
            '[class*="markup"]'
        ];

        for (const selector of contentSelectors) {
            const element = messageElement.querySelector(selector);
            if (element) {
                const text = element.textContent?.trim();
                if (text && text.length > 0) {
                    messageData.text = text;
                    break;
                }
            }
        }

        if (!messageData.text) {
            messageData.text = messageElement.textContent?.trim() || '';
        }

        // Получаем имя пользователя
        const usernameSelectors = [
            '[class*="username"]',
            '[class*="author"]',
            '[id*="message-username"]',
            '[class*="headerText"]'
        ];

        for (const selector of usernameSelectors) {
            const element = messageElement.querySelector(selector);
            if (element) {
                const username = element.textContent?.trim();
                if (username && username.length > 0) {
                    messageData.username = username;
                    break;
                }
            }
        }

        // Получаем время сообщения
        const timeSelectors = [
            '[class*="timestamp"] time',
            'time[datetime]',
            '[class*="timestampInline"]'
        ];

        for (const selector of timeSelectors) {
            const element = messageElement.querySelector(selector);
            if (element) {
                const timeText = element.textContent?.trim();
                if (timeText) {
                    messageData.timestamp = timeText;
                    break;
                }
            }
        }

        return messageData;
    }

    shouldForward(text) {
        if (!this.settings.enabled || !this.settings.botToken || !this.settings.chatId) {
            return false;
        }

        const keywords = this.settings.keywords ? 
            this.settings.keywords.split(',').map(k => k.trim().toLowerCase()).filter(k => k) : 
            [];

        if (keywords.length === 0) {
            return true;
        }

        return keywords.some(keyword => 
            text.toLowerCase().includes(keyword)
        );
    }

    async sendToTelegram(messageData) {
        if (!this.settings.botToken || !this.settings.chatId) {
            return;
        }

        const url = `https://api.telegram.org/bot${this.settings.botToken}/sendMessage`;
        
        const formattedMessage = 
            `👤 <b>${this.escapeHtml(messageData.username)}</b>\n` +
            `🕒 <i>${messageData.timestamp}</i>\n` +
            `💬 ${this.escapeHtml(messageData.text)}`;
        
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    chat_id: this.settings.chatId,
                    text: formattedMessage,
                    parse_mode: 'HTML'
                })
            });
            
            const result = await response.json();
            if (!result.ok) {
                console.error('Ошибка Telegram API:', result);
            }
        } catch (error) {
            console.error('Ошибка отправки в Telegram:', error);
        }
    }

    async sendMessageToDiscord(message) {
        try {
            // Находим поле ввода сообщения
            const messageInput = document.querySelector(this.messageInputSelector);
            
            if (!messageInput) {
                console.error('Не найдено поле ввода сообщения в Discord');
                return false;
            }

            // Фокусируемся на поле ввода
            messageInput.focus();
            
            // Ждем немного для гарантии фокуса
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Вставляем текст
            messageInput.textContent = message;
            
            // Триггерим событие input для обновления состояния
            const inputEvent = new Event('input', { bubbles: true });
            messageInput.dispatchEvent(inputEvent);
            
            // Ждем обновления интерфейса
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Находим и нажимаем кнопку отправки
            const sendButton = document.querySelector('[aria-label*="Send"]') || 
                             document.querySelector('button[type="submit"]') ||
                             document.querySelector('[class*="sendButton"]');
            
            if (sendButton && !sendButton.disabled) {
                sendButton.click();
                console.log('Сообщение отправлено в Discord:', message);
                return true;
            } else {
                console.error('Кнопка отправки не найдена или недоступна');
                return false;
            }
            
        } catch (error) {
            console.error('Ошибка отправки сообщения в Discord:', error);
            return false;
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Запускаем когда страница загружена
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new MessageForwarder();
    });
} else {
    new MessageForwarder();
}