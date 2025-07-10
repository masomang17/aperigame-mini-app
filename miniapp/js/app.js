// *** IL TUO URL DI DEPLOYMENT ESATTO DEL GOOGLE APPS SCRIPT ***
const BASE_API_URL = 'https://script.google.com/macros/s/AKfycbxk0gSMb81D7b4pdh8hXruvlFwuFRiJGB74XUAxjRVstEmtTwSR6CE_ExIKv0d9De5wBw/exec';

// --- Traduzioni per la navigazione e le sezioni ---
const translations = {
    it: {
        quiz: "Quiz",
        tip: "Consigli",
        profile: "Profilo",
        shop: "Premi",
        play: "Gioca Ora",
        user: "Utente",
        noStars: "0",
        prizeReq: "Riscatta",
        prizeCost: "Costo:",
        notEnoughStars: "Non hai abbastanza stelle per questo premio.",
        prizeSuccess: "Premio '{prizeTitle}' richiesto con successo!",
        quizPrizeText: "Premio per il quiz: ",
        quizExit: "Esci dal quiz",
        quizScore: "Hai totalizzato",
        quizPoints: "punti su",
        quizTimeUp: "Tempo scaduto! Punteggio 0 per questa domanda.",
        quizNext: "Domanda successiva",
        quizFinish: "Fine quiz!",
        loadingQuiz: "Caricamento quiz...",
        quizLoadError: "Errore nel caricamento del quiz. Controlla la tua connessione o riprova più tardi.",
        quizDataMissing: "Dati quiz non disponibili per questa lingua o quiz.",
        answerRecorded: "La tua risposta è stata registrata. I risultati di questo quiz verranno pubblicati successivamente!",
    },
    en: {
        quiz: "Quiz",
        tip: "Tips",
        profile: "Profile",
        shop: "Prizes",
        play: "Play Now",
        user: "User",
        noStars: "0",
        prizeReq: "Redeem",
        prizeCost: "Cost:",
        notEnoughStars: "You don't have enough stars for this prize.",
        prizeSuccess: "Prize '{prizeTitle}' requested successfully!",
        quizPrizeText: "Prize for the quiz: ",
        quizExit: "Exit quiz",
        quizScore: "You scored",
        quizPoints: "points out of",
        quizTimeUp: "Time's up! Zero points for this question.",
        quizNext: "Next question",
        quizFinish: "Quiz finished!",
        loadingQuiz: "Loading quiz...",
        quizLoadError: "Error loading quiz. Please try again later.",
        quizDataMissing: "Quiz data not available for this language or quiz.",
        answerRecorded: "Your answer has been recorded. Quiz results will be published later!",
    },
    es: {
        quiz: "Quiz",
        tip: "Consejos",
        profile: "Perfil",
        shop: "Premios",
        play: "Jugar Ahora",
        user: "Usuario",
        noStars: "0",
        prizeReq: "Canjear",
        prizeCost: "Coste:",
        notEnoughStars: "No tienes suficientes estrellas para este premio.",
        prizeSuccess: "¡Premio '{prizeTitle}' solicitado con éxito!",
        quizPrizeText: "Premio para el quiz: ",
        quizExit: "Salir del quiz",
        quizScore: "Has conseguido",
        quizPoints: "puntos de",
        quizTimeUp: "¡Tiempo agotado! 0 puntos para esta pregunta.",
        quizNext: "Siguiente pregunta",
        quizFinish: "¡Fin del quiz!",
        loadingQuiz: "Cargando quiz...",
        quizLoadError: "Error al cargar el quiz. Inténtalo de nuevo de nuevo más tarde.",
        quizDataMissing: "Datos del quiz no disponibles para este idioma o quiz.",
        answerRecorded: "¡Tu respuesta ha sido registrada. Los resultados de este quiz se publicarán más tarde!",
    }
};

let currentLang = 'it';

// Variabili utente Telegram
let telegramUserId = null;
let username = "User";
let telegramFirstName = null;
let telegramLastName = null;

if (window.Telegram && window.Telegram.WebApp) {
    Telegram.WebApp.ready();
    const initData = Telegram.WebApp.initDataUnsafe || {};
    const user = initData.user || {};

    telegramUserId = user.id || null;
    telegramFirstName = user.first_name || null;
    telegramLastName = user.last_name || null;

    if (user.username) {
        username = `@${user.username}`;
    } else if (telegramFirstName) {
        username = telegramFirstName + (telegramLastName ? ` ${telegramLastName}` : '');
    } else if (telegramUserId) {
        username = "User " + telegramUserId;
    }
} else {
    console.warn("SDK Telegram non disponibile. Uso dati di test.");
    telegramUserId = "test_user_123";
    username = "TestUser";
    telegramFirstName = "Test";
    telegramLastName = "User";
}

// I dati dello shop e del profilo verranno caricati qui
let shopItems = [];
let userProfile = { stars: 0 };

let quizConfig = {
    questions: {},
    titles: {},
    prize: "Buono da 5€ per aperitivo"
};

let quizState = {
    currentIndex: 0,
    score: 0,
    timer: null,
    timeLeft: 0,
    timePerQuestion: 15,
    answeringAllowed: true,
    currentQuizSheet: null
};

// --- Funzioni UI Generali ---
function showSection(sectionId) {
    document.querySelectorAll(".section").forEach(sec => sec.classList.remove("active"));
    const activeSection = document.getElementById(sectionId);
    if (activeSection) activeSection.classList.add("active");

    document.querySelectorAll(".btn-nav").forEach(btn => btn.classList.toggle("active", btn.dataset.section === sectionId));

    switch (sectionId) {
        case 'quiz':
            renderQuizPage();
            break;
        case 'tip':
            renderTipPage();
            break;
        case 'profile':
            renderProfile();
            break;
        case 'shop':
            renderShop();
            break;
    }
}

function createPlayCard(containerId, titleKey, quizSheet) {
    const container = document.getElementById(containerId);
    container.innerHTML = `
        <div class="game-card" id="play-card-${quizSheet}">
            <div class="game-title">${translations[currentLang][titleKey]}</div>
            <button class="play-btn">${translations[currentLang].play}</button>
        </div>
    `;
    container.querySelector('.play-btn').addEventListener('click', (event) => {
        playQuiz(quizSheet, event.target);
    });
}

function renderQuizPage() {
    document.querySelector("#quiz h2").textContent = translations[currentLang].quiz;
    createPlayCard('quiz-content', 'quiz', 'quiz');
}

function renderTipPage() {
    document.querySelector("#tip h2").textContent = translations[currentLang].tip;
    createPlayCard('tip-content', 'tip', 'tip');
}

function renderProfile() {
    document.querySelector("#profile h2").textContent = translations[currentLang].profile;
    document.getElementById("profile-user").textContent = `${translations[currentLang].user}: ${username}`;
    document.getElementById("stars-count").textContent = userProfile.stars || translations[currentLang].noStars;
}

function renderShop() {
    document.querySelector("#shop h2").textContent = translations[currentLang].shop;
    const container = document.getElementById("shop-list");
    container.innerHTML = "";

    if (shopItems.length === 0) {
        container.innerHTML = `<p>Nessun premio disponibile al momento.</p>`;
        return;
    }

    shopItems.forEach(prize => {
        const card = document.createElement("div");
        card.className = "prize-card";

        const titleDiv = document.createElement("div");
        titleDiv.className = "prize-title";
        titleDiv.textContent = prize[`title_${currentLang}`] || prize.title_it;
        card.appendChild(titleDiv);

        const costP = document.createElement("p");
        costP.textContent = `${translations[currentLang].prizeCost} ⭐ ${prize.cost}`;
        card.appendChild(costP);

        const requestButton = document.createElement("button");
        requestButton.className = "play-btn";
        requestButton.textContent = translations[currentLang].prizeReq;
        requestButton.addEventListener('click', (event) => requestPrize(prize.prize_id, prize.cost, event.target));
        card.appendChild(requestButton);

        container.appendChild(card);
    });
}

async function requestPrize(prizeId, prizeCost, button) {
    if (userProfile.stars < prizeCost) {
        alert(translations[currentLang].notEnoughStars);
        return;
    }

    button.disabled = true;

    const result = await sendDataToScript({
        action: 'redeemPrize',
        userId: telegramUserId,
        prizeId: prizeId,
        prizeCost: prizeCost
    });

    if (result && result.status === 'success') {
        userProfile.stars = result.newStars;
        renderProfile();
        alert(translations[currentLang].prizeSuccess.replace('{prizeTitle}', result.prizeTitle));
    } else {
        alert(result.message || "Errore nella richiesta del premio.");
    }

    button.disabled = false;
}

// --- Funzioni Quiz ---
async function loadAndProcessQuizData(quizSheet, gameButton) {
    if (gameButton) {
        gameButton.textContent = translations[currentLang].loadingQuiz;
        gameButton.disabled = true;
    }

    try {
        const response = await fetch(`${BASE_API_URL}?action=getQuiz&quiz_name=${encodeURIComponent(quizSheet)}`);
        if (!response.ok) throw new Error(`Errore di rete: ${response.statusText}`);
        
        const rawData = await response.json();
        if (rawData.error) throw new Error(`Errore da Google Apps Script: ${rawData.error}`);

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
                    correctIndex: !isNaN(correctIdx) && correctIdx > 0 && correctIdx <= answers.length ? correctIdx - 1 : -1,
                    points: parseInt(item.points, 10) || 0,
                    timer: !isNaN(timerSec) && timerSec > 0 ? timerSec : quizState.timePerQuestion,
                    imageUrl: item.image_url || null,
                    explanation: item.explanation || null
                });
            }
        });
        quizConfig.questions[quizSheet] = groupedQuestions;
    } catch (error) {
        console.error(`Errore durante il caricamento del quiz '${quizSheet}':`, error);
        alert(translations[currentLang].quizLoadError);
        throw error;
    } finally {
        if (gameButton) {
            gameButton.textContent = translations[currentLang].play;
            gameButton.disabled = false;
        }
    }
}

async function playQuiz(quizSheet, buttonElement) {
    quizState.currentQuizSheet = quizSheet;

    const playCard = document.getElementById(`play-card-${quizSheet}`);
    if (playCard) playCard.style.display = 'none';

    if (!quizConfig.questions[quizSheet] || !quizConfig.questions[quizSheet][currentLang]) {
        try {
            await loadAndProcessQuizData(quizSheet, buttonElement);
        } catch (error) {
            console.error("Fallito l'avvio del quiz a causa di errore di caricamento.");
            if (playCard) playCard.style.display = 'block';
            return;
        }
    }

    const questions = quizConfig.questions[quizSheet]?.[currentLang];
    if (!questions || questions.length === 0) {
        alert(translations[currentLang].quizDataMissing);
        if (playCard) playCard.style.display = 'block';
        return;
    }

    quizState.currentIndex = 0;
    quizState.score = 0;
    clearInterval(quizState.timer);
    showQuizQuestion();
}

function showQuizQuestion() {
    const questions = quizConfig.questions[quizState.currentQuizSheet]?.[currentLang] || [];

    if (quizState.currentIndex >= questions.length) {
        showQuizResult();
        return;
    }

    const q = questions[quizState.currentIndex];
    clearInterval(quizState.timer);

    const quizTitle = quizConfig.titles[quizState.currentQuizSheet]?.[currentLang] || "Quiz";
    const quizPrize = quizConfig.prize;
    const containerId = quizState.currentQuizSheet === 'quiz' ? 'quiz-content' : 'tip-content';
    const container = document.getElementById(containerId);

    if (!container) {
        console.error("Container del quiz non trovato!");
        return;
    }

    container.innerHTML = `
        <div class="quiz-container">
            <h3>${quizTitle}</h3>
            <p><strong>${translations[currentLang].quizPrizeText}</strong> ${quizPrize}</p>
            ${q.imageUrl ? `<img src="${q.imageUrl}" alt="Quiz Image" class="quiz-image">` : ''}
            <div id="quiz-timer" class="quiz-timer"></div>
            <p><strong>${q.question}</strong></p>
            <div id="quiz-answers" class="quiz-answers"></div>
            <button id="quiz-exit" class="play-btn">${translations[currentLang].quizExit}</button>
        </div>
    `;

    document.getElementById("quiz-exit").addEventListener('click', () => {
        clearInterval(quizState.timer);
        showQuizResult(true);
    });

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
                quizState.answeringAllowed = false;
                alert(translations[currentLang].quizTimeUp);
                if (q.correctIndex !== -1) highlightAnswer(q.correctIndex, 'btn-correct');
                setTimeout(() => {
                    if (q.explanation && q.correctIndex !== -1) alert(`Spiegazione: ${q.explanation}`);
                    nextQuizQuestion();
                }, 1500);
            }
        }
    }, 1000);
}

function updateTimerUI() {
    const timerDiv = document.getElementById("quiz-timer");
    if (timerDiv) timerDiv.textContent = `⏳ ${quizState.timeLeft}s`;
}

function handleAnswer(selectedIndex) {
    if (!quizState.answeringAllowed) return;

    quizState.answeringAllowed = false;
    clearInterval(quizState.timer);

    const q = quizConfig.questions[quizState.currentQuizSheet][currentLang][quizState.currentIndex];
    document.querySelectorAll("#quiz-answers button").forEach(btn => btn.disabled = true);

    const isImmediateResultQuiz = (q.correctIndex !== -1);
    let isCorrect = false;
    let pointsAwarded = 0;

    if (isImmediateResultQuiz) {
        isCorrect = (selectedIndex === q.correctIndex);
        if (isCorrect) {
            pointsAwarded = q.points || 0;
            quizState.score += pointsAwarded;
            highlightAnswer(selectedIndex, 'btn-correct');
        } else {
            highlightAnswer(selectedIndex, 'btn-wrong');
            highlightAnswer(q.correctIndex, 'btn-correct');
        }
    } else {
        alert(translations[currentLang].answerRecorded);
        highlightAnswer(selectedIndex, 'btn-selected-1x2');
    }

    submitAnswerData(quizState.currentQuizSheet, quizState.currentIndex, selectedIndex, q.correctIndex, isCorrect, pointsAwarded);

    setTimeout(() => {
        if (q.explanation && isImmediateResultQuiz) alert(`Spiegazione: ${q.explanation}`);
        nextQuizQuestion();
    }, 1500);
}

function highlightAnswer(index, className) {
    const buttons = document.querySelectorAll("#quiz-answers button");
    if (index >= 0 && index < buttons.length) buttons[index].classList.add(className);
}

function nextQuizQuestion() {
    quizState.currentIndex++;
    showQuizQuestion();
}

function showQuizResult(exitedEarly = false) {
    const containerId = quizState.currentQuizSheet === 'quiz' ? 'quiz-content' : 'tip-content';
    const container = document.getElementById(containerId);
    const totalQuestions = (quizConfig.questions[quizState.currentQuizSheet]?.[currentLang] || []).length;
    let message = exitedEarly ?
        `${translations[currentLang].quizScore} ${quizState.score} ${translations[currentLang].quizPoints} ${totalQuestions}.<br>${translations[currentLang].quizExit}` :
        `${translations[currentLang].quizScore} ${quizState.score} ${translations[currentLang].quizPoints} ${totalQuestions}.`;

    container.innerHTML = `
        <div class="quiz-container">
            <h3>${translations[currentLang].quizFinish}</h3>
            <p>${message}</p>
            <button id="return-btn" class="play-btn">${translations[currentLang].quizExit}</button>
        </div>
    `;

    const returnSection = quizState.currentQuizSheet;
    document.getElementById('return-btn').addEventListener('click', () => showSection(returnSection));

    clearInterval(quizState.timer);
    submitQuizResult(quizState.currentQuizSheet, quizState.score, totalQuestions);
    quizState.currentQuizSheet = null;
}

// --- Funzioni di Comunicazione con il Backend ---
async function sendDataToScript(data) {
    try {
        const response = await fetch(BASE_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(data),
            mode: 'cors'
        });
        if (!response.ok) throw new Error(`Errore HTTP: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error(`Errore nell'invio dati (Action: ${data.action || 'N/A'}):`, error);
        return { status: "error", message: `Errore nell'invio dei dati: ${error.message}` };
    }
}

async function submitAnswerData(quizSheet, questionIndex, selectedAnswerIndex, correctAnswerIndex, isCorrect, pointsAwarded) {
    const result = await sendDataToScript({
        action: "submitAnswer",
        quizSheet,
        questionIndex,
        selectedAnswerIndex,
        correctAnswerIndex,
        isCorrect,
        pointsAwarded,
        userId: telegramUserId,
        userName: username,
        firstName: telegramFirstName,
        lastName: telegramLastName,
        timestamp: new Date().toISOString()
    });
    console.log(result.status === "success" ? "Dati risposta inviati con successo." : `Errore invio dati risposta: ${result.message}`);
}

async function submitQuizResult(quizSheet, finalScore, totalQuestions) {
    const result = await sendDataToScript({
        action: "submitResult",
        quizSheet,
        finalScore,
        totalQuestions,
        userId: telegramUserId,
        userName: username,
        firstName: telegramFirstName,
        lastName: telegramLastName,
        timestamp: new Date().toISOString()
    });
    console.log(result.status === "success" ? "Risultato quiz finale inviato." : `Errore invio risultato finale: ${result.message}`);
}

async function loadInitialData() {
    if (!telegramUserId) {
        console.log("Nessun utente Telegram, carico dati di default.");
        renderAll();
        return;
    }
    try {
        const [profileRes, shopRes] = await Promise.all([
            fetch(`${BASE_API_URL}?action=getProfile&userId=${telegramUserId}`),
            fetch(`${BASE_API_URL}?action=getShopItems`)
        ]);

        const profileData = await profileRes.json();
        if (profileData && profileData.status === 'success') userProfile = profileData.data;

        const shopData = await shopRes.json();
        if (shopData && shopData.status === 'success') shopItems = shopData.data;

    } catch (error) {
        console.error("Errore nel caricamento dei dati iniziali:", error);
        alert("Impossibile caricare i dati del profilo e dei premi. Controlla la connessione.");
    } finally {
        renderAll();
    }
}

// --- Inizializzazione ---
function renderAll() {
    document.querySelectorAll(".btn-nav").forEach(btn => {
        btn.textContent = translations[currentLang][btn.dataset.section];
    });
    const activeSectionBtn = document.querySelector(".btn-nav.active");
    showSection(activeSectionBtn ? activeSectionBtn.dataset.section : 'quiz');
}

document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".btn-nav").forEach(btn => {
        btn.addEventListener("click", () => showSection(btn.dataset.section));
    });
    document.getElementById("lang-select").addEventListener("change", (e) => {
        currentLang = e.target.value;
        renderAll();
    });
    document.getElementById("lang-select").value = currentLang;
    loadInitialData();
});
