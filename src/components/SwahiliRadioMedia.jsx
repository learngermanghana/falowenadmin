import MusicVideoEmbed from "./MusicVideoEmbed.jsx";

export default function SwahiliRadioMedia({ stage }) {
  return stage.radioVideoId
    ? <MusicVideoEmbed videoId={stage.radioVideoId} title={stage.title} footerLabel="Falowen · Jifunze Kiswahili" />
    : <p className="slide-meta">Teacher-led practice · Falowen Radio video pending</p>;
}
