// --- CONFIGURAZIONE PRINCIPALE ---
const BASE_API_URL = 'https://script.google.com/macros/s/AKfycbzozQ-WtW4DhrhFyqyZDTsoqkbcQUDAQxi98k2YZ2YCDGi2mxj4wQIUE9FMWdme-HZqkQ/exec';
const IMAGE_BASE_URL = 'https://raw.githubusercontent.com/masomang17/aperigame-mini-app/main/miniapp/images/';

// --- TRADUZIONI ---
const translations = {
    it: {
        quiz: "Quiz", tip: "Consigli", profile: "Profilo", shop: "Premi", play: "Gioca Ora",
        user: "Utente", noStars: "0", prizeReq: "Riscatta", prizeCost: "Costo:",
        notEnoughStars: "Non hai abbastanza stelle per questo premio.",
        prizeSuccess: "Premio '{prizeTitle}' richiesto con successo!",
        quizPrizeText: "Premio per il quiz: ", quizExit: "Esci dal quiz",
        quizScore: "Hai totalizzato", quizPoints: "punti",
        quizTimeUp: "Tempo scaduto! Risposta considerata errata.",
        quizNext: "Domanda successiva", quizFinish: "Quiz Terminato!",
        loadingQuiz: "Caricamento quiz...", quizLoadError: "Errore caricamento quiz.",
        quizDataMissing: "Dati quiz non disponibili.", answerRecorded: "Risposta registrata.",
        summaryTitle: "Riepilogo Partita", correctAnswers: "Risposte Corrette",
        wrongAnswers: "Risposte Errate", finalScore: "Punteggio Ottenuto",
        leaderboardPosition: "Posizione in Classifica",
    },
    en: { /* ... Inserire traduzioni in inglese se necessario ... */ },
    es: { /* ... Inserire traduzioni in spagnolo se necessario ... */ }
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
        telegramUserId = "test_user_123";
        username = "TestUser";
    }

    document.querySelectorAll(".btn-nav").forEach(btn => btn.addEventListener("click", () => showSection(btn.dataset.section)));
    document.getElementById("lang-select").addEventListener("change", (e) => {
        currentLang = e.target.value;
        renderAll();
    });

    loadInitialData();
});

// --- FUNZIONI DI CARICAMENTO DATI ---
async function loadInitialData() {
    if (!telegramUserId) return renderAll();
    try {
        const [profileRes, shopRes] = await Promise.all([
            fetch(`${BASE_API_URL}?action=getProfile&userId=${telegramUserId}`),
            fetch(`${BASE_API_URL}?action=getShopItems`)
        ]);
        const profileData = await profileRes.json();
        if (profileData?.status === 'success') userProfile = profileData.data;
        const shopData = await shopRes.json();
        if (shopData?.status === 'success') shopItems = shopData.data;
    } catch (error) {
        console.error("Errore caricamento dati iniziali:", error);
    } finally {
        renderAll();
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
function renderAll() {
    document.querySelectorAll(".btn-nav").forEach(btn => btn.textContent = translations[currentLang][btn.dataset.section]);
    const activeSectionBtn = document.querySelector(".btn-nav.active");
    showSection(activeSectionBtn ? activeSectionBtn.dataset.section : 'quiz');
}

function showSection(sectionId) {
    document.querySelectorAll(".section").forEach(sec => sec.classList.remove("active"));
    document.getElementById(sectionId)?.classList.add("active");
    document.querySelectorAll(".btn-nav").forEach(btn => btn.classList.toggle("active", btn.dataset.section === sectionId));

    switch (sectionId) {
        case 'quiz': renderQuizPage(); break;
        case 'tip': renderTipPage(); break;
        case 'profile': renderProfile(); break;
        case 'shop': renderShop(); break;
    }
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
    const container = document.getElementById(containerId);
    container.innerHTML = `<div class="game-card" id="play-card-${quizSheet}"><div class="game-title">${translations[currentLang][titleKey]}</div><button class="play-btn">${translations[currentLang].play}</button></div>`;
    container.querySelector('.play-btn').addEventListener('click', (event) => playQuiz(quizSheet, event.target));
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

    if (!shopItems || shopItems.length === 0) {
        container.innerHTML = `<p>Nessun premio disponibile.</p>`;
        return;
    }
    shopItems.forEach(prize => {
        const card = document.createElement("div");
        card.className = "prize-card";
        card.innerHTML = `<div class="prize-title">${prize[`title_${currentLang}`] || prize.title_it}</div><p>${translations[currentLang].prizeCost} ⭐ ${prize.cost}</p><button class="play-btn">${translations[currentLang].prizeReq}</button>`;
        card.querySelector('.play-btn').addEventListener('click', (event) => requestPrize(prize.prize_id, prize.cost, event.target));
        container.appendChild(card);
    });
}

async function requestPrize(prizeId, prizeCost, button) {
    if (userProfile.stars < prizeCost) return alert(translations[currentLang].notEnoughStars);
    button.disabled = true;
    const result = await sendDataToScript({ action: 'redeemPrize', userId: telegramUserId, prizeId: prizeId, prizeCost: prizeCost });
    if (result?.status === 'success') {
        userProfile.stars = result.newStars;
        renderProfile();
        alert(translations[currentLang].prizeSuccess.replace('{prizeTitle}', result.prizeTitle));
    } else {
        alert(result.message || "Errore richiesta premio.");
    }
    button.disabled = false;
}

// --- LOGICA DEL QUIZ ---
async function playQuiz(quizSheet, buttonElement) {
    document.getElementById(`play-card-${quizSheet}`)?.style.setProperty('display', 'none');

    if (!quizConfig.questions[quizSheet]?.[currentLang]) {
        try {
            await loadQuizData(quizSheet, buttonElement);
        } catch (e) {
            document.getElementById(`play-card-${quizSheet}`)?.style.setProperty('display', 'flex');
            return;
        }
    }
    const questions = quizConfig.questions[quizSheet]?.[currentLang];
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
        const response = await fetch(`${BASE_API_URL}?action=getQuiz&quiz_name=${quizSheet}`);
        const rawData = await response.json();
        if (rawData.error) throw new Error(rawData.error);
        quizConfig.questions[quizSheet] = {};
        quizConfig.titles[quizSheet] = {};
        const groupedQuestions = {};
        rawData.forEach(item => {
            const lang = item.lang;
            if (!groupedQuestions[lang]) groupedQuestions[lang] = [];
            const qText = (item.question || '').toLowerCase().trim();
            if (qText === "title") {
                quizConfig.titles[quizSheet][lang] = item.answer_1;
            } else if (qText !== "prize") {
                const answers = [item.answer_1, item.answer_2, item.answer_3, item.answer_4].filter(Boolean);
                const correctIdx = parseInt(item.correct_index, 10);
                groupedQuestions[lang].push({
                    question: item.question,
                    answers: answers,
                    correctIndex: !isNaN(correctIdx) && correctIdx > 0 ? correctIdx - 1 : -1,
                    points: parseInt(item.points, 10) || 0,
                    timer: parseInt(item.time_sec, 10) || quizState.timePerQuestion,
                    imageUrl: item.image_url || null,
                });
            }
        });
        quizConfig.questions[quizSheet] = groupedQuestions;
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
    const questions = quizConfig.questions[quizState.currentQuizSheet]?.[currentLang] || [];
    if (quizState.currentIndex >= questions.length) {
        return endQuizSequence();
    }
    const q = questions[quizState.currentIndex];
    clearInterval(quizState.timer);

    const containerId = quizState.currentQuizSheet === 'quiz' ? 'quiz-content' : 'tip-content';
    const container = document.getElementById(containerId);
    container.innerHTML = `<div class="quiz-container"><h3>${quizConfig.titles[quizState.currentQuizSheet]?.[currentLang] || "Quiz"}</h3><p><strong>${translations[currentLang].quizPrizeText}</strong> ${quizConfig.prize}</p>${q.imageUrl ? `<img src="${IMAGE_BASE_URL}${q.imageUrl}" alt="Immagine Quiz" class="quiz-image">` : ''}<div id="quiz-timer" class="quiz-timer"></div><p><strong>${q.question}</strong></p><div id="quiz-answers" class="quiz-answers"></div><button id="quiz-exit" class="play-btn">${translations[currentLang].quizExit}</button></div>`;

    document.getElementById("quiz-exit").addEventListener('click', () => { clearInterval(quizState.timer); endQuizSequence(); });
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
                handleAnswer(-1); // Indice -1 indica timeout (risposta errata)
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
        if (selectedIndex !== -1) { // Se non è timeout, colora la risposta data
            buttons[selectedIndex].classList.add('btn-wrong');
        }
        if (q.correctIndex >= 0) { // Mostra sempre quella corretta
            buttons[q.correctIndex].classList.add('btn-correct');
        }
    }

    setTimeout(() => {
        quizState.currentIndex++;
        showQuizQuestion();
    }, 2000);
}

async function endQuizSequence() {
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
    quizState.currentQuizSheet = null;
}

function updateTimerUI() {
    const timerDiv = document.getElementById("quiz-timer");
    if (timerDiv) timerDiv.textContent = `⏳ ${quizState.timeLeft}s`;
}
