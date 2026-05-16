# 🌟 HelpingHub V2.0 - Self Growth with AI

**ChatGPT-Style Interface with Chat History**

---

## 🚀 What's New in V2.0

✅ **ChatGPT-Style Interface** - Modern conversational UI  
✅ **Persistent Chat History** - All conversations saved  
✅ **Image Upload Support** - Attach images to prompts  
✅ **Continuous Conversations** - AI remembers context  
✅ **Session Management** - Create, load, delete chats  
✅ **Left Sidebar Navigation** - Easy access to all chats  
✅ **Real-time Streaming** - Watch AI respond live  
✅ **Mobile Responsive** - Works perfectly on all devices  

---

## 📦 Installation

### 1. Clone/Download Project
```bash
cd HelpingHub
```

### 2. Install Dependencies
```bash
pip install -r backend/requirements.txt
```

### 3. Run Application
```bash
cd backend
python app.py
```

### 4. Open Browser
```
http://localhost:5000
```

---

## 🎯 Features

### AI Services (7)
1. **📚 Study-Mate** - Academic tutor with memory
2. **🎯 Core-Leveling** - Personal growth coach
3. **✍️ WriterGuru** - Code writer
4. **📖 CodeExplainer** - Code explanation
5. **🔄 CodeConverter** - Language conversion
6. **🩺 Dr. JJC** - Health companion
7. **🌙 Dream Interpreter** - Dream analysis

### Utility Tools (2)
8. **📱 NumGo** - Phone number lookup
9. **📥 All Saver** - Media downloader

---

## 💬 How to Use

### Start New Chat
1. Click "➕ New Chat" or select service from welcome screen
2. Choose your AI service
3. Start typing and chatting!

### Continue Previous Chat
1. Click any chat from left sidebar
2. Continue where you left off
3. AI remembers all previous messages

### Upload Images
1. Click 📎 attachment button
2. Select image
3. Type your message
4. Send!

### Use Tools
1. Select NumGo or All Saver
2. Enter phone number or URL
3. Get instant results

---

## 🛠️ Tech Stack

- **Backend:** Python Flask
- **Frontend:** HTML5, CSS3, JavaScript
- **AI:** OpenAI GPT-OSS-120B via OpenRouter
- **Storage:** JSON file-based chat history
- **Streaming:** Server-Sent Events (SSE)

---

## 📱 Keyboard Shortcuts

- **Enter** - Send message
- **Shift + Enter** - New line
- **Esc** - Close modals

---

## 🔧 Configuration

API key is in `config.py`:
```python
OPENROUTER_API_KEY = 'your-key-here'
```

Upload folder:
```python
UPLOAD_FOLDER = 'static/uploads'
```

---

## 📝 Project Structure

```
HelpingHub/
├── backend/
│   ├── app.py                 # Main Flask app
│   ├── config.py              # Configuration
│   ├── models/
│   │   └── chat_history.py    # Chat history manager
│   ├── services/
│   │   └── system_prompts.py  # AI instructions
│   └── utils/
│       └── file_handler.py    # File upload handler
├── static/
│   ├── css/
│   │   └── style.css          # Complete styling
│   ├── js/
│   │   └── app.js             # All JavaScript
│   └── uploads/               # Uploaded images
├── templates/
│   ├── index.html             # Home page
│   ├── playground.html        # Main chat interface
│   └── about.html             # About page
└── chat_history.json          # Auto-generated chat storage
```

---

## 🎓 Academic Info

- **Project:** HelpingHub - Self Growth with AI
- **Developers:** Abhishek, Akhil, Boby
- **Mentor:** Mr. Sumit Pathak Sir
- **University:** Dr. BhimRao Ambedkar University
- **Year:** 2024-2025

---

## 🐛 Troubleshooting

**Chat history not saving?**
- Check write permissions in project folder
- `chat_history.json` will be auto-created

**Images not uploading?**
- Check `static/uploads/` folder exists
- Verify file size < 16MB

**Streaming not working?**
- Clear browser cache
- Check internet connection
- Verify API key is valid

---

## 🎨 Customization

### Change Colors
Edit `style.css`:
```css
:root {
    --light-green: #A8E6CF;
    --dark-green: #2F855A;
    --light-cyan: #6EE7F2;
    --dark-cyan: #0E7490;
}
```

### Add New Service
1. Add to `system_prompts.py`
2. Add icon to `getServiceIcon()` in `app.js`
3. Add to welcome screen services

---

## 📄 License

Academic Final Semester Project  
Dr. BhimRao Ambedkar University

---

## 💝 Acknowledgments

- **Mr. Sumit Pathak Sir** - Project Mentor
- **OpenRouter** - AI API Provider
- **Dr. BhimRao Ambedkar University**

---

**Made with ❤️ by Abhishek, Akhil & Boby**

*"Empowering students through AI-powered self-growth"*
```

---
