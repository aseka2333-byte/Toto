/**
 * script.js — ЖИ-Чат және интерактивтілік
 * Тапсырма: Практикалық жұмыс №1 — ЖИ веб-әзірлеуде
 *
 * Функциялар тізімі:
 *  - toggleTheme()         : Жарық/қараңғы тақырыпты ауыстырады
 *  - initCardObserver()    : Карточкалардың айналдыру анимациясын іске қосады
 *  - sendMessage()         : Пайдаланушы хабарын жіберіп, ЖИ жауабын алады
 *  - callClaudeAPI(prompt) : Claude API-ге HTTP сұраныс жасайды
 *  - appendMessage(role, text) : Чатқа жаңа хабарлама қосады
 *  - appendLoading()       : Жүктелу анимациясын қосады
 *  - removeLoading()       : Жүктелу анимациясын жояды
 *  - updateCounter()       : Сұраныс санауышын жаңартады
 *  - scrollToBottom()      : Чатты ең төменге айналдырады
 */

// ============================================
// 1. ТАҚЫРЫП АУЫСТЫРУ (Dark / Light Mode)
// ============================================

/**
 * toggleTheme — Қараңғы және жарық тақырыпты ауыстырады.
 * CSS класс 'light-theme' арқылы CSS айнымалылары өзгереді.
 */
function toggleTheme() {
  const body = document.body;
  const themeIcon = document.querySelector('.theme-icon');

  body.classList.toggle('light-theme');

  // Иконканы жаңарту: күн ↔ ай
  if (body.classList.contains('light-theme')) {
    themeIcon.textContent = '☾';
  } else {
    themeIcon.textContent = '☀';
  }
}

// Тақырып батырмасына оқиға тыңдаушы қосу
document.getElementById('themeToggle').addEventListener('click', toggleTheme);


// ============================================
// 2. КАРТОЧКАЛАР АНИМАЦИЯСЫ (Intersection Observer)
// ============================================

/**
 * initCardObserver — Intersection Observer API арқылы карточкаларды
 * экранға кіргенде пайда болу анимациясымен көрсетеді.
 * CSS .card.visible класы анимацияны іске қосады.
 */
function initCardObserver() {
  const cards = document.querySelectorAll('.card');

  // Observer опциялары: элемент 15% көрінгенде іске қосылады
  const options = {
    threshold: 0.15,
    rootMargin: '0px 0px -30px 0px'
  };

  const observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry, index) {
      if (entry.isIntersecting) {
        // Кезекті анимация үшін кідіріс
        setTimeout(function() {
          entry.target.classList.add('visible');
        }, index * 120);

        // Бір рет қана іске қосу
        observer.unobserve(entry.target);
      }
    });
  }, options);

  // Барлық карточкаларды бақылауға алу
  cards.forEach(function(card) {
    observer.observe(card);
  });
}

// DOM жүктелгеннен кейін іске қос
initCardObserver();


// ============================================
// 3. ЧАТҚА ХАБАРЛАМА ҚОСУ
// ============================================

/**
 * appendMessage — Чат аймағына жаңа хабарлама элементін қосады.
 * @param {string} role  - 'user' немесе 'ai' болуы тиіс
 * @param {string} text  - Хабарлама мәтіні
 */
function appendMessage(role, text) {
  const messagesEl = document.getElementById('chatMessages');

  // Жаңа хабарлама элементін жасау
  const messageDiv = document.createElement('div');
  messageDiv.classList.add('message');
  messageDiv.classList.add(role === 'user' ? 'message-user' : 'message-ai');

  const bubble = document.createElement('div');
  bubble.classList.add('message-bubble');
  bubble.textContent = text;

  messageDiv.appendChild(bubble);
  messagesEl.appendChild(messageDiv);

  // Ең төменге автоматты айналдыру
  scrollToBottom();
}


// ============================================
// 4. ЖҮКТЕЛУ АНИМАЦИЯСЫ
// ============================================

/**
 * appendLoading — ЖИ жауабы келгенше үш нүктелі анимация қосады.
 * @returns {HTMLElement} - Жасалған жүктелу элементі (кейін жою үшін)
 */
function appendLoading() {
  const messagesEl = document.getElementById('chatMessages');

  const loadingDiv = document.createElement('div');
  loadingDiv.classList.add('message', 'message-ai', 'message-loading');
  loadingDiv.id = 'loadingMessage';

  const bubble = document.createElement('div');
  bubble.classList.add('message-bubble');

  // Үш нүкте анимациясы
  for (let i = 0; i < 3; i++) {
    const dot = document.createElement('span');
    dot.classList.add('dot-anim');
    bubble.appendChild(dot);
  }

  loadingDiv.appendChild(bubble);
  messagesEl.appendChild(loadingDiv);
  scrollToBottom();

  return loadingDiv;
}

/**
 * removeLoading — Жүктелу анимациясы элементін жояды.
 */
function removeLoading() {
  const loadingEl = document.getElementById('loadingMessage');
  if (loadingEl) {
    loadingEl.remove();
  }
}


// ============================================
// 5. САНАУЫШ ЖАҢАРТУ
// ============================================

// Жіберілген сұраныстар санауышы
let requestCount = 0;

/**
 * updateCounter — Беттегі сұраныс санауышын 1-ге арттырады.
 */
function updateCounter() {
  requestCount++;
  document.getElementById('requestCount').textContent = requestCount;
}


// ============================================
// 6. АВТОМАТТЫ АЙНАЛДЫРУ
// ============================================

/**
 * scrollToBottom — Чат хабарламалары контейнерін ең төменге айналдырады.
 */
function scrollToBottom() {
  const messagesEl = document.getElementById('chatMessages');
  messagesEl.scrollTop = messagesEl.scrollHeight;
}


// ============================================
// 7. CLAUDE API-ГЕ СҰРАНЫС
// ============================================

/**
 * callClaudeAPI — Anthropic Claude API-ге POST сұраныс жібереді.
 * @param {string} userPrompt - Пайдаланушының сұрағы
 * @returns {Promise<string>}  - ЖИ жауабының мәтіні (Promise)
 *
 * ЕСКЕРТПЕ: API кілтін .env немесе серверлік жақта сақтау керек.
 * Бұл жерде тек оқу мақсатында жазылған.
 */
async function callClaudeAPI(userPrompt) {
  const API_KEY = 'YOUR_API_KEY_HERE'; // ← Мұнда өз кілтіңізді қойыңыз

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01',
      // CORS мәселесін шешу үшін прокси-сервер қажет болуы мүмкін
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({
      model: 'claude-opus-4-5',
      max_tokens: 512,
      system: 'Сен ЖИ-құралдары туралы білімді веб-әзірлеу ассистентісің. Қысқа, нақты және қазақ тілінде жауап бер.',
      messages: [
        {
          role: 'user',
          content: userPrompt
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error('API қатесі: ' + response.status);
  }

  const data = await response.json();
  return data.content[0].text;
}


// ============================================
// 8. ХАБАРЛАМА ЖІБЕРУ — БАСТЫ ФУНКЦИЯ
// ============================================

/**
 * sendMessage — Пайдаланушы хабарын оқып, API-ге жіберіп,
 * жауапты чатта көрсетеді.
 * API кілті жоқ болса — демо режимінде жұмыс жасайды.
 */
async function sendMessage() {
  const inputEl = document.getElementById('userInput');
  const sendBtn = document.getElementById('sendBtn');

  const userText = inputEl.value.trim();

  // Бос сұрақты болдырмау
  if (!userText) return;

  // Пайдаланушы хабарын чатқа қосу
  appendMessage('user', userText);
  inputEl.value = '';

  // Батырманы өшіру (екі рет басуды болдырмау)
  sendBtn.disabled = true;
  sendBtn.querySelector('.send-text').textContent = 'Жүктелуде...';

  // Жүктелу анимациясын қосу
  const loadingEl = appendLoading();

  // Санауышты жаңарту
  updateCounter();

  try {
    // Claude API-ге сұраныс жіберу
    const aiResponse = await callClaudeAPI(userText);
    removeLoading();
    appendMessage('ai', aiResponse);

  } catch (error) {
    // API кілті жоқ немесе қате болса — демо жауабы
    removeLoading();

    const demoResponses = [
      'Бұл керемет сұрақ! ЖИ-интеграциясы веб-бетті тірі етеді. API кілтін қосқаннан кейін нақты жауап аламыз.',
      'Сіздің сұрағыңыз өте қызықты. Claude API кілтін енгізіп, толыққанды чатты іске қосыңыз.',
      'ЖИ-дің болашағы - веб-тен мобильге дейін барлық жерде интеграция. API кілтіңізді қосыңыз!'
    ];

    // Кездейсоқ демо жауап
    const randomResponse = demoResponses[Math.floor(Math.random() * demoResponses.length)];
    appendMessage('ai', '[Демо режим] ' + randomResponse);
  }

  // Батырманы қайта қосу
  sendBtn.disabled = false;
  sendBtn.querySelector('.send-text').textContent = 'Жіберу';
}


// ============================================
// 9. ОҚИҒА ТЫҢДАУШЫЛАР
// ============================================

// «Жіберу» батырмасы
document.getElementById('sendBtn').addEventListener('click', sendMessage);

/**
 * Enter пернесі: Жіберу (Shift+Enter — жаңа жол)
 * @param {KeyboardEvent} event - Пернетақта оқиғасы
 */
document.getElementById('userInput').addEventListener('keydown', function(event) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault(); // Стандартты Enter мінезін болдырмау
    sendMessage();
  }
});
