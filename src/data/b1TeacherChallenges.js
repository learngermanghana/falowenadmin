// Teacher-only B1 oral scenario missions. These replace a focused practice page,
// never a grammar check, speaking task, or workbook assignment.
const definitions = [
  {
    "assignmentId": "B1-2.5",
    "title": "Apartment Simulator",
    "eyebrow": "Wohnungsbesichtigung",
    "grammar": "Könnten Sie mir sagen, ob ...?",
    "goal": "Ask polite questions with Konjunktiv II and indirect questions.",
    "scenarios": [
      {
        "id": "scenario-1",
        "label": "Altbauwohnung",
        "icon": "🏠",
        "context": "Die Wohnung kostet 780 Euro warm. Der Vermieter nennt die Nebenkosten nicht.",
        "steps": [
          {
            "actionDe": "Situation verstehen",
            "questionDe": "Frage höflich nach den Nebenkosten.",
            "modelDe": "Könnten Sie mir sagen, ob die Nebenkosten in der Miete enthalten sind?"
          },
          {
            "actionDe": "Passend reagieren",
            "questionDe": "Frage nach der Kaution.",
            "modelDe": "Könnten Sie mir sagen, wie hoch die Kaution ist?"
          },
          {
            "actionDe": "Lösung formulieren",
            "questionDe": "Vereinbare einen Besichtigungstermin.",
            "modelDe": "Könnten wir die Wohnung am Freitag besichtigen?"
          }
        ]
      },
      {
        "id": "scenario-2",
        "label": "Kleine Stadtwohnung",
        "icon": "🏠",
        "context": "Die Wohnung liegt zentral, aber es gibt keine Angaben zum Balkon.",
        "steps": [
          {
            "actionDe": "Situation verstehen",
            "questionDe": "Frage nach dem Balkon.",
            "modelDe": "Könnten Sie mir sagen, ob die Wohnung einen Balkon hat?"
          },
          {
            "actionDe": "Passend reagieren",
            "questionDe": "Frage nach der Verkehrsanbindung.",
            "modelDe": "Wissen Sie, wie weit die nächste Haltestelle entfernt ist?"
          },
          {
            "actionDe": "Lösung formulieren",
            "questionDe": "Bitte um einen Termin.",
            "modelDe": "Wäre eine Besichtigung am Dienstag möglich?"
          }
        ]
      },
      {
        "id": "scenario-3",
        "label": "Wohngemeinschaft",
        "icon": "🏠",
        "context": "Ein Zimmer ist frei. Die Anzeige nennt weder Mitbewohner noch Hausregeln.",
        "steps": [
          {
            "actionDe": "Situation verstehen",
            "questionDe": "Frage nach den Mitbewohnern.",
            "modelDe": "Könnten Sie mir sagen, wie viele Personen in der WG wohnen?"
          },
          {
            "actionDe": "Passend reagieren",
            "questionDe": "Frage nach den Hausregeln.",
            "modelDe": "Dürfte ich fragen, ob es feste Hausregeln gibt?"
          },
          {
            "actionDe": "Lösung formulieren",
            "questionDe": "Bitte um einen Termin.",
            "modelDe": "Könnten wir einen Termin für die Besichtigung vereinbaren?"
          }
        ]
      }
    ]
  },
  {
    "assignmentId": "B1-3.8",
    "title": "Health Coach",
    "eyebrow": "Gesundheitsberatung",
    "grammar": "Du solltest ... / Du musst ... / Du kannst ...",
    "goal": "Give differentiated advice with sollte, muss, kann and darf.",
    "scenarios": [
      {
        "id": "scenario-1",
        "label": "Wenig Bewegung",
        "icon": "💚",
        "context": "Alex sitzt den ganzen Tag und macht kaum Pausen.",
        "steps": [
          {
            "actionDe": "Situation verstehen",
            "questionDe": "Gib einen freundlichen Tipp.",
            "modelDe": "Alex sollte in der Mittagspause spazieren gehen."
          },
          {
            "actionDe": "Passend reagieren",
            "questionDe": "Nenne eine Möglichkeit.",
            "modelDe": "Alex kann jeden Abend zwanzig Minuten Sport machen."
          },
          {
            "actionDe": "Lösung formulieren",
            "questionDe": "Erkläre eine wichtige Grenze.",
            "modelDe": "Alex darf Erholung und Schlaf nicht vergessen."
          }
        ]
      },
      {
        "id": "scenario-2",
        "label": "Zu wenig Schlaf",
        "icon": "💚",
        "context": "Sam schläft oft nur fünf Stunden und lernt bis spät in die Nacht.",
        "steps": [
          {
            "actionDe": "Situation verstehen",
            "questionDe": "Gib eine Empfehlung.",
            "modelDe": "Sam sollte früher schlafen gehen."
          },
          {
            "actionDe": "Passend reagieren",
            "questionDe": "Nenne eine Notwendigkeit.",
            "modelDe": "Sam muss sich vor der Prüfung ausreichend erholen."
          },
          {
            "actionDe": "Lösung formulieren",
            "questionDe": "Nenne eine gesunde Möglichkeit.",
            "modelDe": "Sam kann vor dem Schlafengehen das Handy ausschalten."
          }
        ]
      },
      {
        "id": "scenario-3",
        "label": "Stressiger Alltag",
        "icon": "💚",
        "context": "Mina hat viel Stress und isst unterwegs oft unregelmäßig.",
        "steps": [
          {
            "actionDe": "Situation verstehen",
            "questionDe": "Gib einen Tipp.",
            "modelDe": "Mina sollte regelmäßige Pausen einplanen."
          },
          {
            "actionDe": "Passend reagieren",
            "questionDe": "Nenne eine Möglichkeit.",
            "modelDe": "Mina kann gesundes Essen vorbereiten."
          },
          {
            "actionDe": "Lösung formulieren",
            "questionDe": "Erkläre eine Grenze.",
            "modelDe": "Mina darf ihre Gesundheit nicht dauerhaft vernachlässigen."
          }
        ]
      }
    ]
  },
  {
    "assignmentId": "B1-4.12",
    "title": "Adventure Builder",
    "eyebrow": "Abenteuer erzählen",
    "grammar": "Zuerst ... / Danach ... / Als ...",
    "goal": "Tell a coherent past adventure with Perfekt, Präteritum and temporal connectors.",
    "scenarios": [
      {
        "id": "scenario-1",
        "label": "Plötzlicher Regen",
        "icon": "🏕️",
        "context": "Du wanderst im Wald. Plötzlich beginnt ein Gewitter.",
        "steps": [
          {
            "actionDe": "Situation verstehen",
            "questionDe": "Beginne die Geschichte.",
            "modelDe": "Zuerst sind wir durch den Wald gewandert."
          },
          {
            "actionDe": "Passend reagieren",
            "questionDe": "Beschreibe das Problem.",
            "modelDe": "Als das Gewitter begann, hatten wir keinen Regenschirm."
          },
          {
            "actionDe": "Lösung formulieren",
            "questionDe": "Erzähle das Ende.",
            "modelDe": "Danach haben wir eine Hütte gefunden und dort gewartet."
          }
        ]
      },
      {
        "id": "scenario-2",
        "label": "Verlorener Weg",
        "icon": "🏕️",
        "context": "Du bist mit Freunden in den Bergen und der Weg ist nicht mehr zu sehen.",
        "steps": [
          {
            "actionDe": "Situation verstehen",
            "questionDe": "Beschreibe den Anfang.",
            "modelDe": "Am Morgen sind wir in die Berge gefahren."
          },
          {
            "actionDe": "Passend reagieren",
            "questionDe": "Erkläre den Wendepunkt.",
            "modelDe": "Als es dunkel wurde, waren wir unsicher."
          },
          {
            "actionDe": "Lösung formulieren",
            "questionDe": "Erzähle die Lösung.",
            "modelDe": "Nachdem wir die Karte geprüft hatten, haben wir den Rückweg gefunden."
          }
        ]
      },
      {
        "id": "scenario-3",
        "label": "Überraschung am See",
        "icon": "🏕️",
        "context": "Du machst einen Ausflug an einen See und entdeckst ein verletztes Tier.",
        "steps": [
          {
            "actionDe": "Situation verstehen",
            "questionDe": "Erzähle, wo du warst.",
            "modelDe": "Wir waren am See und haben ein Picknick gemacht."
          },
          {
            "actionDe": "Passend reagieren",
            "questionDe": "Erzähle die Entdeckung.",
            "modelDe": "Während wir spazieren gingen, haben wir ein verletztes Tier gesehen."
          },
          {
            "actionDe": "Lösung formulieren",
            "questionDe": "Beschreibe die Reaktion.",
            "modelDe": "Danach haben wir Hilfe gerufen, weil das Tier verletzt war."
          }
        ]
      }
    ]
  },
  {
    "assignmentId": "B1-6.19",
    "title": "Interview Challenge",
    "eyebrow": "Vorstellungsgespräch",
    "grammar": "Ich würde ... / Ich könnte ... / ..., weil ...",
    "goal": "Respond professionally with Sie, Konjunktiv II and motivation clauses.",
    "scenarios": [
      {
        "id": "scenario-1",
        "label": "Ausbildungsplatz",
        "icon": "💼",
        "context": "Du bewirbst dich für einen Ausbildungsplatz im Hotel.",
        "steps": [
          {
            "actionDe": "Situation verstehen",
            "questionDe": "Stelle dich kurz vor.",
            "modelDe": "Guten Tag, ich interessiere mich für die Ausbildung, weil ich gern mit Menschen arbeite."
          },
          {
            "actionDe": "Passend reagieren",
            "questionDe": "Beschreibe eine Stärke.",
            "modelDe": "Ich könnte gut im Team arbeiten, weil ich zuverlässig bin."
          },
          {
            "actionDe": "Lösung formulieren",
            "questionDe": "Antworte auf eine Rückfrage höflich.",
            "modelDe": "Gern würde ich Ihnen mehr über meine Erfahrungen erzählen."
          }
        ]
      },
      {
        "id": "scenario-2",
        "label": "Bürojob",
        "icon": "💼",
        "context": "Du wirst zu einem Vorstellungsgespräch im Büro eingeladen.",
        "steps": [
          {
            "actionDe": "Situation verstehen",
            "questionDe": "Erkläre deine Motivation.",
            "modelDe": "Ich bewerbe mich, weil ich gerne organisiere und sorgfältig arbeite."
          },
          {
            "actionDe": "Passend reagieren",
            "questionDe": "Nenne eine Fähigkeit.",
            "modelDe": "Ich könnte Ihr Team mit meinen Computerkenntnissen unterstützen."
          },
          {
            "actionDe": "Lösung formulieren",
            "questionDe": "Stelle eine höfliche Frage.",
            "modelDe": "Könnten Sie mir sagen, wie die Einarbeitung organisiert wird?"
          }
        ]
      },
      {
        "id": "scenario-3",
        "label": "Sozialer Beruf",
        "icon": "💼",
        "context": "Du möchtest in einer sozialen Einrichtung arbeiten.",
        "steps": [
          {
            "actionDe": "Situation verstehen",
            "questionDe": "Beschreibe deine Motivation.",
            "modelDe": "Ich möchte hier arbeiten, weil ich gern anderen Menschen helfe."
          },
          {
            "actionDe": "Passend reagieren",
            "questionDe": "Erkläre deine Stärken.",
            "modelDe": "Ich würde geduldig zuhören und verantwortungsvoll handeln."
          },
          {
            "actionDe": "Lösung formulieren",
            "questionDe": "Stelle eine professionelle Frage.",
            "modelDe": "Könnten Sie mir sagen, welche Aufgaben am Anfang besonders wichtig sind?"
          }
        ]
      }
    ]
  },
  {
    "assignmentId": "B1-8.25",
    "title": "Complaint Challenge",
    "eyebrow": "Kundenbeschwerde",
    "grammar": "Ich habe ... / Deshalb bitte ich Sie ...",
    "goal": "Describe an online-shopping problem and request a remedy politely.",
    "scenarios": [
      {
        "id": "scenario-1",
        "label": "Falsche Größe",
        "icon": "📦",
        "context": "Du hast Schuhe in Größe 42 bestellt. Geliefert wurde Größe 39.",
        "steps": [
          {
            "actionDe": "Situation verstehen",
            "questionDe": "Beschreibe die Bestellung.",
            "modelDe": "Ich habe Schuhe in Größe 42 bestellt."
          },
          {
            "actionDe": "Passend reagieren",
            "questionDe": "Erkläre das Problem.",
            "modelDe": "Leider wurde Größe 39 geliefert, obwohl ich Größe 42 bestellt hatte."
          },
          {
            "actionDe": "Lösung formulieren",
            "questionDe": "Fordere eine Lösung höflich.",
            "modelDe": "Könnten Sie mir bitte die richtige Größe zuschicken?"
          }
        ]
      },
      {
        "id": "scenario-2",
        "label": "Defektes Gerät",
        "icon": "📦",
        "context": "Ein online gekaufter Kopfhörer funktioniert nicht.",
        "steps": [
          {
            "actionDe": "Situation verstehen",
            "questionDe": "Beschreibe das Problem.",
            "modelDe": "Ich habe letzte Woche Kopfhörer bestellt, die leider nicht funktionieren."
          },
          {
            "actionDe": "Passend reagieren",
            "questionDe": "Erkläre die Folge.",
            "modelDe": "Deshalb kann ich das Produkt nicht benutzen."
          },
          {
            "actionDe": "Lösung formulieren",
            "questionDe": "Bitte um eine Lösung.",
            "modelDe": "Ich bitte Sie, mir einen Ersatz zu schicken oder den Kaufpreis zu erstatten."
          }
        ]
      },
      {
        "id": "scenario-3",
        "label": "Paket fehlt",
        "icon": "📦",
        "context": "Die Bestellung sollte am Montag kommen, aber das Paket ist nicht angekommen.",
        "steps": [
          {
            "actionDe": "Situation verstehen",
            "questionDe": "Nenne die Lieferzusage.",
            "modelDe": "Laut Ihrer Bestätigung sollte das Paket am Montag ankommen."
          },
          {
            "actionDe": "Passend reagieren",
            "questionDe": "Erkläre das Problem.",
            "modelDe": "Bis heute habe ich die Lieferung leider nicht erhalten."
          },
          {
            "actionDe": "Lösung formulieren",
            "questionDe": "Bitte höflich um Klärung.",
            "modelDe": "Könnten Sie bitte prüfen, wo sich mein Paket befindet?"
          }
        ]
      }
    ]
  },
  {
    "assignmentId": "B1-9.26",
    "title": "Travel Rescue Mission",
    "eyebrow": "Reiseprobleme lösen",
    "grammar": "Wenn ... / Ich würde ... / Man könnte ...",
    "goal": "Suggest workable travel solutions with conditionals and polite requests.",
    "scenarios": [
      {
        "id": "scenario-1",
        "label": "Zug verpasst",
        "icon": "✈️",
        "context": "Du hast den Anschlusszug verpasst und kommst zu spät an.",
        "steps": [
          {
            "actionDe": "Situation verstehen",
            "questionDe": "Reagiere mit einem Wenn-Satz.",
            "modelDe": "Wenn ich den Anschlusszug verpasse, informiere ich sofort meine Freunde."
          },
          {
            "actionDe": "Passend reagieren",
            "questionDe": "Schlage eine Alternative vor.",
            "modelDe": "Ich könnte den nächsten Zug nehmen."
          },
          {
            "actionDe": "Lösung formulieren",
            "questionDe": "Bitte höflich um Hilfe.",
            "modelDe": "Könnten Sie mir sagen, wann der nächste Zug fährt?"
          }
        ]
      },
      {
        "id": "scenario-2",
        "label": "Gepäck verloren",
        "icon": "✈️",
        "context": "Dein Koffer ist nach dem Flug nicht am Gepäckband.",
        "steps": [
          {
            "actionDe": "Situation verstehen",
            "questionDe": "Formuliere eine Bedingung.",
            "modelDe": "Wenn mein Koffer nicht ankommt, melde ich das am Schalter."
          },
          {
            "actionDe": "Passend reagieren",
            "questionDe": "Schlage einen ersten Schritt vor.",
            "modelDe": "Ich würde zuerst die Gepäcknummer zeigen."
          },
          {
            "actionDe": "Lösung formulieren",
            "questionDe": "Bitte um Unterstützung.",
            "modelDe": "Könnten Sie bitte prüfen, wo mein Koffer ist?"
          }
        ]
      },
      {
        "id": "scenario-3",
        "label": "Hotelbuchung fehlt",
        "icon": "✈️",
        "context": "An der Rezeption findet man deine Hotelreservierung nicht.",
        "steps": [
          {
            "actionDe": "Situation verstehen",
            "questionDe": "Erkläre die Situation.",
            "modelDe": "Wenn die Reservierung nicht gefunden wird, zeige ich die Bestätigungs-E-Mail."
          },
          {
            "actionDe": "Passend reagieren",
            "questionDe": "Schlage eine Lösung vor.",
            "modelDe": "Man könnte die Buchungsnummer noch einmal prüfen."
          },
          {
            "actionDe": "Lösung formulieren",
            "questionDe": "Bitte höflich um Hilfe.",
            "modelDe": "Könnten Sie mir bitte ein anderes Zimmer anbieten?"
          }
        ]
      }
    ]
  }
];
export const B1_TEACHER_CHALLENGES = Object.freeze(Object.fromEntries(
  definitions.map((activity) => [activity.assignmentId, Object.freeze({
    ...activity,
    scenarios: Object.freeze(activity.scenarios.map((scenario) => Object.freeze({
      ...scenario,
      steps: Object.freeze(scenario.steps.map((step) => Object.freeze(step))),
    }))),
  })]),
));
export function getB1TeacherChallenge(assignmentId) {
  return B1_TEACHER_CHALLENGES[String(assignmentId || "").trim().toUpperCase()] || null;
}
