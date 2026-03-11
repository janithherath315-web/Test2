const API_KEY = "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";
const API_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "nvidia/nemotron-nano-9b-v2:free";

const chatWindow = document.getElementById('chat-window');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const newChatBtn = document.querySelector('.new-chat-btn');

let chatHistory = JSON.parse(localStorage.getItem('sinha_ai_history')) || [
    { role: "system", content: "You are a helpful and intelligent AI assistant named Sinha AI. You provide clear, accurate, and concise answers." }
];

// Initial Load
window.addEventListener('load', () => {
    if (chatHistory.length > 1) {
        chatWindow.innerHTML = '';
        chatHistory.forEach(msg => {
            if (msg.role !== 'system') {
                appendMessage(msg.role === 'assistant' ? 'ai' : 'user', msg.content);
            }
        });
    }
});

// Configure Marked.js
marked.setOptions({
    breaks: true,
    gfm: true
});

function appendMessage(role, content) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}-message`;

    const avatar = document.createElement('div');
    avatar.className = 'avatar';
    avatar.innerHTML = role === 'ai' ? '<i class="fas fa-robot"></i>' : '<i class="fas fa-user"></i>';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'content';

    if (role === 'ai') {
        contentDiv.innerHTML = marked.parse(content);
        addCopyButtons(contentDiv);
    } else {
        contentDiv.textContent = content;
    }

    messageDiv.appendChild(avatar);
    messageDiv.appendChild(contentDiv);
    chatWindow.appendChild(messageDiv);

    scrollToBottom();

    if (role === 'ai') {
        Prism.highlightAllUnder(contentDiv);
    }
}

function addCopyButtons(container) {
    const preBlocks = container.querySelectorAll('pre');
    preBlocks.forEach(pre => {
        const button = document.createElement('button');
        button.className = 'copy-btn';
        button.innerText = 'Copy';
        button.onclick = () => {
            const code = pre.querySelector('code').innerText;
            navigator.clipboard.writeText(code).then(() => {
                button.innerText = 'Copied!';
                setTimeout(() => button.innerText = 'Copy', 2000);
            });
        };
        pre.appendChild(button);
    });
}

function scrollToBottom() {
    chatWindow.scrollTo({
        top: chatWindow.scrollHeight,
        behavior: 'smooth'
    });
}

async function getAIResponse(messages) {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'HTTP-Referer': 'http://localhost:5500', // Required for some OpenRouter free models
                'X-Title': 'Sinha AI Assistant',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: MODEL,
                messages: messages,
                route: "fallback" // Ensures better reliability
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('OpenRouter Error Response:', data);
            throw new Error(data.error?.message || 'API request failed');
        }

        return data.choices[0].message.content;
    } catch (error) {
        console.error('Error fetching AI response:', error);
        return `### ⚠️ API Authentication Error
        
**The OpenRouter server returned: "${error.message}"**

This error (**User not found**) usually means your API key is invalid or has been deactivated.

**How to fix this:**
1.  Go to [OpenRouter Keys](https://openrouter.ai/keys).
2.  If you don't see your key there, click **"Create Key"**.
3.  Copy the new key and paste it into line 1 of \`script.js\`.
4.  Make sure you have a valid email verified on your OpenRouter account.
5.  Refresh this page and try again.`;
    }
}

async function handleSendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    userInput.value = '';
    userInput.style.height = 'auto';
    userInput.disabled = true;
    sendBtn.disabled = true;

    appendMessage('user', text);
    chatHistory.push({ role: "user", content: text });
    saveHistory();

    const thinkingDiv = document.createElement('div');
    thinkingDiv.className = 'message ai-message thinking';
    thinkingDiv.innerHTML = `
        <div class="avatar"><i class="fas fa-robot"></i></div>
        <div class="content">
            <div class="loading-dots">
                <span></span><span></span><span></span>
            </div>
            Sinha AI is processing...
        </div>
    `;
    chatWindow.appendChild(thinkingDiv);
    scrollToBottom();

    const aiResponse = await getAIResponse(chatHistory);

    chatWindow.removeChild(thinkingDiv);
    appendMessage('ai', aiResponse);
    chatHistory.push({ role: "assistant", content: aiResponse });
    saveHistory();

    userInput.disabled = false;
    sendBtn.disabled = false;
    userInput.focus();
}

function saveHistory() {
    localStorage.setItem('sinha_ai_history', JSON.stringify(chatHistory));
}

function clearChat() {
    if (confirm('Clear all chat history?')) {
        chatHistory = [
            { role: "system", content: "You are a helpful and intelligent AI assistant named Sinha AI. You provide clear, accurate, and concise answers." }
        ];
        saveHistory();
        chatWindow.innerHTML = `
            <div class="message ai-message">
                <div class="avatar"><i class="fas fa-robot"></i></div>
                <div class="content">Chat history cleared. How can I help you now?</div>
            </div>
        `;
    }
}

sendBtn.addEventListener('click', handleSendMessage);
newChatBtn.addEventListener('click', clearChat);

userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
    }
});

userInput.addEventListener('input', function () {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
});

userInput.focus();
