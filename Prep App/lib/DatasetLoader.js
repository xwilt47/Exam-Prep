/**
 * DatasetLoader.js
 * Handles all data-fetching logic for the study app.
 * Loads data/index.json to discover available chapter files, then fetches
 * each flashcard and multiple-choice JSON file in parallel.
 * Exported as the default class; construct with an optional basePath.
 */
export default class DatasetLoader {
  constructor(basePath = './data') {
    this.basePath = basePath.replace(/\/+$/,'');
  }

  async loadIndex() {
    try {
      const resp = await fetch(`${this.basePath}/index.json`, { cache: 'no-store' });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const index = await resp.json();
      if (!Array.isArray(index.flashcards) || !Array.isArray(index.multipleChoice)) {
        throw new Error('Invalid index.json structure.');
      }
      return index;
    } catch (err) {
      console.warn('DatasetLoader: failed to load index.json, using fallback', err);
      return { flashcards: ['flashcards.json'], multipleChoice: ['multiple-choice.json'] };
    }
  }

  async loadDatasetFile(filename, key) {
    const path = `${this.basePath}/${filename}`;

    try {
      const response = await fetch(path, { cache: 'no-store' });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      let items = [];

      if (Array.isArray(data[key])) {
        items = data[key];
      } else if (key === 'flashcards') {
        if (Array.isArray(data.flashcard)) items = data.flashcard;
        else if (Array.isArray(data.cards)) items = data.cards;
      } else if (key === 'multipleChoice') {
        if (Array.isArray(data.multiple_choice)) items = data.multiple_choice;
        else if (Array.isArray(data.questions)) items = data.questions;
      }

      if (!items.length && Array.isArray(data)) {
        items = data;
      }

      const label = typeof data.label === 'string' && data.label.trim()
        ? data.label.trim()
        : filename.replace('.json', '');

      if (!items.length) {
        console.warn(`No items found for ${filename} using key '${key}'; parsed keys: ${Object.keys(data).join(', ')}`);
      }

      return { label, file: filename, items };
    } catch (error) {
      console.error(`DatasetLoader: Unable to load ${path}:`, error);
      return { label: filename.replace('.json', ''), file: filename, items: [] };
    }
  }

  async loadStudyData() {
    const index = await this.loadIndex();

    const [fcSets, mcSets] = await Promise.all([
      Promise.all(index.flashcards.map((f) => this.loadDatasetFile(`flashcards/${f}`, 'flashcards'))),
      Promise.all(index.multipleChoice.map((f) => this.loadDatasetFile(`multiple_choice/${f}`, 'multipleChoice')))
    ]);

    return { flashcards: fcSets, multipleChoice: mcSets };
  }
}
