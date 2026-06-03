import { deleteObject, getBlob, listAll, ref, uploadBytes } from "firebase/storage";
import { storage } from "../firebase";

const TEXT_FILE_RE = /\.(txt|json|csv|md|html|css|js|jsx|ts|tsx|xml|svg|yml|yaml|log)$/i;

function requireStorage() {
  if (!storage) {
    throw new Error("Firebase Storage is not configured for this environment.");
  }
  return storage;
}

export function normalizeStoragePath(path = "") {
  return String(path || "")
    .replace(/^gs:\/\/[^/]+\/?/i, "")
    .replace(/^https?:\/\/firebasestorage\.googleapis\.com\/v0\/b\/[^/]+\/o\//i, "")
    .replace(/\?.*$/, "")
    .split("/")
    .map((part) => {
      try {
        return decodeURIComponent(part);
      } catch {
        return part;
      }
    })
    .join("/")
    .replace(/^\/+/, "")
    .replace(/\/+/g, "/");
}

export function isProbablyTextFile(path = "", contentType = "") {
  const type = String(contentType || "").toLowerCase();
  return type.startsWith("text/") || type.includes("json") || type.includes("xml") || TEXT_FILE_RE.test(path);
}

export function parentPath(path = "") {
  const normalized = normalizeStoragePath(path).replace(/\/$/, "");
  if (!normalized.includes("/")) return "";
  return normalized.slice(0, normalized.lastIndexOf("/") + 1);
}

export async function listStorageFolder(path = "") {
  const folderPath = normalizeStoragePath(path).replace(/\/$/, "");
  const snapshot = await listAll(ref(requireStorage(), folderPath));

  const folders = snapshot.prefixes.map((item) => ({
    type: "folder",
    name: item.name,
    path: item.fullPath.endsWith("/") ? item.fullPath : `${item.fullPath}/`,
  }));

  const files = snapshot.items.map((item) => ({
    type: "file",
    name: item.name,
    path: item.fullPath,
  }));

  return { path: folderPath ? `${folderPath}/` : "", folders, files };
}

export async function loadStorageTextFile(path = "") {
  const filePath = normalizeStoragePath(path);
  if (!filePath || filePath.endsWith("/")) throw new Error("Choose a file path, not a folder.");

  const blob = await getBlob(ref(requireStorage(), filePath));
  if (!isProbablyTextFile(filePath, blob.type)) {
    throw new Error(`This file is ${blob.type || "not a recognized text type"}. Download it instead of editing inline.`);
  }

  const text = await blob.text();
  return { path: filePath, contentType: blob.type || guessContentType(filePath), text, size: blob.size };
}

export async function saveStorageTextFile(path = "", text = "", contentType = "") {
  const filePath = normalizeStoragePath(path);
  if (!filePath || filePath.endsWith("/")) throw new Error("Enter a file path to save.");
  const type = contentType || guessContentType(filePath);
  const blob = new Blob([String(text ?? "")], { type });
  const snapshot = await uploadBytes(ref(requireStorage(), filePath), blob, { contentType: type });
  return { path: snapshot.ref.fullPath, contentType: type, size: snapshot.metadata.size };
}

export async function deleteStoragePath(path = "") {
  const filePath = normalizeStoragePath(path);
  if (!filePath || filePath.endsWith("/")) throw new Error("Choose a file to delete. Use deleteStorageFolder for folder paths.");
  await deleteObject(ref(requireStorage(), filePath));
  return { path: filePath };
}

export async function deleteStorageFolder(path = "") {
  const folderPath = normalizeStoragePath(path).replace(/\/$/, "");
  if (!folderPath) throw new Error("Refusing to delete the bucket root. Open a specific folder first.");

  const deleted = [];
  await deleteFolderContents(folderPath, deleted);
  return { path: `${folderPath}/`, deletedCount: deleted.length };
}

async function deleteFolderContents(path, deleted) {
  const snapshot = await listAll(ref(requireStorage(), path));
  await Promise.all(snapshot.items.map(async (item) => {
    await deleteObject(item);
    deleted.push(item.fullPath);
  }));

  for (const folder of snapshot.prefixes) {
    await deleteFolderContents(folder.fullPath, deleted);
  }
}

function guessContentType(path = "") {
  const lower = path.toLowerCase();
  if (lower.endsWith(".json")) return "application/json";
  if (lower.endsWith(".csv")) return "text/csv";
  if (lower.endsWith(".html")) return "text/html";
  if (lower.endsWith(".css")) return "text/css";
  if (lower.endsWith(".js") || lower.endsWith(".jsx")) return "text/javascript";
  if (lower.endsWith(".svg")) return "image/svg+xml";
  if (lower.endsWith(".xml")) return "application/xml";
  if (lower.endsWith(".md")) return "text/markdown";
  return "text/plain";
}
