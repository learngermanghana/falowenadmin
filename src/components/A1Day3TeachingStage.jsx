import PublishedSongLessonStage from './PublishedSongLessonStage.jsx';
import { A1_DAY3_PICTURE_CARDS, A1_DAY3_W_QUESTIONS } from '../data/a1Day3Classroom.js';
import './A1Day3TeachingStage.css';

const ARTICLES = [
  {word:'der',gender:'maskulin',emoji:'👨',color:'blue'},
  {word:'die',gender:'feminin',emoji:'👩',color:'rose'},
  {word:'das',gender:'neutrum',emoji:'📘',color:'amber'},
];
function Card({children,className=''}) { return <article className={'a1-day3-card '+className}>{children}</article>; }
function ArticleCards(){ return <div className="a1-day3-articles">{ARTICLES.map(x=><Card key={x.word} className={'tone-'+x.color}><span className="a1-day3-picture" role="img" aria-label={x.gender}>{x.emoji}</span><strong>{x.word}</strong><span>{x.gender}</span></Card>)}</div>; }
function Music(){ return <div className="a1-day3-music"><PublishedSongLessonStage assignmentKey="A1-1.1-practice" courseDay={3} compact nextLyricOnly/></div>; }
export default function A1Day3TeachingStage({step}) {
  if(step==='music') return <Music/>;
  return <section className="a1-day3-lesson" lang="de">
    {step==='intro'&&<><h1>Artikel, Adjektive und W-Fragen</h1><p>Heute sehen, beschreiben und fragen wir.</p><div className="a1-day3-grid">{[['📘','der · die · das'],['🖼️','Bilder beschreiben'],['❓','W-Fragen bilden']].map(([e,t])=><Card key={t}><span className="a1-day3-picture" role="img" aria-label={t}>{e}</span><h2>{t}</h2></Card>)}</div></>}
    {step==='articles'&&<><h1>Der Artikel gehört zum Nomen</h1><p>Lerne das Wort immer mit seinem Artikel.</p><ArticleCards/><div className="a1-day3-rule"><strong>der</strong> = maskulin <span>·</span> <strong>die</strong> = feminin <span>·</span> <strong>das</strong> = neutrum</div></>}
    {step==='picture-sort'&&<><h1>Welcher Artikel passt?</h1><p>Sieh dir das Bild an. Sag das Nomen mit seinem Artikel.</p><div className="a1-day3-pictures">{A1_DAY3_PICTURE_CARDS.map(x=><Card key={x.de}><span className="a1-day3-picture" role="img" aria-label={x.de}>{x.emoji}</span><strong>{x.de}</strong><span>{x.gender}</span></Card>)}</div><p>der Tisch · die Frau · das Buch · die Schule · das Auto</p></>}
    {step==='adjective-frame'&&<><h1>Ein Nomen einfach beschreiben</h1><p className="a1-day3-formula">Nomen <span>+</span> ist <span>+</span> Adjektiv</p><div className="a1-day3-grid">{['Der Ball ist klein.','Die Frau ist freundlich.','Das Haus ist groß.'].map(t=><Card key={t}><h2>{t}</h2></Card>)}</div><p>Nach <strong>ist</strong> bleibt das Adjektiv hier einfach: groß, klein, freundlich.</p></>}
    {step==='picture-sentences'&&<><h1>Was siehst du?</h1><p>Beschreibe jedes Bild mit einem kurzen Satz.</p><div className="a1-day3-pictures">{A1_DAY3_PICTURE_CARDS.map(x=><Card key={x.de}><span className="a1-day3-picture" role="img" aria-label={x.de}>{x.emoji}</span><strong>{x.de}</strong><span>{x.de.split(' ')[0].charAt(0).toUpperCase()+x.de.split(' ')[0].slice(1)} ist {x.adjective}.</span></Card>)}</div></>}
    {step==='w-question-rule'&&<><h1>So steht das Verb in der W-Frage</h1><p className="a1-day3-formula">W-Wort <span>+</span> Verb <span>+</span> Person / Rest</p><div className="a1-day3-grid">{['Wie heißt du?','Wo wohnst du?','Woher kommst du?'].map(t=><Card key={t}><h2>{t}</h2></Card>)}</div><p>Das konjugierte Verb steht direkt nach dem W-Wort.</p></>}
    {step==='answer-clues'&&<><h1>Lies die Antwort. Finde die Frage.</h1><div className="a1-day3-pictures">{A1_DAY3_W_QUESTIONS.map(x=><Card key={x.word}><span className="a1-day3-clue">{x.meaning}</span><h2>{x.answer}</h2></Card>)}</div><p>Finde zuerst die Information: Name, Ort, Herkunft, Person oder Sache.</p></>}
    {step==='w-question-practice'&&<><h1>Welches W-Wort passt?</h1><div className="a1-day3-pictures">{A1_DAY3_W_QUESTIONS.map(x=><Card key={x.word}><span className="a1-day3-clue">{x.answer}</span><p className="a1-day3-question">{x.question.replace(x.word,'_____')}</p><strong>{x.word}</strong></Card>)}</div>}
    {step==='speaking'&&<><h1>Fragt und antwortet zu zweit</h1><div className="a1-day3-grid">{A1_DAY3_W_QUESTIONS.slice(0,3).map(x=><Card key={x.word}><span className="a1-day3-clue">A fragt</span><h2>{x.question}</h2><span>B antwortet mit eigenen Informationen.</span></Card>)}</div><p>Wechselt die Rollen. Die Antworten müssen kurz und vollständig sein.</p></>}
    {step==='recap'&&<><h1>Was hast du heute gelernt?</h1><div className="a1-day3-grid">{['der · die · das','Nomen + ist + Adjektiv','W-Wort + Verb + Person'].map(t=><Card key={t}><h2>{t}</h2></Card>)}</div><p>Ordne drei Nomen zu und wähle das W-Wort zu einer Antwort.</p></>}
  </section>;
}
