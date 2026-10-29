// Published R2 B1 Day 24 has a different story from the older YouTube
// "Weniger ist mehr". Keep the legacy video in its source file, but never
// mix its question key or timestamps into the new recorded lesson.
export const B1_DAY24_RECORDED_MUSIC = Object.freeze({
  mediaType:'music',level:'B1',day:24,
  title:'Weniger kaufen · Konsum und Nachhaltigkeit',
  introQuestion:'Warum entscheidet sich die Person gegen das neue Handy?',
  musicLibraryUrl:'https://music.falowen.app/?level=B1&day=24',
  readingSections:[
    {label:'Kaufimpuls',lines:[
      'Im Schaufenster sehe ich ein neues Handy.',
      'Meins funktioniert eigentlich noch gut.',
      'Trotzdem möchte ich es sofort kaufen,',
      'weil überall Werbung für das Modell läuft.'
    ]},
    {label:'Weniger konsumieren',lines:[
      'Brauche ich das wirklich heute?',
      'Vielleicht hält das Alte noch lang.',
      'Weniger kaufen lässt Raum für anderes.'
    ]},
    {label:'Der Vorschlag des Bruders',lines:[
      'Zu Hause spreche ich mit meinem Bruder.',
      'Er zeigt mir, wie ich den Akku schonen kann.',
      'Wir beschließen, das Geld lieber zu sparen,',
      'um im Sommer gemeinsam zu verreisen.'
    ]},
    {label:'Die Entscheidung',lines:[
      'Das neue Handy bleibt im Geschäft.',
      'Die Reise ist mir jetzt wichtiger.'
    ]},
  ],
  questions:[
    {prompt:'Warum ist ein neues Handy möglicherweise nicht notwendig?',
      options:['Das vorhandene Handy funktioniert noch gut.','Das Modell gibt es nicht mehr.','Das Geschäft ist geschlossen.'],
      correctIndex:0,answer:'Das vorhandene Handy funktioniert noch gut.',
      evidence:'Meins funktioniert eigentlich noch gut.',
      hint:'Was sagt die Person über ihr altes Handy?',
      explanation:'Ein neuer Kauf ist nicht dringend nötig, weil das alte Gerät noch funktioniert.'},
    {prompt:'Welche Rolle spielt die Werbung?',
      options:['Sie gibt eine Reparaturanleitung.','Sie weckt einen neuen Kaufwunsch.','Sie warnt vor allen Handys.'],
      correctIndex:1,answer:'Sie weckt einen neuen Kaufwunsch.',
      evidence:'weil überall Werbung für das Modell läuft.',
      hint:'Warum möchte die Person plötzlich ein anderes Modell?',
      explanation:'Die Werbung verstärkt einen Wunsch, obwohl der Kauf nicht notwendig ist.'},
    {prompt:'Wie hilft der Bruder?',
      options:['Er bezahlt das neue Handy.','Er gibt das alte Handy zurück.','Er erklärt, wie man den Akku schonen kann.'],
      correctIndex:2,answer:'Er erklärt, wie man den Akku schonen kann.',
      evidence:'Er zeigt mir, wie ich den Akku schonen kann.',
      hint:'Welche praktische Alternative wird angeboten?',
      explanation:'Der Bruder hilft dabei, das vorhandene Gerät länger zu nutzen.'},
    {prompt:'Wofür wollen sie das Geld sparen?',
      options:['Für eine gemeinsame Sommerreise.','Für zwei neue Handys.','Für einen zweiten Akku.'],
      correctIndex:0,answer:'Für eine gemeinsame Sommerreise.',
      evidence:'um im Sommer gemeinsam zu verreisen.',
      hint:'Achte auf die Konstruktion „um … zu“.',
      explanation:'Das gemeinsame Erlebnis wird wichtiger als der spontane Kauf.'},
    {prompt:'Was wird am Ende entschieden?',
      options:['Das neue Handy wird bestellt.','Das neue Handy bleibt im Geschäft.','Die Reise wird abgesagt.'],
      correctIndex:1,answer:'Das neue Handy bleibt im Geschäft.',
      evidence:'Das neue Handy bleibt im Geschäft.',
      hint:'Was passiert mit dem Handy im Schaufenster?',
      explanation:'Die Person entscheidet sich gegen den Neukauf und für die Reise.'},
  ],
});
