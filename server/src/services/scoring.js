// Pure scoring logic — no database, so it is easy to unit test.

const round2 = (n) => Math.round(n * 100) / 100;

/**
 * @param {Array} answers     attempt.answers [{ question, section, selectedOption }]
 * @param {Map}   keyMap      questionId(string) -> { correctOption }
 * @param {Array} sections    test.sections [{ _id, title }]
 * @param {Object} marking    { correct, negative }
 * @returns {{ answers, result }}  answers with isCorrect filled + result summary
 */
function scoreAttempt(answers, keyMap, sections, marking) {
  const perSection = new Map(
    sections.map((s) => [String(s._id), { section: s._id, title: s.title, correct: 0, wrong: 0, skipped: 0, score: 0 }])
  );
  let correct = 0;
  let wrong = 0;
  let skipped = 0;

  const scored = answers.map((a) => {
    const key = keyMap.get(String(a.question));
    const sec = perSection.get(String(a.section));
    let isCorrect;

    if (!a.selectedOption) {
      skipped++;
      if (sec) sec.skipped++;
    } else if (key && a.selectedOption === key.correctOption) {
      isCorrect = true;
      correct++;
      if (sec) sec.correct++;
    } else {
      isCorrect = false;
      wrong++;
      if (sec) sec.wrong++;
    }
    return { ...a, isCorrect };
  });

  for (const s of perSection.values()) {
    s.score = round2(s.correct * marking.correct - s.wrong * marking.negative);
  }

  const attempted = correct + wrong;
  return {
    answers: scored,
    result: {
      score: round2(correct * marking.correct - wrong * marking.negative),
      maxScore: round2(answers.length * marking.correct),
      correct,
      wrong,
      skipped,
      accuracy: attempted ? Math.round((correct / attempted) * 100) : 0,
      sections: [...perSection.values()],
    },
  };
}

module.exports = { scoreAttempt, round2 };
