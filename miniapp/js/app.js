// VERSIONE DEFINITIVA - 12 LUGLIO 2025
const BASE_API_URL = 'https://script.google.com/macros/s/AKfycbz263cFtmATaZqWq2SWcSnb2a_TOW7sKAzyC-MavWV_IVNYUoc47JG18TuBSuKJJO6tVg/exec'; // **USA IL TUO ULTIMO URL**
const IMAGE_BASE_URL = 'https://raw.githubusercontent.com/masomang17/aperigame-mini-app/main/miniapp/images/';

// --- TRADUZIONI ---
const translations = {
    it: { quiz: "Quiz", pronostici: "Pronostici", profile: "Profilo", negozio: "Negozio", play: "Gioca Ora", user: "Utente", prizeReq: "Acquista", notEnoughStars: "Stelle insufficienti.", prizeSuccess: "Acquisto completato!", quizExit: "Esci", quizFinish: "Quiz Terminato!", loadingQuiz: "Caricamento...", quizLoadError: "Errore caricamento.", quizDataMissing: "Nessun quiz disponibile.", summaryTitle: "Riepilogo", correctAnswers: "Corrette", wrongAnswers: "Errate", finalScore: "Punteggio", leaderboardPosition: "Classifica" },
    en: { quiz: "Quiz", pronostici: "Predictions", profile: "Profile", negozio: "Shop", play: "Play Now", user: "User", prizeReq: "Purchase", notEnoughStars: "Not enough stars.", prizeSuccess: "Purchase complete!", quizExit: "Exit", quizFinish: "Quiz Finished!", loadingQuiz: "Loading...", quizLoadError: "Loading error.", quizDataMissing: "No quiz available.", summaryTitle: "Summary", correctAnswers: "Correct", wrongAnswers: "Wrong", finalScore: "Score", leaderboardPosition: "Rank" },
    es: { quiz: "Quiz", pronostici: "Pronósticos", profile: "Perfil", negozio: "Tienda", play: "Jugar Ahora", user: "Usuario", prizeReq: "Comprar", notEnoughStars: "Estrellas insuficientes.", prizeSuccess: "¡Compra completa!", quizExit: "Salir", quizFinish: "¡Fin del quiz!", loadingQuiz: "Cargando...", quizLoadError: "Error al cargar.", quizDataMissing: "Ningún quiz disponible.", summaryTitle: "Resumen", correctAnswers: "Correctas", wrongAnswers: "Incorrectas", finalScore: "Puntuación", leaderboardPosition: "Clasificación" }
};

// --- STATO ---
let currentLang = 'it';
let telegramUserId = null, username = "User", telegramFirstName = null, telegramLastName = null;
let negozioItems = [], userProfile = { stars: 0, punti: 0, posizione: 'N/D' };
let quizConfig = { questions: [] };
let quizState = { currentIndex: 0, score: 0, timer: null, timeLeft: 15, answeringAllowed: true, currentQuizSheet: null, correctCount: 0, incorrectCount: 0 };

// --- INIZIALIZZAZIONE ---
document.addEventListener("DOMContentLoaded", () => {
    if (window.Telegram && window.Telegram.WebApp) {
        Telegram.WebApp.ready();
        const user = Telegram.WebApp.initDataUnsafe?.user;
        if (user) {
            telegramUserId = user.id;
            telegramFirstName = user.first_name;
            telegramLastName = user.last_name;
            username = user.username ? `@${user.username}` : `${user.first_name || ''} ${user.last_name || ''}`.trim();
        }
    } else {
        console.warn("SDK non disponibile.");
        telegramUserId = "test_user_123"; username = "TestUser";
    }
    document.querySelectorAll(".btn-nav").forEach(btn => btn.addEventListener("click", () => showSection(btn.dataset.section)));
    document.getElementById("lang-select").addEventListener("change", (e) => { currentLang = e.target.value; loadInitialData(); });
    loadInitialData();
});

// --- FUNZIONI DATI ---
async function loadInitialData() {
    renderAllUI(); 
    if (!telegramUserId) return;
    try {
        const [profileRes, shopRes] = await Promise.all([
            fetch(`${BASE_API_URL}?action=getProfile&userId=${telegramUserId}`),
            fetch(`${BASE_API_URL}?action=getNegozioItems&lang=${currentLang}`)
        ]);
        const profileData = await profileRes.json();
        if (profileData.status === 'success') userProfile = profileData.data;
        const shopData = await shopRes.json();
        if (shopData.status === 'success') negozioItems = shopData.data;
    } catch (error) { console.error("Errore caricamento dati:", error); }
    finally { showSection(document.querySelector(".section.active")?.id || 'quiz'); }
}

async function sendDataToScript(data) {
    try {
        const response = await fetch(BASE_API_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(data), mode: 'cors' });
        return await response.json();
    } catch (error) {
        console.error(`Errore invio dati (Action: ${data.action}):`, error);
        return { status: "error", message: error.message };
    }
}

// --- FUNZIONI UI ---
function renderAllUI() {
    document.querySelectorAll(".btn-nav").forEach(btn => {
        btn.textContent = translations[currentLang]?.[btn.dataset.section] || btn.dataset.section;
    });
}

function showSection(sectionId) {
    document.querySelectorAll(".section").forEach(sec => sec.classList.remove("active"));
    document.getElementById(sectionId)?.classList.add("active");
    document.querySelectorAll(".btn-nav").forEach(btn => btn.classList.toggle("active", btn.dataset.section === sectionId));
    const renderMap = { quiz: renderQuizPage, pronostici: renderPronosticiPage, profile: renderProfile, negozio: renderNegozioPage };
    renderMap[sectionId]?.();
}

function renderQuizPage() {
    document.querySelector("#quiz h2").textContent = translations[currentLang].quiz;
    createPlayCard('quiz-content', 'quiz', 'quiz');
}

function renderPronosticiPage() {
    document.querySelector("#pronostici h2").textContent = translations[currentLang].pronostici;
    createPlayCard('pronostici-content', 'pronostici', 'pronostici');
}

function createPlayCard(containerId, titleKey, quizSheet) {
    const container = document.getElementById(containerId);
    container.innerHTML = `<div class="game-card" id="play-card-${quizSheet}"><div class="game-title">${translations[currentLang][titleKey]}</div><button class="play-btn">${translations[currentLang].play}</button></div>`;
    container.querySelector('.play-btn').addEventListener('click', (event) => playQuiz(quizSheet, event.target));
}

function renderProfile() {
    document.querySelector("#profile h2").textContent = "Profilo";
    document.getElementById("profile-user").textContent = userProfile.username || username;
    document.getElementById("profile-rank").textContent = userProfile.posizione ? `${userProfile.posizione}°` : 'N/D';
    document.getElementById("profile-score").textContent = userProfile.punti || 0;
    document.getElementById("stars-count").textContent = userProfile.stars || 0;
}

function renderNegozioPage() {
    document.querySelector("#negozio h2").textContent = "Negozio";
    const container = document.getElementById("negozio-list");
    container.innerHTML = "";
    if (!negozioItems || negozioItems.length === 0) {
        container.innerHTML = `<p>Nessun prodotto disponibile.</p>`;
        return;
    }
    negozioItems.forEach(item => {
        const card = document.createElement("div");
        card.className = "prize-card";
        card.innerHTML = `<img src="${IMAGE_BASE_URL}${item.url_immagine}" class="prize-image" onerror="this.style.display='none'"><div class="prize-title">${item.titolo}</div><p class="prize-description">${item.descrizione || ''}</p><p class="prize-cost">⭐ ${item.prezzo_stars}</p><button class="play-btn">${translations[currentLang].prizeReq}</button>`;
        card.querySelector('.play-btn').addEventListener('click', (event) => purchaseItem(item, event.target));
    });
}

async function purchaseItem(item, button) {
    if (userProfile.stars < item.prezzo_stars) return alert(translations[currentLang].notEnoughStars);
    button.disabled = true;
    const result = await sendDataToScript({ action: 'purchaseItem', userId: telegramUserId, username: username, firstName: telegramFirstName, lastName: telegramLastName, id_prodotto: item.id_prodotto, titolo: item.titolo, prezzo_stars: item.prezzo_stars });
    if (result?.status === 'success') {
        userProfile.stars = result.data.newStars;
        renderProfile();
        alert(translations[currentLang].prizeSuccess);
    } else {
        alert(result.message || "Errore.");
    }
    button.disabled = false;
}

// --- LOGICA QUIZ ---
async function playQuiz(quizSheet, buttonElement) {
    document.getElementById(`play-card-${quizSheet}`)?.style.setProperty('display', 'none');
    try {
        await loadQuizData(quizSheet, buttonElement);
    } catch (e) {
        document.getElementById(`play-card-${quizSheet}`)?.style.setProperty('display', 'flex');
        return;
    }
    const questions = quizConfig.questions;
    if (!questions || questions.length === 0) {
        alert(translations[currentLang].quizDataMissing);
        document.getElementById(`play-card-${quizSheet}`)?.style.setProperty('display', 'flex');
        return;
    }
    Object.assign(quizState, { currentIndex: 0, score: 0, correctCount: 0, incorrectCount: 0, currentQuizSheet: quizSheet });
    showQuizQuestion();
}

async function loadQuizData(quizSheet, buttonElement) {
    if (buttonElement) {
        buttonElement.textContent = translations[currentLang].loadingQuiz;
        buttonElement.disabled = true;
    }
    try {
        const response = await fetch(`${BASE_API_URL}?action=getQuiz&quiz_name=${quizSheet}&lang=${currentLang}`);
        const result = await response.json();
        if (result.status !== 'success') throw new Error(result.message);
        quizConfig.questions = result.data.questions;
    } catch (error) {
        console.error("Errore caricamento quiz:", error);
        alert(translations[currentLang].quizLoadError + " " + error.message);
        throw error;
    } finally {
        if (buttonElement) {
            buttonElement.textContent = translations[currentLang].play;
            buttonElement.disabled = false;
        }
    }
}

function showQuizQuestion() {
    const questions = quizConfig.questions;
    if (quizState.currentIndex >= questions.length) return endQuizSequence();
    const q = questions[quizState.currentIndex];
    clearInterval(quizState.timer);
    const containerId = quizState.currentQuizSheet === 'quiz' ? 'quiz-content' : 'pronostici-content';
    const container = document.getElementById(containerId);
    container.innerHTML = `<div class="quiz-container"><h3>${quizConfig.title || ''}</h3><img src="${IMAGE_BASE_URL}${q.url_immagine}" class="quiz-image" onerror="this.style.display='none'"><div id="quiz-timer"></div><p><strong>${q.domanda}</strong></p><div id="quiz-answers"></div><button id="quiz-exit-btn" class="play-btn">${translations[currentLang].quizExit}</button></div>`;
    document.getElementById("quiz-exit-btn").addEventListener('click', endQuizSequence);
    const answersDiv = document.getElementById("quiz-answers");
    q.risposte.forEach((ans, i) => {
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
            if (quizState.answeringAllowed) { alert(translations[currentLang].quizTimeUp); handleAnswer(-1); }
        }
    }, 1000);
}

function handleAnswer(selectedIndex) {
    if (!quizState.answeringAllowed) return;
    quizState.answeringAllowed = false;
    clearInterval(quizState.timer);
    const q = quizConfig.questions[quizState.currentIndex];
    const buttons = document.querySelectorAll("#quiz-answers button");
    buttons.forEach(btn => btn.disabled = true);
    const isCorrect = selectedIndex === q.indice_corretto;
    if (isCorrect) {
        quizState.score += q.punti || 0;
        quizState.correctCount++;
        buttons[selectedIndex].classList.add('btn-correct');
    } else {
        quizState.incorrectCount++;
        if (selectedIndex !== -1) buttons[selectedIndex].classList.add('btn-wrong');
        if (q.indice_corretto >= 0 && q.indice_corretto < buttons.length) buttons[q.indice_corretto].classList.add('btn-correct');
    }
    setTimeout(() => { quizState.currentIndex++; showQuizQuestion(); }, 2000);
}

async function endQuizSequence() {
    clearInterval(quizState.timer);
    const containerId = quizState.currentQuizSheet === 'quiz' ? 'quiz-content' : 'pronostici-content';
    const container = document.getElementById(containerId);
    container.innerHTML = `<div class="quiz-container"><h3>${translations[currentLang].quizFinish}</h3><p>${translations[currentLang].loadingQuiz}</p></div>`;
    const result = await sendDataToScript({ action: 'submitQuiz', userId: telegramUserId, username: username, firstName: telegramFirstName, lastName: telegramLastName, quizName: quizState.currentQuizSheet, score: quizState.score, correctCount: quizState.correctCount, incorrectCount: quizState.incorrectCount, totalQuestions: quizConfig.questions.length });
    if (result.status === 'success') {
        showQuizResult(result.data);
        loadInitialData(); 
    } else {
        alert("Errore salvataggio risultato: " + (result.message || 'Errore'));
        showSection(quizState.currentQuizSheet);
    }
}

function showQuizResult(backendData) {
    const containerId = quizState.currentQuizSheet === 'quiz' ? 'quiz-content' : 'pronostici-content';
    const container = document.getElementById(containerId);
    container.innerHTML = `<div class="quiz-container result-summary"><h3>${translations[currentLang].summaryTitle}</h3><p>${translations[currentLang].correctAnswers}: ${quizState.correctCount}/${quizConfig.questions.length}</p><p>${translations[currentLang].wrongAnswers}: ${quizState.incorrectCount}/${quizConfig.questions.length}</p><p><strong>${translations[currentLang].finalScore}: ${quizState.score}</strong></p><hr><p><strong>${translations[currentLang].leaderboardPosition}: ${backendData.newRank}°</strong></p><button id="return-btn" class="play-btn">${translations[currentLang].quizExit}</button></div>`;
    const returnSection = quizState.currentQuizSheet;
    document.getElementById('return-btn').addEventListener('click', () => showSection(returnSection));
    quizState.currentQuizSheet = null;
}

function updateTimerUI() {
    const timerDiv = document.getElementById("quiz-timer");
    if (timerDiv) timerDiv.textContent = `⏳ ${quizState.timeLeft}s`;
}
