/**
 * FlashcardController.js
 * Owns all state and DOM rendering for the flashcard study mode.
 * Receives a set of DOM element references on construction and exposes
 * render() to display a card at a given index, and flip() to toggle
 * the card between question and answer sides.
 */
export default class FlashcardController {
  /** @type {Array} */
  #items = [];

  /** @type {Object} DOM element references */
  #els;

  /**
   * @param {{
   *   flashcardEl: HTMLElement,
   *   questionText: HTMLElement,
   *   answerText: HTMLElement,
   *   progressText: HTMLElement,
   *   helperText: HTMLElement,
   *   studyStatus: HTMLElement,
   *   quizExplanation: HTMLElement,
   *   prevButton: HTMLButtonElement,
   *   nextButton: HTMLButtonElement
   * }} els
   */
  constructor(els) {
    this.#els = els;
  }

  /** True when at least one flashcard is loaded. */
  get ready() {
    return this.#items.length > 0;
  }

  /** Current flashcard array. */
  get items() {
    return this.#items;
  }

  /** Replace the flashcard array. */
  set items(val) {
    this.#items = [...val];
  }

  /**
   * Render the card at `index` into the DOM.
   * @param {number} index
   * @param {boolean} isTestMode
   * @returns {boolean} false if no items are loaded
   */
  render(index, isTestMode) {
    if (!this.ready) return false;

    const { flashcardEl, questionText, answerText, progressText, helperText,
            studyStatus, quizExplanation, prevButton, nextButton } = this.#els;

    const card = this.#items[index];

    questionText.textContent = card.question;
    answerText.textContent = card.answer;
    progressText.textContent = `Card ${index + 1} of ${this.#items.length}`;
    helperText.textContent = "Click the card to reveal the answer.";
    flashcardEl.classList.remove("is-flipped");
    flashcardEl.disabled = false;
    studyStatus.classList.add("hidden");
    quizExplanation.classList.add("hidden");
    prevButton.disabled = isTestMode || index === 0;
    nextButton.textContent = index === this.#items.length - 1 ? "Restart" : "Next";

    return true;
  }

  /**
   * Toggle the flip state of the flashcard element.
   * @param {HTMLButtonElement} flashcardEl
   * @param {HTMLElement} helperText
   */
  flip(flashcardEl, helperText) {
    const isFlipped = flashcardEl.classList.toggle("is-flipped");
    helperText.textContent = isFlipped
      ? "Answer revealed. Use Next to continue."
      : "Click the card to reveal the answer.";
  }
}
