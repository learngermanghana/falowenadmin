import { useState } from "react";
import {
  SOCIAL_PHOTO_CATEGORIES, SOCIAL_PHOTO_GALLERY, SOCIAL_PHOTO_LICENSE_URL,
  filterSocialPhotos, socialPhotoImageUrl,
} from "../data/socialPhotoGallery.js";

const fieldStyle = { width: "100%", boxSizing: "border-box", border: "1px solid #cbd5e1", borderRadius: 9, padding: 10 };
const small = { color: "#64748b", fontSize: 12 };
const USED_PHOTOS_KEY = "falowen-social-gallery-used-v1";

function readUsedPhotos() {
  try {
    const saved = JSON.parse(localStorage.getItem(USED_PHOTOS_KEY) || "[]");
    return Array.isArray(saved) ? saved.filter(id => SOCIAL_PHOTO_GALLERY.some(photo => photo.id === id)) : [];
  } catch {
    return [];
  }
}

// Convert the picked Pexels photograph to local canvas pixels before passing it
// to a poster. This prevents a cross-origin/tainted canvas from breaking export.
// If the provider blocks CORS or the image goes offline, keep the previous photo.
export async function prepareSocialGalleryPhoto(photo, createImage = () => new Image(), createCanvas = () => document.createElement("canvas")) {
  if (!SOCIAL_PHOTO_GALLERY.some(item => item.id === photo?.id)) throw new Error("Choose a listed Pexels photo.");
  const image = await new Promise((resolve, reject) => {
    const candidate = createImage();
    candidate.crossOrigin = "anonymous";
    candidate.onload = () => resolve(candidate);
    candidate.onerror = () => reject(new Error("This photo could not be loaded for export. Choose another gallery photo."));
    candidate.src = socialPhotoImageUrl(photo, 1400);
  });
  const canvas = createCanvas();
  const maxSide = 1400;
  const scale = Math.min(1, maxSide / Math.max(image.naturalWidth || image.width, image.naturalHeight || image.height));
  canvas.width = Math.max(1, Math.round((image.naturalWidth || image.width) * scale));
  canvas.height = Math.max(1, Math.round((image.naturalHeight || image.height) * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Your browser cannot prepare this photo.");
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  try {
    // If CORS is missing, this fails before we change the poster image.
    return canvas.toDataURL("image/jpeg", 0.88);
  } catch {
    throw new Error("This photo cannot be exported securely from Pexels in your browser. Choose another photo.");
  }
}

// The same library is available in Upcoming Classes, Ads and Vocabulary posters.
export default function SocialPhotoGallery({ onSelect, activeId = "", defaultOpen = true }) {
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [loadingId, setLoadingId] = useState("");
  const [error, setError] = useState("");
  const [lastSelected, setLastSelected] = useState("");
  const [usedIds, setUsedIds] = useState(readUsedPhotos);
  const [unusedOnly, setUnusedOnly] = useState(false);
  const photos = filterSocialPhotos(category, query).filter(photo => !unusedOnly || !usedIds.includes(photo.id));
  const unusedCount = SOCIAL_PHOTO_GALLERY.length - usedIds.length;

  function toggleUsed(id) {
    setUsedIds(previous => {
      const next = previous.includes(id) ? previous.filter(item => item !== id) : [...previous, id];
      try { localStorage.setItem(USED_PHOTOS_KEY, JSON.stringify(next)); } catch { /* browser storage may be unavailable */ }
      return next;
    });
  }


  async function selectPhoto(photo) {
    if (loadingId) return;
    setLoadingId(photo.id);
    setError("");
    try {
      const localImage = await prepareSocialGalleryPhoto(photo);
      onSelect(localImage, photo);
      setLastSelected(photo.id);
    } catch (err) {
      setError(err?.message || "Could not prepare this photo. Try another.");
    } finally {
      setLoadingId("");
    }
  }

  return (
    <details open={defaultOpen} style={{ border: "1px solid #dbe3ed", borderRadius: 12, background: "#f8fafc", padding: 12 }}>
      <summary style={{ cursor: "pointer", fontWeight: 800 }}>Built-in photo gallery · {SOCIAL_PHOTO_GALLERY.length} fresh photos · {unusedCount} unused</summary>
      <p style={{ ...small, margin: "9px 0" }}>New study, student, online class and Germany backgrounds for Falowen posters. Choose one to apply it automatically. Free Pexels photos; no upload or API key required.</p>
      <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13, margin: "8px 0" }}>
        <input type="checkbox" checked={unusedOnly} onChange={event => setUnusedOnly(event.target.checked)} />
        Show only unused pictures ({unusedCount} remaining)
      </label>
      <label style={{ display: "grid", gap: 5, fontSize: 13, fontWeight: 650 }}>
        Find a photo
        <input aria-label="Search built-in photos" value={query} onChange={event => setQuery(event.target.value)} placeholder="Students, studying, Berlin…" style={fieldStyle} />
      </label>
      <div role="group" aria-label="Photo categories" style={{ display: "flex", flexWrap: "wrap", gap: 6, margin: "10px 0" }}>
        {SOCIAL_PHOTO_CATEGORIES.map(name => (
          <button type="button" key={name} aria-pressed={category === name} onClick={() => setCategory(name)}
            style={{ border: "1px solid #bfcee3", padding: "6px 9px", borderRadius: 999, background: category === name ? "#0b3979" : "white", color: category === name ? "white" : "#17365c", cursor: "pointer" }}>
            {name}
          </button>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(116px, 1fr))", gap: 9 }}>
        {photos.map(photo => (
          <div key={photo.id} style={{ display: "grid", gap: 4 }}>
            <button type="button" disabled={!!loadingId} aria-pressed={activeId === photo.id}
              aria-label={"Use " + photo.title + " photo"} onClick={() => selectPhoto(photo)}
              style={{ padding: 3, borderRadius: 10, border: activeId === photo.id ? "3px solid #1266b6" : "1px solid #cbd5e1", background: "white", cursor: loadingId ? "wait" : "pointer", textAlign: "left" }}>
              <img src={socialPhotoImageUrl(photo, 360)} alt={photo.title} loading="lazy"
                style={{ width: "100%", height: 96, objectFit: "cover", borderRadius: 6, display: "block", background: "#e2e8f0", opacity: usedIds.includes(photo.id) ? 0.68 : 1 }} />
              <span style={{ display: "block", fontSize: 12, fontWeight: 700, padding: "5px 4px" }}>{photo.title}</span>
              <span style={{ display: "block", fontSize: 11, color: "#475569", padding: "0 4px 4px" }}>
                {loadingId === photo.id ? "Preparing…" : activeId === photo.id ? "✓ Selected" : "Use photo"}
              </span>
            </button>
            <button type="button" onClick={() => toggleUsed(photo.id)} aria-pressed={usedIds.includes(photo.id)}
              aria-label={(usedIds.includes(photo.id) ? "Mark unused: " : "Mark used: ") + photo.title}
              style={{ cursor: "pointer", background: usedIds.includes(photo.id) ? "#e2e8f0" : "#eef6ff", border: "1px solid #cbd5e1", color: "#17365c", borderRadius: 7, padding: "5px 4px", fontSize: 11, fontWeight: 650 }}>
              {usedIds.includes(photo.id) ? "✓ Used · Undo" : "Mark used"}
            </button>
            <a href={photo.source} target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 11, color: "#375d88", lineHeight: 1.3 }} title={"Photo by " + photo.photographer + " on Pexels"}>
              Photo: {photo.photographer} ↗
            </a>
          </div>
        ))}
      </div>
      {!photos.length && <p style={small}>{unusedOnly ? "No unused photos match. Turn off the unused filter to reuse or reset a picture." : "No matching photos. Try another search or category."}</p>
      {error && <p role="alert" style={{ color: "#b91c1c", fontSize: 13 }}>{error}</p>}
      {!error && lastSelected && activeId === lastSelected && <p role="status" style={{ color: "#166534", fontSize: 12 }}>Photo applied. Your PNG export will use a local, export-safe copy.</p>}
      <p style={{ ...small, marginBottom: 0 }}>
        Used/unused labels are saved only in this browser and do not change published posts.
        Pexels photos are free for use in original branded designs; credit is appreciated.
        Models do not endorse Falowen. Do not redistribute unaltered photos.
        {" "}<a href={SOCIAL_PHOTO_LICENSE_URL} target="_blank" rel="noopener noreferrer">Read the Pexels license ↗</a>
      </p>
    </details>
  );
}
