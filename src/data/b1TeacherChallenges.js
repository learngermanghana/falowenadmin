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
        "label": "Altbau: Miete und Termin",
        "icon": "🏠",
        "context": "Eine Altbauwohnung kostet laut Anzeige 780 Euro warm. Strom und Heizung werden nicht erklärt. Die Besichtigung ist am Mittwoch um 14 Uhr, aber du arbeitest bis 16 Uhr.",
        "steps": [
          {
            "actionDe": "Warmmiete klären",
            "questionDe": "Wie fragst du den Vermieter höflich, ob Strom und Heizung in den 780 Euro enthalten sind?",
            "modelDe": "Könnten Sie mir sagen, ob Strom und Heizung in den 780 Euro enthalten sind?"
          },
          {
            "actionDe": "Kaution verhandeln",
            "questionDe": "Du kannst eine hohe Kaution nicht auf einmal zahlen. Wie fragst du nach der Höhe und einer Ratenzahlung?",
            "modelDe": "Dürfte ich fragen, wie hoch die Kaution ist und ob ich sie in Raten zahlen könnte?"
          },
          {
            "actionDe": "Termin verschieben",
            "questionDe": "Du kannst erst nach 17 Uhr. Wie bittest du höflich um einen späteren Besichtigungstermin?",
            "modelDe": "Wäre es möglich, die Wohnung am Mittwoch nach 17 Uhr zu besichtigen?"
          }
        ]
      },
      {
        "id": "scenario-2",
        "label": "Stadtwohnung: Ausstattung",
        "icon": "🏙️",
        "context": "Die Wohnung liegt zentral, hat aber laut Anzeige weder Angaben zum Balkon noch zu den Möbeln. Du hast kein Auto und möchtest am Samstag besichtigen.",
        "steps": [
          {
            "actionDe": "Balkon und Möbel",
            "questionDe": "Wie erkundigst du dich höflich, ob ein Balkon und eine Einbauküche vorhanden sind?",
            "modelDe": "Könnten Sie mir sagen, ob die Wohnung einen Balkon und eine Einbauküche hat?"
          },
          {
            "actionDe": "Verkehrsanbindung prüfen",
            "questionDe": "Du fährst täglich zur Arbeit. Wie fragst du indirekt nach der nächsten Haltestelle?",
            "modelDe": "Wissen Sie, wie weit die nächste Bushaltestelle entfernt ist?"
          },
          {
            "actionDe": "Samstagstermin erbitten",
            "questionDe": "Der Vermieter bietet nur Freitag an. Wie schlägst du höflich Samstagvormittag vor?",
            "modelDe": "Wäre es möglich, die Wohnung stattdessen am Samstagvormittag zu besichtigen?"
          }
        ]
      },
      {
        "id": "scenario-3",
        "label": "WG: Zusammenleben",
        "icon": "🗝️",
        "context": "Du interessierst dich für ein WG-Zimmer. In der Anzeige fehlen Informationen über Mitbewohner, Ruhezeiten und Besuch. Vor einer Zusage möchtest du die WG kennenlernen.",
        "steps": [
          {
            "actionDe": "Mitbewohner kennenlernen",
            "questionDe": "Wie fragst du höflich, mit wie vielen Personen du die Wohnung teilen würdest?",
            "modelDe": "Könnten Sie mir sagen, wie viele Personen in der WG wohnen?"
          },
          {
            "actionDe": "Hausregeln erfragen",
            "questionDe": "Du lernst abends für Prüfungen. Wie erkundigst du dich nach Ruhezeiten und Besuchsregeln?",
            "modelDe": "Dürfte ich fragen, ob es feste Ruhezeiten und Regeln für Besuch gibt?"
          },
          {
            "actionDe": "Kennenlernen vereinbaren",
            "questionDe": "Du willst erst mit allen sprechen. Wie bittest du um ein gemeinsames Kennenlernen?",
            "modelDe": "Wäre es möglich, einen Termin zu vereinbaren, bei dem ich die Mitbewohner kennenlernen könnte?"
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
        "label": "Alex: Büro ohne Bewegung",
        "icon": "🚶",
        "context": "Alex sitzt täglich neun Stunden am Schreibtisch, fährt auch kurze Strecken mit dem Auto und klagt über Müdigkeit. Für ein Fitnessstudio hat Alex kein Geld.",
        "steps": [
          {
            "actionDe": "Realistischen Rat geben",
            "questionDe": "Welchen kleinen Bewegungsschritt sollte Alex schon während der Arbeit ausprobieren?",
            "modelDe": "Alex sollte jede Stunde kurz aufstehen und sich bewegen."
          },
          {
            "actionDe": "Kostenfreie Möglichkeit",
            "questionDe": "Was kann Alex nach der Arbeit tun, ohne Geld für ein Fitnessstudio auszugeben?",
            "modelDe": "Alex kann nach der Arbeit zwanzig Minuten spazieren gehen."
          },
          {
            "actionDe": "Gesunde Grenze setzen",
            "questionDe": "Alex möchte die Mittagspause streichen, um mehr zu schaffen. Was darf Alex nicht vergessen?",
            "modelDe": "Alex darf die Pausen nicht dauerhaft ausfallen lassen, weil Erholung wichtig ist."
          }
        ]
      },
      {
        "id": "scenario-2",
        "label": "Sam: Lernen statt Schlaf",
        "icon": "🌙",
        "context": "Sam lernt für eine Prüfung bis zwei Uhr morgens, schläft nur fünf Stunden und trinkt abends viel Kaffee. Am nächsten Tag kann Sam sich schlecht konzentrieren.",
        "steps": [
          {
            "actionDe": "Schlafrhythmus verbessern",
            "questionDe": "Was sollte Sam heute Abend anders machen, um ausgeruhter zu sein?",
            "modelDe": "Sam sollte früher mit dem Lernen aufhören und rechtzeitig schlafen gehen."
          },
          {
            "actionDe": "Erholung priorisieren",
            "questionDe": "Warum muss Sam ausreichend schlafen, statt die ganze Nacht weiterzulernen?",
            "modelDe": "Sam muss genug schlafen, weil gute Erholung beim Konzentrieren hilft."
          },
          {
            "actionDe": "Abendroutine vorschlagen",
            "questionDe": "Was kann Sam vor dem Schlafengehen ändern, ohne auf das Lernen zu verzichten?",
            "modelDe": "Sam kann einen Lernplan machen und abends auf Kaffee verzichten."
          }
        ]
      },
      {
        "id": "scenario-3",
        "label": "Mina: Schichtarbeit und Stress",
        "icon": "🥗",
        "context": "Mina arbeitet in wechselnden Schichten, vergisst oft zu essen und fühlt sich gestresst. In der Mittagspause gibt es wenig Zeit und keine Kantine.",
        "steps": [
          {
            "actionDe": "Essen vorausplanen",
            "questionDe": "Welchen praktischen Rat sollte Mina für Tage ohne Kantine bekommen?",
            "modelDe": "Mina sollte am Vorabend eine einfache Mahlzeit vorbereiten."
          },
          {
            "actionDe": "Pausen ermöglichen",
            "questionDe": "Wie kann Mina trotz wechselnder Schichten regelmäßige Essenspausen einplanen?",
            "modelDe": "Mina kann ihre Pausenzeiten vor jeder Schicht planen und einen Snack mitnehmen."
          },
          {
            "actionDe": "Belastung begrenzen",
            "questionDe": "Mina möchte immer zusätzliche Schichten übernehmen. Was darf sie dabei nicht vergessen?",
            "modelDe": "Mina darf ihre Erholung nicht vernachlässigen, weil sie auch Zeit zum Ausruhen braucht."
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
        "label": "Gewitter auf dem Wanderweg",
        "icon": "⛈️",
        "context": "Am Samstag wanderst du mit zwei Freunden durch einen Wald. Nach einer Stunde wird es dunkel, und ein Gewitter beginnt. Ihr entdeckt schließlich eine kleine Schutzhütte.",
        "steps": [
          {
            "actionDe": "Anfang im Perfekt",
            "questionDe": "Was habt ihr am Samstag gemacht, bevor das Wetter schlechter wurde? Erzähle im Perfekt.",
            "modelDe": "Wir sind am Samstag früh losgewandert und haben einen schönen Weg durch den Wald genommen."
          },
          {
            "actionDe": "Wendepunkt mit als",
            "questionDe": "Wie beschreibst du den Moment, als das Gewitter begann, mit als und einem Hintergrund im Präteritum?",
            "modelDe": "Als das Gewitter begann, waren wir noch weit von unserem Parkplatz entfernt."
          },
          {
            "actionDe": "Ende zeitlich verbinden",
            "questionDe": "Wie ging das Abenteuer aus? Verbinde die Ereignisse mit nachdem.",
            "modelDe": "Nachdem wir die Schutzhütte erreicht hatten, haben wir dort gewartet, bis der Regen schwächer wurde."
          }
        ]
      },
      {
        "id": "scenario-2",
        "label": "Nebel in den Bergen",
        "icon": "🥾",
        "context": "Du unternimmst mit einer Freundin eine Bergwanderung. Am Nachmittag zieht Nebel auf; ihr findet die Wegmarkierung nicht mehr. Ihr habt eine Karte und ein aufgeladenes Handy.",
        "steps": [
          {
            "actionDe": "Ausflug beginnen",
            "questionDe": "Wo seid ihr am Morgen gestartet, und was habt ihr zuerst gemacht? Verwende Perfekt.",
            "modelDe": "Am Morgen sind wir ins Gebirge gefahren und haben unsere Wanderung am Parkplatz begonnen."
          },
          {
            "actionDe": "Problem während des Weges",
            "questionDe": "Was geschah, während ihr weiterwandertet? Nutze während und Präteritum für den Hintergrund.",
            "modelDe": "Während wir weiterwanderten, wurde der Nebel dichter und wir konnten den Weg nicht mehr sehen."
          },
          {
            "actionDe": "Rückweg erzählen",
            "questionDe": "Wie habt ihr das Problem gelöst? Verwende nachdem und berichte, was danach geschah.",
            "modelDe": "Nachdem wir die Karte und das Handy geprüft hatten, haben wir den markierten Rückweg gefunden."
          }
        ]
      },
      {
        "id": "scenario-3",
        "label": "Tierrettung am See",
        "icon": "🦆",
        "context": "Du machst mit deiner Familie ein Picknick am See. Während eines Spaziergangs seht ihr einen verletzten Wasservogel. Ihr haltet Abstand und ruft eine örtliche Tierrettung.",
        "steps": [
          {
            "actionDe": "Szene im Präteritum",
            "questionDe": "Wo wart ihr, und was habt ihr vor dem Spaziergang gemacht? Verbinde war mit Perfekt.",
            "modelDe": "Wir waren am See und haben dort zuerst zusammen ein Picknick gemacht."
          },
          {
            "actionDe": "Entdeckung mit während",
            "questionDe": "Wie erzählst du die überraschende Entdeckung mit während?",
            "modelDe": "Während wir am Ufer spazieren gingen, haben wir einen verletzten Vogel entdeckt."
          },
          {
            "actionDe": "Reaktion begründen",
            "questionDe": "Was habt ihr danach getan, und warum habt ihr Abstand gehalten? Nutze danach und weil.",
            "modelDe": "Danach haben wir die Tierrettung angerufen, weil der Vogel verletzt war und Hilfe brauchte."
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
        "label": "Hotelrezeption: Beschwerde eines Gastes",
        "icon": "🏨",
        "context": "Du bewirbst dich für eine Ausbildung an einer Hotelrezeption. Im Gespräch fragt die Personalchefin nach deiner Motivation und nach einem Gast, der sich über ein lautes Zimmer beschwert.",
        "steps": [
          {
            "actionDe": "Berufswunsch erklären",
            "questionDe": "Die Personalchefin fragt: „Warum möchten Sie gerade in unserem Hotel arbeiten?“ Was antwortest du mit weil?",
            "modelDe": "Ich möchte gern in Ihrem Hotel arbeiten, weil ich Kontakt mit Menschen mag und Deutsch im Beruf einsetzen möchte."
          },
          {
            "actionDe": "Mit Gästen umgehen",
            "questionDe": "Sie fragt: „Ein Gast beschwert sich über Lärm. Wie würden Sie reagieren?“ Wie antwortest du professionell?",
            "modelDe": "Ich würde zuerst ruhig zuhören, mich für die Unannehmlichkeiten entschuldigen und nach einer Lösung suchen."
          },
          {
            "actionDe": "Teamstärke belegen",
            "questionDe": "Sie fragt: „Was könnten Sie in unser Team einbringen?“ Nenne eine Stärke und ein konkretes Beispiel.",
            "modelDe": "Ich könnte Ihr Team mit meiner Zuverlässigkeit unterstützen, weil ich bei Gruppenprojekten Aufgaben immer pünktlich erledigt habe."
          }
        ]
      },
      {
        "id": "scenario-2",
        "label": "Büro: Zwei Aufgaben gleichzeitig",
        "icon": "🗂️",
        "context": "Du bewirbst dich in einem Büro. Die Stelle erfordert Organisation, grundlegende Computerkenntnisse und Zusammenarbeit. Im Gespräch wird eine dringende Doppelaufgabe beschrieben.",
        "steps": [
          {
            "actionDe": "Motivation konkretisieren",
            "questionDe": "Der Arbeitgeber fragt: „Warum interessieren Sie sich für diese Bürostelle?“ Was antwortest du mit weil?",
            "modelDe": "Ich interessiere mich für die Stelle, weil ich gern strukturiert arbeite und Aufgaben zuverlässig organisiere."
          },
          {
            "actionDe": "Prioritäten setzen",
            "questionDe": "Er fragt: „Zwei Kollegen brauchen gleichzeitig dringend Hilfe. Wie würden Sie vorgehen?“ Was sagst du?",
            "modelDe": "Ich würde zuerst nach den Fristen fragen, die Aufgaben priorisieren und mit beiden Kollegen eine Lösung abstimmen."
          },
          {
            "actionDe": "Höfliche Rückfrage stellen",
            "questionDe": "Am Schluss heißt es: „Haben Sie noch Fragen an uns?“ Wie erkundigst du dich nach der Einarbeitung?",
            "modelDe": "Könnten Sie mir bitte sagen, wie neue Mitarbeitende in Ihrem Büro eingearbeitet werden?"
          }
        ]
      },
      {
        "id": "scenario-3",
        "label": "Pflegeeinrichtung: Mit Menschen arbeiten",
        "icon": "🤝",
        "context": "Du bewirbst dich um eine Stelle in einer sozialen Einrichtung. Du hast bei einer freiwilligen Aktion geholfen. Die Leitung fragt, wie du mit verunsicherten Menschen umgehst.",
        "steps": [
          {
            "actionDe": "Erfahrung glaubwürdig schildern",
            "questionDe": "Die Leitung fragt: „Welche Erfahrungen haben Sie mit der Betreuung von Menschen?“ Was antwortest du ohne etwas zu erfinden?",
            "modelDe": "Ich habe bei einer freiwilligen Aktion geholfen und dabei gelernt, geduldig zuzuhören."
          },
          {
            "actionDe": "Empathisch reagieren",
            "questionDe": "Sie fragt: „Eine Bewohnerin wirkt ängstlich. Was würden Sie tun?“ Wie erklärst du dein Vorgehen?",
            "modelDe": "Ich würde ruhig mit ihr sprechen, aufmerksam zuhören und bei Bedarf eine zuständige Fachkraft informieren."
          },
          {
            "actionDe": "Motivation begründen",
            "questionDe": "Sie fragt: „Warum möchten Sie in einer sozialen Einrichtung arbeiten?“ Gib eine persönliche Begründung.",
            "modelDe": "Ich möchte in Ihrer Einrichtung arbeiten, weil mir ein respektvoller Umgang mit Menschen sehr wichtig ist."
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
