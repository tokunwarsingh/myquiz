let questions = [];
let currentPage = 1;
const questionsPerPage = 5;

function loadQuestions() {
  // Check if questions.json exists
  fetch('questions.json')
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok ' + response.statusText);
      }
      return response.json();
    })
    .then(data => {
      questions = data;
      renderPage();
    })
    .catch(error => {
      console.error('Error loading questions:', error); 
    });
}

function getTotalPages() {
  return Math.ceil(questions.length / questionsPerPage);
}

function getCurrentQuestions() {
  const startIndex = (currentPage - 1) * questionsPerPage;
  return questions.slice(startIndex, startIndex + questionsPerPage);
}

function renderPage() {
  const form = document.getElementById('quizForm');
  const result = document.getElementById('result');
  const meta = document.getElementById('meta');
  
  form.innerHTML = '';
  result.style.display = 'none';
  
  const currentQuestions = getCurrentQuestions();
  
  currentQuestions.forEach((q, idx) => {
    const multi = q.correct_answer.length > 1;
    const optionKeys = Object.keys(q.options).sort();
    const card = document.createElement('div');
    card.className = 'card';
    card.id = `q-${idx}`;
    card.innerHTML = `<div class="q">Q${q.question_number}. ${escapeHtml(q.question_text)}</div>`;

    optionKeys.forEach((k) => {
      const id = `q${idx}_${k}`;
      const wrap = document.createElement('label');
      wrap.className = 'opt';
      wrap.setAttribute('for', id);
      wrap.innerHTML = `<input id="${id}" name="q${idx}${multi ? '[]' : ''}" type="${multi ? 'checkbox' : 'radio'}" value="${k}"> <strong>${k}.</strong> ${escapeHtml(q.options[k])}`;
      card.appendChild(wrap);
    });

    form.appendChild(card);
  });
  
  renderPagination();
  updateMeta();
  syncSelectedStyles(form);
}

function renderPagination() {
  const pagination = document.createElement('div');
  pagination.className = 'pagination';
  
  const prevBtn = document.createElement('button');
  prevBtn.textContent = 'Previous';
  prevBtn.className = 'btn secondary';
  prevBtn.disabled = currentPage === 1;
  prevBtn.onclick = () => {
    if (currentPage > 1) {
      currentPage--;
      renderPage();
    }
  };
  
  const nextBtn = document.createElement('button');
  nextBtn.textContent = 'Next';
  nextBtn.className = 'btn';
  nextBtn.disabled = currentPage === getTotalPages();
  nextBtn.onclick = () => {
    if (currentPage < getTotalPages()) {
      currentPage++;
      renderPage();
    }
  };
  
  const pageInfo = document.createElement('span');
  pageInfo.className = 'muted';
  pageInfo.textContent = `Page ${currentPage} of ${getTotalPages()}`;
  
  pagination.appendChild(prevBtn);
  pagination.appendChild(pageInfo);
  pagination.appendChild(nextBtn);
  
  const form = document.getElementById('quizForm');
  form.appendChild(pagination);
}

function updateMeta() {
  const meta = document.getElementById('meta');
  const totalQuestions = questions.length;
  const totalPages = getTotalPages();
  meta.textContent = ` · Total Questions: ${totalQuestions} · Page ${currentPage} of ${totalPages}`;
}

function escapeHtml(text) {
  return text.replace(/[&<>"']/g, (m) => ({
    '&': '&',
    '<': '<',
    '>': '>',
    '"': '"',
    "'": '&#39;'
  })[m]);
}

function isMulti(ans) {
  return (ans || '').length > 1;
}

function getAnswer(idx, multi) {
  if (multi) {
    return Array.from(document.querySelectorAll(`input[name="q${idx}[]"]:checked`))
      .map(x => x.value)
      .sort()
      .join('');
  }
  const r = document.querySelector(`input[name="q${idx}"]:checked`);
  return r ? r.value : '';
}

function syncSelectedStyles(scope) {
  const root = scope || document;
  const labels = root.querySelectorAll('label.opt');
  labels.forEach((label) => {
    const input = label.querySelector('input');
    if (!input) return;
    label.classList.toggle('selected', !!input.checked);
  });
}

function submitQuiz() {
  let correct = 0;
  const wrong = [];
  const form = document.getElementById('quizForm');
  
  const allQuestions = questions;
  const startIndex = (currentPage - 1) * questionsPerPage;
  const endIndex = startIndex + questionsPerPage;
  const currentQuestions = allQuestions.slice(startIndex, endIndex);
  
  currentQuestions.forEach((q, idx) => {
    const user = getAnswer(idx, isMulti(q.correct_answer));
    const expected = (q.correct_answer || '').split('').sort().join('');
    if (user === expected) correct++;
    else wrong.push({ idx, q, user, expected });
  });
  
  const pct = ((correct / currentQuestions.length) * 100).toFixed(2);
  const result = document.getElementById('result');
  result.style.display = 'block';
  result.innerHTML = `<h2>Result</h2><p><strong>Score:</strong> ${correct}/${currentQuestions.length} (${pct}%)</p>`;
  
  if (wrong.length) {
    const details = document.createElement('div');
    details.innerHTML = '<h3>Incorrect / Unanswered</h3>';
    wrong.forEach((w) => {
      const div = document.createElement('div');
      div.className = 'wrong-item';
      div.innerHTML =
        `<div><strong>Q${w.q.question_number}:</strong> ${escapeHtml(w.q.question_text)}</div>` +
        `<div class="bad">Your answer: ${escapeHtml(w.user || 'Not answered')}</div>` +
        `<div class="ok">Correct answer: ${escapeHtml(w.expected)}</div>`;
      details.appendChild(div);
    });
    result.appendChild(details);
  }
  
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetQuiz() {
  currentPage = 1;
  const form = document.getElementById('quizForm');
  form.reset();
  syncSelectedStyles(form);
  const result = document.getElementById('result');
  result.style.display = 'none';
  result.innerHTML = '';
  window.scrollTo({ top: 0, behavior: 'smooth' });
  renderPage();
}

document.addEventListener('DOMContentLoaded', function() {
  loadQuestions();
  
  const submitBtn = document.getElementById('submitBtn');
  if (submitBtn) {
    submitBtn.addEventListener('click', submitQuiz);
  }
  
  const resetBtn = document.getElementById('resetBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', resetQuiz);
  }
  
  const form = document.getElementById('quizForm');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      submitQuiz();
    });
    
    form.addEventListener('change', () => {
      syncSelectedStyles(form);
    });
  }
});