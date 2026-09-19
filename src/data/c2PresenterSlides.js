import { getC2TopicFoundation } from "./c2TopicFoundations.js";

const LESSONS = [
  {
    "day": 1,
    "chapter": "1.1",
    "title": "Kreislaufwirtschaft und Wegwerfgesellschaft",
    "grammarFocus": "Nuancierte Bewertung und Registersteuerung",
    "topic": "Wie Kreislaufwirtschaft Produktion, Konsum, Reparatur und Wiederverwendung verändern kann.",
    "perspectives": [
      "Verbraucher tragen die größte Verantwortung dafür, die Wegwerfgesellschaft zu überwinden.",
      "Ohne verbindliche Regeln werden Unternehmen kaum ausreichend langlebige und reparierbare Produkte anbieten.",
      "Wiederverwendung und Reparatur sind langfristig wichtiger als ein immer effizienteres Recycling."
    ],
    "grammar": [
      "Bewerte Umweltmaßnahmen abgestuft statt pauschal: Haltung, Evidenz und Bedingung müssen sprachlich sichtbar werden.",
      "Ich halte ein Recht auf Reparatur für grundsätzlich sinnvoll, sofern Ersatzteile langfristig verfügbar bleiben.",
      "Recycling erscheint als alleinige Strategie nur bedingt ausreichend, wenn Abfallvermeidung und Wiederverwendung vernachlässigt werden."
    ],
    "writingPrompt": "Verfassen Sie eine differenzierte Stellungnahme zur Frage, wie Politik, Unternehmen und Verbraucher die Wegwerfgesellschaft begrenzen können.",
    "planningPrompt": "Planen Sie These, Begründung, Gegenposition und Synthese und achten Sie auf einen adressatengerechten Registerwechsel.",
    "writeType": "opinion",
    "collocations": [
      [
        "Ressourcen im Kreislauf halten",
        "Eine funktionierende Kreislaufwirtschaft hält wertvolle Ressourcen möglichst lange im Kreislauf."
      ],
      [
        "Reparaturen fördern",
        "Steuerliche Anreize könnten Reparaturen stärker fördern."
      ],
      [
        "eine Wegwerfmentalität überwinden",
        "Bildung und transparente Preise können dazu beitragen, eine Wegwerfmentalität zu überwinden."
      ]
    ],
    "topicFoundation": {
      "english": "Circular economy means keeping products and materials in use for as long as possible through durable design, repair, reuse and refurbishment. Recycling comes later. A throwaway society follows the opposite pattern: take resources, make, use briefly and discard.",
      "german": "Kreislaufwirtschaft bedeutet, Produkte und Rohstoffe möglichst lange im Umlauf zu halten: langlebig produzieren, nutzen, reparieren, wiederverwenden oder aufbereiten und erst am Ende recyceln. Eine Wegwerfgesellschaft funktioniert eher linear: Rohstoffe entnehmen, produzieren, kurz nutzen und wegwerfen.",
      "linear": "Wegwerfgesellschaft: Rohstoffe → Produktion → Kaufen → kurz nutzen → Wegwerfen.",
      "circular": "Kreislaufwirtschaft: Rohstoffe → langlebig produzieren → nutzen → reparieren → wiederverwenden/aufbereiten → recyceln.",
      "example": "Smartphone-Beispiel: Statt ein Gerät bei einem defekten Akku sofort zu ersetzen, wird der Akku ausgetauscht, das Gerät weitergenutzt oder aufbereitet und erst am Ende recycelt.",
      "tension": "Kernspannung: niedriger Preis und Bequemlichkeit ↔ Langlebigkeit und Ressourcenschonung; unternehmerische Freiheit ↔ verbindliche Umwelt- und Produktregeln."
    }
  },
  {
    "day": 2,
    "chapter": "1.2",
    "title": "Schulpflicht und Bildungsgerechtigkeit",
    "grammarFocus": "Informationsstruktur: Thema, Rhema und Vorfeld",
    "topic": "Wie Schulpflicht, Förderung und Zugang zu Bildung gesellschaftliche Chancen beeinflussen.",
    "perspectives": [
      "Ein gemeinsamer verbindlicher Bildungsrahmen ist die wichtigste Voraussetzung für Chancengerechtigkeit.",
      "Mehr individuelle Lernwege sind wichtiger als ein für alle gleiches Schulsystem.",
      "Bildungsgerechtigkeit hängt stärker von früher Förderung als von der Schulform ab."
    ],
    "grammar": [
      "Thema und Rhema steuern, worauf der Leser zuerst achtet. Nutze das Vorfeld gezielt statt künstlich.",
      "Neutral: Gute Förderung verbessert Bildungschancen.",
      "Fokus: Entscheidend für Bildungschancen ist eine verlässliche frühe Förderung."
    ],
    "writingPrompt": "Erörtern Sie, wie Schulpflicht, Förderung und soziale Herkunft Bildungschancen beeinflussen.",
    "planningPrompt": "Ordnen Sie bekannte und neue Informationen klar und nutzen Sie Thema–Rhema und das Vorfeld gezielt.",
    "writeType": "reformulation",
    "collocations": [
      [
        "Bildungschancen verbessern",
        "Frühe Förderung kann Bildungschancen nachhaltig verbessern."
      ],
      [
        "einen Bildungsrahmen schaffen",
        "Ein verbindlicher Bildungsrahmen kann Mindeststandards sichern."
      ],
      [
        "soziale Herkunft ausgleichen",
        "Gezielte Förderung soll Nachteile aufgrund sozialer Herkunft teilweise ausgleichen."
      ]
    ]
  },
  {
    "day": 3,
    "chapter": "1.3",
    "title": "Wissenschaft, Forschung und Hochschulen",
    "grammarFocus": "Nominalstil und Verbalstil gezielt wählen",
    "topic": "Wie Hochschulen Forschung, Lehre, gesellschaftliche Verantwortung und wissenschaftliche Freiheit verbinden.",
    "perspectives": [
      "Öffentlich finanzierte Forschung sollte sich stärker an gesellschaftlichen Problemen orientieren.",
      "Wissenschaft braucht größtmögliche Freiheit, auch wenn ein unmittelbarer Nutzen nicht erkennbar ist.",
      "Hochschulen sollten Forschungsergebnisse verständlicher und transparenter kommunizieren."
    ],
    "grammar": [
      "Nominalstil verdichtet bekannte Prozesse; Verbalstil hält Akteure und Handlungen sichtbar.",
      "Verbal: Forschende prüfen die Ergebnisse erneut.",
      "Nominal: Die erneute Überprüfung der Ergebnisse ermöglicht eine belastbarere Bewertung."
    ],
    "writingPrompt": "Nehmen Sie Stellung zum Verhältnis von Forschungsfreiheit, gesellschaftlichem Nutzen und öffentlicher Finanzierung.",
    "planningPrompt": "Planen Sie eine sachliche Argumentation und wechseln Sie bewusst zwischen Nominal- und Verbalstil.",
    "writeType": "opinion",
    "collocations": [
      [
        "Erkenntnisse gewinnen",
        "Forschung soll belastbare Erkenntnisse gewinnen."
      ],
      [
        "eine These überprüfen",
        "Wissenschaftliche Verfahren müssen eine These überprüfbar machen."
      ],
      [
        "Forschungsergebnisse kommunizieren",
        "Hochschulen sollten Forschungsergebnisse verständlich kommunizieren."
      ]
    ]
  },
  {
    "day": 4,
    "chapter": "1.4",
    "title": "Journalismus, Nachrichten und Quellenkritik",
    "grammarFocus": "Indirekte Rede und Konjunktiv I/II",
    "topic": "Wie Quellen geprüft, Aussagen eingeordnet und fremde Behauptungen sprachlich auf Distanz gehalten werden.",
    "perspectives": [
      "Medien sollten unbestätigte Aussagen grundsätzlich nicht veröffentlichen.",
      "Schnelle Berichterstattung ist auch dann wichtig, wenn noch nicht alle Informationen abschließend geprüft sind.",
      "Quellenkritik sollte bereits in der Schule systematisch vermittelt werden."
    ],
    "grammar": [
      "Konjunktiv I markiert Fremdaussagen. Trenne Quelle, Aussage, Evidenzstatus und eigene Bewertung.",
      "Die Redaktion berichtet, die Quelle sei nicht unabhängig bestätigt.",
      "Nach Angaben der Behörde habe sich die Lage verbessert; unabhängige Daten lägen noch nicht vor."
    ],
    "writingPrompt": "Verfassen Sie einen analytischen Text über die Verantwortung von Medien im Umgang mit unsicheren oder widersprüchlichen Informationen.",
    "planningPrompt": "Kennzeichnen Sie fremde Aussagen sauber und nutzen Sie indirekte Rede zur Distanzierung.",
    "writeType": "reformulation",
    "collocations": [
      [
        "eine Quelle überprüfen",
        "Vor einer Veröffentlichung sollte die Quelle überprüft werden."
      ],
      [
        "eine Aussage einordnen",
        "Journalisten müssen strittige Aussagen nachvollziehbar einordnen."
      ],
      [
        "Distanz zu einer Behauptung wahren",
        "Indirekte Rede hilft, Distanz zu einer fremden Behauptung zu wahren."
      ]
    ]
  },
  {
    "day": 5,
    "chapter": "1.5",
    "title": "Politik, Verantwortung und öffentliches Vertrauen",
    "grammarFocus": "Subjektive Modalität und Evidenz",
    "topic": "Wie sprachliche Sicherheit, Vermutung und Quellenstatus öffentliche Debatten beeinflussen.",
    "perspectives": [
      "Politisches Vertrauen entsteht vor allem durch nachvollziehbare Entscheidungen und transparente Begründungen.",
      "Fehler offen einzugestehen stärkt das Vertrauen stärker als der Versuch, politische Geschlossenheit zu zeigen.",
      "Bürger sollten politische Entscheidungen stärker an überprüfbaren Ergebnissen als an Ankündigungen messen."
    ],
    "grammar": [
      "Modalität zeigt den Grad der Sicherheit. Formuliere Vermutung nicht als Tatsache.",
      "Die Maßnahme dürfte das Vertrauen stärken.",
      "Die Entscheidung soll intern umstritten gewesen sein."
    ],
    "writingPrompt": "Erörtern Sie, wodurch öffentliches Vertrauen in politische Institutionen gestärkt oder geschwächt wird.",
    "planningPrompt": "Unterscheiden Sie Hörensagen, Selbstaussage und Wahrscheinlichkeitsgrade mit subjektiver Modalität.",
    "writeType": "opinion",
    "collocations": [
      [
        "Verantwortung übernehmen",
        "Institutionen müssen Verantwortung für nachvollziehbare Entscheidungen übernehmen."
      ],
      [
        "eine Entscheidung begründen",
        "Öffentliche Entscheidungen sollten transparent begründet werden."
      ],
      [
        "Vertrauen stärken",
        "Nachvollziehbare Verfahren können öffentliches Vertrauen stärken."
      ]
    ]
  },
  {
    "day": 6,
    "chapter": "1.6",
    "title": "Soziale Ungleichheit und Chancengerechtigkeit",
    "grammarFocus": "Kausale Beziehungen differenziert ausdrücken",
    "topic": "Wie Herkunft, Einkommen, Bildung und institutionelle Strukturen Chancen prägen.",
    "perspectives": [
      "Ungleiche Lebensbedingungen lassen sich vor allem durch staatliche Umverteilung verringern.",
      "Langfristig ist der Zugang zu guter Bildung wichtiger als kurzfristige finanzielle Unterstützung.",
      "Chancengerechtigkeit bedeutet nicht, dass am Ende alle dieselben Ergebnisse erreichen müssen."
    ],
    "grammar": [
      "Unterscheide Ursache, Anlass, Bedingung und Folge; wähle den Konnektor nach der logischen Beziehung.",
      "Da finanzielle Ressourcen ungleich verteilt sind, entstehen unterschiedliche Chancen.",
      "Ungleiche Ausgangsbedingungen führen dazu, dass vergleichbare Leistungen nicht immer zu vergleichbaren Möglichkeiten führen."
    ],
    "writingPrompt": "Diskutieren Sie Maßnahmen zur Verringerung struktureller Ungleichheit und deren mögliche Nebenwirkungen.",
    "planningPrompt": "Trennen Sie Korrelation und Kausalität und wählen Sie kausale Ausdrücke nach Evidenzstärke.",
    "writeType": "reformulation",
    "collocations": [
      [
        "Chancengerechtigkeit fördern",
        "Gezielte Bildungsangebote können Chancengerechtigkeit fördern."
      ],
      [
        "strukturelle Nachteile ausgleichen",
        "Förderprogramme sollen strukturelle Nachteile teilweise ausgleichen."
      ],
      [
        "Ungleichheiten verringern",
        "Langfristige Reformen können soziale Ungleichheiten verringern."
      ]
    ]
  },
  {
    "day": 7,
    "chapter": "1.7",
    "title": "Arbeitswelt, Leistungsdruck und Work-Life-Balance",
    "grammarFocus": "Funktionsverbgefüge sinnvoll einsetzen",
    "topic": "Wie Beschäftigte, Unternehmen und Staat mit Leistung, Erreichbarkeit und Erholung umgehen.",
    "perspectives": [
      "Unternehmen sollten die Erreichbarkeit ihrer Beschäftigten nach Feierabend verbindlich begrenzen.",
      "Hohe Leistungsanforderungen sind vertretbar, wenn Beschäftigte ausreichend Autonomie und Erholung erhalten.",
      "Work-Life-Balance ist in erster Linie eine individuelle und keine betriebliche Verantwortung."
    ],
    "grammar": [
      "Funktionsverbgefüge sind nützlich, wenn sie institutionelle oder abstrakte Handlungen präzise benennen.",
      "Maßnahmen ergreifen · unter Druck geraten · eine Entscheidung treffen",
      "Unternehmen stehen in der Verantwortung, wirksame Maßnahmen zur Entlastung zu ergreifen."
    ],
    "writingPrompt": "Nehmen Sie Stellung dazu, wie Unternehmen Produktivität und gesunde Arbeitsbedingungen miteinander vereinbaren können.",
    "planningPrompt": "Nutzen Sie Funktionsverbgefüge nur dort, wo sie Präzision oder idiomatische Verdichtung verbessern.",
    "writeType": "opinion",
    "collocations": [
      [
        "unter Leistungsdruck stehen",
        "Viele Beschäftigte stehen dauerhaft unter hohem Leistungsdruck."
      ],
      [
        "Maßnahmen ergreifen",
        "Unternehmen sollten Maßnahmen gegen ständige Erreichbarkeit ergreifen."
      ],
      [
        "Handlungsspielraum gewähren",
        "Flexible Arbeit sollte Beschäftigten echten Handlungsspielraum gewähren."
      ]
    ]
  },
  {
    "day": 8,
    "chapter": "2.1",
    "title": "Künstliche Intelligenz und Automatisierung",
    "grammarFocus": "Partizipialattribute und verdichtete Strukturen",
    "topic": "Wie KI Produktivität, Berufe, Entscheidungen und menschliche Verantwortung verändert.",
    "perspectives": [
      "Automatisierte Systeme sollten niemals allein über folgenreiche Entscheidungen für Menschen bestimmen.",
      "Produktivitätsgewinne durch KI rechtfertigen einen tiefgreifenden Wandel vieler Berufsbilder.",
      "Der wichtigste Schutz vor den Risiken der Automatisierung ist kontinuierliche Weiterbildung."
    ],
    "grammar": [
      "Partizipialattribute verdichten Relativsätze. Nutze sie nur, wenn der Bezug sofort klar bleibt.",
      "Systeme, die durch KI gesteuert werden → KI-gesteuerte Systeme",
      "Die durch automatisierte Entscheidungen betroffenen Beschäftigten benötigen nachvollziehbare Beschwerdewege."
    ],
    "writingPrompt": "Erörtern Sie, unter welchen Bedingungen KI in Bildung, Arbeit oder Verwaltung eingesetzt werden sollte.",
    "planningPrompt": "Verdichten Sie Informationen mit Partizipialattributen, ohne die Lesbarkeit zu verlieren.",
    "writeType": "reformulation",
    "collocations": [
      [
        "Entscheidungen automatisieren",
        "Unternehmen automatisieren zunehmend standardisierte Entscheidungen."
      ],
      [
        "Verantwortung für KI tragen",
        "Anbieter müssen Verantwortung für nachvollziehbare KI-Systeme tragen."
      ],
      [
        "Weiterbildung ermöglichen",
        "Technologischer Wandel macht kontinuierliche Weiterbildung notwendig."
      ]
    ]
  },
  {
    "day": 9,
    "chapter": "2.2",
    "title": "Datenschutz und digitale Selbstbestimmung",
    "grammarFocus": "Passiv-Ersatzformen und Verantwortungsfokus",
    "topic": "Wie Menschen Kontrolle über Daten behalten und digitale Dienste Verantwortung übernehmen.",
    "perspectives": [
      "Nutzer sollten selbst entscheiden dürfen, welche persönlichen Daten für digitale Dienste verwendet werden.",
      "Strenge Datenschutzregeln dürfen sinnvolle datenbasierte Innovationen nicht unverhältnismäßig behindern.",
      "Digitale Selbstbestimmung setzt verständliche Informationen voraus und kann nicht allein durch Zustimmungsschaltflächen gewährleistet werden."
    ],
    "grammar": [
      "Passiv-Ersatzformen verändern den Fokus: sich lassen, sein + zu, -bar/-lich oder unpersönliche Strukturen.",
      "Die Daten können nicht vollständig kontrolliert werden. → Die Datennutzung lässt sich nicht vollständig kontrollieren.",
      "Verantwortlichkeiten sind klar zu dokumentieren."
    ],
    "writingPrompt": "Verfassen Sie eine Stellungnahme zu personalisierter Datennutzung und digitaler Selbstbestimmung.",
    "planningPrompt": "Variieren Sie Passiv- und Ersatzformen und unterscheiden Sie Möglichkeit, Pflicht und unpersönliche Darstellung.",
    "writeType": "opinion",
    "collocations": [
      [
        "Einwilligung einholen",
        "Vor der Verarbeitung personenbezogener Daten ist eine Einwilligung einzuholen."
      ],
      [
        "Datenschutz gewährleisten",
        "Technische und organisatorische Maßnahmen müssen Datenschutz gewährleisten."
      ],
      [
        "digitale Selbstbestimmung schützen",
        "Transparente Regeln sollen digitale Selbstbestimmung schützen."
      ]
    ]
  },
  {
    "day": 10,
    "chapter": "2.3",
    "title": "Medizin, Gesundheit und Forschungsethik",
    "grammarFocus": "Evidenz, subjektive Modalverben und vorsichtige Schlussfolgerungen",
    "topic": "Wie medizinischer Fortschritt, Patientenschutz und wissenschaftliche Unsicherheit abgewogen werden.",
    "perspectives": [
      "Neue medizinische Verfahren sollten erst nach sehr umfassender Prüfung breit eingesetzt werden.",
      "Bei schweren Erkrankungen kann ein höheres Forschungsrisiko ethisch vertretbar sein.",
      "Patienten müssen auch bei komplexen Behandlungen tatsächlich verstehen können, wozu sie zustimmen."
    ],
    "grammar": [
      "Subjektive Modalverben helfen, Evidenzstärke zu markieren: dürfte, muss, kann, soll, will.",
      "Die Behandlung dürfte bei bestimmten Patientengruppen wirksam sein.",
      "Die Studie soll methodische Schwächen aufweisen; dies ist noch zu prüfen."
    ],
    "writingPrompt": "Erörtern Sie eine medizinethische Entscheidung, bei der Nutzen, Risiko und unsichere Evidenz gegeneinander abgewogen werden müssen.",
    "planningPrompt": "Markieren Sie Wahrscheinlichkeitsgrade präzise und vermeiden Sie unbelegte Gewissheit.",
    "writeType": "reformulation",
    "collocations": [
      [
        "Risiken abwägen",
        "Medizinische Entscheidungen erfordern eine sorgfältige Abwägung von Nutzen und Risiken."
      ],
      [
        "Evidenz berücksichtigen",
        "Empfehlungen sollten die verfügbare Evidenz berücksichtigen."
      ],
      [
        "Patientenschutz gewährleisten",
        "Forschung muss einen wirksamen Patientenschutz gewährleisten."
      ]
    ]
  },
  {
    "day": 11,
    "chapter": "2.4",
    "title": "Klimaschutz, Nachhaltigkeit und Mobilität",
    "grammarFocus": "Konzessive und adversative Verknüpfungen",
    "topic": "Wie ökologische Ziele, Mobilitätsbedürfnisse und wirtschaftliche Interessen gegeneinander abgewogen werden.",
    "perspectives": [
      "Klimafreundliche Mobilität gelingt nur, wenn öffentliche Verkehrsmittel deutlich attraktiver werden.",
      "Individuelle Mobilitätsfreiheit darf durch Klimaschutzmaßnahmen nicht unverhältnismäßig eingeschränkt werden.",
      "Technologische Innovation allein wird die notwendigen Veränderungen im Mobilitätsverhalten nicht bewirken."
    ],
    "grammar": [
      "Konzessiv = Gegengrund; adversativ = Kontrast. Halte obwohl/trotzdem und während/wohingegen funktional auseinander.",
      "Obwohl der Ausbau teuer ist, kann er langfristig Kosten senken.",
      "Der Individualverkehr bietet Flexibilität, wohingegen öffentlicher Verkehr Flächen effizienter nutzt."
    ],
    "writingPrompt": "Nehmen Sie Stellung zu einer klimapolitischen Maßnahme und integrieren Sie mindestens einen starken Einwand.",
    "planningPrompt": "Nutzen Sie konzessive und adversative Strukturen, um Gegenpositionen präzise einzubauen.",
    "writeType": "opinion",
    "collocations": [
      [
        "Emissionen reduzieren",
        "Langfristige Klimapolitik muss Emissionen deutlich reduzieren."
      ],
      [
        "Zielkonflikte berücksichtigen",
        "Mobilitätspolitik muss ökologische und soziale Zielkonflikte berücksichtigen."
      ],
      [
        "nachhaltige Mobilität fördern",
        "Investitionen in öffentlichen Verkehr können nachhaltige Mobilität fördern."
      ]
    ]
  },
  {
    "day": 12,
    "chapter": "2.5",
    "title": "Migration, Integration und gesellschaftliche Teilhabe",
    "grammarFocus": "Rektion und präpositionale Ergänzungen",
    "topic": "Wie Sprache, Bildung, Arbeit und gesellschaftliche Institutionen Teilhabe ermöglichen.",
    "perspectives": [
      "Erfolgreiche Integration setzt vor allem gute Sprachkenntnisse und Zugang zum Arbeitsmarkt voraus.",
      "Auch Institutionen müssen sich verändern, damit gesellschaftliche Teilhabe tatsächlich möglich wird.",
      "Integration sollte stärker als wechselseitiger Prozess und weniger als Anpassungsleistung Einzelner verstanden werden."
    ],
    "grammar": [
      "Lerne Rektion als Einheit mit dem Verb oder Nomen: abhängen von, beitragen zu, verfügen über, sich beteiligen an.",
      "Teilhabe hängt nicht allein von Sprachkenntnissen ab.",
      "Institutionen müssen zu gleichberechtigter Beteiligung beitragen."
    ],
    "writingPrompt": "Erörtern Sie, welche institutionellen und gesellschaftlichen Maßnahmen Teilhabe erleichtern können.",
    "planningPrompt": "Achten Sie auf sichere Verb-, Nomen- und Adjektivrektion sowie Kasuspräzision.",
    "writeType": "reformulation",
    "collocations": [
      [
        "teilhaben an + Dat.",
        "Sprachkenntnisse erleichtern die Teilhabe am gesellschaftlichen Leben."
      ],
      [
        "Zugang erhalten zu + Dat.",
        "Beratung kann den Zugang zu Bildung und Arbeit erleichtern."
      ],
      [
        "einen Beitrag leisten zu + Dat.",
        "Lokale Angebote leisten einen Beitrag zur gesellschaftlichen Teilhabe."
      ]
    ]
  },
  {
    "day": 13,
    "chapter": "2.6",
    "title": "Sprache, Mehrsprachigkeit und kulturelle Identität",
    "grammarFocus": "Wortbildung und Bedeutungspräzision",
    "topic": "Wie Mehrsprachigkeit Denken, Zugehörigkeit, Bildung und kulturelle Identität prägt.",
    "perspectives": [
      "Mehrsprachigkeit ist eine gesellschaftliche Ressource und sollte in Bildungseinrichtungen stärker gefördert werden.",
      "Eine gemeinsame Verkehrssprache bleibt für gesellschaftlichen Zusammenhalt unverzichtbar.",
      "Sprachliche Identität verändert sich im Laufe des Lebens und muss nicht an eine einzige Sprache gebunden sein."
    ],
    "grammar": [
      "Wortbildung ermöglicht präzise Bedeutungsabstufungen. Prüfe Präfix, Suffix und Wortfamilie statt nur einzelne Vokabeln.",
      "mehrsprachig · Mehrsprachigkeit · sprachübergreifend",
      "Zugehörigkeit kann mehrsprachig und situationsabhängig erlebt werden."
    ],
    "writingPrompt": "Verfassen Sie einen differenzierten Text über Mehrsprachigkeit und kulturelle Zugehörigkeit.",
    "planningPrompt": "Analysieren und bilden Sie komplexe Wörter bewusst; prüfen Sie jede Neubildung auf Stil und Verständlichkeit.",
    "writeType": "opinion",
    "collocations": [
      [
        "Mehrsprachigkeit fördern",
        "Bildungseinrichtungen können Mehrsprachigkeit als Ressource gezielt fördern."
      ],
      [
        "sprachliche Zugehörigkeit ausdrücken",
        "Menschen können durch Sprache unterschiedliche Formen von Zugehörigkeit ausdrücken."
      ],
      [
        "kulturelle Identität prägen",
        "Mehrere Sprachen können kulturelle Identität zugleich prägen."
      ]
    ]
  },
  {
    "day": 14,
    "chapter": "2.7",
    "title": "Kultur, Literatur und gesellschaftliches Gedächtnis",
    "grammarFocus": "Semantik, Metapher und übertragene Bedeutung",
    "topic": "Wie Kultur Erinnerungen bewahrt, Deutungen verändert und gesellschaftliche Identität mitgestaltet.",
    "perspectives": [
      "Literatur kann historische Erfahrungen oft zugänglicher vermitteln als rein sachliche Darstellungen.",
      "Öffentliche Erinnerungskultur muss sich verändern dürfen, wenn neue Perspektiven sichtbar werden.",
      "Kulturelle Institutionen sollten kontroverse historische Deutungen nebeneinander aushalten."
    ],
    "grammar": [
      "Bei Metaphern zählt nicht das Wörterbuch allein, sondern die übertragene Funktion im Kontext.",
      "Erinnerung bewahren ist nicht dasselbe wie Vergangenheit festschreiben.",
      "Literatur kann verdrängte Erfahrungen sichtbar machen, ohne historische Forschung zu ersetzen."
    ],
    "writingPrompt": "Analysieren Sie, wie sprachliche Bilder und Konnotationen eine kulturelle oder gesellschaftliche Deutung steuern.",
    "planningPrompt": "Trennen Sie Denotation, Konnotation und Metaphorik und belegen Sie Ihre Interpretation am sprachlichen Material.",
    "writeType": "reformulation",
    "collocations": [
      [
        "Erinnerung bewahren",
        "Literatur und Museen können gesellschaftliche Erinnerung bewahren."
      ],
      [
        "eine Lesart nahelegen",
        "Sprachliche Bilder können eine bestimmte Lesart nahelegen."
      ],
      [
        "Vergangenheit aufarbeiten",
        "Kulturelle Debatten helfen, problematische Vergangenheit aufzuarbeiten."
      ]
    ]
  },
  {
    "day": 15,
    "chapter": "3.1",
    "title": "Wohnen, Mieten und Lebensqualität",
    "grammarFocus": "Vergleiche, Steigerung und Gradpartikeln",
    "topic": "Wie Wohnraum, Preise, Stadtplanung und Lebensqualität miteinander zusammenhängen.",
    "perspectives": [
      "Bezahlbarer Wohnraum ist eine öffentliche Aufgabe und darf nicht allein dem Markt überlassen werden.",
      "Eine stärkere Verdichtung von Städten ist sinnvoller als weiterer Flächenverbrauch am Stadtrand.",
      "Lebensqualität hängt mindestens ebenso stark von Infrastruktur und Nachbarschaft wie von der Größe der Wohnung ab."
    ],
    "grammar": [
      "Vergleiche brauchen einen klaren Maßstab: als, so ... wie, je ... desto, zunehmend, weitaus.",
      "Die Lage ist weitaus komplexer als häufig angenommen.",
      "Je knapper Wohnraum wird, desto stärker geraten Haushalte mit geringem Einkommen unter Druck."
    ],
    "writingPrompt": "Erörtern Sie politische und gesellschaftliche Möglichkeiten, bezahlbaren Wohnraum zu sichern.",
    "planningPrompt": "Vergleichen und gewichten Sie Positionen präzise mit fortgeschrittenen Vergleichs- und Intensivierungsstrukturen.",
    "writeType": "opinion",
    "collocations": [
      [
        "bezahlbaren Wohnraum schaffen",
        "Städte müssen langfristig mehr bezahlbaren Wohnraum schaffen."
      ],
      [
        "Mieten begrenzen",
        "Umstritten ist, ob strengere Regeln steigende Mieten wirksam begrenzen."
      ],
      [
        "Lebensqualität erhöhen",
        "Grünflächen und kurze Wege können die Lebensqualität deutlich erhöhen."
      ]
    ]
  },
  {
    "day": 16,
    "chapter": "3.2",
    "title": "Konsum, Werbung und Kaufverhalten",
    "grammarFocus": "Informationskompression und Nominalisierung",
    "topic": "Wie Werbung Entscheidungen beeinflusst und wie viel Verantwortung Verbraucher und Anbieter tragen.",
    "perspectives": [
      "Personalisierte Werbung schränkt selbstbestimmte Kaufentscheidungen stärker ein, als vielen bewusst ist.",
      "Verbraucher bleiben trotz gezielter Werbung grundsätzlich für ihre Kaufentscheidungen verantwortlich.",
      "Transparenz über Werbemechanismen ist wirksamer als weitreichende Werbeverbote."
    ],
    "grammar": [
      "Informationskompression bündelt bekannte Inhalte, darf aber Akteure und Logik nicht verschleiern.",
      "Dass Werbung personalisiert wird, beeinflusst Kaufentscheidungen. → Die Personalisierung von Werbung beeinflusst Kaufentscheidungen.",
      "Die gezielte Ansprache bestimmter Gruppen kann die Wahrnehmung von Alternativen einschränken."
    ],
    "writingPrompt": "Nehmen Sie Stellung zur Wirkung personalisierter Werbung auf Konsumverhalten und Entscheidungsfreiheit.",
    "planningPrompt": "Verdichten und hierarchisieren Sie Informationen mit Relativsatz, Partizipialattribut, Nominalisierung und Apposition.",
    "writeType": "reformulation",
    "collocations": [
      [
        "Kaufentscheidungen beeinflussen",
        "Personalisierte Werbung kann Kaufentscheidungen beeinflussen."
      ],
      [
        "eine Zielgruppe ansprechen",
        "Werbung spricht häufig klar definierte Zielgruppen an."
      ],
      [
        "Werbemechanismen transparent machen",
        "Transparenz kann Werbemechanismen für Verbraucher nachvollziehbarer machen."
      ]
    ]
  },
  {
    "day": 17,
    "chapter": "3.3",
    "title": "Kindergarten, Kinderbetreuung und Familienpolitik",
    "grammarFocus": "Konditionale Strukturen und Voraussetzungen",
    "topic": "Wie frühe Betreuung, Familienautonomie und gesellschaftliche Unterstützung miteinander verbunden sind.",
    "perspectives": [
      "Hochwertige Kinderbetreuung sollte unabhängig vom Einkommen der Eltern für alle verfügbar sein.",
      "Familien sollten möglichst frei entscheiden können, wie früh Kinder institutionell betreut werden.",
      "Frühkindliche Bildung kann soziale Unterschiede verringern, wenn ihre Qualität verlässlich hoch ist."
    ],
    "grammar": [
      "Konditionale Strukturen unterscheiden reale, eingeschränkte und notwendige Voraussetzungen.",
      "Sofern die Qualität gesichert ist, kann frühe Betreuung Chancen verbessern.",
      "Vorausgesetzt, dass ausreichend Fachkräfte zur Verfügung stehen, lässt sich das Angebot ausbauen."
    ],
    "writingPrompt": "Erörtern Sie, welche Bedingungen für einen gerechten Zugang zu hochwertiger Kinderbetreuung erfüllt sein müssen.",
    "planningPrompt": "Formulieren Sie Bedingungen und Voraussetzungen differenziert mit sofern, falls und vorausgesetzt, dass.",
    "writeType": "opinion",
    "collocations": [
      [
        "Betreuungsplätze ausbauen",
        "Kommunen müssen Betreuungsplätze ausbauen, damit Familien verlässlich planen können."
      ],
      [
        "frühkindliche Bildung fördern",
        "Gut ausgestattete Einrichtungen können frühkindliche Bildung gezielt fördern."
      ],
      [
        "pädagogische Qualität sichern",
        "Mehr Plätze allein reichen nicht aus, wenn die pädagogische Qualität nicht gesichert ist."
      ]
    ]
  },
  {
    "day": 18,
    "chapter": "3.4",
    "title": "Studium, Weiterbildung und lebenslanges Lernen",
    "grammarFocus": "Konjunktiv II Vergangenheit und irreale Alternativen",
    "topic": "Wie Menschen auf technologische, berufliche und gesellschaftliche Veränderungen durch Lernen reagieren.",
    "perspectives": [
      "Regelmäßige Weiterbildung sollte ein normaler Bestandteil jedes Berufslebens sein.",
      "Arbeitgeber müssen stärker für Weiterbildung verantwortlich sein, weil sie vom Kompetenzgewinn direkt profitieren.",
      "Lebenslanges Lernen darf nicht dazu führen, dass strukturelle Arbeitsmarktprobleme ausschließlich Einzelnen zugerechnet werden."
    ],
    "grammar": [
      "Konjunktiv II Vergangenheit zeigt irreale Alternativen und rückblickende Bedingungen.",
      "Ohne Weiterbildung hätte der berufliche Wechsel deutlich länger gedauert.",
      "Hätten Unternehmen früher investiert, wären manche Kompetenzlücken geringer ausgefallen."
    ],
    "writingPrompt": "Erörtern Sie rückblickend, welche Folgen frühere Bildungsentscheidungen haben können und welche Alternativen denkbar gewesen wären.",
    "planningPrompt": "Nutzen Sie Konjunktiv II der Vergangenheit für irreale Bedingungen, alternative Entwicklungen und Folgen.",
    "writeType": "reformulation",
    "collocations": [
      [
        "eine Weiterbildung absolvieren",
        "Viele Beschäftigte absolvieren eine Weiterbildung, um mit technologischem Wandel Schritt zu halten."
      ],
      [
        "Kenntnisse vertiefen",
        "Ein berufsbegleitendes Studium kann vorhandene Kenntnisse gezielt vertiefen."
      ],
      [
        "berufliche Perspektiven eröffnen",
        "Weiterbildung kann neue berufliche Perspektiven eröffnen."
      ]
    ]
  },
  {
    "day": 19,
    "chapter": "3.5",
    "title": "Globalisierung, Handel und wirtschaftliche Abhängigkeiten",
    "grammarFocus": "Komplexe Konnektoren und logische Beziehungen",
    "topic": "Wie globale Arbeitsteilung Chancen schafft und zugleich neue Abhängigkeiten erzeugt.",
    "perspectives": [
      "Offene Märkte erhöhen Wohlstand, auch wenn einzelne Branchen dadurch unter erheblichen Anpassungsdruck geraten.",
      "Strategisch wichtige Güter sollten stärker regional produziert werden, selbst wenn dies höhere Kosten verursacht.",
      "Faire globale Handelsbeziehungen erfordern verbindliche soziale und ökologische Mindeststandards."
    ],
    "grammar": [
      "Komplexe Konnektoren machen Logik explizit: insofern ... als, sofern, zumal, wenngleich, wohingegen.",
      "Globalisierung ist insofern vorteilhaft, als sie Spezialisierung ermöglicht.",
      "Wenngleich offene Märkte Chancen schaffen, können einseitige Abhängigkeiten erhebliche Risiken erzeugen."
    ],
    "writingPrompt": "Nehmen Sie Stellung dazu, wie Staaten wirtschaftliche Offenheit und strategische Unabhängigkeit ausbalancieren sollten.",
    "planningPrompt": "Nutzen Sie komplexe Konnektoren semantisch präzise und vermeiden Sie austauschbare Verknüpfungen.",
    "writeType": "opinion",
    "collocations": [
      [
        "globale Verflechtungen berücksichtigen",
        "Wirtschaftspolitik muss globale Verflechtungen berücksichtigen."
      ],
      [
        "Abhängigkeiten verringern",
        "Diversifizierung kann einseitige Abhängigkeiten verringern."
      ],
      [
        "Mindeststandards festlegen",
        "Internationale Regeln können soziale und ökologische Mindeststandards festlegen."
      ]
    ]
  },
  {
    "day": 20,
    "chapter": "4.1",
    "title": "Soziale Medien, Debattenkultur und Meinungsbildung",
    "grammarFocus": "Abtönung, Diskurspartikeln und pragmatische Wirkung",
    "topic": "Wie Plattformen, Nutzer und Algorithmen öffentliche Diskussionen prägen.",
    "perspectives": [
      "Plattformen sollten stärker dafür verantwortlich gemacht werden, wie ihre Algorithmen öffentliche Debatten beeinflussen.",
      "Eine lebendige Debattenkultur muss auch zugespitzte und unbequeme Meinungen aushalten.",
      "Medienkompetenz ist langfristig wirksamer als immer mehr Regeln für einzelne Plattformen."
    ],
    "grammar": [
      "Diskurspartikeln und Abtönungen verändern Haltung und Gesprächswirkung; in formellen Texten sparsam einsetzen.",
      "Die Position ist durchaus nachvollziehbar, greift jedoch zu kurz.",
      "Man könnte allerdings einwenden, dass die Verantwortung nicht allein bei den Plattformen liegt."
    ],
    "writingPrompt": "Analysieren Sie, wie soziale Medien Debattenkultur und öffentliche Meinungsbildung verändern.",
    "planningPrompt": "Nutzen Sie Diskurspartikeln kontrolliert, um Haltung und Gesprächsnuancen zu markieren.",
    "writeType": "reformulation",
    "collocations": [
      [
        "eine Debatte anstoßen",
        "Ein viraler Beitrag kann innerhalb weniger Stunden eine breite Debatte anstoßen."
      ],
      [
        "öffentliche Meinung prägen",
        "Plattformen können die öffentliche Meinung indirekt prägen."
      ],
      [
        "den Ton einer Diskussion verschärfen",
        "Polarisierende Formulierungen können den Ton einer Diskussion schnell verschärfen."
      ]
    ]
  },
  {
    "day": 21,
    "chapter": "4.2",
    "title": "Verwaltung, Bürgerservice und gesellschaftliche Institutionen",
    "grammarFocus": "Verb-Nomen-Kollokationen und institutioneller Stil",
    "topic": "Wie Institutionen verständlich, effizient und bürgernah handeln können.",
    "perspectives": [
      "Digitale Verwaltungsangebote sollten zum Standard werden, solange persönliche Alternativen erhalten bleiben.",
      "Bürgerfreundlichkeit hängt stärker von verständlichen Verfahren als von möglichst kurzen Bearbeitungszeiten ab.",
      "Institutionen gewinnen Vertrauen, wenn Zuständigkeiten und Entscheidungen transparent nachvollziehbar sind."
    ],
    "grammar": [
      "Institutioneller Stil lebt von festen Verb-Nomen-Verbindungen, nicht von möglichst komplizierten Einzelwörtern.",
      "einen Antrag stellen · Auskunft erteilen · Verantwortung übernehmen · Maßnahmen umsetzen",
      "Die Behörde sollte transparent Auskunft darüber erteilen, nach welchen Kriterien Entscheidungen getroffen werden."
    ],
    "writingPrompt": "Verfassen Sie einen sachlich-formellen Text über eine institutionelle Entscheidung und ihre Auswirkungen auf Bürgerinnen und Bürger.",
    "planningPrompt": "Nutzen Sie feste Verb-Nomen-Verbindungen idiomatisch und vermeiden Sie wörtliche Übersetzungen.",
    "writeType": "opinion",
    "collocations": [
      [
        "einen Antrag stellen",
        "Betroffene können einen Antrag auf Unterstützung stellen."
      ],
      [
        "Auskunft erteilen",
        "Die zuständige Stelle muss verbindliche Auskunft erteilen."
      ],
      [
        "Verantwortung übernehmen",
        "Öffentliche Institutionen müssen für nachvollziehbare Verfahren Verantwortung übernehmen."
      ]
    ]
  },
  {
    "day": 22,
    "chapter": "4.3",
    "title": "Reisen, Tourismus und kulturelle Begegnung",
    "grammarFocus": "Temporale Verknüpfungen und zeitliche Logik",
    "topic": "Wie Reisen Begegnung ermöglicht und zugleich ökologische sowie soziale Folgen erzeugt.",
    "perspectives": [
      "Tourismus fördert kulturelles Verständnis nur dann, wenn Reisende sich tatsächlich mit dem Zielort auseinandersetzen.",
      "Beliebte Reiseziele dürfen Besucherzahlen begrenzen, um Lebensqualität und Umwelt zu schützen.",
      "Längere, seltenere Reisen sind gesellschaftlich sinnvoller als viele kurze Flugreisen."
    ],
    "grammar": [
      "Temporale Verknüpfungen müssen Abfolge, Gleichzeitigkeit oder Dauer eindeutig machen.",
      "Bevor eine Region den Tourismus ausweitet, sollte sie Belastungsgrenzen bestimmen.",
      "Während Besucherzahlen steigen, verschärft sich mancherorts der Druck auf Wohnraum und Infrastruktur."
    ],
    "writingPrompt": "Erörtern Sie Chancen und Belastungen des internationalen Tourismus für lokale Gesellschaften.",
    "planningPrompt": "Stellen Sie Abläufe und zeitliche Beziehungen mit präzisen temporalen Strukturen dar.",
    "writeType": "reformulation",
    "collocations": [
      [
        "eine Reise unternehmen",
        "Viele Menschen unternehmen Reisen, um neue Kulturen kennenzulernen."
      ],
      [
        "kulturelle Begegnungen ermöglichen",
        "Austauschprogramme ermöglichen intensive kulturelle Begegnungen."
      ],
      [
        "Tourismus nachhaltig gestalten",
        "Regionen versuchen zunehmend, Tourismus nachhaltiger zu gestalten."
      ]
    ]
  },
  {
    "day": 23,
    "chapter": "4.4",
    "title": "Internationale Zusammenarbeit und Diplomatie",
    "grammarFocus": "Hedging, vorsichtige Kritik und diplomatische Formulierungen",
    "topic": "Wie Konflikte, Interessen und Kooperation sprachlich vorsichtig verhandelt werden.",
    "perspectives": [
      "Diplomatische Sprache sollte klare Kritik ermöglichen, ohne Konflikte unnötig zu verschärfen.",
      "Ein tragfähiger Kompromiss ist häufig wichtiger als die vollständige Durchsetzung der eigenen Position.",
      "Internationale Zusammenarbeit bleibt auch dann sinnvoll, wenn zentrale Interessen nicht vollständig übereinstimmen."
    ],
    "grammar": [
      "Diplomatische Sprache kombiniert klare Positionen mit kontrollierter Abschwächung: nur bedingt, insofern, unter Vorbehalt, grundsätzlich.",
      "Dieser Einschätzung lässt sich grundsätzlich zustimmen, allerdings bleibt offen, ob ...",
      "Ein möglicher Kompromiss bestünde darin, ...; zugleich wäre zu berücksichtigen, dass ..."
    ],
    "writingPrompt": "Formulieren Sie eine diplomatische Stellungnahme, die Zustimmung, Vorbehalt und einen Kompromissvorschlag verbindet.",
    "planningPrompt": "Nutzen Sie Hedging und vorsichtige Kritik, ohne Ihre eigentliche Position unklar zu machen.",
    "writeType": "opinion",
    "collocations": [
      [
        "einen Kompromiss aushandeln",
        "Die Beteiligten versuchen, einen tragfähigen Kompromiss auszuhandeln."
      ],
      [
        "Vorbehalte äußern",
        "Mehrere Beteiligte äußerten Vorbehalte."
      ],
      [
        "Gesprächsbereitschaft signalisieren",
        "Beide Seiten signalisierten weitere Gesprächsbereitschaft."
      ]
    ]
  },
  {
    "day": 24,
    "chapter": "4.5",
    "title": "Gesellschaftliche Kontroversen und öffentliche Debatten",
    "grammarFocus": "Argumentationslogik: These, Begründung, Beleg, Einwand und Reaktion",
    "topic": "Wie kontroverse Positionen logisch, fair und evidenzbasiert vertreten werden können.",
    "perspectives": [
      "Eine überzeugende Position muss auch ein starkes Gegenargument ernst nehmen.",
      "Öffentliche Debatten gewinnen an Qualität, wenn Behauptungen nachvollziehbar begründet und belegt werden.",
      "Ein Kompromiss ist nicht automatisch ausgewogen, nur weil er zwischen zwei Positionen liegt."
    ],
    "grammar": [
      "C2-Argumentation folgt einer erkennbaren Logik: These → Begründung → Beleg → Einwand → Reaktion → Schluss.",
      "Für diese Position spricht ..., allerdings ist der Einwand ernst zu nehmen, dass ...",
      "Der Einwand greift insofern zu kurz, als ...; daraus lässt sich jedoch nicht ableiten, dass ..."
    ],
    "writingPrompt": "Verfassen Sie eine vollständige C2-Stellungnahme zu einer gesellschaftlich kontroversen Frage.",
    "planningPrompt": "Bauen Sie These, Begründung, Beleg, Einwand, Reaktion und Schluss als erkennbare Argumentationslinie auf.",
    "writeType": "reformulation",
    "collocations": [
      [
        "eine These begründen",
        "Eine überzeugende Position muss ihre zentrale These nachvollziehbar begründen."
      ],
      [
        "einen Beleg anführen",
        "Für zentrale Aussagen sollte ein konkreter Beleg angeführt werden."
      ],
      [
        "einen Einwand entkräften",
        "Ein guter Text reagiert auf einen starken Einwand, statt ihn zu ignorieren."
      ]
    ]
  },
  {
    "day": 25,
    "chapter": "5.1",
    "title": "Daten, Statistik und wissenschaftliche Evidenz",
    "grammarFocus": "Evidentialität und vorsichtige Schlussfolgerungen",
    "topic": "Wie stark Aussagen aus Daten, Studien und Korrelationen formuliert werden dürfen.",
    "perspectives": [
      "Eine statistische Korrelation rechtfertigt noch keine eindeutige kausale Schlussfolgerung.",
      "Politische oder gesellschaftliche Entscheidungen sollten die Grenzen wissenschaftlicher Evidenz offen benennen.",
      "Unsicherheit in Daten zu markieren schwächt eine Argumentation nicht, sondern kann ihre Glaubwürdigkeit erhöhen."
    ],
    "grammar": [
      "Evidentialität markiert, wie stark Daten eine Aussage tragen: belegen, nahelegen, darauf hindeuten, vermuten lassen, nicht ausschließen.",
      "Die Daten legen einen Zusammenhang nahe, belegen jedoch keinen eindeutigen Kausalmechanismus.",
      "Aus den vorliegenden Befunden lässt sich nicht ohne Weiteres schließen, dass ..."
    ],
    "writingPrompt": "Bewerten Sie eine hypothetische Studie und erklären Sie, welche Aussagen durch die Daten gestützt werden und welche nicht.",
    "planningPrompt": "Stufen Sie Aussagen nach Evidenzgrad ab und vermeiden Sie unbelegte Kausalität.",
    "writeType": "opinion",
    "collocations": [
      [
        "Daten auswerten",
        "Forschende werten erhobene Daten systematisch aus."
      ],
      [
        "eine Korrelation feststellen",
        "Die Studie stellt eine statistische Korrelation fest."
      ],
      [
        "die Belastbarkeit prüfen",
        "Weitere Analysen müssen die Belastbarkeit des Ergebnisses prüfen."
      ]
    ]
  },
  {
    "day": 26,
    "chapter": "5.2",
    "title": "Philosophie, Ethik und technischer Fortschritt",
    "grammarFocus": "Satzperioden, Einbettung und hierarchische Satzstruktur",
    "topic": "Wie abstrakte Begriffe und ethische Konflikte logisch und sprachlich präzise untersucht werden können.",
    "perspectives": [
      "Technischer Fortschritt sollte nicht nur nach Effizienz, sondern auch nach seinen sozialen und ethischen Folgen beurteilt werden.",
      "Eine ethische Position ist nur dann überzeugend, wenn ihre Voraussetzungen und möglichen Gegenargumente offengelegt werden.",
      "Nicht alles, was technisch möglich ist, ist deshalb bereits gesellschaftlich wünschenswert."
    ],
    "grammar": [
      "Komplexe Satzperioden brauchen eine klare Hierarchie aus Hauptaussage, Einbettung, Bedingung und Folgerung.",
      "Die Frage, inwieweit technischer Fortschritt ethisch vertretbar ist, lässt sich nur beantworten, wenn Nutzen, Risiken und Verteilungseffekte getrennt betrachtet werden.",
      "Verdichte nur dort, wo der logische Bezug auch beim ersten Lesen eindeutig bleibt."
    ],
    "writingPrompt": "Erörtern Sie eine ethische Frage des technischen Fortschritts mit klaren Prämissen und einer nachvollziehbaren Schlussfolgerung.",
    "planningPrompt": "Nutzen Sie komplexe Satzperioden nur dort, wo die logische Hierarchie klar bleibt.",
    "writeType": "reformulation",
    "collocations": [
      [
        "eine Prämisse prüfen",
        "Ethische Argumente müssen ihre zugrunde liegenden Prämissen offenlegen."
      ],
      [
        "Folgen abwägen",
        "Technischer Fortschritt verlangt eine Abwägung möglicher Folgen."
      ],
      [
        "eine Schlussfolgerung herleiten",
        "Aus klaren Prämissen lässt sich eine nachvollziehbare Schlussfolgerung herleiten."
      ]
    ]
  },
  {
    "day": 27,
    "chapter": "5.3",
    "title": "Akademisches Schreiben und formelle Korrespondenz",
    "grammarFocus": "Redundanz, Präzision, Register und Kohäsion",
    "topic": "Wie anspruchsvolle Texte präzise, kohärent und adressatengerecht überarbeitet werden.",
    "perspectives": [
      "Ein akademischer Text wird nicht durch möglichst lange Sätze besser, sondern durch klare Bezüge und präzise Verben.",
      "Formelle Korrespondenz sollte sachlich bleiben, ohne unnötig distanziert oder bürokratisch zu wirken.",
      "Überarbeiten bedeutet auch, Redundanzen zu streichen und mehrdeutige Bezüge eindeutig zu machen."
    ],
    "grammar": [
      "C2-Redaktion prüft Präzision, Redundanz, Bezüge, Register und Kohäsion systematisch.",
      "schwaches Verb: eine Analyse machen → präziser: analysieren / auswerten / untersuchen",
      "Ein präziser Fachtext streicht Wiederholungen, klärt Pronomenbezüge und wählt Verben nach ihrer tatsächlichen Bedeutung."
    ],
    "writingPrompt": "Überarbeiten Sie einen formellen oder akademischen Text auf Präzision, Register, Kohäsion und Redundanz.",
    "planningPrompt": "Prüfen Sie Wortwahl, Bezüge, Satzbau und Register systematisch und ersetzen Sie schwache Formulierungen.",
    "writeType": "opinion",
    "collocations": [
      [
        "einen Text redigieren",
        "Vor der Abgabe sollte ein Text sorgfältig redigiert werden."
      ],
      [
        "Redundanzen vermeiden",
        "Gute Fachtexte vermeiden unnötige Redundanzen."
      ],
      [
        "das Register anpassen",
        "Für formelle Korrespondenz muss das Register konsequent angepasst werden."
      ]
    ]
  },
  {
    "day": 28,
    "chapter": "5.4",
    "title": "C2 Prüfungssimulation: Stellungnahme, Umformung und Synthese",
    "grammarFocus": "Register, Nuance, Evidenz, Kohäsion und Reformulierung",
    "topic": "Wie C2-Kompetenzen unter Prüfungsbedingungen flexibel kombiniert und kontrolliert werden.",
    "perspectives": [
      "Eine starke C2-Leistung verbindet sprachliche Komplexität mit klarer Argumentationslogik.",
      "Reformulierung ist nur gelungen, wenn Bedeutung, Register und grammatische Beziehungen erhalten bleiben.",
      "Die Endkontrolle sollte Inhalt, Kohäsion, Kasus, Wortstellung, Register und Evidenzstärke gemeinsam prüfen."
    ],
    "grammar": [
      "Die Prüfungssimulation verlangt flexible Auswahl: Struktur nach Funktion wählen, nicht nach Schwierigkeit.",
      "Vor dem Abgeben: Bedeutung → Argumentationslogik → Register → Evidenz → Kasus/Rektion → Wortstellung → Kohäsion.",
      "Eine gelungene Synthese verbindet Perspektiven, ohne Unterschiede einzuebnen oder Unsicherheit als Gewissheit darzustellen."
    ],
    "writingPrompt": "Bearbeiten Sie eine vollständige C2-Simulationsaufgabe mit Stellungnahme, Reformulierung und abschließender Synthese.",
    "planningPrompt": "Wählen Sie Strukturen nach Funktion, sichern Sie Kohäsion und prüfen Sie Register, Nuance und Evidenz in der Endkontrolle.",
    "writeType": "reformulation",
    "collocations": [
      [
        "eine Position differenzieren",
        "Eine starke C2-Antwort differenziert ihre Position."
      ],
      [
        "Bedeutung erhalten",
        "Bei einer Umformung muss die ursprüngliche Bedeutung erhalten bleiben."
      ],
      [
        "eine Synthese formulieren",
        "Am Ende sollte eine klare, differenzierte Synthese formuliert werden."
      ]
    ]
  }
];


const slug = (value) => String(value || "")
  .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  .replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase();

const REFORMULATION_FAMILIES = [
  ["skeptisch sein → Zweifel haben", "Viele Beteiligte hatten zunächst Zweifel an dem Vorschlag."],
  ["um ... zu → zur + Nominalisierung", "Die Einrichtung investiert zur Verbesserung der Qualität."],
  ["erkennen/merken → jemandem wird klar", "Den Verantwortlichen wurde klar, dass weitere Schritte nötig waren."],
  ["obwohl → trotz + Nominalgruppe", "Trotz der hohen Umsetzungskosten wird die Maßnahme fortgesetzt."],
  ["wenn/indem → durch + Nominalgruppe", "Durch eine bessere Koordination der Prozesse steigt die Qualität."],
];

function objectiveSentence(lesson) {
  return "Students teach and practise " + lesson.grammarFocus + " through the current Falowen C2 topic " + lesson.title + ", then transfer it into the same speaking and writing mode used in Course Book.";
}

function commonMistakesDe(lesson) {
  const focus = String(lesson.grammarFocus || "");
  const specific =
    /Evidenz|Kausal|Schlussfolger/i.test(focus) ? "Evidenzgrad nicht übertreiben und Korrelation nicht automatisch als Ursache formulieren." :
    /Konjunktiv I|Modalität/i.test(focus) ? "Fremdaussage, Vermutung und gesicherte Tatsache sprachlich nicht vermischen." :
    /Rektion|präposition/i.test(focus) ? "Präposition und Kasus als feste Einheit lernen; nicht direkt aus einer anderen Sprache übertragen." :
    /Partizipial|Kompression|Satzperiod/i.test(focus) ? "Informationsdichte nicht mit C2-Qualität verwechseln; bei unklarem Bezug den Satz entlasten." :
    /Hedging|Register/i.test(focus) ? "Abschwächung nicht so weit treiben, dass die eigentliche Position unklar wird." :
    /Konditional|Voraussetzung/i.test(focus) ? "Bedingung, zeitliche Beziehung und Folge nicht miteinander verwechseln." :
    "Die fortgeschrittene Struktur nur einsetzen, wenn sie die logische Beziehung wirklich präziser macht.";
  return [
    "Typischer Fehler: " + specific,
    "C2 bedeutet kontrollierte Auswahl, nicht möglichst lange oder komplizierte Sätze.",
    "Nach jeder Umformung Bedeutung, Register, Kasus, Wortstellung und Bezüge erneut prüfen.",
  ];
}

function makeSpeakingQuestions(lesson) {
  return [
    "Welche zentrale Spannung steckt hinter „" + lesson.title + "“?",
    "Nimm differenziert Stellung zu: „" + lesson.perspectives[0] + "“",
    "Nimm differenziert Stellung zu: „" + lesson.perspectives[1] + "“",
    "Nimm differenziert Stellung zu: „" + lesson.perspectives[2] + "“",
    "Halte einen strukturierten 3–5-minütigen Vortrag zu „" + lesson.title + "“ und schließe mit einer klaren Synthese.",
  ];
}

function makeSpeakingModels(lesson, questions) {
  const c = lesson.collocations;
  const g = lesson.grammar;
  return [
    { questionDe: questions[0], modelAnswerDe: "Im Mittelpunkt steht " + lesson.topic + " Dabei treffen unterschiedliche Interessen aufeinander. " + c[0][1] + " Entscheidend ist deshalb eine differenzierte Abwägung statt einer pauschalen Bewertung." },
    { questionDe: questions[1], modelAnswerDe: "Die Aussage lässt sich nur bedingt pauschalisieren. " + g[1] + " Zugleich sollte berücksichtigt werden: " + c[1][1] },
    { questionDe: questions[2], modelAnswerDe: "Für diese Position spricht ein nachvollziehbares Argument; dennoch hängt ihre Tragfähigkeit von Bedingungen und Gegenpositionen ab. " + g[2] },
    { questionDe: questions[3], modelAnswerDe: "Der Beitrag benennt einen wichtigen Aspekt, greift allein jedoch zu kurz. " + c[2][1] + " Eine C2-Antwort sollte die Reichweite der Aussage ausdrücklich begrenzen." },
    { questionDe: questions[4], modelAnswerDe: "Zunächst würde ich die Leitfrage eingrenzen, anschließend die drei Perspektiven abwägen und mindestens eine Gegenposition ernsthaft prüfen. Sprachlich nutze ich die heutige Zielstruktur gezielt und formuliere am Ende eine Synthese, die Bedingungen und Grenzen sichtbar macht." },
  ];
}

function makeGrammarChecks(lesson) {
  const questions = [
    "Erkläre die Funktion von „" + lesson.grammarFocus + "“ in dieser Lektion.",
    "Formuliere eine zu pauschale Aussage zum Thema „" + lesson.title + "“ mit der heutigen Zielstruktur präziser.",
    "Welche Kontrolle ist vor dem Abgeben besonders wichtig: Bedeutung, Register, Wortstellung oder Evidenzgrad? Begründe deine Auswahl am heutigen Thema.",
  ];
  const models = [
    lesson.grammar[0] + " Beispiel: " + lesson.grammar[1],
    lesson.grammar[2],
    "Alle vier Kontrollen gehören zur C2-Endkontrolle. Besonders wichtig ist heute, dass die gewählte Struktur die beabsichtigte logische Beziehung tatsächlich ausdrückt und die Aussage nicht stärker formuliert wird, als Inhalt oder Evidenz erlauben.",
  ];
  return { questions, models: questions.map((questionDe, i) => ({ questionDe, modelAnswerDe: models[i] })) };
}

function makeSlide(lesson) {
  const questions = makeSpeakingQuestions(lesson);
  const topicFoundation = getC2TopicFoundation(lesson.day);
  const checks = makeGrammarChecks(lesson);
  const writeDescription = lesson.writeType === "opinion"
    ? "Stellungnahme: ungefähr 350 Wörter, alle drei Beiträge berücksichtigen und eine eigene begründete Position entwickeln."
    : "Umformung: fünf Sätze mit unverändertem Vorgabewort; Bedeutung erhalten, Struktur neu bauen, Kasus und Wortstellung kontrollieren.";
  const writeTeaching = lesson.writeType === "opinion"
    ? ["These und Kriterien planen", "alle drei Perspektiven einbinden", "Gegenargument beantworten", "differenziert schließen"]
    : REFORMULATION_FAMILIES.map(([name]) => name);

  return {
    id: "c2-day-" + lesson.day + "-" + slug(lesson.title),
    course: "C2",
    day: "Day " + lesson.day,
    dayNumber: lesson.day,
    chapter: lesson.chapter,
    assignmentId: "C2-" + lesson.chapter,
    title: "C2 Day " + lesson.day + " · " + lesson.title,
    topic: lesson.chapter + " · " + lesson.topic,
    objective: objectiveSentence(lesson),
    estimatedDuration: "75–90 minutes",
    warmupQuestionsDe: [
      "Was ist die Kernfrage bei „" + lesson.title + "“?",
      "Welche zwei Interessen oder Werte geraten bei diesem Thema in Spannung?",
      "Welche der drei Kursaussagen findest du am schwierigsten zu beurteilen – und warum?",
      "Welche heutige Kollokation passt zu einem ersten Argument?",
    ],
    knowledgeTextDe: topicFoundation
      ? "1-Minuten-Wissen: Simple English: " + topicFoundation.en + " Auf Deutsch: " + topicFoundation.de + " Konkretes Beispiel: " + topicFoundation.example + " Kernfrage: " + topicFoundation.core + " Kernspannung: " + topicFoundation.tension
      : "1-Minuten-Wissen: " + lesson.topic + " Auf C2-Niveau reicht eine Pro-und-Contra-Liste nicht. Prüfe Annahmen, Bedingungen und Reichweite jeder Aussage und nutze die Grammatik, um genau diese Unterschiede sprachlich sichtbar zu machen.",
    keyPhrasesDe: [
      ...lesson.collocations.map(([phrase, example]) => phrase + " — " + example),
      "Die Frage lässt sich nicht pauschal beantworten, weil ...",
      "Dafür spricht ..., allerdings ist zu berücksichtigen, dass ...",
      "Aus diesem Argument lässt sich nicht ohne Weiteres ableiten, dass ...",
    ],
    grammarTeachDe: ["Zielstruktur: " + lesson.grammarFocus + ".", ...lesson.grammar],
    commonMistakesDe: commonMistakesDe(lesson),
    studentQuestionsDe: questions,
    speakingModels: makeSpeakingModels(lesson, questions),
    teacherNotesEn: [
      "Runtime source: Falowen C2 standard curriculum, not the older mastery title list.",
      "Teach the topic foundation first: simple meaning, concrete example and central tension. Then teach the three debate perspectives and grammar focus.",
      "Keep the speaking task seminar-style: structured presentation, perspective weighing, examples and follow-up questions.",
      "For even days, teach transformation families in Learn but do not reveal the exact Write answers.",
      "Correct after the full response; prioritise logic, register and two high-value language points.",
    ],
    interactionFlow: [
      { phase: "1-minute knowledge", detailEn: "3 min: read the topic frame, identify the central tension and activate two collocations." },
      { phase: "Grammar teaching", detailEn: "12 min: teach function, structure and the two current Falowen model examples." },
      { phase: "Perspective check", detailEn: "12 min: test the assumptions and limits behind all three current Course Book statements." },
      { phase: "Speaking transfer", detailEn: "15 min: build a structured seminar response using the target grammar and topic collocations." },
      { phase: "C2 synthesis", detailEn: "15 min: deliver a 3–5-minute response with position, example/evidence, counterposition and synthesis." },
      { phase: "Writing transfer", detailEn: "12 min: prepare the same Write mode used by this Falowen day without exposing assessment answers." },
    ],
    wrapUpTaskDe: lesson.writeType === "opinion"
      ? lesson.writingPrompt + " " + lesson.planningPrompt
      : "Bereite die heutige Umformungsaufgabe vor. Wiederhole die Transformationsfamilien, aber löse die fünf Prüfungsitems erst im Write-Bereich.",
    workbookConnection: {
      grammarUrl: null,
      workbookUrl: null,
      subtitle: "Falowen C2 " + lesson.chapter + " · " + lesson.title,
      parts: [
        { label: "Learn / Grammar", detailEn: lesson.grammarFocus + ": " + lesson.grammar[0] },
        { label: "Kollokationen", detailEn: lesson.collocations.map(([phrase]) => phrase).join(" · ") },
        { label: "Sprechen", detailEn: "Five-minute seminar presentation using the same three current Falowen perspectives." },
        { label: "Write", detailEn: writeDescription },
        { label: "Write preparation", detailEn: writeTeaching.join(" · ") },
      ],
    },
    teacherSupport: {
      lessonOverviewEn: "Current Falowen runtime C2 lesson " + lesson.chapter + ": " + lesson.title + ". " + lesson.topic,
      grammarFocusEn: lesson.grammar,
      modelExamplesDe: lesson.grammar.slice(1),
      commonMistakesEn: commonMistakesDe(lesson),
    },
    grammarCheckTitle: "C2 Grammatik- und Präzisionscheck",
    grammarCheckQuestions: checks.questions,
    grammarCheckModels: checks.models,
    grammarCheckMinutes: 10,
    runtimePerspectivesDe: lesson.perspectives,
    writeType: lesson.writeType,
    canonicalWritingPromptDe: lesson.writingPrompt,
  };
}

export const c2PresenterSlides = LESSONS.map(makeSlide);

export const c2CourseEntries = LESSONS.map((lesson) => ({
  assignment_id: "C2-" + lesson.chapter,
  chapter: lesson.chapter,
  de: lesson.title,
  en: lesson.title,
}));
