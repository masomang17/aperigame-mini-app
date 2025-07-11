// --- CONFIGURAZIONE PRINCIPALE ---
const BASE_API_URL = 'https://script.google.com/macros/s/AKfycbxlL7BuxcTpYS3881sGAadqTXrAUmJLKThzpBk3jPn-R8OYrFKyLXofiFv2EV4StO3OXw/exec';
const IMAGE_BASE_URL = 'https://raw.githubusercontent.com/masomang17/aperigame-mini-app/main/miniapp/images/';

// --- TRADUZIONI (solo per testi statici dell'interfaccia) ---
const translations = {
    it: {
        quiz: "Quiz", tip: "Consigli", profile: "Profilo", shop: "Premi", play: "Gioca Ora",
        user: "Utente", noStars: "0", prizeReq: "Riscatta", prizeCost: "Costo:",
        notEnoughStars: "Non hai abbastanza stelle per questo premio.",
        prizeSuccess: "Premio '{prizeTitle}' richiesto con successo!",
        quizPrizeText: "Premio per il quiz: ", quizExit: "Esci dal quiz",
        quizScore: "Hai totalizzato", quizPoints: "punti",
        quizTimeUp: "Tempo scaduto! Risposta considerata errata.",
        quizFinish: "Quiz Terminato!", loadingQuiz: "Caricamento quiz...",
        quizLoadError: "Errore caricamento quiz.", quizDataMissing: "Dati quiz non disponibili.",
        summaryTitle: "Riepilogo Partita", correctAnswers: "Risposte Corrette",
        wrongAnswers: "Risposte Errate", finalScore: "Punteggio Ottenuto",
        leaderboardPosition: "Posizione in Classifica",
    }
    // Non servono più le altre lingue qui per i contenuti dinamici
};

// --- STATO DELL'APPLICAZIONE ---
let currentLang = 'it';
let telegramUserId = null, username = "User", telegramFirstName = null, telegramLastName = null;
let shopItems = [], userProfile = { stars: 0 };
let quizConfig = { questions: {}, titles: {}, prize: "Buono da 5€" };
let quizState = {
    currentIndex: 0, score: 0, timer: null, timeLeft: 0, timePerQuestion: 15,
    answeringAllowed: true, currentQuizSheet: null,
    correctCount: 0, incorrectCount: 0
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
            username = user.username ? `@${user.username}` : `${user.first_name} ${user.last_name || ''}`.trim();
        }
    } else {
        console.warn("SDK Telegram non disponibile. Uso dati di test.");
        telegramUserId = "test_user_123"; username = "TestUser";
    }

    document.querySelectorAll(".btn-nav").forEach(btn => btn.addEventListener("click", () => showSection(btn.dataset.section)));
    document.getElementById("lang-select").addEventListener("change", (e) => {
        currentLang = e.target.value;
        // Ricarica i dati per la nuova lingua
        loadInitialData();
    });

    loadInitialData();
});

// --- FUNZIONI DI CARICAMENTO DATI ---
async function loadInitialData() {
    renderAll(); // Mostra subito l'interfaccia statica
    if (!telegramUserId) return;
    try {
        const [profileRes, shopRes] = await Promise.all([
            fetch(`${BASE_API_URL}?action=getProfile&userId=${telegramUserId}&lang=${currentLang}`),
            fetch(`${BASE_API_URL}?action=getShopItems&lang=${currentLang}`)
        ]);
        const profileData = await profileRes.json();
        if (profileData?.status === 'success') userProfile = profileData.data;
        const shopData = await shopRes.json();
        if (shopData?.status === 'success') shopItems = shopData.data;
    } catch (error) {
        console.error("Errore caricamento dati iniziali:", error);
    } finally {
        // Ri-renderizza le sezioni con i dati caricati
        renderProfile();
        renderShop();
    }
}

async function sendDataToScript(data) {
    // ... (invariata)
}

// --- FUNZIONI DI RENDERING UI ---
function renderAll() {
    document.querySelectorAll(".btn-nav").forEach(btn => btn.textContent = translations[currentLang][btn.dataset.section]);
    const activeSectionBtn = document.querySelector(".btn-nav.active");
    showSection(activeSectionBtn ? activeSectionBtn.dataset.section : 'quiz');
}

function showSection(sectionId) {
    // ... (invariata)
}

function renderQuizPage() {
    document.querySelector("#quiz h2").textContent = translations[currentLang].quiz;
    createPlayCard('quiz-content', 'quiz', 'quiz');
}

function renderTipPage() {
    document.querySelector("#tip h2").textContent = translations[currentLang].tip;
    createPlayCard('tip-content', 'tip', 'tip');
}

function createPlayCard(containerId, titleKey, quizSheet) {
    // ... (invariata)
}

function renderProfile() {
    // ... (invariata)
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
        // Il titolo arriva già tradotto dal backend
        card.innerHTML = `<div class="prize-title">${prize.title}</div><p>${translations[currentLang].prizeCost} ⭐ ${prize.cost}</p><button class="play-btn">${translations[currentLang].prizeReq}</button>`;
        card.querySelector('.play-btn').addEventListener('click', (event) => requestPrize(prize.prize_id, prize.cost, event.target));
        container.appendChild(card);
    });
}

async function requestPrize(prizeId, prizeCost, button) {
    // ... (invariata)
}

// --- LOGICA DEL QUIZ ---
async function playQuiz(quizSheet, buttonElement) {
    document.getElementById(`play-card-${quizSheet}`)?.style.setProperty('display', 'none');
    
    // Carica i dati del quiz per la lingua corrente
    try {
        await loadQuizData(quizSheet, buttonElement);
    } catch (e) {
        document.getElementById(`play-card-${quizSheet}`)?.style.setProperty('display', 'flex');
        return;
    }
    
    const questions = quizConfig.questions[quizSheet];
    if (!questions || questions.length === 0) {
        alert(translations[currentLang].quizDataMissing);
        document.getElementById(`play-card-${quizSheet}`)?.style.setProperty('display', 'flex');
        return;
    }

    quizState.currentIndex = 0;
    quizState.score = 0;
    quizState.correctCount = 0;
    quizState.incorrectCount = 0;
    quizState.currentQuizSheet = quizSheet;
    showQuizQuestion();
}

async function loadQuizData(quizSheet, buttonElement) {
    if (buttonElement) {
        buttonElement.textContent = translations[currentLang].loadingQuiz;
        buttonElement.disabled = true;
    }
    try {
        // Passa la lingua corrente al backend
        const response = await fetch(`${BASE_API_URL}?action=getQuiz&quiz_name=${quizSheet}&lang=${currentLang}`);
        const result = await response.json();
        if (result.status !== 'success') throw new Error(result.message);
        
        // I dati arrivano già tradotti, li salviamo
        quizConfig.questions[quizSheet] = result.data.questions;
        quizConfig.titles[quizSheet] = result.data.title;
        quizConfig.prize = result.data.prize;

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
    const questions = quizConfig.questions[quizState.currentQuizSheet];
    if (quizState.currentIndex >= questions.length) {
        return endQuizSequence();
    }
    const q = questions[quizState.currentIndex];
    clearInterval(quizState.timer);

    const containerId = quizState.currentQuizSheet === 'quiz' ? 'quiz-content' : 'tip-content';
    const container = document.getElementById(containerId);
    container.innerHTML = `<div class="quiz-container"><h3>${quizConfig.titles[quizState.currentQuizSheet] || "Quiz"}</h3><p><strong>${translations[currentLang].quizPrizeText}</strong> ${quizConfig.prize}</p>${q.imageUrl ? `<img src="${IMAGE_BASE_URL}${q.imageUrl}" alt="Immagine Quiz" class="quiz-image">` : ''}<div id="quiz-timer" class="quiz-timer"></div><p><strong>${q.question}</strong></p><div id="quiz-answers" class="quiz-answers"></div><button id="quiz-exit" class="play-btn">${translations[currentLang].quizExit}</button></div>`;

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
        // ... (invariato)
    }, 1000);
}

function handleAnswer(selectedIndex) {
    if (!quizState.answeringAllowed) return;
    quizState.answeringAllowed = false;
    clearInterval(quizState.timer);

    const q = quizConfig.questions[quizState.currentQuizSheet][quizState.currentIndex];
    // ... (logica di gestione risposta invariata)

    setTimeout(() => {
        quizState.currentIndex++;
        showQuizQuestion();
    }, 2000);
}

async function endQuizSequence() {
    // ... (invariata)
}

function showQuizResult(backendData) {
    // ... (invariata)
}

function updateTimerUI() {
    // ... (invariata)
}
