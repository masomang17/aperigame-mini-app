// --- CONFIGURAZIONE PRINCIPALE ---
const BASE_API_URL = 'https://script.google.com/macros/s/AKfycbz263cFtmATaZqWq2SWcSnb2a_TOW7sKAzyC-MavWV_IVNYUoc47JG18TuBSuKJJO6tVg/exec';
const IMAGE_BASE_URL = 'https://raw.githubusercontent.com/masomang17/aperigame-mini-app/main/miniapp/images/';

// --- TRADUZIONI ---
const translations = { /* ... invariate ... */ };

// --- STATO DELL'APPLICAZIONE ---
let currentLang = 'it';
let telegramUserId = null, username = "User", telegramFirstName = null, telegramLastName = null;
let shopItems = [], userProfile = { stars: 0, totalScore: 0, posizione: 'N/D' };
let quizConfig = { questions: [], title: "", prize: "" };
let quizState = { /* ... invariato ... */ };

// --- INIZIALIZZAZIONE ---
document.addEventListener("DOMContentLoaded", () => {
    // ... (invariato)
    loadInitialData();
});

// --- FUNZIONI DI CARICAMENTO DATI ---
async function loadInitialData() {
    renderAllUI();
    if (!telegramUserId) return;
    try {
        const [profileRes, shopRes] = await Promise.all([
            fetch(`${BASE_API_URL}?action=getProfile&userId=${telegramUserId}`),
            fetch(`${BASE_API_URL}?action=getShopItems&lang=${currentLang}`)
        ]);
        const profileData = await profileRes.json();
        if (profileData?.status === 'success') userProfile = profileData.data;
        const shopData = await shopRes.json();
        if (shopData?.status === 'success') shopItems = shopData.data;
    } catch (error) {
        console.error("Errore caricamento dati:", error);
    } finally {
        const activeSection = document.querySelector(".section.active")?.id || 'quiz';
        showSection(activeSection);
    }
}

async function sendDataToScript(data) { /* ... invariato ... */ }

// --- FUNZIONI DI RENDERING UI ---
function renderAllUI() { /* ... invariato ... */ }
function showSection(sectionId) { /* ... invariato ... */ }
function renderQuizPage() { /* ... invariato ... */ }
function renderPronosticiPage() { /* ... invariato ... */ }
function createPlayCard(containerId, titleKey, quizSheet) { /* ... invariato ... */ }

function renderProfile() {
    document.querySelector("#profile h2").textContent = translations[currentLang].profile;
    document.getElementById("profile-user").textContent = userProfile.username || username;
    document.getElementById("profile-rank").textContent = userProfile.posizione ? `${userProfile.posizione}°` : 'N/D';
    document.getElementById("profile-score").textContent = userProfile.totalScore || 0;
    document.getElementById("stars-count").textContent = userProfile.stars || 0;
}

function renderShop() { /* ... invariato ... */ }
async function requestPrize(prizeId, prizeCost, button) { /* ... invariato ... */ }

// --- LOGICA DEL QUIZ (tutto il resto del file è invariato) ---
async function playQuiz(quizSheet, buttonElement) { /* ... */ }
async function loadQuizData(quizSheet, buttonElement) { /* ... */ }
function showQuizQuestion() { /* ... */ }
function handleAnswer(selectedIndex) { /* ... */ }
async function endQuizSequence() { /* ... */ }
function showQuizResult(backendData) { /* ... */ }
function updateTimerUI() { /* ... */ }
