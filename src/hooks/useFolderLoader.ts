import { useState, useCallback } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { readDir, readFile, DirEntry } from '@tauri-apps/plugin-fs';
import { saveAudio, saveScript, saveProject as saveProjectToDB, getAudioByName, getProjectByName } from "@/lib/db";
import { parseScript } from "@/lib/captionParser";
import { processScriptForVocabulary } from "@/lib/vocabularyProcessor";
import { AudioFile, Script, Project } from "@/types/caption";
import { toast } from 'sonner';

interface LoadStats {
    total: number;
    processed: number;
    skipped: number;
    errors: number;
}

interface UseFolderLoaderReturn {
    loadFolder: () => Promise<void>;
    isLoading: boolean;
    progress: { current: number; total: number; filename: string } | null;
    stats: LoadStats | null;
    resetStats: () => void;
}

export function useFolderLoader(onProjectLoaded?: () => void): UseFolderLoaderReturn {
    const [isLoading, setIsLoading] = useState(false);
    const [progress, setProgress] = useState<{ current: number; total: number; filename: string } | null>(null);
    const [stats, setStats] = useState<LoadStats | null>(null);

    const resetStats = useCallback(() => {
        setStats(null);
        setProgress(null);
    }, []);

    const loadFolder = useCallback(async () => {
        setIsLoading(true);
        resetStats();

        try {
            const selected = await open({
                directory: true,
                multiple: false,
            });

            if (!selected) {
                setIsLoading(false);
                return;
            }

            // Convert to string if it's an array (though multiple: false should return string or null)
            const dirPath = Array.isArray(selected) ? selected[0] : selected;

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
                    // Check for existing audio
                    const existingAudio = await getAudioByName(audioEntry.name);
                    if (existingAudio) {
                        skipped++;
                        continue;
                    }

                    // Find matching script
                    // Logic: 
                    // 1. Exact base name match: "Audio.mp3" matches "Audio.srt"
                    // 2. Suffix match: "Audio.mp3" matches "Audio - turboscribe.ai.srt"

                    const audioBaseName = audioEntry.name.substring(0, audioEntry.name.lastIndexOf('.'));

                    const scriptEntry = scripts.find(s => {
                        const scriptName = s.name;
                        // Check exact match (ignoring extension)
                        if (scriptName.startsWith(audioBaseName + '.')) return true;

                        // Check specific suffixes commonly used
                        if (scriptName.includes(audioBaseName) && scriptName.endsWith('.srt')) return true;

                        return false;
                    });

                    if (!scriptEntry) {
                        // Can't process without script for now (based on app logic requiring both)
                        console.warn(`No matching script found for ${audioEntry.name}`);
                        skipped++; // Or treat as error? treating as skipped for now
                        continue;
                    }

                    // Check for existing project
                    const projectName = audioBaseName;
                    const existingProject = await getProjectByName(projectName);
                    if (existingProject) {
                        skipped++;
                        continue;
                    }

                    // Read and process files
                    const audioPath = `${dirPath}\\${audioEntry.name}`; // Windows path separator
                    const scriptPath = `${dirPath}\\${scriptEntry.name}`;

                    const audioBytes = await readFile(audioPath);
                    const scriptTextBytes = await readFile(scriptPath);

                    // Decode script bytes to text
                    const scriptContent = new TextDecoder().decode(scriptTextBytes);
                    const audioBlob = new Blob([audioBytes], { type: 'audio/mpeg' }); // simplified type

                    // Create objects
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

                    const project: Project = {
                        id: projectId,
                        name: projectName,
                        audioId,
                        scriptId,
                        createdAt: Date.now(),
                        lastPlayedAt: Date.now(),
                        isFavorite: false,
                    };

                    // Save to DB
                    await saveAudio(audioFile);
                    await saveScript(script);
                    await saveProjectToDB(project);

                    // Process Vocabulary
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

        } catch (error) {
            console.error("Error loading folder:", error);
            toast.error("Failed to load folder");
        } finally {
            setIsLoading(false);
            setProgress(null);
        }
    }, [onProjectLoaded, resetStats]);

    return { loadFolder, isLoading, progress, stats, resetStats };
}
