import { useEffect, useState } from "react";
import bookPromotions from "../data/socialBookPromotions.json";

const store = "https://www.falowen.app";

export default function SocialBookPromotions() {
  const [selection, setSelection] = useState("a1-course-workbook");
  const [preparedShare, setPreparedShare] = useState(null);
  const [message, setMessage] = useState("");
  const book = bookPromotions[selection];
  const imagePath = `/social-books/${selection}.jpg`;
  const productUrl = store + book.href;
  const caption = `${book.title}\n\n${book.description}\n\nView the book: ${productUrl}\n\n#Falowen #LearnGerman #GermanBooks`;

  useEffect(() => {
    if (!navigator.share || !navigator.canShare) return;
    const controller = new AbortController();
    fetch(imagePath, { signal: controller.signal })
      .then(response => {
        if (!response.ok) throw new Error("Image unavailable");
        return response.blob();
      })
      .then(blob => {
        if (controller.signal.aborted) return;
        const file = new File([blob], `falowen-${selection}.jpg`, { type: "image/jpeg" });
        if (navigator.canShare({ files: [file] })) setPreparedShare({ selection, file });
      })
      .catch(() => { /* The direct download remains available. */ });
    return () => controller.abort();
  }, [imagePath, selection]);

  async function copy(value, success) {
    try {
      await navigator.clipboard.writeText(value);
      setMessage(success);
    } catch {
      setMessage("Select the caption or product link and copy it manually.");
    }
  }

  async function shareImage() {
    if (preparedShare?.selection !== selection) return;
    try {
      await navigator.share({ files: [preparedShare.file], title: book.title, text: caption });
    } catch (error) {
      if (error.name !== "AbortError") setMessage("Use Download image and Copy caption to share this book.");
    }
  }

  return (
    <section className="card social-books" aria-labelledby="social-book-heading">
      <header>
        <h2 id="social-book-heading">Book Promotions</h2>
        <p>Choose a Falowen book, download its image, and share it with a caption and product link.</p>
      </header>
      <div className="social-books-grid">
        <div className="social-books-fields">
          <label>Book
            <select value={selection} onChange={event => { setSelection(event.target.value); setMessage(""); }}>
              {Object.entries(bookPromotions).map(([id, item]) => <option key={id} value={id}>{item.title}</option>)}
            </select>
          </label>
          <label>Ready caption<textarea readOnly rows={9} value={caption} /></label>
          <div className="social-books-actions">
            <button type="button" onClick={() => copy(caption, "Caption copied.")}>Copy caption</button>
            <button type="button" onClick={() => copy(productUrl, "Product link copied.")}>Copy link</button>
            <a href={productUrl} target="_blank" rel="noopener noreferrer">View book page</a>
          </div>
          <p role="status">{message}</p>
        </div>
        <div className="social-books-preview">
          <img src={imagePath} alt={book.title + " promotional artwork"} />
          <div className="social-books-actions">
            <a className="social-books-download" href={imagePath} download={`falowen-${selection}.jpg`}>Download image</a>
            {preparedShare?.selection === selection && <button type="button" onClick={shareImage}>Share image</button>}
            <a href={`https://wa.me/?text=${encodeURIComponent(caption)}`} target="_blank" rel="noopener noreferrer">Share caption on WhatsApp</a>
          </div>
        </div>
      </div>
    </section>
  );
}
