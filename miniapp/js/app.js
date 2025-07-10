// *** IL TUO URL DI DEPLOYMENT ESATTO DEL GOOGLE APPS SCRIPT ***
const BASE_API_URL = 'https://script.google.com/macros/s/AKfycbxk0gSMb81D7b4pdh8hXruvlFwuFRiJGB74XUAxjRVstEmtTwSR6CE_ExIKv0d9De5wBw/exec';

// --- MODIFICA: Nuove traduzioni per la navigazione e le sezioni ---
const translations = {
    it: {
        quiz: "Quiz",
        tip: "Consigli", // o "Categorie"
        profile: "Profilo",
        shop: "Premi",
        play: "Gioca Ora",
        user: "Utente",
        noStars: "0",
        prizeReq: "Riscatta",
        prizeCost: "Costo:",
        notEnoughStars: "Non hai abbastanza stelle per questo premio.",
        prizeSuccess: "Premio '{prizeTitle}' richiesto con successo!",
        // ... (vengono mantenute le altre traduzioni dei quiz)
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

if (window.Telegram && window.Telegram.WebApp) {
    Telegram.WebApp.ready();
    const initData = Telegram.WebApp.initDataUnsafe || {};
    const user = initData.user || {};

    telegramUserId = user.id || null;
    if (user.username) {
        username = `@${user.username}`;
    } else if (user.first_name) {
        username = user.first_name + (user.last_name ? ` ${user.last_name}` : '');
    } else if (telegramUserId) {
        username = "User " + telegramUserId;
    }
} else {
    console.warn("SDK Telegram non disponibile. Uso dati di test.");
    telegramUserId = "test_user_123";
    username = "TestUser";
}

// --- MODIFICA: i dati dello shop e del profilo verranno caricati qui ---
let shopItems = [];
let userProfile = { stars: 0 };

// --- MODIFICA: Rimosso l'array statico 'games' e 'prizes' ---

let quizConfig = { /* ... (invariato) ... */ };
let quizState = { /* ... (invariato) ... */ };


// --- Funzioni UI Generali ---
function showSection(sectionId) {
    document.querySelectorAll(".section").forEach(sec => sec.classList.remove("active"));
    const activeSection = document.getElementById(sectionId);
    if (activeSection) activeSection.classList.add("active");

    document.querySelectorAll(".btn-nav").forEach(btn => btn.classList.toggle("active", btn.dataset.section === sectionId));
    
    // --- MODIFICA: Logica per renderizzare la sezione corretta ---
    switch(sectionId) {
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

// --- MODIFICA: Nuove funzioni per renderizzare le pagine "Quiz" e "Tip" ---
function createPlayCard(containerId, titleKey, quizSheet) {
    const container = document.getElementById(containerId);
    container.innerHTML = `
        <div class="game-card" id="play-card-${quizSheet}">
            <div class="game-title">${translations[currentLang][titleKey]}</div>
            <button class="play-btn">${translations[currentLang].play}</button>
        </div>
    `;
    container.querySelector('.play-btn').addEventListener('click', (event) => {
        // Nasconde la card e avvia il quiz
        document.getElementById(`play-card-${quizSheet}`).style.display = 'none';
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

// --- MODIFICA: Funzione per renderizzare lo shop con dati dinamici ---
function renderShop() {
    document.querySelector("#shop h2").textContent = translations[currentLang].shop;
    const container = document.getElementById("shop-list");
    container.innerHTML = ""; // Pulisce

    if (shopItems.length === 0) {
        container.innerHTML = `<p>Nessun premio disponibile al momento.</p>`;
        return;
    }

    shopItems.forEach(prize => {
        const card = document.createElement("div");
        card.className = "prize-card";
        
        const titleDiv = document.createElement("div");
        titleDiv.className = "prize-title";
        // Usa il titolo nella lingua corrente, con fallback su 'it'
        titleDiv.textContent = prize[`title_${currentLang}`] || prize.title_it;
        card.appendChild(titleDiv);

        const costP = document.createElement("p");
        costP.textContent = `${translations[currentLang].prizeCost} ⭐ ${prize.cost}`;
        card.appendChild(costP);

        const requestButton = document.createElement("button");
        requestButton.className = "play-btn";
        requestButton.textContent = translations[currentLang].prizeReq;
        requestButton.addEventListener('click', () => requestPrize(prize.prize_id, prize.cost));
        card.appendChild(requestButton);
        
        container.appendChild(card);
    });
}

// --- MODIFICA: Funzione per richiedere un premio, ora comunica con il backend ---
async function requestPrize(prizeId, prizeCost) {
    if (userProfile.stars < prizeCost) {
        alert(translations[currentLang].notEnoughStars);
        return;
    }

    // Disabilita temporaneamente il bottone per evitare doppi click
    const button = event.target;
    button.disabled = true;

    const result = await sendDataToScript({
        action: 'redeemPrize',
        userId: telegramUserId,
        prizeId: prizeId,
        prizeCost: prizeCost
    });

    if (result && result.status === 'success') {
        // Aggiorna le stelle dell'utente localmente
        userProfile.stars = result.newStars;
        renderProfile(); // Aggiorna la vista del profilo
        alert(translations[currentLang].prizeSuccess.replace('{prizeTitle}', result.prizeTitle));
    } else {
        alert(result.message || "Errore nella richiesta del premio.");
    }

    button.disabled = false;
}

// --- Funzioni Quiz (in gran parte invariate, ma aggiornate per la nuova struttura) ---

async function loadAndProcessQuizData(quizSheet, gameButton) {
    // ... (questa funzione rimane identica alla versione precedente)
}

async function playQuiz(quizSheet) {
    quizState.currentQuizSheet = quizSheet;

    const quizContainer = document.getElementById(quizSheet === 'quiz' ? 'quiz-content' : 'tip-content');
    
    if (!quizConfig.questions[quizSheet] || !quizConfig.questions[quizSheet][currentLang]) {
        try {
            await loadAndProcessQuizData(quizSheet);
        } catch (error) {
            console.error("Fallito l'avvio del quiz a causa di errore di caricamento.");
            showSection(quizSheet); // Torna alla pagina della sezione in caso di errore
            return;
        }
    }
    
    // ... (il resto della logica di playQuiz, showQuizQuestion etc. rimane invariata)
}

// ... INCOLLA QUI TUTTE LE TUE FUNZIONI QUIZ ESISTENTI ...
// loadAndProcessQuizData, playQuiz, showQuizQuestion, updateTimerUI, handleAnswer, 
// highlightAnswer, nextQuizQuestion, showQuizResult, submitAnswerData, submitQuizResult
// Assicurati che `playQuiz` non accetti più il `buttonElement` come parametro


// --- MODIFICA: Funzioni per caricare i dati all'avvio ---
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
        const shopData = await shopRes.json();

        if (profileData && profileData.status === 'success') {
            userProfile = profileData.data;
        }

        if (shopData && shopData.status === 'success') {
            shopItems = shopData.data;
        }

    } catch (error) {
        console.error("Errore nel caricamento dei dati iniziali:", error);
        alert("Impossibile caricare i dati del profilo e dei premi. Controlla la connessione.");
    } finally {
        renderAll(); // Renderizza l'app anche in caso di errore
    }
}


async function sendDataToScript(data) {
    // ... (questa funzione rimane identica alla versione precedente)
}


// --- Event Listeners e Inizializzazione ---
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

    // --- MODIFICA: Carica i dati prima di renderizzare ---
    loadInitialData();
});
