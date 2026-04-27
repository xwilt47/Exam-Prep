const introScreen = document.getElementById("introScreen");
const studyScreen = document.getElementById("studyScreen");
const introStatus = document.getElementById("introStatus");
const studyStatus = document.getElementById("studyStatus");
const quizExplanation = document.getElementById("quizExplanation");
const cardCount = document.getElementById("cardCount");
const quizCount = document.getElementById("quizCount");
const progressText = document.getElementById("progressText");
const helperText = document.getElementById("helperText");
const questionText = document.getElementById("questionText");
const answerText = document.getElementById("answerText");
const quizQuestionText = document.getElementById("quizQuestionText");
const quizOptions = document.getElementById("quizOptions");
const quizWrap = document.getElementById("quizWrap");
const quizResultBadge = document.getElementById("quizResultBadge");
const flashcard = document.getElementById("flashcard");
const startButton = document.getElementById("startButton");
const quizButton = document.getElementById("quizButton");
const backButton = document.getElementById("backButton");
const prevButton = document.getElementById("prevButton");
const nextButton = document.getElementById("nextButton");

let flashcards = [];
let multipleChoiceQuestions = [];
let currentIndex = 0;
let activeMode = "flashcards";
let flashcardsReady = false;
let multipleChoiceReady = false;

function getMissingDatasetMessage(mode) {
  return mode === "multiple-choice"
    ? "Oops, no multiple-choice JSON was detected. Add multiple-choice.json and reload the page."
    : "Oops, no flashcard JSON was detected. Add flashcards.json and reload the page.";
}

function shuffleArray(items) {
  const shuffledItems = [...items];

  for (let index = shuffledItems.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    const currentValue = shuffledItems[index];

    shuffledItems[index] = shuffledItems[randomIndex];
    shuffledItems[randomIndex] = currentValue;
  }

  return shuffledItems;
}

function updateModeButtonState(button, isReady) {
  button.disabled = !isReady;
  button.classList.toggle("is-ready", isReady);
}

async function loadDataset(path, key) {
  try {
    const response = await fetch(path, { cache: "no-store" });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    if (!Array.isArray(data[key]) || data[key].length === 0) {
      throw new Error(`No ${key} found in JSON.`);
    }

    return data[key];
  } catch (error) {
    console.error(`Unable to load ${key}:`, error);
    return [];
  }
}

async function loadStudyData() {
  const [loadedFlashcards, loadedQuestions] = await Promise.all([
    loadDataset("./flashcards.json", "flashcards"),
    loadDataset("./multiple-choice.json", "multipleChoice")
  ]);

  flashcards = loadedFlashcards;
  multipleChoiceQuestions = loadedQuestions;
  flashcardsReady = flashcards.length > 0;
  multipleChoiceReady = multipleChoiceQuestions.length > 0;

  updateModeButtonState(startButton, flashcardsReady);
  updateModeButtonState(quizButton, multipleChoiceReady);
  cardCount.textContent = `${flashcards.length} flashcards ready`;
  quizCount.textContent = `${multipleChoiceQuestions.length} quiz questions ready`;

  if (flashcardsReady && multipleChoiceReady) {
    introStatus.textContent = "Flashcards and multiple choice are ready.";
  } else if (flashcardsReady) {
    introStatus.textContent = `Flashcards are ready. ${getMissingDatasetMessage("multiple-choice")}`;
  } else if (multipleChoiceReady) {
    introStatus.textContent = `Multiple choice is ready. ${getMissingDatasetMessage("flashcards")}`;
  } else {
    introStatus.textContent = "Oops, no study JSON was detected. Add flashcards.json or multiple-choice.json and reload the page.";
  }

  if (flashcardsReady) {
    activeMode = "flashcards";
    renderStudyView();
  } else if (multipleChoiceReady) {
    activeMode = "multiple-choice";
    renderStudyView();
  } else {
    showStudyError("Oops, no study JSON was detected.");
  }
}

function getActiveItems() {
  return activeMode === "flashcards" ? flashcards : multipleChoiceQuestions;
}

function renderFlashcard() {
  const items = getActiveItems();

  if (!flashcardsReady || items.length === 0) {
    showStudyError("Oops, no flashcards are available.");
    return;
  }

  const currentCard = items[currentIndex];
  questionText.textContent = currentCard.question;
  answerText.textContent = currentCard.answer;
  progressText.textContent = `Card ${currentIndex + 1} of ${items.length}`;
  helperText.textContent = "Click the card to reveal the answer.";
  flashcard.classList.remove("is-flipped");
  flashcard.disabled = false;
  studyStatus.classList.add("hidden");
  quizExplanation.classList.add("hidden");
  prevButton.disabled = currentIndex === 0;
  nextButton.textContent = currentIndex === items.length - 1 ? "Restart" : "Next";
}

function renderMultipleChoice() {
  const items = getActiveItems();

  if (!multipleChoiceReady || items.length === 0) {
    showStudyError(getMissingDatasetMessage("multiple-choice"));
    return;
  }

  const currentQuestion = items[currentIndex];
  const shuffledOptions = shuffleArray(
    currentQuestion.options.map((option, index) => ({
      text: option,
      isCorrect: index === currentQuestion.correctIndex
    }))
  );

  quizQuestionText.textContent = currentQuestion.question;
  progressText.textContent = `Question ${currentIndex + 1} of ${items.length}`;
  helperText.textContent = "Choose the best answer.";
  studyStatus.classList.add("hidden");
  quizExplanation.classList.add("hidden");
  quizExplanation.textContent = "";
  quizResultBadge.className = "quiz-result hidden";
  quizResultBadge.textContent = "";
  prevButton.disabled = currentIndex === 0;
  nextButton.textContent = currentIndex === items.length - 1 ? "Restart" : "Next";
  nextButton.disabled = false;

  quizOptions.innerHTML = "";

  shuffledOptions.forEach((option) => {
    const optionButton = document.createElement("button");
    optionButton.type = "button";
    optionButton.className = "quiz-option";
    optionButton.textContent = option.text;
    optionButton.dataset.correct = String(option.isCorrect);
    optionButton.addEventListener("click", () => handleQuizAnswer(optionButton));
    quizOptions.appendChild(optionButton);
  });
}

function renderStudyView() {
  flashcard.classList.add("hidden");
  quizWrap.classList.add("hidden");
  questionText.textContent = "";
  answerText.textContent = "";
  flashcard.classList.remove("is-flipped");

  if (activeMode === "flashcards") {
    flashcard.classList.remove("hidden");
    renderFlashcard();
    return;
  }

  quizWrap.classList.remove("hidden");
  renderMultipleChoice();
}

function handleQuizAnswer(selectedButton) {
  const currentQuestion = multipleChoiceQuestions[currentIndex];
  const optionButtons = [...quizOptions.querySelectorAll(".quiz-option")];
  const correctButton = optionButtons.find((button) => button.dataset.correct === "true");
  const isCorrect = selectedButton.dataset.correct === "true";

  optionButtons.forEach((button) => {
    button.disabled = true;
  });

  if (correctButton) {
    correctButton.classList.add("is-correct");
  }

  if (isCorrect) {
    selectedButton.classList.add("is-correct");
    quizResultBadge.textContent = "✓";
    quizResultBadge.className = "quiz-result is-correct";
    helperText.textContent = "Correct. Use Next to continue.";
    quizExplanation.textContent = currentQuestion.explanation;
  } else {
    selectedButton.classList.add("is-wrong");
    quizResultBadge.textContent = "X";
    quizResultBadge.className = "quiz-result is-wrong";
    helperText.textContent = "Incorrect. Review the explanation, then continue.";
    quizExplanation.textContent = `Correct answer: ${currentQuestion.options[currentQuestion.correctIndex]}. ${currentQuestion.explanation}`;
  }

  quizExplanation.classList.remove("hidden");
}

function showStudyError(message) {
  questionText.textContent = "No questions loaded";
  answerText.textContent = "Check your JSON file";
  quizQuestionText.textContent = "No questions loaded";
  quizOptions.innerHTML = "";
  progressText.textContent = "Card 0 of 0";
  helperText.textContent = message;
  studyStatus.textContent = message;
  studyStatus.classList.remove("hidden");
  quizExplanation.classList.add("hidden");
  quizResultBadge.className = "quiz-result hidden";
  flashcard.classList.remove("is-flipped");
  flashcard.disabled = true;
  prevButton.disabled = true;
  nextButton.disabled = true;
}

function goToStudyMode(mode) {
  activeMode = mode;
  currentIndex = 0;
  introScreen.classList.add("hidden");
  studyScreen.classList.remove("hidden");

  if (mode === "flashcards" && flashcardsReady) {
    nextButton.disabled = false;
    renderStudyView();
  } else if (mode === "multiple-choice" && multipleChoiceReady) {
    nextButton.disabled = false;
    renderStudyView();
  } else {
    showStudyError(getMissingDatasetMessage(mode));
  }
}

function goToIntroMode() {
  studyScreen.classList.add("hidden");
  introScreen.classList.remove("hidden");
}

function showNextCard() {
  const items = getActiveItems();

  if (items.length === 0) {
    return;
  }

  if (currentIndex === items.length - 1) {
    currentIndex = 0;
  } else {
    currentIndex += 1;
  }

  renderStudyView();
}

function showPreviousCard() {
  const items = getActiveItems();

  if (items.length === 0 || currentIndex === 0) {
    return;
  }

  currentIndex -= 1;
  renderStudyView();
}

flashcard.addEventListener("click", () => {
  if (activeMode !== "flashcards" || !flashcardsReady) {
    return;
  }

  const isFlipped = flashcard.classList.toggle("is-flipped");
  helperText.textContent = isFlipped ? "Answer revealed. Use Next to continue." : "Click the card to reveal the answer.";
});

startButton.addEventListener("click", () => goToStudyMode("flashcards"));
quizButton.addEventListener("click", () => goToStudyMode("multiple-choice"));
backButton.addEventListener("click", goToIntroMode);
nextButton.addEventListener("click", showNextCard);
prevButton.addEventListener("click", showPreviousCard);

loadStudyData();