const form = document.getElementById('summarizeForm');
const input = document.getElementById('ticket');
const button = document.getElementById('summarizeBtn');
const result = document.getElementById('result');

let busy = false;

// ---------- helpers ----------

// Render simple Markdown bold (**text**) into real <strong> elements.
// XSS-safe: builds DOM with text nodes only (no innerHTML).
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

function setBusy(state) {
  busy = state;
  button.disabled = state;
  input.disabled = state;
}

function showPlaceholder(text) {
  result.className = 'summarize__result summarize__result--placeholder';
  result.textContent = text;
}

function showError(text) {
  result.className = 'summarize__result summarize__result--error';
  result.textContent = text;
}

function showResult(text) {
  result.className = 'summarize__result';
  renderRich(result, text);
}

// The /api/summarize endpoint returns a plain String (2-line summary),
// but stay tolerant of JSON shapes just in case.
function extractText(raw, contentType) {
  if (contentType.includes('application/json')) {
    try {
      const parsed = JSON.parse(raw);
      if (typeof parsed === 'string') return parsed;
      if (parsed && typeof parsed === 'object') {
        return parsed.text ?? parsed.content ?? parsed.summary ?? JSON.stringify(parsed);
      }
    } catch {
      /* fall through to raw */
    }
  }
  return raw;
}

// ---------- summarize ----------

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const ticket = input.value.trim();
  if (!ticket || busy) return;

  setBusy(true);
  showPlaceholder('Summarizing…');

  try {
    const res = await fetch('/api/summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: ticket
    });

    if (!res.ok) {
      throw new Error(`Server responded with ${res.status}`);
    }

    const contentType = (res.headers.get('content-type') || '').toLowerCase();
    const raw = await res.text();
    const text = extractText(raw, contentType).trim();

    if (text) {
      showResult(text);
    } else {
      showError('No summary returned. Please try again.');
    }
  } catch (err) {
    showError('Something went wrong: ' + err.message);
  } finally {
    setBusy(false);
    input.focus();
  }
});

// Enter to submit (Ctrl/Cmd+Enter also works from the textarea).
form.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
    e.preventDefault();
    form.requestSubmit();
  }
});

input.focus();
