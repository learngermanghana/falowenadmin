import React from "react";
import LiveClassesPageV2 from "./LiveClassesPageV2.jsx";
import GhanaDateTimeLocalInjector from "../components/GhanaDateTimeLocalInjector.jsx";

export default function LiveClassesPage() {
  return React.createElement(
    React.Fragment,
    null,
    React.createElement(GhanaDateTimeLocalInjector),
    React.createElement(LiveClassesPageV2),
  );
}
