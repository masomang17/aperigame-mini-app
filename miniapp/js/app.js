// --- CONFIGURAZIONE PRINCIPALE ---
const BASE_API_URL = 'https://script.google.com/macros/s/AKfycbz263cFtmATaZqWq2SWcSnb2a_TOW7sKAzyC-MavWV_IVNYUoc47JG18TuBSuKJJO6tVg/exec';
const IMAGE_BASE_URL = 'https://raw.githubusercontent.com/masomang17/aperigame-mini-app/main/miniapp/images/';

// --- TRADUZIONI (per l'interfaccia statica) ---
const translations = {
    it: {
        quiz: "Quiz", pronostici: "Pronostici", profile: "Profilo", shop: "Negozio", play: "Gioca Ora",
        user: "Utente", noStars: "0", prizeReq: "Riscatta", prizeCost: "Costo:",
        notEnoughStars: "Non hai abbastanza stelle.", prizeSuccess: "Premio '{prizeTitle}' richiesto!",
        quizPrizeText: "Premio per il quiz: ", quizExit: "Esci", quizScore: "Hai totalizzato",
        quizPoints: "punti", quizTimeUp: "Tempo scaduto!", quizFinish: "Quiz Terminato!",
        loadingQuiz: "Caricamento...", quizLoadError: "Errore caricamento quiz.",
        quizDataMissing: "Nessun quiz disponibile.", summaryTitle: "Riepilogo Partita",
        correctAnswers: "Corrette", wrongAnswers: "Errate", finalScore: "Punteggio",
        leaderboardPosition: "Classifica",
    }
};

// --- STATO DELL'APPLICAZIONE ---
let currentLang = 'it';
let telegramUserId = null, username = "User", telegramFirstName = null, telegramLastName = null;
let shopItems = [], userProfile = { stars: 0, totalScore: 0, posizione: 'N/D' };
let quizConfig = { questions: [], title: "", prize: "" };
let quizState = {
    currentIndex: 0, score: 0, timer: null, timeLeft: 0, timePerQuestion: 15,
    answeringAllowed: true, currentQuizSheet: null, correctCount: 0, incorrectCount: 0
};

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
        console.warn("SDK non disponibile. Uso dati di test.");
        telegramUserId = "test_user_123"; username = "TestUser";
    }
    document.querySelectorAll(".btn-nav").forEach(btn => btn.addEventListener("click", () => showSection(btn.dataset.section)));
    document.getElementById("lang-select").addEventListener("change", (e) => { currentLang = e.target.value; renderAllUI(); });
    loadInitialData();
});

// --- FUNZIONI DI CARICAMENTO DATI ---
async function loadInitialData() {
    renderAllUI();
    if (!telegramUserId) return;
    try {
        const [profileRes, shopRes] = await Promise.all([
            fetch(`${BASE_API_URL}?action=getProfile&userId=${telegramUserId}`),
            fetch(`${BASE_API_URL}?action=getShopItems`)
        ]);
        const profileData = await profileRes.json();
        if (profileData.status === 'success') userProfile = profileData.data;
        const shopData = await shopRes.json();
        if (shopData.status === 'success') shopItems = shopData.data;
    } catch (error) {
        console.error("Errore caricamento dati:", error);
    } finally {
        showSection(document.querySelector(".section.active")?.id || 'quiz');
    }
}

async function sendDataToScript(data) {
    try {
        const response = await fetch(BASE_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(data),
            mode: 'cors'
        });
        return await response.json();
    } catch (error) {
        console.error(`Errore invio dati (Action: ${data.action}):`, error);
        return { status: "error", message: error.message };
    }
}

// --- FUNZIONI DI RENDERING UI ---
function renderAllUI() {
    document.querySelectorAll(".btn-nav").forEach(btn => {
        btn.textContent = translations[currentLang]?.[btn.dataset.section] || btn.dataset.section;
    });
}

function showSection(sectionId) {
    document.querySelectorAll(".section").forEach(sec => sec.classList.remove("active"));
    document.getElementById(sectionId)?.classList.add("active");
    document.querySelectorAll(".btn-nav").forEach(btn => btn.classList.toggle("active", btn.dataset.section === sectionId));
    const renderMap = {
        quiz: renderQuizPage,
        pronostici: renderPronosticiPage,
        profile: renderProfile,
        shop: renderShop
    };
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
    document.querySelector("#profile h2").textContent = translations[currentLang].profile;
    document.getElementById("profile-user").textContent = userProfile.username || username;
    document.getElementById("profile-rank").textContent = userProfile.posizione ? `${userProfile.posizione}°` : 'N/D';
    document.getElementById("profile-score").textContent = userProfile.totalScore || 0;
    document.getElementById("stars-count").textContent = userProfile.stars || 0;
}

function renderShop() {
    document.querySelector("#shop h2").textContent = translations[currentLang].shop;
    const container = document.getElementById("shop-list");
    container.innerHTML = "";
    if (!shopItems || shopItems.length === 0) {
        container.innerHTML = `<p>Nessun premio disponibile.</p>`;
        return;
    }
    shopItems.forEach(prize => {
        const card = document.createElement("div");
        card.className = "prize-card";
        card.innerHTML = `<div class="prize-title">${prize.titolo}</div><p>${translations[currentLang].prizeCost} ⭐ ${prize.costo}</p><button class="play-btn">${translations[currentLang].prizeReq}</button>`;
        card.querySelector('.play-btn').addEventListener('click', (event) => requestPrize(prize.id_premio, prize.costo, event.target));
        container.appendChild(card);
    });
}

async function requestPrize(prizeId, prizeCost, button) {
    if (userProfile.stars < prizeCost) return alert(translations[currentLang].notEnoughStars);
    button.disabled = true;
    const result = await sendDataToScript({
        action: 'redeemPrize', userId: telegramUserId, username: username,
        prizeId: prizeId, prizeCost: prizeCost
    });
    if (result?.status === 'success') {
        userProfile.stars = result.data.newStars;
        renderProfile();
        alert(translations[currentLang].prizeSuccess.replace('{prizeTitle}', result.data.prizeTitle));
    } else {
        alert(result.message || "Errore.");
    }
    button.disabled = false;
}

// --- LOGICA DEL QUIZ ---
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
        const response = await fetch(`${BASE_API_URL}?action=getQuiz&quiz_name=${quizSheet}`);
        const result = await response.json();
        if (result.status !== 'success') throw new Error(result.message);
        Object.assign(quizConfig, { questions: result.data.questions, title: result.data.title, prize: result.data.prize });
    } catch (error) {
        console.error("Errore caricamento quiz:", error);
        alert(translations[currentLang].quizLoadError);
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
    container.innerHTML = `<div class="quiz-container"><h3>${quizConfig.title}</h3><p><strong>${translations[currentLang].quizPrizeText}</strong> ${quizConfig.prize}</p>${q.url_immagine ? `<img src="${IMAGE_BASE_URL}${q.url_immagine}" alt="Immagine Quiz" class="quiz-image">` : ''}<div id="quiz-timer"></div><p><strong>${q.domanda}</strong></p><div id="quiz-answers"></div><button id="quiz-exit-btn" class="play-btn">${translations[currentLang].quizExit}</button></div>`;
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
            if (quizState.answeringAllowed) {
                alert(translations[currentLang].quizTimeUp);
                handleAnswer(-1); 
            }
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
    const isCorrect = selectedIndex === q.indice_corretta;
    if (isCorrect) {
        quizState.score += q.punti || 0;
        quizState.correctCount++;
        buttons[selectedIndex].classList.add('btn-correct');
    } else {
        quizState.incorrectCount++;
        if (selectedIndex !== -1) buttons[selectedIndex].classList.add('btn-wrong');
        if (q.indice_corretta >= 0) buttons[q.indice_corretta].classList.add('btn-correct');
    }
    setTimeout(() => {
        quizState.currentIndex++;
        showQuizQuestion();
    }, 2000);
}

async function endQuizSequence() {
    clearInterval(quizState.timer);
    const containerId = quizState.currentQuizSheet === 'quiz' ? 'quiz-content' : 'pronostici-content';
    const container = document.getElementById(containerId);
    container.innerHTML = `<div class="quiz-container"><h3>${translations[currentLang].quizFinish}</h3><p>${translations[currentLang].loadingQuiz}</p></div>`;
    const result = await sendDataToScript({
        action: 'submitQuiz', userId: telegramUserId, username: username,
        firstName: telegramFirstName, lastName: telegramLastName,
        quizName: quizState.currentQuizSheet, score: quizState.score,
        correctCount: quizState.correctCount, incorrectCount: quizState.incorrectCount,
        totalQuestions: quizConfig.questions.length
    });
    if (result.status === 'success') showQuizResult(result.data);
    else alert("Errore salvataggio risultato: " + (result.message || 'Errore'));
}

function showQuizResult(backendData) {
    const containerId = quizState.currentQuizSheet === 'quiz' ? 'quiz-content' : 'pronostici-content';
    const container = document.getElementById(containerId);
    const rankChangeMap = { up: '▲', down: '▼', same: '▬' };
    const rankChangeClassMap = { up: 'rank-up', down: 'rank-down', same: 'rank-same' };
    const rankChangeHtml = `<span class="${rankChangeClassMap[backendData.rankChange]}">${rankChangeMap[backendData.rankChange]}</span>`;
    container.innerHTML = `<div class="quiz-container result-summary"><h3>${translations[currentLang].summaryTitle}</h3><p>${translations[currentLang].correctAnswers}: ${quizState.correctCount}/${quizConfig.questions.length}</p><p>${translations[currentLang].wrongAnswers}: ${quizState.incorrectCount}/${quizConfig.questions.length}</p><p><strong>${translations[currentLang].finalScore}: ${quizState.score} ${translations[currentLang].quizPoints}</strong></p><hr><p><strong>${translations[currentLang].leaderboardPosition}: ${backendData.newRank}° ${rankChangeHtml}</strong></p><button id="return-btn" class="play-btn">${translations[currentLang].quizExit}</button></div>`;
    const returnSection = quizState.currentQuizSheet;
    document.getElementById('return-btn').addEventListener('click', () => showSection(returnSection));
    quizState.currentQuizSheet = null;
}

function updateTimerUI() {
    const timerDiv = document.getElementById("quiz-timer");
    if (timerDiv) timerDiv.textContent = `⏳ ${quizState.timeLeft}s`;
}
