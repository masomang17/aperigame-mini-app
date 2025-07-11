// --- CONFIGURAZIONE PRINCIPALE ---
const BASE_API_URL = 'https://script.google.com/macros/s/AKfycbzrL9TQ1hl8BuQputW-GhAG0C_3GuTpI7SCU8SAD-_oQZ49_xUl1uhcCOCY2FBkPSOKIg/exec'; // Mantieni il tuo URL
const IMAGE_BASE_URL = 'https://raw.githubusercontent.com/masomang17/aperigame-mini-app/main/miniapp/images/'; // Mantieni il tuo URL

// --- TRADUZIONI (con nuove voci per la fine del quiz) ---
const translations = {
    it: {
        quiz: "Quiz", tip: "Consigli", profile: "Profilo", shop: "Premi", play: "Gioca Ora",
        user: "Utente", noStars: "0", prizeReq: "Riscatta", prizeCost: "Costo:",
        notEnoughStars: "Non hai abbastanza stelle per questo premio.",
        prizeSuccess: "Premio '{prizeTitle}' richiesto con successo!",
        // Voci Quiz
        quizPrizeText: "Premio per il quiz: ", quizExit: "Esci dal quiz",
        quizScore: "Hai totalizzato", quizPoints: "punti",
        quizTimeUp: "Tempo scaduto! Risposta considerata errata.",
        quizNext: "Domanda successiva", quizFinish: "Quiz Terminato!",
        loadingQuiz: "Caricamento quiz...", quizLoadError: "Errore caricamento quiz.",
        quizDataMissing: "Dati quiz non disponibili.", answerRecorded: "Risposta registrata.",
        // Nuove voci per la schermata dei risultati
        summaryTitle: "Riepilogo Partita",
        correctAnswers: "Risposte Corrette",
        wrongAnswers: "Risposte Errate",
        finalScore: "Punteggio Ottenuto",
        leaderboardPosition: "Posizione in Classifica",
    }
};

// --- STATO DELL'APPLICAZIONE (con nuove variabili di stato per il quiz) ---
let currentLang = 'it';
let telegramUserId = null, username = "User", telegramFirstName = null, telegramLastName = null;
let shopItems = [], userProfile = { stars: 0 };
let quizConfig = { questions: {}, titles: {}, prize: "Buono da 5€" };
let quizState = {
    currentIndex: 0, score: 0, timer: null, timeLeft: 0, timePerQuestion: 15,
    answeringAllowed: true, currentQuizSheet: null,
    // Nuove variabili per contare le risposte
    correctCount: 0, incorrectCount: 0
};

// --- INIZIALIZZAZIONE ---
document.addEventListener("DOMContentLoaded", () => { /* ... codice invariato ... */ });

// --- FUNZIONI DI CARICAMENTO DATI ---
async function loadInitialData() { /* ... codice invariato ... */ }
async function sendDataToScript(data) { /* ... codice invariato ... */ }

// --- FUNZIONI DI RENDERING UI ---
function renderAll() { /* ... codice invariato ... */ }
function showSection(sectionId) { /* ... codice invariato ... */ }
function renderQuizPage() { /* ... codice invariato ... */ }
function renderTipPage() { /* ... codice invariato ... */ }
function createPlayCard(containerId, titleKey, quizSheet) { /* ... codice invariato ... */ }
function renderProfile() { /* ... codice invariato ... */ }
function renderShop() { /* ... codice invariato ... */ }
async function requestPrize(prizeId, prizeCost, button) { /* ... codice invariato ... */ }

// --- LOGICA DEL QUIZ (MODIFICATA) ---

async function playQuiz(quizSheet, buttonElement) {
    // ... (Logica per avviare il quiz e caricare i dati) ...
    // --- RESET DELLO STATO ---
    quizState.currentIndex = 0;
    quizState.score = 0;
    quizState.correctCount = 0;
    quizState.incorrectCount = 0;
    quizState.currentQuizSheet = quizSheet;
    showQuizQuestion();
}

async function loadQuizData(quizSheet, buttonElement) { /* ... codice invariato ... */ }

function showQuizQuestion() {
  const questions = quizConfig.questions[quizState.currentQuizSheet]?.[currentLang] || [];
  if (quizState.currentIndex >= questions.length) {
      return endQuizSequence();
  }
  const q = questions[quizState.currentIndex];
  clearInterval(quizState.timer);

  const containerId = quizState.currentQuizSheet === 'quiz' ? 'quiz-content' : 'tip-content';
  const container = document.getElementById(containerId);
  container.innerHTML = `<div class="quiz-container"><h3>${quizConfig.titles[quizState.currentQuizSheet]?.[currentLang] || "Quiz"}</h3><p><strong>${translations[currentLang].quizPrizeText}</strong> ${quizConfig.prize}</p>${q.imageUrl ? `<img src="${IMAGE_BASE_URL}${q.imageUrl}" alt="Immagine Quiz" class="quiz-image">` : ''}<div id="quiz-timer" class="quiz-timer"></div><p><strong>${q.question}</strong></p><div id="quiz-answers" class="quiz-answers"></div><button id="quiz-exit" class="play-btn">${translations[currentLang].quizExit}</button></div>`;

  document.getElementById("quiz-exit").addEventListener('click', () => { clearInterval(quizState.timer); showQuizResult(true); });
  const answersDiv = document.getElementById("quiz-answers");
  q.answers.forEach((ans, i) => {
      const btn = document.createElement("button");
      btn.textContent = ans;
      btn.className = "btn-quiz";
      btn.addEventListener('click', () => handleAnswer(i));
      answersDiv.appendChild(btn);
  });

  quizState.timeLeft = q.timer;
  quizState.answeringAllowed = true;
  updateTimerUI();
  quizState.timer = setInterval(() => {
      quizState.timeLeft--;
      updateTimerUI();
      if (quizState.timeLeft <= 0) {
          clearInterval(quizState.timer);
          if (quizState.answeringAllowed) {
              alert(translations[currentLang].quizTimeUp);
              // --- CORREZIONE QUI ---
              // Chiama handleAnswer con un indice non valido per registrarla come errata
              handleAnswer(-1);
          }
      }
  }, 1000);
}

function handleAnswer(selectedIndex) {
    if (!quizState.answeringAllowed) return;
    quizState.answeringAllowed = false;
    clearInterval(quizState.timer);
    const q = quizConfig.questions[quizState.currentQuizSheet][currentLang][quizState.currentIndex];
    const buttons = document.querySelectorAll("#quiz-answers button");
    buttons.forEach(btn => btn.disabled = true);

    const isCorrect = selectedIndex === q.correctIndex;

    if (isCorrect) {
        quizState.score += q.points || 0;
        quizState.correctCount++;
        buttons[selectedIndex].classList.add('btn-correct');
    } else {
        quizState.incorrectCount++;
        if (selectedIndex !== -1) { // Se non è timeout
            buttons[selectedIndex].classList.add('btn-wrong');
        }
        if (q.correctIndex >= 0) {
            buttons[q.correctIndex].classList.add('btn-correct');
        }
    }
    
    setTimeout(() => {
        quizState.currentIndex++;
        showQuizQuestion();
    }, 2000); // Aumentato il timeout per dare tempo di vedere la risposta
}

async function endQuizSequence() {
    // Mostra un messaggio di attesa mentre contatta il backend
    const containerId = quizState.currentQuizSheet === 'quiz' ? 'quiz-content' : 'tip-content';
    const container = document.getElementById(containerId);
    container.innerHTML = `<div class="quiz-container"><h3>${translations[currentLang].quizFinish}</h3><p>Salvataggio e calcolo classifica...</p></div>`;

    const questions = quizConfig.questions[quizState.currentQuizSheet]?.[currentLang] || [];
    
    const result = await sendDataToScript({
        action: 'submitQuiz',
        userId: telegramUserId,
        username: username,
        firstName: telegramFirstName,
        lastName: telegramLastName,
        quizName: quizState.currentQuizSheet,
        score: quizState.score,
        correctCount: quizState.correctCount,
        incorrectCount: quizState.incorrectCount,
        totalQuestions: questions.length
    });

    if (result.status === 'success') {
        showQuizResult(result.data);
    } else {
        alert("Errore nel salvataggio del risultato: " + result.message);
    }
}

function showQuizResult(backendData) {
    const containerId = quizState.currentQuizSheet === 'quiz' ? 'quiz-content' : 'tip-content';
    const container = document.getElementById(containerId);

    let rankChangeHtml = '';
    if (backendData.rankChange === 'up') {
        rankChangeHtml = '<span class="rank-up">▲</span>';
    } else if (backendData.rankChange === 'down') {
        rankChangeHtml = '<span class="rank-down">▼</span>';
    } else {
        rankChangeHtml = '<span class="rank-same">▬</span>';
    }
    
    const questions = quizConfig.questions[quizState.currentQuizSheet]?.[currentLang] || [];

    container.innerHTML = `
        <div class="quiz-container result-summary">
            <h3>${translations[currentLang].summaryTitle}</h3>
            <p>${translations[currentLang].correctAnswers}: ${quizState.correctCount} / ${questions.length}</p>
            <p>${translations[currentLang].wrongAnswers}: ${quizState.incorrectCount} / ${questions.length}</p>
            <p><strong>${translations[currentLang].finalScore}: ${quizState.score} ${translations[currentLang].quizPoints}</strong></p>
            <hr>
            <p><strong>${translations[currentLang].leaderboardPosition}: ${backendData.newRank}° ${rankChangeHtml}</strong></p>
            <button id="return-btn" class="play-btn">${translations[currentLang].quizExit}</button>
        </div>
    `;

    const returnSection = quizState.currentQuizSheet;
    document.getElementById('return-btn').addEventListener('click', () => showSection(returnSection));
    quizState.currentQuizSheet = null; // Resetta per il prossimo quiz
}

function updateTimerUI() { /* ... codice invariato ... */ }
