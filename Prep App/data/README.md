# data/

Place JSON files in the appropriate subfolders and register them in `index.json` to make them selectable in the app.
When a mode has more than one file listed, a dropdown appears on the intro screen.

---

## index.json

Lists which files belong to each mode. Files are relative to the `data/` directory — include subfolder paths when you store datasets in subfolders.

Example with subfolders:

```json
{
  "flashcards": ["flashcards/flashcards.json", "flashcards/kcna-deck.json"],
  "multipleChoice": ["multiple_choice/multiple-choice.json", "multiple_choice/kcna-quiz.json"]
}
```

---

## Flashcard file format

Store flashcard datasets inside `data/flashcards/`.

```json
{
  "label": "Human-readable name shown in the dropdown",
  "flashcards": [
    {
      "question": "Question text shown on the card front",
      "answer": "Answer text shown on the card back"
    }
  ]
}
```

---

## Multiple-choice file format

Store multiple-choice datasets inside `data/multiple_choice/`.

```json
{
  "label": "Human-readable name shown in the dropdown",
  "multipleChoice": [
    {
      "question": "Question text",
      "answer": "Correct answer text (informational only)",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Explanation shown to the user after they answer."
    }
  ]
}
```

`correctIndex` is the 0-based index of the correct answer in the `options` array.
Options are shuffled on each render, so `correctIndex` always refers to the original order above.
