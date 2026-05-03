/**
 * QuizController.js
 * Owns all state and DOM rendering for the multiple-choice quiz mode.
 * Receives DOM element references on construction and exposes render() to
 * display a question with shuffled options, handles answer selection, and
 * tracks correct/wrong counts when test mode is active.
 */
import { shuffleArray } from './utils.js';

/**
 * QuizController
 * Owns all state and DOM rendering for the multiple-choice quiz mode.
 */
export default class QuizController {
  /** @type {Array} */
  #items = [];

  #correctCount = 0;
  #wrongCount = 0;

  /** @type {Object} DOM element references */
  #els;

  /**
   * @param {{
   *   quizQuestionText: HTMLElement,
   *   quizOptions: HTMLElement,
   *   quizResultBadge: HTMLElement,
   *   quizExplanation: HTMLElement,
   *   progressText: HTMLElement,
   *   helperText: HTMLElement,
   *   studyStatus: HTMLElement,
   *   prevButton: HTMLButtonElement,
   *   nextButton: HTMLButtonElement,
   *   correctCountSpan: HTMLElement,
   *   wrongCountSpan: HTMLElement,
   *   testModeToggle: HTMLInputElement
   * }} els
   */
  constructor(els) {
    this.#els = els;
  }

  /** True when at least one question is loaded. */
  get ready() {
    return this.#items.length > 0;
  }

  /** Current question array. */
  get items() {
    return this.#items;
  }

  /** Replace the question array. */
  set items(val) {
    this.#items = [...val];
  }

  get correctCount() { return this.#correctCount; }
  get wrongCount()   { return this.#wrongCount; }

  /** Reset score counters and update the DOM. */
  resetScore() {
    this.#correctCount = 0;
    this.#wrongCount = 0;
    this.#updateCounterDOM();
  }

  /**
   * Render the question at `index` into the DOM.
   * @param {number} index
   * @param {boolean} isTestMode
   * @returns {boolean} false if no items are loaded
   */
  render(index, isTestMode) {
    if (!this.ready) return false;

    const { quizQuestionText, quizOptions, quizResultBadge, quizExplanation,
            progressText, helperText, studyStatus, prevButton, nextButton } = this.#els;

    const q = this.#items[index];
    const shuffled = shuffleArray(
      q.options.map((opt, i) => ({ text: opt, isCorrect: i === q.correctIndex }))
    );

    quizQuestionText.textContent = q.question;
    progressText.textContent = `Question ${index + 1} of ${this.#items.length}`;
    helperText.textContent = "Choose the best answer.";
    studyStatus.classList.add("hidden");
    quizExplanation.classList.add("hidden");
    quizExplanation.textContent = "";
    quizResultBadge.className = "quiz-result hidden";
    quizResultBadge.textContent = "";
    prevButton.disabled = isTestMode || index === 0;
    nextButton.textContent = index === this.#items.length - 1 ? "Restart" : "Next";
    nextButton.disabled = false;

    quizOptions.innerHTML = "";
    shuffled.forEach((opt) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "quiz-option";
      btn.textContent = opt.text;
      btn.dataset.correct = String(opt.isCorrect);
      btn.addEventListener("click", () => this.#handleAnswer(btn, index));
      quizOptions.appendChild(btn);
    });

    return true;
  }

  /**
   * Handle a user clicking an answer option.
   * @param {HTMLButtonElement} selectedButton
   * @param {number} index
   */
  #handleAnswer(selectedButton, index) {
    const { quizOptions, quizResultBadge, quizExplanation, helperText, testModeToggle } = this.#els;
    const q = this.#items[index];
    const optionButtons = [...quizOptions.querySelectorAll(".quiz-option")];
    const correctButton = optionButtons.find((b) => b.dataset.correct === "true");
    const isCorrect = selectedButton.dataset.correct === "true";
    const inTestMode = testModeToggle && testModeToggle.checked;

    optionButtons.forEach((b) => { b.disabled = true; });
    if (correctButton) correctButton.classList.add("is-correct");

    if (isCorrect) {
      selectedButton.classList.add("is-correct");
      quizResultBadge.textContent = "✓";
      quizResultBadge.className = "quiz-result is-correct";
      helperText.textContent = "Correct. Use Next to continue.";
      quizExplanation.textContent = q.explanation;
      if (inTestMode) this.#correctCount += 1;
    } else {
      selectedButton.classList.add("is-wrong");
      quizResultBadge.textContent = "X";
      quizResultBadge.className = "quiz-result is-wrong";
      helperText.textContent = "Incorrect. Review the explanation, then continue.";
      quizExplanation.textContent = `Correct answer: ${q.options[q.correctIndex]}. ${q.explanation}`;
      if (inTestMode) this.#wrongCount += 1;
    }

    quizExplanation.classList.remove("hidden");
    this.#updateCounterDOM();
  }

  #updateCounterDOM() {
    const { correctCountSpan, wrongCountSpan } = this.#els;
    if (correctCountSpan) correctCountSpan.textContent = String(this.#correctCount);
    if (wrongCountSpan)   wrongCountSpan.textContent   = String(this.#wrongCount);
  }
}
