import MusicVideoEmbed from "./MusicVideoEmbed.jsx";
import SwahiliRestaurantScenario from "./SwahiliRestaurantScenario.jsx";

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

function FoodCards({ cards = [], compact = false }) {
  if (!cards.length) return null;
  return <div className={`swahili-a2-presenter__food-cards ${compact ? "is-compact" : ""}`} aria-label="Food picture vocabulary">
    {cards.map(card=><article className="swahili-a2-presenter__food-photo-card" key={card.id}>
      <div className="swahili-a2-presenter__food-photo-frame">
        {card.image ? <img src={card.image} alt={card.en} loading="lazy" decoding="async"
          onError={event=>{event.currentTarget.hidden=true;event.currentTarget.nextElementSibling.hidden=false;}} /> : null}
        <span className="swahili-a2-presenter__photo-fallback" hidden={Boolean(card.image)}>{card.icon || "🍽️"}</span>
      </div>
      <div className="swahili-a2-presenter__food-photo-caption">
        <strong lang="sw">{card.sw}</strong><small>{card.en}</small>
      </div>
      {card.credit && <a className="swahili-a2-presenter__photo-credit" href={card.credit} target="_blank" rel="noreferrer" aria-label={`Photo source for ${card.sw}, ${card.author || "Wikimedia Commons"}`}>Photo: {card.author || "Commons"}</a>}
    </article>)}
  </div>;
}
function Menu({ content, cards = [], drinks = [] }) {
  const lines=Lines({text:content});
  const foodIndex=lines.indexOf("CHAKULA");
  const drinkIndex=lines.indexOf("VINYWAJI");
  if (foodIndex<0 || drinkIndex<0) return <p className="presenter-topic">{content}</p>;
  const foodNames=lines.slice(foodIndex+1,drinkIndex).flatMap(row=>row.split(/\s*[·]\s*/)).filter(Boolean);
  const drinkNames=lines.slice(drinkIndex+1).flatMap(row=>row.split(/\s*[·]\s*/)).filter(Boolean);
  const matchingFoods=cards.filter(card=>foodNames.some(name=>name.toLowerCase()===card.sw.toLowerCase()));
  return <div className="swahili-a2-presenter__menu" aria-label="Practice restaurant menu">
    <section className="swahili-a2-presenter__menu-column">
      <h2>Chakula · Food</h2>
      <FoodCards cards={matchingFoods} compact />
      {foodNames.filter(name=>!matchingFoods.some(card=>card.sw.toLowerCase()===name.toLowerCase())).map(name=><p key={name}>{name}</p>)}
    </section>
    <section className="swahili-a2-presenter__menu-column">
      <h2>Vinywaji · Drinks</h2>
      <div className="swahili-a2-presenter__menu-drinks">
        {drinkNames.map(name=>{
          const card=drinks.find(item=>item.sw.toLowerCase()===name.toLowerCase());
          return <div className="swahili-a2-presenter__menu-drink" key={name}>
            <span aria-hidden="true">{card?.icon || "🥤"}</span>
            <strong>{name}</strong><small>{card?.en || ""}</small>
          </div>;
        })}
      </div>
    </section>
  </div>;
}

export default function SwahiliA2LessonStage({ stage, grammar, isDaySix }) {
  const lines=Lines({text:stage.content});
  if(stage.type==="intro") return <section className="swahili-a2-presenter__intro-stage">
    <span className="presenter-kicker">Falowen · Kiswahili A1</span>
    <h2>{isDaySix ? "Chakula · Vinywaji · Kuomba kwa adabu" : "Vokali · Silabi · Matamshi"}</h2>
    <p className="presenter-objective">{stage.english}</p>
    <div className="swahili-a2-presenter__lesson-highlight">{lines.map((line,i)=><p key={i}>{line}</p>)}</div>
    {isDaySix && <FoodCards cards={stage.foodCards} />}
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
    {stage.radioUrl ? <MusicVideoEmbed videoId={stage.radioUrl.match(/(?:youtu\.be\/|[?&]v=)([\w-]{11})/)?.[1]} title="Falowen Radio · Mgahawani" variant="listening" footerLabel="Falowen · Jifunze Kiswahili" /> : <WordTiles text={stage.content}/>}
  </section>;

  if (stage.type === "radio-questions") return (
    <section className="swahili-a2-presenter__radio-questions" aria-label="Falowen Radio questions">
      {stage.content.split("\n\n").map(block => <p key={block}>{block}</p>)}
      {stage.radioUrl && <a className="swahili-a2-presenter__radio-link" href={stage.radioUrl} target="_blank" rel="noreferrer">Play Falowen Radio on YouTube</a>}
    </section>
  );

  if(stage.type==="grammar" && grammar) {
    const entries=Lines({text:grammar.body});
    return <section className="swahili-a2-presenter__grammar-stage">
      <div className="swahili-a2-presenter__grammar-model">
        {entries.map((line,i)=><p key={i}>{line}</p>)}
      </div>
      {grammar.rule && <div className="swahili-a2-presenter__grammar-explanation"><span>Rule · Kanuni</span><p>{grammar.rule}</p></div>}
    </section>;
  }

  if(stage.type==="reading" && isDaySix) return <Menu content={stage.content} cards={stage.foodCards} drinks={stage.drinkCards} />;

  if(stage.type==="speaking" && isDaySix) return <section className="swahili-a2-presenter__dialogue" aria-label="Server and customer dialogue">
    <p className="presenter-kicker">Model the conversation · Switch roles</p>
    {lines.map((line,i)=><SpeakerLine key={i} line={line}/>)}
  </section>;

  if(stage.type==="reading" || stage.type==="speaking") return <section className="swahili-a2-presenter__reading-words">
    <span className="presenter-kicker">{stage.type==="speaking"?"Read aloud · Rudia":"Read and identify · Soma"}</span>
    <WordTiles text={stage.content}/>
  </section>;

  if(stage.type==="scenario" && isDaySix) return <SwahiliRestaurantScenario scenarios={stage.scenarios} />;

  if(stage.type==="writing" || stage.type==="presentation" || stage.type==="summary") return <section className="swahili-a2-presenter__task-grid">
    {lines.map((line,i)=><div className="swahili-a2-presenter__task" key={i}>
      <span>{String(i+1).padStart(2,"0")}</span><strong>{line.replace(/^\d+\.\s*/,"")}</strong>
    </div>)}
  </section>;

  return <div className="swahili-a2-presenter__lesson-highlight">{lines.map((line,i)=><p key={i}>{line}</p>)}</div>;
}
