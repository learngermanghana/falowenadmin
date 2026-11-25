import MusicVideoEmbed from "./MusicVideoEmbed.jsx";

export default function SwahiliRadioMedia({ stage }) {
  if (!stage.radioVideoId) {
    return <p className="slide-meta">Teacher-led practice · Falowen Radio video pending</p>;
  }
  return <>
    <MusicVideoEmbed videoId={stage.radioVideoId} title={stage.title} footerLabel="Falowen · Jifunze Kiswahili" />
    {stage.radioActivities?.length > 0 && <section lang="sw" aria-label="Mazoezi baada ya kipindi">
      <h2>Mazoezi baada ya kipindi</h2>
      {stage.radioActivities.map(group => <section key={group.title}>
        <h3>{group.title} · <span lang="en">{group.english}</span></h3>
        {group.activities.map(activity => <details key={activity.title}>
          <summary>{activity.title}</summary>
          <p lang="en">{activity.english}</p>
          {activity.intro && <p>{activity.intro}</p>}
          {activity.prompts && <ol>{activity.prompts.map(prompt => <li key={prompt}>{prompt}</li>)}</ol>}
          {activity.example && <table>
            <thead><tr><th>Shughuli</th><th>Siku</th><th>Tarehe</th><th>Mwezi</th></tr></thead>
            <tbody><tr>{activity.example.map(value => <td key={value}>{value}</td>)}</tr></tbody>
          </table>}
          <details>
            <summary>Onyesha mfano wa jibu</summary>
            <p style={{ whiteSpace: "pre-line" }}>{activity.answer}</p>
          </details>
        </details>)}
      </section>)}
    </section>}
  </>;
}
