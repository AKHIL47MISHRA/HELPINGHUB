// ==================== GLOBAL VARIABLES ====================
let currentService = '';

// ==================== SERVICE MODAL FUNCTIONS ====================

/**
 * Open service modal
 */
function openService(serviceType) {
    currentService = serviceType;
    const modal = document.getElementById('serviceModal');
    const modalTitle = document.getElementById('modalTitle');
    
    // Hide all interfaces first
    document.getElementById('aiInterface').style.display = 'none';
    document.getElementById('numgoInterface').style.display = 'none';
    document.getElementById('allsaverInterface').style.display = 'none';
    
    // Clear previous outputs
    clearOutputs();
    
    // Set title and show appropriate interface
    switch(serviceType) {
        case 'study-mate':
            modalTitle.textContent = '📚 Study-Mate - AI Academic Tutor';
            document.getElementById('aiInterface').style.display = 'block';
            document.getElementById('userInput').placeholder = 'Ask me anything about your studies... (e.g., Explain Newton\'s Laws of Motion)';
            break;
            
        case 'core-leveling':
            modalTitle.textContent = '🎯 Core-Leveling - Personal Growth Planner';
            document.getElementById('aiInterface').style.display = 'block';
            document.getElementById('userInput').placeholder = 'Tell me about your current habits and goals... (e.g., I want to improve my study routine and fitness)';
            break;
            
        case 'writer-guru':
            modalTitle.textContent = '✍️ WriterGuru - Code Writer';
            document.getElementById('aiInterface').style.display = 'block';
            document.getElementById('userInput').placeholder = 'Describe the code you need... (e.g., Write a Python function to reverse a string)';
            break;
            
        case 'code-explainer':
            modalTitle.textContent = '📖 CodeExplainer - Explain Any Code';
            document.getElementById('aiInterface').style.display = 'block';
            document.getElementById('userInput').placeholder = 'Paste your code here and I\'ll explain it...';
            break;
            
        case 'code-converter':
            modalTitle.textContent = '🔄 CodeConverter - Convert Code Languages';
            document.getElementById('aiInterface').style.display = 'block';
            document.getElementById('userInput').placeholder = 'Paste your code and specify target language... (e.g., Convert this Python code to JavaScript: [your code])';
            break;
            
        case 'dr-jjc':
            modalTitle.textContent = '🩺 Dr. JJC - Health Companion';
            document.getElementById('aiInterface').style.display = 'block';
            document.getElementById('userInput').placeholder = 'Tell me how you\'re feeling... (e.g., I feel stressed and unmotivated lately)';
            break;
            
        case 'dream-interpreter':
            modalTitle.textContent = '🌙 Dream Interpreter - Analyze Your Dreams';
            document.getElementById('aiInterface').style.display = 'block';
            document.getElementById('userInput').placeholder = 'Describe your dream in detail...';
            break;
            
        case 'numgo':
            modalTitle.textContent = '📱 NumGo - Number Lookup Tool';
            document.getElementById('numgoInterface').style.display = 'block';
            break;
            
        case 'all-saver':
            modalTitle.textContent = '📥 All Saver - Media Downloader';
            document.getElementById('allsaverInterface').style.display = 'block';
            break;
    }
    
    // Show modal with animation
    modal.style.display = 'block';
    setTimeout(() => {
        modal.style.opacity = '1';
    }, 10);
}

/**
 * Close service modal
 */
function closeService() {
    const modal = document.getElementById('serviceModal');
    modal.style.opacity = '0';
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
    
    // Clear inputs
    clearOutputs();
}

/**
 * Clear all outputs and inputs
 */
function clearOutputs() {
    // Clear AI interface
    if (document.getElementById('userInput')) {
        document.getElementById('userInput').value = '';
    }
    if (document.getElementById('aiOutput')) {
        document.getElementById('aiOutput').innerHTML = '';
    }
    
    // Clear NumGo interface
    if (document.getElementById('numgoInput')) {
        document.getElementById('numgoInput').value = '';
    }
    if (document.getElementById('numgoOutput')) {
        document.getElementById('numgoOutput').innerHTML = '';
    }
    
    // Clear All Saver interface
    if (document.getElementById('allsaverInput')) {
        document.getElementById('allsaverInput').value = '';
    }
    if (document.getElementById('allsaverOutput')) {
        document.getElementById('allsaverOutput').innerHTML = '';
    }
}

// ==================== MODAL CLOSE ON OUTSIDE CLICK ====================
window.onclick = function(event) {
    const modal = document.getElementById('serviceModal');
    if (event.target === modal) {
        closeService();
    }
}

// ==================== NUMGO LOOKUP FUNCTION ====================

async function lookupNumber() {
    const numberInput = document.getElementById('numgoInput').value.trim();
    const outputDiv = document.getElementById('numgoOutput');
    const btn = document.getElementById('numgoBtn');
    const btnText = document.getElementById('numgoBtnText');
    const btnLoader = document.getElementById('numgoBtnLoader');
    
    if (!numberInput) {
        showError(outputDiv, 'Please enter a phone number');
        return;
    }
    
    // Show loading state
    btn.disabled = true;
    btnText.style.display = 'none';
    btnLoader.style.display = 'inline-block';
    outputDiv.innerHTML = '<div style="text-align:center; padding:2rem; color:var(--text-gray);">🔍 Searching...</div>';
    
    try {
        const response = await fetch('/api/tools/numgo', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ number: numberInput })
        });
        
        const result = await response.json();
        
        if (result.success && result.data && result.data.length > 0) {
            displayNumGoResults(result.data, outputDiv);
        } else {
            showError(outputDiv, 'No results found for this number');
        }
        
    } catch (error) {
        showError(outputDiv, 'Failed to fetch results. Please try again.');
        console.error('NumGo Error:', error);
    } finally {
        // Reset button state
        btn.disabled = false;
        btnText.style.display = 'inline';
        btnLoader.style.display = 'none';
    }
}

/**
 * Display NumGo results
 */
function displayNumGoResults(data, outputDiv) {
    let html = '<div class="numgo-results">';
    
    data.forEach((result, index) => {
        html += `
            <div class="numgo-card" style="animation-delay: ${index * 0.1}s">
                <div class="numgo-card-header">
                    <h4>📋 Result ${index + 1}</h4>
                    <span class="numgo-badge">${result.circle || 'Unknown'}</span>
                </div>
                <div class="numgo-detail">
                    <span class="numgo-label">📱 Mobile:</span>
                    <span class="numgo-value">${result.mobile || 'N/A'}</span>
                </div>
                <div class="numgo-detail">
                    <span class="numgo-label">👤 Name:</span>
                    <span class="numgo-value">${result.name || 'N/A'}</span>
                </div>
                <div class="numgo-detail">
                    <span class="numgo-label">👨‍👦 Father's Name:</span>
                    <span class="numgo-value">${result.father_name || 'N/A'}</span>
                </div>
                <div class="numgo-detail">
                    <span class="numgo-label">📍 Address:</span>
                    <span class="numgo-value">${result.address || 'N/A'}</span>
                </div>
                <div class="numgo-detail">
                    <span class="numgo-label">📞 Alt Mobile:</span>
                    <span class="numgo-value">${maskPhoneNumber(result.alt_mobile) || 'N/A'}</span>
                </div>
                <div class="numgo-detail">
                    <span class="numgo-label">🆔 ID Number:</span>
                    <span class="numgo-value">${result.id_number || 'N/A'}</span>
                </div>
                ${result.email ? `
                <div class="numgo-detail">
                    <span class="numgo-label">📧 Email:</span>
                    <span class="numgo-value">${result.email}</span>
                </div>
                ` : ''}
            </div>
        `;
    });
    
    html += '</div>';
    outputDiv.innerHTML = html;
}

/**
 * Mask phone number for privacy
 */
function maskPhoneNumber(phone) {
    if (!phone) return 'N/A';
    if (phone.length > 6) {
        return phone.substring(0, 3) + '****' + phone.substring(phone.length - 3);
    }
    return phone;
}

// ==================== ALL SAVER DOWNLOADER FUNCTION ====================

async function downloadMedia() {
    const urlInput = document.getElementById('allsaverInput').value.trim();
    const outputDiv = document.getElementById('allsaverOutput');
    const btn = document.getElementById('allsaverBtn');
    const btnText = document.getElementById('allsaverBtnText');
    const btnLoader = document.getElementById('allsaverBtnLoader');
    
    if (!urlInput) {
        showError(outputDiv, 'Please enter a valid URL');
        return;
    }
    
    // Show loading state
    btn.disabled = true;
    btnText.style.display = 'none';
    btnLoader.style.display = 'inline-block';
    outputDiv.innerHTML = '<div style="text-align:center; padding:2rem; color:var(--text-gray);">⏳ Fetching download links...</div>';
    
    try {
        const response = await fetch('/api/tools/downloader', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ url: urlInput })
        });
        
        const result = await response.json();
        
        if (result.status && result.data) {
            displayDownloadResults(result.data, outputDiv);
        } else {
            showError(outputDiv, result.error || 'Failed to fetch download links');
        }
        
    } catch (error) {
        showError(outputDiv, 'Failed to process URL. Please try again.');
        console.error('All Saver Error:', error);
    } finally {
        // Reset button state
        btn.disabled = false;
        btnText.style.display = 'inline';
        btnLoader.style.display = 'none';
    }
}

/**
 * Display download results
 */
function displayDownloadResults(data, outputDiv) {
    let html = '<div class="download-card">';
    
    // Thumbnail
    if (data.thumbnail) {
        html += `<img src="${data.thumbnail}" alt="Thumbnail" class="download-thumbnail" onerror="this.style.display='none'">`;
    }
    
    html += '<div class="download-info">';
    
    // Platform badge
    if (data.source) {
        html += `<span class="download-platform">📱 ${data.source.toUpperCase()}</span>`;
    }
    
    // Title
    if (data.title) {
        const shortTitle = data.title.length > 100 ? data.title.substring(0, 100) + '...' : data.title;
        html += `<div class="download-title">${escapeHtml(shortTitle)}</div>`;
    }
    
    // Author
    if (data.author) {
        html += `<div class="download-author">👤 ${escapeHtml(data.author)}</div>`;
    }
    
    // Stats
    if (data.like_count || data.view_count) {
        html += '<div class="download-stats">';
        if (data.like_count) {
            html += `<div class="stat-item">❤️ ${formatNumber(data.like_count)} likes</div>`;
        }
        if (data.view_count) {
            html += `<div class="stat-item">👁️ ${formatNumber(data.view_count)} views</div>`;
        }
        html += '</div>';
    }
    
    // Download links
    if (data.medias && data.medias.length > 0) {
        html += '<div class="download-links">';
        
        data.medias.forEach((media, index) => {
            const quality = media.quality || media.resolution || 'Unknown';
            const type = media.is_audio ? '🎵 Audio' : '🎬 Video';
            const extension = media.extension || media.mimeType || '';
            
            html += `
                <a href="${media.url}" target="_blank" download class="download-btn">
                    <span>${type} - ${extension.toUpperCase()}</span>
                    <span class="download-quality">${quality}</span>
                </a>
            `;
        });
        
        html += '</div>';
    } else {
        html += '<p style="color: var(--text-gray); text-align: center; padding: 1rem;">No download links available</p>';
    }
    
    html += '</div></div>';
    outputDiv.innerHTML = html;
}

/**
 * Format large numbers
 */
function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num;
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ==================== ERROR DISPLAY ====================

function showError(outputDiv, message) {
    outputDiv.innerHTML = `
        <div style="background: #fee; color: #c00; padding: 1.5rem; border-radius: 10px; border-left: 4px solid #c00; text-align: center;">
            ⚠️ ${message}
        </div>
    `;
}

// ==================== KEYBOARD SHORTCUTS ====================

// Close modal on Escape key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeService();
    }
});

// Submit on Ctrl+Enter for AI services
document.addEventListener('keydown', function(event) {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        if (document.getElementById('aiInterface').style.display === 'block') {
            sendAIMessage();
        }
    }
});

// ==================== SMOOTH SCROLL FOR ANCHOR LINKS ====================

document.addEventListener('DOMContentLoaded', function() {
    const links = document.querySelectorAll('a[href^="#"]');
    
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});

// ==================== ANIMATE ON SCROLL ====================

const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe all cards on page load
document.addEventListener('DOMContentLoaded', function() {
    const cards = document.querySelectorAll('.objective-card, .tech-card, .feature-card, .service-card, .team-card');
    
    cards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(card);
    });
});

// ==================== PAGE LOAD ANIMATION ====================

window.addEventListener('load', function() {
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 0.5s ease';
        document.body.style.opacity = '1';
    }, 100);
});

// ==================== UTILITIES ====================

/**
 * Copy text to clipboard
 */
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast('Copied to clipboard!');
    }).catch(err => {
        console.error('Failed to copy:', err);
    });
}

/**
 * Show toast notification
 */
function showToast(message) {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        background: linear-gradient(135deg, var(--dark-green), var(--dark-cyan));
        color: white;
        padding: 1rem 2rem;
        border-radius: 50px;
        box-shadow: var(--shadow-lg);
        z-index: 10000;
        animation: slideInRight 0.5s ease;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.5s ease';
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 500);
    }, 3000);
}

// Console welcome message
console.log('%c🌟 HelpingHub - Self Growth with AI 🌟', 'color: #2F855A; font-size: 20px; font-weight: bold;');
console.log('%cDeveloped by: Abhishek, Akhil & Boby', 'color: #0E7490; font-size: 14px;');
console.log('%cDr. BhimRao Ambedkar University', 'color: #4a5568; font-size: 12px;');
