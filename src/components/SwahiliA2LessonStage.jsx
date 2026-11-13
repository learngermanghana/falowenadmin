import MusicVideoEmbed from "./MusicVideoEmbed.jsx";

// A2 Day 1 uses dedicated lesson stage layouts and a real shared media
// component, not a generic preformatted text panel. Reuse those components
// and the common presenter shell for Kiswahili rather than a second player.
// Source text and student assignment models stay in the lesson data files.
function Lines({ text }) {
  return String(text || "").split("\n").filter(Boolean);
}

function SpeakerLine({ line }) {
  const match = String(line).match(/^(Mhudumu|Mteja):\s*(.+)$/);
  if (!match) return <p className="swahili-a2-presenter__line">{line}</p>;
  return <div className="swahili-a2-presenter__dialogue-turn">
    <span className={match[1] === "Mhudumu" ? "is-server" : "is-customer"}>{match[1]}</span>
    <p>{match[2]}</p>
  </div>;
}

function WordTiles({ text }) {
  const lines = Lines({text});
  const items = lines.flatMap(line => line.split(/\s*[·]\s*/)).filter(Boolean);
  return <div className="swahili-a2-presenter__word-grid" aria-label="Words to read aloud">
    {items.map((item,i)=><span key={i}>{item}</span>)}
  </div>;
}

function Menu({ content }) {
  const lines=Lines({text:content});
  const foodIndex=lines.indexOf("CHAKULA");
  const drinkIndex=lines.indexOf("VINYWAJI");
  if (foodIndex<0 || drinkIndex<0) return <p className="presenter-topic">{content}</p>;
  const groups=[["Chakula · Food",lines.slice(foodIndex+1,drinkIndex)],["Vinywaji · Drinks",lines.slice(drinkIndex+1)]];
  return <div className="swahili-a2-presenter__menu" aria-label="Practice restaurant menu">
    {groups.map(([title,values])=><section key={title} className="swahili-a2-presenter__menu-column">
      <h2>{title}</h2>
      {values.flatMap(row=>row.split(/\s*[·]\s*/)).filter(Boolean).map((label,i)=><p key={i}>{label}</p>)}
    </section>)}
  </div>;
}

export default function SwahiliA2LessonStage({ stage, grammar, isDaySix }) {
  const lines=Lines({text:stage.content});
  if(stage.type==="intro") return <section className="swahili-a2-presenter__intro-stage">
    <span className="presenter-kicker">Falowen · Kiswahili A1</span>
    <h2>{isDaySix ? "Chakula · Vinywaji · Kuomba kwa adabu" : "Vokali · Silabi · Matamshi"}</h2>
    <p className="presenter-objective">{stage.english}</p>
    <div className="swahili-a2-presenter__lesson-highlight">{lines.map((line,i)=><p key={i}>{line}</p>)}</div>
  </section>;

  if(stage.type==="music") return <section className="swahili-a2-presenter__media-stage">
    <header className="swahili-a2-presenter__media-heading">
      <span className="presenter-kicker">Muziki · Listen and repeat</span>
      <h2>{isDaySix ? "Mgahawani · Kiitikio" : "Sauti za Kiswahili"}</h2>
    </header>
    <div className="swahili-a2-presenter__lyrics">
      {isDaySix ? lines.map((line,i)=><p key={i}>{line}</p>) : <WordTiles text={stage.content}/>}
    </div>
    <p className="swahili-a2-presenter__support-note">
      {isDaySix ? "Teacher-led lyrics practice. No approved Day 6 song audio is connected yet." : "Pronounce these sounds with your teacher. No Day 1 song recording is linked yet."}
    </p>
  </section>;

  if(stage.type==="listening") return <section className="swahili-a2-presenter__media-stage">
    <header className="swahili-a2-presenter__media-heading">
      <span className="presenter-kicker">Kusikiliza · Listening</span>
      <h2>{isDaySix ? "Falowen Radio · Mgahawani" : "Sikiliza na utambue sauti"}</h2>
      <p>{isDaySix ? "Play the published radio episode with the same shared video player used in German A2." : "Listen as your teacher reads each word, then identify the vowel."}</p>
    </header>
    {stage.radioUrl ? <MusicVideoEmbed videoId={stage.radioUrl.match(/(?:youtu\.be\/|[?&]v=)([\w-]{11})/)?.[1]} title="Falowen Radio · Mgahawani" variant="listening" /> : <WordTiles text={stage.content}/>}
    {stage.radioUrl && <p className="swahili-a2-presenter__support-note">The classroom question below refers to the original waiter–customer dialogue; it is not an answer key for the radio programme.</p>}
  </section>;

  if(stage.type==="grammar" && grammar) {
    const entries=Lines({text:grammar.body});
    return <section className="swahili-a2-presenter__grammar-stage">
      <div className="swahili-a2-presenter__grammar-model">
        {entries.map((line,i)=><p key={i}>{line}</p>)}
      </div>
      {grammar.rule && <div className="swahili-a2-presenter__grammar-explanation"><span>Rule · Kanuni</span><p>{grammar.rule}</p></div>}
    </section>;
  }

  if(stage.type==="reading" && isDaySix) return <Menu content={stage.content} />;

  if(stage.type==="speaking" && isDaySix) return <section className="swahili-a2-presenter__dialogue" aria-label="Server and customer dialogue">
    <p className="presenter-kicker">Model the conversation · Switch roles</p>
    {lines.map((line,i)=><SpeakerLine key={i} line={line}/>)}
  </section>;

  if(stage.type==="reading" || stage.type==="speaking") return <section className="swahili-a2-presenter__reading-words">
    <span className="presenter-kicker">{stage.type==="speaking"?"Read aloud · Rudia":"Read and identify · Soma"}</span>
    <WordTiles text={stage.content}/>
  </section>;

  if(stage.type==="writing" || stage.type==="presentation" || stage.type==="summary") return <section className="swahili-a2-presenter__task-grid">
    {lines.map((line,i)=><div className="swahili-a2-presenter__task" key={i}>
      <span>{String(i+1).padStart(2,"0")}</span><strong>{line.replace(/^\d+\.\s*/,"")}</strong>
    </div>)}
  </section>;

  return <div className="swahili-a2-presenter__lesson-highlight">{lines.map((line,i)=><p key={i}>{line}</p>)}</div>;
}
