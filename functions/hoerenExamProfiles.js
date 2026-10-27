"use strict";
// Adapted original Goethe-style Hören PRACTICE profiles. These are not official exam materials.
// Kept on the server and returned to the owner-only Studio status API.
const EXAM_PROFILES = Object.freeze({
  "A1": {
    "1": {
      "label": "Sechs kurze Gespräche · a–c",
      "type": "dialogue",
      "kind": "multiple-choice",
      "questionCount": 6,
      "repeats": 2,
      "wordTarget": 170,
      "structure": "sechs kurze, eigenständige Alltagsszenen mit je einer a–c-Aufgabe. In der offiziellen Prüfung sind manche Antwortoptionen bebildert; hier als textbasierte Aufgaben adaptiert.",
      "topic": "Einkaufen, Familie und Termine",
      "part": "1",
      "level": "A1",
      "examLabel": "Teil",
      "preview": "A: Hören Teil eins. Sie hören sechs kurze Gespräche. Kreuzen Sie die richtige Antwort an.\nA: Nummer eins.\nB: Entschuldigung, wann fährt der Zug?\nC: Um acht Uhr fünfzehn.\n[PAUSE 3]\nA: Nummer zwei.\nB: Guten Tag! Was kostet das Brot?\nC: Zwei Euro, bitte."
    },
    "2": {
      "label": "Vier Durchsagen · Richtig/Falsch",
      "type": "announcement",
      "kind": "richtig-falsch",
      "questionCount": 4,
      "repeats": 1,
      "wordTarget": 125,
      "structure": "vier kurze öffentliche Durchsagen oder Informationen, jeweils eine Richtig/Falsch-Aussage; jeder Text einmal hören.",
      "topic": "Durchsagen in der Stadt",
      "part": "2",
      "level": "A1",
      "examLabel": "Teil",
      "preview": "A: Hören Teil zwei. Sie hören vier kurze Informationen. Kreuzen Sie richtig oder falsch an.\nA: Nummer sieben.\nB: Achtung! Die Kundeninformation schließt heute schon um siebzehn Uhr.\n[PAUSE 3]\nA: Nummer acht.\nC: Der Zug nach Hamburg fährt heute von Gleis vier."
    },
    "3": {
      "label": "Fünf Informationen · a–c",
      "type": "telephone",
      "kind": "multiple-choice",
      "questionCount": 5,
      "repeats": 2,
      "wordTarget": 140,
      "structure": "fünf kurze Alltagsinformationen oder Telefonansagen; je eine a–c-Aufgabe, jeden Text zweimal hören.",
      "topic": "Nachrichten und Verabredungen",
      "part": "3",
      "level": "A1",
      "examLabel": "Teil",
      "preview": "A: Hören Teil drei. Sie hören fünf Informationen. Kreuzen Sie die richtige Antwort an.\nA: Nummer elf.\nB: Hallo Lina, ich komme um fünf Uhr zum Bahnhof.\n[PAUSE 3]\nA: Nummer zwölf.\nC: Hier ist die Praxis Müller. Ihr Termin ist am Mittwoch um zehn Uhr."
    }
  },
  "A2": {
    "1": {
      "label": "Fünf kurze Hörtexte",
      "type": "radio",
      "kind": "multiple-choice",
      "questionCount": 5,
      "repeats": 2,
      "wordTarget": 155,
      "structure": "fünf kurze Radiomeldungen, Ansagen oder Nachrichten mit klaren Alltagshinweisen; trenne die Texte durch [PAUSE 3]",
      "topic": "Unterwegs in der Stadt",
      "part": "1",
      "level": "A2",
      "examLabel": "Teil",
      "preview": "A: Guten Tag und willkommen zur heutigen Sendung.\nA: Unser Thema betrifft viele Menschen im Alltag.\nA: Wir schauen uns dazu unterschiedliche Perspektiven an."
    },
    "2": {
      "label": "Gespräch und Zuordnung",
      "type": "dialogue",
      "kind": "multiple-choice",
      "questionCount": 5,
      "repeats": 1,
      "wordTarget": 165,
      "structure": "ein zusammenhängendes Gespräch über einen Wochenplan; die offizielle Aufgabe ordnet Bilder a–i zu; hier als textbasierte Auswahlaufgabe adaptiert",
      "topic": "Freizeit in der Woche",
      "part": "2",
      "level": "A2",
      "examLabel": "Teil",
      "preview": "A: Guten Tag und willkommen zur heutigen Sendung.\nA: Unser Thema betrifft viele Menschen im Alltag.\nA: Wir schauen uns dazu unterschiedliche Perspektiven an."
    },
    "3": {
      "label": "Fünf kurze Gespräche",
      "type": "dialogue",
      "kind": "multiple-choice",
      "questionCount": 5,
      "repeats": 1,
      "wordTarget": 165,
      "structure": "fünf kurze, unterschiedliche Alltagsszenen, jeweils eine dreifache Auswahlfrage; mit kurzen Trennpausen",
      "topic": "Einkaufen und Termine",
      "part": "3",
      "level": "A2",
      "examLabel": "Teil",
      "preview": "A: Guten Tag und willkommen zur heutigen Sendung.\nA: Unser Thema betrifft viele Menschen im Alltag.\nA: Wir schauen uns dazu unterschiedliche Perspektiven an."
    },
    "4": {
      "label": "Interview · Ja/Nein",
      "type": "interview",
      "kind": "richtig-falsch",
      "questionCount": 5,
      "repeats": 2,
      "wordTarget": 190,
      "structure": "ein persönliches Interview; Fragen im Sinne der Ja/Nein-Aussagen, im Editor als Richtig/Falsch dargestellt",
      "topic": "Ein neuer Job",
      "part": "4",
      "level": "A2",
      "examLabel": "Teil",
      "preview": "A: Guten Tag, vielen Dank, dass Sie heute bei uns sind.\nB: Guten Tag. Ich freue mich über die Einladung.\nA: Welche Entwicklungen sind für dieses Thema besonders wichtig?\nB: Vor allem müssen wir die langfristigen Auswirkungen betrachten."
    }
  },
  "B1": {
    "1": {
      "label": "Kurze Alltagstexte",
      "type": "radio",
      "kind": "richtig-falsch",
      "questionCount": 5,
      "repeats": 2,
      "wordTarget": 185,
      "structure": "fünf kurze Nachrichten oder Dialoge; die Originalprüfung kombiniert Richtig/Falsch und a–c, hier ist ein prüfungsnahes Übungsset mit fünf Aussagen",
      "topic": "Reisen und Termine",
      "part": "1",
      "level": "B1",
      "examLabel": "Teil",
      "preview": "A: Guten Tag und willkommen zur heutigen Sendung.\nA: Unser Thema betrifft viele Menschen im Alltag.\nA: Wir schauen uns dazu unterschiedliche Perspektiven an."
    },
    "2": {
      "label": "Durchsage / Führung",
      "type": "announcement",
      "kind": "multiple-choice",
      "questionCount": 5,
      "repeats": 1,
      "wordTarget": 210,
      "structure": "eine öffentliche Ansage oder Führung, Fragen zu wesentlichen Einzelheiten",
      "topic": "Eine Stadtführung",
      "part": "2",
      "level": "B1",
      "examLabel": "Teil",
      "preview": "A: Guten Tag und willkommen zur heutigen Sendung.\nA: Unser Thema betrifft viele Menschen im Alltag.\nA: Wir schauen uns dazu unterschiedliche Perspektiven an."
    },
    "3": {
      "label": "Alltagsgespräch",
      "type": "dialogue",
      "kind": "richtig-falsch",
      "questionCount": 7,
      "repeats": 1,
      "wordTarget": 210,
      "structure": "ein längeres privates Gespräch mit sieben Richtig/Falsch-Aussagen",
      "topic": "Ein Fest organisieren",
      "part": "3",
      "level": "B1",
      "examLabel": "Teil",
      "preview": "A: Guten Tag und willkommen zur heutigen Sendung.\nA: Unser Thema betrifft viele Menschen im Alltag.\nA: Wir schauen uns dazu unterschiedliche Perspektiven an."
    },
    "4": {
      "label": "Diskussion · Sprecher zuordnen",
      "type": "discussion",
      "kind": "multiple-choice",
      "questionCount": 8,
      "repeats": 2,
      "wordTarget": 280,
      "structure": "eine moderierte Diskussion mit Moderator B, Person C und Person D; jede Aufgabe ordnet eine Aussage einem Sprecher zu; verwende dieselben drei Sprecheroptionen",
      "topic": "Kinder und Medien",
      "part": "4",
      "level": "B1",
      "examLabel": "Teil",
      "preview": "A: Willkommen zur heutigen Diskussion. Wir sprechen über ein wichtiges Thema.\nB: Ich finde, dass wir die Vorteile nicht unterschätzen sollten.\nC: Ich sehe einige Risiken, die noch diskutiert werden müssen."
    }
  },
  "B2": {
    "1": {
      "label": "Kurze Äußerungen",
      "type": "radio",
      "kind": "richtig-falsch",
      "questionCount": 5,
      "repeats": 1,
      "wordTarget": 185,
      "structure": "fünf kurze Radioausschnitte und Gespräche; das Vorbild mischt Richtig/Falsch und Mehrfachwahl, hier fünf Richtig/Falsch-Aussagen",
      "topic": "Studium und Alltag",
      "part": "1",
      "level": "B2",
      "examLabel": "Teil",
      "preview": "A: Guten Tag und willkommen zur heutigen Sendung.\nA: Unser Thema betrifft viele Menschen im Alltag.\nA: Wir schauen uns dazu unterschiedliche Perspektiven an."
    },
    "2": {
      "label": "Radiointerview",
      "type": "interview",
      "kind": "multiple-choice",
      "questionCount": 6,
      "repeats": 2,
      "wordTarget": 285,
      "structure": "ein Interview über Forschung oder Gesellschaft, sechs detailbezogene a–c-Aufgaben",
      "topic": "Innovationen im Alltag",
      "part": "2",
      "level": "B2",
      "examLabel": "Teil",
      "preview": "A: Guten Tag, vielen Dank, dass Sie heute bei uns sind.\nB: Guten Tag. Ich freue mich über die Einladung.\nA: Welche Entwicklungen sind für dieses Thema besonders wichtig?\nB: Vor allem müssen wir die langfristigen Auswirkungen betrachten."
    },
    "3": {
      "label": "Gespräch · Wer sagt was?",
      "type": "discussion",
      "kind": "multiple-choice",
      "questionCount": 6,
      "repeats": 1,
      "wordTarget": 260,
      "structure": "Gespräch zwischen drei Personen mit Aussagen zur Zuordnung; dieselben drei Sprecheroptionen für alle Aussagen",
      "topic": "Neue Wohnformen",
      "part": "3",
      "level": "B2",
      "examLabel": "Teil",
      "preview": "A: Willkommen zur heutigen Diskussion. Wir sprechen über ein wichtiges Thema.\nB: Ich finde, dass wir die Vorteile nicht unterschätzen sollten.\nC: Ich sehe einige Risiken, die noch diskutiert werden müssen."
    },
    "4": {
      "label": "Vortrag",
      "type": "lecture",
      "kind": "multiple-choice",
      "questionCount": 8,
      "repeats": 2,
      "wordTarget": 335,
      "structure": "ein strukturierter sachlicher Vortrag mit acht inferenzorientierten Mehrfachwahlaufgaben",
      "topic": "Gesund leben und arbeiten",
      "part": "4",
      "level": "B2",
      "examLabel": "Teil",
      "preview": "A: Guten Tag. In meinem heutigen Vortrag möchte ich drei wichtige Aspekte vorstellen.\nA: Erstens sollten wir den historischen Hintergrund verstehen.\nA: Zweitens müssen wir aktuelle Herausforderungen berücksichtigen."
    }
  },
  "C1": {
    "1": {
      "label": "Podcast · Buch 1/2/3",
      "type": "podcast",
      "kind": "multiple-choice",
      "questionCount": 6,
      "repeats": 1,
      "wordTarget": 420,
      "structure": "ein zusammenhängender Buchpodcast (ca. 420 Wörter), der DREI erfundene aktuelle Bücher nacheinander rezensiert. Jedes Buch hat einen eindeutigen Titel, Genre, Inhalt und unterscheidbare Merkmale. Sechs Aussagen werden genau einem der Bücher zugeordnet. Jede Aufgabe hat exakt dieselben drei Optionen 'Buch 1 – <Titel 1>', 'Buch 2 – <Titel 2>', 'Buch 3 – <Titel 3>'; korrekte Optionen über alle Bücher verteilen. Einmaliges Hören, 60 Sekunden Lesezeit.",
      "topic": "Drei Bücher über Mensch und Natur",
      "part": "1",
      "level": "C1",
      "examLabel": "Teil",
      "preview": "A: Willkommen bei Lesezeit. Heute stelle ich Ihnen drei ganz unterschiedliche neue Bücher vor.\nA: Buch eins ist ein Roman, der in einer Forschungsstation spielt. Er verbindet Abenteuer mit schwierigen persönlichen Entscheidungen.\nA: Buch zwei ist ein Sachbuch über historische Handelswege und die Entwicklung internationaler Beziehungen.\nA: Buch drei untersucht die Folgen menschlicher Eingriffe in die Umwelt und entwickelt Szenarien für die Zukunft.\nA: Vielen Dank fürs Zuhören. Bis zur nächsten Ausgabe."
    },
    "2": {
      "label": "Radiointerview",
      "type": "interview",
      "kind": "multiple-choice",
      "questionCount": 9,
      "repeats": 2,
      "wordTarget": 420,
      "structure": "ein fundiertes Radiointerview mit anspruchsvollen Argumenten; je Aussage die Antwort 'stimmt', 'stimmt nicht' oder 'dazu wird nichts gesagt' – alle drei Optionen identisch bei jeder Frage",
      "topic": "Technik und Gesellschaft",
      "part": "2",
      "level": "C1",
      "examLabel": "Teil",
      "preview": "A: Guten Tag, vielen Dank, dass Sie heute bei uns sind.\nB: Guten Tag. Ich freue mich über die Einladung.\nA: Welche Entwicklungen sind für dieses Thema besonders wichtig?\nB: Vor allem müssen wir die langfristigen Auswirkungen betrachten."
    },
    "3": {
      "label": "Diskussion",
      "type": "discussion",
      "kind": "multiple-choice",
      "questionCount": 8,
      "repeats": 1,
      "wordTarget": 400,
      "structure": "eine authentische Diskussion mit differenzierten Positionen, acht Fragen zu Meinungen und Schlussfolgerungen",
      "topic": "Zukunft der Arbeit",
      "part": "3",
      "level": "C1",
      "examLabel": "Teil",
      "preview": "A: Willkommen zur heutigen Diskussion. Wir sprechen über ein wichtiges Thema.\nB: Ich finde, dass wir die Vorteile nicht unterschätzen sollten.\nC: Ich sehe einige Risiken, die noch diskutiert werden müssen."
    },
    "4": {
      "label": "Vortrag / mehrere Stimmen",
      "type": "lecture",
      "kind": "multiple-choice",
      "questionCount": 7,
      "repeats": 2,
      "wordTarget": 430,
      "structure": "anspruchsvoller Vortrag oder Gespräch mit unterschiedlichen Standpunkten und sieben Aufgaben zu Kernaussagen und Nuancen",
      "topic": "Wissenschaft und Ethik",
      "part": "4",
      "level": "C1",
      "examLabel": "Teil",
      "preview": "A: Guten Tag. In meinem heutigen Vortrag möchte ich drei wichtige Aspekte vorstellen.\nA: Erstens sollten wir den historischen Hintergrund verstehen.\nA: Zweitens müssen wir aktuelle Herausforderungen berücksichtigen."
    }
  },
  "C2": {
    "1": {
      "label": "Aufgabe 1 · Radiosendungen",
      "type": "radio",
      "kind": "richtig-falsch",
      "questionCount": 5,
      "repeats": 1,
      "wordTarget": 260,
      "structure": "ein Ausschnitt einer anspruchsvollen Radiosendung mit fünf Ja/Nein-Aussagen als Übungsabschnitt; vollständiger Goethe-Aufgabensatz umfasst fünf Ausschnitte mit 15 Aussagen",
      "topic": "Kultur und Forschung",
      "part": "1",
      "level": "C2",
      "examLabel": "Aufgabe",
      "preview": "A: Guten Tag und willkommen zur heutigen Sendung.\nA: Unser Thema betrifft viele Menschen im Alltag.\nA: Wir schauen uns dazu unterschiedliche Perspektiven an."
    },
    "2": {
      "label": "Aufgabe 2 · Zwei Standpunkte",
      "type": "dialogue",
      "kind": "multiple-choice",
      "questionCount": 5,
      "repeats": 1,
      "wordTarget": 270,
      "structure": "ein Gespräch zweier Studierender. Jede der fünf Aussagen ist Person 1, Person 2 oder Beide zuzuordnen, mit denselben drei Optionen",
      "topic": "Gesellschaftlicher Wandel",
      "part": "2",
      "level": "C2",
      "examLabel": "Aufgabe",
      "preview": "A: Guten Tag und willkommen zur heutigen Sendung.\nA: Unser Thema betrifft viele Menschen im Alltag.\nA: Wir schauen uns dazu unterschiedliche Perspektiven an."
    },
    "3": {
      "label": "Aufgabe 3 · Fachinterview",
      "type": "interview",
      "kind": "multiple-choice",
      "questionCount": 10,
      "repeats": 2,
      "wordTarget": 430,
      "structure": "ein anspruchsvolles Fachinterview mit zehn a–c-Fragen zu Details, Argumenten und Implikationen",
      "topic": "Klimaforschung und Städte",
      "part": "3",
      "level": "C2",
      "examLabel": "Aufgabe",
      "preview": "A: Guten Tag, vielen Dank, dass Sie heute bei uns sind.\nB: Guten Tag. Ich freue mich über die Einladung.\nA: Welche Entwicklungen sind für dieses Thema besonders wichtig?\nB: Vor allem müssen wir die langfristigen Auswirkungen betrachten."
    }
  }
});
function getExamProfile(level, part) {
  return EXAM_PROFILES[String(level || "").toUpperCase()]?.[String(part || "")] || null;
}
function buildExamPrompt(profile, topic, questionInstructions) {
  const speakerRule = "A: is ONLY the spoken exam instructor (title, instructions, Beispiel, Nummer eins and ending). B:, C: and D: are task speakers, different from A:. Rotate B/C/D for unrelated short talks, announcements and calls. For dialogues use B: and C:; for three-person discussions use B:, C:, D:. Each speaker turn must begin on a new line. Long natural sentences and complete Goethe passages are allowed; audio is split automatically into safe TTS clips without deleting words. Place [PAUSE 3] on its own line between texts. Do not include timestamps or unspoken stage directions.";
  return [
    "Create an ORIGINAL, copyright-safe German Hören PRACTICE task, not an official Goethe recording.",
    "Target Goethe-Zertifikat " + profile.level + " Hören " + profile.examLabel + " " + profile.part + ": " + profile.label + ".",
    "Topic: " + topic + ".",
    "Required authentic-style format: " + profile.structure + ".",
    "Write around " + profile.wordTarget + " SPOKEN German words, with suitable CEFR " + profile.level + " vocabulary and natural pacing.",
    speakerRule,
    ...(["dialogue", "interview", "discussion"].includes(profile.type) ? ["MANDATORY CONVERSATION VOICES: A: is the instruction voice only. B: and C: speak the conversation, and D: speaks the third participant when required. Every independent dialogue needs two task speakers, not the same voice. The narrator A: must not be a dialogue partner."] : []),
    "Use rich and internally consistent details, avoid repeated generic assertions. Ensure every answer is unambiguous from the spoken script.",
    questionInstructions
  ].join("\n");
}
module.exports = { EXAM_PROFILES, getExamProfile, buildExamPrompt };
