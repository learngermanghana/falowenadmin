// Small hand-picked collection for Falowen's own branded social-media designs.
// All source pages below identify the photographer and display the Pexels free license.
// Photos are composed with Falowen artwork/text, never redistributed as standalone stock.
export const SOCIAL_PHOTO_GALLERY = Object.freeze([
  { id: "study-group", title: "Studying together", category: "Students", photoId: 6146987, photographer: "Keira Burton", source: "https://www.pexels.com/photo/focused-multiethnic-students-with-laptop-studying-together-on-campus-of-university-6146987/", tags: "group students diverse laptop outdoors" },
  { id: "focused-learner", title: "Focused learner", category: "Students", photoId: 5940708, photographer: "Kampus Production", source: "https://www.pexels.com/photo/serious-young-black-man-working-on-laptop-sitting-near-window-in-library-5940708/", tags: "black man laptop library desk" },
  { id: "peer-learning", title: "Study partners", category: "Students", photoId: 6281831, photographer: "Monstera Production", source: "https://www.pexels.com/photo/serious-black-students-doing-assignment-together-6281831/", tags: "learning group black students books" },
  { id: "confident-learner", title: "A joyful study day", category: "Students", photoId: 5965559, photographer: "Charlotte May", source: "https://www.pexels.com/photo/glad-black-woman-typing-on-laptop-5965559/", tags: "happy woman computer student confidence" },
  { id: "study-notebook", title: "Notebook and pen", category: "Study spaces", photoId: 895465, photographer: "Jess Bailey Designs", source: "https://www.pexels.com/photo/book-and-pen-on-notebook-895465/", tags: "books writing notes stationary desk" },
  { id: "desk-work", title: "Study desk", category: "Study spaces", photoId: 17556501, photographer: "Fiona Murray", source: "https://www.pexels.com/photo/notepad-on-books-17556501/", tags: "minimal notebook stationery workspace books" },
  { id: "fresh-notebook", title: "Fresh notebook", category: "Study spaces", photoId: 606539, photographer: "Jessica Lewis", source: "https://www.pexels.com/photo/white-notebook-and-pen-606539/", tags: "simple notebook writing planner desk" },
  { id: "berlin-street", title: "Berlin city life", category: "Germany", photoId: 15348624, photographer: "Jochem te Pas", source: "https://www.pexels.com/photo/street-in-berlin-15348624/", tags: "germany city travel architecture landmark" },
  { id: "berlin-architecture", title: "Berlin architecture", category: "Germany", photoId: 34220597, photographer: "Niklas Jeromin", source: "https://www.pexels.com/photo/berlin-cityscape-with-historic-architecture-34220597/", tags: "germany berlin city buildings travel" },
]);

export const SOCIAL_PHOTO_CATEGORIES = Object.freeze(["All", "Students", "Study spaces", "Germany"]);
export const SOCIAL_PHOTO_LICENSE_URL = "https://www.pexels.com/license";

// Use the original Pexels photo ID; no Pexels API key, backend endpoint or new paid service.
export function socialPhotoImageUrl(photo, width = 1100) {
  if (!photo || !Number.isSafeInteger(Number(photo.photoId))) return "";
  const safeWidth = Math.min(1800, Math.max(240, Math.round(Number(width) || 1100)));
  return "https://images.pexels.com/photos/" + photo.photoId + "/pexels-photo-" + photo.photoId +
    ".jpeg?auto=compress&cs=tinysrgb&w=" + safeWidth;
}

export function filterSocialPhotos(category, query) {
  const needle = String(query || "").toLowerCase().trim();
  return SOCIAL_PHOTO_GALLERY.filter(photo =>
    (category === "All" || !category || photo.category === category) &&
    (!needle || [photo.title, photo.category, photo.tags].join(" ").toLowerCase().includes(needle)));
}
