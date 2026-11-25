import { SWAHILI_MUSIC_TRACKS } from "./swahiliMusicTracks.js";

// Calendar, time and daily routines: adapted from Dr. Ruth’s recommended A1 sequence and the published Campus workbooks.
export const SWAHILI_DAY_TWELVE_ADMIN_LESSON = Object.freeze({
  "id": "swahili-day-12",
  "course": "SWAHILI",
  "language": "Kiswahili",
  "day": "Day 12",
  "dayNumber": 12,
  "title": "Somo la 12 · Siku, Miezi na Tarehe",
  "topic": "Siku, Miezi na Tarehe",
  "objective": "Name weekdays and months, ask and answer about dates, birthdays and appointments.",
  "stages": [
    {
      "id": "intro",
      "type": "intro",
      "kicker": "Utangulizi · Introduction",
      "title": "Somo la 12 · Siku, Miezi na Tarehe",
      "heading": "Siku · Miezi · Tarehe",
      "content": "Taja siku na miezi.\nUliza na jibu kuhusu tarehe.\nZungumza kuhusu siku ya kuzaliwa na miadi.",
      "english": "Name weekdays and months, ask and answer about dates, birthdays and appointments.",
      "notes": "Start by revising numbers and ask learners to point at a date on a calendar."
    },
    {
      "id": "ai-video",
      "type": "teacher-lecture",
      "kicker": "Video ya somo · AI",
      "title": "Video ya AI · Siku, Miezi na Tarehe",
      "videoId": "xYwrJxRhVn8",
      "content": "Tazama video ya somo kuhusu siku, miezi na tarehe.",
      "english": "Watch the Day 12 AI lesson about days, months and dates."
    },
    {
      "id": "grammar",
      "type": "grammar",
      "kicker": "Sarufi · Grammar",
      "title": "Siku, miezi, tarehe na maneno ya wakati",
      "details": [
        {
          "title": "Siku za wiki · Days of the week",
          "rule": "Taja siku za wiki kwa mpangilio.",
          "body": "Jumamosi · Jumapili · Jumatatu\nJumanne · Jumatano · Alhamisi · Ijumaa",
          "english": "Saturday · Sunday · Monday · Tuesday · Wednesday · Thursday · Friday",
          "question": "1. Baada ya Jumatatu ni siku gani?\n2. Kabla ya Ijumaa ni siku gani?\n3. Baada ya Jumamosi ni siku gani?",
          "answer": "1. Jumanne.\n2. Alhamisi.\n3. Jumapili."
        },
        {
          "title": "Miezi ya mwaka · January–June",
          "rule": "Taja jina la mwezi au tumia mwezi wa + nambari.",
          "body": "Januari · mwezi wa kwanza\nFebruari · mwezi wa pili\nMachi · mwezi wa tatu\nAprili · mwezi wa nne\nMei · mwezi wa tano\nJuni · mwezi wa sita",
          "english": "January · February · March · April · May · June",
          "question": "1. Mwezi wa tatu ni mwezi gani?\n2. Mwezi wa kwanza ni upi?\n3. Mei ni mwezi wa ngapi?",
          "answer": "1. Machi.\n2. Januari.\n3. Mwezi wa tano."
        },
        {
          "title": "Miezi ya mwaka · July–December",
          "rule": "Tumia mwezi wa + nambari.",
          "body": "Julai · mwezi wa saba\nAgosti · mwezi wa nane\nSeptemba · mwezi wa tisa\nOktoba · mwezi wa kumi\nNovemba · mwezi wa kumi na moja\nDesemba · mwezi wa kumi na mbili",
          "english": "July · August · September · October · November · December",
          "question": "1. Mwezi wa kumi na mbili ni mwezi gani?\n2. Agosti ni mwezi wa ngapi?\n3. Baada ya Oktoba ni mwezi gani?",
          "answer": "1. Desemba.\n2. Mwezi wa nane.\n3. Novemba."
        },
        {
          "title": "Kalenda · Calendar",
          "rule": "Tarehe + nambari + mwezi + mwaka (ikihitajika).",
          "body": "Leo ni tarehe tano Machi.\nTarehe ishirini na moja Julai.\nTarehe 5/10/1997: tarehe tano Oktoba mwaka elfu moja mia tisa tisini na saba.",
          "english": "Today is 5 March. · 21 July. · 5 October 1997.",
          "question": "1. Sema 10 Mei kwa Kiswahili.\n2. Sema 15 Juni kwa Kiswahili.\n3. Andika tarehe saba Agosti kwa nambari.",
          "answer": "1. Tarehe kumi Mei.\n2. Tarehe kumi na tano Juni.\n3. 7/8."
        },
        {
          "title": "Marejeo ya siku · Referring to days",
          "rule": "Juzi → jana → leo → kesho → keshokutwa.",
          "body": "Juzi · Jana · Leo · Kesho · Keshokutwa\nJana ilikuwa Jumapili.\nLeo ni Jumatatu.\nKesho ni Jumanne.",
          "english": "The day before yesterday · yesterday · today · tomorrow · the day after tomorrow.",
          "question": "1. Leo ni Jumatatu. Keshokutwa ni siku gani?\n2. Leo ni Jumatatu. Jana ilikuwa siku gani?\n3. Juzi ilikuwa siku gani?",
          "answer": "1. Jumatano.\n2. Jumapili.\n3. Jumamosi."
        },
        {
          "title": "Siku ya kuzaliwa na miadi · Birthdays and appointments",
          "rule": "Ulizaliwa lini? Miadi yako ni lini?",
          "body": "Ulizaliwa lini?\nNilizaliwa tarehe kumi Mei.\nMiadi yetu ni tarehe tano Juni.",
          "english": "When were you born? · I was born on 10 May. · Our appointment is on 5 June.",
          "question": "1. Ulizaliwa lini? Toa jibu lako.\n2. Miadi yako ni lini? (5 Juni)\n3. Siku yako ya kuzaliwa ni lini? (8 Julai)",
          "answer": "1. Mfano: Nilizaliwa tarehe kumi Mei.\n2. Miadi yangu ni tarehe tano Juni.\n3. Siku yangu ya kuzaliwa ni tarehe nane Julai."
        }
      ],
      "notes": "Show one rule at a time, ask learners to try the question before revealing the answer."
    },
    {
      "id": "vocabulary",
      "type": "reading",
      "kicker": "Msamiati · Vocabulary",
      "title": "Kalenda yangu",
      "content": "siku · day\nwiki · week\nmwezi · month\nmwaka · year\ntarehe · date\nmiadi · appointment\nsiku ya kuzaliwa · birthday\nsikukuu · public holiday",
      "english": "Read aloud and practise in pairs.",
      "prompt": "Unasemaje ‘birthday’ kwa Kiswahili?",
      "answer": "Siku ya kuzaliwa."
    },
    {
      "id": "music",
      "type": "music",
      "kicker": "Muziki · Music",
      "title": "Angalia Kalenda",
      "audio": SWAHILI_MUSIC_TRACKS.find(track => track.id === "swahili-a1-day-12"),
      "questions": [
        { "prompt": "Wiki ina siku ngapi?", "answer": "Wiki ina siku saba." },
        { "prompt": "Mwaka una miezi mingapi?", "answer": "Mwaka una miezi kumi na miwili." },
        { "prompt": "Mei ni mwezi wa ngapi?", "answer": "Mei ni mwezi wa tano." },
        { "prompt": "Miadi ni lini?", "answer": "Miadi ni Alhamisi, tarehe ishirini Agosti." }
      ]
    },
    {
      "id": "radio",
      "type": "radio-questions",
      "kicker": "Kusikiliza · Falowen Radio",
      "title": "Falowen Radio · Siku, Miezi na Tarehe",
      "radioVideoId": "QdpRliUlbMA",
      "content": "Sikiliza kipindi cha Falowen Radio kuhusu siku, miezi na tarehe.",
      "radioActivities": [
        {
          "title": "Kazi ya Mtu Binafsi",
          "english": "Individual Work",
          "activities": [
            {
              "title": "Sikiliza na ukamilishe taarifa hizi.",
              "english": "Listen and complete the information.",
              "prompts": [
                "Wiki ina siku ________.",
                "Mwaka una miezi ________.",
                "Mei ni mwezi wa ________.",
                "Novemba ni mwezi wa ________."
              ],
              "answer": "Wiki ina siku saba.\nMwaka una miezi kumi na miwili.\nMei ni mwezi wa tano.\nNovemba ni mwezi wa kumi na moja."
            },
            {
              "title": "Fikiria na ujibu.",
              "english": "Think and answer.",
              "intro": "Leo ni Jumatano, tarehe kumi mwezi wa Julai.",
              "prompts": [
                "Jana ilikuwa siku gani?",
                "Kesho ni siku gani?",
                "Kesho kutwa ni siku gani?",
                "Kesho ni tarehe ngapi?"
              ],
              "answer": "Jana ilikuwa Jumanne.\nKesho ni Alhamisi.\nKesho kutwa ni Ijumaa.\nKesho ni tarehe kumi na moja mwezi wa Julai."
            }
          ]
        },
        {
          "title": "Kazi ya Jozi",
          "english": "Pair Work",
          "activities": [
            {
              "title": "Ulizaneni kuhusu siku muhimu.",
              "english": "Interview your partner about important dates.",
              "intro": "Mwanafunzi A aulize. Mwanafunzi B ajibu kwa sentensi kamili. Kisha badilishaneni nafasi.",
              "prompts": [
                "Leo ni siku gani?",
                "Siku yako ya kuzaliwa ni lini?",
                "Una miadi lini?",
                "Tarehe ngapi?",
                "Mwezi gani?"
              ],
              "answer": "A: Leo ni siku gani?\nB: Leo ni Jumatano.\n\nA: Siku yako ya kuzaliwa ni lini?\nB: Siku yangu ya kuzaliwa ni tarehe kumi mwezi wa Juni.\n\nA: Una miadi lini?\nB: Nina miadi Alhamisi.\n\nA: Tarehe ngapi?\nB: Tarehe ishirini.\n\nA: Mwezi gani?\nB: Mwezi wa Agosti."
            },
            {
              "title": "Panga siku kwa mpangilio sahihi.",
              "english": "Arrange the time words in the correct order.",
              "intro": "Pangeni maneno haya: Kesho · Jana · Kesho kutwa · Leo · Juzi. Baada ya kupanga maneno, tungieni sentensi kwa kutumia kila neno.",
              "answer": "Juzi → Jana → Leo → Kesho → Kesho kutwa\n\nJuzi ilikuwa Jumatatu.\nJana ilikuwa Jumanne.\nLeo ni Jumatano.\nKesho ni Alhamisi.\nKesho kutwa ni Ijumaa."
            }
          ]
        },
        {
          "title": "Kazi ya Kikundi",
          "english": "Group Work",
          "activities": [
            {
              "title": "Tengenezeni kalenda ya shughuli za kikundi.",
              "english": "Create a group activity calendar.",
              "intro": "Chagueni shughuli tano. Kwa kila shughuli, andikeni jina la shughuli, siku, tarehe na mwezi. Baada ya hapo, kila kikundi kiwasilishe kalenda yake darasani.",
              "example": [
                "Somo la Kiswahili",
                "Jumatatu",
                "tano",
                "Mei"
              ],
              "answer": "Tuna somo la Kiswahili Jumatatu, tarehe tano mwezi wa Mei. Tuna mkutano Jumatano, tarehe saba mwezi wa Mei. Tuna mchezo Ijumaa, tarehe tisa mwezi wa Mei. Tuna sherehe Jumamosi, tarehe kumi mwezi wa Mei. Tuna miadi Jumatatu, tarehe kumi na mbili mwezi wa Mei."
            }
          ]
        }
      ]
    },
    {
      "id": "listening",
      "type": "teacher-listening",
      "kicker": "Kusikiliza · Recorded listening",
      "title": "Sikiliza siku, tarehe, mwezi na mwaka",
      "content": "Sikiliza mazungumzo mara mbili.\n1. B anajibu nini baada ya salamu?\n2. Leo ni siku gani ya juma?\n3. Tarehe ya leo ni ngapi?\n4. Mwezi huu ni upi?\n5. Mwaka gani sasa hivi?",
      "english": "Open the related Campus listening exercise to play the recording twice. Answer the five questions.",
      "prompt": "B anajibu nini baada ya salamu?",
      "answer": "Habari nzuri sana.",
      "notes": "Play the linked Campus recording before showing the dialogue. Transcript:\nA: Jambo, habari za asubuhi?\nB: Jambo, habari nzuri sana.\nA: Leo ni siku gani ya juma?\nB: Leo ni Jumatatu.\nA: Je, tarehe ya leo ni ngapi?\nB: Leo ni tarehe kumi na mbili.\nA: Mwezi huu ni upi?\nB: Mwezi huu ni Machi.\nA: Mwaka gani sasa hivi?\nB: Mwaka ni elfu mbili na ishirini na nne.\nA: Asante sana kwa habari hii.\nB: Karibu sana rafiki yangu.\n\nTutor references:\n1. B anajibu nini baada ya salamu?\nHabari nzuri sana.\n2. Leo ni siku gani ya juma?\nJumatatu.\n3. Tarehe ya leo ni ngapi?\nTarehe kumi na mbili.\n4. Mwezi huu ni upi?\nMachi.\n5. Mwaka gani sasa hivi?\nElfu mbili na ishirini na nne.",
      "listeningWorkbookUrl": "https://www.falowen.app/campus/course/swahili/day-12?view=hoeren"
    },
    {
      "id": "reading",
      "type": "reading-text",
      "kicker": "Kusoma · Reading",
      "title": "Kalenda ya Amina",
      "content": "Leo ni Jumatatu, tarehe tano Machi. Amina anaenda shuleni. Kesho ni Jumanne, tarehe sita Machi. Ana miadi na mwalimu wake. Siku yake ya kuzaliwa ni tarehe kumi Mei. Jana ilikuwa Jumapili. Amina alikuwa nyumbani na familia yake.",
      "english": "Read and answer the comprehension questions in Campus.",
      "prompt": "Leo ni siku gani?",
      "answer": "Jumatatu",
      "notes": "1. Leo ni siku gani?\nJumatatu\n2. Leo ni tarehe ngapi?\nTarehe tano Machi\n3. Amina ana miadi na nani?\nMwalimu wake\n4. Siku ya kuzaliwa ya Amina ni lini?\nTarehe kumi Mei\n5. Jana ilikuwa siku gani?\nJumapili",
      "listeningWorkbookUrl": "https://www.falowen.app/campus/course/swahili/day-12?view=lesen"
    },
    {
      "id": "dialogue",
      "type": "dialogue",
      "kicker": "Kuzungumza · Model dialogue",
      "title": "Mazungumzo · Siku na tarehe",
      "content": "A: Jambo, habari za asubuhi?\nB: Jambo, habari nzuri sana.\nA: Leo ni siku gani ya juma?\nB: Leo ni Jumatatu.\nA: Je, tarehe ya leo ni ngapi?\nB: Leo ni tarehe kumi na mbili.\nA: Mwezi huu ni upi?\nB: Mwezi huu ni Machi.\nA: Mwaka gani sasa hivi?\nB: Mwaka ni elfu mbili na ishirini na nne.\nA: Asante sana kwa habari hii.\nB: Karibu sana rafiki yangu.",
      "english": "Read in pairs and switch roles. Change the details and repeat.",
      "prompt": "Tarehe ya leo ni ngapi?",
      "answer": "Tarehe kumi na mbili."
    },
    {
      "id": "scenario",
      "type": "scenario",
      "kicker": "Kuzungumza · Scenario",
      "title": "Panga miadi",
      "content": "Uliza siku na tarehe.\nUliza siku ya kuzaliwa ya mwenzako.\nPanga tarehe ya miadi.\nBadilisha majukumu.",
      "english": "Record a short audiovisual calendar introduction: say today’s date, tomorrow’s day and your birthday or an imaginary birthday.",
      "prompt": "Unaulizaje tarehe ya leo?",
      "answer": "Leo ni tarehe ngapi?"
    },
    {
      "id": "writing",
      "type": "writing",
      "kicker": "Kuandika · Writing",
      "title": "Kuandika · Kalenda yangu",
      "content": "State today's day and date.\nSay yesterday's and tomorrow's days.\nState a birthday and an appointment date.",
      "english": "Write 5–7 short Kiswahili sentences about a calendar: today's day and date, yesterday, tomorrow, your birthday and an appointment. You may use imaginary dates.",
      "prompt": "Onyesha mfano.",
      "answer": "Mfano: Leo ni Jumatatu, tarehe tano Machi. Jana ilikuwa Jumapili. Kesho ni Jumanne. Siku yangu ya kuzaliwa ni tarehe kumi Mei. Miadi yangu ni tarehe sita Machi. Kubali tarehe halisi au za kufikirika zinazolingana na siku zilizotajwa.",
      "listeningWorkbookUrl": "https://www.falowen.app/campus/course/swahili/day-12?view=schreiben"
    },
    {
      "id": "presentation",
      "type": "presentation",
      "kicker": "Uwasilishaji · Class presentation",
      "title": "Kalenda yangu",
      "content": "Taja siku na tarehe ya leo.\nTaja siku ya jana na kesho.\nTaja siku yako ya kuzaliwa.\nPendekeza tarehe ya miadi.",
      "english": "Give a short oral or audiovisual calendar introduction.",
      "notes": "The separate A1 mock assessment has not yet been supplied.",
      "listeningWorkbookUrl": "https://www.falowen.app/campus/course/swahili/day-12?view=submit"
    }
  ]
});

export const SWAHILI_DAY_THIRTEEN_ADMIN_LESSON = Object.freeze({
  "id": "swahili-day-13",
  "course": "SWAHILI",
  "language": "Kiswahili",
  "day": "Day 13",
  "dayNumber": 13,
  "title": "Somo la 13 · Kutaja Saa na Shughuli za Kila Siku",
  "topic": "Kutaja Saa na Shughuli za Kila Siku",
  "objective": "Tell time in Kiswahili and describe daily routines using present and habitual forms.",
  "stages": [
    {
      "id": "intro",
      "type": "intro",
      "kicker": "Utangulizi · Introduction",
      "title": "Somo la 13 · Kutaja Saa na Shughuli za Kila Siku",
      "heading": "Saa · Mazoea · Siku Yangu",
      "content": "Soma saa kwa Kiswahili.\nEleza shughuli za kila siku.\nTumia -na-, hu- na maneno ya mpangilio.",
      "english": "Tell time in Kiswahili and describe daily routines using present and habitual forms.",
      "notes": "Start with weekday revision and ask students what time they woke up."
    },
    {
      "id": "ai-video",
      "type": "media-pending",
      "kicker": "Video ya somo · AI",
      "title": "Video ya AI · Kutaja Saa na Shughuli za Kila Siku",
      "content": "Video ya somo itaongezwa baadaye.",
      "english": "The lesson video is pending. Continue with the classroom activities.",
      "status": "pending-media"
    },
    {
      "id": "grammar",
      "type": "grammar",
      "kicker": "Sarufi · Grammar",
      "title": "Saa, wakati uliopo -na-, wakati wa mazoea hu- na mpangilio",
      "details": [
        {
          "title": "Kutaja saa · The Swahili clock",
          "rule": "Hesabu saa kuanzia saa 6:00 asubuhi au jioni kwa mfumo wa kawaida.",
          "body": "Saa kumi na mbili asubuhi = 6:00 AM\nSaa moja asubuhi = 7:00 AM\nSaa mbili asubuhi = 8:00 AM\nSaa sita mchana = 12:00 PM",
          "english": "Count from 6 a.m. and 6 p.m., not midnight and noon.",
          "question": "1. Saa tatu asubuhi ni saa ngapi kwa mfumo wa kawaida?\n2. Saa mbili asubuhi ni saa ngapi kwa mfumo wa kawaida?\n3. Sema 10:00 AM kwa Kiswahili.",
          "answer": "1. 9:00 AM.\n2. 8:00 AM.\n3. Saa nne asubuhi."
        },
        {
          "title": "Saa za mchana na usiku · Afternoon and night",
          "rule": "Taja sehemu ya siku: asubuhi, mchana, alasiri, jioni au usiku.",
          "body": "Saa tisa alasiri = 3:00 PM\nSaa kumi na mbili jioni = 6:00 PM\nSaa moja usiku = 7:00 PM\nSaa sita usiku = 12:00 AM",
          "english": "Afternoon · evening · night · midnight",
          "question": "1. Saa nne usiku ni saa ngapi?\n2. Sema 8:00 PM kwa Kiswahili.\n3. Saa sita mchana ni saa ngapi?",
          "answer": "1. 10:00 PM.\n2. Saa mbili usiku.\n3. 12:00 PM."
        },
        {
          "title": "Dakika · Minutes",
          "rule": "Tumia na robo, na nusu, kasoro robo au na dakika.",
          "body": "Saa nane na robo mchana = 2:15 PM\nSaa tisa na nusu alasiri = 3:30 PM\nSaa kumi na moja kasoro robo jioni = 4:45 PM\nSaa tatu na dakika kumi na mbili asubuhi = 9:12 AM",
          "english": "Quarter past · half past · quarter to · minutes past",
          "question": "1. Unasemaje 3:30 PM kwa Kiswahili?\n2. Sema 2:15 PM kwa Kiswahili.\n3. Sema 4:45 PM kwa Kiswahili.",
          "answer": "1. Saa tisa na nusu alasiri.\n2. Saa nane na robo mchana.\n3. Saa kumi na moja kasoro robo jioni."
        },
        {
          "title": "Wakati uliopo · Present -na-",
          "rule": "Kiambishi cha nafsi + -na- + kitenzi. Mfano: ninakula, ninakunywa.",
          "body": "Mimi: ni-na-amka → ninaamka\nWewe: u-na-oga → unaoga\nYeye: a-na-soma → anasoma\nSisi: tu-na-fanya kazi → tunafanya kazi\nNyinyi: m-na-kula → mnakula\nWao: wa-na-rudi → wanarudi",
          "english": "I · you · he/she · we · you (plural) · they",
          "question": "1. Jaza pengo: Sisi __nafanya kazi.\n2. Jaza pengo: Mimi __nasoma.\n3. Jaza pengo: Wao __narudi.",
          "answer": "1. tu- → tunafanya kazi.\n2. ni- → ninasoma.\n3. wa- → wanarudi."
        },
        {
          "title": "Wakati wa mazoea · Habitual hu-",
          "rule": "hu- + mzizi wa kitenzi. Mfano: hula, hunywa. Taja nafsi inapohitajika.",
          "body": "Mimi huamka kila siku.\nYeye hula kifungua kinywa.\nSisi husoma kila siku.\nWewe hunywa chai.",
          "english": "I usually wake up. · He/she usually eats breakfast. · We usually study. · You usually drink tea.",
          "question": "1. Badili: Yeye anakula kila siku. Tumia hu-.\n2. Badili: Mimi ninaamka kila siku. Tumia hu-.\n3. Badili: Sisi tunakunywa chai kila siku.",
          "answer": "1. Yeye hula kila siku.\n2. Mimi huamka kila siku.\n3. Sisi hunywa chai kila siku."
        },
        {
          "title": "Mpangilio · Sequencing",
          "rule": "Tumia kwanza, halafu, kisha na mwishowe.",
          "body": "Kwanza, ninaamka.\nHalafu, ninaoga.\nKisha, ninakwenda kazini.\nMwishowe, ninalala.",
          "english": "First · then · after that · finally",
          "question": "1. Ni neno gani linaonyesha tendo la mwisho?\n2. Jaza pengo: __, ninaamka. Halafu, ninaoga.\n3. Kamilisha: Kwanza ninaamka. __, ninaoga.",
          "answer": "1. Mwishowe.\n2. Kwanza.\n3. Halafu au kisha."
        }
      ],
      "notes": "Show one rule at a time, ask learners to try the question before revealing the answer."
    },
    {
      "id": "vocabulary",
      "type": "reading",
      "kicker": "Msamiati · Vocabulary",
      "title": "Shughuli za kila siku",
      "content": "kuamka · wake up\nkupiga mswaki · brush teeth\nkuoga · bathe\nkuvaa nguo · get dressed\nkula kifungua kinywa · eat breakfast\nkwenda kazini · go to work\nkurudi nyumbani · return home\nkulala · sleep",
      "english": "Read aloud and practise in pairs.",
      "prompt": "Unasemaje ‘to brush teeth’ kwa Kiswahili?",
      "answer": "Kupiga mswaki."
    },
    {
      "id": "music",
      "type": "media-pending",
      "kicker": "Muziki · Music",
      "title": "Muziki · Kutaja Saa na Shughuli za Kila Siku",
      "content": "Wimbo utaongezwa baadaye.",
      "english": "Song, lyrics and song-specific questions will be connected when supplied.",
      "status": "pending-media"
    },
    {
      "id": "radio",
      "type": "media-pending",
      "kicker": "Kusikiliza · Falowen Radio",
      "title": "Falowen Radio · Kutaja Saa na Shughuli za Kila Siku",
      "content": "Kipindi cha Falowen Radio kitaongezwa baadaye.",
      "english": "Podcast and episode-specific activities will be connected when supplied.",
      "status": "pending-media"
    },
    {
      "id": "listening",
      "type": "teacher-listening",
      "kicker": "Kusikiliza · Recorded listening",
      "title": "Sikiliza ratiba ya kazi",
      "content": "Sikiliza mazungumzo mara mbili.\n1. Saa ngapi sasa?\n2. B anafanya kazi gani?\n3. B anaanza kazi saa ngapi?\n4. B anamaliza kazi saa ngapi?\n5. B anafika nyumbani saa ngapi?",
      "english": "Open the related Campus listening exercise to play the recording twice. Answer the five questions.",
      "prompt": "Saa ngapi sasa?",
      "answer": "Saa tatu asubuhi.",
      "notes": "Play the linked Campus recording before showing the dialogue. Transcript:\nA: Hujambo jirani.\nB: Sijambo hujambo.\nA: Saa ngapi sasa?\nB: Saa tatu asubuhi.\nA: Unakwenda wapi sasa hivi?\nB: Ninakwenda kazini mjini.\nA: Unafanya kazi gani?\nB: Mimi ni mwalimu wa shule.\nA: Unaanza kazi saa ngapi?\nB: Ninaanza saa nne kamili.\nA: Unamaliza kazi saa ngapi?\nB: Ninamaliza saa kumi jioni.\nA: Unarudi nyumbani saa ngapi?\nB: Ninafika nyumbani saa kumi na moja.\nA: Unafanya nini usiku?\nB: Ninapika chakula na kulala.\nA: Safari njema kazini leo.\nB: Asante sana kwaheri.\n\nTutor references:\n1. Saa ngapi sasa?\nSaa tatu asubuhi.\n2. B anafanya kazi gani?\nNi mwalimu wa shule.\n3. B anaanza kazi saa ngapi?\nSaa nne kamili.\n4. B anamaliza kazi saa ngapi?\nSaa kumi jioni.\n5. B anafika nyumbani saa ngapi?\nSaa kumi na moja.",
      "listeningWorkbookUrl": "https://www.falowen.app/campus/course/swahili/day-13?view=hoeren"
    },
    {
      "id": "reading",
      "type": "reading-text",
      "kicker": "Kusoma · Reading",
      "title": "Siku ya Asha",
      "content": "Asha huamka saa kumi na mbili asubuhi. Kwanza, huoga na kupiga mswaki. Halafu, hula kifungua kinywa saa moja asubuhi. Anaenda shuleni saa mbili asubuhi. Hula chakula cha mchana saa sita mchana. Kisha, hurudi nyumbani saa kumi jioni. Mwishowe, hulala saa nne usiku.",
      "english": "Read and answer the comprehension questions in Campus.",
      "prompt": "Asha huamka saa ngapi?",
      "answer": "Saa kumi na mbili asubuhi",
      "notes": "1. Asha huamka saa ngapi?\nSaa kumi na mbili asubuhi\n2. Asha hufanya nini kwanza?\nHuoga na kupiga mswaki\n3. Asha anaenda shuleni saa ngapi?\nSaa mbili asubuhi\n4. Asha hula chakula cha mchana saa ngapi?\nSaa sita mchana\n5. Asha hulala saa ngapi?\nSaa nne usiku",
      "listeningWorkbookUrl": "https://www.falowen.app/campus/course/swahili/day-13?view=lesen"
    },
    {
      "id": "dialogue",
      "type": "dialogue",
      "kicker": "Kuzungumza · Model dialogue",
      "title": "Mazungumzo · Saa na kazi",
      "content": "A: Hujambo jirani.\nB: Sijambo hujambo.\nA: Saa ngapi sasa?\nB: Saa tatu asubuhi.\nA: Unakwenda wapi sasa hivi?\nB: Ninakwenda kazini mjini.\nA: Unafanya kazi gani?\nB: Mimi ni mwalimu wa shule.\nA: Unaanza kazi saa ngapi?\nB: Ninaanza saa nne kamili.\nA: Unamaliza kazi saa ngapi?\nB: Ninamaliza saa kumi jioni.\nA: Unarudi nyumbani saa ngapi?\nB: Ninafika nyumbani saa kumi na moja.\nA: Unafanya nini usiku?\nB: Ninapika chakula na kulala.\nA: Safari njema kazini leo.\nB: Asante sana kwaheri.",
      "english": "Read in pairs and switch roles. Change the details and repeat.",
      "prompt": "B anaanza kazi saa ngapi?",
      "answer": "Saa nne kamili."
    },
    {
      "id": "scenario",
      "type": "scenario",
      "kicker": "Kuzungumza · Scenario",
      "title": "Siku Yangu · Student exchange",
      "content": "Uliza mwenzako anaamka saa ngapi.\nUliza kuhusu chakula cha mchana, kazi au shule na jioni.\nEleza ratiba yako kwa kutumia saa nne.\nTumia kwanza, halafu, kisha na mwishowe.",
      "english": "Student exchange scenario: tell a Tanzanian partner about your usual weekday, using times and sequencing words.",
      "prompt": "Unaulizaje wakati wa kuamka?",
      "answer": "Unaamka saa ngapi?"
    },
    {
      "id": "writing",
      "type": "writing",
      "kicker": "Kuandika · Writing",
      "title": "Kuandika · Siku Yangu",
      "content": "Say when you wake up.\nDescribe breakfast, school or work, and lunch.\nExplain what you do in the evening and when you sleep.\nUse kwanza, halafu, kisha and mwishowe.",
      "english": "Andika kuhusu siku yako. Write 6–8 short sentences about your usual day with at least four Swahili clock times and sequencing words.",
      "prompt": "Onyesha mfano.",
      "answer": "Mfano: Mimi huamka saa kumi na mbili asubuhi. Kwanza, ninaoga na kupiga mswaki. Halafu, hula kifungua kinywa saa moja asubuhi. Ninaenda kazini saa mbili asubuhi. Hula chakula cha mchana saa sita mchana. Kisha, hurudi nyumbani saa kumi na moja jioni. Mwishowe, hulala saa nne usiku. Kubali ratiba nyingine sahihi; angalia angalau saa nne, viunganishi na sentensi 6–8.",
      "listeningWorkbookUrl": "https://www.falowen.app/campus/course/swahili/day-13?view=schreiben"
    },
    {
      "id": "presentation",
      "type": "presentation",
      "kicker": "Uwasilishaji · Class presentation",
      "title": "Siku Yangu",
      "content": "Taja saa unayoamka.\nEleza shughuli za asubuhi na mchana.\nEleza shughuli za jioni na saa unayolala.\nTumia angalau saa nne na viunganishi vitatu.",
      "english": "Give a 45–60 second oral or audiovisual presentation about your usual weekday.",
      "notes": "Use the student exchange scenario. Invite classmates to ask one question.",
      "listeningWorkbookUrl": "https://www.falowen.app/campus/course/swahili/day-13?view=submit"
    }
  ]
});
