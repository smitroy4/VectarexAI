const messagesEl = document.getElementById('messages');
const form = document.getElementById('chatForm');
const input = document.getElementById('input');
const sendBtn = document.getElementById('sendBtn');
const clearBtn = document.getElementById('clearBtn');

let busy = false;

// ---------- helpers ----------

// Render simple Markdown bold (**text**) into real <strong> elements.
// XSS-safe: builds DOM with text nodes only (no innerHTML). Newlines are
// preserved by the CSS `white-space: pre-wrap` on .msg.
function renderRich(el, text) {
  el.textContent = '';
  const parts = String(text).split(/(\*\*[^*]+?\*\*)/g);
  for (const part of parts) {
    if (part.length > 4 && part.startsWith('**') && part.endsWith('**')) {
      const strong = document.createElement('strong');
      strong.textContent = part.slice(2, -2);
      el.appendChild(strong);
    } else if (part) {
      el.appendChild(document.createTextNode(part));
    }
  }
}

function addMessage(text, role) {
  const el = document.createElement('div');
  el.className = `msg msg--${role}`;
  if (role === 'bot') {
    renderRich(el, text);
  } else {
    el.textContent = text;
  }
  messagesEl.appendChild(el);
  scrollToBottom();
  return el;
}

function scrollToBottom() {
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function autoResize() {
  input.style.height = 'auto';
  input.style.height = Math.min(input.scrollHeight, 120) + 'px';
}

function setBusy(state) {
  busy = state;
  sendBtn.disabled = state;
  input.disabled = state;
}

// Read an entire ReadableStream into a string.
function readAllText(stream) {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let out = '';
  return (async () => {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      out += decoder.decode(value, { stream: true });
    }
    return out;
  })();
}

// Pull displayable text out of a JSON body. Handles a plain string,
// an array of chunks, and the common Spring/OpenAI chat-response shapes.
function extractJsonText(raw) {
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return raw; // not valid JSON after all — show it as-is
  }

  if (typeof parsed === 'string') return parsed;

  if (Array.isArray(parsed)) {
    return parsed
      .map((item) => (typeof item === 'string' ? item : (item?.text ?? item?.content ?? '')))
      .join('');
  }

  if (parsed && typeof parsed === 'object') {
    return (
      parsed.text ??
      parsed.content ??
      parsed.message ??
      parsed.output ??
      parsed.result ??
      parsed.response ??
      parsed.generatedText ??
      parsed?.choices?.[0]?.message?.content ??
      JSON.stringify(parsed)
    );
  }

  return String(parsed);
}

// ---------- greeting ----------

addMessage(
  'Hi! 👋 I\'m the CheesyLane assistant. Ask me about placing an order, ' +
  'refunds, order tracking, or company policies.',
  'bot'
);

// ---------- send ----------

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const message = input.value.trim();
  if (!message || busy) return;

  addMessage(message, 'user');
  input.value = '';
  autoResize();
  setBusy(true);

  const botEl = addMessage('…', 'typing');
  let botText = '';

  try {
    const res = await fetch('/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: message
    });

    if (!res.ok) {
      throw new Error(`Server responded with ${res.status}`);
    }

    const contentType = (res.headers.get('content-type') || '').toLowerCase();

    // Spring MVC returns the Flux<String> as Server-Sent Events.
    // Handle that case with live streaming…
    if (contentType.includes('text/event-stream')) {
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // SSE events are separated by a blank line; be tolerant of both
        // LF (\n\n) and CRLF (\r\n\r\n) line endings.
        const events = buffer.split(/\r?\n\r?\n/);
        buffer = events.pop() || ''; // keep the trailing incomplete chunk

        for (const event of events) {
          for (const line of event.split(/\r?\n/)) {
            if (!line.startsWith('data:')) continue;
            let data = line.slice(5);
            if (data.startsWith(' ')) data = data.slice(1);
            if (data === '[DONE]') continue;
            botText += data;
          }
        }

        if (botText) {
          botEl.className = 'msg msg--bot';
          renderRich(botEl, botText);
          scrollToBottom();
        }
      }
    } else {
      // …otherwise read the whole body and parse it as text or JSON.
      const raw = res.body ? await readAllText(res.body) : '';

      if (contentType.includes('application/json')) {
        botText = extractJsonText(raw);
      } else {
        botText = raw;
      }

      if (botText) {
        botEl.className = 'msg msg--bot';
        renderRich(botEl, botText);
        scrollToBottom();
      }
    }

    if (!botText) {
      // Nothing parsed — show the raw payload so the cause is visible.
      let hint = 'No response received. Please try again.';
      try {
        const raw = res.body ? await readAllText(res.body.clone()) : '';
        if (raw) hint += '\n\n(raw: ' + raw.slice(0, 300) + ')';
      } catch { /* ignore */ }
      botEl.className = 'msg msg--error';
      botEl.textContent = hint;
    }
  } catch (err) {
    botEl.className = 'msg msg--error';
    botEl.textContent = 'Something went wrong: ' + err.message;
  } finally {
    setBusy(false);
    input.focus();
    scrollToBottom();
  }
});

// Enter to send, Shift+Enter for a new line.
input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    form.requestSubmit();
  }
});

input.addEventListener('input', autoResize);

// ---------- clear ----------

clearBtn.addEventListener('click', async () => {
  if (busy) return;
  try {
    await fetch('/chat', { method: 'DELETE' });
  } catch {
    /* ignore network errors on clear */
  }
  messagesEl.innerHTML = '';
  addMessage('Conversation cleared. How can I help you today?', 'bot');
  input.focus();
});

input.focus();
