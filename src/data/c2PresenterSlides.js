const GRAMMAR = {
  argumentation: "Structure C2 arguments by separating thesis, premise, evidence, counterargument, concession and synthesis; use einerseits ... andererseits, zwar ... jedoch and darüber hinaus selectively rather than mechanically.",
  concessive: "Use advanced concessive structures such as obgleich, wenngleich, selbst wenn, ungeachtet dessen and trotz to concede a point without abandoning the main argument.",
  contrast: "Use precise contrast with während, wohingegen, demgegenüber, hingegen and im Gegensatz dazu, making the compared dimensions explicit.",
  nominalisation: "Use nominalisation for dense formal style while preserving clarity: regulieren → die Regulierung, teilhaben → die Teilhabe, abwägen → die Abwägung.",
  passive: "Use passive, modal passive and passive alternatives when processes, norms or consequences are more important than the actor.",
  reported: "Report sources and contested claims precisely with laut, zufolge, nach Angaben and Konjunktiv I; distinguish reported claims from your own evaluation.",
  consequence: "Express causal chains and consequences precisely with zumal, insofern, infolgedessen, sodass, weshalb and wodurch.",
  condition: "Use sofern, vorausgesetzt, dass, selbst wenn, angenommen, dass and Konjunktiv II to formulate conditions, reservations and counterfactual scenarios.",
  purpose: "Use indem, dadurch dass, um ... zu and damit to distinguish means, mechanisms and intended outcomes.",
  relative: "Use extended relative clauses, including prepositional and genitive relatives such as auf deren Grundlage, mit denen and für die.",
  academic: "Distinguish observation, evidence, inference, evaluation and limitation with cohesive academic language and explicit reference.",
  hedging: "Use modal hedging and epistemic precision: dürfte, ließe sich, scheint, spricht dafür, kaum, keineswegs and nur bedingt.",
  functional: "Use Funktionsverbgefüge selectively for formal precision: zur Debatte stehen, in Betracht ziehen, eine Abwägung vornehmen, Einfluss ausüben.",
  participle: "Use expanded participial attributes to compress information: die von Experten vorgeschlagene Reform; die langfristig zu erwartenden Folgen.",
  coherence: "Create dense but readable cohesion through reference chains, resumptive expressions and paragraph-level connectors instead of repeating the same nouns and conjunctions.",
};

const LESSONS = [
  {
    topic: "Kreislaufwirtschaft und Wegwerfgesellschaft",
    grammar: ["nominalisation", "consequence", "hedging"],
    models: [
      "Die konsequente Vermeidung kurzlebiger Produkte dürfte wirksamer sein als eine ausschließlich auf Recycling ausgerichtete Strategie.",
      "Die Ausweitung von Reparatur- und Rücknahmesystemen kann den Ressourcenverbrauch senken, wodurch Herstellern zugleich mehr Verantwortung für den gesamten Produktzyklus zukommt.",
      "Eine pauschale Kritik am Konsum greift jedoch zu kurz, zumal langlebige Alternativen nicht für alle Haushalte gleichermaßen erschwinglich sind.",
    ],
    speaking: [
      "Die zentrale Spannung besteht zwischen individuellem Konsumkomfort und den ökologischen Kosten einer Wegwerfgesellschaft. Eine C2-Analyse sollte deshalb nicht nur Verbraucher, sondern auch Produktdesign, Preise und Herstellerverantwortung berücksichtigen.",
      "Häufig wird vorausgesetzt, dass bessere Mülltrennung das Grundproblem löst. Diese Annahme ist nur bedingt überzeugend, weil Abfallvermeidung und längere Produktlebenszyklen bereits vor dem Recycling ansetzen.",
      "Gegen strengere Vorgaben lässt sich einwenden, dass sie Produkte verteuern könnten. Dem steht jedoch gegenüber, dass Reparierbarkeit und Wiederverwendung langfristig Material- und Entsorgungskosten reduzieren können.",
      "Sinnvoll wäre eine Kombination aus verbindlicher Herstellerverantwortung, Reparaturrechten und transparenten Informationen zur Lebensdauer von Produkten. So würde die Verantwortung nicht einseitig auf Konsumenten verlagert.",
      "In der Gesamtschau ist Kreislaufwirtschaft dann überzeugend, wenn sie Abfallvermeidung, soziale Bezahlbarkeit und wirtschaftliche Anreize verbindet. Recycling allein dürfte dafür nicht ausreichen.",
    ],
  },
  {
    topic: "Klimapolitik, Verantwortung und soziale Gerechtigkeit",
    grammar: ["concessive", "condition", "academic"],
    models: [
      "Wenngleich ambitionierte Klimapolitik gesellschaftliche Kosten verursacht, ist entscheidend, wie diese Kosten zwischen Einkommensgruppen verteilt werden.",
      "Klimaschutzmaßnahmen finden eher Akzeptanz, sofern ihre sozialen Folgen transparent gemacht und gezielt ausgeglichen werden.",
      "Aus sinkenden Emissionen allein lässt sich noch nicht ableiten, dass eine Maßnahme sozial ausgewogen oder langfristig tragfähig ist.",
    ],
    speaking: [
      "Klimapolitik berührt nicht nur ökologische, sondern auch verteilungspolitische Fragen. Entscheidend ist daher, wer die Kosten trägt und wer von Investitionen, Förderungen und besserer Infrastruktur profitiert.",
      "Eine problematische Annahme lautet, dass alle Haushalte gleichermaßen auf höhere Energie- oder Mobilitätspreise reagieren können. Tatsächlich unterscheiden sich Einkommen, Wohnort und verfügbare Alternativen erheblich.",
      "Kritiker verweisen zu Recht auf Belastungen durch Verbote oder Preissteigerungen. Dieses Argument spricht jedoch eher für sozialen Ausgleich und Übergangsfristen als gegen Klimapolitik grundsätzlich.",
      "Maßnahmen sollten ökologische Wirksamkeit mit gezielten Rückerstattungen, öffentlichem Verkehr und Gebäudeförderung verbinden. Dadurch ließe sich vermeiden, dass Klimaschutz als rein individuelle Pflicht erscheint.",
      "Eine tragfähige Klimapolitik muss ökologische Ziele, soziale Gerechtigkeit und politische Akzeptanz gleichzeitig berücksichtigen. Gerade diese Abwägung unterscheidet eine differenzierte Position von einer einfachen Pro-oder-Contra-Antwort.",
    ],
  },
  {
    topic: "Energie- und Mobilitätswende",
    grammar: ["passive", "contrast", "condition"],
    models: [
      "Während der Ausbau erneuerbarer Energien beschleunigt werden muss, dürfen Netzstabilität und Speicherbedarf nicht ausgeblendet werden.",
      "Der motorisierte Individualverkehr ließe sich deutlich reduzieren, sofern attraktive und verlässliche Alternativen verfügbar wären.",
      "Investitionen sollten dort priorisiert werden, wo Emissionen vermieden und zugleich Mobilitätschancen verbessert werden können.",
    ],
    speaking: [
      "Die Energie- und Mobilitätswende verbindet technische Infrastruktur mit Verhaltensänderungen. Weder neue Technologien noch individuelle Einschränkungen allein dürften den Übergang bewältigen.",
      "Oft wird angenommen, dass Menschen freiwillig auf das Auto verzichten, sobald sie über Klimafolgen informiert sind. Diese Annahme unterschätzt Pendelwege, Versorgungslücken und die Bedeutung verlässlicher Alternativen.",
      "Gegen schnellen Ausbau werden Kosten und technische Grenzen angeführt. Diese Einwände sind relevant, rechtfertigen jedoch eher eine schrittweise Priorisierung als dauerhafte Abhängigkeit von fossilen Strukturen.",
      "Vorrangig wären stabile Netze, Speicher, öffentlicher Verkehr und sichere Rad- und Fußwege auszubauen. Die konkrete Mischung sollte regionale Bedingungen berücksichtigen.",
      "Die Wende dürfte gelingen, wenn technische Machbarkeit, soziale Erreichbarkeit und langfristige Planung zusammengeführt werden. Ein einheitliches Modell für alle Regionen wäre dagegen kaum überzeugend.",
    ],
  },
  {
    topic: "Nachhaltigkeit zwischen Innovation und Verzicht",
    grammar: ["argumentation", "hedging", "concessive"],
    models: [
      "Technologische Innovation kann Ressourcen effizienter nutzen, dürfte aber zusätzliche Nachfrage nicht automatisch verhindern.",
      "Selbst wenn klimafreundliche Technologien verfügbar sind, bleibt die Frage bestehen, welche Formen des Konsums gesellschaftlich langfristig tragfähig sind.",
      "Eine reine Verzichtsdebatte greift ebenso zu kurz wie die Annahme, technischer Fortschritt werde sämtliche Zielkonflikte auflösen.",
    ],
    speaking: [
      "Die Debatte wird häufig fälschlich als Gegensatz zwischen Innovation und Verzicht dargestellt. Tatsächlich geht es um die Frage, wo Effizienz genügt und wo absolute Verbrauchsgrenzen diskutiert werden müssen.",
      "Eine verbreitete Annahme ist, dass effizientere Technik automatisch den Gesamtverbrauch senkt. Rebound-Effekte zeigen jedoch, dass niedrigere Kosten oder höherer Komfort zusätzliche Nutzung begünstigen können.",
      "Gegen Verzicht wird eingewandt, dass er individuelle Freiheit einschränke und politisch schwer vermittelbar sei. Umgekehrt kann unbegrenzter Konsum ökologische Kosten auf andere Gruppen oder Generationen verlagern.",
      "Sinnvoll wäre, Innovation durch Standards und Preise so zu gestalten, dass Effizienzgewinne nicht vollständig durch Mehrverbrauch aufgehoben werden. Gleichzeitig sollten Alternativen attraktiv statt nur moralisch gefordert werden.",
      "In der Gesamtschau erscheint eine Kombination aus Innovation, Infrastruktur und selektiver Begrenzung am plausibelsten. Welche Form angemessen ist, hängt allerdings stark vom jeweiligen Sektor ab.",
    ],
  },
  {
    topic: "Schulpflicht, Bildungsauftrag und individuelle Freiheit",
    grammar: ["argumentation", "condition", "relative"],
    models: [
      "Schulpflicht lässt sich nicht ausschließlich als Eingriff in die individuelle Freiheit verstehen, da sie zugleich den Zugang zu Bildung und gesellschaftlicher Teilhabe sichern soll.",
      "Alternative Bildungsformen wären vertretbar, sofern verbindliche Qualitätsstandards und soziale Kontakte gewährleistet würden.",
      "Eltern, deren pädagogische Vorstellungen von staatlichen Schulen abweichen, benötigen nachvollziehbare Verfahren statt pauschaler Ausnahmen.",
    ],
    speaking: [
      "Die Grundspannung besteht zwischen elterlicher und individueller Freiheit einerseits und dem staatlichen Bildungs- und Schutzauftrag andererseits. Eine überzeugende Position muss beide Seiten ernst nehmen.",
      "Hinter der Schulpflicht steht die Annahme, dass gemeinsame Bildungsstandards gesellschaftliche Teilhabe fördern. Sie ist plausibel, darf aber nicht mit der Behauptung verwechselt werden, nur eine einzige Schulform könne diese Ziele erreichen.",
      "Kritiker verweisen auf pädagogische Vielfalt und individuelle Lernbedürfnisse. Dem lässt sich entgegenhalten, dass Kinder unabhängig von den Ressourcen ihrer Eltern Mindestchancen auf Bildung und soziale Erfahrung erhalten sollten.",
      "Denkbar wären kontrollierte alternative Bildungsformen mit verbindlichen Lernzielen, regelmäßiger Evaluation und Schutzstandards. Damit würde Freiheit erweitert, ohne den Bildungsauftrag vollständig zu privatisieren.",
      "Schulpflicht ist daher weniger als starre Anwesenheitspflicht denn als Garantie überprüfbarer Bildung zu diskutieren. Wie flexibel diese Garantie ausgestaltet wird, ist eine legitime politische und pädagogische Abwägung.",
    ],
  },
  {
    topic: "Kindergarten und frühkindliche Bildung",
    grammar: ["nominalisation", "relative", "hedging"],
    models: [
      "Der Ausbau hochwertiger frühkindlicher Bildung kann zur Verringerung späterer Bildungsungleichheiten beitragen, dürfte familiäre Unterschiede jedoch nicht vollständig ausgleichen.",
      "Einrichtungen, in denen Sprache, Spiel und soziale Interaktion systematisch gefördert werden, schaffen wichtige Entwicklungsräume.",
      "Die Professionalisierung des Personals ist mindestens ebenso relevant wie die bloße Ausweitung von Betreuungsplätzen.",
    ],
    speaking: [
      "Frühkindliche Bildung erfüllt Betreuungs-, Bildungs- und Integrationsfunktionen zugleich. Deshalb sollte die Debatte nicht auf die Frage reduziert werden, ab welchem Alter Kinder möglichst lange betreut werden.",
      "Eine häufige Annahme lautet, mehr Betreuungsplätze führten automatisch zu besseren Bildungschancen. Entscheidend sind jedoch Qualität, Personalschlüssel, Sprachförderung und stabile Beziehungen.",
      "Manche Eltern befürchten eine zu frühe Institutionalisierung. Diese Sorge ist nachvollziehbar, spricht aber eher für flexible Modelle und Qualitätsstandards als gegen frühkindliche Angebote insgesamt.",
      "Investitionen sollten vorrangig in qualifiziertes Personal, kleinere Gruppen und gezielte Sprach- und Entwicklungsförderung fließen. Zugleich braucht es Wahlmöglichkeiten für Familien.",
      "Kindergarten kann soziale Ungleichheit mindern, wenn Qualität und Zugang zusammen gedacht werden. Eine reine Platzquote wäre dagegen ein zu grober Erfolgsindikator.",
    ],
  },
  {
    topic: "Chancengleichheit, Leistung und Selektion im Bildungssystem",
    grammar: ["concessive", "consequence", "academic"],
    models: [
      "Obgleich Leistungsbewertung Orientierung bietet, kann frühe Selektion bestehende soziale Unterschiede verstärken.",
      "Unterschiedliche Ausgangsbedingungen wirken sich auf schulische Leistungen aus, weshalb Ergebnisse nicht losgelöst vom Lernkontext interpretiert werden sollten.",
      "Aus statistischen Leistungsunterschieden lässt sich nicht ohne Weiteres auf individuelle Begabung schließen.",
    ],
    speaking: [
      "Chancengleichheit bedeutet nicht, dass alle dieselben Ergebnisse erzielen müssen, sondern dass Herkunft und Einkommen den Bildungsweg möglichst wenig bestimmen. Leistungsprinzip und Ausgleich stehen daher in einem dauerhaften Spannungsverhältnis.",
      "Problematisch ist die Annahme, Noten spiegelten Leistung völlig objektiv wider. Unterrichtsqualität, familiäre Unterstützung und Erwartungen können Ergebnisse erheblich beeinflussen.",
      "Gegen zusätzliche Förderung wird mitunter eingewandt, sie verwässere Leistungsstandards. Das überzeugt nur teilweise, denn faire Bedingungen und anspruchsvolle Standards schließen einander nicht aus.",
      "Sinnvoll wären frühe Förderung, durchlässigere Bildungswege und spätere irreversible Auswahlentscheidungen. Leistungsbewertung sollte durch qualitative Rückmeldung ergänzt werden.",
      "Ein gerechtes Bildungssystem muss Leistung anerkennen und zugleich systematische Nachteile reduzieren. Die entscheidende Frage ist daher nicht Leistung oder Gleichheit, sondern wie Leistung unter möglichst fairen Bedingungen gemessen wird.",
    ],
  },
  {
    topic: "Wissenschaftskommunikation, Vertrauen und Evidenz",
    grammar: ["reported", "academic", "hedging"],
    models: [
      "Der Studie zufolge besteht ein statistischer Zusammenhang; daraus folgt jedoch noch kein eindeutiger Kausalnachweis.",
      "Die vorliegenden Daten sprechen dafür, dass die Maßnahme wirksam sein könnte, wobei die Übertragbarkeit auf andere Gruppen begrenzt bleibt.",
      "Wissenschaftliches Vertrauen entsteht nicht durch absolute Gewissheit, sondern durch transparente Methoden, überprüfbare Daten und offene Korrektur.",
    ],
    speaking: [
      "Wissenschaftskommunikation muss Unsicherheit erklären, ohne den Eindruck zu erwecken, alle Positionen seien gleich gut belegt. Gerade diese Balance ist für gesellschaftliches Vertrauen zentral.",
      "Eine problematische Annahme ist, Wissenschaft müsse eindeutige und endgültige Antworten liefern. Forschung arbeitet jedoch mit Wahrscheinlichkeiten, vorläufigen Modellen und revidierbaren Ergebnissen.",
      "Kritiker weisen darauf hin, dass häufige Korrekturen Vertrauen schwächen können. Umgekehrt ist gerade die Korrigierbarkeit ein Qualitätsmerkmal wissenschaftlicher Verfahren.",
      "Hilfreich wären transparente Angaben zu Datenlage, Unsicherheit, Interessenkonflikten und Grenzen einer Studie. Medien sollten Befunde nicht stärker formulieren, als die Forschung sie trägt.",
      "Vertrauen lässt sich langfristig eher durch nachvollziehbare Verfahren als durch Autoritätsbehauptungen sichern. Evidenz sollte verständlich erklärt, aber nicht künstlich vereinfacht werden.",
    ],
  },
  {
    topic: "Künstliche Intelligenz und menschliche Autonomie",
    grammar: ["condition", "passive", "hedging"],
    models: [
      "Entscheidungen könnten teilweise automatisiert werden, sofern Verantwortlichkeiten und Einspruchsmöglichkeiten eindeutig geregelt wären.",
      "Je stärker Menschen algorithmischen Empfehlungen folgen, desto wichtiger wird die Frage, ob scheinbare Wahlfreiheit tatsächlich erhalten bleibt.",
      "KI dürfte menschliche Autonomie nicht allein dadurch einschränken, dass sie Empfehlungen erzeugt, sondern vor allem dann, wenn Alternativen unsichtbar oder schwer zugänglich werden.",
    ],
    speaking: [
      "Die Kernfrage lautet nicht, ob KI Entscheidungen unterstützt, sondern wie viel Urteilskraft Menschen an Systeme delegieren und unter welchen Bedingungen sie widersprechen können.",
      "Oft wird angenommen, mehr Daten führten automatisch zu besseren Entscheidungen. Daten spiegeln jedoch frühere Strukturen wider und können Verzerrungen reproduzieren.",
      "Für Automatisierung spricht Effizienz und Konsistenz. Dagegen steht das Risiko, dass Verantwortung diffus wird und Betroffene Entscheidungen kaum nachvollziehen können.",
      "Erforderlich wären Transparenz, menschliche Überprüfung bei folgenreichen Entscheidungen und wirksame Beschwerdewege. Nicht jede automatisierbare Entscheidung sollte vollständig automatisiert werden.",
      "KI kann Autonomie erweitern oder begrenzen. Entscheidend ist daher weniger die Technologie selbst als die institutionelle Gestaltung von Kontrolle, Wahlmöglichkeiten und Verantwortung.",
    ],
  },
  {
    topic: "Algorithmische Öffentlichkeit und soziale Medien",
    grammar: ["consequence", "contrast", "coherence"],
    models: [
      "Während soziale Medien den Zugang zur öffentlichen Debatte erleichtern, strukturieren algorithmische Empfehlungen zugleich, welche Inhalte sichtbar werden.",
      "Aufmerksamkeit wird nach bestimmten Signalen verteilt, wodurch emotional zugespitzte Inhalte einen systematischen Vorteil erhalten können.",
      "Demgegenüber wäre zu prüfen, inwiefern Plattformdesign und Nutzerverhalten gemeinsam zur Polarisierung beitragen.",
    ],
    speaking: [
      "Soziale Medien erweitern Öffentlichkeit, privatisieren aber zugleich einen Teil ihrer Regeln. Plattformen entscheiden technisch mit darüber, welche Stimmen Reichweite erhalten.",
      "Die Annahme, Nutzer sähen lediglich Inhalte, die sie selbst auswählen, ist unvollständig. Empfehlungssysteme ordnen, verstärken und wiederholen Inhalte nach eigenen Optimierungszielen.",
      "Gegen Regulierung spricht die Sorge vor Eingriffen in Meinungsfreiheit. Andererseits betrifft Transparenz über Empfehlungslogiken nicht notwendigerweise die Zulässigkeit einzelner Meinungen.",
      "Sinnvoll wären unabhängige Forschung, Transparenzpflichten und mehr Kontrolle über personalisierte Empfehlungen. Auch Medienkompetenz bleibt wichtig, kann strukturelle Plattformanreize jedoch nicht ersetzen.",
      "Eine demokratische Öffentlichkeit braucht sowohl offene Beteiligung als auch nachvollziehbare Regeln für Reichweite und Moderation. Die Verantwortung liegt daher bei Plattformen, Staat, Medien und Nutzern zugleich.",
    ],
  },
  {
    topic: "Datenschutz, Personalisierung und digitale Bequemlichkeit",
    grammar: ["concessive", "relative", "functional"],
    models: [
      "Die Einwilligung zur Datenverarbeitung steht häufig nur formal zur Verfügung, weil Nutzer kaum überblicken können, auf welcher Grundlage Profile erstellt werden.",
      "Personalisierte Dienste bieten zwar Komfort, setzen jedoch eine Datennutzung voraus, deren langfristige Folgen schwer einzuschätzen sind.",
      "Bei besonders sensiblen Daten sollte eine strengere Abwägung vorgenommen werden, statt Zustimmung als pauschale Legitimation zu behandeln.",
    ],
    speaking: [
      "Die zentrale Spannung besteht zwischen digitalem Komfort und informationeller Selbstbestimmung. Problematisch wird Personalisierung vor allem dann, wenn Nutzer weder Umfang noch Folgen der Datennutzung realistisch einschätzen können.",
      "Viele Modelle setzen voraus, dass Zustimmung eine informierte freie Entscheidung darstellt. Bei langen Bedingungen, Marktmacht und fehlenden Alternativen ist diese Voraussetzung häufig nur eingeschränkt erfüllt.",
      "Unternehmen argumentieren, personalisierte Daten verbesserten Dienste und Finanzierung. Das ist plausibel, rechtfertigt aber nicht automatisch unbegrenzte Datensammlung.",
      "Datensparsame Voreinstellungen, verständliche Optionen und strengere Grenzen für sensible Profile wären sinnvoll. Nutzer sollten Personalisierung ablehnen können, ohne den Grundzugang zu verlieren.",
      "Datenschutz und Bequemlichkeit sind kein absoluter Gegensatz. Gute Regulierung sollte nützliche Personalisierung ermöglichen, gleichzeitig aber Machtasymmetrien und intransparente Datennutzung begrenzen.",
    ],
  },
  {
    topic: "Automatisierung, Arbeit und lebenslanges Lernen",
    grammar: ["consequence", "nominalisation", "condition"],
    models: [
      "Die Automatisierung einzelner Tätigkeiten führt nicht zwangsläufig zum Verschwinden ganzer Berufe, verändert jedoch deren Kompetenzprofile erheblich.",
      "Die kontinuierliche Weiterbildung gewinnt an Bedeutung, sofern technologische Veränderungen schneller verlaufen als traditionelle Ausbildungszyklen.",
      "Eine Verlagerung der Anpassungskosten ausschließlich auf Beschäftigte würde bestehende Ungleichheiten vermutlich verschärfen.",
    ],
    speaking: [
      "Automatisierung ersetzt eher Aufgabenbündel als Berufe vollständig. Für Beschäftigte entsteht deshalb die Herausforderung, Kompetenzen fortlaufend an veränderte Tätigkeitsprofile anzupassen.",
      "Eine verbreitete Annahme lautet, jeder könne sich durch Eigeninitiative problemlos weiterbilden. Zeit, Einkommen, Bildungszugang und betriebliche Unterstützung sind jedoch sehr ungleich verteilt.",
      "Unternehmen betonen Produktivitätsgewinne, während Beschäftigte Arbeitsplatzunsicherheit erleben können. Beide Perspektiven müssen in einer tragfähigen Transformationsstrategie berücksichtigt werden.",
      "Weiterbildung sollte als gemeinsame Verantwortung von Staat, Unternehmen und Beschäftigten organisiert werden. Lernzeit und finanzielle Unterstützung sind dabei ebenso wichtig wie Kursangebote.",
      "Technologischer Wandel muss nicht zu massenhafter Verdrängung führen, kann aber Ungleichheiten verstärken, wenn Anpassungschancen ungleich verteilt sind. Entscheidend ist daher die institutionelle Gestaltung des Übergangs.",
    ],
  },
  {
    topic: "Wohnungskrise, Stadtplanung und soziale Mischung",
    grammar: ["consequence", "relative", "functional"],
    models: [
      "Steigende Boden- und Mietpreise setzen Prozesse in Gang, durch die einkommensschwächere Haushalte aus gut erschlossenen Vierteln verdrängt werden können.",
      "Quartiere, in denen Wohnen, Arbeit, Versorgung und öffentlicher Verkehr räumlich verbunden sind, können Alltagswege verkürzen.",
      "Bei Neubauprojekten sollte nicht nur die Zahl der Wohnungen, sondern auch deren langfristige Bezahlbarkeit in Betracht gezogen werden.",
    ],
    speaking: [
      "Wohnungskrisen entstehen aus einem Zusammenspiel von Angebot, Bodenpreisen, Finanzierung, Regulierung und regionaler Nachfrage. Eine einzelne Ursache erklärt daher selten die gesamte Entwicklung.",
      "Die Annahme, mehr Neubau senke automatisch kurzfristig jede Miete, ist zu einfach. Entscheidend sind Lage, Preissegment, Bodenpolitik und die Geschwindigkeit, mit der Angebot tatsächlich entsteht.",
      "Gegen Mietregulierung wird mit Investitionshemmnissen argumentiert; gegen reine Marktmodelle mit Verdrängung und fehlender Bezahlbarkeit. Beide Risiken sind real und müssen gegeneinander abgewogen werden.",
      "Sinnvoll wäre eine Mischung aus schnellerem Wohnungsbau, sozial gebundenem Bestand, besserer Flächennutzung und Verkehrsanbindung. Stadtplanung sollte soziale Mischung ausdrücklich als Ziel berücksichtigen.",
      "Bezahlbares Wohnen ist nicht nur eine Marktfrage, sondern beeinflusst Teilhabe, Mobilität und soziale Stabilität. Tragfähige Lösungen müssen daher Neubau und Bestandspolitik verbinden.",
    ],
  },
  {
    topic: "Demografischer Wandel, Generationen und Pflege",
    grammar: ["consequence", "condition", "participle"],
    models: [
      "Die langfristig zu erwartende Alterung der Bevölkerung erhöht den Druck auf Pflege, Renten und Arbeitsmarkt.",
      "Das System ließe sich stabilisieren, sofern Produktivität, Erwerbsbeteiligung und Zuwanderung gemeinsam berücksichtigt würden.",
      "Eine ausschließlich zwischen den Generationen geführte Verteilungsdebatte kann verdecken, dass auch innerhalb jeder Altersgruppe erhebliche soziale Unterschiede bestehen.",
    ],
    speaking: [
      "Demografischer Wandel betrifft weit mehr als Renten. Pflege, Wohnformen, Arbeitsmarkt und regionale Infrastruktur müssen sich an eine veränderte Altersstruktur anpassen.",
      "Oft wird implizit angenommen, jüngere und ältere Generationen hätten jeweils homogene Interessen. Tatsächlich unterscheiden sich Einkommen und Lebenslagen innerhalb der Generationen stark.",
      "Eine längere Lebensarbeitszeit kann Finanzierung entlasten, ist aber für körperlich belastende Berufe nicht gleichermaßen realistisch. Pauschale Lösungen würden diese Unterschiede ignorieren.",
      "Erforderlich sind eine Kombination aus Prävention, guter Pflegeinfrastruktur, flexibleren Übergängen in den Ruhestand und einer breiteren Finanzierung. Auch qualifizierte Zuwanderung kann einen Beitrag leisten.",
      "Eine faire Generationenpolitik sollte Belastungen nicht nur nach Alter verteilen, sondern Leistungsfähigkeit und unterschiedliche Berufsbiografien berücksichtigen. Nur dann bleibt der Ausgleich gesellschaftlich legitim.",
    ],
  },
  {
    topic: "Migration, Integration und gesellschaftliche Zugehörigkeit",
    grammar: ["concessive", "relative", "coherence"],
    models: [
      "Integration ist kein einseitiger Anpassungsprozess, sondern entsteht in Institutionen, in denen Zugang, Erwartungen und Teilhabe ausgehandelt werden.",
      "Wenngleich gemeinsame Sprachkenntnisse für viele Lebensbereiche zentral sind, reicht Sprache allein für soziale Zugehörigkeit nicht aus.",
      "Menschen, deren Qualifikationen nicht anerkannt werden, können trotz hoher Kompetenzen langfristig unter ihren Möglichkeiten beschäftigt bleiben.",
    ],
    speaking: [
      "Gesellschaftliche Zugehörigkeit umfasst rechtliche, wirtschaftliche, sprachliche und soziale Dimensionen. Integration ausschließlich an kultureller Anpassung zu messen, wäre daher zu eng.",
      "Eine häufige Annahme lautet, erfolgreiche Integration hänge primär von der Motivation Zugewanderter ab. Institutionelle Hürden, Anerkennung von Abschlüssen und Diskriminierung beeinflussen den Prozess ebenfalls.",
      "Kritiker befürchten, zu viel kulturelle Vielfalt könne gemeinsame Normen schwächen. Andererseits können gemeinsame Regeln bestehen, ohne private Lebensweisen vollständig zu vereinheitlichen.",
      "Wichtig sind früher Spracherwerb, schneller Arbeitsmarktzugang, transparente Anerkennungsverfahren und lokale Begegnungsräume. Erwartungen sollten klar, aber gegenseitig formuliert werden.",
      "Integration gelingt eher als wechselseitiger Prozess mit verbindlichen Regeln und realen Teilhabechancen. Symbolische Zugehörigkeitsdebatten allein lösen praktische Barrieren kaum.",
    ],
  },
  {
    topic: "Gesellschaftlicher Zusammenhalt und Polarisierung",
    grammar: ["argumentation", "hedging", "contrast"],
    models: [
      "Polarisierung dürfte weniger an Meinungsunterschieden an sich liegen als daran, ob politische Gegner als legitime Gesprächspartner anerkannt werden.",
      "Während kontroverse Debatten demokratisch notwendig sind, kann die moralische Abwertung ganzer Gruppen gemeinsame Problemlösung erschweren.",
      "Eine pauschale Forderung nach mehr Einigkeit wäre allerdings ebenso problematisch, weil sie berechtigte Konflikte unsichtbar machen könnte.",
    ],
    speaking: [
      "Zusammenhalt bedeutet nicht Konsens in allen Fragen. Entscheidend ist vielmehr, ob Konflikte innerhalb gemeinsam akzeptierter demokratischer und sozialer Regeln ausgetragen werden.",
      "Die Annahme, starke Meinungsunterschiede seien automatisch Zeichen gesellschaftlichen Zerfalls, greift zu kurz. Offen ausgetragene Konflikte können auch Ausdruck politischer Beteiligung sein.",
      "Appelle an Höflichkeit allein reichen nicht aus, wenn materielle Ungleichheiten oder institutionelles Misstrauen Konflikte antreiben. Umgekehrt rechtfertigen reale Probleme keine pauschale Feindbildbildung.",
      "Lokale Beteiligung, transparente Institutionen und Medienkompetenz können Vertrauen stärken. Besonders wichtig ist, Räume für Streit zu schaffen, ohne persönliche Entmenschlichung zu normalisieren.",
      "Gesellschaftlicher Zusammenhalt zeigt sich gerade im Umgang mit Dissens. Eine robuste Gesellschaft benötigt daher sowohl Konfliktfähigkeit als auch Mindestvertrauen in gemeinsame Verfahren.",
    ],
  },
  {
    topic: "Wirtschaftswachstum, Wohlstand und Gemeinwohl",
    grammar: ["academic", "contrast", "hedging"],
    models: [
      "Wirtschaftswachstum kann materiellen Wohlstand erhöhen, bildet Lebensqualität jedoch nur unvollständig ab.",
      "Demgegenüber wäre zu berücksichtigen, dass stagnierende Volkswirtschaften Verteilungskonflikte verschärfen können, sofern Produktivitätsgewinne ausbleiben.",
      "Ob ein höheres Bruttoinlandsprodukt gesellschaftlichen Fortschritt anzeigt, lässt sich daher nur in Verbindung mit Verteilung, Gesundheit und Umweltbelastung beurteilen.",
    ],
    speaking: [
      "Wachstum ist ein nützlicher, aber begrenzter Indikator. Es sagt wenig darüber aus, wie Einkommen verteilt sind oder welche ökologischen und sozialen Kosten mit Produktion verbunden sind.",
      "Die Annahme, Wachstum und Gemeinwohl seien identisch, ist ebenso problematisch wie die Vorstellung, Wohlstand könne dauerhaft ohne produktive wirtschaftliche Basis gesichert werden.",
      "Wachstumskritiker betonen ökologische Grenzen; Befürworter verweisen auf Innovation und Finanzierung öffentlicher Leistungen. Beide Perspektiven haben berechtigte Punkte.",
      "Politik sollte Wachstum dort fördern, wo es gesellschaftlichen Nutzen schafft, und gleichzeitig Umwelt- und Verteilungsindikatoren stärker berücksichtigen. Die Qualität wirtschaftlicher Aktivität ist zentral.",
      "Eine C2-Position sollte Wachstum weder zum Selbstzweck erklären noch pauschal ablehnen. Entscheidend ist, welche Formen von Wohlstand gesellschaftlich angestrebt und wie ihre Kosten gemessen werden.",
    ],
  },
  {
    topic: "Globalisierung, Lieferketten und wirtschaftliche Resilienz",
    grammar: ["contrast", "consequence", "condition"],
    models: [
      "Während globale Lieferketten Spezialisierung und niedrigere Kosten ermöglichen, können starke Abhängigkeiten die Krisenanfälligkeit erhöhen.",
      "Eine vollständige Rückverlagerung der Produktion wäre weder realistisch noch zwingend effizient, sofern kritische Abhängigkeiten gezielt diversifiziert werden können.",
      "Versorgungsstörungen können sich entlang komplexer Lieferketten fortpflanzen, wodurch lokale Engpässe internationale Auswirkungen entfalten.",
    ],
    speaking: [
      "Globalisierung erhöht Effizienz, schafft aber auch Abhängigkeiten. Resilienz bedeutet daher nicht Autarkie, sondern die Fähigkeit, Schocks durch Diversifizierung und Reserven aufzufangen.",
      "Eine problematische Annahme ist, möglichst kurze Lieferketten seien automatisch sicherer. Regionale Konzentration kann ebenfalls Risiken schaffen, etwa bei Naturkatastrophen oder politischen Krisen.",
      "Für Rückverlagerung sprechen strategische Kontrolle und Versorgungssicherheit; dagegen höhere Kosten und der Verlust internationaler Spezialisierungsvorteile.",
      "Kritische Güter sollten stärker diversifiziert und transparent überwacht werden. Bei weniger sensiblen Produkten kann internationale Arbeitsteilung weiterhin sinnvoll sein.",
      "Wirtschaftliche Resilienz erfordert selektive Absicherung statt vollständiger Entglobalisierung. Entscheidend ist, Abhängigkeiten zu kennen und Alternativen aufzubauen, bevor Krisen eintreten.",
    ],
  },
  {
    topic: "Fachkräftemangel und qualifizierte Zuwanderung",
    grammar: ["consequence", "purpose", "relative"],
    models: [
      "Der Fachkräftemangel lässt sich nicht allein durch Zuwanderung beheben, da auch Ausbildung, Arbeitsbedingungen und Erwerbsbeteiligung entscheidend sind.",
      "Anerkennungsverfahren sollten vereinfacht werden, damit qualifizierte Personen ihre Kompetenzen schneller einsetzen können.",
      "Branchen, in denen Personal dauerhaft fehlt, müssen zugleich prüfen, welche Arbeitsbedingungen die Bindung vorhandener Beschäftigter erschweren.",
    ],
    speaking: [
      "Qualifizierte Zuwanderung kann Engpässe reduzieren, ist aber kein Ersatz für Ausbildung und bessere Arbeitsbedingungen. Fachkräftemangel hat je nach Branche unterschiedliche Ursachen.",
      "Die Annahme, offene Stellen seien ausschließlich Folge einer zu kleinen Erwerbsbevölkerung, greift zu kurz. Löhne, Arbeitszeiten, Anerkennung und regionale Mobilität spielen ebenfalls eine Rolle.",
      "Kritiker warnen vor Brain Drain in Herkunftsländern. Diese Sorge sollte ernst genommen werden, spricht aber eher für faire Rekrutierung und Ausbildungskooperationen als gegen Mobilität generell.",
      "Nötig sind schnelle Anerkennung, verlässliche Einwanderungswege, Sprachförderung und attraktive Arbeitsbedingungen. Gleichzeitig sollte in inländische Aus- und Weiterbildung investiert werden.",
      "Eine nachhaltige Fachkräftestrategie verbindet Zuwanderung mit Qualifizierung und Bindung. Wer nur neue Arbeitskräfte anwirbt, ohne strukturelle Probleme zu beheben, verschiebt das Problem lediglich.",
    ],
  },
  {
    topic: "Konsum, Werbung und Verhaltenssteuerung",
    grammar: ["functional", "hedging", "concessive"],
    models: [
      "Werbung übt nicht zwangsläufig direkten Zwang aus, kann Entscheidungen jedoch durch Auswahlarchitektur und wiederholte Reize systematisch beeinflussen.",
      "Selbst wenn Nutzer formal frei entscheiden, kann die Gestaltung digitaler Plattformen bestimmte Verhaltensweisen wahrscheinlicher machen.",
      "Bei besonders verletzlichen Gruppen wäre eine strengere Regulierung personalisierter Werbung in Betracht zu ziehen.",
    ],
    speaking: [
      "Die Grenze zwischen Information und Verhaltenssteuerung ist besonders bei personalisierter Werbung schwer zu ziehen. Entscheidend ist, wie transparent Einflussmechanismen und wirtschaftliche Interessen sind.",
      "Eine verbreitete Annahme lautet, informierte Konsumenten seien gegenüber Werbung vollständig autonom. Aufmerksamkeit, Gewohnheiten und gezielte Personalisierung können Entscheidungen dennoch beeinflussen.",
      "Ein Werbeverbot könnte wirtschaftliche Modelle einschränken und paternalistisch wirken. Andererseits benötigen Kinder oder hochgradig manipulative Designs besonderen Schutz.",
      "Sinnvoll wären Transparenzpflichten, Grenzen für sensible Profildaten und strengerer Schutz Minderjähriger. Allgemeine Werbung müsste deshalb nicht vollständig untersagt werden.",
      "Verhaltenssteuerung ist graduell, nicht binär. Regulierung sollte daher vor allem dort ansetzen, wo Intransparenz, asymmetrische Information und besondere Verletzlichkeit zusammenkommen.",
    ],
  },
  {
    topic: "Reisen, Tourismus und kulturelle Authentizität",
    grammar: ["concessive", "contrast", "relative"],
    models: [
      "Während Tourismus Einkommen und kulturellen Austausch fördern kann, verändert er zugleich Orte, deren Attraktivität gerade auf lokaler Eigenart beruht.",
      "Wenngleich der Begriff Authentizität problematisch ist, lässt sich beobachten, dass touristische Nachfrage lokale Angebote und Lebenshaltungskosten beeinflusst.",
      "Reiseformen, bei denen lokale Wertschöpfung und Umweltbelastung berücksichtigt werden, dürften langfristig tragfähiger sein.",
    ],
    speaking: [
      "Tourismus kann kulturelle Begegnung ermöglichen, aber auch lokale Räume in konsumierbare Produkte verwandeln. Authentizität ist dabei kein statischer Zustand, sondern wird ständig neu ausgehandelt.",
      "Die Annahme, Touristen zerstörten automatisch lokale Kultur, ist ebenso vereinfachend wie die Vorstellung, Tourismus sei immer ein unverfälschter Austausch. Macht- und Einkommensverhältnisse sind entscheidend.",
      "Beschränkungen können lokale Bewohner schützen, zugleich aber Einkommen gefährden. Deshalb müssen Maßnahmen regional und nach Belastungsgrad differenziert werden.",
      "Besucherlenkung, lokale Abgaben und Förderung regionaler Anbieter können helfen, Nutzen und Kosten gerechter zu verteilen. Umweltfolgen sollten in Preise und Planung einbezogen werden.",
      "Nachhaltiger Tourismus bedeutet nicht, Reisen moralisch abzuwerten, sondern ökologische und soziale Kosten sichtbar zu machen. Gute Politik bewahrt sowohl Zugänglichkeit als auch lokale Lebensqualität.",
    ],
  },
  {
    topic: "Kulturförderung, Kanon und gesellschaftliche Teilhabe",
    grammar: ["argumentation", "concessive", "participle"],
    models: [
      "Die öffentlich finanzierte Kulturförderung wirft die Frage auf, nach welchen Kriterien gesellschaftlich relevante Kunst ausgewählt werden sollte.",
      "Obgleich ein kultureller Kanon Orientierung bieten kann, darf er historisch marginalisierte Perspektiven nicht dauerhaft ausschließen.",
      "Die von Institutionen getroffenen Auswahlentscheidungen prägen mit, welche Werke als repräsentativ wahrgenommen werden.",
    ],
    speaking: [
      "Kulturförderung ist nie vollständig neutral, weil Auswahlentscheidungen Sichtbarkeit und Ressourcen verteilen. Dennoch kann öffentliche Förderung kulturelle Angebote ermöglichen, die rein marktwirtschaftlich kaum bestehen würden.",
      "Die Annahme eines objektiven Kanons ist problematisch. Kanons entstehen historisch und spiegeln institutionelle Macht ebenso wie ästhetische Qualität wider.",
      "Gegen eine Erweiterung wird gelegentlich mit Qualitätsverlust argumentiert. Vielfalt und Qualitätsanspruch schließen sich jedoch nicht aus, sofern transparente Kriterien gelten.",
      "Förderentscheidungen sollten fachliche Qualität, Zugänglichkeit und Vielfalt berücksichtigen und regelmäßig überprüft werden. Gleichzeitig braucht Kunst Freiräume jenseits unmittelbarer gesellschaftlicher Nützlichkeit.",
      "Ein zeitgemäßer Kanon sollte Orientierung bieten, ohne sich als endgültig zu verstehen. Kulturelle Teilhabe wächst, wenn unterschiedliche Erfahrungen sichtbar werden und klassische Werke weiterhin kritisch vermittelt werden.",
    ],
  },
  {
    topic: "Mehrsprachigkeit, Sprachstandards und Sprachwandel",
    grammar: ["contrast", "academic", "relative"],
    models: [
      "Während Standardsprache überregionale Verständlichkeit erleichtert, erfüllen regionale und soziale Varietäten wichtige Identitätsfunktionen.",
      "Sprachwandel, der von manchen als Verfall bewertet wird, lässt sich linguistisch häufig als systematische Anpassung an neue Kommunikationsbedingungen beschreiben.",
      "Normen sind dort besonders relevant, wo institutionelle Verständlichkeit und faire Bewertung gewährleistet werden müssen.",
    ],
    speaking: [
      "Mehrsprachigkeit und Standardsprache verfolgen unterschiedliche Funktionen. Standards sichern Verständlichkeit, während Mehrsprachigkeit kulturelle und kognitive Ressourcen erweitern kann.",
      "Die Vorstellung, Sprachwandel sei grundsätzlich Sprachverfall, beruht häufig auf normativen Erwartungen. Sprachen haben sich historisch ständig verändert.",
      "Zu lockere Standards können Bewertung und institutionelle Kommunikation erschweren; zu starre Normen können reale Sprachvielfalt abwerten. Beide Extreme sind problematisch.",
      "Bildung sollte Standardsprache sicher vermitteln und zugleich Mehrsprachigkeit nicht als Defizit behandeln. Je nach Kontext können unterschiedliche Register gezielt eingeübt werden.",
      "Sprachkompetenz auf C2-Niveau bedeutet gerade, Register flexibel zu beherrschen. Standardisierung und Vielfalt müssen daher nicht gegeneinander ausgespielt werden.",
    ],
  },
  {
    topic: "Journalismus, Desinformation und epistemische Verantwortung",
    grammar: ["reported", "academic", "coherence"],
    models: [
      "Nach Angaben unabhängiger Prüfstellen verbreiten sich falsche Behauptungen besonders schnell, wenn sie an bestehende Überzeugungen anschließen.",
      "Aus der Reichweite einer Meldung lässt sich keineswegs auf ihre Verlässlichkeit schließen; Quelle, Belege und Korrekturpraxis müssen getrennt geprüft werden.",
      "Journalistische Verantwortung besteht nicht darin, jede Behauptung gleichgewichtig abzubilden, sondern ihre Evidenz transparent einzuordnen.",
    ],
    speaking: [
      "Desinformation ist nicht nur ein Problem falscher Inhalte, sondern auch der Vertrauensordnung, in der Menschen Quellen bewerten. Journalismus trägt deshalb epistemische Verantwortung für Einordnung und Korrektur.",
      "Die Annahme, Neutralität bedeute, jeder Position gleich viel Raum zu geben, ist fragwürdig. Wenn Evidenz stark asymmetrisch ist, kann künstliche Ausgewogenheit irreführend sein.",
      "Stärkere Moderation kann Missbrauch begrenzen, birgt aber Risiken für Transparenz und Machtkonzentration. Verfahren müssen deshalb überprüfbar und anfechtbar sein.",
      "Medien sollten Quellen offenlegen, Unsicherheit kennzeichnen und Korrekturen sichtbar machen. Plattformen könnten Reichweitenmechanismen transparenter gestalten, ohne journalistische Inhalte staatlich vorzuschreiben.",
      "Glaubwürdigkeit entsteht durch überprüfbare Verfahren, nicht durch Unfehlbarkeit. Eine informierte Öffentlichkeit braucht deshalb sowohl professionellen Journalismus als auch Kompetenzen zur Quellenkritik.",
    ],
  },
  {
    topic: "Quellenanalyse, Evidenz und Argumentationskritik",
    grammar: ["academic", "reported", "hedging"],
    models: [
      "Die Quelle behauptet einen Zusammenhang, liefert jedoch nur begrenzte Hinweise darauf, dass tatsächlich ein kausaler Mechanismus vorliegt.",
      "Der Befund dürfte relevant sein, seine Aussagekraft bleibt jedoch aufgrund der kleinen und nicht repräsentativen Stichprobe eingeschränkt.",
      "Eine überzeugende Analyse trennt ausdrücklich zwischen dem, was die Quelle belegt, dem, was daraus plausibel folgt, und dem, was offenbleibt.",
    ],
    speaking: [
      "Quellenkritik beginnt mit der Frage, welche Behauptung tatsächlich belegt werden soll. Danach sind Datengrundlage, Methode, Vergleichsgruppe und mögliche Alternativerklärungen zu prüfen.",
      "Ein häufiger Fehlschluss besteht darin, Korrelation als Kausalität zu behandeln oder eine begrenzte Stichprobe auf eine ganze Bevölkerung zu übertragen.",
      "Auch hochwertige Studien haben Grenzen. Kritik bedeutet deshalb nicht, Ergebnisse pauschal abzulehnen, sondern ihre Reichweite präzise zu bestimmen.",
      "Beim Arbeiten mit Quellen sollte jede zentrale Aussage mit Evidenzgrad, Unsicherheit und Gegenbefunden verknüpft werden. So bleibt die eigene Argumentation nachvollziehbar.",
      "C2-Kompetenz zeigt sich darin, Evidenz weder zu überschätzen noch durch übermäßige Skepsis zu entwerten. Entscheidend ist eine abgestufte, methodisch begründete Bewertung.",
    ],
  },
  {
    topic: "Essay schreiben: Synthese, Differenzierung und Stil",
    grammar: ["coherence", "functional", "nominalisation"],
    models: [
      "Eine überzeugende Einleitung grenzt die Fragestellung ein, ohne die gesamte Argumentation bereits vorwegzunehmen.",
      "Die Gegenüberstellung unterschiedlicher Positionen sollte in eine Synthese münden, statt lediglich zwei Listen von Vor- und Nachteilen zu erzeugen.",
      "Durch gezielte Nominalisierung und Funktionsverbgefüge lässt sich ein formeller Stil erreichen, sofern Verständlichkeit und Satzrhythmus erhalten bleiben.",
    ],
    speaking: [
      "Ein C2-Essay benötigt eine klare Leitfrage und eine erkennbare argumentative Bewegung. Die Absätze sollten jeweils eine Funktion für die Gesamtthese erfüllen.",
      "Ein typischer Fehler ist, Komplexität mit langen Sätzen und abstrakten Nomen zu verwechseln. Stilistische Dichte ist nur dann überzeugend, wenn Bezüge eindeutig bleiben.",
      "Gegenargumente sollten nicht als Pflichtabschnitt isoliert werden, sondern die eigene Position tatsächlich prüfen und gegebenenfalls nuancieren.",
      "Vor dem Schreiben lohnt sich eine kurze Struktur aus These, zwei tragenden Argumenten, Gegenperspektive und Synthese. Danach kann die sprachliche Verdichtung erfolgen.",
      "Ein starker C2-Text zeigt Kontrolle: Er differenziert, ohne unentschlossen zu wirken, und formuliert präzise, ohne unnötig kompliziert zu werden.",
    ],
  },
  {
    topic: "Formelle Korrespondenz, Beschwerde und institutionelle Stellungnahme",
    grammar: ["condition", "functional", "coherence"],
    models: [
      "Ich wäre Ihnen dankbar, wenn Sie erläutern könnten, auf welcher Grundlage die Änderung vorgenommen wurde und welche Alternativen geprüft worden sind.",
      "Die derzeitige Regelung führt zu erheblichen Einschränkungen, weshalb ich Sie um eine zeitnahe Überprüfung und einen konkreten Lösungsvorschlag bitte.",
      "Sollte eine vollständige Rücknahme nicht möglich sein, käme aus meiner Sicht eine Übergangsregelung in Betracht.",
    ],
    speaking: [
      "Formelle Korrespondenz auf C2-Niveau verbindet Klarheit mit institutionell angemessenem Ton. Das Problem muss konkret benannt werden, ohne unnötig aggressiv oder vage zu formulieren.",
      "Eine problematische Annahme ist, Höflichkeit bedeute sprachliche Unverbindlichkeit. Gerade in Beschwerden sollten Forderung, Begründung und gewünschte Abhilfe eindeutig sein.",
      "Zu starke Emotionalisierung kann die sachliche Wirkung schwächen; übermäßige Distanz kann hingegen das konkrete Anliegen verschleiern. Registerkontrolle ist daher entscheidend.",
      "Eine gute Struktur lautet: Anlass, nachvollziehbare Einordnung, konkrete Beeinträchtigung, Erwartung, Kompromissoption und Frist oder nächster Schritt.",
      "Die überzeugendste formelle Antwort ist präzise genug, um handlungsfähig zu machen, und zugleich diplomatisch genug, um eine Lösung zu erleichtern.",
    ],
  },
  {
    topic: "Prüfungssimulation: spontane Debatte und schriftliche Synthese",
    grammar: ["argumentation", "academic", "coherence"],
    models: [
      "Eine belastbare Position entsteht, wenn These, Begründung, Beispiel, Gegenargument und Synthese inhaltlich aufeinander aufbauen.",
      "Unter Zeitdruck ist es sinnvoller, wenige Strukturen sicher und funktional einzusetzen, als möglichst viele komplexe Formen mechanisch unterzubringen.",
      "Die abschließende Bewertung sollte erkennen lassen, welche Kriterien für das Urteil ausschlaggebend waren und wo Unsicherheit bestehen bleibt.",
    ],
    speaking: [
      "In der Prüfung sollte die erste Minute dazu dienen, die Kernfrage, zwei Kriterien und eine Gegenperspektive zu identifizieren. So entsteht ein roter Faden statt einer Sammlung spontaner Gedanken.",
      "Ein häufiger Fehler besteht darin, sofort eine starke Position zu formulieren und anschließend nur bestätigende Beispiele zu suchen. Besser ist es, die Gegenposition früh mitzudenken.",
      "Unter Zeitdruck darf Differenzierung nicht zu Unentschlossenheit führen. Eine klare Schlussposition ist möglich, auch wenn Grenzen und Ausnahmen ausdrücklich genannt werden.",
      "Für die schriftliche Aufgabe hilft eine knappe Planung: Einleitung, Argument 1 mit Beispiel, Argument 2, Gegenargument mit Reaktion, Synthese und Schluss. Beim Überarbeiten sollten Bezüge und Verbposition priorisiert werden.",
      "C2-Leistung zeigt sich in kontrollierter Komplexität: präzise Wortwahl, logische Verknüpfung, angemessenes Register und die Fähigkeit, einen Einwand produktiv in die eigene Argumentation einzubauen.",
    ],
  },
];

const slug = (value) => String(value || "")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/[^a-z0-9]+/gi, "-")
  .replace(/^-+|-+$/g, "")
  .toLowerCase();

function makeSlide(lesson, index) {
  const day = index + 1;
  const assignmentId = `C2 ${day}`;
  const topic = lesson.topic;
  const grammarFocusEn = lesson.grammar.map((key) => GRAMMAR[key]);
  const studentQuestionsDe = [
    `Welche grundlegende Spannung oder welches Dilemma steckt hinter „${topic}“?`,
    `Welche Annahme wird in der öffentlichen Debatte über „${topic}“ häufig vorausgesetzt, und wie belastbar ist sie?`,
    `Formuliere die stärkste Gegenposition zu deiner ersten Einschätzung und reagiere darauf.`,
    `Welche konkrete Maßnahme oder institutionelle Lösung wäre sinnvoll, und welchen Zielkonflikt müsste sie berücksichtigen?`,
    `Nimm in 90–120 Sekunden differenziert Stellung zu „${topic}“ und schließe mit einer Synthese.`,
  ];
  const grammarCheckQuestions = [
    `Formuliere differenzierter und vermeide die absolute Aussage: „${topic} ist eindeutig gut oder schlecht.“`,
    `Verdichte die Aussage mit einer heutigen Zielstruktur: „Bei ${topic} gibt es mehrere Ursachen und mehrere Folgen.“`,
    `Formuliere eine Gegenposition und relativiere sie anschließend sprachlich präzise.`,
  ];

  return {
    id: `c2-day-${day}-${slug(topic)}`,
    course: "C2",
    day: `Day ${day}`,
    dayNumber: day,
    assignmentId,
    title: `C2 Day ${day} · ${topic}`,
    topic: `${day} ${topic}`,
    objective: `Students analyse ${topic} at C2 depth, test assumptions and evidence, integrate a credible counterposition, and produce a precise spoken and written synthesis with controlled advanced grammar.`,
    estimatedDuration: "75–90 minutes",
    warmupQuestionsDe: [
      `Welche verbreitete Behauptung hörst du zum Thema „${topic}“?`,
      `Welche zwei Werte oder Interessen geraten bei diesem Thema miteinander in Konflikt?`,
      `Welche Information würdest du benötigen, bevor du eine endgültige Position einnimmst?`,
      `Wie könnte dieselbe Frage aus einer anderen gesellschaftlichen Perspektive bewertet werden?`,
    ],
    keyPhrasesDe: [
      "Die Frage lässt sich nur insofern beantworten, als ...",
      "Dem liegt die Annahme zugrunde, dass ...",
      "Dafür spricht zunächst ..., demgegenüber ist jedoch zu berücksichtigen, dass ...",
      "Aus diesem Befund lässt sich nicht ohne Weiteres ableiten, dass ...",
      "Eine pauschale Bewertung greift zu kurz, zumal ...",
      "Unter der Voraussetzung, dass ..., ließe sich ...",
      "In der Gesamtschau erscheint ... überzeugend, wenngleich ...",
      "Entscheidend ist weniger ..., sondern vielmehr ...",
    ],
    studentQuestionsDe,
    speakingModels: studentQuestionsDe.map((questionDe, answerIndex) => ({
      questionDe,
      modelAnswerDe: lesson.speaking[answerIndex] || "",
    })),
    teacherNotesEn: [
      "Do not reward complexity for its own sake. Require precise reference, explicit criteria and controlled sentence structure.",
      "Push learners to identify one hidden assumption or evidential gap before defending a position.",
      "Every developed answer should contain a credible counterposition and a response, not a token 'on the other hand' sentence.",
      "Distinguish source claims, inference and personal evaluation whenever evidence is discussed.",
      "Finish with a 90–120 second spoken synthesis and a short 220–280 word writing transfer or outline.",
    ],
    interactionFlow: [
      { phase: "Problem framing", detailEn: "7 min: identify the underlying tension, stakeholders and criteria before taking a position." },
      { phase: "Language precision", detailEn: "10 min: reformulate broad claims with the lesson's advanced grammar and calibrated certainty." },
      { phase: "Premise and evidence check", detailEn: "12 min: identify one assumption, one piece of evidence that would matter, and one limitation." },
      { phase: "Counterposition", detailEn: "12 min: build the strongest opposing case and respond without caricaturing it." },
      { phase: "Exam response", detailEn: "15 min: deliver a 90–120 second synthesis with thesis, evidence, counterargument and conclusion." },
      { phase: "Writing transfer", detailEn: "12 min: convert the spoken reasoning into a compact C2 paragraph plan or 220–280 word response." },
    ],
    wrapUpTaskDe: `Formuliere zu „${topic}“ eine Schlussposition in 5–7 Sätzen: These, Kriterium, Beleg oder Beispiel, Gegenargument, Reaktion und Synthese.`,
    workbookConnection: {
      grammarUrl: null,
      workbookUrl: null,
      subtitle: "C2 classroom bridge. Direct Falowen workbook/grammar routes are intentionally omitted until verified.",
      parts: [
        { label: "Teil 1 · Analyse", detailEn: "Identify thesis, assumptions, evidence, limitations and the strongest alternative interpretation." },
        { label: "Teil 2 · Sprechen", detailEn: "Deliver a 90–120 second differentiated response and handle one follow-up challenge without losing the argument thread." },
        { label: "Teil 3 · Schreiben", detailEn: "Write or outline a C2 position that integrates a counterargument and ends in a genuine synthesis." },
        { label: "Teil 4 · Wortschatz / Register", detailEn: "Collect precise collocations, formal paraphrases and register-sensitive alternatives instead of isolated difficult words." },
        { label: "Teil 5 · Grammatik", detailEn: "Apply the lesson's structures to clarify logic, evidence and degree of certainty rather than displaying complexity mechanically." },
      ],
    },
    teacherSupport: {
      lessonOverviewEn: `C2 seminar-style lesson on ${topic}. Move from problem framing to premise/evidence analysis, test the strongest counterposition, then produce an integrated spoken and written synthesis.`,
      grammarFocusEn,
      modelExamplesDe: lesson.models,
      commonMistakesEn: [
        "Using long or nominal sentences without a clear logical relation between the clauses.",
        "Treating a plausible assumption as established evidence or moving from correlation to causation without justification.",
        "Mentioning a counterargument only to dismiss it immediately instead of formulating its strongest version.",
        "Sounding artificially absolute at C2 level; claims should be calibrated when evidence is incomplete.",
        "Using advanced connectors as decoration rather than to mark an actual argumentative relation.",
      ],
    },
    grammarCheckTitle: "C2 Präzisions-Check",
    grammarCheckQuestions,
    grammarCheckModels: grammarCheckQuestions.map((questionDe, modelIndex) => ({
      questionDe,
      modelAnswerDe: lesson.models[modelIndex] || lesson.models[0] || "",
    })),
    grammarCheckMinutes: 10,
  };
}

export const c2PresenterSlides = LESSONS.map(makeSlide);

export const c2CourseEntries = LESSONS.map((lesson, index) => ({
  assignment_id: `C2 ${index + 1}`,
  chapter: String(index + 1),
  de: lesson.topic,
  en: lesson.topic,
}));
