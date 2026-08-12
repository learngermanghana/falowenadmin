import React from "react";
import LiveClassLessonDateRepair from "../components/LiveClassLessonDateRepair.jsx";
import LiveClassReminderDiagnostic from "../components/LiveClassReminderDiagnostic.jsx";
import GhanaDateTimeLocalInjector from "../components/GhanaDateTimeLocalInjector.jsx";
import LiveClassesPageV2 from "./LiveClassesPageV2.jsx";

const TAB_STORAGE_KEY = "falowen-live-classes-primary-tab";
const TAB_REPAIR = "repair";
const TAB_CLASSES = "classes";

function initialTab() {
  if (typeof window === "undefined") return TAB_CLASSES;
  const stored = window.localStorage.getItem(TAB_STORAGE_KEY);
  return stored === TAB_REPAIR ? TAB_REPAIR : TAB_CLASSES;
}

function tabButtonStyle(active) {
  return {
    flex: "1 1 260px",
    minHeight: 46,
    borderRadius: 10,
    border: active ? "1px solid #2563eb" : "1px solid #cbd5e1",
    background: active ? "#2563eb" : "#ffffff",
    color: active ? "#ffffff" : "#172033",
    fontWeight: 700,
    cursor: "pointer",
    padding: "10px 16px",
  };
}

export default function LiveClassesPage() {
  const [activeTab, setActiveTab] = React.useState(initialTab);

  function selectTab(nextTab) {
    setActiveTab(nextTab);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(TAB_STORAGE_KEY, nextTab);
    }
  }

  return React.createElement(
    React.Fragment,
    null,
    React.createElement(GhanaDateTimeLocalInjector),
    React.createElement(
      "section",
      {
        className: "card",
        style: {
          display: "grid",
          gap: 10,
          marginBottom: 16,
          padding: 14,
          position: "relative",
          zIndex: 1,
        },
      },
      React.createElement(
        "div",
        {
          role: "tablist",
          "aria-label": "Live Classes sections",
          style: { display: "flex", flexWrap: "wrap", gap: 10 },
        },
        React.createElement(
          "button",
          {
            type: "button",
            role: "tab",
            id: "live-classes-tab-repair",
            "aria-selected": activeTab === TAB_REPAIR,
            "aria-controls": "live-classes-panel-repair",
            onClick: () => selectTab(TAB_REPAIR),
            style: tabButtonStyle(activeTab === TAB_REPAIR),
          },
          "Official class timetable repair",
        ),
        React.createElement(
          "button",
          {
            type: "button",
            role: "tab",
            id: "live-classes-tab-classes",
            "aria-selected": activeTab === TAB_CLASSES,
            "aria-controls": "live-classes-panel-classes",
            onClick: () => selectTab(TAB_CLASSES),
            style: tabButtonStyle(activeTab === TAB_CLASSES),
          },
          "Live Classes",
        ),
      ),
      React.createElement(
        "small",
        { style: { color: "#64748b" } },
        activeTab === TAB_REPAIR
          ? "Inspect and restore lesson dates from the saved weekly timetable, then diagnose class reminder delivery."
          : "Manage classes, sessions, students, attendance links and related class operations.",
      ),
    ),
    activeTab === TAB_REPAIR
      ? React.createElement(
        "div",
        {
          id: "live-classes-panel-repair",
          role: "tabpanel",
          "aria-labelledby": "live-classes-tab-repair",
        },
        React.createElement(LiveClassLessonDateRepair),
        React.createElement(LiveClassReminderDiagnostic),
      )
      : React.createElement(
        "div",
        {
          id: "live-classes-panel-classes",
          role: "tabpanel",
          "aria-labelledby": "live-classes-tab-classes",
        },
        React.createElement(LiveClassesPageV2),
      ),
  );
}
