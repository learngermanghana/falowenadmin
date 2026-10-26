import "./MusicVideoEmbed.css";

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;

/** Shared, teacher-controlled YouTube player for music-based lesson stages. */
export default function MusicVideoEmbed({ videoId, title = "Musik anhören", variant = "listening" }) {
  if (!YOUTUBE_ID.test(String(videoId || ""))) return null;

  const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?rel=0`;
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;

  return (
    <section className={`music-video-embed music-video-embed--${variant}`} aria-label={title}>
      <div className="music-video-embed-frame">
        <iframe
          src={embedUrl}
          title={title}
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
      <div className="music-video-embed-footer">
        <span>Falowen · Deutsch lernen mit Musik</span>
        <a href={watchUrl} target="_blank" rel="noreferrer noopener">Video auf YouTube öffnen ↗</a>
      </div>
    </section>
  );
}
