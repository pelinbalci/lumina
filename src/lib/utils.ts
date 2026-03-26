import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';

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

export function formatCitation(citation: any, style: 'APA' | 'MLA' = 'APA'): string {
  const { author, year, title, publisher, journal, volume, issue, pages, url } = citation;
  
  if (style === 'APA') {
    let base = `${author} (${year}). ${title}.`;
    if (journal) {
      base += ` ${journal}`;
      if (volume) {
        base += `, ${volume}`;
        if (issue) base += `(${issue})`;
      }
      if (pages) base += `, ${pages}`;
    } else if (publisher) {
      base += ` ${publisher}.`;
    }
    if (url) base += ` Retrieved from ${url}`;
    return base;
  } else {
    // Basic MLA
    let base = `${author}. "${title}."`;
    if (journal) {
      base += ` ${journal}, vol. ${volume || '?'}, no. ${issue || '?'}, ${year}, pp. ${pages || '?'}.`;
    } else if (publisher) {
      base += ` ${publisher}, ${year}.`;
    }
    if (url) base += ` ${url}.`;
    return base;
  }
}

export async function exportToWord(project: any) {
  const { citations, glossary, title } = project;

  const children: any[] = [
    new Paragraph({
      text: `${title} - Project Assets`,
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({ text: "" }), // Spacer
  ];

  // Citations Section
  if (citations.length > 0) {
    children.push(
      new Paragraph({
        text: "Citations & References",
        heading: HeadingLevel.HEADING_2,
      }),
      new Paragraph({ text: "" })
    );

    citations.forEach((cit: any) => {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: formatCitation(cit, 'APA'),
              size: 24,
            }),
          ],
          spacing: { after: 200 },
        })
      );
    });
  }

  // Glossary Section
  if (glossary.length > 0) {
    children.push(
      new Paragraph({
        text: "Glossary & Terminology",
        heading: HeadingLevel.HEADING_2,
      }),
      new Paragraph({ text: "" })
    );

    glossary.forEach((item: any) => {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: item.term,
              bold: true,
              size: 24,
            }),
            new TextRun({
              text: `: ${item.definition}`,
              size: 24,
            }),
          ],
          spacing: { after: 100 },
        })
      );
      if (item.usageNotes) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `Note: ${item.usageNotes}`,
                italics: true,
                size: 20,
              }),
            ],
            spacing: { after: 200 },
          })
        );
      }
    });
  }

  const doc = new Document({
    sections: [{
      children: children,
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${title.replace(/\s+/g, '_')}_Assets.docx`);
}
