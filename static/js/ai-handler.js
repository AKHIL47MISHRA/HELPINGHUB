// ==================== AI SERVICE HANDLER ====================

/**
 * Send message to AI and stream response
 */
async function sendAIMessage() {
    const userInput = document.getElementById('userInput').value.trim();
    const outputDiv = document.getElementById('aiOutput');
    const btn = document.getElementById('sendBtn');
    const btnText = document.getElementById('btnText');
    const btnLoader = document.getElementById('btnLoader');
    
    if (!userInput) {
        showError(outputDiv, 'Please enter a message');
        return;
    }
    
    // Show loading state
    btn.disabled = true;
    btnText.style.display = 'none';
    btnLoader.style.display = 'inline-block';
    
    // Clear previous output
    outputDiv.innerHTML = '<div style="color: var(--text-gray); padding: 1rem;">🤔 Thinking...</div>';
    
    try {
        const response = await fetch('/api/ai/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                service_type: currentService,
                message: userInput
            })
        });
        
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        
        // Clear "Thinking..." message
        outputDiv.innerHTML = '';
        
        // Handle streaming response
        await handleStreamingResponse(response, outputDiv);
        
    } catch (error) {
        showError(outputDiv, 'Failed to get AI response. Please try again.');
        console.error('AI Error:', error);
    } finally {
        // Reset button state
        btn.disabled = false;
        btnText.style.display = 'inline';
        btnLoader.style.display = 'none';
    }
}

/**
 * Handle Server-Sent Events streaming response
 */
async function handleStreamingResponse(response, outputDiv) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullResponse = '';
    
    // Create response container
    const responseContainer = document.createElement('div');
    responseContainer.style.cssText = `
        white-space: pre-wrap;
        word-wrap: break-word;
        line-height: 1.8;
        color: var(--text-dark);
    `;
    outputDiv.appendChild(responseContainer);
    
    // Add cursor for typing effect
    const cursor = document.createElement('span');
    cursor.textContent = '▊';
    cursor.style.cssText = `
        animation: blink 1s infinite;
        color: var(--dark-cyan);
    `;
    responseContainer.appendChild(cursor);
    
    // Add blink animation
    if (!document.getElementById('cursor-blink-style')) {
        const style = document.createElement('style');
        style.id = 'cursor-blink-style';
        style.textContent = `
            @keyframes blink {
                0%, 50% { opacity: 1; }
                51%, 100% { opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
    
    try {
        while (true) {
            const { done, value } = await reader.read();
            
            if (done) break;
            
            buffer += decoder.decode(value, { stream: true });
            
            // Process complete SSE messages
            const lines = buffer.split('\n\n');
            buffer = lines.pop(); // Keep incomplete line in buffer
            
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6);
                    
                    try {
                        const parsed = JSON.parse(data);
                        
                        if (parsed.content) {
                            fullResponse += parsed.content;
                            
                            // Update display with typing effect
                            responseContainer.textContent = fullResponse;
                            responseContainer.appendChild(cursor);
                            
                            // Auto-scroll to bottom
                            outputDiv.scrollTop = outputDiv.scrollHeight;
                        }
                        
                        if (parsed.done) {
                            // Remove cursor when done
                            cursor.remove();
                            
                            // Add copy button
                            addCopyButton(responseContainer, fullResponse);
                            return;
                        }
                        
                        if (parsed.error) {
                            throw new Error(parsed.error);
                        }
                        
                    } catch (e) {
                        console.error('Parse error:', e);
                    }
                }
            }
        }
        
        // Remove cursor if stream ends without done signal
        cursor.remove();
        
        // Add copy button
        if (fullResponse) {
            addCopyButton(responseContainer, fullResponse);
        }
        
    } catch (error) {
        cursor.remove();
        showError(outputDiv, 'Streaming error occurred. Please try again.');
        console.error('Streaming error:', error);
    }
}

/**
 * Add copy button to response
 */
function addCopyButton(container, text) {
    const copyBtn = document.createElement('button');
    copyBtn.textContent = '📋 Copy Response';
    copyBtn.style.cssText = `
        margin-top: 1rem;
        padding: 0.5rem 1rem;
        background: linear-gradient(135deg, var(--light-green), var(--light-cyan));
        color: var(--dark-green);
        border: none;
        border-radius: 25px;
        cursor: pointer;
        font-weight: 600;
        transition: var(--transition);
        box-shadow: var(--shadow);
    `;
    
    copyBtn.addEventListener('click', function() {
        copyToClipboard(text);
        this.textContent = '✅ Copied!';
        setTimeout(() => {
            this.textContent = '📋 Copy Response';
        }, 2000);
    });
    
    copyBtn.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-2px)';
        this.style.boxShadow = 'var(--shadow-lg)';
    });
    
    copyBtn.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
        this.style.boxShadow = 'var(--shadow)';
    });
    
    container.parentElement.appendChild(copyBtn);
}

/**
 * Alternative: Handle streaming with fetch EventSource-like approach
 */
async function handleStreamingResponseAlt(response, outputDiv) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';
    
    outputDiv.innerHTML = '';
    const textContainer = document.createElement('div');
    textContainer.className = 'streaming-text';
    outputDiv.appendChild(textContainer);
    
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
            if (line.startsWith('data: ')) {
                const data = line.slice(6);
                
                if (data === '[DONE]') {
                    return;
                }
                
                try {
                    const parsed = JSON.parse(data);
                    if (parsed.content) {
                        fullText += parsed.content;
                        textContainer.textContent = fullText;
                        
                        // Typing effect delay
                        await sleep(20);
                    }
                } catch (e) {
                    // Ignore parse errors
                }
            }
        }
    }
}

/**
 * Sleep utility for typing effect
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Format AI response with markdown-like styling
 */
function formatAIResponse(text) {
    // Bold text
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Code blocks
    text = text.replace(/```(.*?)```/gs, '<pre><code>$1</code></pre>');
    
    // Inline code
    text = text.replace(/`(.*?)`/g, '<code style="background: #f7fafc; padding: 2px 6px; border-radius: 4px;">$1</code>');
    
    // Line breaks
    text = text.replace(/\n/g, '<br>');
    
    return text;
}

/**
 * Syntax highlighting for code (basic)
 */
function highlightCode(code, language) {
    // Basic syntax highlighting - can be enhanced with libraries like Prism.js or Highlight.js
    const keywords = ['def', 'class', 'if', 'else', 'elif', 'for', 'while', 'return', 'import', 'from', 'function', 'const', 'let', 'var'];
    
    keywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'g');
        code = code.replace(regex, `<span style="color: var(--dark-cyan); font-weight: 600;">${keyword}</span>`);
    });
    
    return code;
}

/**
 * Add retry functionality for failed requests
 */
async function retryAIRequest(maxRetries = 3) {
    let attempts = 0;
    
    while (attempts < maxRetries) {
        try {
            await sendAIMessage();
            return;
        } catch (error) {
            attempts++;
            if (attempts >= maxRetries) {
                showError(document.getElementById('aiOutput'), 'Failed after multiple attempts. Please try again later.');
            } else {
                await sleep(1000 * attempts); // Exponential backoff
            }
        }
    }
}

// ==================== RESPONSE ENHANCEMENT ====================

/**
 * Add interactive elements to response
 */
function enhanceResponse(container) {
    // Add expand/collapse for long responses
    if (container.offsetHeight > 500) {
        const expandBtn = document.createElement('button');
        expandBtn.textContent = '▼ Show More';
        expandBtn.className = 'expand-btn';
        expandBtn.style.cssText = `
            margin-top: 1rem;
            padding: 0.5rem 1rem;
            background: var(--light-cyan);
            color: var(--dark-cyan);
            border: none;
            border-radius: 25px;
            cursor: pointer;
            font-weight: 600;
        `;
        
        container.style.maxHeight = '500px';
        container.style.overflow = 'hidden';
        
        expandBtn.addEventListener('click', function() {
            if (container.style.maxHeight === '500px') {
                container.style.maxHeight = 'none';
                this.textContent = '▲ Show Less';
            } else {
                container.style.maxHeight = '500px';
                this.textContent = '▼ Show More';
            }
        });
        
        container.parentElement.appendChild(expandBtn);
    }
}

/**
 * Track user interactions for analytics (optional)
 */
function trackInteraction(serviceType, action) {
    console.log(`User interaction: ${serviceType} - ${action}`);
    // Can be extended to send analytics to backend
}

// ==================== VOICE INPUT (OPTIONAL ENHANCEMENT) ====================

/**
 * Add voice input capability
 */
function enableVoiceInput() {
    if (!('webkitSpeechRecognition' in window)) {
        console.log('Voice recognition not supported');
        return;
    }
    
    const recognition = new webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    
    recognition.onresult = function(event) {
        const transcript = event.results[0][0].transcript;
        document.getElementById('userInput').value = transcript;
    };
    
    recognition.onerror = function(event) {
        console.error('Voice recognition error:', event.error);
    };
    
    // Add voice button to interface
    const voiceBtn = document.createElement('button');
    voiceBtn.innerHTML = '🎤';
    voiceBtn.title = 'Voice Input';
    voiceBtn.onclick = () => recognition.start();
    
    // Append to input section
    const inputSection = document.querySelector('.input-section');
    if (inputSection) {
        inputSection.appendChild(voiceBtn);
    }
}

// Initialize voice input on page load
document.addEventListener('DOMContentLoaded', function() {
    // Uncomment to enable voice input
    // enableVoiceInput();
});

console.log('%c✨ AI Handler Loaded Successfully', 'color: #6EE7F2; font-size: 14px; font-weight: bold;');
