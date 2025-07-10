const quizData = {
    it: [
      {
        question: "Qual è la capitale d'Italia?",
        answers: ["Roma", "Milano", "Napoli", "Torino"],
        correct: 0
      },
      {
        question: "Quante stelle ci sono nella bandiera europea?",
        answers: ["10", "12", "15", "8"],
        correct: 1
      }
    ],
    en: [
      {
        question: "What is the capital of Italy?",
        answers: ["Rome", "Milan", "Naples", "Turin"],
        correct: 0
      },
      {
        question: "How many stars are on the European flag?",
        answers: ["10", "12", "15", "8"],
        correct: 1
      }
    ],
    es: [
      {
        question: "¿Cuál es la capital de Italia?",
        answers: ["Roma", "Milán", "Nápoles", "Turín"],
        correct: 0
      },
      {
        question: "¿Cuántas estrellas hay en la bandera europea?",
        answers: ["10", "12", "15", "8"],
        correct: 1
      }
    ]
  };
  
  let currentQuizIndex = 0;
  let score = 0;
  let quizTimer;
  let timeLeft = 15; // secondi per domanda
  const timePerQuestion = 15;
  
  const questionEl = document.getElementById("question");
  const answersEl = document.getElementById("answers");
  const timerEl = document.getElementById("timer");
  const nextBtn = document.getElementById("next-btn");
  const scoreEl = document.getElementById("score");
  
  function startQuiz() {
    currentQuizIndex = 0;
    score = 0;
    timeLeft = timePerQuestion;
    scoreEl.style.display = "none";
    nextBtn.style.display = "none";
    renderQuestion();
    startTimer();
  }
  
  function renderQuestion() {
    const quiz = quizData[currentLang][currentQuizIndex];
    questionEl.textContent = quiz.question;
    answersEl.innerHTML = "";
    quiz.answers.forEach((answer, i) => {
      const btn = document.createElement("button");
      btn.className = "play-btn";
      btn.textContent = answer;
      btn.onclick = () => selectAnswer(i);
      answersEl.appendChild(btn);
    });
    timerEl.textContent = `⏰ ${timeLeft}s`;
  }
  
  function selectAnswer(selectedIndex) {
    clearInterval(quizTimer);
    const quiz = quizData[currentLang][currentQuizIndex];
    const buttons = answersEl.querySelectorAll("button");
    buttons.forEach((btn, i) => {
      btn.disabled = true;
      if (i === quiz.correct) btn.style.backgroundColor = "#4caf50"; // verde
      else if (i === selectedIndex) btn.style.backgroundColor = "#f44336"; // rosso
    });
    if (selectedIndex === quiz.correct) {
      score++;
    }
    nextBtn.style.display = "inline-block";
  }
  
  function startTimer() {
    timeLeft = timePerQuestion;
    timerEl.textContent = `⏰ ${timeLeft}s`;
    quizTimer = setInterval(() => {
      timeLeft--;
      timerEl.textContent = `⏰ ${timeLeft}s`;
      if (timeLeft <= 0) {
        clearInterval(quizTimer);
        selectAnswer(-1); // nessuna risposta, mostra corretta
        nextBtn.style.display = "inline-block";
      }
    }, 1000);
  }
  
  nextBtn.onclick = () => {
    currentQuizIndex++;
    if (currentQuizIndex < quizData[currentLang].length) {
      renderQuestion();
      startTimer();
      nextBtn.style.display = "none";
    } else {
      showScore();
    }
  };
  
  function showScore() {
    questionEl.textContent = "";
    answersEl.innerHTML = "";
    timerEl.textContent = "";
    nextBtn.style.display = "none";
    scoreEl.style.display = "block";
    scoreEl.textContent = `🎉 ${translations[currentLang].user}, hai totalizzato ${score} su ${quizData[currentLang].length}!`;
  }
  