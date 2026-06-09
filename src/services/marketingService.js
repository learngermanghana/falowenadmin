import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";

function normalizeItem(docSnapshot, type) {
  const data = docSnapshot.data() || {};
  return {
    id: docSnapshot.id,
    name: String(data.name || data.title || (type === "product" ? data.productName : data.serviceName) || "Unnamed item"),
    price: data.price == null ? "" : String(data.price),
    link: String(
      type === "product"
        ? data.storeLink || data.productLink || data.link || ""
        : data.bookingLink || data.link || "",
    ),
  };
}

async function listCollections(collectionNames, type) {
  const results = await Promise.allSettled(
    collectionNames.map((collectionName) => getDocs(collection(db, collectionName))),
  );
  const items = results.flatMap((result) => (
    result.status === "fulfilled" ? result.value.docs.map((item) => normalizeItem(item, type)) : []
  ));
  return [...new Map(items.map((item) => [item.id, item])).values()];
}

export function listMarketingProducts() {
  return listCollections(["inventory", "products"], "product");
}

export function listMarketingServices() {
  return listCollections(["storeServices", "services"], "service");
}
