function writingSectionText(submission = "") {
  let source = String(submission || "").trim();
  const laterPart = source.search(/(?:^|\n)\s*(?:teil\s*[34]|lesen|reading|h[oö]ren|hoeren|listening)\b/i);
  if (laterPart >= 0) source = source.slice(0, laterPart);
  return source.replace(/^\s*teil\s*2\b[^\n]*[:·]?\s*/i, "").trim();
}

function sentenceList(source = "") {
  return String(source || "")
    .split(/(?<=[.!?])\s+|\n+/)
    .map((value) => value.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function connectorSet(source = "") {
  return new Set((String(source || "").match(/\b(?:weil|denn|deshalb|daher|aber|jedoch|trotzdem|obwohl|wenn|dass|damit|während|einerseits|andererseits|außerdem|zudem|dann|bevor|nachdem|als|sowie|alternativ)\b/gi) || [])
    .map((value) => value.toLocaleLowerCase("de")));
}

function subordinateCount(source = "") {
  return (String(source || "").match(/\b(?:weil|dass|obwohl|wenn|damit|während|bevor|nachdem|als)\b/gi) || []).length;
}

function quoteSentence(source = "", pattern) {
  const sentence = sentenceList(source).find((value) => pattern.test(value));
  if (!sentence) return "";
  const clean = sentence.replace(/[.!?]+$/, "");
  return clean.length > 105 ? `${clean.slice(0, 102).trim()}…` : clean;
}

function unique(values = []) {
  return [...new Set(values.filter(Boolean))];
}

function b1FormalLetter(source = "") {
  const points = [];
  const asksAppointment = /\b(?:termin|besichtig|freitag|samstag|uhr)\b/i.test(source);
  const asksAddress = /\b(?:adresse|anschrift)\b/i.test(source);
  const asksDocuments = /\b(?:unterlagen|dokument|mitbringen)\b/i.test(source);
  const politeSentence = quoteSentence(source, /\b(?:wäre .{0,45} möglich|könnten sie|bitte bestätigen|teilen sie mir|möchte gern wissen)\b/i);

  if (asksAppointment && asksAddress && asksDocuments) {
    points.push("Your Teil 2 letter is task-focused: you request a viewing, propose a concrete appointment, and ask for the exact address and documents to bring");
  } else if (asksAppointment && (asksAddress || asksDocuments)) {
    points.push("Your Teil 2 letter develops the request beyond the opening: you propose a concrete appointment and ask for the practical information needed to attend");
  } else {
    points.push("Your Teil 2 letter has a clear purpose and develops the request in a logical order instead of relying only on a formal greeting");
  }

  if (politeSentence) {
    points.push(`Polite B1 wording such as “${politeSentence}” makes the request natural and appropriately formal`);
  }

  const connectors = connectorSet(source);
  const clauses = subordinateCount(source);
  if (connectors.size >= 4 && clauses >= 2) {
    points.push("Your language range is clearly above basic coordination: you link reasons, alternatives and consequences with varied sentence structures");
  } else {
    points.push("For a stronger B1 response, extend the language range with one more subordinate clause and vary the connectors beyond simple coordination");
  }
  return points;
}

function b1OpinionText(source = "") {
  const points = [];
  const position = /\b(?:meiner meinung nach|ich bin der meinung|ich denke|ich finde|ich glaube|ich vertrete die ansicht)\b/i.test(source);
  const contrast = /\beinerseits\b/i.test(source) && /\bandererseits\b/i.test(source)
    || /\b(?:jedoch|allerdings|dagegen|während)\b/i.test(source);
  const example = /\b(?:zum beispiel|beispielsweise|etwa|bei einer|ein beispiel)\b/i.test(source);
  const conclusion = /\b(?:zusammenfassend|abschließend|insgesamt|deshalb glaube ich|daher bin ich)\b/i.test(source);
  const exampleSentence = quoteSentence(source, /\b(?:zum beispiel|beispielsweise|bei einer|ein beispiel)\b/i);

  if (position && contrast && example) {
    points.push("Your Teil 2 argument is developed, not just stated: you give a clear position, contrast both sides and support it with a concrete example");
  } else if (position && contrast) {
    points.push("Your position is clear and you compare different sides of the issue, which gives the text a genuine argumentative structure");
  } else if (position) {
    points.push("Your position is easy to identify; the next step is to develop it with a contrasting view and concrete support");
  } else {
    points.push("The response stays on topic, but the argument would be stronger if your position were stated more explicitly and then developed");
  }

  if (exampleSentence) {
    points.push(`The example “${exampleSentence}” strengthens the argument because it turns the general point into a specific situation`);
  } else if (example) {
    points.push("You support the discussion with a concrete example rather than leaving the reasons abstract");
  }

  if (conclusion) {
    points.push("The conclusion returns to your position and gives the response a complete introduction–development–conclusion shape");
  }

  const connectors = connectorSet(source);
  const clauses = subordinateCount(source);
  if (connectors.size >= 4 && clauses >= 1) {
    points.push("Your linking language shows useful B1 range; for the next task, develop one central reason in more depth instead of adding several short points");
  } else {
    points.push("For stronger B1 writing, develop one reason through cause and consequence and add a second sentence pattern with connectors such as obwohl, während, deshalb or dass");
  }
  return points;
}

function a2Writing(source = "") {
  const points = [];
  const formal = /\bsehr geehrte\b/i.test(source);
  const informal = /(?:^|\n)\s*(?:hallo|liebe?r?)\b/i.test(source);
  const questionCount = (source.match(/\?/g) || []).length;
  const practical = /\b(?:montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonntag|uhr|adresse|termin|telefon|e-mail|bahnhof|café|restaurant|arbeit|familie|wohnung|wochenende)\b/i.test(source);
  const polite = /\b(?:könnten sie|wäre .{0,45} möglich|bitte|möchte gern|würde gern)\b/i.test(source);
  const connectors = connectorSet(source);
  const clauses = subordinateCount(source);

  if (formal) {
    points.push("Your Teil 2 message develops the purpose beyond the salutation: the request is clear, the details are organised, and the closing fits a formal situation");
  } else if (informal) {
    points.push("Your Teil 2 message develops the reason for writing in complete sentences and keeps a natural personal tone from the opening through the closing");
  } else {
    points.push("Your Teil 2 response has a clear purpose and develops the message in connected sentences rather than as isolated information");
  }

  if (practical && questionCount > 0) {
    points.push("You include concrete details and a relevant question, so the reader knows both the situation and what response you need");
  } else if (practical) {
    points.push("Concrete details make the message easy to follow and give the content more substance than a very short basic answer");
  } else if (questionCount > 0) {
    points.push("The question gives the message a clear communicative goal instead of simply describing the situation");
  }

  if (polite) {
    points.push("Your request wording is appropriately polite for A2 and shows more control than a direct command");
  }

  if (connectors.size >= 3 && clauses >= 1) {
    points.push("You already connect ideas with more than one structure; next, vary sentence openings and add one more developed detail to make the text less repetitive");
  } else {
    points.push("For stronger A2 writing, add one more developed detail and vary how you connect ideas, for example with deshalb, aber, dann or a dass-clause where it fits naturally");
  }
  return points;
}

export function writingDepthSentences(result = {}, submission = "", explicitLevel = "") {
  const level = String(explicitLevel || result.level || result.detectedLevel || result.ai?.detectedLevel || "").toUpperCase().match(/\b(A1|A2|B1)\b/)?.[1] || "";
  if (level !== "A2" && level !== "B1") return [];

  const source = writingSectionText(submission);
  const words = source.split(/\s+/).filter(Boolean).length;
  if (words < 20) return [];

  if (level === "A2") return unique(a2Writing(source)).slice(0, 4);

  const formal = /\bsehr geehrte\b/i.test(source) && /\bmit freundlichen gr(?:ü|u)(?:ß|ss)en\b/i.test(source);
  const opinion = /\b(?:meiner meinung nach|ich bin der meinung|ich denke|ich finde|ich glaube|einerseits|andererseits|zusammenfassend)\b/i.test(source);
  return unique(formal && !opinion ? b1FormalLetter(source) : b1OpinionText(source)).slice(0, 4);
}
