import { useState } from "react";

// Used only by normal A1 classroom blocks. The Goethe A1-5.9 mock keeps
// its independent exam-readiness and participation assessment.
export default function A1EverydaySpeakingStage({ stage }) {
  const [showHint, setShowHint] = useState(false);
  const [showModel, setShowModel] = useState(false);
  const [reactionRound, setReactionRound] = useState(0);
  const isMission = stage.kind === "mission";
  const active = !isMission && reactionRound === 1 ? stage.second : stage;

  return (
    <section
      className={`presenter-a1-speaking-stage ${isMission ? "is-mission" : "is-reaction"}`}
      aria-label={isMission ? "A1 everyday speaking mini-mission" : "A1 listen and respond"}
    >
      <div className="presenter-a1-speaking-heading">
        <span className="presenter-a1-speaking-eyebrow">
          {isMission ? "DEUTSCH IM ALLTAG · MINI-MISSION" : "HÖR ZU UND REAGIERE!"}
        </span>
        <span className="presenter-a1-speaking-duration">{isMission ? "5 Minuten" : "3 Minuten"}</span>
      </div>
      <h1>{stage.title}</h1>
      <p className="presenter-a1-speaking-instruction">
        {isMission
          ? "Lerne die fünf Wörter. Sprich dann mit deinem Partner."
          : "Höre deiner Lehrkraft zu. Antworte erst selbst auf Deutsch."}
      </p>

      {!isMission ? (
        <div className="presenter-a1-speaking-rounds" role="group" aria-label="Hörsituationen wählen">
          {[0, 1].map((number) => (
            <button
              key={number}
              type="button"
              aria-pressed={reactionRound === number}
              onClick={() => {
                setReactionRound(number);
                setShowModel(false);
                setShowHint(false);
              }}
            >
              Situation {number + 1}
            </button>
          ))}
        </div>
      ) : null}

      {isMission ? (
        <div className="presenter-a1-speaking-words" aria-label="Fünf Wörter für heute">
          {stage.words.map((word) => <span key={word} className="presenter-a1-speaking-word">{word}</span>)}
        </div>
      ) : null}

      <div className="presenter-a1-speaking-situation">
        <span>{isMission ? "SITUATION" : "HÖRSITUATION"}</span>
        <p>{active.situation}</p>
      </div>

      <div className="presenter-a1-speaking-prompt">
        <span>{isMission ? "DEINE MISSION" : "DIE LEHRKRAFT SPRICHT – DU ANTWORTEST"}</span>
        <p>{active.prompt}</p>
      </div>

      <div className="presenter-a1-speaking-actions">
        {isMission && stage.hint && !showModel ? (
          <button type="button" aria-expanded={showHint} onClick={() => setShowHint((value) => !value)}>
            {showHint ? "Grammatikhilfe ausblenden" : "Kleine Grammatikhilfe"}
          </button>
        ) : null}
        <button
          type="button"
          className="presenter-a1-speaking-reveal"
          aria-expanded={showModel}
          onClick={() => { setShowModel((value) => !value); setShowHint(false); }}
        >
          {showModel ? "Musterantwort ausblenden" : "Musterantwort anzeigen"}
        </button>
      </div>

      {showHint && isMission && !showModel ? (
        <aside className="presenter-a1-speaking-hint" aria-live="polite">
          <strong>Denke an die Grammatik:</strong>
          <p>{stage.hint}</p>
        </aside>
      ) : null}

      {showModel ? (
        <div className="presenter-a1-speaking-answer" aria-live="polite">
          <strong>Mögliche Antwort</strong>
          <p className="presenter-a1-speaking-model">{active.model}</p>
          {isMission ? (
            <div className="presenter-a1-speaking-followup">
              <strong>Zweite Runde</strong>
              <p>{stage.secondRound}</p>
            </div>
          ) : (
            <small><b>Lehrerhinweis:</b> {active.note}</small>
          )}
        </div>
      ) : (
        <p className="presenter-a1-speaking-before-answer">
          Erst mündlich antworten lassen. Danach die Musterantwort öffnen.
        </p>
      )}
    </section>
  );
}
