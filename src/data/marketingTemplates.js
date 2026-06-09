export const MARKETING_TEMPLATES = {
  product: [
    { id: "new-product-arrival", name: "New Product Arrival", message: "Hi {customerName}! New at {storeName}: {productName} is now available for {price}. Shop now: {storeLink}" },
    { id: "product-discount", name: "Product Discount", message: "Hi {customerName}! Save {discount} on {productName} at {storeName}. Get yours for {price}: {storeLink}" },
    { id: "limited-stock-alert", name: "Limited Stock Alert", message: "Hi {customerName}! Only a few {productName} are left at {storeName}. Order yours for {price} before they are gone: {storeLink}" },
    { id: "best-seller-promotion", name: "Best Seller Promotion", message: "Hi {customerName}! Our customers love {productName}. Discover this {storeName} best seller for {price}: {storeLink}" },
    { id: "back-in-stock", name: "Back in Stock", message: "Good news, {customerName}! {productName} is back in stock at {storeName}. Shop for {price}: {storeLink}" },
    { id: "thank-you-after-purchase", name: "Thank You After Purchase", message: "Thank you for shopping with {storeName}, {customerName}! We hope you love your {productName}. Need help? Call {phoneNumber}." },
  ],
  service: [
    { id: "book-next-service", name: "Book Your Next Service", message: "Hi {customerName}, ready for your next {serviceName} at {storeName}? Book your appointment here: {bookingLink}" },
    { id: "massage-booking-reminder", name: "Massage Booking Reminder", message: "Hi {customerName}, it is time to relax. Book your next massage at {storeName} for {price}: {bookingLink}" },
    { id: "facial-treatment-promo", name: "Facial Treatment Promo", message: "Treat your skin, {customerName}! Book a {serviceName} at {storeName} for {price}: {bookingLink}" },
    { id: "nails-appointment-promo", name: "Nails Appointment Promo", message: "Fresh nails are one booking away, {customerName}. Reserve your {serviceName} at {storeName}: {bookingLink}" },
    { id: "hair-service-promo", name: "Hair Service Promo", message: "Ready for a fresh look, {customerName}? Book {serviceName} at {storeName} for {price}: {bookingLink}" },
    { id: "service-discount", name: "Service Discount", message: "Hi {customerName}! Enjoy {discount} off {serviceName} at {storeName}. Book now: {bookingLink}" },
    { id: "appointment-reminder", name: "Appointment Reminder", message: "Hi {customerName}, this is your friendly reminder for your {serviceName} appointment at {storeName}. Questions? Call {phoneNumber}." },
    { id: "we-miss-you", name: "We Miss You", message: "We miss you, {customerName}! Come back to {storeName} for your next {serviceName}. Book here: {bookingLink}" },
    { id: "thank-you-after-service", name: "Thank You After Service", message: "Thank you for choosing {storeName}, {customerName}! We hope you enjoyed your {serviceName}. Book your next visit: {bookingLink}" },
  ],
};

export const MARKETING_VARIABLES = [
  "customerName",
  "storeName",
  "productName",
  "serviceName",
  "price",
  "discount",
  "storeLink",
  "bookingLink",
  "phoneNumber",
];

export function renderMarketingMessage(message, values) {
  return MARKETING_VARIABLES.reduce((result, variable) => {
    const value = String(values[variable] || "").trim();
    return result.replaceAll(`{${variable}}`, value || `{${variable}}`);
  }, message || "");
}
