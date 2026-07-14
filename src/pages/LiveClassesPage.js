import React from "react";
import LiveClassLessonDateRepair from "../components/LiveClassLessonDateRepair.jsx";
import GhanaDateTimeLocalInjector from "../components/GhanaDateTimeLocalInjector.jsx";
import LiveClassesPageV2 from "./LiveClassesPageV2.jsx";

export default function LiveClassesPage() {
  return React.createElement(
    React.Fragment,
    null,
    React.createElement(GhanaDateTimeLocalInjector),
    React.createElement(LiveClassLessonDateRepair),
    React.createElement(LiveClassesPageV2),
  );
}
