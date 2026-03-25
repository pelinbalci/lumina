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

export interface BookProject {
  id: string;
  title: string;
  chapters: Chapter[];
  research: ResearchItem[];
  topics: Topic[]; // New: Brain Dump topics
  dailyProgress: DailyProgress[];
  targetWordCount: number;
  dailyGoal: number; // Daily word count goal
}
