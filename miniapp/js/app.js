// *** IL TUO URL DI DEPLOYMENT ESATTO DEL GOOGLE APPS SCRIPT ***
const BASE_QUIZ_SHEET_URL = 'https://script.google.com/macros/s/AKfycbzIl0NH1EoSZydPjeBpZj1c7Y9hFjZPLOkhymNvZpPcRip5eMXXzX0M3GbDjMCGqhic3w/exec';

const translations = {
    it: {
        home: "Home",
        profile: "Profilo",
        prizes: "Premi",
        welcome: "Benvenuto su Aperigame!",
        games: "Giochi Disponibili",
        stars: "Stelle",
        prizesList: "Catalogo Premi",
        play: "Gioca",
        user: "Utente",
        noStars: "0",
        prizeReq: "Richiedi premio",
        quizPrizeText: "Premio per il quiz: ",
        quizExit: "Esci dal quiz",
        quizScore: "Hai totalizzato",
        quizPoints: "punti su",
        quizTimeUp: "Tempo scaduto! Punteggio 0 per questa domanda.",
        quizNext: "Domanda successiva",
        quizFinish: "Fine quiz!",
        loadingQuiz: "Caricamento quiz...",
        quizLoadError: "Errore nel caricamento del quiz. Controlla la tua connessione o riprova più tardi.",
        notEnoughStars: "Non hai abbastanza stelle per questo premio.",
        prizeSuccess: "Premio '{prizeTitle}' richiesto con successo!",
        gameEarned: "Hai guadagnato",
        quizDataMissing: "Dati quiz non disponibili per questa lingua o quiz.",
        answerRecorded: "La tua risposta è stata registrata. I risultati di questo quiz verranno pubblicati successivamente!",
    },
    en: {
        home: "Home",
        profile: "Profile",
        prizes: "Prizes",
        welcome: "Welcome to Aperigame!",
        games: "Available Games",
        stars: "Stars",
        prizesList: "Prize Catalog",
        play: "Play",
        user: "User",
        noStars: "0",
        prizeReq: "Request Prize",
        quizPrizeText: "Prize for the quiz: ",
        quizExit: "Exit quiz",
        quizScore: "You scored",
        quizPoints: "points out of",
        quizTimeUp: "Time's up! Zero points for this question.",
        quizNext: "Next question",
        quizFinish: "Quiz finished!",
        loadingQuiz: "Loading quiz...",
        quizLoadError: "Error loading quiz. Please try again later.",
        notEnoughStars: "You don't have enough stars for this prize.",
        prizeSuccess: "Prize '{prizeTitle}' requested successfully!",
        gameEarned: "You earned",
        quizDataMissing: "Quiz data not available for this language or quiz.",
        answerRecorded: "Your answer has been recorded. Quiz results will be published later!",
    },
    es: {
        home: "Inicio",
        profile: "Perfil",
        prizes: "Premios",
        welcome: "¡Bienvenido a Aperigame!",
        games: "Juegos Disponibles",
        stars: "Estrellas",
        prizesList: "Catálogo de Premios",
        play: "Jugar",
        user: "Usuario",
        noStars: "0",
        prizeReq: "Solicitar Premio",
        quizPrizeText: "Premio para el quiz: ",
        quizExit: "Salir del quiz",
        quizScore: "Has conseguido",
        quizPoints: "puntos de",
        quizTimeUp: "¡Tiempo agotado! 0 puntos para esta pregunta.",
        quizNext: "Siguiente pregunta",
        quizFinish: "¡Fin del quiz!",
        loadingQuiz: "Cargando quiz...",
        quizLoadError: "Error al cargar el quiz. Inténtalo de nuevo de nuevo más tarde.",
        notEnoughStars: "No tienes suficientes estrellas para este premio.",
        prizeSuccess: "¡Premio '{prizeTitle}' solicitado con éxito!",
        gameEarned: "Has ganado",
        quizDataMissing: "Datos del quiz no disponibles para este idioma o quiz.",
        answerRecorded: "¡Tu respuesta ha sido registrada. Los resultados de este quiz se publicarán más tarde!",
    }
};

// --- FIX #1: Initialize currentLang with a default value ---
let currentLang = 'it';

// Variabili per l'utente Telegram
let telegramUserId = null;
let telegramUsername = null;
let telegramFirstName = null;
let telegramLastName = null;
let username = "User"; // Default username

// Inizializzazione dell'SDK di Telegram Web App
if (window.Telegram && window.Telegram.WebApp) {
    Telegram.WebApp.ready();
    const initData = Telegram.WebApp.initDataUnsafe || {};
    const user = initData.user || {};

    telegramUserId = user.id || null;
    telegramUsername = user.username || null;
    telegramFirstName = user.first_name || null;
    telegramLastName = user.last_name || null;
    
    // Aggiorna il nome utente visualizzato nel profilo
    if (telegramUsername) {
        username = `@${telegramUsername}`;
    } else if (telegramFirstName) {
        username = telegramFirstName;
        if (telegramLastName) {
            username += ` ${telegramLastName}`;
        }
    } else if (telegramUserId) {
        username = "User " + telegramUserId; // Fallback se non ci sono dati nome
    }
} else {
    console.warn("Telegram WebApp SDK non disponibile. L'app potrebbe non funzionare correttamente in un browser standard. Usando dati di test.");
    telegramUserId = "test_user_123";
    username = "TestUser";
    telegramFirstName = "Test";
    telegramLastName = "User";
}

let starsCount = 0;

// Definizione dei giochi con i nomi delle schede corrispondenti nel Google Sheet
const games = [
    { id: 1, title: { it: "Memory", en: "Memory", es: "Memoria" }, starsReward: 5, type: "static" },
    { id: 2, title: { it: "Quiz Generale", en: "General Quiz", es: "Quiz General" }, starsReward: 0, type: "quiz", quizSheet: "quiz" }, // Corrisponde alla scheda 'quiz'
    { id: 3, title: { it: "Puzzle", en: "Puzzle", es: "Rompecabezas" }, starsReward: 4, type: "static" },
    { id: 4, title: { it: "Quiz Storia", en: "History Quiz", es: "Quiz Historia" }, starsReward: 0, type: "quiz", quizSheet: "Quiz Storia" }, // Esempio: Corrisponde a 'Quiz Storia'
    { id: 5, title: { it: "Quiz delle Categorie", en: "Categories Quiz", es: "Quiz de Categorías" }, starsReward: 0, type: "quiz", quizSheet: "tip" }, // Corrisponde alla scheda 'tip'
];

const prizes = [
    { id: 1, title: { it: "10% di sconto", en: "10% Discount", es: "10% de descuento" }, cost: 10 },
    { id: 2, title: { it: "Gioco Bonus", en: "Bonus Game", es: "Bonus Game" }, cost: 15 },
    { id: 3, title: { it: "Accesso VIP", en: "VIP Access", es: "Acceso VIP" }, cost: 25 }
];

let quizConfig = {
    questions: {}, // Qui memorizzeremo le domande per ogni quizSheet (es. questions['Quiz Sport']['it'])
    titles: {},    // Titoli per ogni quizSheet
    prize: "Buono da 5€ per aperitivo" // Premio di default se non specificato nel foglio
};

let quizState = {
    currentIndex: 0,
    score: 0,
    timer: null,
    timeLeft: 0,
    timePerQuestion: 15,
    answeringAllowed: true,
    currentQuizSheet: null // Tiene traccia della scheda quiz corrente
};

// --- Funzioni UI Generali ---

function showSection(sectionId) {
    document.querySelectorAll(".section").forEach(sec => sec.classList.remove("active"));
    const activeSection = document.getElementById(sectionId);
    if (activeSection) {
        activeSection.classList.add("active");
    }

    document.querySelectorAll(".btn-nav").forEach(btn => btn.classList.toggle("active", btn.dataset.section === sectionId));

    if (sectionId === "home") {
        renderGames();
        if (quizState.timer) { // Interrompi il timer se si esce dal quiz
            clearInterval(quizState.timer);
            quizState.timer = null;
        }
    }
    if (sectionId === "profile") renderProfile();
    if (sectionId === "prizes") renderPrizes();
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
            // --- FIX #2 (Part 1): Pass the button element to the playQuiz function ---
            playButton.addEventListener('click', (event) => playQuiz(game.quizSheet, event.target));
        } else {
            playButton.addEventListener('click', () => playGame(game.id));
        }
        card.appendChild(playButton);
        
        container.appendChild(card);
    });
}

function renderProfile() {
    document.querySelector("#profile h2").textContent = translations[currentLang].profile;
    document.getElementById("profile-user").textContent = `${translations[currentLang].user}: ${username}`;
    document.getElementById("stars-count").textContent = starsCount || translations[currentLang].noStars;
}

function renderPrizes() {
    const container = document.getElementById("prizes-list");
    container.innerHTML = "";
    document.querySelector("#prizes h2").textContent = translations[currentLang].prizesList;

    prizes.forEach(prize => {
        const card = document.createElement("div");
        card.className = "prize-card";
        
        const titleDiv = document.createElement("div");
        titleDiv.className = "prize-title";
        titleDiv.textContent = prize.title[currentLang];
        card.appendChild(titleDiv);

        const costP = document.createElement("p");
        costP.textContent = `⭐ ${prize.cost}`;
        card.appendChild(costP);

        const requestButton = document.createElement("button");
        requestButton.className = "play-btn";
        requestButton.textContent = translations[currentLang].prizeReq;
        requestButton.addEventListener('click', () => requestPrize(prize.id));
        card.appendChild(requestButton);
        
        container.appendChild(card);
    });
}

function playGame(gameId) {
    const game = games.find(g => g.id === gameId);
    if (game) {
        starsCount += game.starsReward;
        alert(`${translations[currentLang].play} ${game.title[currentLang]}! ${translations[currentLang].gameEarned} ${game.starsReward} ⭐`);
        renderProfile();
    }
}

function requestPrize(prizeId) {
    const prize = prizes.find(p => p.id === prizeId);
    if (prize) {
        if (starsCount >= prize.cost) {
            starsCount -= prize.cost;
            const successMsg = translations[currentLang].prizeSuccess.replace('{prizeTitle}', prize.title[currentLang]);
            alert(successMsg);
            renderProfile();
        } else {
            alert(translations[currentLang].notEnoughStars);
        }
    }
}

// --- Funzioni Quiz ---

async function loadAndProcessQuizData(quizSheet, gameButton) {
    if (gameButton) {
        gameButton.textContent = translations[currentLang].loadingQuiz;
        gameButton.disabled = true;
    }

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

// --- FIX #2 (Part 2): Accept the button element as a parameter ---
async function playQuiz(quizSheet, buttonElement) {
    quizState.currentQuizSheet = quizSheet;

    if (!quizConfig.questions[quizSheet] || !quizConfig.questions[quizSheet][currentLang]) {
        try {
            await loadAndProcessQuizData(quizSheet, buttonElement);
        } catch (error) {
            console.error("Fallito l'avvio del quiz a causa di errore di caricamento.");
            return;
        }
    }

    const questions = quizConfig.questions[quizSheet]?.[currentLang];
    if (!questions || questions.length === 0) {
        alert(translations[currentLang].quizDataMissing);
        console.warn(`Nessuna domanda disponibile per il quiz '${quizSheet}' in lingua '${currentLang}'.`);
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

    const container = document.getElementById("games-list");
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
                
                if (q.correctIndex !== 0) { 
                    highlightAnswer(q.correctIndex, 'btn-correct');
                } 

                setTimeout(() => {
                    if (q.explanation && q.correctIndex !== 0) {
                        alert(`Spiegazione: ${q.explanation}`);
                    }
                    nextQuizQuestion();
                }, 1500);
            }
        }
    }, 1000);
}

function updateTimerUI() {
    const timerDiv = document.getElementById("quiz-timer");
    if (timerDiv) {
        timerDiv.textContent = `⏳ ${quizState.timeLeft}s`;
    }
}

function handleAnswer(selectedIndex) {
    if (!quizState.answeringAllowed) return;

    quizState.answeringAllowed = false;
    clearInterval(quizState.timer);

    const questions = quizConfig.questions[quizState.currentQuizSheet]?.[currentLang] || [];
    const q = questions[quizState.currentIndex];
    const buttons = document.querySelectorAll("#quiz-answers button");

    buttons.forEach(btn => btn.disabled = true);

    const isImmediateResultQuiz = (q.correctIndex !== 0);
    let isCorrect = false;
    let pointsAwarded = 0;

    if (isImmediateResultQuiz) {
        isCorrect = (selectedIndex === q.correctIndex);
        if (isCorrect) {
            quizState.score += q.points || 0;
            pointsAwarded = q.points || 0;
            highlightAnswer(selectedIndex, 'btn-correct');
        } else {
            highlightAnswer(selectedIndex, 'btn-wrong');
            highlightAnswer(q.correctIndex, 'btn-correct');
        }
    } else {
        alert(translations[currentLang].answerRecorded);
        highlightAnswer(selectedIndex, 'btn-selected-1x2');
        isCorrect = false;
        pointsAwarded = 0;
    }

    submitAnswerData(
        quizState.currentQuizSheet,
        quizState.currentIndex,
        selectedIndex,
        q.correctIndex,
        isCorrect, 
        pointsAwarded,
        telegramUserId,
        telegramUsername,
        telegramFirstName,
        telegramLastName
    );

    setTimeout(() => {
        if (q.explanation && isImmediateResultQuiz) {
            alert(`Spiegazione: ${q.explanation}`);
        }
        nextQuizQuestion();
    }, 1500);
}

function highlightAnswer(index, className) {
    const buttons = document.querySelectorAll("#quiz-answers button");
    if (index >= 0 && index < buttons.length) {
        buttons[index].classList.add(className);
    }
}

function nextQuizQuestion() {
    quizState.currentIndex++;
    showQuizQuestion();
}

function showQuizResult(exitedEarly = false) {
    const container = document.getElementById("games-list");
    const totalQuestions = (quizConfig.questions[quizState.currentQuizSheet]?.[currentLang] || []).length;
    let message;

    if (exitedEarly) {
        message = `${translations[currentLang].quizScore} ${quizState.score} ${translations[currentLang].quizPoints} ${totalQuestions}.`;
        message += `<br>${translations[currentLang].quizExit}`;
    } else {
        message = `${translations[currentLang].quizScore} ${quizState.score} ${translations[currentLang].quizPoints} ${totalQuestions}.`;
    }

    container.innerHTML = `
        <div class="quiz-container">
            <h3>${translations[currentLang].quizFinish}</h3>
            <p>${translations[currentLang].quizPrizeText} ${quizConfig.prize}</p>
            <p>${message}</p>
            <button id="return-home-btn" class="play-btn">${translations[currentLang].quizExit}</button>
        </div>
    `;
    
    // --- FIX #3: Remove inline onclick and use addEventListener ---
    document.getElementById('return-home-btn').addEventListener('click', () => showSection('home'));

    clearInterval(quizState.timer);
    submitQuizResult(
        quizState.currentQuizSheet,
        quizState.score,
        totalQuestions,
        telegramUserId,
        telegramUsername,
        telegramFirstName,
        telegramLastName
    );

    quizState.currentQuizSheet = null;
}

async function sendDataToScript(data) {
    if (!telegramUserId) {
        console.warn("Invio dati: User ID non disponibile. Assicurati che l'app sia eseguita in Telegram.");
        // return { status: "error", message: "User ID non disponibile." };
        // We allow test users to proceed to avoid blocking dev
    }
    
    try {
        const response = await fetch(BASE_QUIZ_SHEET_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8', // Recommended by Google for Apps Script
            },
            body: JSON.stringify(data) // Send as JSON
        });

        if (!response.ok) {
            throw new Error(`Errore HTTP: ${response.statusText} (${response.status})`);
        }
        const result = await response.json();
        return result; 
    } catch (error) {
        console.error(`Errore di rete/server nell'invio dati (Action: ${data.action || 'N/A'}):`, error);
        return { status: "error", message: `Errore nell'invio dei dati: ${error.message}` };
    }
}

async function submitAnswerData(quizSheet, questionIndex, selectedAnswerIndex, correctAnswerIndex, isCorrect, pointsAwarded, userId, userName, firstName, lastName) {
    const data = { action: "submitAnswer", quizSheet, questionIndex, selectedAnswerIndex, correctAnswerIndex, isCorrect, pointsAwarded, userId, userName, firstName, lastName, timestamp: new Date().toISOString() };
    const result = await sendDataToScript(data);
    if (result.status === "success") {
        console.log("Dati risposta inviati con successo:", result.message);
    } else {
        console.error("Errore nell'invio dei dati risposta:", result.message);
    }
}

async function submitQuizResult(quizSheet, finalScore, totalQuestions, userId, userName, firstName, lastName) {
    const data = { action: "submitResult", quizSheet, finalScore, totalQuestions, userId, userName, firstName, lastName, timestamp: new Date().toISOString() };
    const result = await sendDataToScript(data);
    if (result.status === "success") {
        console.log("Risultato quiz finale inviato con successo:", result.message);
    } else {
        console.error("Errore nell'invio del risultato quiz finale:", result.message);
    }
}


// --- Event Listeners e Inizializzazione ---

function renderAll() {
    document.querySelectorAll(".btn-nav").forEach(btn => {
        btn.textContent = translations[currentLang][btn.dataset.section];
    });
    const activeSectionBtn = document.querySelector(".btn-nav.active"); 
    if (activeSectionBtn) {
        showSection(activeSectionBtn.dataset.section);
    } else {
        showSection("home");
    }
}

document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".btn-nav").forEach(btn => {
        btn.addEventListener("click", () => showSection(btn.dataset.section));
    });

    document.getElementById("lang-select").addEventListener("change", (e) => {
        currentLang = e.target.value;
        renderAll();
    });

    // Set the dropdown to the initial language
    document.getElementById("lang-select").value = currentLang;

    renderAll();
});
