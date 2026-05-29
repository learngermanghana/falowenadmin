import { useEffect } from "react";

export default function RemoveMarkingQueueFilters() {
  useEffect(() => {
    const removeFilterBlock = () => {
      const headings = Array.from(document.querySelectorAll("h3"));
      const filterHeading = headings.find((heading) => heading.textContent?.trim() === "Marking queue filters");
      const section = filterHeading?.closest("section");
      if (section) section.remove();
    };

    removeFilterBlock();
    const observer = new MutationObserver(removeFilterBlock);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return null;
}
