// Twenty fresh Pexels photos for Falowen's branded social-media designs (November 2026 refresh).
// Source pages and photographers are retained for credit, licensing and future review.
// Photos are composed with Falowen artwork/text, never redistributed as standalone stock.
export const SOCIAL_PHOTO_GALLERY = Object.freeze([
  {"id":"campus-library-group","title":"Library study group","category":"Students","photoId":16420458,"photographer":"Ludovic Delot","source":"https://www.pexels.com/photo/a-group-of-students-sitting-in-a-library-and-studying-16420458/","tags":"university group research books library students"},
  {"id":"classroom-collaboration","title":"College classroom","category":"Students","photoId":8199165,"photographer":"Yan Krukau","source":"https://www.pexels.com/photo/college-students-studying-inside-a-classroom-8199165/","tags":"classroom students teacher school laptop teamwork"},
  {"id":"ghana-student-books","title":"Student in Ghana","category":"Students","photoId":29558433,"photographer":"A.K. Bissue","source":"https://www.pexels.com/photo/smiling-student-holding-books-in-kumasi-park-29558433/","tags":"ghana african student books kumasi campus"},
  {"id":"library-study-team","title":"Library teamwork","category":"Students","photoId":5940844,"photographer":"Kampus Production","source":"https://www.pexels.com/photo/multiethnic-students-doing-research-together-in-library-5940844/","tags":"diverse students laptop discussion group"},
  {"id":"window-study-partners","title":"Study partners","category":"Students","photoId":6281829,"photographer":"Monstera Production","source":"https://www.pexels.com/photo/serious-black-classmates-doing-homework-together-near-panoramic-window-6281829/","tags":"african students reading laptop friends exam"},
  {"id":"books-together","title":"Smiling graduates","category":"Students","photoId":6238120,"photographer":"Monstera Production","source":"https://www.pexels.com/photo/group-of-multiethnic-students-with-books-and-documents-6238120/","tags":"group diverse young adult books study friendship"},
  {"id":"confident-library-group","title":"Ready for class","category":"Students","photoId":6549361,"photographer":"Tima Miroshnichenko","source":"https://www.pexels.com/photo/college-students-standing-near-library-catalogs-6549361/","tags":"students college library book backpack"},
  {"id":"online-webinar","title":"Online German lesson","category":"Online learning","photoId":4492189,"photographer":"Artem Podrez","source":"https://www.pexels.com/photo/focused-woman-using-laptop-while-attending-online-webinar-4492189/","tags":"video call webinar distance study online lessons"},
  {"id":"online-study-home","title":"Studying from home","category":"Online learning","photoId":7594214,"photographer":"Mikhail Nilov","source":"https://www.pexels.com/photo/a-person-sitting-on-the-bed-while-using-a-laptop-7594214/","tags":"home learning notes laptop flexible study"},
  {"id":"online-class-table","title":"Virtual classroom","category":"Online learning","photoId":8055482,"photographer":"Annushka Ahuja","source":"https://www.pexels.com/photo/a-young-girl-studying-in-front-of-her-book-and-laptop-on-a-table-8055482/","tags":"online class student laptop notebook lesson"},
  {"id":"online-class-notes","title":"Happy online learner","category":"Online learning","photoId":8472882,"photographer":"MART PRODUCTION","source":"https://www.pexels.com/photo/a-happy-young-woman-taking-an-online-class-while-sitting-on-the-floor-8472882/","tags":"distance education laptop woman notes smile"},
  {"id":"reading-desk","title":"Books and laptop","category":"Study spaces","photoId":20593094,"photographer":"Beyza Yalçın","source":"https://www.pexels.com/photo/an-open-book-and-a-notebook-lying-next-to-a-laptop-20593094/","tags":"open book study desk notes laptop learning"},
  {"id":"minimal-study-table","title":"Bright study workspace","category":"Study spaces","photoId":6446245,"photographer":"Mike Murray","source":"https://www.pexels.com/photo/laptop-and-notebook-on-the-desk-6446245/","tags":"minimal workspace tablet keyboard notebook"},
  {"id":"desk-laptop-glasses","title":"Organised desk","category":"Study spaces","photoId":7670739,"photographer":"alleksana","source":"https://www.pexels.com/photo/laptop-and-notebook-on-a-desk-7670739/","tags":"laptop study desk stationery glasses productivity"},
  {"id":"writing-study-notes","title":"Taking study notes","category":"Study spaces","photoId":5538622,"photographer":"Zen Chung","source":"https://www.pexels.com/photo/crop-female-student-writing-notes-in-copybook-while-sitting-at-table-5538622/","tags":"handwriting notes book laptop learning cafe"},
  {"id":"brandenburg-gate","title":"Berlin landmark","category":"Germany","photoId":37120347,"photographer":"Claudia Solano","source":"https://www.pexels.com/photo/brandenburg-gate-in-berlin-iconic-landmark-37120347/","tags":"Berlin Brandenburg Gate Germany travel history"},
  {"id":"hamburg-elbe","title":"Hamburg harbour","category":"Germany","photoId":12903730,"photographer":"Frank Rietsch","source":"https://www.pexels.com/photo/buildings-by-river-in-hamburg-12903730/","tags":"Hamburg Elbe river Elbphilharmonie city travel"},
  {"id":"munich-square","title":"Munich Marienplatz","category":"Germany","photoId":4213371,"photographer":"Anastasia Shuraeva","source":"https://www.pexels.com/photo/marienplatz-in-munich-4213371/","tags":"Munich Marienplatz Bavaria architecture Germany travel"},
  {"id":"frankfurt-train","title":"Frankfurt railway","category":"Germany","photoId":18899163,"photographer":"Sabine Freiberger","source":"https://www.pexels.com/photo/train-at-railway-station-in-germany-18899163/","tags":"Germany Frankfurt Hauptbahnhof train rail travel"},
  {"id":"berlin-station","title":"Berlin station","category":"Germany","photoId":21316226,"photographer":"Silvio Pelegrin","source":"https://www.pexels.com/photo/a-train-station-in-berlin-in-germany-21316226/","tags":"Berlin public transport station platform German city"},
]);

export const SOCIAL_PHOTO_CATEGORIES = Object.freeze(["All", "Students", "Online learning", "Study spaces", "Germany"]);
export const SOCIAL_PHOTO_LICENSE_URL = "https://www.pexels.com/license";

// Use original Pexels IDs, with no API key, backend endpoint or paid image service.
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
