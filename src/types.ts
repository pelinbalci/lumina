export interface Section {
  id: string;
  title: string;
  content: string;
  wordCount: number;
  status: 'draft' | 'review' | 'completed';
}

export interface Chapter {
  id: string;
  title: string;
  sections: Section[];
}

export interface ResearchItem {
  id: string;
  title: string;
  link: string;
  notes: string;
  isCompleted: boolean;
  category: string;
}

export interface DailyProgress {
  date: string; // ISO string
  wordCount: number;
  manualLog?: number; // Manual entry for the day
}

export interface Topic {
  id: string;
  title: string;
  description: string;
  chapterId?: string; // Optional link to a chapter
  priority: 'high' | 'medium' | 'low';
  tags: string[];
}

export interface Citation {
  id: string;
  type: 'book' | 'article' | 'web' | 'other';
  author: string;
  title: string;
  year: string;
  publisher?: string;
  journal?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  doi?: string;
  url?: string;
  accessDate?: string;
}

export interface GlossaryTerm {
  id: string;
  term: string;
  definition: string;
  usageNotes?: string;
  category?: string;
}

export interface MindMapNode {
  id: string;
  type: 'chapter' | 'section' | 'topic';
  referenceId: string;
  x: number;
  y: number;
  color?: string;
}

export interface MindMapEdge {
  id: string;
  fromNodeId: string;
  toNodeId: string;
}

export interface BookProject {
  id: string;
  title: string;
  chapters: Chapter[];
  research: ResearchItem[];
  citations: Citation[];
  glossary: GlossaryTerm[];
  topics: Topic[];
  dailyProgress: DailyProgress[];
  targetWordCount: number;
  dailyGoal: number;
  mindMapNodes: MindMapNode[];
  mindMapEdges: MindMapEdge[];
}
