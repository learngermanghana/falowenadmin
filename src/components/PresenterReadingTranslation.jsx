export default function PresenterReadingTranslation({translation}) {
  const {target,english,open,toggle}=translation;
  return <aside className="presenter-reading-translation" aria-label="English reading support">
    <div className="presenter-translation-actions">
      <button type="button" disabled={!target || !english} onClick={toggle} aria-expanded={open}>
        {open?'Hide translation':target?'Translate '+target.label:'Select a sentence to translate'}
      </button>
      <small>{target && !english?'English support needs review for this sentence.':target?target.label:'Click a sentence number. English appears only when you choose Translate.'}</small>
    </div>
    {open && <div className="presenter-translation-meaning" lang="en" role="status" aria-live="polite">
      <strong>English meaning</strong><p>{english}</p>
    </div>}
  </aside>;
}
