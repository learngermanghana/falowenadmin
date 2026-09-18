const clean = (value = "") => String(value || "").replace(/\s+/g, " ").trim();

function sentences(source = "") {
  return String(source || "")
    .replace(/\r/g, "")
    .split(/(?<=[.!?])\s+|\n+/)
    .map(clean)
    .filter(Boolean);
}

function sentenceFor(source = "", pattern) {
  return sentences(source).find((sentence) => pattern.test(sentence)) || "";
}

function matchCount(source = "", patterns = []) {
  return patterns.reduce((count, pattern) => count + (pattern.test(source) ? 1 : 0), 0);
}

function makeRule(pattern, reason = "") {
  return { test: (source) => pattern.test(source), evidence: (source) => sentenceFor(source, pattern), reason };
}

function makeCountRule(patterns, minimum, reason = "") {
  return {
    test: (source) => matchCount(source, patterns) >= minimum,
    evidence: (source) => patterns.map((pattern) => sentenceFor(source, pattern)).filter(Boolean).slice(0, minimum).join(" | "),
    reason,
  };
}

const opinionPosition = makeRule(/\b(?:ich\s+(?:denke|finde|glaube|meine)|meiner\s+meinung\s+nach|f[uü]r\s+mich|ich\s+bin\s+der\s+meinung|meine\s+meinung\s+ist|ich\s+halte)\b/i);
const conclusion = makeRule(/\b(?:zusammenfassend|abschlie[ßs]end|deshalb\s+denke\s+ich|daher\s+denke\s+ich|insgesamt|zum\s+schluss|meiner\s+meinung\s+nach)\b/i);
const example = makeRule(/\b(?:zum\s+beispiel|beispielsweise|in\s+meinem\s+fall|bei\s+mir|ich\s+habe|ich\s+kenne|in\s+meinem\s+land|in\s+ghana)\b/i);
const advantage = makeRule(/\b(?:vorteil|positiv|praktisch|bequem|flexibel|hilfreich|gut\s+ist|der\s+pluspunkt)\b/i);
const disadvantage = makeRule(/\b(?:nachteil|problem|schwierig|risiko|negativ|stress|gef[aä]hrlich|ung[uü]nstig|der\s+minuspunkt)\b/i);

const RULES = {
  "B1-1.1": [
    opinionPosition,
    makeRule(/\b(?:pers[oö]nlicher?\s+kontakt|kontakt\s+mit|kollegen|kunden|menschen|homeoffice|zu\s+hause\s+arbeiten)\b/i),
    disadvantage,
    makeRule(/\b(?:weil|denn|deshalb|daher|zum\s+beispiel|beispielsweise)\b/i),
  ],
  "B1-1.2": [
    makeRule(/\bkennengelernt\b/i),
    {
      test: (source) => /\b(?:mein(?:e|en|em|er)?\s+(?:best(?:e|en|em|er)?\s+)?(?:freund|freundin)|unsere\s+freundschaft|diese\s+freundschaft)\b/i.test(source)
        && /\b(?:besonders|vertraue|unterst[uü]tzt|hilft|ehrlich|zuverl[aä]ssig|verst[aä]ndnisvoll|wichtig)\b/i.test(source),
      evidence: (source) => sentenceFor(source, /\b(?:mein(?:e|en|em|er)?\s+(?:best(?:e|en|em|er)?\s+)?(?:freund|freundin)|unsere\s+freundschaft|diese\s+freundschaft)\b/i),
      reason: "The response must explain why this specific friendship is special, not only make a general statement about friendship.",
    },
    makeRule(/\b(?:wollen|k[oö]nnen|sollen)\s+wir\b[^.!?]{0,90}\btreffen|\bwie\s+w[aä]re\s+es\b[^.!?]{0,90}\btreffen|\bhast\s+du\b[^.!?]{0,70}\bzeit|\blass\s+uns\b[^.!?]{0,70}\btreffen|\btreffen\s+wir\s+uns\b/i),
  ],
  "B1-1.3": [
    makeRule(/\b(?:leider\s+kann\s+ich\s+nicht|kann\s+ich\s+leider\s+nicht|entschuldige|entschuldigen|tut\s+mir\s+leid|nicht\s+teilnehmen|nicht\s+kommen)\b/i),
    makeRule(/\b(?:weil|denn|wegen|da\s+ich|grund)\b/i),
    makeRule(/\b(?:pr[aä]sentation|kurs|veranstaltung|termin|erfolgsgeschichte)\b/i),
  ],
  "B1-2.4": [
    opinionPosition,
    makeCountRule([/\b(?:pers[oö]nliche?\s+kontakte?|freunde|bekannte|familie)\b/i, /\b(?:online[- ]?portal|internet|website|app|immobilienportal)\b/i], 2),
    example,
    makeRule(/\b(?:weil|denn|deshalb|daher|wenn|w[aä]hrend|hingegen)\b/i),
  ],
  "B1-2.5": [
    makeRule(/\b(?:interessiere\s+mich|interesse\s+an|wohnung\s+gef[aä]llt|m[oö]chte\s+die\s+wohnung)\b/i),
    makeRule(/\b(?:besichtigung|termin|besichtigen|wann\s+k[oö]nnte|wann\s+kann)\b/i),
    makeRule(/\b(?:best[aä]tigen|best[aä]tigung|bitte\s+best[aä]tigen|r[uü]ckmeldung)\b/i),
    makeRule(/\b(?:telefon|telefonnummer|e-?mail|erreichen|kontaktieren)\b/i),
  ],
  "B1-2.6": [
    makeCountRule([/\b(?:stadt|stadtleben)\b/i, /\b(?:land|dorf|auf\s+dem\s+land)\b/i], 2),
    makeRule(/\b(?:weil|denn|deshalb|daher)\b/i),
    makeRule(/\b(?:ich\s+wohne\s+lieber|ich\s+w[uü]rde\s+lieber|ich\s+bevorzuge|f[uü]r\s+mich\s+ist)\b/i),
  ],
  "B1-3.7": [
    makeRule(/\b(?:fertiggericht|fast\s*food|hausmannskost|tanja)\b/i),
    advantage,
    disadvantage,
    makeRule(/\b(?:selbst\s+kochen|frisch\s+kochen|vorbereiten|meal\s*prep|salat|gem[uü]se|ges[uü]nder)\b/i),
    conclusion,
  ],
  "B1-3.8": [
    opinionPosition,
    makeRule(/\b(?:sport|bewegung|trainieren|training)\b/i),
    makeRule(/\b(?:ern[aä]hrung|essen|lebensmittel|obst|gem[uü]se|zucker|wasser)\b/i),
    example,
    conclusion,
  ],
  "B1-4.9": [
    makeCountRule([/\b(?:vorteil|positiv|hilfreich|flexibel)\b/i, /\b(?:nachteil|problem|stress|schwierig)\b/i], 2),
    makeRule(/\b(?:homeoffice|flexible\s+arbeit|arbeitszeit|von\s+zu\s+hause)\b/i),
    example,
    opinionPosition,
    conclusion,
  ],
  "B1-4.10": [
    makeRule(/\b(?:digitale?\s+auszeit|digital\s+detox|handy|smartphone|soziale\s+medien|bildschirm)\b/i),
    makeCountRule([/\b(?:weniger\s+stress|besser\s+schlafen|mehr\s+zeit|konzentration|ruhe|entspannung)\b/i, /\b(?:beziehung|familie|freunde|sport|natur|produktiver|fokus)\b/i], 2),
    disadvantage,
    makeCountRule([/\b(?:handy\s+weglegen|benachrichtigung|flugmodus|zeitlimit|bildschirmzeit)\b/i, /\b(?:spazieren|sport|lesen|offline|pause|kein\s+handy)\b/i], 2),
    example,
    conclusion,
  ],
  "B1-4.11": [
    opinionPosition,
    advantage,
    makeRule(/\b(?:konflikt|problem|schwierig|unterschiedliche\s+meinungen|kommunikation)\b/i),
    makeRule(/\b(?:l[oö]sung|kompromiss|sprechen|kommunizieren|aufgaben\s+teilen|zuh[oö]ren)\b/i),
    example,
  ],
  "B1-4.12": [
    makeRule(/\b(?:in\s+den\s+bergen|am\s+see|im\s+wald|am\s+strand|in\s+\w+|nach\s+\w+|bei\s+\w+)\b/i),
    makeCountRule([/\b(?:wandern|zelten|schwimmen|klettern|fahren|laufen|gesehen|erlebt|besucht)\b/i, /\b(?:danach|sp[aä]ter|au[ßs]erdem|auch|anschlie[ßs]end)\b/i], 2),
    makeRule(/\b(?:problem|schwierig|verloren|regen|verletzt|kaputt|versp[aä]tet|kein|nicht\s+funktioniert)\b/i),
    makeRule(/\b(?:gel[oö]st|gefunden|angerufen|geholfen|repariert|zur[uü]ckgegangen|gewartet|organisiert)\b/i),
    makeRule(/\b(?:gelernt|gemerkt|verstanden|seitdem\s+wei[ßs]\s+ich)\b/i),
  ],
  "B1-4.13": [
    opinionPosition,
    makeRule(/\b(?:spannend|spannung|action|aufregend|unterhaltsam)\b/i),
    makeRule(/\b(?:ruhig|ruhige\s+filme|nachdenklich|realistisch|entspannend|tief)\b/i),
    makeRule(/\b(?:als|w[aä]hrend|hingegen|im\s+vergleich|dagegen|andererseits)\b/i),
    conclusion,
  ],
  "B1-5.14": [
    makeRule(/\b(?:vielen\s+dank|danke|bedanke\s+mich)\b/i),
    makeRule(/\b(?:leider\s+kann\s+ich\s+nicht|muss\s+ich\s+ablehnen|kann\s+ich\s+nicht\s+teilnehmen|nehme\s+ich\s+nicht\s+teil)\b/i),
    makeRule(/\b(?:weil|denn|wegen|da\s+ich|arbeitszeit|familie|zeit)\b/i),
  ],
  "B1-5.15": [
    makeRule(/\b(?:video|chat|e-?mail|internet|online|software|teams|zoom|digitale?\s+medien|kommunikation)\b/i),
    makeRule(/\b(?:st[aä]ndig\s+erreichbar|erreichbarkeit|stress|ablenkung|grenze|problem)\b/i),
    makeRule(/\b(?:arbeitszeit\s+beenden|handy\s+ausschalten|arbeitsplatz\s+verlassen|pause|klare\s+zeiten|t[uü]r\s+schlie[ßs]en|nicht\s+erreichbar)\b/i),
    opinionPosition,
  ],
  "B1-5.16": [
    opinionPosition,
    makeCountRule([/\b(?:lernen|lernplan|vorbereiten|wiederholen)\b/i, /\b(?:atmen|entspannen|sport|schlafen|pause|meditation|fr[uü]h\s+anfangen)\b/i], 2),
    makeRule(/\b(?:weil|dadurch|deshalb|so\s+kann|hilft|reduziert|ruhiger)\b/i),
    conclusion,
  ],
  "B1-5.17": [
    makeCountRule([/\b(?:wiederholen|karteikarten|notizen|lesen|schreiben|sprechen|gruppe|video)\b/i, /\b(?:pause|lernplan|ziele|[uü]ben|t[aä]glich|regelm[aä][ßs]ig)\b/i], 2),
    makeRule(/\b(?:ziele|pausen?|wiederholung|wiederholen)\b/i),
    makeRule(/\b(?:weil|denn|dadurch|deshalb|so\s+kann)\b/i),
    conclusion,
  ],
  "B1-6.18": [
    makeCountRule([/\b(?:ausbildung|lehre)\b/i, /\b(?:studium|universit[aä]t)\b/i, /\b(?:praktikum)\b/i, /\b(?:weiterbildung|kurs)\b/i], 2),
    makeRule(/\b(?:unterschiedlich|jeder\s+mensch|kommt\s+darauf\s+an|je\s+nach|verschiedene\s+wege|nicht\s+f[uü]r\s+alle)\b/i),
    makeRule(/\b(?:ich\s+w[uü]rde|f[uü]r\s+mich|ich\s+bevorzuge|am\s+besten|geeignet|sinnvoll)\b/i),
  ],
  "B1-6.19": [
    makeRule(/\b(?:nerv[oö]s|stress|aufgeregt|schwierig|fragen|druck|angst)\b/i),
    makeRule(/\b(?:vorbereiten|firma\s+recherchieren|fragen\s+[uü]ben|lebenslauf|kleidung|p[uü]nktlich)\b/i),
    makeRule(/\b(?:ruhig|selbstbewusst|ehrlich|blickkontakt|zuh[oö]ren|klar\s+antworten|freundlich)\b/i),
    opinionPosition,
  ],
  "B1-6.20": [
    opinionPosition,
    makeRule(/\b(?:ausbildung|studium|qualifikation|abschluss|zertifikat|schule|universit[aä]t)\b/i),
    makeRule(/\b(?:praxis|praktische\s+erfahrung|berufserfahrung|praktikum|am\s+arbeitsplatz)\b/i),
    makeRule(/\b(?:w[aä]hrend|hingegen|im\s+vergleich|beides|sowohl|andererseits|wichtiger\s+als)\b/i),
    example,
  ],
  "B1-7.21": [
    makeCountRule([/\b(?:allein|single|eigene\s+wohnung)\b/i, /\b(?:wg|wohngemeinschaft|mitbewohner)\b/i, /\b(?:familie|partner|paar|zusammenleben)\b/i], 3),
    advantage,
    disadvantage,
    example,
    conclusion,
  ],
  "B1-7.22": [
    opinionPosition,
    advantage,
    makeRule(/\b(?:risiko|gef[aä]hrlich|falsch|fake|betrug|l[uü]ge|entt[aä]uschung|nachteil)\b/i),
    makeRule(/\b(?:pers[oö]nlich|im\s+echten\s+leben|offline|direkt\s+kennenlernen|online)\b/i),
    example,
    conclusion,
  ],
  "B1-7.23": [
    opinionPosition,
    makeRule(/\b(?:erster\s+eindruck|erste\s+eindruck|ersten\s+eindruck|erstes\s+date)\b/i),
    makeRule(/\b(?:kann\s+t[aä]uschen|nicht\s+immer|nerv[oö]s|falsch\s+verstehen|sp[aä]ter|kennenlernen)\b/i),
    example,
    conclusion,
  ],
  "B1-8.24": [
    opinionPosition,
    advantage,
    makeRule(/\b(?:teuer|schwierig|nicht\s+immer|wenig\s+auswahl|zeit|problem|nachteil)\b/i),
    makeRule(/\b(?:secondhand|regional|reparieren|weniger\s+kaufen|mehrweg|plastik|fair|bio|gebraucht)\b/i),
    conclusion,
  ],
  "B1-8.25": [
    makeRule(/\b(?:am\s+\d{1,2}[./-]\d{1,2}|am\s+\d{1,2}\.\s*\w+|vor\s+\d+\s+tagen|letzte\s+woche|gekauft\s+am)\b/i),
    makeRule(/\b(?:kaputt|defekt|display|bildschirm|kratzer|funktioniert\s+nicht|besch[aä]digt|schaden)\b/i),
    makeRule(/\b(?:zur[uü]ckgeschickt|zur[uü]ckgesendet|paket|retoure|r[uü]cksendung|lieferung|sendungsnummer)\b/i),
    makeRule(/\b(?:ersatz|austausch|reparatur|reparieren|erstattung|geld\s+zur[uü]ck)\b/i),
    makeRule(/\b(?:schnelle\s+(?:antwort|l[oö]sung|r[uü]ckmeldung)|baldige\s+r[uü]ckmeldung|bitte\s+antworten|w[aä]re\s+ich\s+dankbar)\b/i),
  ],
  "B1-9.26": [
    makeCountRule([/\b(?:nach|in|auf)\s+[A-ZÄÖÜ][a-zäöüß]+|\breiseziel|ziel\b/i, /\b(?:zug|bus|auto|flugzeug|flug|bahn|fahrrad|schiff)\b/i], 2),
    makeRule(/\b(?:problem|versp[aä]tung|ausgefallen|verloren|kaputt|krank|reservierung|koffer|gepäck)\b/i),
    makeRule(/\b(?:gel[oö]st|angerufen|umgebucht|gefunden|ersatz|geholfen|repariert|neue\s+buchung)\b/i),
    makeRule(/\b(?:am\s+ende|schlie[ßs]lich|danach|trotzdem|reise\s+war|gut\s+angekommen|zur[uü]ckgekehrt)\b/i),
  ],
  "B1-10.27": [
    makeRule(/\b(?:wichtig|umwelt|klima|ressourcen|zukunft|sch[uü]tzen|verschmutzung)\b/i),
    makeRule(/\b(?:licht\s+ausschalten|wasser\s+sparen|fahrrad|bus|recycling|m[uü]ll|secondhand|weniger\s+plastik|regional)\b/i),
    makeRule(/\b(?:schwierig|problem|teuer|keine\s+busse|wenig\s+angebot|gewohnheit|zeit|geld)\b/i),
    conclusion,
  ],
  "B1-10.28": [
    makeRule(/\b(?:energie\s+sparen|bus|fahrrad|reparieren|secondhand|weniger\s+fleisch|m[uü]ll|recycling|regional|strom)\b/i),
    makeRule(/\b(?:land|dorf|verkehr|geld|teuer|gewohnheit|schwierig|wenig\s+angebot|lange\s+wege)\b/i),
    makeRule(/\b(?:weil|denn|deshalb|daher|dadurch)\b/i),
    conclusion,
  ],
};

export function evaluateB1WritingTaskEvidence(task = {}, source = "") {
  const taskPoints = Array.isArray(task.taskPoints) ? task.taskPoints : [];
  const rules = RULES[String(task.assignmentKey || "").toUpperCase()] || [];
  return taskPoints.map((label, index) => {
    const rule = rules[index];
    if (!rule) {
      return {
        index,
        label: clean(label),
        status: "review",
        evidence: "",
        reason: "No deterministic B1 evidence rule is configured for this task point.",
      };
    }
    const met = Boolean(rule.test(String(source || "")));
    return {
      index,
      label: clean(label),
      status: met ? "met" : "missing",
      evidence: met ? clean(rule.evidence(String(source || ""))) : "",
      reason: met
        ? "The submission contains task-relevant evidence for this communicative point."
        : (rule.reason || "No task-relevant evidence for this required B1 point was found in Teil 2."),
    };
  });
}
