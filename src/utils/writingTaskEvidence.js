const clean = (value = "") => String(value || "").replace(/\s+/g, " ").trim();

function sentences(source = "") {
  return String(source || "")
    .replace(/\r/g, "")
    .split(/(?<=[.!?])\s+|\n+/)
    .map(clean)
    .filter(Boolean);
}

function test(pattern, value = "") {
  const source = String(value || "");
  if (Array.isArray(pattern)) return pattern.length > 0 && pattern.every((item) => test(item, source));
  if (typeof pattern === "function") return Boolean(pattern(source));
  return pattern ? pattern.test(source) : false;
}

function firstEvidence(source = "", pattern) {
  const list = sentences(source);
  if (Array.isArray(pattern)) {
    return [...new Set(pattern.map((item) => firstEvidence(source, item)).filter(Boolean))].join(" | ");
  }
  if (typeof pattern === "function") {
    return list.find((sentence) => test(pattern, sentence)) || (test(pattern, source) ? list.slice(0, 2).join(" | ") : "");
  }
  return list.find((sentence) => test(pattern, sentence)) || "";
}

function ruleForPoint(label = "", assignmentKey = "") {
  const value = clean(label).toLowerCase();
  const normalizedAssignmentKey = String(assignmentKey || "").trim().toUpperCase();

  if (normalizedAssignmentKey === "A2-5.12") {
    if (/ask whether there are open positions|fragen sie.*offene stellen/i.test(value)) {
      // Mentioning "eine offene Stelle" is not the same as asking the
      // employer whether a position is available.
      return (source) => sentences(source).some((sentence) => {
        const vacancy = /\b(?:stelle[n]?|arbeitsstelle[n]?|stellenangebot[e]?|job[s]?|position[en]?|mitarbeiter)\b/i.test(sentence);
        // An hours/salary question mentioning "diese Stelle" is not a vacancy inquiry.
        const availabilityQuestion = /\b(?:gibt\s+es|haben\s+sie)\b[^?]{0,110}\b(?:stellen?|arbeitsstellen?|stellenangebote?|jobs?|positionen?)\b|\b(?:stellen?|arbeitsstellen?|stellenangebote?|jobs?|positionen?)\b[^?]{0,65}\b(?:frei|offen|verf[uü]gbar)\b/i;
        const directQuestion = /\?/.test(sentence) && availabilityQuestion.test(sentence);
        const indirectQuestion = /\b(?:wissen|erfahren|fragen|sagen|mitteilen)\b[^.!?\n]{0,85}\bob\b/i.test(sentence)
          && /\bob\b[^.!?\n]{0,100}(?:\bes\b[^.!?\n]{0,60}\b(?:stellen?|jobs?|positionen?)\b[^.!?\n]{0,30}\bgibt\b|\bsie\b[^.!?\n]{0,60}\b(?:stellen?|jobs?|positionen?)\b[^.!?\n]{0,30}\bhaben\b|\b(?:stellen?|jobs?|positionen?)\b[^.!?\n]{0,35}\b(?:frei|offen|verf[uü]gbar)\b)/i.test(sentence);
        return vacancy && (directQuestion || indirectQuestion);
      });
    }
    if (/ask about working hours and salary|fragen sie nach den arbeitszeiten und dem gehalt/i.test(value)) {
      return [
        /\b(?:arbeitszeit(?:en)?|arbeitsstunden|schicht(?:en)?|arbeitstag(?:e|en)?|stundenplan)\b/i,
        /\b(?:gehalt|lohn|verdienst|bezahlung)\b/i,
      ];
    }
  }

  if (normalizedAssignmentKey === "A2-5.13" && /experience and strengths or skills/.test(value)) {
    const positive = (source) => sentences(source).filter(sentence => !/\b(?:nicht|kein\w*|nie)\b/i.test(sentence));
    return [
      source => positive(source).some(sentence => /\b(?:erfahrung|berufserfahrung|gearbeitet|praktikum)\b|\barbeite\s+als\b/i.test(sentence)),
      source => positive(source).some(sentence =>
        /\b(?:kann|konnte|kenntnisse|f[aä]higkeiten|kompetenz|st[aä]rke|zuverl[aä]ssig|freundlich|teamf[aä]hig|flexibel)\b/i.test(sentence)
        || /\b(?:im|in\s+einem)\s+team\b[^.!?]{0,50}\b(?:arbeit\w*|gearbeitet)\b|\b(?:arbeit\w*|gearbeitet)\b[^.!?]{0,50}\b(?:im|in\s+einem)\s+team\b/i.test(sentence)
        || /\b(?:unter\s+zeitdruck\s+arbeiten|l[oö]sungen\s+finden|kunden\s+(?:beraten|bedienen))\b/i.test(sentence)),
    ];
  }

  if (normalizedAssignmentKey === "A2-6.16") {
    // Current coursebook: short informal email to Markus, no doctor appointment.
    if (/name a relaxing activity you do/.test(value)) {
      return /\b(?:sauna|therme|wellness|wellnesstag|spazieren|spaziergang|park|yoga|meditation|meditieren|musik|lesen|schwimmen|entspann\w*|erholen)\b/i;
    }
    if (/explain why that activity helps you relax/.test(value)) {
      // A direct benefit is a reason at A2; a causal conjunction is optional.
      // Require an actual benefit statement, not just the topic or a negated benefit.
      return (source) => sentences(source).some((sentence) => {
        return /(?<!\p{L})(?:[uü]bungen|yoga|sauna|spaziergang|musik|lesen|schwimmen|meditation|das|es|dabei|danach|ich)(?!\p{L})/iu.test(sentence)
          && /\b(?:ist|sind|macht|machen|hilft|helfen|f[uü]hle|werde|bin|kann|entspannt|beruhigt|reduziert|vergesse)\b/i.test(sentence)
          && [...sentence.matchAll(/\b(?:gut|spa[ßs]|entspannend|entspannt|ruhig\w*|erholsam|erholt|besser|wohl|gl[uü]cklich|gesund|stress\s+(?:zu\s+)?(?:reduzieren|verringern|abbauen|abzubauen|vergessen)|abschalten|ruhe)\b/gi)].some(match => {
            // Negation of price must not cancel an earlier relaxation benefit.
            const prefix = sentence.slice(0, match.index).split(/[,;]|\b(?:und|aber|sondern)\b/i).at(-1);
            return !/\b(?:nicht|kein\w*|kaum)\b/i.test(prefix);
          });
      });
    }
    if (/invite markus to relax together next weekend/.test(value)) {
      return [
        /\b(?:n[aä]chstes?\s+wochenende|am\s+samstag|am\s+sonntag|n[aä]chsten\s+samstag|n[aä]chsten\s+sonntag)\b/i,
        /\b(?:hast\s+du\s+lust|kommst\s+du\s+mit|wollen\s+wir|m[oö]chtest\s+du|willst\s+du|k[oö]nnen\s+wir|lass\s+uns|mitkommen|zusammen|gemeinsam)\b/i,
      ];
    }
  }

  if (normalizedAssignmentKey === "A2-6.15") {
    // Falowen learner workbook: informal email to Jan about favourite sport.
    // The historical formal Sportverein/Kursplatz task is no longer assigned.
    if (/name your favourite sport and how often you practise it/.test(value)) {
      return [
        /\b(?:lieblingssport|fu[ßs]ball|schwimmen|joggen|laufen|yoga|tennis|badminton|fitness|basketball|volleyball|radfahren|sport|trainiere|spiele)\b/i,
        /\b(?:einmal|zweimal|dreimal|viermal|f[uü]nfmal|sechsmal|\d+\s*mal)\s+(?:pro|in\s+der)\s+woche\b|\b(?:jede[nrs]?|alle)\s+(?:montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonntag|woche|tag)\b/i,
      ];
    }
    if (/explain why you enjoy this sport/.test(value)) {
      return [
        /\b(?:fu[ßs]ball|schwimmen|joggen|laufen|yoga|tennis|badminton|fitness|basketball|volleyball|radfahren|sport|spielen|trainieren|es|das)\b/i,
        /\b(?:weil|denn|deshalb|darum|spa[ßs]|entspannend|gesund|freude|gef[aä]llt)\b/i,
      ];
    }
    if (/invite jan to do sport together next saturday/.test(value)) {
      return [
        /\b(?:n[aä]chsten|kommenden)?\s*(?:samstag|samtag)\b/i,
        /\b(?:hast\s+du|m[oö]chtest\s+du|willst\s+du|kommst\s+du|wollen\s+wir|k[oö]nnen\s+wir|lass\s+uns|lade\s+dich\s+ein)\b/i,
      ];
    }
  }

  if (normalizedAssignmentKey === "A2-4.10") {
    // Current learner coursebook: invite a friend to explore a city, NOT a festival.
    if (/name the city or neighbourhood and explain why/i.test(value)) {
      return /\b(?:entdeck\w*|kennenlern\w*|besuch\w*|stadt|viertel|ort)\b[\s\S]{0,180}\bweil\b/i;
    }
    if (/suggest two activities or places/i.test(value)) {
      return /\bzuerst\b[\s\S]{0,200}\bdanach\b/i;
    }
    if (/give a concrete day and meeting point and ask what the friend prefers/i.test(value)) {
      return [
        /\b(?:montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonntag|morgen|wochenende)\b/i,
        /\b(?:treffen|treffpunkt|vor\s+(?:dem|der)|am\s+(?:bahnhof|markt|rathaus)|im\s+(?:caf[eé]|park))\b/i,
        /\b(?:was\s+m[oö]chtest\s+du|was\s+meinst\s+du|was\s+denk\w*\s+du|welch\w*\s+ort\w*\s+m[oö]chtest\s+du)\b[^?]*\?/i,
      ];
    }
  }

  if (normalizedAssignmentKey === "A2-4.9") {
    if (/ask for a free room/.test(value)) {
      return /\bzimmer\b[\s\S]{0,90}\b(?:frei|verf[uü]gbar|reservier\w*|buch\w*)\b|\b(?:frei|verf[uü]gbar|reservier\w*|buch\w*)\b[\s\S]{0,90}\bzimmer\b/i;
    }
    if (/give stay details/.test(value)) {
      return /\b(?:am\s+(?:montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonntag)|\d{1,2}\.\s*(?:januar|februar|m[aä]rz|april|mai|juni|juli|august|september|oktober|november|dezember)|(?:montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonntag),?\s+\d{1,2}\.?\s*(?:januar|februar|m[aä]rz|april|mai|juni|juli|august|september|oktober|november|dezember)|vom\b|bis\b|\d+\s+(?:tag|tage|tagen|nacht|n[aä]chte)|(?:ein|zwei|drei|vier|f[uü]nf|sechs|sieben|acht|neun|zehn)\s+(?:tag|tage|tagen|nacht|n[aä]chte)|personen?|einzelzimmer|doppelzimmer|familienzimmer|zimmerart)\b/i;
    }
  }

  if (normalizedAssignmentKey === "A2-7.19") {
    if (/invite the friend to shop and explain why/.test(value)) {
      return [
        /\b(?:einladen|mitkommen|zusammen|gemeinsam)\b/i,
        /\b(?:m[oö]bel(?:kaufen)?|einkaufen|einkaufszentrum|neue\s+wohnung|wohnung)\b/i,
      ];
    }
    if (/suggest when and where to meet/.test(value)) {
      return [
        /\b(?:am\s+(?:montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonntag)|am\s+\d|um\s+\d{1,2}(?::\d{2})?\s*(?:uhr)?|morgen|heute|wochenende)\b/i,
        /\b(?:vor|bei|in|am)\s+(?:dem|der|den|einem|einer)?\s*[A-ZÄÖÜa-zäöüß][\wÄÖÜäöüß-]*|\b(?:einkaufszentrum|treffpunkt|bahnhof|restaurant|caf[eé]|markt|accra|kumasi)\b/i,
      ];
    }
    if (/ask for the friend's opinion/.test(value)) {
      return /\b(?:was\s+denkst\s+du|was\s+meinst\s+du|wie\s+findest\s+du|was\s+h[aä]ltst\s+du|deine\s+meinung)\b[^?]*\?/i;
    }
  }

  if (/work or studies and your family/.test(value)) return [
    /\b(?:arbeite|arbeit|beruf|job|firma|branche|studier\w*|studium|schule|universit[aä]t|ausbildung)\b/i,
    /\b(?:familie|eltern|mutter|vater|bruder|schwester|geschwister|sohn|tochter|kind(?:er)?|ehemann|ehefrau|partner|partnerin|hund|katze|baby)\b/i,
  ];
  if (/what you like or what could be better and ask felix.*boss/.test(value)) return [
    /\b(?:ich\s+finde|ich\s+mag|mir\s+gef[aä]llt|besser|verbessern)\b/i,
    /\b(?:wie|was|wer|welch\w*)\b[^?]{0,90}\b(?:chef|chefin|boss|vorgesetzt\w*)\b[^?]*\?/i,
  ];
  if (/personal opinion and ask felix about his parents/.test(value)) return [
    /\b(?:ich\s+finde|ich\s+mag|mir\s+gef[aä]llt|besonders)\b/i,
    /(?:deine|deiner|deinen)\s+eltern[\s\S]{0,60}\?|(?:mutter|vater)[\s\S]{0,60}\?/i,
  ];
  if (/why you are inviting him and suggest a weekend activity/.test(value)) return [
    /\b(?:einladen|einladung|ich\s+schreibe|ich\s+m[oö]chte)\b/i,
    /\b(?:kino|restaurant|spazieren|wandern|schwimmen|fu[ßs]ball|essen|kochen|museum|sport|ausflug|fahren|gehen|veranstaltung|fest)\b/i,
  ];
  if (/concrete activity and ask alex.*(?:idea|opinion)/.test(value)) return [
    /\b(?:kino|restaurant|spazieren|wandern|schwimmen|fu[ßs]ball|essen|kochen|museum|sport|ausflug|fahren|gehen)\b/i,
    /\b(?:was\s+meinst\s+du|wie\s+findest\s+du|deine\s+meinung|was\s+m[oö]chtest\s+du|idee)\b/i,
  ];
  if (/especially like and explain why/.test(value)) return [
    /\b(?:gef[aä]llt\s+mir|ich\s+mag|am\s+besten|besonders)\b/i,
    /\b(?:weil|denn)\b/i,
  ];
  if (/rental conditions and a viewing/.test(value)) return [
    /\b(?:mietbedingungen|kaution|nebenkosten|mietvertrag|vertrag)\b/i,
    /\b(?:besichtigen|besichtigung)\b/i,
  ];
  if (/menu and prices/.test(value)) return [
    /\b(?:men[uü]|speisekarte|gerichte)\b/i,
    /\b(?:preis|preise|kosten|wie\s+viel)\b/i,
  ];
  if (/price and additional services/.test(value)) return [
    /\b(?:preis|preise|kosten|wie\s+viel)\b/i,
    /\b(?:fr[uü]hst[uü]ck|internet|wlan|parkplatz|service|leistungen)\b/i,
  ];
  if (/event and why it is special/.test(value)) return [
    /\b(?:fest|festival|feier|veranstaltung|tradition)\b/i,
    /\b(?:weil|denn|besonders|interessant|wichtig|traditionell)\b/i,
  ];
  if (/price and insurance/.test(value)) return [
    /\b(?:preis|preise|kosten|wie\s+viel)\b/i,
    /\b(?:versicherung|versichert)\b/i,
  ];
  if (/working hours and salary/.test(value)) return [
    /\b(?:arbeitszeit|arbeitszeiten|wann|uhrzeit|stunden)\b/i,
    /\b(?:gehalt|lohn|verdienst)\b/i,
  ];
  if (/experience and strengths or skills/.test(value)) return [
    /\b(?:erfahrung|gearbeitet|praktikum|beruf|jahre?)\b/i,
    /\b(?:kann|kenntnisse|f[aä]higkeiten|kompetenz|st[aä]rke|zuverl[aä]ssig|freundlich|teamf[aä]hig|flexibel)\b/i,
  ];
  if (/seminar content and dates or schedule/.test(value)) return [
    /\b(?:inhalt|themen|programm)\b/i,
    /\b(?:termin|termine|datum|wann|uhrzeit|tage)\b/i,
  ];
  if (/training times and costs/.test(value)) return [
    /\b(?:trainingszeit|training|wann|uhrzeit|tage|stunden)\b/i,
    /\b(?:preis|preise|kosten|wie\s+viel|geb[uü]hr|beitrag)\b/i,
  ];
  if (/writing or complaining and what you bought/.test(value)) return [
    /\b(?:beschwerde|reklamation|reklamieren|ich\s+schreibe|problem)\b/i,
    /\b(?:produkt|ware|artikel|bestellung|handy|telefon|schuhe|jacke|hose|ger[aä]t|computer|laptop|m[oö]bel)\b/i,
  ];
  if (/ordering and delivery/.test(value)) return [
    /\b(?:bestellen|bestellung|online\s+bestellen|kaufen)\b/i,
    /\b(?:lieferung|liefern|versand|wie\s+lange)\b/i,
  ];
  if (/appointments or activities in your coming week/.test(value)) return (source) => {
    const matches = String(source || "").match(/\b(?:montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonntag|termin|arzt|arbeit|schule|kurs|training|sport|einkaufen|besuch|treffen|um\s+\d{1,2}(?::\d{2})?\s*uhr)\b/gi) || [];
    return matches.length >= 3;
  };
  if (/when you have free time/.test(value)) return /\b(?:frei|zeit\s+habe|zeit\s+haben|habe\s+zeit|haben\s+zeit)\b/i;
  if (/transport you use for school or work/.test(value)) return [
    /\b(?:bus|bahn|u-?bahn|s-?bahn|zug|auto|fahrrad|rad|motorrad|stra[ßs]enbahn|tram|zu\s+fu[ßs]|verkehrsmittel)\b/i,
    /\b(?:schule|arbeit|arbeitsplatz|universit[aä]t|uni|b[uü]ro)\b/i,
  ];
  if (/how long the journey takes and one advantage or disadvantage/.test(value)) return [
    /\b(?:minute|minuten|stunde|stunden|wie\s+lange|dauert|brauche|braucht)\b/i,
    /\b(?:vorteil|nachteil|schnell|langsam|bequem|billig|teuer|praktisch|stressig|weil|denn)\b/i,
  ];
  if (/ask the friend how they travel to school or work/.test(value)) return /\b(?:wie|womit)\b[^?]{0,100}\b(?:schule|arbeit|arbeitsplatz|universit[aä]t|uni)\b[^?]*\?/i;

  if (/relevant personal question.*how he is|what is new/.test(value)) {
    return /(?:wie\s+geht(?:\s+es|'?s)?\s+(?:dir|ihnen)|was\s+(?:ist|gibt(?:\s+es)?)\s+(?:bei\s+(?:dir|ihnen)\s+)?(?:neu|neues)|und\s+(?:du|sie)\s*\?|was\s+mach(?:st|en)\s+(?:du|sie)|wie\s+l[aä]uft(?:'s|\s+es)?\s+bei\s+(?:dir|ihnen))/i;
  }
  if (/why you are writing|why you are inviting|why you are writing or inviting|why you are writing or complaining/.test(value)) {
    return /\b(?:ich\s+schreibe|ich\s+m[oö]chte|einladen|einladung|bewerbe|bewerbung|beschwerde|reklamation)\b[\s\S]{0,120}\b(?:weil|denn|wegen|um|m[oö]chte|interessiere|problem|einladen)\b/i;
  }
  if (/work or studies/.test(value)) return /\b(?:arbeite|arbeit|beruf|job|firma|branche|studier\w*|studium|schule|universit[aä]t|ausbildung)\b/i;
  if (/family/.test(value) && !/future/.test(value)) return /\b(?:familie|eltern|mutter|vater|bruder|schwester|geschwister|sohn|tochter|kind(?:er)?|ehemann|ehefrau|partner|partnerin|hund|katze|baby)\b/i;
  if (/weil or denn/.test(value)) return /\b(?:weil|denn)\b/i;
  if (/appearance/.test(value)) return /\b(?:gro[ßs]|klein|haare?|augen|brille|tr[aä]gt|kleidung|blond|schwarz|braun|schlank|sportlich|j[uü]nger|[aä]lter)\b/i;
  if (/personality|behaviour|character/.test(value)) return /\b(?:freundlich|ruhig|geduldig|nett|streng|hilfsbereit|zuverl[aä]ssig|fair|lustig|offen|charakter|verhalten)\b/i;
  if (/what you like|what could be better|personal opinion|opinion or preference|friend's opinion|sandra for her opinion|ask alex for his idea/.test(value)) {
    return /\b(?:ich\s+finde|ich\s+mag|mir\s+gef[aä]llt|besser|verbessern|was\s+denkst\s+du|was\s+meinst\s+du|wie\s+findest\s+du|was\s+h[aä]ltst\s+du|deine\s+meinung|idee|empfiehlst\s+du)\b/i;
  }
  if (/ask felix a relevant question/.test(value) && String(assignmentKey || "").toUpperCase() === "A2-1.2") {
    return /\b(?:wie|was|wer|welch\w*)\b[^?]{0,90}\b(?:chef|chefin|boss|vorgesetzt\w*)\b[^?]*\?/i;
  }
  if (/ask felix a relevant question/.test(value)) return /\?/;
  if (/ask felix about his parents/.test(value)) return /(?:deine|deiner|deinen)\s+eltern[\s\S]{0,60}\?|(?:mutter|vater)[\s\S]{0,60}\?/i;
  if (/weekend activity|concrete activity/.test(value)) return /\b(?:kino|restaurant|spazieren|wandern|schwimmen|fu[ßs]ball|essen|kochen|museum|sport|ausflug|fahren|gehen)\b/i;
  if (/when.*where|date.*place|date, time and place|date, place|meeting point|suggest when and where/.test(value)) return /\b(?:wann|am\s+\w+|am\s+\d|uhr|treffen|treffpunkt|wo|in\s+\w+|bei\s+\w+|vor\s+\w+)\b/i;
  if (/bring|can expect/.test(value)) return /\b(?:mitbringen|bringen|solltest|sollten|kannst|k[oö]nnen|erwarten|es\s+gibt)\b/i;
  if (/do something together|invite.*shop|invite sandra|shared weekend/.test(value)) return /\b(?:zusammen|gemeinsam|mitkommen|einladen|einladung|mit\s+dir|mit\s+ihnen)\b/i;
  if (/free at the weekend/.test(value)) return /(?:hast\s+du|bist\s+du)[\s\S]{0,50}(?:zeit|frei)/i;
  if (/moved/.test(value)) return /\b(?:umgezogen|neue\s+wohnung|neues\s+zimmer|umzug)\b/i;
  if (/room and important furniture/.test(value)) return /\b(?:zimmer|wohnung|bett|tisch|stuhl|schrank|sofa|regal|m[oö]bel|lampe)\b/i;
  if (/especially like/.test(value)) return /\b(?:gef[aä]llt\s+mir|ich\s+mag|am\s+besten|besonders)\b/i;
  if (/why you like it/.test(value)) return /\b(?:weil|denn)\b/i;
  if (/apartment is available/.test(value)) return /\b(?:wohnung|zimmer)\b[\s\S]{0,80}\b(?:frei|verf[uü]gbar)\b|\b(?:frei|verf[uü]gbar)\b[\s\S]{0,80}\b(?:wohnung|zimmer)\b/i;
  if (/criteria such as size, location or price/.test(value)) return /\b(?:zimmer|gr[oö][ßs]e|quadratmeter|lage|stadtteil|miete|preis|kosten|budget|balkon)\b/i;
  if (/rental conditions/.test(value)) return /\b(?:mietbedingungen|kaution|nebenkosten|mietvertrag|vertrag)\b/i;
  if (/viewing/.test(value)) return /\b(?:besichtigen|besichtigung)\b/i;
  if (/free table/.test(value)) return /\btisch\b[\s\S]{0,70}\b(?:frei|reservieren|reservierung)\b|\b(?:frei|reservieren)\b[\s\S]{0,70}\btisch\b/i;
  if (/date, time and number of people/.test(value)) return /\b(?:uhr|personen?|leute|montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonntag)\b/i;
  if (/menu/.test(value)) return /\b(?:men[uü]|speisekarte|gerichte)\b/i;
  if (/price|costs|salary/.test(value)) return /\b(?:preis|preise|kosten|wie\s+viel|gehalt|lohn|verdienst|geb[uü]hr|beitrag)\b/i;
  if (/free room/.test(value)) return /\bzimmer\b[\s\S]{0,70}\b(?:frei|verf[uü]gbar|reservieren)\b|\b(?:frei|verf[uü]gbar)\b[\s\S]{0,70}\bzimmer\b/i;
  if (/stay details/.test(value)) return /\b(?:vom|bis|nacht|n[aä]chte|personen?|einzelzimmer|doppelzimmer|familienzimmer|datum)\b/i;
  if (/additional services/.test(value)) return /\b(?:fr[uü]hst[uü]ck|internet|wlan|parkplatz|service|leistungen)\b/i;
  if (/explain the event/.test(value)) return /\b(?:fest|festival|feier|veranstaltung|tradition)\b/i;
  if (/why it is special/.test(value)) return /\b(?:weil|denn|besonders|interessant|wichtig|traditionell)\b/i;
  if (/car is available/.test(value)) return /\b(?:auto|wagen|fahrzeug)\b[\s\S]{0,80}\b(?:frei|verf[uü]gbar|wochenende)\b/i;
  if (/documents|information are needed/.test(value)) return /\b(?:dokument|dokumente|unterlagen|information|f[uü]hrerschein|ausweis|reisepass)\b/i;
  if (/insurance/.test(value)) return /\b(?:versicherung|versichert|krankenkasse)\b/i;
  if (/open positions/.test(value)) return /\b(?:stelle|stellen|job|position)\b[\s\S]{0,70}\b(?:frei|offen|verf[uü]gbar)\b|\b(?:freie|offene)\s+(?:stelle|position)\b/i;
  if (/skills or abilities|strengths or skills/.test(value)) return /\b(?:kann|kenntnisse|f[aä]higkeiten|kompetenz|st[aä]rke|zuverl[aä]ssig|freundlich|teamf[aä]hig|flexibel)\b/i;
  if (/working hours|training times|dates or schedule/.test(value)) return /\b(?:arbeitszeit|arbeitszeiten|trainingszeit|training|wann|termin|datum|uhrzeit|tage|stunden)\b/i;
  if (/applying for the job/.test(value)) return /\b(?:bewerbe|bewerbung|stelle|position|interessiere\s+mich)\b/i;
  if (/relevant experience|present relevant experience|your experience or motivation/.test(value)) return /\b(?:erfahrung|gearbeitet|praktikum|beruf|jahre?|trainiere|spiele|motivation|seit)\b/i;
  if (/thank/.test(value)) return /\b(?:danke|vielen\s+dank|bedanke|dankbar)\b/i;
  if (/interest in the seminar/.test(value)) return /\b(?:interessiere|interesse|seminar|teilnehmen|m[oö]chte)\b/i;
  if (/seminar content/.test(value)) return /\b(?:inhalt|themen|programm)\b/i;
  if (/course place is available/.test(value)) return /\b(?:kurs|platz|pl[aä]tze)\b[\s\S]{0,70}\b(?:frei|verf[uü]gbar)\b/i;
  if (/appointment/.test(value)) return /\btermin\b/i;
  if (/examinations or treatments/.test(value)) return /\b(?:untersuchung|behandlung|test|therapie|untersuchen)\b/i;
  if (/why you need the medication/.test(value)) return /\b(?:medikament|tabletten?|schmerzen?|krank|husten|fieber|allergie|brauche|ben[oö]tige)\b/i;
  if (/dosage or side effects/.test(value)) return /\b(?:dosierung|wie\s+oft|wie\s+viele|einnehmen|nebenwirkung|nebenwirkungen)\b/i;
  if (/blocked card can be unblocked/.test(value)) return /\bkarte\b[\s\S]{0,90}\b(?:gesperrt|entsperrt|entsperren)\b/i;
  if (/how long the process/.test(value)) return /\b(?:wie\s+lange|dauer|dauern)\b/i;
  if (/describe the weekend plans/.test(value)) return /\b(?:wochenende|plan|machen|fahren|gehen|besonders)\b/i;
  if (/explain why you need a car/.test(value)) return /\b(?:auto|wagen)\b[\s\S]{0,140}\b(?:brauche|ben[oö]tige|weil|arbeit|schule|weg|fahren)\b/i;
  if (/recommended model|model recommendation/.test(value)) return /\b(?:modell|empfehlen|empfehlung|welches\s+(?:auto|handy|modell))\b/i;
  if (/morning and work or school/.test(value)) return /\b(?:morgens?|aufstehen|fr[uü]hst[uü]ck|arbeit|arbeite|schule|unterricht|beginnt|fahre|gehe)\b/i;
  if (/in the evening/.test(value)) return /\b(?:abends?|abend|nach\s+der\s+arbeit|fernsehen|koche|esse|sport|ruhe|schlafe)\b/i;
  if (/friend's daily routine/.test(value)) return /(?:dein(?:e|en)?\s+tagesablauf|was\s+machst\s+du\s+(?:morgens|abends|jeden\s+tag)|wie\s+sieht\s+dein\s+tag)/i;
  if (/help benefited you/.test(value)) return /\b(?:geholfen|hilfe|dadurch|deshalb|weil|besser|entlastet|krank)\b/i;
  if (/return the favour|give something back/.test(value)) return /\b(?:revanchieren|zur[uü]ckgeben|gerne\s+helfen|einladen|etwas\s+f[uü]r\s+(?:sie|dich))\b/i;
  if (/exact product problem/.test(value)) return /\b(?:kaputt|defekt|funktioniert\s+nicht|falsch|besch[aä]digt|schlecht|problem)\b/i;
  if (/exchange, repair or refund/.test(value)) return /\b(?:umtausch|umtauschen|reparieren|reparatur|geld\s+zur[uü]ck|erstattung|zur[uü]ckerstatten)\b/i;
  if (/why you need a new phone/.test(value)) return /\b(?:handy|telefon|smartphone)\b[\s\S]{0,140}\b(?:verloren|weg|brauche|ben[oö]tige|neu)\b/i;
  if (/ordering/.test(value)) return /\b(?:bestellen|bestellung|online\s+bestellen|kaufen)\b/i;
  if (/delivery/.test(value)) return /\b(?:lieferung|liefern|versand|wie\s+lange)\b/i;
  if (/future career, study or training/.test(value)) return /\b(?:werde|m[oö]chte|will|habe\s+vor)\b[\s\S]{0,120}\b(?:arbeit|job|beruf|studium|studieren|ausbildung|weiterbildung|kurs)\b/i;
  if (/another important future goal/.test(value)) return /\b(?:familie|reisen|reise|gesundheit|deutsch|sprache|wohnen|umziehen|sport|sparen|ausland)\b/i;
  if (/friend about their future plans/.test(value)) return /(?:was\s+wirst\s+du|was\s+m[oö]chtest\s+du|welche\s+pl[aä]ne\s+hast\s+du|deine\s+pl[aä]ne)/i;

  return null;
}

export function evaluateWritingTaskEvidence(task = {}, source = "") {
  const text = String(source || "");
  return (Array.isArray(task.taskPoints) ? task.taskPoints : []).map((rawPoint, index) => {
    const label = clean(typeof rawPoint === "string" ? rawPoint : rawPoint?.label);
    const pattern = ruleForPoint(label, task.assignmentKey);
    if (!pattern) {
      return {
        index,
        label,
        status: "review",
        evidence: "",
        reason: "No deterministic evidence rule is configured for this point; tutor or AI review is required.",
      };
    }
    const matched = test(pattern, text);
    return {
      index,
      label,
      status: matched ? "met" : "missing",
      evidence: matched ? firstEvidence(text, pattern) : "",
      reason: matched
        ? "The submission contains language that directly supports this task point."
        : "No task-relevant evidence for this required point was found in Teil 2.",
    };
  });
}

export function missingTaskPointsFromEvidence(evidence = []) {
  return (Array.isArray(evidence) ? evidence : [])
    .filter((item) => item?.status === "missing")
    .map((item) => clean(item.label))
    .filter(Boolean);
}

export function taskEvidenceSummary(evidence = []) {
  const items = Array.isArray(evidence) ? evidence : [];
  const met = items.filter((item) => item.status === "met").length;
  const missing = items.filter((item) => item.status === "missing").length;
  const review = items.filter((item) => item.status === "review").length;
  return { met, missing, review, total: items.length };
}
