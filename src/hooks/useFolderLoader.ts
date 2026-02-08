import { useState, useCallback, useEffect } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { readDir, readFile, DirEntry } from '@tauri-apps/plugin-fs';
import { saveAudio, saveScript, saveProject as saveProjectToDB, getAudioByName, getProjectByName } from "@/lib/db";
import { parseScript } from "@/lib/captionParser";
import { processScriptForVocabulary } from "@/lib/vocabularyProcessor";
import { AudioFile, Script, Project } from "@/types/caption";
import { toast } from 'sonner';

const LAST_FOLDER_KEY = "last-loaded-folder";

interface LoadStats {
    total: number;
    processed: number;
    skipped: number;
    errors: number;
}

interface UseFolderLoaderReturn {
    loadFolder: () => Promise<void>;
    refreshFolder: () => Promise<void>;
    isLoading: boolean;
    progress: { current: number; total: number; filename: string } | null;
    stats: LoadStats | null;
    resetStats: () => void;
    lastFolderPath: string | null;
}

export function useFolderLoader(onProjectLoaded?: () => void): UseFolderLoaderReturn {
    const [isLoading, setIsLoading] = useState(false);
    const [progress, setProgress] = useState<{ current: number; total: number; filename: string } | null>(null);
    const [stats, setStats] = useState<LoadStats | null>(null);
    const [lastFolderPath, setLastFolderPath] = useState<string | null>(() => localStorage.getItem(LAST_FOLDER_KEY));

    const resetStats = useCallback(() => {
        setStats(null);
        setProgress(null);
    }, []);

    const processDirectory = useCallback(async (dirPath: string) => {
        setIsLoading(true);
        resetStats();

        try {
            const entries = await readDir(dirPath);

            const audioExtensions = ['.mp3', '.wav', '.m4a'];
            const scriptExtensions = ['.srt', '.vtt'];

            const audios: DirEntry[] = [];
            const scripts: DirEntry[] = [];

            // Categorize files
            for (const entry of entries) {
                if (entry.isDirectory) continue;

                const name = entry.name.toLowerCase();
                if (audioExtensions.some(ext => name.endsWith(ext))) {
                    audios.push(entry);
                } else if (scriptExtensions.some(ext => name.endsWith(ext))) {
                    scripts.push(entry);
                }
            }

            if (audios.length === 0) {
                toast.info("No audio files found in folder");
                setIsLoading(false);
                return;
            }

            // Process batch
            let skipped = 0;
            let processed = 0;
            let errors = 0;
            const total = audios.length;

            for (let i = 0; i < total; i++) {
                const audioEntry = audios[i];
                setProgress({ current: i + 1, total, filename: audioEntry.name });

                try {
                    const existingAudio = await getAudioByName(audioEntry.name);
                    if (existingAudio) {
                        skipped++;
                        continue;
                    }

                    const audioBaseName = audioEntry.name.substring(0, audioEntry.name.lastIndexOf('.'));
                    const scriptEntry = scripts.find(s => {
                        const scriptName = s.name;
                        if (scriptName.startsWith(audioBaseName + '.')) return true;
                        if (scriptName.includes(audioBaseName) && scriptName.endsWith('.srt')) return true;
                        return false;
                    });

                    if (!scriptEntry) {
                        skipped++;
                        continue;
                    }

                    const projectName = audioBaseName;
                    const existingProject = await getProjectByName(projectName);
                    if (existingProject) {
                        skipped++;
                        continue;
                    }

                    const audioPath = `${dirPath}\\${audioEntry.name}`;
                    const scriptPath = `${dirPath}\\${scriptEntry.name}`;

                    const audioBytes = await readFile(audioPath);
                    const scriptTextBytes = await readFile(scriptPath);

                    const scriptContent = new TextDecoder().decode(scriptTextBytes);
                    const audioBlob = new Blob([audioBytes], { type: 'audio/mpeg' });

                    const audioId = crypto.randomUUID();
                    const scriptId = crypto.randomUUID();
                    const projectId = crypto.randomUUID();

                    const audioFile: AudioFile = {
                        id: audioId,
                        name: audioEntry.name,
                        blob: audioBlob,
                        createdAt: Date.now(),
                    };

                    const parsedScript = parseScript(scriptContent);
                    const script: Script = {
                        id: scriptId,
                        name: scriptEntry.name,
                        sentences: parsedScript,
                        createdAt: Date.now(),
                    };

                    const getAudioDuration = (blob: Blob): Promise<number> => {
                        return new Promise((resolve) => {
                            const url = URL.createObjectURL(blob);
                            const tempAudio = new Audio(url);
                            tempAudio.addEventListener('loadedmetadata', () => {
                                const duration = tempAudio.duration;
                                URL.revokeObjectURL(url);
                                resolve(duration);
                            });
                            // Fallback if metadata fails to load within 2 seconds
                            setTimeout(() => resolve(0), 2000);
                        });
                    };

                    const duration = await getAudioDuration(audioBlob);

                    const project: Project = {
                        id: projectId,
                        name: projectName,
                        audioId,
                        audioName: audioEntry.name,
                        scriptId,
                        createdAt: Date.now(),
                        lastPlayedAt: Date.now(),
                        isFavorite: false,
                        duration,
                    };

                    await saveAudio(audioFile);
                    await saveScript(script);
                    await saveProjectToDB(project);
                    await processScriptForVocabulary(script);

                    processed++;
                } catch (err) {
                    console.error(`Error processing ${audioEntry.name}:`, err);
                    errors++;
                }
            }

            setStats({ total, processed, skipped, errors });

            if (processed > 0 && onProjectLoaded) {
                onProjectLoaded();
            }

            // Save folder path on success
            localStorage.setItem(LAST_FOLDER_KEY, dirPath);
            setLastFolderPath(dirPath);

        } catch (error) {
            console.error("Error processing directory:", error);
            toast.error("Failed to process folder");
        } finally {
            setIsLoading(false);
            setProgress(null);
        }
    }, [onProjectLoaded, resetStats]);

    const loadFolder = useCallback(async () => {
        try {
            const selected = await open({
                directory: true,
                multiple: false,
            });

            if (!selected) return;
            const dirPath = Array.isArray(selected) ? selected[0] : selected;
            await processDirectory(dirPath);
        } catch (error) {
            console.error("Error opening folder picker:", error);
            toast.error("Failed to open folder");
        }
    }, [processDirectory]);

    const refreshFolder = useCallback(async () => {
        const path = localStorage.getItem(LAST_FOLDER_KEY);
        if (!path) {
            toast.error("No folder has been selected yet");
            return;
        }
        await processDirectory(path);
    }, [processDirectory]);

    return { loadFolder, refreshFolder, isLoading, progress, stats, resetStats, lastFolderPath };
}
