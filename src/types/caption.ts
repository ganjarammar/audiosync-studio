export interface Word {
  text: string;
  startTime: number;
  endTime: number;
}

export interface Sentence {
  text: string;
  startTime: number;
  endTime: number;
  words: Word[];
}

export interface Script {
  id: string;
  name: string;
  sentences: Sentence[];
  createdAt: number;
}

export interface AudioFile {
  id: string;
  name: string;
  blob: Blob;
  createdAt: number;
}

export interface Project {
  id: string;
  name: string;
  audioId: string;
  scriptId: string;
  createdAt: number;
}
