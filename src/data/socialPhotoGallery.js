// Twenty African-centred, source-credited stock photos for Falowen's Ghana-based audience.
// Keep the images illustrative: pictured people are not presented as actual Falowen learners or tutors.
// Pexels free-use photography is incorporated into Falowen-branded designs, not resold alone.
export const SOCIAL_PHOTO_GALLERY = Object.freeze([
  {"id":"accra-tech-class","title":"Accra learning workshop","category":"Ghana & Africa","photoId":33920044,"photographer":"Zeal Creative Studios","tags":"Ghana Accra African adult students computer skills class training","source":"https://www.pexels.com/photo/focused-students-in-it-workshop-in-accra-33920044/"},
  {"id":"african-classroom-notes","title":"Students taking notes","category":"Ghana & Africa","photoId":10614241,"photographer":"Unique Digitals","tags":"Africa African students learning classroom university notes adult education","source":"https://www.pexels.com/photo/people-sitting-on-chair-inside-room-10614241/"},
  {"id":"african-discussion","title":"Learning in class","category":"Ghana & Africa","photoId":10614242,"photographer":"Unique Digitals","tags":"Africa African class lecture young adults studying classroom","source":"https://www.pexels.com/photo/a-people-sitting-in-the-classroom-10614242/"},
  {"id":"study-together-laptop","title":"Study partners at work","category":"Students","photoId":5940845,"photographer":"Kampus Production","tags":"Black African students studying pair teamwork laptop library exams","source":"https://www.pexels.com/photo/black-couple-doing-presentation-for-studies-in-classroom-5940845/"},
  {"id":"learning-group","title":"Working as a team","category":"Students","photoId":5940713,"photographer":"Kampus Production","tags":"Black learners African students group project laptop tutor","source":"https://www.pexels.com/photo/attentive-young-black-groupmates-using-laptop-while-preparing-for-exams-with-anonymous-teacher-5940713/"},
  {"id":"focused-black-student","title":"Focused student","category":"Students","photoId":5940710,"photographer":"Kampus Production","tags":"Black African male student glasses laptop course study","source":"https://www.pexels.com/photo/smart-young-ethnic-guy-browsing-laptop-during-lesson-in-university-5940710/"},
  {"id":"confident-student","title":"A confident learner","category":"Students","photoId":5940834,"photographer":"Kampus Production","tags":"Black African woman student smiling braids college notebook","source":"https://www.pexels.com/photo/cheerful-black-woman-in-glasses-sitting-at-table-in-university-5940834/"},
  {"id":"students-discussion","title":"Learning together","category":"Students","photoId":5940830,"photographer":"Kampus Production","tags":"Black African student university classroom teacher lecture","source":"https://www.pexels.com/photo/black-students-and-teacher-sitting-at-conference-in-university-5940830/"},
  {"id":"studying-with-books","title":"Books and learning","category":"Students","photoId":6281827,"photographer":"Monstera Production","tags":"Black African classmates study books laptop revision","source":"https://www.pexels.com/photo/black-students-sitting-on-floor-during-exam-preparation-together-6281827/"},
  {"id":"student-with-laptop","title":"Learning with technology","category":"Students","photoId":8199137,"photographer":"Yan Krukau","tags":"Black African woman student laptop university afro hair","source":"https://www.pexels.com/photo/close-up-shot-of-a-curly-haired-woman-in-blue-denim-jacket-using-a-laptop-8199137/"},
  {"id":"self-study-library","title":"Independent study","category":"Students","photoId":6279974,"photographer":"Yaroslav Shuraev","tags":"Black African young man tablet laptop study library self learning","source":"https://www.pexels.com/photo/a-man-using-tablet-while-sitting-with-his-feet-on-table-6279974/"},
  {"id":"online-window-notes","title":"Online lesson notes","category":"Online learning","photoId":7584771,"photographer":"Mikhail Nilov","tags":"Black African woman online class notebook study home window","source":"https://www.pexels.com/photo/a-woman-writing-in-notebook-looking-the-laptop-7584771/"},
  {"id":"online-writing-practice","title":"Practising from home","category":"Online learning","photoId":7584726,"photographer":"Mikhail Nilov","tags":"Black African female student studying online writing notes laptop","source":"https://www.pexels.com/photo/a-woman-writing-in-notebook-looking-the-laptop-7584726/"},
  {"id":"online-flexible-learning","title":"Learning anytime","category":"Online learning","photoId":7584770,"photographer":"Mikhail Nilov","tags":"Black African female learner remote learning laptop from home","source":"https://www.pexels.com/photo/a-woman-writing-in-notebook-looking-the-laptop-7584770/"},
  {"id":"online-video-lesson","title":"Joining a video lesson","category":"Online learning","photoId":6281893,"photographer":"Monstera Production","tags":"Black African student hijab online video lesson teacher wave laptop","source":"https://www.pexels.com/photo/smiling-black-student-waving-hand-at-laptop-during-lesson-6281893/"},
  {"id":"focused-online-learner","title":"Concentrating online","category":"Online learning","photoId":6281908,"photographer":"Monstera Production","tags":"Black African woman hijab study books remote lesson laptop","source":"https://www.pexels.com/photo/focused-black-woman-working-on-laptop-6281908/"},
  {"id":"teacher-live-online","title":"Teaching live online","category":"Teachers","photoId":5905713,"photographer":"Katerina Holmes","tags":"Black African woman teacher online classroom laptop teaching","source":"https://www.pexels.com/photo/happy-black-woman-using-laptop-for-online-work-5905713/"},
  {"id":"teacher-explaining","title":"Interactive teaching","category":"Teachers","photoId":5905715,"photographer":"Katerina Holmes","tags":"Black African woman tutor online teaching notes","source":"https://www.pexels.com/photo/serious-black-teacher-giving-mathematics-online-on-laptop-5905715/"},
  {"id":"tutor-preparing","title":"Preparing a lesson","category":"Teachers","photoId":5905839,"photographer":"Katerina Holmes","tags":"Black African tutor female teacher preparing class laptop","source":"https://www.pexels.com/photo/black-woman-at-table-with-laptop-5905839/"},
  {"id":"tutor-planning","title":"Tutor planning a class","category":"Teachers","photoId":5905840,"photographer":"Katerina Holmes","tags":"Black African woman teacher lesson plans laptop teaching classroom","source":"https://www.pexels.com/photo/black-teacher-thinking-while-working-5905840/"},
]);

export const SOCIAL_PHOTO_CATEGORIES = Object.freeze(["All", "Ghana & Africa", "Students", "Online learning", "Teachers"]);
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
