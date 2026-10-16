import { useState } from "react";
import "./B1HousingChoicePractice.css";

/**
 * B1-7.21: select a plausible housing option per profile and justify the choice.
 * This is a discussion task, not an auto-marked multiple-choice exercise.
 */
export default function B1HousingChoicePractice({ prompts = [], housingOptions = [], sentenceStarter = "" }) {
  const [selectedByProfile, setSelectedByProfile] = useState({});

  if (!Array.isArray(prompts) || !prompts.length || !Array.isArray(housingOptions) || !housingOptions.length) {
    return null;
  }

  return (
    <section className="presenter-housing-choice" aria-label="Wohnformen auswählen">
      <div className="presenter-housing-profiles">
        {prompts.map((profile, index) => {
          const selectedId = selectedByProfile[index] || "";
          const selected = housingOptions.find((option) => option.id === selectedId);
          return (
            <div className="presenter-housing-profile" key={profile}>
              <div className="presenter-housing-profile-heading">
                <span className="presenter-housing-number">{index + 1}</span>
                <strong>{profile}</strong>
              </div>
              <label htmlFor={`housing-choice-${index}`}>Welche Wohnung passt?</label>
              <select
                id={`housing-choice-${index}`}
                value={selectedId}
                onChange={(event) => setSelectedByProfile((current) => ({
                  ...current,
                  [index]: event.target.value,
                }))}
              >
                <option value="">Wohnmöglichkeit wählen …</option>
                {housingOptions.map((option) => (
                  <option value={option.id} key={option.id}>{option.de}</option>
                ))}
              </select>
              {selected && (
                <p className="presenter-housing-selection">
                  <strong>Gewählt:</strong> {selected.de}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="presenter-housing-vocabulary">
        <div className="presenter-housing-vocabulary-title">
          <strong>Wortschatz · Wohnen</strong>
          <span>Wählt eine passende Möglichkeit pro Profil.</span>
        </div>
        <div className="presenter-housing-vocabulary-grid">
          {housingOptions.map((option) => (
            <div className="presenter-housing-term" key={option.id}>
              <strong>{option.de}</strong>
              <span>{option.en}</span>
              <small>{option.note}</small>
            </div>
          ))}
        </div>
      </div>
      <p className="presenter-housing-speaking-tip">
        <strong>Jetzt begründen:</strong> {sentenceStarter || "Ich würde … wählen, weil … . Allerdings … ."}
      </p>
      <p className="presenter-housing-guidance">
        Mehrere Lösungen sind möglich. Wichtig sind eine passende Begründung und ein realistischer Nachteil.
      </p>
    </section>
  );
}
