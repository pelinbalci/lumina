import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatWordCount(count: number): string {
  return new Intl.NumberFormat().format(count);
}

export function calculateTotalWordCount(chapters: any[]): number {
  return chapters.reduce((total, chapter) => {
    return total + chapter.sections.reduce((sTotal: number, section: any) => sTotal + section.wordCount, 0);
  }, 0);
}
