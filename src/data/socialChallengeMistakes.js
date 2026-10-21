// Original Falowen social-media correction prompts, independently editable and reusable.
export const CHALLENGE_MISTAKES = [
  {
    "level": "A1",
    "topic": "Age",
    "incorrect": "Ich bin 25 Jahre.",
    "correct": "Ich bin 25 Jahre alt.",
    "explanation": "For age, German requires “Jahre alt”."
  },
  {
    "level": "A1",
    "topic": "Accusative article",
    "incorrect": "Ich habe ein Hund.",
    "correct": "Ich habe einen Hund.",
    "explanation": "“Hund” is masculine; after “haben” use accusative “einen”."
  },
  {
    "level": "A1",
    "topic": "Origin",
    "incorrect": "Ich komme von Ghana.",
    "correct": "Ich komme aus Ghana.",
    "explanation": "Use “aus” to say which country you come from."
  },
  {
    "level": "A1",
    "topic": "Verb conjugation",
    "incorrect": "Du komme aus Berlin.",
    "correct": "Du kommst aus Berlin.",
    "explanation": "For “du”, use “kommst”."
  },
  {
    "level": "A1",
    "topic": "Negation",
    "incorrect": "Ich habe nicht Geschwister.",
    "correct": "Ich habe keine Geschwister.",
    "explanation": "With the plural noun “Geschwister”, use “keine”."
  },
  {
    "level": "A1",
    "topic": "Time expressions",
    "incorrect": "Wir treffen uns in 18 Uhr.",
    "correct": "Wir treffen uns um 18 Uhr.",
    "explanation": "Use “um” for a specific clock time."
  },
  {
    "level": "A1",
    "topic": "Question order",
    "incorrect": "Wo du arbeitest?",
    "correct": "Wo arbeitest du?",
    "explanation": "In a direct question, the finite verb follows the question word."
  },
  {
    "level": "A1",
    "topic": "Possessive pronouns",
    "incorrect": "Das ist meine Vater.",
    "correct": "Das ist mein Vater.",
    "explanation": "“Vater” is masculine: “mein Vater”."
  },
  {
    "level": "A2",
    "topic": "Perfect tense",
    "incorrect": "Ich bin das Buch gelesen.",
    "correct": "Ich habe das Buch gelesen.",
    "explanation": "“Lesen” takes “haben” in Perfekt."
  },
  {
    "level": "A2",
    "topic": "Dative after mit",
    "incorrect": "Ich fahre mit den Bus.",
    "correct": "Ich fahre mit dem Bus.",
    "explanation": "“Mit” always takes the dative; masculine “Bus” becomes “dem Bus”."
  },
  {
    "level": "A2",
    "topic": "Subordinate clause",
    "incorrect": "Ich gehe schlafen, weil ich bin müde.",
    "correct": "Ich gehe schlafen, weil ich müde bin.",
    "explanation": "“Weil” sends the conjugated verb to the end."
  },
  {
    "level": "A2",
    "topic": "Separable verbs",
    "incorrect": "Sie aufsteht um sieben Uhr.",
    "correct": "Sie steht um sieben Uhr auf.",
    "explanation": "In a main clause, the separable prefix moves to the end."
  },
  {
    "level": "A2",
    "topic": "Comparison",
    "incorrect": "Mein Auto ist schneller wie deins.",
    "correct": "Mein Auto ist schneller als deins.",
    "explanation": "Use “als” after a comparative adjective."
  },
  {
    "level": "A2",
    "topic": "Dative after zu",
    "incorrect": "Ich gehe zu meine Schwester.",
    "correct": "Ich gehe zu meiner Schwester.",
    "explanation": "“Zu” requires dative: “meiner Schwester”."
  },
  {
    "level": "A2",
    "topic": "Reflexive pronouns",
    "incorrect": "Ich freue mich über dein Besuch.",
    "correct": "Ich freue mich über deinen Besuch.",
    "explanation": "“Besuch” is masculine and “über” takes the accusative here."
  },
  {
    "level": "A2",
    "topic": "Case with location",
    "incorrect": "Das Bild hängt an die Wand.",
    "correct": "Das Bild hängt an der Wand.",
    "explanation": "With a static location, “an” takes dative: “der Wand”."
  },
  {
    "level": "B1",
    "topic": "Although",
    "incorrect": "Obwohl ich müde bin, ich lerne weiter.",
    "correct": "Obwohl ich müde bin, lerne ich weiter.",
    "explanation": "After a subordinate clause, the main clause starts with the finite verb."
  },
  {
    "level": "B1",
    "topic": "Passive voice",
    "incorrect": "Das Essen wird kochen.",
    "correct": "Das Essen wird gekocht.",
    "explanation": "Passive present uses “werden” + past participle."
  },
  {
    "level": "B1",
    "topic": "Relative clause",
    "incorrect": "Der Mann, der ich kenne, ist nett.",
    "correct": "Der Mann, den ich kenne, ist nett.",
    "explanation": "“Kennen” takes accusative, so use “den”."
  },
  {
    "level": "B1",
    "topic": "Infinitive with zu",
    "incorrect": "Ich hoffe, dich bald sehen.",
    "correct": "Ich hoffe, dich bald zu sehen.",
    "explanation": "After “hoffen” in this infinitive clause, use “zu sehen”."
  },
  {
    "level": "B1",
    "topic": "Purpose",
    "incorrect": "Ich lerne, um die Prüfung bestehen.",
    "correct": "Ich lerne, um die Prüfung zu bestehen.",
    "explanation": "Purpose is expressed with “um ... zu” + infinitive."
  },
  {
    "level": "B1",
    "topic": "Connector pair",
    "incorrect": "Je mehr ich übe, desto ich besser spreche.",
    "correct": "Je mehr ich übe, desto besser spreche ich.",
    "explanation": "In a “desto” clause, the finite verb comes second."
  },
  {
    "level": "B1",
    "topic": "Plusquamperfekt",
    "incorrect": "Bevor ich losging, habe ich gefrühstückt gehabt.",
    "correct": "Bevor ich losging, hatte ich gefrühstückt.",
    "explanation": "Use “hatte” + past participle for a completed earlier action."
  },
  {
    "level": "B2",
    "topic": "Konjunktiv I",
    "incorrect": "Die Expertin sagt, das System funktionier.",
    "correct": "Die Expertin sagt, das System funktioniere.",
    "explanation": "In formal reported speech, the Konjunktiv I form of “funktionieren” is “funktioniere”."
  },
  {
    "level": "B2",
    "topic": "Two-part connector",
    "incorrect": "Sie spricht nicht nur Deutsch, aber auch Englisch.",
    "correct": "Sie spricht nicht nur Deutsch, sondern auch Englisch.",
    "explanation": "The standard pair is “nicht nur ... sondern auch”."
  },
  {
    "level": "B2",
    "topic": "Formal genitive",
    "incorrect": "Wegen des starken Regen wurde abgesagt.",
    "correct": "Wegen des starken Regens wurde abgesagt.",
    "explanation": "After “wegen des”, the masculine genitive noun also requires the ending “-s”: “Regens”."
  },
  {
    "level": "B2",
    "topic": "Irreal past",
    "incorrect": "Wenn ich es gewusst hätte, würde ich früher gekommen.",
    "correct": "Wenn ich es gewusst hätte, wäre ich früher gekommen.",
    "explanation": "An unreal past consequence uses Konjunktiv II perfect: “wäre ... gekommen”."
  },
  {
    "level": "B2",
    "topic": "Prepositional relative clause",
    "incorrect": "Das Thema, über dem wir sprechen, ist wichtig.",
    "correct": "Das Thema, über das wir sprechen, ist wichtig.",
    "explanation": "“Über etwas sprechen” takes accusative: “über das”."
  },
  {
    "level": "B2",
    "topic": "Contrast construction",
    "incorrect": "Trotz die Probleme haben wir weitergemacht.",
    "correct": "Trotz der Probleme haben wir weitergemacht.",
    "explanation": "“Trotz” takes genitive in this formal construction."
  },
  {
    "level": "B2",
    "topic": "Infinitive with anstatt",
    "incorrect": "Anstatt um Hilfe bitten, versuchte er es allein.",
    "correct": "Anstatt um Hilfe zu bitten, versuchte er es allein.",
    "explanation": "“Anstatt ... zu” introduces an infinitive clause."
  }
];
