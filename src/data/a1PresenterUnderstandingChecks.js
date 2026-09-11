function check(questionDe, answerDe, noteEn = "") {
  return { questionDe, answerDe, noteEn };
}

const A1_PRESENTER_UNDERSTANDING_OVERRIDES = {
  "A1-13": [
    check("Why is es often used in German weather sentences?", "German commonly uses the impersonal subject es for weather expressions, for example: Es regnet."),
    check("What is the difference between ‘Es ist kalt’ and ‘Es regnet’?", "Es ist kalt uses sein + an adjective; Es regnet uses a weather verb."),
    check("How do you ask about the weather in German?", "A common A1 question is: Wie ist das Wetter?"),
    check("How do you express temperature in German?", "Use Grad with a number, for example: Es sind 30 Grad."),
    check("Which structure would you use with sonnig, windig or bewölkt?", "Use es ist + adjective, for example: Es ist sonnig, windig oder bewölkt."),
    check("Which structure would you use with regnen or schneien?", "Use the conjugated weather verb with es, for example: Es regnet or Es schneit."),
    check("How can you say that it is 25 degrees and sunny?", "For example: Es sind 25 Grad und es ist sonnig."),
    check("What is the difference between warm and heiß when describing weather?", "Both describe high temperature, but heiß is stronger than warm."),
    check("How can you make a short weather description more informative?", "Combine temperature with one or two weather details, for example: Es sind 20 Grad. Es ist bewölkt und windig."),
    check("If someone says ‘Es ist Sonne’, what should you correct?", "Use an adjective or a suitable weather expression: Es ist sonnig or Die Sonne scheint."),
    check("Give a two-sentence weather report for today without looking at the notes.", "A suitable answer gives the temperature and at least one weather condition, for example: Heute sind es 28 Grad. Es ist sonnig und warm."),
  ],
};

export function getA1PresenterUnderstandingChecks(assignmentId, fallbackChecks = []) {
  const key = String(assignmentId || "").trim().toUpperCase();
  const override = A1_PRESENTER_UNDERSTANDING_OVERRIDES[key];
  if (Array.isArray(override) && override.length) return override;
  return Array.isArray(fallbackChecks) ? fallbackChecks : [];
}

export { A1_PRESENTER_UNDERSTANDING_OVERRIDES };
