# Discord ↔ Telegram Forwarder

A powerful browser extension that enables seamless bidirectional messaging between Discord and Telegram. Stay connected across platforms with real-time message synchronization.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Chromium](https://img.shields.io/badge/compatible-Chromium%20Browsers-brightgreen.svg)

## 🌟 Features

### 🔄 Bidirectional Messaging
- **Discord → Telegram**: Automatically forward new Discord messages to Telegram
- **Telegram → Discord**: Reply directly from Telegram to Discord channels
- **Real-time synchronization**: Instant message delivery between platforms

### 💎 Smart Message Handling
- **User identification**: Forward sender username and timestamp
- **Keyword filtering**: Filter messages using custom keywords
- **Rich formatting**: Beautiful emoji-enhanced message presentation
- **Smart detection**: Only forwards messages received after extension activation

### ⚙️ Easy Configuration
- **Simple setup**: Easy bot token and chat ID configuration
- **Toggle controls**: Enable/disable forwarding with one click
- **Flexible filters**: Customizable keyword-based filtering
- **No server required**: Everything runs locally in your browser

## 📦 Installation

### Prerequisites
- Chromium-based browser (Chrome, Edge, Brave, etc.)
- Telegram account
- Discord account with web access

### Step 1: Create Telegram Bot

1. Open Telegram and search for `@BotFather`
2. Start a chat and send `/newbot` command
3. Follow the instructions to:
   - Set your bot's display name
   - Choose a username (must end with 'bot')
4. **Save the API token** provided by BotFather

### Step 2: Get Your Chat ID

1. Search for `@userinfobot` in Telegram
2. Send any message to the bot
3. **Copy your numeric Chat ID** from the bot's response

### Step 3: Install Extension

#### Method A: Load Unpacked (Development)
1. Download or clone this repository
2. Open `chrome://extensions/` in your browser
3. Enable **"Developer mode"** (toggle in top-right corner)
4. Click **"Load unpacked"** button
5. Select the folder containing extension files
6. The extension icon should appear in your toolbar

#### Method B: From Chrome Web Store
*Coming soon...*

### Step 4: Configuration

1. Click the extension icon in your browser toolbar
2. Fill in the configuration:
   - **Bot Token**: Paste your Telegram bot token
   - **Chat ID**: Enter your numeric chat ID
   - **Keywords** (optional): Add comma-separated keywords for filtering
   - **Enable Forwarding**: Toggle the switch to ON
3. Click **"Save Settings"**
4. Open Discord in your browser and start chatting!

## 🛠 Technical Details

### Architecture

Browser Extension Architecture:
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Discord.com     │◄──►│ Content Script   │◄──►│ Background      │
│                 │    │ (content.js)     │    │ Script          │
└─────────────────┘    └──────────────────┘    └─────────────────┘
│ │
▼ ▼
┌──────────────────┐ ┌─────────────────┐
│ Popup UI         │ │ Telegram API    │
│ (popup.html/js)  │ │                 │
└──────────────────┘ └─────────────────┘

### File Structure

discord-telegram-forwarder/
├── manifest.json # Extension manifest and permissions
├── popup.html # Settings popup interface
├── popup.js # Popup logic and settings management
├── content.js # Discord message interception and sending
├── background.js # Telegram polling and message processing
└── README.md # This documentation

### Supported Browsers
- ✅ Google Chrome 88+
- ✅ Microsoft Edge 88+
- ✅ Brave Browser 1.20+
- ✅ Opera 74+
- ✅ Other Chromium-based browsers

## 🔧 Configuration Guide

### Basic Setup
1. **Bot Token**: Obtain from @BotFather in Telegram
   - Format: `1234567890:ABCdefGHIjklMNopQRstUVwxyz`
2. **Chat ID**: Your personal or group chat ID
   - Format: Numeric ID like `123456789`
3. **Keywords**: Optional comma-separated list
   - Example: `important,urgent,alert`
   - Leave empty to forward all messages

### Advanced Settings
The extension automatically handles:
- Message deduplication to prevent loops
- Timestamp-based filtering (only new messages)
- DOM mutation observation for new messages
- Error handling and retry mechanisms

## 🎯 Usage Examples

### Forwarding Discord to Telegram
**Input (Discord):**

```
User: JohnDoe
Time: 14:30
Message: Hey team, we have an urgent meeting at 3 PM today!
```

**Output (Telegram):**

```
👤 JohnDoe
🕒 14:30
💬 Hey team, we have an urgent meeting at 3 PM today!
```


### Replying from Telegram to Discord (WIP)
**Input (Telegram):**

```
Your message: I'll be there! Can someone share the agenda?
```

**Output (Discord):**

```
[Your Bot/Username]: I'll be there! Can someone share the agenda?
```

## 🚀 API Reference

### Telegram Bot API
The extension uses official Telegram Bot API:
- `sendMessage` - for sending messages to Telegram
- `getUpdates` - for receiving messages from Telegram

### Discord Integration
- Uses DOM manipulation to detect new messages
- Automatically finds message input fields
- Simulates user typing and sending

## 🐛 Troubleshooting

### Common Issues

**Messages not forwarding from Discord:**
- Verify bot token and chat ID are correct
- Check if forwarding is enabled in settings
- Ensure Discord is open in an active browser tab
- Reload the Discord page after saving settings

**Cannot reply from Telegram:**
- Make sure Discord is open in your browser
- Verify the extension has necessary permissions
- Check browser console for errors (F12 → Console)

**Extension not loading:**
- Ensure you're using a supported browser
- Verify all files are present in the extension folder
- Check `chrome://extensions/` for error messages

### Debug Mode
Enable debug logging in browser console:
1. Press F12 → Console tab
2. Look for extension logs starting with:
   - `Message forwarder started`
   - `Переслано НОВОЕ сообщение` (Russian for "New message forwarded")

## 🔒 Privacy & Security

### Data Handling
- ✅ Bot tokens stored locally in browser storage
- ✅ No external servers or data collection
- ✅ All processing happens locally
- ✅ No message content stored permanently

### Permissions Justification
- `storage`: Save user settings and bot configuration
- `https://discord.com/*`: Access Discord web interface
- `https://api.telegram.org/*`: Communicate with Telegram API

## 📈 Performance

### Resource Usage
- Minimal memory footprint
- Efficient polling intervals (3 seconds for Telegram)
- Smart DOM observation to prevent performance impact
- Automatic cleanup of processed messages

### Limitations
- Requires Discord to be open in browser tab
- Telegram polling may have slight delays
- Dependent on Discord's web interface stability

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### Development Setup
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and test thoroughly
4. Commit your changes: `git commit -m 'Add amazing feature'`
5. Push to the branch: `git push origin feature/amazing-feature`
6. Open a Pull Request

### Areas for Improvement
- [ ] Support for multiple Discord servers
- [ ] Advanced message formatting options
- [ ] Message history synchronization
- [ ] Support for media attachments
- [ ] WebSocket-based real-time updates

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Telegram for their excellent Bot API
- Discord for their web interface
- Chromium team for extension support
- Contributors and testers

## 📞 Support

### Documentation
- [Telegram Bot API Documentation](https://core.telegram.org/bots/api)
- [Chrome Extensions Documentation](https://developer.chrome.com/docs/extensions/)

### Community
- Create an issue for bug reports
- Suggest features via GitHub issues
- Share your use cases and experiences

### Maintenance
This extension is actively maintained. Regular updates ensure compatibility with Discord and Telegram API changes.

---

**Happy Messaging!** 🎉

*If you find this extension useful, please consider giving it a star on GitHub!*
