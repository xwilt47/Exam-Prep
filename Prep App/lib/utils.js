/**
 * utils.js
 * Shared utility functions used across the study app modules.
 */

/**
 * Returns a new array with elements in random order (Fisher-Yates).
 * @param {Array} items
 * @returns {Array}
 */
export function shuffleArray(items) {
  const shuffled = [...items];

  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}
