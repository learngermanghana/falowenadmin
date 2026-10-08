// A2 teacher-led oral missions. Each replaces exactly one existing focused-practice page.
const definitions = [
  {
    "assignmentId": "A2-2.4",
    "title": "Meeting Planner",
    "eyebrow": "Treffen vereinbaren",
    "grammar": "Wo? / Wohin? · Dativ / Akkusativ",
    "goal": "Practise the lesson's core language in practical teacher-led A2 speaking situations.",
    "scenarios": [
      {
        "id": "scenario-1",
        "label": "Café nach der Arbeit",
        "icon": "🎯",
        "context": "Du und Lara wollt euch treffen. Lara arbeitet bis 17 Uhr; das Café am Bahnhof schließt um 19 Uhr.",
        "steps": [
          {
            "actionDe": "Situation beschreiben",
            "questionDe": "Wo wartet ihr auf Lara?",
            "modelDe": "Wir warten im Café am Bahnhof."
          },
          {
            "actionDe": "Passend reagieren",
            "questionDe": "Wohin geht ihr nach der Arbeit?",
            "modelDe": "Wir gehen ins Café am Bahnhof."
          },
          {
            "actionDe": "Aufgabe lösen",
            "questionDe": "Lara kommt erst um 18 Uhr. Wie bestätigst du die Zeit?",
            "modelDe": "Gut, dann treffen wir uns um 18 Uhr vor dem Café."
          }
        ]
      },
      {
        "id": "scenario-2",
        "label": "Regen im Park",
        "icon": "🎯",
        "context": "Ihr wolltet euch am Samstag im Park treffen, aber es regnet. Ein Museum ist in der Nähe.",
        "steps": [
          {
            "actionDe": "Situation beschreiben",
            "questionDe": "Wo wolltet ihr euch ursprünglich treffen?",
            "modelDe": "Wir wollten uns im Park treffen."
          },
          {
            "actionDe": "Passend reagieren",
            "questionDe": "Wohin geht ihr bei Regen?",
            "modelDe": "Wir gehen ins Museum."
          },
          {
            "actionDe": "Aufgabe lösen",
            "questionDe": "Wie schlägst du den neuen Ort freundlich vor?",
            "modelDe": "Treffen wir uns um 15 Uhr vor dem Museum?"
          }
        ]
      },
      {
        "id": "scenario-3",
        "label": "Kino und Bushaltestelle",
        "icon": "🎯",
        "context": "Paul möchte ins Kino. Der Film beginnt um 18 Uhr, und der Bus kommt um 17:20 Uhr.",
        "steps": [
          {
            "actionDe": "Situation beschreiben",
            "questionDe": "Wo solltet ihr vor dem Film warten?",
            "modelDe": "Wir warten an der Bushaltestelle."
          },
          {
            "actionDe": "Passend reagieren",
            "questionDe": "Wohin fahrt ihr mit dem Bus?",
            "modelDe": "Wir fahren zum Kino."
          },
          {
            "actionDe": "Aufgabe lösen",
            "questionDe": "Wie vereinbarst du eine passende Treffzeit?",
            "modelDe": "Treffen wir uns um 17 Uhr an der Haltestelle?"
          }
        ]
      }
    ]
  },
  {
    "assignmentId": "A2-3.8",
    "title": "Restaurant Challenge",
    "eyebrow": "Im Restaurant bestellen",
    "grammar": "Ich hätte gern ... / Könnte ich ...?",
    "goal": "Practise the lesson's core language in practical teacher-led A2 speaking situations.",
    "scenarios": [
      {
        "id": "scenario-1",
        "label": "Vegetarisch bestellen",
        "icon": "🎯",
        "context": "Du bist mit einer Freundin im Restaurant. Auf der Karte stehen Nudeln mit Fleisch und Gemüsesuppe.",
        "steps": [
          {
            "actionDe": "Situation beschreiben",
            "questionDe": "Wie fragst du nach einem vegetarischen Gericht?",
            "modelDe": "Haben Sie auch ein vegetarisches Gericht?"
          },
          {
            "actionDe": "Passend reagieren",
            "questionDe": "Wie bestellst du die Gemüsesuppe höflich?",
            "modelDe": "Ich hätte gern die Gemüsesuppe, bitte."
          },
          {
            "actionDe": "Aufgabe lösen",
            "questionDe": "Du möchtest Wasser ohne Kohlensäure. Wie bestellst du es?",
            "modelDe": "Könnte ich bitte ein Wasser ohne Kohlensäure bekommen?"
          }
        ]
      },
      {
        "id": "scenario-2",
        "label": "Falsches Essen",
        "icon": "🎯",
        "context": "Du hast Reis mit Gemüse bestellt, aber der Kellner bringt Reis mit Hähnchen.",
        "steps": [
          {
            "actionDe": "Situation beschreiben",
            "questionDe": "Wie erklärst du höflich den Fehler?",
            "modelDe": "Entschuldigung, ich habe Reis mit Gemüse bestellt."
          },
          {
            "actionDe": "Passend reagieren",
            "questionDe": "Wie bittest du um das richtige Gericht?",
            "modelDe": "Könnten Sie mir bitte den Reis mit Gemüse bringen?"
          },
          {
            "actionDe": "Aufgabe lösen",
            "questionDe": "Das Essen war danach gut. Wie fragst du nach der Rechnung?",
            "modelDe": "Könnten wir bitte die Rechnung bekommen?"
          }
        ]
      },
      {
        "id": "scenario-3",
        "label": "Allergie und Beilage",
        "icon": "🎯",
        "context": "Auf der Karte steht ein Nudelgericht mit Soße. Du verträgst keine Milch und möchtest einen Salat.",
        "steps": [
          {
            "actionDe": "Situation beschreiben",
            "questionDe": "Wie fragst du, ob die Soße Milch enthält?",
            "modelDe": "Entschuldigung, ist Milch in der Soße?"
          },
          {
            "actionDe": "Passend reagieren",
            "questionDe": "Wie bestellst du stattdessen einen Salat?",
            "modelDe": "Ich nehme lieber einen Salat, bitte."
          },
          {
            "actionDe": "Aufgabe lösen",
            "questionDe": "Wie bittest du um Brot zum Salat?",
            "modelDe": "Könnte ich bitte etwas Brot dazu bekommen?"
          }
        ]
      }
    ]
  },
  {
    "assignmentId": "A2-6.17",
    "title": "Pharmacy Challenge",
    "eyebrow": "In der Apotheke",
    "grammar": "Ich habe ... / Was soll ich ...? / Können Sie ...?",
    "goal": "Practise the lesson's core language in practical teacher-led A2 speaking situations.",
    "scenarios": [
      {
        "id": "scenario-1",
        "label": "Husten seit drei Tagen",
        "icon": "🎯",
        "context": "Du hast seit drei Tagen Husten. Du möchtest in der Apotheke nach einem geeigneten Mittel fragen.",
        "steps": [
          {
            "actionDe": "Situation beschreiben",
            "questionDe": "Wie beschreibst du Dauer und Symptom?",
            "modelDe": "Ich habe seit drei Tagen Husten."
          },
          {
            "actionDe": "Passend reagieren",
            "questionDe": "Wie bittest du um eine Empfehlung?",
            "modelDe": "Können Sie mir etwas gegen den Husten empfehlen?"
          },
          {
            "actionDe": "Aufgabe lösen",
            "questionDe": "Wie fragst du nach der Einnahme?",
            "modelDe": "Wie oft soll ich das Mittel nehmen?"
          }
        ]
      },
      {
        "id": "scenario-2",
        "label": "Kopfschmerzen unterwegs",
        "icon": "🎯",
        "context": "Du hast unterwegs Kopfschmerzen und möchtest wissen, ob du das Mittel nach dem Essen nehmen sollst.",
        "steps": [
          {
            "actionDe": "Situation beschreiben",
            "questionDe": "Wie beschreibst du deine Beschwerden?",
            "modelDe": "Ich habe Kopfschmerzen und fühle mich nicht gut."
          },
          {
            "actionDe": "Passend reagieren",
            "questionDe": "Wie fragst du nach einer Möglichkeit?",
            "modelDe": "Können Sie mir sagen, was ich dagegen tun kann?"
          },
          {
            "actionDe": "Aufgabe lösen",
            "questionDe": "Wie erkundigst du dich nach der Einnahme?",
            "modelDe": "Muss ich das Mittel nach dem Essen nehmen?"
          }
        ]
      },
      {
        "id": "scenario-3",
        "label": "Verstopfte Nase",
        "icon": "🎯",
        "context": "Seit gestern ist deine Nase verstopft. Du möchtest ein Nasenspray und wissen, wie lange man es verwenden darf.",
        "steps": [
          {
            "actionDe": "Situation beschreiben",
            "questionDe": "Wie erklärst du dein Problem?",
            "modelDe": "Meine Nase ist seit gestern verstopft."
          },
          {
            "actionDe": "Passend reagieren",
            "questionDe": "Wie bittest du höflich um Hilfe?",
            "modelDe": "Können Sie mir ein Nasenspray empfehlen?"
          },
          {
            "actionDe": "Aufgabe lösen",
            "questionDe": "Wie fragst du nach der erlaubten Dauer?",
            "modelDe": "Wie lange darf ich das Nasenspray benutzen?"
          }
        ]
      }
    ]
  },
  {
    "assignmentId": "A2-7.18",
    "title": "Banking Emergency",
    "eyebrow": "Die Bank anrufen",
    "grammar": "Könnten Sie ...? / Ich würde gern ...",
    "goal": "Practise the lesson's core language in practical teacher-led A2 speaking situations.",
    "scenarios": [
      {
        "id": "scenario-1",
        "label": "Bankkarte verloren",
        "icon": "🎯",
        "context": "Du kannst deine Bankkarte nicht finden. Du rufst die Bank an und möchtest die Karte sperren lassen.",
        "steps": [
          {
            "actionDe": "Situation beschreiben",
            "questionDe": "Wie erklärst du das Problem am Telefon?",
            "modelDe": "Guten Tag, ich habe meine Bankkarte verloren."
          },
          {
            "actionDe": "Passend reagieren",
            "questionDe": "Wie bittest du höflich um eine Sperrung?",
            "modelDe": "Könnten Sie meine Karte bitte sofort sperren?"
          },
          {
            "actionDe": "Aufgabe lösen",
            "questionDe": "Wie fragst du nach einer neuen Karte?",
            "modelDe": "Ich würde gern wissen, wann ich eine neue Karte bekommen kann."
          }
        ]
      },
      {
        "id": "scenario-2",
        "label": "Überweisung fehlt",
        "icon": "🎯",
        "context": "Du hast am Montag Geld überwiesen. Am Donnerstag ist der Betrag noch nicht beim Empfänger.",
        "steps": [
          {
            "actionDe": "Situation beschreiben",
            "questionDe": "Wie erklärst du den Zeitpunkt?",
            "modelDe": "Ich habe am Montag Geld überwiesen."
          },
          {
            "actionDe": "Passend reagieren",
            "questionDe": "Wie bittest du um eine Prüfung?",
            "modelDe": "Könnten Sie bitte meine Überweisung prüfen?"
          },
          {
            "actionDe": "Aufgabe lösen",
            "questionDe": "Wie fragst du nach der Dauer?",
            "modelDe": "Ich würde gern wissen, wie lange die Überweisung noch dauert."
          }
        ]
      },
      {
        "id": "scenario-3",
        "label": "Online-Banking gesperrt",
        "icon": "🎯",
        "context": "Dein Passwort funktioniert nicht mehr. Nach drei Versuchen ist dein Online-Banking gesperrt.",
        "steps": [
          {
            "actionDe": "Situation beschreiben",
            "questionDe": "Wie erklärst du das Problem?",
            "modelDe": "Ich kann mich nicht mehr beim Online-Banking anmelden."
          },
          {
            "actionDe": "Passend reagieren",
            "questionDe": "Wie bittest du höflich um Hilfe?",
            "modelDe": "Könnten Sie mir bitte beim Zugang helfen?"
          },
          {
            "actionDe": "Aufgabe lösen",
            "questionDe": "Wie fragst du nach dem nächsten Schritt?",
            "modelDe": "Was muss ich tun, um mein Konto wieder zu benutzen?"
          }
        ]
      }
    ]
  },
  {
    "assignmentId": "A2-7.20",
    "title": "Customer Service",
    "eyebrow": "Eine Reklamation machen",
    "grammar": "Leider ... / weil ... / Könnten Sie ...?",
    "goal": "Practise the lesson's core language in practical teacher-led A2 speaking situations.",
    "scenarios": [
      {
        "id": "scenario-1",
        "label": "Schuhe kaputt",
        "icon": "🎯",
        "context": "Du hast gestern Schuhe gekauft. Schon heute ist die Sohle kaputt. Du hast den Kassenbon.",
        "steps": [
          {
            "actionDe": "Situation beschreiben",
            "questionDe": "Wie erklärst du den Kauf und den Fehler?",
            "modelDe": "Ich habe die Schuhe gestern gekauft, aber die Sohle ist schon kaputt."
          },
          {
            "actionDe": "Passend reagieren",
            "questionDe": "Wie begründest du deine Reklamation?",
            "modelDe": "Ich möchte die Schuhe reklamieren, weil sie beschädigt sind."
          },
          {
            "actionDe": "Aufgabe lösen",
            "questionDe": "Wie bittest du höflich um einen Umtausch?",
            "modelDe": "Könnten Sie die Schuhe bitte umtauschen?"
          }
        ]
      },
      {
        "id": "scenario-2",
        "label": "Falsche Farbe geliefert",
        "icon": "🎯",
        "context": "Du hast online eine blaue Jacke bestellt, aber eine rote Jacke bekommen.",
        "steps": [
          {
            "actionDe": "Situation beschreiben",
            "questionDe": "Wie beschreibst du die falsche Lieferung?",
            "modelDe": "Ich habe eine blaue Jacke bestellt, aber eine rote bekommen."
          },
          {
            "actionDe": "Passend reagieren",
            "questionDe": "Wie erklärst du, warum das ein Problem ist?",
            "modelDe": "Das ist ein Problem, weil ich die blaue Jacke brauche."
          },
          {
            "actionDe": "Aufgabe lösen",
            "questionDe": "Wie forderst du eine Lösung höflich?",
            "modelDe": "Könnten Sie mir bitte die blaue Jacke schicken?"
          }
        ]
      },
      {
        "id": "scenario-3",
        "label": "Tasche mit kaputtem Reißverschluss",
        "icon": "🎯",
        "context": "Du hast vor zwei Tagen eine Tasche gekauft. Der Reißverschluss funktioniert nicht.",
        "steps": [
          {
            "actionDe": "Situation beschreiben",
            "questionDe": "Wie beschreibst du den Defekt?",
            "modelDe": "Leider funktioniert der Reißverschluss meiner neuen Tasche nicht."
          },
          {
            "actionDe": "Passend reagieren",
            "questionDe": "Wie erklärst du deinen Wunsch mit weil?",
            "modelDe": "Ich möchte die Tasche zurückgeben, weil sie kaputt ist."
          },
          {
            "actionDe": "Aufgabe lösen",
            "questionDe": "Wie bittest du um dein Geld zurück?",
            "modelDe": "Könnten Sie mir bitte das Geld zurückgeben?"
          }
        ]
      }
    ]
  },
  {
    "assignmentId": "A2-9.24",
    "title": "Holiday Planner",
    "eyebrow": "Einen Urlaub planen",
    "grammar": "weil / wenn / um ... zu",
    "goal": "Practise the lesson's core language in practical teacher-led A2 speaking situations.",
    "scenarios": [
      {
        "id": "scenario-1",
        "label": "Urlaub mit wenig Geld",
        "icon": "🎯",
        "context": "Ihr habt für das Wochenende 200 Euro. Ein Hotel ist teuer, ein Hostel ist günstiger.",
        "steps": [
          {
            "actionDe": "Situation beschreiben",
            "questionDe": "Wie wählst du eine Unterkunft und begründest deine Entscheidung?",
            "modelDe": "Wir nehmen das Hostel, weil es günstiger ist."
          },
          {
            "actionDe": "Passend reagieren",
            "questionDe": "Was macht ihr, wenn die Zugtickets zu teuer sind?",
            "modelDe": "Wenn die Tickets zu teuer sind, fahren wir mit dem Bus."
          },
          {
            "actionDe": "Aufgabe lösen",
            "questionDe": "Warum nehmt ihr eine Wasserflasche mit?",
            "modelDe": "Wir nehmen Wasser mit, um unterwegs Geld zu sparen."
          }
        ]
      },
      {
        "id": "scenario-2",
        "label": "Strandurlaub bei Regen",
        "icon": "🎯",
        "context": "Ihr möchtet ans Meer fahren. Für Samstag ist Regen gemeldet, und am Sonntag scheint die Sonne.",
        "steps": [
          {
            "actionDe": "Situation beschreiben",
            "questionDe": "Wie erklärst du, warum ihr trotzdem fahrt?",
            "modelDe": "Wir fahren ans Meer, weil wir uns erholen möchten."
          },
          {
            "actionDe": "Passend reagieren",
            "questionDe": "Was macht ihr, wenn es am Samstag regnet?",
            "modelDe": "Wenn es regnet, besuchen wir ein Museum."
          },
          {
            "actionDe": "Aufgabe lösen",
            "questionDe": "Warum reservierst du die Unterkunft früh?",
            "modelDe": "Ich reserviere früh, um ein Zimmer zu bekommen."
          }
        ]
      },
      {
        "id": "scenario-3",
        "label": "Städtereise ohne Auto",
        "icon": "🎯",
        "context": "Du planst mit Freunden zwei Tage in Hamburg. Ihr habt kein Auto und möchtet viele Sehenswürdigkeiten sehen.",
        "steps": [
          {
            "actionDe": "Situation beschreiben",
            "questionDe": "Warum reist ihr mit dem Zug?",
            "modelDe": "Wir fahren mit dem Zug, weil wir kein Auto haben."
          },
          {
            "actionDe": "Passend reagieren",
            "questionDe": "Was macht ihr, falls der Bus nicht fährt?",
            "modelDe": "Falls der Bus nicht fährt, nehmen wir die U-Bahn."
          },
          {
            "actionDe": "Aufgabe lösen",
            "questionDe": "Warum kauft ihr eine Tageskarte?",
            "modelDe": "Wir kaufen eine Tageskarte, um die Stadt zu entdecken."
          }
        ]
      }
    ]
  },
  {
    "assignmentId": "A2-3.6",
    "title": "Room Makeover",
    "eyebrow": "Möbel und Räume",
    "grammar": "Wo? + Dativ / Wohin? + Akkusativ",
    "goal": "Practise the lesson's core language in practical teacher-led A2 speaking situations.",
    "scenarios": [
      {
        "id": "scenario-1",
        "label": "Kleines Schlafzimmer",
        "icon": "🎯",
        "context": "Dein Zimmer ist klein. Das Bett steht vor dem Fenster, und der Schreibtisch soll mehr Licht bekommen.",
        "steps": [
          {
            "actionDe": "Situation beschreiben",
            "questionDe": "Wo steht das Bett jetzt?",
            "modelDe": "Das Bett steht vor dem Fenster."
          },
          {
            "actionDe": "Passend reagieren",
            "questionDe": "Wohin stellst du den Schreibtisch für mehr Licht?",
            "modelDe": "Ich stelle den Schreibtisch ans Fenster."
          },
          {
            "actionDe": "Aufgabe lösen",
            "questionDe": "Wo steht der Schreibtisch nach dem Umstellen?",
            "modelDe": "Der Schreibtisch steht am Fenster."
          }
        ]
      },
      {
        "id": "scenario-2",
        "label": "Neues Wohnzimmer",
        "icon": "🎯",
        "context": "Das Sofa steht mitten im Wohnzimmer. Ein Bücherregal und eine Lampe sollen einen gemütlichen Leseplatz bilden.",
        "steps": [
          {
            "actionDe": "Situation beschreiben",
            "questionDe": "Wo steht das Sofa jetzt?",
            "modelDe": "Das Sofa steht in der Mitte des Wohnzimmers."
          },
          {
            "actionDe": "Passend reagieren",
            "questionDe": "Wohin stellst du das Bücherregal?",
            "modelDe": "Ich stelle das Bücherregal an die Wand."
          },
          {
            "actionDe": "Aufgabe lösen",
            "questionDe": "Wo steht die Lampe am Ende?",
            "modelDe": "Die Lampe steht neben dem Sofa."
          }
        ]
      },
      {
        "id": "scenario-3",
        "label": "Küche neu einrichten",
        "icon": "🎯",
        "context": "Ein kleiner Tisch steht in der Küche. Die Stühle stehen im Flur und sollen an den Tisch.",
        "steps": [
          {
            "actionDe": "Situation beschreiben",
            "questionDe": "Wo steht der Tisch?",
            "modelDe": "Der Tisch steht in der Küche."
          },
          {
            "actionDe": "Passend reagieren",
            "questionDe": "Wohin stellst du die Stühle?",
            "modelDe": "Ich stelle die Stühle an den Tisch."
          },
          {
            "actionDe": "Aufgabe lösen",
            "questionDe": "Wo stehen die Stühle danach?",
            "modelDe": "Die Stühle stehen am Tisch."
          }
        ]
      }
    ]
  },
  {
    "assignmentId": "A2-4.11",
    "title": "Transport Decision",
    "eyebrow": "Verkehrsmittel vergleichen",
    "grammar": "schneller als / günstiger als / am ...sten",
    "goal": "Practise the lesson's core language in practical teacher-led A2 speaking situations.",
    "scenarios": [
      {
        "id": "scenario-1",
        "label": "Weg zur Schule",
        "icon": "🎯",
        "context": "Zur Schule brauchst du mit dem Bus 35 Minuten, mit dem Fahrrad 20 Minuten und zu Fuß 50 Minuten.",
        "steps": [
          {
            "actionDe": "Situation beschreiben",
            "questionDe": "Welches Verkehrsmittel ist am schnellsten?",
            "modelDe": "Das Fahrrad ist am schnellsten."
          },
          {
            "actionDe": "Passend reagieren",
            "questionDe": "Vergleiche Bus und Fahrrad mit schneller als.",
            "modelDe": "Mit dem Fahrrad bin ich schneller als mit dem Bus."
          },
          {
            "actionDe": "Aufgabe lösen",
            "questionDe": "Was wählst du bei gutem Wetter und warum?",
            "modelDe": "Ich fahre mit dem Fahrrad, weil es schnell und günstig ist."
          }
        ]
      },
      {
        "id": "scenario-2",
        "label": "Zum Flughafen fahren",
        "icon": "🎯",
        "context": "Die Bahn kostet 5 Euro und braucht 30 Minuten. Ein Taxi kostet 35 Euro und braucht 20 Minuten.",
        "steps": [
          {
            "actionDe": "Situation beschreiben",
            "questionDe": "Welches Verkehrsmittel ist günstiger?",
            "modelDe": "Die Bahn ist günstiger als das Taxi."
          },
          {
            "actionDe": "Passend reagieren",
            "questionDe": "Welches Verkehrsmittel ist schneller?",
            "modelDe": "Das Taxi ist schneller als die Bahn."
          },
          {
            "actionDe": "Aufgabe lösen",
            "questionDe": "Du hast viel Zeit, aber wenig Geld. Was wählst du?",
            "modelDe": "Ich nehme die Bahn, weil sie viel günstiger ist."
          }
        ]
      },
      {
        "id": "scenario-3",
        "label": "Besuch am Wochenende",
        "icon": "🎯",
        "context": "Du möchtest deine Oma besuchen. Mit dem Auto dauert es eine Stunde, mit dem Zug 80 Minuten, mit dem Bus zwei Stunden.",
        "steps": [
          {
            "actionDe": "Situation beschreiben",
            "questionDe": "Welcher Weg ist am langsamsten?",
            "modelDe": "Der Bus ist am langsamsten."
          },
          {
            "actionDe": "Passend reagieren",
            "questionDe": "Vergleiche Auto und Zug mit schneller als.",
            "modelDe": "Das Auto ist schneller als der Zug."
          },
          {
            "actionDe": "Aufgabe lösen",
            "questionDe": "Du hast kein Auto. Welches Verkehrsmittel passt besser?",
            "modelDe": "Ich nehme den Zug, weil er schneller als der Bus ist."
          }
        ]
      }
    ]
  },
  {
    "assignmentId": "A2-5.13",
    "title": "Mini Interview",
    "eyebrow": "Ein Vorstellungsgespräch",
    "grammar": "konnte / musste / wollte",
    "goal": "Practise the lesson's core language in practical teacher-led A2 speaking situations.",
    "scenarios": [
      {
        "id": "scenario-1",
        "label": "Hotelpraktikum",
        "icon": "🎯",
        "context": "Du bewirbst dich für ein Praktikum im Hotel. Im letzten Sommer hast du in einem Café geholfen.",
        "steps": [
          {
            "actionDe": "Situation beschreiben",
            "questionDe": "Welche Arbeit konntest du im Café machen?",
            "modelDe": "Ich konnte Bestellungen aufnehmen und Gäste begrüßen."
          },
          {
            "actionDe": "Passend reagieren",
            "questionDe": "Welche Aufgaben musstest du jeden Morgen erledigen?",
            "modelDe": "Ich musste die Tische vorbereiten und sauber machen."
          },
          {
            "actionDe": "Aufgabe lösen",
            "questionDe": "Warum wolltest du im Hotel arbeiten?",
            "modelDe": "Ich wollte im Hotel arbeiten, weil ich gern mit Gästen spreche."
          }
        ]
      },
      {
        "id": "scenario-2",
        "label": "Arbeit im Laden",
        "icon": "🎯",
        "context": "Du bewirbst dich in einem Geschäft. Früher hast du am Wochenende im Familienladen mitgeholfen.",
        "steps": [
          {
            "actionDe": "Situation beschreiben",
            "questionDe": "Welche Aufgaben konntest du im Familienladen übernehmen?",
            "modelDe": "Ich konnte Kunden beraten und Waren sortieren."
          },
          {
            "actionDe": "Passend reagieren",
            "questionDe": "Was musstest du vor dem Öffnen machen?",
            "modelDe": "Ich musste die Regale auffüllen."
          },
          {
            "actionDe": "Aufgabe lösen",
            "questionDe": "Warum wolltest du diese Stelle bekommen?",
            "modelDe": "Ich wollte diese Stelle, weil ich gern im Team arbeite."
          }
        ]
      },
      {
        "id": "scenario-3",
        "label": "Büropraktikum",
        "icon": "🎯",
        "context": "Du suchst ein Büropraktikum. In der Schule hast du mit Tabellen gearbeitet und Termine organisiert.",
        "steps": [
          {
            "actionDe": "Situation beschreiben",
            "questionDe": "Was konntest du am Computer schon machen?",
            "modelDe": "Ich konnte einfache Tabellen erstellen."
          },
          {
            "actionDe": "Passend reagieren",
            "questionDe": "Was musstest du bei einem Schulprojekt organisieren?",
            "modelDe": "Ich musste Termine planen und Informationen sammeln."
          },
          {
            "actionDe": "Aufgabe lösen",
            "questionDe": "Warum wolltest du ein Büropraktikum machen?",
            "modelDe": "Ich wollte praktische Erfahrungen im Büro sammeln."
          }
        ]
      }
    ]
  },
  {
    "assignmentId": "A2-8.21",
    "title": "Weekend Surprise",
    "eyebrow": "Ein Wochenende planen",
    "grammar": "wenn / falls / ob",
    "goal": "Practise the lesson's core language in practical teacher-led A2 speaking situations.",
    "scenarios": [
      {
        "id": "scenario-1",
        "label": "Picknick und Regen",
        "icon": "🎯",
        "context": "Am Samstag plant ihr ein Picknick im Park. Der Wetterbericht sagt vielleicht Regen voraus.",
        "steps": [
          {
            "actionDe": "Situation beschreiben",
            "questionDe": "Wie erklärst du euren Plan mit wenn?",
            "modelDe": "Wenn es trocken bleibt, machen wir ein Picknick."
          },
          {
            "actionDe": "Passend reagieren",
            "questionDe": "Wie fragst du deine Freunde, ob sie Zeit haben?",
            "modelDe": "Habt ihr am Samstag Zeit, oder soll ich nachfragen, ob Sonntag besser ist?"
          },
          {
            "actionDe": "Aufgabe lösen",
            "questionDe": "Was ist eure Alternative, falls es regnet?",
            "modelDe": "Falls es regnet, treffen wir uns zu Hause."
          }
        ]
      },
      {
        "id": "scenario-2",
        "label": "Besuch aus einer anderen Stadt",
        "icon": "🎯",
        "context": "Deine Freundin kommt am Sonntag mit dem Zug. Vielleicht hat sie zwei Stunden Verspätung.",
        "steps": [
          {
            "actionDe": "Situation beschreiben",
            "questionDe": "Wie planst du den Empfang mit wenn?",
            "modelDe": "Wenn der Zug pünktlich ist, hole ich sie um zwölf Uhr ab."
          },
          {
            "actionDe": "Passend reagieren",
            "questionDe": "Wie fragst du, ob sie später essen möchte?",
            "modelDe": "Kannst du mir sagen, ob du später essen möchtest?"
          },
          {
            "actionDe": "Aufgabe lösen",
            "questionDe": "Was machst du, falls ihr Zug zu spät kommt?",
            "modelDe": "Falls ihr Zug zu spät kommt, warte ich im Café."
          }
        ]
      },
      {
        "id": "scenario-3",
        "label": "Sportplatz geschlossen",
        "icon": "🎯",
        "context": "Ihr wollt am Samstag Fußball spielen. Der Sportplatz könnte wegen Bauarbeiten geschlossen sein.",
        "steps": [
          {
            "actionDe": "Situation beschreiben",
            "questionDe": "Wie fragt ihr, ob der Platz geöffnet ist?",
            "modelDe": "Wisst ihr, ob der Sportplatz am Samstag geöffnet ist?"
          },
          {
            "actionDe": "Passend reagieren",
            "questionDe": "Was macht ihr, wenn ihr dort spielen könnt?",
            "modelDe": "Wenn der Platz offen ist, spielen wir am Nachmittag."
          },
          {
            "actionDe": "Aufgabe lösen",
            "questionDe": "Was plant ihr, falls der Platz geschlossen ist?",
            "modelDe": "Falls er geschlossen ist, gehen wir schwimmen."
          }
        ]
      }
    ]
  },
  {
    "assignmentId": "A2-10.27",
    "title": "Message Challenge",
    "eyebrow": "Digitale Kommunikation",
    "grammar": "Ich finde, dass ...",
    "goal": "Practise the lesson's core language in practical teacher-led A2 speaking situations.",
    "scenarios": [
      {
        "id": "scenario-1",
        "label": "Falsche Uhrzeit im Gruppenchat",
        "icon": "🎯",
        "context": "Im Klassenchat schreibt jemand 14 Uhr statt 16 Uhr. Zwei Freunde stehen deshalb zu früh vor der Schule.",
        "steps": [
          {
            "actionDe": "Situation beschreiben",
            "questionDe": "Wie erklärst du die richtige Uhrzeit freundlich?",
            "modelDe": "Achtung, unser Treffen beginnt erst um 16 Uhr."
          },
          {
            "actionDe": "Passend reagieren",
            "questionDe": "Wie sagst du deine Meinung mit dass?",
            "modelDe": "Ich finde, dass wir die Uhrzeit im Chat klar schreiben sollten."
          },
          {
            "actionDe": "Aufgabe lösen",
            "questionDe": "Wie entschuldigst du dich für das Missverständnis?",
            "modelDe": "Entschuldigung, die Nachricht war nicht klar."
          }
        ]
      },
      {
        "id": "scenario-2",
        "label": "Verdächtiger Link",
        "icon": "🎯",
        "context": "Du bekommst eine Nachricht: Klicke sofort auf diesen Link und gib dein Passwort ein. Die Absendernummer ist unbekannt.",
        "steps": [
          {
            "actionDe": "Situation beschreiben",
            "questionDe": "Wie beschreibst du das Problem?",
            "modelDe": "Ich habe eine Nachricht von einer unbekannten Nummer bekommen."
          },
          {
            "actionDe": "Passend reagieren",
            "questionDe": "Was meinst du zu dieser Nachricht mit dass?",
            "modelDe": "Ich glaube, dass diese Nachricht nicht sicher ist."
          },
          {
            "actionDe": "Aufgabe lösen",
            "questionDe": "Wie warnst du deine Freunde kurz?",
            "modelDe": "Bitte klickt nicht auf den Link und gebt kein Passwort ein."
          }
        ]
      },
      {
        "id": "scenario-3",
        "label": "Online-Anzeige ohne Adresse",
        "icon": "🎯",
        "context": "Du siehst eine Anzeige für einen gebrauchten Tisch. Es gibt ein Foto und einen Preis, aber keine Adresse.",
        "steps": [
          {
            "actionDe": "Situation beschreiben",
            "questionDe": "Welche Information fehlt in der Anzeige?",
            "modelDe": "In der Anzeige steht keine Adresse."
          },
          {
            "actionDe": "Passend reagieren",
            "questionDe": "Wie formulierst du eine Meinung mit dass?",
            "modelDe": "Ich finde, dass die Anzeige mehr Informationen braucht."
          },
          {
            "actionDe": "Aufgabe lösen",
            "questionDe": "Welche Nachricht schreibst du dem Verkäufer?",
            "modelDe": "Guten Tag, wo kann ich den Tisch abholen?"
          }
        ]
      }
    ]
  },
  {
    "assignmentId": "A2-10.28",
    "title": "Future Mission",
    "eyebrow": "Über die Zukunft sprechen",
    "grammar": "Ich werde ... / Ich möchte ...",
    "goal": "Practise the lesson's core language in practical teacher-led A2 speaking situations.",
    "scenarios": [
      {
        "id": "scenario-1",
        "label": "Deutsch lernen und Beruf",
        "icon": "🎯",
        "context": "Du möchtest nächstes Jahr die B1-Prüfung machen und später im Hotel arbeiten.",
        "steps": [
          {
            "actionDe": "Situation beschreiben",
            "questionDe": "Was wirst du nächstes Jahr lernen?",
            "modelDe": "Ich werde nächstes Jahr für die B1-Prüfung lernen."
          },
          {
            "actionDe": "Passend reagieren",
            "questionDe": "Was möchtest du danach beruflich machen?",
            "modelDe": "Ich möchte später in einem Hotel arbeiten."
          },
          {
            "actionDe": "Aufgabe lösen",
            "questionDe": "Wie wirst du dich auf dein Ziel vorbereiten?",
            "modelDe": "Ich werde jeden Tag Deutsch üben."
          }
        ]
      },
      {
        "id": "scenario-2",
        "label": "Reisen und Familie",
        "icon": "🎯",
        "context": "Du möchtest deine Familie in einer anderen Stadt besuchen und im Sommer eine neue Stadt kennenlernen.",
        "steps": [
          {
            "actionDe": "Situation beschreiben",
            "questionDe": "Wohin wirst du im Sommer fahren?",
            "modelDe": "Ich werde im Sommer nach Hamburg fahren."
          },
          {
            "actionDe": "Passend reagieren",
            "questionDe": "Was möchtest du mit deiner Familie machen?",
            "modelDe": "Ich möchte meine Familie besuchen und Zeit mit ihr verbringen."
          },
          {
            "actionDe": "Aufgabe lösen",
            "questionDe": "Wie wirst du die Reise organisieren?",
            "modelDe": "Ich werde früh ein Zugticket kaufen."
          }
        ]
      },
      {
        "id": "scenario-3",
        "label": "Gesundheit und Alltag",
        "icon": "🎯",
        "context": "Du möchtest in den nächsten sechs Monaten mehr Sport machen und weniger Zeit am Handy verbringen.",
        "steps": [
          {
            "actionDe": "Situation beschreiben",
            "questionDe": "Was wirst du für deine Gesundheit tun?",
            "modelDe": "Ich werde zweimal pro Woche Sport machen."
          },
          {
            "actionDe": "Passend reagieren",
            "questionDe": "Was möchtest du am Abend ändern?",
            "modelDe": "Ich möchte abends weniger am Handy sein."
          },
          {
            "actionDe": "Aufgabe lösen",
            "questionDe": "Wie wirst du deine neuen Gewohnheiten planen?",
            "modelDe": "Ich werde feste Zeiten in meinen Kalender schreiben."
          }
        ]
      }
    ]
  }
];
export const A2_TEACHER_CHALLENGES = Object.freeze(Object.fromEntries(definitions.map(activity => [activity.assignmentId, Object.freeze(activity)])));
export function getA2TeacherChallenge(id) { return A2_TEACHER_CHALLENGES[String(id || "").trim().toUpperCase()] || null; }
