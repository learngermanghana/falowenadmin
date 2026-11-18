import { getCourseSessionGroups } from "../data/courseSessionGroups.js";

// Build the audio selector from the official course-session dictionary.
// Retired classroom slide IDs must not appear as duplicate or merged lessons.
export function getGrammarAudioLessonCatalog(slidesByCourse) {
  const options = [];
  for (const course of ["A1", "A2", "B1", "B2", "C1", "C2"]) {
    const slides = slidesByCourse(course);
    if (course === "A1") {
      const canonical = new Map(slides.map(slide => [String(slide.assignmentId || "").toUpperCase(), slide]));
      for (const group of getCourseSessionGroups("A1")) {
        if (!group.assignmentIds.length || group.day === 0) continue;
        const selected = group.assignmentIds.map(id => canonical.get(id.toUpperCase())).filter(Boolean);
        if (!selected.length) continue;
        const title = group.titles.join(" + ");
        options.push({
          id: "A1:day:" + group.day,
          course,
          day: group.day,
          title: "A1 · Day " + group.day + " · " + title,
          assignments: group.assignmentIds,
          lessons: selected,
        });
      }
    } else {
      for (const slide of slides) {
        options.push({
          id: course + ":assignment:" + slide.assignmentId,
          course,
          day: slide.dayNumber,
          title: course + " · " + slide.day + " · " + (slide.topic || slide.title),
          assignments: [slide.assignmentId],
          lessons: [slide],
        });
      }
    }
  }
  return options;
}
