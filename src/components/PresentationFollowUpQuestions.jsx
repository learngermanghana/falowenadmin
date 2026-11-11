import { getPresentationFollowUpQuestions } from "../data/presentationFollowUpQuestions.js";
import "./PresentationFollowUpQuestions.css";

export default function PresentationFollowUpQuestions({ level, day }) {
  const questions=getPresentationFollowUpQuestions(level,day);
  if (!questions.length) return null;
  return <details className={`presenter-follow-up presenter-follow-up--${String(level||"").toLowerCase()}`}>
    <summary>Fragen nach der Präsentation · {questions.length}</summary>
    <ol>{questions.map((question,index)=><li key={`${day}-${index}`}>{question}</li>)}</ol>
  </details>;
}
