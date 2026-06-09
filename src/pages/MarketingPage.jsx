import { useEffect, useMemo, useState } from "react";
import { MARKETING_TEMPLATES, MARKETING_VARIABLES, renderMarketingMessage } from "../data/marketingTemplates";
import { listMarketingProducts, listMarketingServices } from "../services/marketingService";
import { useToast } from "../context/ToastContext";
import "./MarketingPage.css";

const EMPTY_VALUES = {
  customerName: "",
  storeName: "Sedifex",
  productName: "",
  serviceName: "",
  price: "",
  discount: "",
  storeLink: "",
  bookingLink: "",
  phoneNumber: "",
};

const SAVED_TEMPLATES_KEY = "sedifex.marketing.savedTemplates";

export default function MarketingPage() {
  const toast = useToast();
  const [itemType, setItemType] = useState("product");
  const [selectedTemplateId, setSelectedTemplateId] = useState(MARKETING_TEMPLATES.product[0].id);
  const [message, setMessage] = useState(MARKETING_TEMPLATES.product[0].message);
  const [values, setValues] = useState(EMPTY_VALUES);
  const [items, setItems] = useState({ product: [], service: [] });
  const [loadingItems, setLoadingItems] = useState(true);
  const [selectedItemId, setSelectedItemId] = useState("");

  const templates = MARKETING_TEMPLATES[itemType];
  const preview = useMemo(() => renderMarketingMessage(message, values), [message, values]);
  const relevantVariables = itemType === "product"
    ? ["customerName", "storeName", "productName", "price", "discount", "storeLink", "phoneNumber"]
    : ["customerName", "storeName", "serviceName", "price", "discount", "bookingLink", "phoneNumber"];

  useEffect(() => {
    let active = true;
    Promise.allSettled([listMarketingProducts(), listMarketingServices()]).then(([products, services]) => {
      if (!active) return;
      setItems({
        product: products.status === "fulfilled" ? products.value : [],
        service: services.status === "fulfilled" ? services.value : [],
      });
      setLoadingItems(false);
    });
    return () => { active = false; };
  }, []);

  function changeItemType(nextType) {
    const firstTemplate = MARKETING_TEMPLATES[nextType][0];
    setItemType(nextType);
    setSelectedTemplateId(firstTemplate.id);
    setMessage(firstTemplate.message);
    setSelectedItemId("");
    setValues((current) => ({
      ...current,
      productName: "",
      serviceName: "",
      price: "",
      storeLink: "",
      bookingLink: "",
    }));
  }

  function applyTemplate(templateId) {
    const template = templates.find((entry) => entry.id === templateId);
    if (!template) return;
    setSelectedTemplateId(templateId);
    setMessage(template.message);
  }

  function selectItem(itemId) {
    setSelectedItemId(itemId);
    const item = items[itemType].find((entry) => entry.id === itemId);
    if (!item) return;
    setValues((current) => ({
      ...current,
      [itemType === "product" ? "productName" : "serviceName"]: item.name,
      price: item.price,
      [itemType === "product" ? "storeLink" : "bookingLink"]: item.link,
    }));
  }

  function updateValue(variable, value) {
    setValues((current) => ({ ...current, [variable]: value }));
  }

  async function copyMessage() {
    try {
      await navigator.clipboard.writeText(preview);
      toast.success("Message copied to clipboard.");
    } catch {
      toast.error("Could not copy the message. Please copy it from the preview.");
    }
  }

  function generateWithAi() {
    // TODO: Connect this action to the approved Sedifex AI content-generation endpoint.
    toast.info("AI generation is ready to connect. Your current message has been kept unchanged.");
  }

  function sendToCustomers() {
    // TODO: Connect this action to the Sedifex campaign audience and message-delivery backend.
    toast.info("Customer sending is ready to connect. No messages were sent.");
  }

  function saveTemplate() {
    const savedTemplate = { id: crypto.randomUUID(), itemType, message, savedAt: new Date().toISOString() };
    try {
      const existing = JSON.parse(localStorage.getItem(SAVED_TEMPLATES_KEY) || "[]");
      localStorage.setItem(SAVED_TEMPLATES_KEY, JSON.stringify([...existing, savedTemplate]));
      toast.success("Template saved in this browser.");
    } catch {
      toast.error("Could not save the template in this browser.");
    }
  }

  return (
    <section className="marketing-page">
      <header className="marketing-heading">
        <div>
          <span className="marketing-eyebrow">Sedifex Admin · Marketing</span>
          <h1>Campaign message studio</h1>
          <p>Create a polished product or service message, preview it, and prepare it for your customers.</p>
        </div>
        <span className="marketing-status"><span /> Draft campaign</span>
      </header>

      <div className="marketing-workspace">
        <div className="marketing-editor">
          <section className="marketing-card">
            <div className="marketing-section-heading">
              <div><span>1</span><div><h2>Choose campaign type</h2><p>Templates update to match what you are promoting.</p></div></div>
            </div>
            <div className="marketing-type-selector" role="group" aria-label="Campaign Item Type">
              {[["product", "Product", "Promote inventory items"], ["service", "Service", "Drive new bookings"]].map(([value, label, helper]) => (
                <button key={value} type="button" className={itemType === value ? "active" : ""} onClick={() => changeItemType(value)}>
                  <strong>{label}</strong><small>{helper}</small>
                </button>
              ))}
            </div>
          </section>

          <section className="marketing-card">
            <div className="marketing-section-heading"><div><span>2</span><div><h2>Select a template</h2><p>{itemType === "product" ? "Product marketing" : "Service marketing"} templates</p></div></div></div>
            <div className="marketing-template-grid">
              {templates.map((template) => (
                <button key={template.id} type="button" className={selectedTemplateId === template.id ? "active" : ""} onClick={() => applyTemplate(template.id)}>
                  <span>{template.name}</span><small>{template.message}</small>
                </button>
              ))}
            </div>
          </section>

          <section className="marketing-card">
            <div className="marketing-section-heading"><div><span>3</span><div><h2>Personalize your message</h2><p>Select an item to automatically fill its campaign details.</p></div></div></div>
            <label className="marketing-field marketing-item-picker">
              <span>{itemType === "product" ? "Product from inventory" : "Service from store services"}</span>
              <select value={selectedItemId} onChange={(event) => selectItem(event.target.value)} disabled={loadingItems}>
                <option value="">{loadingItems ? "Loading items…" : `Select a ${itemType}`}</option>
                {items[itemType].map((item) => <option key={item.id} value={item.id}>{item.name}{item.price ? ` · ${item.price}` : ""}</option>)}
              </select>
              {!loadingItems && items[itemType].length === 0 && <small>No {itemType}s found yet. You can still fill the variables below.</small>}
            </label>
            <div className="marketing-fields-grid">
              {relevantVariables.map((variable) => (
                <label className="marketing-field" key={variable}>
                  <span>{variable.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase())}</span>
                  <input value={values[variable]} onChange={(event) => updateValue(variable, event.target.value)} placeholder={`{${variable}}`} />
                </label>
              ))}
            </div>
            <label className="marketing-field marketing-message-field">
              <span>Message template</span>
              <textarea value={message} onChange={(event) => setMessage(event.target.value)} rows="5" />
              <small>Available variables: {MARKETING_VARIABLES.map((variable) => `{${variable}}`).join(", ")}</small>
            </label>
          </section>
        </div>

        <aside className="marketing-preview-card">
          <div className="marketing-preview-heading"><div><span className="marketing-live-dot" /> Live preview</div><small>{preview.length} characters</small></div>
          <div className="marketing-phone-preview">
            <div className="marketing-phone-top"><span>Sedifex</span><small>Campaign preview</small></div>
            <div className="marketing-message-bubble">{preview}</div>
          </div>
          <div className="marketing-actions">
            <button type="button" onClick={copyMessage}>Copy Message</button>
            <button type="button" className="secondary" onClick={generateWithAi}>Generate with AI</button>
            <button type="button" className="secondary" onClick={sendToCustomers}>Send to Customers</button>
            <button type="button" className="ghost" onClick={saveTemplate}>Save Template</button>
          </div>
          <p className="marketing-send-note">Sending and AI generation will remain in draft mode until their backend integrations are enabled.</p>
        </aside>
      </div>
    </section>
  );
}
