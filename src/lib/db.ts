import { AudioFile, Script, Project } from "@/types/caption";

const DB_NAME = "podcastCaptionSync";
const DB_VERSION = 1;

let db: IDBDatabase | null = null;

export async function initDB(): Promise<IDBDatabase> {
  if (db) return db;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;

      if (!database.objectStoreNames.contains("audio")) {
        database.createObjectStore("audio", { keyPath: "id" });
      }
      if (!database.objectStoreNames.contains("scripts")) {
        database.createObjectStore("scripts", { keyPath: "id" });
      }
      if (!database.objectStoreNames.contains("projects")) {
        database.createObjectStore("projects", { keyPath: "id" });
      }
    };
  });
}

export async function saveAudio(audio: AudioFile): Promise<void> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(["audio"], "readwrite");
    const store = transaction.objectStore("audio");
    const request = store.put(audio);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

export async function getAudio(id: string): Promise<AudioFile | undefined> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(["audio"], "readonly");
    const store = transaction.objectStore("audio");
    const request = store.get(id);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

export async function getAllAudio(): Promise<AudioFile[]> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(["audio"], "readonly");
    const store = transaction.objectStore("audio");
    const request = store.getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

export async function saveScript(script: Script): Promise<void> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(["scripts"], "readwrite");
    const store = transaction.objectStore("scripts");
    const request = store.put(script);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

export async function getScript(id: string): Promise<Script | undefined> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(["scripts"], "readonly");
    const store = transaction.objectStore("scripts");
    const request = store.get(id);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

export async function getAllScripts(): Promise<Script[]> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(["scripts"], "readonly");
    const store = transaction.objectStore("scripts");
    const request = store.getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

export async function saveProject(project: Project): Promise<void> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(["projects"], "readwrite");
    const store = transaction.objectStore("projects");
    const request = store.put(project);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

export async function getAllProjects(): Promise<Project[]> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(["projects"], "readonly");
    const store = transaction.objectStore("projects");
    const request = store.getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

export async function deleteAudio(id: string): Promise<void> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(["audio"], "readwrite");
    const store = transaction.objectStore("audio");
    const request = store.delete(id);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

export async function deleteScript(id: string): Promise<void> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(["scripts"], "readwrite");
    const store = transaction.objectStore("scripts");
    const request = store.delete(id);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

export async function deleteProject(id: string): Promise<void> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(["projects"], "readwrite");
    const store = transaction.objectStore("projects");
    const request = store.delete(id);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

export async function getProject(id: string): Promise<Project | undefined> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(["projects"], "readonly");
    const store = transaction.objectStore("projects");
    const request = store.get(id);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}
