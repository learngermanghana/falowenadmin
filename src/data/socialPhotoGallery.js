// African-centred illustrative photos for Falowen’s education campaigns.
// Keep the images illustrative: pictured people are not presented as actual Falowen learners or tutors.
export const SOCIAL_PHOTO_GALLERY = Object.freeze([
  { id: "accra-language-class", title: "Language class in Accra", category: "Ghana & Africa", path: "/social-photos/accra-language-class.webp", tags: "Ghana Accra African adult learning classroom tutor" },
  { id: "accra-study-group", title: "Group study in Accra", category: "Students", path: "/social-photos/accra-study-group.webp", tags: "Ghana Accra African adult students classroom study partners" },
  { id: "ghana-online-class", title: "Online lesson from home", category: "Online learning", path: "/social-photos/ghana-online-class.webp", tags: "Ghana African adult student study online home headphones" },
  { id: "nairobi-evening-class", title: "Evening language class in Nairobi", category: "Ghana & Africa", path: "/social-photos/nairobi-evening-class.webp", tags: "Kenya Nairobi African learners evening tutor class" },
  { id: "accra-conversation-practice", title: "Conversation practice in Accra", category: "Students", path: "/social-photos/accra-conversation-practice.webp", tags: "Ghana Accra African speaking conversation adults" },
  { id: "ghana-library-study", title: "Independent study at the library", category: "Students", path: "/social-photos/ghana-library-study.webp", tags: "Ghana African learner man library workbook" },
  { id: "ghana-online-headphones", title: "Online class at home", category: "Online learning", path: "/social-photos/ghana-online-headphones.webp", tags: "Ghana African student woman hijab online laptop" },
  { id: "nairobi-library-group", title: "Study group in Nairobi", category: "Students", path: "/social-photos/nairobi-library-group.webp", tags: "Kenya Nairobi African students library notes" },
  { id: "accra-tutor-feedback", title: "One-to-one tutor feedback", category: "Teachers", path: "/social-photos/accra-tutor-feedback.webp", tags: "Ghana Accra African woman teacher tutor class" },
  { id: "west-africa-flashcards", title: "Practising vocabulary together", category: "Students", path: "/social-photos/west-africa-flashcards.webp", tags: "West Africa African students vocabulary flashcards speaking" },
]);

export const SOCIAL_PHOTO_CATEGORIES = Object.freeze(["All", "Ghana & Africa", "Students", "Online learning", "Teachers"]);
export function filterSocialPhotos(category, query) {
  const needle = String(query || "").toLowerCase().trim();
  return SOCIAL_PHOTO_GALLERY.filter(photo =>
    (category === "All" || !category || photo.category === category) &&
    (!needle || [photo.title, photo.category, photo.tags].join(" ").toLowerCase().includes(needle)));
}
