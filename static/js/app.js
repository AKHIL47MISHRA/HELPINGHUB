// ===== GLOBALS =====
var currentSessionId = null;
var currentServiceType = null;
var allSessions = [];
var isStreaming = false;

// ===== MARKDOWN PARSER =====
function parseMarkdown(text) {
  if (!text) return '';
  // Code blocks first
  text = text.replace(/```(\w*)\n?([\s\S]*?)```/g, function(_, lang, code) {
    return '<pre><code>' + escHtml(code.trim()) + '</code></pre>';
  });
  // Headers
  text = text.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  text = text.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  text = text.replace(/^# (.+)$/gm, '<h1>$1</h1>');
  // Bold+italic
  text = text.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/\*(.+?)\*/g, '<em>$1</em>');
  // Inline code
  text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
  // Links
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  // Markdown images — use HTML img to avoid URL encoding issues
  text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width:100%;border-radius:10px;margin:8px 0;display:block;">');
  // HR
  text = text.replace(/^---+$/gm, '<hr>');
  // Lists
  text = text.replace(/^[\*\-] (.+)$/gm, '<li>$1</li>');
  text = text.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
  text = text.replace(/(<li>[\s\S]*?<\/li>)(?!\s*<li>)/g, '<ul>$1</ul>');
  text = text.replace(/<\/ul>\s*<ul>/g, '');
  // Line breaks
  text = text.replace(/\n/g, '<br>');
  // Clean inside pre
  text = text.replace(/<pre>([\s\S]*?)<\/pre>/g, function(m, inner) {
    return '<pre>' + inner.replace(/<br>/g, '\n').replace(/<\/?[^>]+>/g, '') + '</pre>';
  });
  return text;
}

function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', function() {
  loadAllSessions();
  var inp = document.getElementById('messageInput');
  if (inp) {
    inp.addEventListener('input', function() {
      this.style.height = 'auto';
      this.style.height = Math.min(this.scrollHeight, 150) + 'px';
    });
  }
});

// ===== SESSIONS =====
async function createNewSession(serviceType) {
  try {
    var res = await fetch('/api/sessions/create', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({service_type: serviceType})
    });
    var data = await res.json();
    if (data.success) {
      currentSessionId = data.session.id;
      currentServiceType = serviceType;
      await loadAllSessions();
      openChatInterface(data.session);
    } else {
      showToast('Failed to create session');
    }
  } catch(e) {
    console.error('createNewSession error:', e);
    showToast('Network error');
  }
}

async function loadAllSessions() {
  try {
    var res = await fetch('/api/sessions/list');
    var data = await res.json();
    if (data.success) {
      allSessions = data.sessions || [];
      renderSessions(allSessions);
    }
  } catch(e) { console.error('loadAllSessions error:', e); }
}

function renderSessions(sessions) {
  var el = document.getElementById('chatHistory');
  if (!el) return;
  if (!sessions || !sessions.length) {
    el.innerHTML = '<div class="empty-history">No chat history yet</div>';
    return;
  }
  var html = '';
  sessions.forEach(function(s) {
    var active = s.id === currentSessionId ? ' active' : '';
    var date = new Date(s.created_at).toLocaleDateString();
    html += '<div class="session-item' + active + '" onclick="loadSession(\'' + s.id + '\')">'
      + '<div class="session-title">' + escHtml(s.title) + '</div>'
      + '<div class="session-meta"><span class="session-badge">' + formatName(s.service_type) + '</span><span class="session-date">' + date + '</span></div>'
      + '<button class="btn-del-session" onclick="event.stopPropagation();deleteSession(\'' + s.id + '\')" title="Delete">&times;</button>'
      + '</div>';
  });
  el.innerHTML = html;
}

async function loadSession(id) {
  try {
    var res = await fetch('/api/sessions/' + id);
    var data = await res.json();
    if (data.success) {
      currentSessionId = id;
      currentServiceType = data.session.service_type;
      renderSessions(allSessions);
      openChatInterface(data.session);
    }
  } catch(e) { console.error('loadSession error:', e); }
}

async function deleteSession(id) {
  if (!confirm('Delete this chat?')) return;
  try {
    await fetch('/api/sessions/' + id, {method: 'DELETE'});
    if (id === currentSessionId) { currentSessionId = null; currentServiceType = null; showWelcome(); }
    await loadAllSessions();
    showToast('Chat deleted');
  } catch(e) { console.error(e); }
}

function deleteCurrentSession() { if (currentSessionId) deleteSession(currentSessionId); }

async function clearAllHistory() {
  if (!confirm('Delete ALL chat history? Cannot be undone.')) return;
  try {
    await fetch('/api/sessions/clear', {method: 'POST'});
    currentSessionId = null; currentServiceType = null; allSessions = [];
    showWelcome(); renderSessions([]);
    showToast('All history cleared');
  } catch(e) { console.error(e); }
}

function filterSessions() {
  var f = document.getElementById('serviceFilter').value;
  renderSessions(f ? allSessions.filter(function(s){ return s.service_type === f; }) : allSessions);
}

// ===== INTERFACE SWITCHING =====
function openChatInterface(session) {
  if (session.service_type === 'all-saver') { openToolInterface(session); return; }
  document.getElementById('welcomeScreen').style.display = 'none';
  document.getElementById('toolInterface').style.display = 'none';
  var ci = document.getElementById('chatInterface');
  ci.style.display = 'flex';
  document.getElementById('chatTitle').textContent = formatName(session.service_type);
  setStatus('Ready');
  renderMessages(session.messages || []);
  setTimeout(function() {
    var inp = document.getElementById('messageInput');
    if (inp) inp.focus();
  }, 100);
}

function openToolInterface(session) {
  document.getElementById('welcomeScreen').style.display = 'none';
  document.getElementById('chatInterface').style.display = 'none';
  document.getElementById('toolInterface').style.display = 'flex';
  document.getElementById('toolTitle').textContent = formatName(session.service_type);
  var asTool = document.getElementById('allsaverTool');
  if (asTool) asTool.style.display = session.service_type === 'all-saver' ? 'block' : 'none';
}

function showWelcome() {
  document.getElementById('welcomeScreen').style.display = 'flex';
  document.getElementById('chatInterface').style.display = 'none';
  document.getElementById('toolInterface').style.display = 'none';
}

function showServiceSelector() { currentSessionId = null; currentServiceType = null; showWelcome(); }

// ===== MESSAGES =====
function renderMessages(msgs) {
  var c = document.getElementById('messagesContainer');
  if (!c) return;
  c.innerHTML = '';
  msgs.forEach(function(m) { appendMsg(m.role, m.content, m.image_url, false); });
  scrollBottom();
}

function appendMsg(role, content, imgUrl, animate) {
  var c = document.getElementById('messagesContainer');
  if (!c) return null;
  var d = document.createElement('div');
  d.className = 'msg ' + role;
  if (!animate) d.style.animation = 'none';

  var avatarSvg = role === 'user'
    ? '<svg viewBox="0 0 24 24" style="width:16px;height:16px;fill:white"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>'
    : '<svg viewBox="0 0 24 24" style="width:16px;height:16px;fill:var(--text-green)"><path d="M20 9V7c0-1.1-.9-2-2-2h-3c0-1.66-1.34-3-3-3S9 3.34 9 5H6c-1.1 0-2 .9-2 2v2c-1.66 0-3 1.34-3 3s1.34 3 3 3v4c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-4c1.66 0 3-1.34 3-3s-1.34-3-3-3zM9 13.5c-.83 0-1.5-.67-1.5-1.5S8.17 10.5 9 10.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm6 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>';

  var ts = new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
  var imgHtml = (imgUrl && imgUrl.trim()) ? '<img src="' + imgUrl + '" class="msg-img" alt="Attached image">' : '';
  var bodyHtml = role === 'assistant' ? parseMarkdown(content) : escHtml(content).replace(/\n/g, '<br>');

  d.innerHTML = '<div class="msg-avatar">' + avatarSvg + '</div>'
    + '<div class="msg-body">'
    + '<div class="msg-bubble">' + imgHtml + bodyHtml + '</div>'
    + '<div class="msg-time">' + ts + '</div>'
    + '</div>';

  c.appendChild(d);
  scrollBottom();
  return d;
}

// ===== SEND MESSAGE =====
async function sendMessage(e) {
  e.preventDefault();
  if (isStreaming) return;

  var inp = document.getElementById('messageInput');
  var imgInp = document.getElementById('imageInput');
  var msg = inp.value.trim();
  var hasImg = imgInp && imgInp.files.length > 0;

  if (!msg && !hasImg) return;
  if (!currentSessionId) { showToast('No active session'); return; }

  var fd = new FormData();
  fd.append('session_id', currentSessionId);
  fd.append('message', msg || 'Please analyze this image');

  var dispImg = null;
  if (hasImg) {
    fd.append('image', imgInp.files[0]);
    var prev = document.getElementById('previewImg');
    if (prev) dispImg = prev.src;
  }

  appendMsg('user', msg || 'Please analyze this image', dispImg, true);
  inp.value = '';
  inp.style.height = 'auto';
  removeImage();

  isStreaming = true;
  setSendState(true);
  setStatus('AI is thinking...');

  // Create streaming placeholder with typing dots
  var c = document.getElementById('messagesContainer');
  var ph = document.createElement('div');
  ph.className = 'msg assistant';
  var ts = new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
  ph.innerHTML = '<div class="msg-avatar"><svg viewBox="0 0 24 24" style="width:16px;height:16px;fill:var(--text-green)"><path d="M20 9V7c0-1.1-.9-2-2-2h-3c0-1.66-1.34-3-3-3S9 3.34 9 5H6c-1.1 0-2 .9-2 2v2c-1.66 0-3 1.34-3 3s1.34 3 3 3v4c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-4c1.66 0 3-1.34 3-3s-1.34-3-3-3zM9 13.5c-.83 0-1.5-.67-1.5-1.5S8.17 10.5 9 10.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm6 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg></div>'
    + '<div class="msg-body"><div class="msg-bubble"><div class="typing-dots"><span></span><span></span><span></span></div></div><div class="msg-time">' + ts + '</div></div>';
  c.appendChild(ph);
  scrollBottom();

  var bubble = ph.querySelector('.msg-bubble');
  var fullText = '';
  var pendingImgUrl = null;

  try {
    var response = await fetch('/api/chat/send', {method: 'POST', body: fd});
    if (!response.ok) throw new Error('HTTP ' + response.status);

    var reader = response.body.getReader();
    // Use TextDecoder with utf-8 explicitly
    var decoder = new TextDecoder('utf-8');
    var buf = '';

    while (true) {
      var chunk = await reader.read();
      if (chunk.done) break;
      buf += decoder.decode(chunk.value, {stream: true});

      // Process complete SSE messages (split by double newline)
      var parts = buf.split('\n\n');
      buf = parts.pop(); // keep incomplete part

      for (var i = 0; i < parts.length; i++) {
        var line = parts[i].trim();
        if (!line.startsWith('data: ')) continue;
        var raw = line.slice(6).trim();
        if (!raw) continue;

        try {
          var obj = JSON.parse(raw);

          // Handle generated image URL — display before text
          if (obj.image_url) {
            pendingImgUrl = obj.image_url;
            bubble.innerHTML = '<img src="' + pendingImgUrl + '" alt="Generated image" style="max-width:100%;border-radius:10px;margin:0 0 10px;display:block;"><div class="typing-dots"><span></span><span></span><span></span></div>';
            scrollBottom();
          }
          // Handle text content
          else if (obj.content) {
            fullText += obj.content;
            if (pendingImgUrl) {
              bubble.innerHTML = '<img src="' + pendingImgUrl + '" alt="Generated image" style="max-width:100%;border-radius:10px;margin:0 0 10px;display:block;">' + parseMarkdown(fullText);
            } else {
              bubble.innerHTML = parseMarkdown(fullText);
            }
            scrollBottom();
          }
          // Done
          else if (obj.done) {
            await loadAllSessions();
          }
          // Error
          else if (obj.error) {
            bubble.innerHTML = '<span style="color:#f87171;">Error: ' + escHtml(obj.error) + '</span>';
          }
        } catch(parseErr) {
          // ignore malformed SSE lines
        }
      }
    }
  } catch(err) {
    console.error('sendMessage error:', err);
    bubble.innerHTML = '<span style="color:#f87171;">Failed to get response. Please try again.</span>';
  } finally {
    isStreaming = false;
    setSendState(false);
    setStatus('Ready');
  }
}

function setSendState(loading) {
  var btn = document.getElementById('sendBtn');
  var icon = document.getElementById('sendIcon');
  var ldr = document.getElementById('sendLoader');
  if (!btn) return;
  btn.disabled = loading;
  if (icon) icon.style.display = loading ? 'none' : 'block';
  if (ldr) ldr.style.display = loading ? 'inline-block' : 'none';
}

function setStatus(txt) {
  var el = document.getElementById('chatStatus');
  if (el) el.textContent = txt;
}

// ===== IMAGE =====
function previewImage(e) {
  var f = e.target.files[0];
  if (!f) return;
  var r = new FileReader();
  r.onload = function(ev) {
    var pi = document.getElementById('previewImg');
    var ip = document.getElementById('imagePreview');
    if (pi) pi.src = ev.target.result;
    if (ip) ip.style.display = 'block';
  };
  r.readAsDataURL(f);
}

function removeImage() {
  var ii = document.getElementById('imageInput');
  if (ii) ii.value = '';
  var ip = document.getElementById('imagePreview');
  if (ip) ip.style.display = 'none';
  var pi = document.getElementById('previewImg');
  if (pi) pi.src = '';
}

// ===== ALL SAVER =====
async function executeAllSaver() {
  var input = document.getElementById('allsaverInput');
  var output = document.getElementById('allsaverOutput');
  var btn = document.getElementById('allsaverBtn');
  var txt = document.getElementById('allsaverText');
  var ldr = document.getElementById('allsaverLoader');
  if (!input || !input.value.trim()) { showToast('Please enter a URL'); return; }
  if (btn) btn.disabled = true;
  if (txt) txt.style.display = 'none';
  if (ldr) ldr.style.display = 'inline-block';
  if (output) output.innerHTML = '<div style="padding:2rem;text-align:center;color:var(--text-muted)">Fetching links...</div>';
  try {
    var res = await fetch('/api/tools/downloader', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({url: input.value.trim()})
    });
    var data = await res.json();
    if (data.status && data.data) renderDownload(data.data);
    else if (output) output.innerHTML = '<div style="padding:1rem;color:#f87171;">' + escHtml(data.error || 'Failed') + '</div>';
  } catch(e) {
    if (output) output.innerHTML = '<div style="padding:1rem;color:#f87171;">Network error</div>';
  } finally {
    if (btn) btn.disabled = false;
    if (txt) txt.style.display = 'inline';
    if (ldr) ldr.style.display = 'none';
  }
}

function renderDownload(d) {
  var out = document.getElementById('allsaverOutput');
  if (!out) return;
  var h = '<div class="dl-card">';
  if (d.thumbnail) h += '<img src="' + d.thumbnail + '" class="dl-thumb" onerror="this.style.display=\'none\'">';
  h += '<div class="dl-info">';
  if (d.source) h += '<span class="dl-platform">' + d.source.toUpperCase() + '</span>';
  if (d.title) h += '<div class="dl-title">' + escHtml(d.title.substring(0, 150)) + '</div>';
  if (d.author) h += '<div class="dl-author">' + escHtml(d.author) + '</div>';
  if (d.like_count || d.view_count) {
    h += '<div class="dl-stats">';
    if (d.like_count) h += '<span class="dl-stat">' + fmtNum(d.like_count) + ' likes</span>';
    if (d.view_count) h += '<span class="dl-stat">' + fmtNum(d.view_count) + ' views</span>';
    h += '</div>';
  }
  if (d.medias && d.medias.length) {
    h += '<div class="dl-links">';
    d.medias.forEach(function(m) {
      var q = m.quality || m.resolution || '';
      var t = m.is_audio ? 'Audio' : 'Video';
      var ext = (m.extension || m.mimeType || '').toUpperCase();
      h += '<a href="' + m.url + '" target="_blank" download class="dl-link"><span>' + t + ' ' + ext + '</span><span class="dl-quality">' + q + '</span></a>';
    });
    h += '</div>';
  }
  h += '</div></div>';
  out.innerHTML = h;
}

// ===== SIDEBAR =====
function toggleSidebar() {
  var s = document.getElementById('sidebar');
  if (s) s.classList.toggle('open');
}

document.addEventListener('click', function(e) {
  var s = document.getElementById('sidebar');
  var m = document.querySelector('.btn-menu');
  if (s && s.classList.contains('open') && !s.contains(e.target) && !(m && m.contains(e.target))) {
    s.classList.remove('open');
  }
});

// ===== KEYBOARD =====
function handleKeyDown(e) {
  // Ctrl+Enter or Cmd+Enter sends
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
    e.preventDefault();
    var form = document.getElementById('chatForm');
    if (form) form.dispatchEvent(new Event('submit', {cancelable: true, bubbles: true}));
  }
}

// ===== HELPERS =====
function scrollBottom() {
  var c = document.getElementById('messagesContainer');
  if (c) requestAnimationFrame(function() { c.scrollTop = c.scrollHeight; });
}

function showToast(msg) {
  document.querySelectorAll('.toast').forEach(function(t) { t.remove(); });
  var t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(function() {
    t.style.transition = 'opacity 0.3s ease';
    t.style.opacity = '0';
    setTimeout(function() { if (t.parentNode) t.parentNode.removeChild(t); }, 300);
  }, 3000);
}

function formatName(s) {
  var n = {
    'study-mate': 'Study-Mate', 'college-mate': 'College-Mate',
    'core-leveling': 'Core-Leveling', 'writer-guru': 'WriterGuru',
    'code-explainer': 'CodeExplainer', 'code-converter': 'CodeConverter',
    'dr-jjc': 'Dr. JJC', 'dream-interpreter': 'Dream Interpreter', 'all-saver': 'All Saver'
  };
  return n[s] || s;
}

function fmtNum(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return n;
}
