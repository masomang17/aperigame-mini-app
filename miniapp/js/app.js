// js/app.js

// *** IL TUO URL DI DEPLOYMENT ESATTO DEL GOOGLE APPS SCRIPT ***
const BASE_QUIZ_SHEET_URL = 'https://script.google.com/macros/s/AKfycbzIl0NH1EoSZydPjeBpZj1c7Y9hFjZPLOkhymNvZpPcRip5eMXXzX0M3GbDjMCGqhic3w/exec';

// FIX 1: Dichiarare e inizializzare 'currentLang' con un valore di default.
let currentLang = 'it'; 

const translations = {
    it: {
        // ... (il tuo oggetto translations rimane invariato)
    },
    en: {
        // ... (il tuo oggetto translations rimane invariato)
    },
    es: {
        // ... (il tuo oggetto translations rimane invariato)
    }
};

// Variabili per l'utente Telegram
let telegramUserId = null;
let telegramUsername = null;
let telegramFirstName = null;
let telegramLastName = null;
// FIX 2: Dichiarare la variabile 'username'
let username = "Utente"; // Valore di fallback

// Inizializzazione dell'SDK di Telegram Web App
if (window.Telegram && window.Telegram.WebApp) {
    Telegram.WebApp.ready();
    telegramUserId = Telegram.WebApp.initDataUnsafe.user?.id || null;
    telegramUsername = Telegram.WebApp.initDataUnsafe.user?.username || null;
    telegramFirstName = Telegram.WebApp.initDataUnsafe.user?.first_name || null;
    telegramLastName = Telegram.WebApp.initDataUnsafe.user?.last_name || null;
    
    // Aggiorna il nome utente visualizzato nel profilo
    if (telegramUsername) {
        username = `@${telegramUsername}`;
    } else if (telegramFirstName) {
        username = telegramFirstName;
        if (telegramLastName) {
            username += ` ${telegramLastName}`;
        }
    } else {
        username = "Utente Telegram";
    }
} else {
    console.warn("Telegram WebApp SDK non disponibile. Usando dati di test.");
    telegramUserId = "test_user_123";
    username = "TestUser";
    telegramFirstName = "Test";
    telegramLastName = "User";
}

let starsCount = 0;

// Definizione dei giochi (invariato)
const games = [
    { id: 1, title: { it: "Memory", en: "Memory", es: "Memoria" }, starsReward: 5, type: "static" },
    { id: 2, title: { it: "Quiz Generale", en: "General Quiz", es: "Quiz General" }, starsReward: 0, type: "quiz", quizSheet: "quiz" },
    { id: 3, title: { it: "Puzzle", en: "Puzzle", es: "Rompecabezas" }, starsReward: 4, type: "static" },
    { id: 4, title: { it: "Quiz Storia", en: "History Quiz", es: "Quiz Historia" }, starsReward: 0, type: "quiz", quizSheet: "Quiz Storia" },
    { id: 5, title: { it: "Quiz delle Categorie", en: "Categories Quiz", es: "Quiz de Categorías" }, starsReward: 0, type: "quiz", quizSheet: "tip" },
];

const prizes = [ /* ... (invariato) ... */ ];
let quizConfig = { /* ... (invariato) ... */ };
let quizState = { /* ... (invariato) ... */ };

// --- Funzioni UI Generali ---

function showSection(sectionId) {
    // ... (funzione invariata)
}

function renderGames() {
    const container = document.getElementById("games-list");
    container.innerHTML = "";
    document.querySelector("#home h2").textContent = translations[currentLang].games;

    games.forEach(game => {
        const card = document.createElement("div");
        card.className = "game-card";
        
        const titleDiv = document.createElement("div");
        titleDiv.className = "game-title";
        titleDiv.textContent = game.title[currentLang];
        card.appendChild(titleDiv);

        const playButton = document.createElement("button");
        playButton.className = "play-btn";
        playButton.textContent = translations[currentLang].play;

        if (game.type === 'quiz') {
            // FIX 3 (Parte A): Aggiungere un data-attribute per identificare il pulsante del quiz
            playButton.dataset.quizSheet = game.quizSheet; 
            playButton.addEventListener('click', () => playQuiz(game.quizSheet));
        } else {
            playButton.addEventListener('click', () => playGame(game.id));
        }
        card.appendChild(playButton);
        
        container.appendChild(card);
    });
}

function renderProfile() { /* ... (invariato) ... */ }
function renderPrizes() { /* ... (invariato) ... */ }
function playGame(gameId) { /* ... (invariato) ... */ }
function requestPrize(prizeId) { /* ... (invariato) ... */ }


// --- Funzioni Quiz ---
async function loadAndProcessQuizData(quizSheet) {
    // FIX 3 (Parte B): Usare il data-attribute per trovare il pulsante corretto
    const gameButton = document.querySelector(`button[data-quiz-sheet="${quizSheet}"]`);
    if (gameButton) {
        gameButton.textContent = translations[currentLang].loadingQuiz;
        gameButton.disabled = true;
    }

    // ... (resto della funzione 'loadAndProcessQuizData' è invariato)
    try {
        const response = await fetch(`${BASE_QUIZ_SHEET_URL}?quiz_name=${encodeURIComponent(quizSheet)}`);
        if (!response.ok) {
            throw new Error(`Errore di rete: ${response.statusText} (${response.status})`);
        }
        const rawData = await response.json();

        if (rawData.error) {
            throw new Error(`Errore da Google Apps Script: ${rawData.error}`);
        }

        if (!quizConfig.questions[quizSheet]) {
            quizConfig.questions[quizSheet] = {};
            quizConfig.titles[quizSheet] = {};
        }

        const groupedQuestions = {};
        rawData.forEach(item => {
            const lang = item.lang;
            if (!groupedQuestions[lang]) groupedQuestions[lang] = [];
            const questionText = String(item.question || '').toLowerCase().trim();

            if (questionText === "title") {
                quizConfig.titles[quizSheet][lang] = item.answer_1;
            } else if (questionText === "prize") {
                quizConfig.prize = String(item.answer_1 || '').trim() !== "" ? item.answer_1 : quizConfig.prize;
            } else {
                const answers = [item.answer_1, item.answer_2, item.answer_3, item.answer_4].filter(a => a && String(a).trim() !== "");
                const correctIdx = parseInt(item.correct_index, 10);
                const timerSec = parseInt(item.time_sec, 10);

                groupedQuestions[lang].push({
                    question: item.question,
                    answers: answers,
                    correctIndex: !isNaN(correctIdx) && correctIdx >= 0 && correctIdx <= answers.length ? correctIdx - 1 : 0,
                    points: parseInt(item.points, 10) || 0,
                    timer: !isNaN(timerSec) && timerSec > 0 ? timerSec : quizState.timePerQuestion,
                    imageUrl: item.image_url || null,
                    explanation: item.explanation || null,
                    difficulty: item.difficulty || null
                });
            }
        });
        quizConfig.questions[quizSheet] = groupedQuestions;
        console.log(`Dati quiz '${quizSheet}' caricati con successo.`, quizConfig.questions[quizSheet]);

    } catch (error) {
        console.error(`Errore durante il caricamento o elaborazione del quiz '${quizSheet}':`, error);
        alert(translations[currentLang].quizLoadError);
        throw error;
    } finally {
        if (gameButton) {
            gameButton.textContent = translations[currentLang].play;
            gameButton.disabled = false;
        }
    }
}


// Tutte le funzioni rimanenti (playQuiz, showQuizQuestion, ecc.) sono invariate.
async function playQuiz(quizSheet) { /* ... (invariato) ... */ }
function showQuizQuestion() { /* ... (invariato) ... */ }
function updateTimerUI() { /* ... (invariato) ... */ }
function handleAnswer(selectedIndex) { /* ... (invariato) ... */ }
function highlightAnswer(index, className) { /* ... (invariato) ... */ }
function nextQuizQuestion() { /* ... (invariato) ... */ }
function showQuizResult(exitedEarly = false) { /* ... (invariato) ... */ }
async function sendDataToScript(data) { /* ... (invariato) ... */ }
async function submitAnswerData(...) { /* ... (invariato) ... */ }
async function submitQuizResult(...) { /* ... (invariato) ... */ }


// --- Event Listeners e Inizializzazione ---

document.addEventListener("DOMContentLoaded", () => {
    // Assicura che il menu a tendina della lingua rifletta lo stato iniziale
    document.getElementById("lang-select").value = currentLang;

    document.querySelectorAll(".btn-nav").forEach(btn => {
        btn.addEventListener("click", () => showSection(btn.dataset.section));
    });

    document.getElementById("lang-select").addEventListener("change", (e) => {
        currentLang = e.target.value;
        renderAll();
    });

    renderAll(); // Avvia l'app
});

function renderAll() {
    document.querySelectorAll(".btn-nav").forEach(btn => {
        btn.textContent = translations[currentLang][btn.dataset.section];
    });
    
    const activeSection = document.querySelector(".section.active")?.id || "home";
    showSection(activeSection);
}
