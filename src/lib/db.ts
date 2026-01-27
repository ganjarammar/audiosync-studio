import { AudioFile, Script, Project, VocabularyWord, ProcessedScript } from "@/types/caption";

const DB_NAME = "podcastCaptionSync";
const DB_VERSION = 2;

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
      if (!database.objectStoreNames.contains("vocabulary")) {
        database.createObjectStore("vocabulary", { keyPath: "word" });
      }
      if (!database.objectStoreNames.contains("processedScripts")) {
        database.createObjectStore("processedScripts", { keyPath: "scriptId" });
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

// Vocabulary functions
export async function getVocabularyWord(word: string): Promise<VocabularyWord | undefined> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(["vocabulary"], "readonly");
    const store = transaction.objectStore("vocabulary");
    const request = store.get(word);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

export async function getAllVocabulary(): Promise<VocabularyWord[]> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(["vocabulary"], "readonly");
    const store = transaction.objectStore("vocabulary");
    const request = store.getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

export async function saveVocabularyWord(entry: VocabularyWord): Promise<void> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(["vocabulary"], "readwrite");
    const store = transaction.objectStore("vocabulary");
    const request = store.put(entry);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

export async function isScriptProcessed(scriptId: string): Promise<boolean> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(["processedScripts"], "readonly");
    const store = transaction.objectStore("processedScripts");
    const request = store.get(scriptId);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result !== undefined);
  });
}

export async function markScriptProcessed(entry: ProcessedScript): Promise<void> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(["processedScripts"], "readwrite");
    const store = transaction.objectStore("processedScripts");
    const request = store.put(entry);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

export async function clearVocabulary(): Promise<void> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(["vocabulary", "processedScripts"], "readwrite");
    const vocabStore = transaction.objectStore("vocabulary");
    const processedStore = transaction.objectStore("processedScripts");
    
    vocabStore.clear();
    processedStore.clear();
    
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

// Get vocabulary stats without loading all words into memory
export async function getVocabularyStats(): Promise<{
  totalWords: number;
  totalOccurrences: number;
  totalSources: number;
}> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(["vocabulary"], "readonly");
    const store = transaction.objectStore("vocabulary");
    
    let totalWords = 0;
    let totalOccurrences = 0;
    const allSources = new Set<string>();
    
    const request = store.openCursor();
    
    request.onerror = () => reject(request.error);
    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
      if (cursor) {
        const word = cursor.value as VocabularyWord;
        totalWords++;
        totalOccurrences += word.count;
        word.sources.forEach(s => allSources.add(s.scriptId));
        cursor.continue();
      } else {
        resolve({
          totalWords,
          totalOccurrences,
          totalSources: allSources.size,
        });
      }
    };
  });
}

// Get paginated vocabulary sorted by frequency (descending)
export async function getVocabularyPage(
  offset: number,
  limit: number
): Promise<VocabularyWord[]> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(["vocabulary"], "readonly");
    const store = transaction.objectStore("vocabulary");
    const request = store.getAll();
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const allWords = request.result as VocabularyWord[];
      // Sort by frequency ascending (least first - default sort)
      allWords.sort((a, b) => a.count - b.count);
      // Return the requested page
      resolve(allWords.slice(offset, offset + limit));
    };
  });
}
