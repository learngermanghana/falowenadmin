// Curated A1 Days 11–15: teacher-verifiable understanding checks, short
// application tasks and a dedicated exam-format orientation for Day 15.
// Answers and explanations concern the actual lesson objectives. These do
// not mark student work, create scores or change the Goethe A1-5.9 mock exam.
const check = (questionDe, answerDe, noteEn) => ({ questionDe, answerDe, noteEn });

export const A1_DAYS11_TO15_UNDERSTANDING = Object.freeze({
  "A1-7": [
    check("Wie spät ist es um 7:00?", "Es ist sieben Uhr.", "Use the hour followed by Uhr for a full-hour time."),
    check("Wie sagt man 7:30 mit halb?", "Es ist halb acht.", "halb names the NEXT hour; halb acht means 7:30, not 8:30."),
    check("Wie sagt man 8:30 mit halb?", "Es ist halb neun.", "The next hour is neun, so halb neun means 8:30."),
    check("Wie sagt man 7:10 mit nach?", "Es ist zehn nach sieben.", "nach counts minutes after the current hour."),
    check("Wie sagt man 7:50 mit vor?", "Es ist zehn vor acht.", "vor counts minutes until the next hour: ten minutes before eight."),
    check("Wie sagt man 7:15 mit Viertel?", "Es ist Viertel nach sieben.", "Viertel nach means 15 minutes after the hour."),
    check("Wie sagt man 7:45 mit Viertel?", "Es ist Viertel vor acht.", "Viertel vor means 15 minutes before the next hour."),
    check("Ergänze: „Der Kurs beginnt ___ halb acht.“", "Der Kurs beginnt um halb acht.", "Use um when giving the time of an activity or appointment."),
    check("Welche Uhrzeit ist „fünf nach neun“?", "9:05 Uhr.", "The minutes follow nine o'clock, not precede ten."),
    check("Welche Uhrzeit ist „zwanzig vor sechs“?", "5:40 Uhr.", "Twenty minutes before six is 5:40."),
    check("Exit-Check: Schreibe die Zeiten für „halb acht“, „zehn vor acht“ und „Viertel nach sieben“ als Zahlen.", "7:30 · 7:50 · 7:15.", "Require all three distinct concepts: halb, vor and nach, unaided."),
  ],
  "A1-8": [
    check("Wie liest du 18:30 Uhr im 24-Stunden-System?", "Achtzehn Uhr dreißig.", "Schedules may show 24-hour clock times; say the hour and minutes precisely."),
    check("Was bedeutet 19:00 Uhr im 12-Stunden-System?", "7 Uhr abends.", "Subtract twelve after noon: 19:00 is 7 p.m."),
    check("Wie liest du 08:15 Uhr?", "Acht Uhr fünfzehn.", "Keep the minutes after the hour when reading a formal timetable."),
    check("Welche Uhrzeit steht im Fahrplan: RE 4 · 18:45 · Gleis 5?", "18:45 Uhr.", "Gleis 5 is the platform; the departure time is 18:45."),
    check("Welche Präposition steht vor einem Wochentag?", "am, zum Beispiel: am Montag.", "Use am with weekdays; do not use um before the day."),
    check("Welche Präposition steht vor einer genauen Uhrzeit?", "um, zum Beispiel: um 18 Uhr.", "Use um with a clock time, not am."),
    check("Ergänze: „Der Kurs ist ___ Montag ___ 18 Uhr.“", "Der Kurs ist am Montag um 18 Uhr.", "Combine am with the day and um with the exact time."),
    check("Wie sagst du den 5. Mai mit am?", "am fünften Mai.", "A date after am uses an ordinal form ending in -ten here."),
    check("Wie sagst du den 12. September mit am?", "am zwölften September.", "The 12th takes the ordinal form zwölften after am."),
    check("Welches Datum ist 03.10.2026?", "der dritte Oktober 2026.", "In written German dates, 03 is the day and 10 is the month Oktober."),
    check("Exit-Check: Ergänze „___ Montag, ___ fünften Mai, ___ 18:45 Uhr“ mit am oder um.", "am Montag · am fünften Mai · um 18:45 Uhr.", "Check weekday/date versus clock-time prepositions without help."),
  ],
  "A1-3.5": [
    check("Wie schreibt man die Zahl 32 auf Deutsch?", "zweiunddreißig.", "For two-digit numbers above 20, the ones come before und + tens."),
    check("Wie schreibt man 24 auf Deutsch?", "vierundzwanzig.", "Do not copy English tens-first order: vier comes before zwanzig."),
    check("Wie schreibt man 67 auf Deutsch?", "siebenundsechzig.", "Units first, then und and the tens."),
    check("Welche Uhrzeit ist „halb neun“?", "8:30 Uhr.", "halb nine is thirty minutes before nine o'clock."),
    check("Wie sagst du 7:10 mit nach?", "zehn nach sieben.", "nach refers to minutes after the named hour."),
    check("Wie sagst du 7:55 mit vor?", "fünf vor acht.", "Five minutes remain until eight o'clock."),
    check("Ergänze: „Das Buch ___ zwölf Euro fünfzig.“", "Das Buch kostet zwölf Euro fünfzig.", "A singular thing takes kostet."),
    check("Ergänze: „Die Bücher ___ vierundzwanzig Euro.“", "Die Bücher kosten vierundzwanzig Euro.", "Plural Bücher needs kosten."),
    check("Welcher Preis ist „zwölf Euro fünfzig“ in Ziffern?", "12,50 €.", "Euro and cent amounts are conventionally separated by a decimal comma."),
    check("Welcher Preis ist „vierundzwanzig Euro“ in Ziffern?", "24,00 €.", "The spoken amount is twenty-four euros, not four-and-twenty cents."),
    check("Exit-Check: Schreibe „32“, „halb neun“ und „Die Bücher ___ 24 Euro“ korrekt.", "zweiunddreißig · 8:30 Uhr · Die Bücher kosten 24 Euro.", "Review number order, the next-hour halb rule and plural kosten together."),
  ],
  "A1-3.6": [
    check("Welches Modalverb zeigt eine Fähigkeit: können, müssen oder möchten?", "können.", "können says what somebody is able to do."),
    check("Welches Modalverb zeigt eine Notwendigkeit?", "müssen.", "müssen expresses obligation or necessity, not a polite wish."),
    check("Welches Modalverb zeigt einen höflichen Wunsch?", "möchten.", "möchten expresses what somebody would like."),
    check("Ergänze: „Ich ___ Deutsch sprechen.“ (können)", "Ich kann Deutsch sprechen.", "ich takes kann; the second verb sprechen stays at the end."),
    check("Ergänze: „Wir ___ heute lernen.“ (müssen)", "Wir müssen heute lernen.", "wir takes müssen; lernen remains an infinitive at the end."),
    check("Ergänze: „Ich ___ einen Tee trinken.“ (möchten)", "Ich möchte einen Tee trinken.", "ich takes möchte and the second verb trinken is final."),
    check("Was ist richtig: „Ich kann Deutsch sprechen“ oder „Ich kann sprechen Deutsch“?", "Ich kann Deutsch sprechen.", "The infinitive goes at the end of a simple clause with a modal verb."),
    check("Wo steht das konjugierte Modalverb im Hauptsatz „Ich muss heute lernen“?", "Position 2.", "Ich is position one; muss is the conjugated verb in second position."),
    check("Korrigiere: „Ich kann spreche Deutsch.“", "Ich kann Deutsch sprechen.", "Do not conjugate the second verb; use infinitive sprechen last."),
    check("Korrigiere: „Er müssen morgen arbeiten.“", "Er muss morgen arbeiten.", "With er, müssen becomes muss, while arbeiten remains the final infinitive."),
    check("Exit-Check: Ergänze „Ich ___ Deutsch sprechen; wir ___ lernen; ich ___ Tee trinken“ mit können, müssen und möchten.", "Ich kann Deutsch sprechen. Wir müssen lernen. Ich möchte Tee trinken.", "One sentence for ability, necessity and a polite wish, with the infinitive at the end."),
  ],
  // Day 15 is an intentional Goethe A1 speaking-format introduction, not a
  // generic role-play lesson or the later A1-5.9 speaking-readiness mock exam.
  "A1-4.7": [
    check("Was macht man in Teil 1 der Goethe-A1-Sprechprüfung?", "Sich kurz vorstellen: Name, Alter, Land, Wohnort, Sprachen, Beruf und Hobby.", "Teil 1 uses brief personal information; students need not deliver an A2-level talk."),
    check("Was macht man in Teil 2 der Goethe-A1-Sprechprüfung?", "Eine einfache Frage zum Thema stellen und die Frage des Partners beantworten.", "Teil 2 is question plus relevant answer, not a memorized speech."),
    check("Was macht man in Teil 3 der Goethe-A1-Sprechprüfung?", "Eine höfliche Bitte formulieren und passend darauf reagieren.", "Teil 3 assesses both the request and the reaction."),
    check("In Teil 3, how can you make a polite request for a pen?", "Kannst du mir bitte den Stift geben? / Können Sie mir bitte einen Stift geben?", "Use bitte; an appropriate du or Sie form can both work according to the partner."),
    check("Someone asks ‘Kannst du mir bitte den Stift geben?’ How can you respond positively?", "Ja, gern. / Ja, natürlich.", "A short clear positive response is enough for this exam-level task."),
    check("If you do not want to use können, how can you make a polite request?", "Gib mir bitte den Stift. / Geben Sie mir bitte den Stift.", "A polite imperative with bitte is also a suitable A1 request."),
    check("How can you refuse a request politely?", "Tut mir leid, das geht leider nicht.", "A short polite refusal clearly reacts to the partner's request."),
    check("Welche Frage passt zu „Ich wohne in Accra“?", "Wo wohnst du?", "The question must match the actual answer and keep W-word + verb + subject order."),
    check("Bilde die Ja/Nein-Frage mit „du / gern / Kaffee / trinkst“.", "Trinkst du gern Kaffee?", "A yes/no question begins with the conjugated verb."),
    check("Was darf in Teil 3 nicht fehlen: eine Bitte oder nur eine Erklärung?", "Eine Bitte und eine passende Reaktion.", "The learner must actually ask or react, not merely explain the exam rules."),
    check("Exit-Check: Stelle höflich eine Bitte um einen Stift und reagiere dann auf eine solche Bitte.", "Können Sie mir bitte einen Stift geben? – Ja, gern.", "A short practical exchange shows awareness of Teil 3; the full mock remains in lesson A1-5.9."),
  ],
});

export const A1_DAYS11_TO15_QUICK_CHECKS = Object.freeze({
  "A1-7": [
    check("Was heißt halb acht als digitale Zeit?", "7:30.", "halb always refers to the next hour."),
    check("Ist „zehn nach sieben“ vor oder nach 7:00?", "nach 7:00.", "nach means after the hour."),
  ],
  "A1-8": [
    check("Welche Zahl ist eine 24-Stunden-Uhrzeit: 18:00 oder 6 Uhr abends?", "18:00.", "Use the 24-hour form to read written timetables."),
    check("Ist „am“ oder „um“ richtig vor Montag?", "am Montag.", "am marks weekdays and dates."),
  ],
  "A1-3.5": [
    check("Wie schreibt man 21 als Wort?", "einundzwanzig.", "The unit precedes und + tens."),
    check("Was bedeutet „kostet“: eine Sache oder mehrere Sachen?", "eine Sache.", "The verb ending -t is used with a singular item."),
  ],
  "A1-3.6": [
    check("Was bedeutet „ich kann“?", "I can / ich habe die Fähigkeit.", "kann is the ich form of können."),
    check("Welches Verb steht am Ende: „Ich muss heute ___“ (lernen)?", "lernen.", "The action verb remains in the infinitive at the end."),
  ],
  "A1-4.7": [
    check("Welcher Teil ist die Vorstellung: Teil 1, 2 oder 3?", "Teil 1.", "Teil 1 is the self-introduction section."),
    check("Welcher Teil prüft Bitten und Reaktionen?", "Teil 3.", "Polite requests and responding belong to Teil 3."),
  ],
});

export const A1_DAYS11_TO15_APPLICATION_CHECKS = Object.freeze({
  "A1-7": [
    check("Korrigiere die Uhrzeit: „halb acht = 8:30“.", "halb acht = 7:30.", "halb counts towards the next hour."),
    check("Ergänze: „Ich stehe ___ sieben Uhr auf.“", "Ich stehe um sieben Uhr auf.", "An activity at a precise time takes um."),
  ],
  "A1-8": [
    check("Ergänze: „Wir treffen uns ___ Freitag ___ 17 Uhr.“", "Wir treffen uns am Freitag um 17 Uhr.", "am + weekday; um + clock time."),
    check("Lies die Zugzeit im Fahrplan: „RE 4 · 18:45 · Gleis 5“.", "Der RE 4 fährt um 18:45 Uhr ab.", "The platform number does not change the time."),
  ],
  "A1-3.5": [
    check("Korrigiere: „Die Bücher kostet 24 Euro.“", "Die Bücher kosten 24 Euro.", "Plural Bücher needs kosten."),
    check("Korrigiere: „halb neun = 9:30“.", "halb neun = 8:30.", "Half an hour before nine is 8:30."),
  ],
  "A1-3.6": [
    check("Korrigiere: „Ich muss lernen heute.“", "Ich muss heute lernen.", "In the simple modal structure the infinitive lernen follows the time phrase at the end."),
    check("Ordne die Wörter: „möchte / Kaffee / trinken / ich“.", "Ich möchte Kaffee trinken.", "The finite modal is in position two and the infinitive last."),
  ],
  "A1-4.7": [
    check("Reagiere positiv auf: „Können Sie bitte das Fenster öffnen?“", "Ja, natürlich. / Ja, gern.", "Respond to the request, not with an unrelated memorized introduction."),
    check("Korrigiere die Bitte: „Geben bitte Sie mir den Stift.“", "Geben Sie mir bitte den Stift.", "Polite Sie-imperative uses verb + Sie; bitte is natural after the recipient."),
  ],
});

export const A1_DAYS11_TO15_ASSIGNMENTS = Object.freeze(Object.keys(A1_DAYS11_TO15_UNDERSTANDING));
const lookup = (collection, id) => collection[String(id || "").trim().toUpperCase()] || null;
export const getA1Days11To15UnderstandingChecks = (id) => lookup(A1_DAYS11_TO15_UNDERSTANDING, id);
export const getA1Days11To15QuickChecks = (id) => lookup(A1_DAYS11_TO15_QUICK_CHECKS, id);
export const getA1Days11To15ApplicationChecks = (id) => lookup(A1_DAYS11_TO15_APPLICATION_CHECKS, id);
