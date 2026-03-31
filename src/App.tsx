import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  BookOpen, 
  Search, 
  Settings, 
  Plus, 
  ChevronRight, 
  CheckCircle2, 
  Clock, 
  BarChart3,
  ExternalLink,
  Trash2,
  Save,
  FileText,
  ChevronUp,
  ChevronDown,
  Target,
  History,
  Lightbulb,
  Tag,
  ArrowRight,
  Quote,
  Copy,
  BookMarked,
  Languages,
  Info,
  Download,
  GitGraph,
  Upload,
  ShieldCheck
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { Stage, Layer, Rect, Text, Line as KonvaLine, Group, Circle } from 'react-konva';
import { format, subDays, isSameDay, parseISO, startOfDay } from 'date-fns';
import { cn, formatWordCount, calculateTotalWordCount, formatCitation, exportToWord } from './lib/utils';
import { BookProject, Chapter, Section, ResearchItem, DailyProgress, Topic, Citation, GlossaryTerm, MindMapNode, MindMapEdge } from './types';

// Initial dummy data
const INITIAL_DATA: BookProject = {
  id: '1',
  title: 'The Future of Deep Learning',
  targetWordCount: 50000,
  dailyGoal: 1000,
  chapters: [
    {
      id: 'c1',
      title: 'Introduction: The Neural Revolution',
      sections: [
        { id: 's1', title: 'A Brief History', content: 'In the early days of computing...', wordCount: 1200, status: 'completed' },
        { id: 's2', title: 'The Current Landscape', content: 'Today, deep learning is everywhere...', wordCount: 850, status: 'review' }
      ]
    },
    {
      id: 'c2',
      title: 'Architectures of Tomorrow',
      sections: [
        { id: 's3', title: 'Transformers and Beyond', content: 'Attention is all you need...', wordCount: 2100, status: 'draft' }
      ]
    }
  ],
  research: [
    { id: 'r1', title: 'Attention Mechanism Paper', link: 'https://arxiv.org/abs/1706.03762', notes: 'Key reference for Chapter 2', isCompleted: true, category: 'Academic' },
    { id: 'r2', title: 'Scaling Laws for LLMs', link: 'https://arxiv.org/abs/2001.08361', notes: 'Need to summarize the compute vs data trade-offs', isCompleted: false, category: 'Academic' }
  ],
  citations: [
    { 
      id: 'cit1', 
      type: 'book', 
      author: 'Vaswani, A.', 
      title: 'Attention is All You Need', 
      year: '2017', 
      publisher: 'NIPS',
      url: 'https://arxiv.org/abs/1706.03762'
    }
  ],
  glossary: [
    { id: 'g1', term: 'Transformer', definition: 'A deep learning architecture based on the attention mechanism.', category: 'Architecture' },
    { id: 'g2', term: 'Self-Attention', definition: 'A mechanism that relates different positions of a single sequence in order to compute a representation of the sequence.', category: 'Mechanism' }
  ],
  topics: [
    { id: 't1', title: 'Ethical Implications of AGI', description: 'How do we ensure alignment?', priority: 'high', tags: ['Ethics', 'Future'] },
    { id: 't2', title: 'Energy Consumption of Training', description: 'Environmental impact of large models', priority: 'medium', tags: ['Environment', 'Hardware'] }
  ],
  dailyProgress: [
    { date: subDays(new Date(), 6).toISOString(), wordCount: 450, manualLog: 0 },
    { date: subDays(new Date(), 5).toISOString(), wordCount: 800, manualLog: 0 },
    { date: subDays(new Date(), 4).toISOString(), wordCount: 1200, manualLog: 0 },
    { date: subDays(new Date(), 3).toISOString(), wordCount: 950, manualLog: 0 },
    { date: subDays(new Date(), 2).toISOString(), wordCount: 1500, manualLog: 0 },
    { date: subDays(new Date(), 1).toISOString(), wordCount: 2100, manualLog: 0 },
    { date: new Date().toISOString(), wordCount: 1800, manualLog: 0 }
  ],
  mindMapNodes: [
    { id: 'n1', type: 'chapter', referenceId: 'c1', x: 100, y: 100 },
    { id: 'n2', type: 'chapter', referenceId: 'c2', x: 400, y: 100 }
  ],
  mindMapEdges: []
};

export default function App() {
  const [project, setProject] = useState<BookProject>(() => {
    const saved = localStorage.getItem('lumina_project');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Merge with INITIAL_DATA to ensure new properties like 'topics' exist
      return {
        ...INITIAL_DATA,
        ...parsed,
        // Ensure arrays exist even if missing in parsed data
        chapters: parsed.chapters || INITIAL_DATA.chapters,
        research: parsed.research || INITIAL_DATA.research,
        citations: parsed.citations || INITIAL_DATA.citations || [],
        glossary: parsed.glossary || INITIAL_DATA.glossary || [],
        topics: parsed.topics || INITIAL_DATA.topics || [],
        dailyProgress: parsed.dailyProgress || INITIAL_DATA.dailyProgress || [],
        mindMapNodes: (parsed.mindMapNodes || INITIAL_DATA.mindMapNodes).map((n: any) => {
          if (n.chapterId) {
            return { id: n.id, type: 'chapter', referenceId: n.chapterId, x: n.x, y: n.y };
          }
          return n;
        }),
        mindMapEdges: parsed.mindMapEdges || INITIAL_DATA.mindMapEdges || []
      };
    }
    return INITIAL_DATA;
  });
  const [activeTab, setActiveTab] = useState<'dashboard' | 'manuscript' | 'research' | 'braindump' | 'citations' | 'glossary' | 'logic'>('dashboard');
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('lumina_project', JSON.stringify(project));
  }, [project]);

  const totalWords = useMemo(() => calculateTotalWordCount(project.chapters), [project.chapters]);
  const progressPercent = Math.min(Math.round((totalWords / project.targetWordCount) * 100), 100);

  const handleUpdateSection = (sectionId: string, updates: Partial<Section>) => {
    setProject(prev => ({
      ...prev,
      chapters: prev.chapters.map(chapter => ({
        ...chapter,
        sections: chapter.sections.map(section => 
          section.id === sectionId ? { ...section, ...updates } : section
        )
      }))
    }));
  };

  const handleAddChapter = () => {
    const newChapter: Chapter = {
      id: `c${Date.now()}`,
      title: 'New Chapter',
      sections: []
    };
    setProject(prev => ({ ...prev, chapters: [...prev.chapters, newChapter] }));
  };

  const handleAddSection = (chapterId: string) => {
    const newSection: Section = {
      id: `s${Date.now()}`,
      title: 'New Section',
      content: '',
      wordCount: 0,
      status: 'draft'
    };
    setProject(prev => ({
      ...prev,
      chapters: prev.chapters.map(chapter => 
        chapter.id === chapterId ? { ...chapter, sections: [...chapter.sections, newSection] } : chapter
      )
    }));
    setSelectedSectionId(newSection.id);
  };

  const handleReorderChapter = (idx: number, direction: 'up' | 'down') => {
    const newChapters = [...project.chapters];
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= newChapters.length) return;
    [newChapters[idx], newChapters[targetIdx]] = [newChapters[targetIdx], newChapters[idx]];
    setProject(prev => ({ ...prev, chapters: newChapters }));
  };

  const handleReorderSection = (chapterId: string, idx: number, direction: 'up' | 'down') => {
    setProject(prev => ({
      ...prev,
      chapters: prev.chapters.map(chapter => {
        if (chapter.id !== chapterId) return chapter;
        const newSections = [...chapter.sections];
        const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
        if (targetIdx < 0 || targetIdx >= newSections.length) return chapter;
        [newSections[idx], newSections[targetIdx]] = [newSections[targetIdx], newSections[idx]];
        return { ...chapter, sections: newSections };
      })
    }));
  };

  const handleDeleteChapter = (chapterId: string) => {
    if (!confirm('Are you sure you want to delete this chapter and all its sections?')) return;
    setProject(prev => ({
      ...prev,
      chapters: prev.chapters.filter(c => c.id !== chapterId),
      mindMapNodes: prev.mindMapNodes.filter(n => !(n.type === 'chapter' && n.referenceId === chapterId))
    }));
  };

  const handleDeleteSection = (chapterId: string, sectionId: string) => {
    if (!confirm('Are you sure you want to delete this section?')) return;
    setProject(prev => ({
      ...prev,
      chapters: prev.chapters.map(chapter => 
        chapter.id === chapterId 
          ? { ...chapter, sections: chapter.sections.filter(s => s.id !== sectionId) } 
          : chapter
      ),
      mindMapNodes: prev.mindMapNodes.filter(n => !(n.type === 'section' && n.referenceId === sectionId))
    }));
    if (selectedSectionId === sectionId) {
      setSelectedSectionId(null);
    }
  };

  const handleLogDailyWords = (words: number) => {
    const today = startOfDay(new Date()).toISOString();
    setProject(prev => {
      const existing = prev.dailyProgress.find(p => isSameDay(parseISO(p.date), new Date()));
      if (existing) {
        return {
          ...prev,
          dailyProgress: prev.dailyProgress.map(p => 
            isSameDay(parseISO(p.date), new Date()) ? { ...p, manualLog: (p.manualLog || 0) + words } : p
          )
        };
      } else {
        return {
          ...prev,
          dailyProgress: [...prev.dailyProgress, { date: today, wordCount: 0, manualLog: words }]
        };
      }
    });
  };

  const handleExportProject = () => {
    const dataStr = JSON.stringify(project, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `${project.title.replace(/\s+/g, '_')}_Backup_${format(new Date(), 'yyyy-MM-dd')}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleImportProject = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedProject = JSON.parse(event.target?.result as string);
        // Basic validation
        if (importedProject.title && Array.isArray(importedProject.chapters)) {
          setProject(importedProject);
          alert('Project restored successfully!');
        } else {
          alert('Invalid project file format.');
        }
      } catch (error) {
        alert('Error reading project file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex h-screen bg-[#F5F5F5] text-[#1A1A1A] font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6">
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white">L</div>
            Lumina
          </h1>
        </div>
        
        <nav className="flex-1 px-4 space-y-1">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              activeTab === 'dashboard' ? "bg-black text-white" : "text-gray-600 hover:bg-gray-100"
            )}
          >
            <LayoutDashboard size={18} />
            Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('manuscript')}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              activeTab === 'manuscript' ? "bg-black text-white" : "text-gray-600 hover:bg-gray-100"
            )}
          >
            <BookOpen size={18} />
            Manuscript
          </button>
          <button 
            onClick={() => setActiveTab('research')}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              activeTab === 'research' ? "bg-black text-white" : "text-gray-600 hover:bg-gray-100"
            )}
          >
            <Search size={18} />
            Research
          </button>
          <button 
            onClick={() => setActiveTab('citations')}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              activeTab === 'citations' ? "bg-black text-white" : "text-gray-600 hover:bg-gray-100"
            )}
          >
            <Quote size={18} />
            Citations
          </button>
          <button 
            onClick={() => setActiveTab('glossary')}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              activeTab === 'glossary' ? "bg-black text-white" : "text-gray-600 hover:bg-gray-100"
            )}
          >
            <Languages size={18} />
            Glossary
          </button>
          <button 
            onClick={() => setActiveTab('logic')}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              activeTab === 'logic' ? "bg-black text-white" : "text-gray-600 hover:bg-gray-100"
            )}
          >
            <GitGraph size={18} />
            Logic Flow
          </button>
          <button 
            onClick={() => setActiveTab('braindump')}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              activeTab === 'braindump' ? "bg-black text-white" : "text-gray-600 hover:bg-gray-100"
            )}
          >
            <Lightbulb size={18} />
            Brain Dump
          </button>
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Progress</span>
              <span className="text-xs font-bold">{progressPercent}%</span>
            </div>
            <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-black transition-all duration-500" 
                style={{ width: `${progressPercent}%` }} 
              />
            </div>
            <p className="mt-2 text-[11px] text-gray-500">
              {formatWordCount(totalWords)} / {formatWordCount(project.targetWordCount)} words
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {activeTab === 'dashboard' && (
          <Dashboard 
            project={project} 
            onLogWords={handleLogDailyWords}
            onUpdateGoal={(goal) => setProject(prev => ({ ...prev, dailyGoal: goal }))}
            onBackup={handleExportProject}
            onRestore={handleImportProject}
          />
        )}
        {activeTab === 'manuscript' && (
          <Manuscript 
            project={project} 
            selectedSectionId={selectedSectionId}
            setSelectedSectionId={setSelectedSectionId}
            onUpdateSection={handleUpdateSection}
            onAddChapter={handleAddChapter}
            onAddSection={handleAddSection}
            onDeleteChapter={handleDeleteChapter}
            onDeleteSection={handleDeleteSection}
            onReorderChapter={handleReorderChapter}
            onReorderSection={handleReorderSection}
            onUpdateChapterTitle={(id, title) => setProject(prev => ({
              ...prev,
              chapters: prev.chapters.map(c => c.id === id ? { ...c, title } : c)
            }))}
            onExport={() => exportToWord(project)}
          />
        )}
        {activeTab === 'research' && (
          <Research 
            research={project.research} 
            onToggle={(id) => setProject(prev => ({
              ...prev,
              research: prev.research.map(item => item.id === id ? { ...item, isCompleted: !item.isCompleted } : item)
            }))} 
            onAdd={(item) => setProject(prev => ({ ...prev, research: [...prev.research, item] }))}
          />
        )}
        {activeTab === 'citations' && (
          <CitationManager 
            citations={project.citations}
            onAdd={(citation) => setProject(prev => ({ ...prev, citations: [...prev.citations, citation] }))}
            onDelete={(id) => setProject(prev => ({ ...prev, citations: prev.citations.filter(c => c.id !== id) }))}
            onExport={() => exportToWord(project)}
          />
        )}
        {activeTab === 'glossary' && (
          <GlossaryManager 
            glossary={project.glossary}
            onAdd={(term) => setProject(prev => ({ ...prev, glossary: [...prev.glossary, term] }))}
            onUpdate={(id, updates) => setProject(prev => ({
              ...prev,
              glossary: prev.glossary.map(t => t.id === id ? { ...t, ...updates } : t)
            }))}
            onDelete={(id) => setProject(prev => ({ ...prev, glossary: prev.glossary.filter(t => t.id !== id) }))}
            onExport={() => exportToWord(project)}
          />
        )}
        {activeTab === 'logic' && (
          <MindMap 
            project={project}
            onUpdateNodes={(nodes) => setProject(prev => ({ ...prev, mindMapNodes: nodes }))}
            onUpdateEdges={(edges) => setProject(prev => ({ ...prev, mindMapEdges: edges }))}
          />
        )}
        {activeTab === 'braindump' && (
          <BrainDump 
            topics={project.topics}
            chapters={project.chapters}
            onAdd={(topic) => setProject(prev => ({ ...prev, topics: [...prev.topics, topic] }))}
            onUpdate={(id, updates) => setProject(prev => ({
              ...prev,
              topics: prev.topics.map(t => t.id === id ? { ...t, ...updates } : t)
            }))}
            onDelete={(id) => setProject(prev => ({
              ...prev,
              topics: prev.topics.filter(t => t.id !== id)
            }))}
            onLinkToChapter={(topicId, chapterId) => {
              const topic = project.topics.find(t => t.id === topicId);
              if (!topic) return;
              
              // Add as a new section to the chapter
              const newSection: Section = {
                id: `s${Date.now()}`,
                title: topic.title,
                content: topic.description,
                wordCount: topic.description.split(/\s+/).filter(Boolean).length,
                status: 'draft'
              };

              setProject(prev => ({
                ...prev,
                chapters: prev.chapters.map(c => c.id === chapterId ? { ...c, sections: [...c.sections, newSection] } : c),
                topics: prev.topics.filter(t => t.id !== topicId) // Remove from brain dump after linking
              }));
              setActiveTab('manuscript');
              setSelectedSectionId(newSection.id);
            }}
          />
        )}
      </main>
    </div>
  );
}

function MindMap({
  project,
  onUpdateNodes,
  onUpdateEdges
}: {
  project: BookProject;
  onUpdateNodes: (nodes: MindMapNode[]) => void;
  onUpdateEdges: (edges: MindMapEdge[]) => void;
}) {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [edgeStartNodeId, setEdgeStartNodeId] = useState<string | null>(null);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });

  const COLORS = [
    { name: 'Default', value: undefined },
    { name: 'White', value: '#FFFFFF' },
    { name: 'Gray', value: '#F3F4F6' },
    { name: 'Amber', value: '#FEF3C7' },
    { name: 'Blue', value: '#DBEAFE' },
    { name: 'Green', value: '#DCFCE7' },
    { name: 'Red', value: '#FEE2E2' },
    { name: 'Purple', value: '#F3E8FF' },
  ];

  useEffect(() => {
    if (containerRef.current) {
      setDimensions({
        width: containerRef.current.offsetWidth,
        height: containerRef.current.offsetHeight
      });
    }
  }, []);

  // Ensure all chapters, sections, and topics have nodes
  useEffect(() => {
    const existingNodes = project.mindMapNodes;
    const newNodes = [...existingNodes];
    let changed = false;

    // Chapters
    project.chapters.forEach((c, idx) => {
      if (!existingNodes.find(n => n.type === 'chapter' && n.referenceId === c.id)) {
        newNodes.push({
          id: `n_c_${c.id}`,
          type: 'chapter',
          referenceId: c.id,
          x: 100 + (idx * 40),
          y: 100 + (idx * 40)
        });
        changed = true;
      }
    });

    // Sections
    project.chapters.forEach((c, cIdx) => {
      c.sections.forEach((s, sIdx) => {
        if (!existingNodes.find(n => n.type === 'section' && n.referenceId === s.id)) {
          newNodes.push({
            id: `n_s_${s.id}`,
            type: 'section',
            referenceId: s.id,
            x: 300 + (sIdx * 40),
            y: 100 + (cIdx * 100) + (sIdx * 30)
          });
          changed = true;
        }
      });
    });

    // Topics (Brain Dump)
    project.topics.forEach((t, idx) => {
      if (!existingNodes.find(n => n.type === 'topic' && n.referenceId === t.id)) {
        newNodes.push({
          id: `n_t_${t.id}`,
          type: 'topic',
          referenceId: t.id,
          x: 500 + (idx * 40),
          y: 100 + (idx * 40)
        });
        changed = true;
      }
    });

    if (changed) {
      onUpdateNodes(newNodes);
    }
  }, [project.chapters, project.topics, project.mindMapNodes, onUpdateNodes]);

  const handleDragEnd = (nodeId: string, e: any) => {
    const updatedNodes = project.mindMapNodes.map(n => 
      n.id === nodeId ? { ...n, x: e.target.x(), y: e.target.y() } : n
    );
    onUpdateNodes(updatedNodes);
  };

  const handleNodeClick = (nodeId: string) => {
    if (edgeStartNodeId) {
      if (edgeStartNodeId !== nodeId) {
        // Create edge
        const newEdge: MindMapEdge = {
          id: `e${Date.now()}`,
          fromNodeId: edgeStartNodeId,
          toNodeId: nodeId
        };
        onUpdateEdges([...project.mindMapEdges, newEdge]);
      }
      setEdgeStartNodeId(null);
    } else {
      setSelectedNodeId(nodeId);
    }
  };

  const handleNodeDoubleClick = (nodeId: string) => {
    setEdgeStartNodeId(nodeId);
    setSelectedNodeId(null);
  };

  const handleDeleteEdge = (edgeId: string) => {
    onUpdateEdges(project.mindMapEdges.filter(e => e.id !== edgeId));
  };

  const handleUpdateColor = (color: string | undefined) => {
    if (!selectedNodeId) return;
    onUpdateNodes(project.mindMapNodes.map(n => 
      n.id === selectedNodeId ? { ...n, color } : n
    ));
  };

  const getNodeData = (node: MindMapNode) => {
    let baseData: { title: string, color: string, stroke: string } | null = null;
    
    if (node.type === 'chapter') {
      const chapter = project.chapters.find(c => c.id === node.referenceId);
      if (chapter) baseData = { title: chapter.title, color: '#FFFFFF', stroke: '#000000' };
    } else if (node.type === 'section') {
      for (const chapter of project.chapters) {
        const section = chapter.sections.find(s => s.id === node.referenceId);
        if (section) {
          baseData = { title: section.title, color: '#F3F4F6', stroke: '#9CA3AF' };
          break;
        }
      }
    } else if (node.type === 'topic') {
      const topic = project.topics.find(t => t.id === node.referenceId);
      if (topic) baseData = { title: topic.title, color: '#FEF3C7', stroke: '#F59E0B' };
    }

    if (baseData && node.color) {
      baseData.color = node.color;
    }
    
    return baseData;
  };

  const NODE_WIDTH = 160;
  const NODE_HEIGHT = 60;

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <header className="p-8 pb-4 flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Logic Flow</h2>
          <p className="text-gray-500 mt-1">Visualize connections and narrative progression</p>
          <div className="mt-4 flex flex-wrap gap-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-white border border-black rounded" /> Chapter
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-100 border border-gray-400 rounded" /> Section
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-amber-100 border border-amber-500 rounded" /> Brain Dump
            </div>
            <div className="flex items-center gap-2 ml-4">
              <div className="w-3 h-3 border-2 border-black rounded-full" /> Double-click to connect
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-black rounded" /> Drag stage to pan
            </div>
          </div>
        </div>
        
        {selectedNodeId && (
          <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
            <span className="text-[10px] font-bold uppercase text-gray-400">Color:</span>
            <div className="flex gap-1">
              {COLORS.map(c => (
                <button 
                  key={c.name}
                  onClick={() => handleUpdateColor(c.value)}
                  className="w-6 h-6 rounded-full border border-gray-200 transition-transform hover:scale-110"
                  style={{ backgroundColor: c.value || '#FFFFFF' }}
                  title={c.name}
                />
              ))}
            </div>
            <button 
              onClick={() => setSelectedNodeId(null)}
              className="ml-2 p-1 hover:bg-gray-100 rounded text-gray-400"
            >
              <Plus className="rotate-45" size={16} />
            </button>
          </div>
        )}
      </header>
      
      <div ref={containerRef} className="flex-1 relative overflow-hidden cursor-grab active:cursor-grabbing">
        <Stage 
          width={dimensions.width} 
          height={dimensions.height}
          draggable
          onDragEnd={(e) => setStagePos({ x: e.target.x(), y: e.target.y() })}
          x={stagePos.x}
          y={stagePos.y}
        >
          <Layer>
            {/* Edges */}
            {project.mindMapEdges.map(edge => {
              const fromNode = project.mindMapNodes.find(n => n.id === edge.fromNodeId);
              const toNode = project.mindMapNodes.find(n => n.id === edge.toNodeId);
              if (!fromNode || !toNode) return null;

              return (
                <KonvaLine
                  key={edge.id}
                  points={[fromNode.x + NODE_WIDTH/2, fromNode.y + NODE_HEIGHT/2, toNode.x + NODE_WIDTH/2, toNode.y + NODE_HEIGHT/2]}
                  stroke="#E5E7EB"
                  strokeWidth={2}
                  onClick={() => handleDeleteEdge(edge.id)}
                  onMouseEnter={(e: any) => {
                    const container = e.target.getStage().container();
                    container.style.cursor = 'pointer';
                    e.target.stroke('#EF4444');
                    e.target.draw();
                  }}
                  onMouseLeave={(e: any) => {
                    const container = e.target.getStage().container();
                    container.style.cursor = 'grab';
                    e.target.stroke('#E5E7EB');
                    e.target.draw();
                  }}
                />
              );
            })}

            {/* Nodes */}
            {project.mindMapNodes.map(node => {
              const data = getNodeData(node);
              if (!data) return null;

              const isSelected = selectedNodeId === node.id;
              const isConnecting = edgeStartNodeId === node.id;

              return (
                <Group
                  key={node.id}
                  x={node.x}
                  y={node.y}
                  draggable
                  onDragEnd={(e) => handleDragEnd(node.id, e)}
                  onClick={() => handleNodeClick(node.id)}
                  onDblClick={() => handleNodeDoubleClick(node.id)}
                  onMouseEnter={(e: any) => {
                    const container = e.target.getStage().container();
                    container.style.cursor = 'pointer';
                  }}
                  onMouseLeave={(e: any) => {
                    const container = e.target.getStage().container();
                    container.style.cursor = 'grab';
                  }}
                >
                  <Rect
                    width={NODE_WIDTH}
                    height={NODE_HEIGHT}
                    fill={data.color}
                    cornerRadius={8}
                    stroke={isSelected || isConnecting ? "black" : data.stroke}
                    strokeWidth={isSelected || isConnecting ? 2 : 1}
                    shadowBlur={isSelected ? 10 : 5}
                    shadowColor="rgba(0,0,0,0.05)"
                  />
                  <Text
                    text={data.title}
                    fontSize={10}
                    fontStyle="bold"
                    width={NODE_WIDTH - 20}
                    padding={10}
                    align="center"
                    verticalAlign="middle"
                    height={NODE_HEIGHT}
                    wrap="char"
                  />
                  {isConnecting && (
                    <Circle
                      x={NODE_WIDTH}
                      y={NODE_HEIGHT/2}
                      radius={4}
                      fill="black"
                    />
                  )}
                </Group>
              );
            })}
          </Layer>
        </Stage>
        
        <button 
          onClick={() => {
            setStagePos({ x: 0, y: 0 });
          }}
          className="absolute bottom-6 right-6 bg-white p-3 rounded-full shadow-lg border border-gray-100 hover:bg-gray-50 transition-colors"
          title="Reset View"
        >
          <Target size={20} />
        </button>
      </div>
    </div>
  );
}

function GlossaryManager({
  glossary,
  onAdd,
  onUpdate,
  onDelete,
  onExport
}: {
  glossary: GlossaryTerm[];
  onAdd: (term: GlossaryTerm) => void;
  onUpdate: (id: string, updates: Partial<GlossaryTerm>) => void;
  onDelete: (id: string) => void;
  onExport: () => void;
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newTerm, setNewTerm] = useState<Partial<GlossaryTerm>>({ term: '', definition: '', category: 'General' });

  const handleAdd = () => {
    if (!newTerm.term || !newTerm.definition) return;
    onAdd({
      id: `g${Date.now()}`,
      term: newTerm.term,
      definition: newTerm.definition,
      category: newTerm.category || 'General',
      usageNotes: newTerm.usageNotes
    });
    setNewTerm({ term: '', definition: '', category: 'General' });
    setIsAdding(false);
  };

  const filteredGlossary = glossary.filter(item => 
    item.term.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.definition.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category?.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => a.term.localeCompare(b.term));

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Glossary & Terminology</h2>
          <p className="text-gray-500 mt-1">Maintain consistency in your technical terms and concepts</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={onExport}
            className="px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <Download size={18} />
            Export Word
          </button>
          <button 
            onClick={() => setIsAdding(true)}
            className="bg-black text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-gray-800 transition-colors"
          >
            <Plus size={18} />
            Add Term
          </button>
        </div>
      </header>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text"
            placeholder="Search terms, definitions, or categories..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-100 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent transition-all"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-2xl border-2 border-black shadow-xl space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-gray-400">Term</label>
              <input 
                placeholder="e.g. Backpropagation"
                className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-black text-sm"
                value={newTerm.term}
                onChange={e => setNewTerm({...newTerm, term: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-gray-400">Category</label>
              <input 
                placeholder="e.g. Neural Networks"
                className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-black text-sm"
                value={newTerm.category}
                onChange={e => setNewTerm({...newTerm, category: e.target.value})}
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-gray-400">Definition</label>
            <textarea 
              placeholder="What does this term mean?"
              className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-black text-sm h-24 resize-none"
              value={newTerm.definition}
              onChange={e => setNewTerm({...newTerm, definition: e.target.value})}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-gray-400">Usage Notes (Optional)</label>
            <input 
              placeholder="e.g. Only use in Chapter 4 context"
              className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-black text-sm"
              value={newTerm.usageNotes}
              onChange={e => setNewTerm({...newTerm, usageNotes: e.target.value})}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setIsAdding(false)} className="px-4 py-2 text-sm font-bold text-gray-400">Cancel</button>
            <button onClick={handleAdd} className="bg-black text-white px-6 py-2 rounded-xl text-sm font-bold">Save Term</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {filteredGlossary.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
            <Languages className="mx-auto text-gray-200 mb-4" size={48} />
            <p className="text-gray-400 text-sm">No terms found matching your search.</p>
          </div>
        ) : (
          filteredGlossary.map(item => (
            <div key={item.id} className="bg-white p-6 rounded-2xl border border-gray-100 group hover:border-black transition-all">
              <div className="flex justify-between items-start">
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-3">
                    <h4 className="text-lg font-bold tracking-tight">{item.term}</h4>
                    <span className="text-[10px] font-bold uppercase tracking-widest bg-gray-100 px-2 py-0.5 rounded text-gray-500">
                      {item.category}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">{item.definition}</p>
                  {item.usageNotes && (
                    <div className="flex items-start gap-2 bg-blue-50 p-3 rounded-lg">
                      <Info size={14} className="text-blue-500 mt-0.5 shrink-0" />
                      <p className="text-[11px] text-blue-700 font-medium italic">{item.usageNotes}</p>
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => onDelete(item.id)}
                  className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600 transition-all"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function CitationManager({ 
  citations, 
  onAdd,
  onDelete,
  onExport
}: { 
  citations: Citation[]; 
  onAdd: (citation: Citation) => void;
  onDelete: (id: string) => void;
  onExport: () => void;
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [style, setStyle] = useState<'APA' | 'MLA'>('APA');
  const [newItem, setNewItem] = useState<Partial<Citation>>({ type: 'book' });

  const handleAdd = () => {
    if (!newItem.title || !newItem.author) return;
    onAdd({
      id: `cit${Date.now()}`,
      type: newItem.type as any,
      author: newItem.author || '',
      title: newItem.title || '',
      year: newItem.year || '',
      publisher: newItem.publisher,
      journal: newItem.journal,
      volume: newItem.volume,
      issue: newItem.issue,
      pages: newItem.pages,
      doi: newItem.doi,
      url: newItem.url,
      accessDate: newItem.accessDate
    });
    setNewItem({ type: 'book' });
    setIsAdding(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // In a real app we'd show a toast here
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Citation Manager</h2>
          <p className="text-gray-500 mt-1">Organize your sources and generate formatted references</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={onExport}
            className="px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <Download size={18} />
            Export Word
          </button>
          <div className="flex bg-gray-100 rounded-xl p-1">
            <button 
              onClick={() => setStyle('APA')}
              className={cn("px-3 py-1.5 rounded-lg text-xs font-bold transition-all", style === 'APA' ? "bg-white shadow-sm" : "text-gray-400")}
            >
              APA
            </button>
            <button 
              onClick={() => setStyle('MLA')}
              className={cn("px-3 py-1.5 rounded-lg text-xs font-bold transition-all", style === 'MLA' ? "bg-white shadow-sm" : "text-gray-400")}
            >
              MLA
            </button>
          </div>
          <button 
            onClick={() => setIsAdding(true)}
            className="bg-black text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-gray-800 transition-colors"
          >
            <Plus size={18} />
            Add Source
          </button>
        </div>
      </header>

      {isAdding && (
        <div className="bg-white p-6 rounded-2xl border-2 border-black shadow-xl space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-gray-400">Type</label>
              <select 
                className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-black text-sm"
                value={newItem.type}
                onChange={e => setNewItem({...newItem, type: e.target.value as any})}
              >
                <option value="book">Book</option>
                <option value="article">Journal Article</option>
                <option value="web">Webpage</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-[10px] font-bold uppercase text-gray-400">Author(s)</label>
              <input 
                placeholder="e.g. Smith, J., & Doe, A."
                className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-black text-sm"
                value={newItem.author || ''}
                onChange={e => setNewItem({...newItem, author: e.target.value})}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1 md:col-span-3">
              <label className="text-[10px] font-bold uppercase text-gray-400">Title</label>
              <input 
                placeholder="Source Title"
                className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-black text-sm"
                value={newItem.title || ''}
                onChange={e => setNewItem({...newItem, title: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-gray-400">Year</label>
              <input 
                placeholder="2024"
                className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-black text-sm"
                value={newItem.year || ''}
                onChange={e => setNewItem({...newItem, year: e.target.value})}
              />
            </div>
          </div>

          {newItem.type === 'book' && (
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-gray-400">Publisher</label>
              <input 
                placeholder="Publisher Name"
                className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-black text-sm"
                value={newItem.publisher || ''}
                onChange={e => setNewItem({...newItem, publisher: e.target.value})}
              />
            </div>
          )}

          {newItem.type === 'article' && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-1 md:col-span-2">
                <label className="text-[10px] font-bold uppercase text-gray-400">Journal</label>
                <input 
                  placeholder="Journal Name"
                  className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-black text-sm"
                  value={newItem.journal || ''}
                  onChange={e => setNewItem({...newItem, journal: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-gray-400">Vol/Issue</label>
                <div className="flex gap-2">
                  <input placeholder="V" className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-black text-sm" value={newItem.volume || ''} onChange={e => setNewItem({...newItem, volume: e.target.value})} />
                  <input placeholder="I" className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-black text-sm" value={newItem.issue || ''} onChange={e => setNewItem({...newItem, issue: e.target.value})} />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-gray-400">Pages</label>
                <input placeholder="123-145" className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-black text-sm" value={newItem.pages || ''} onChange={e => setNewItem({...newItem, pages: e.target.value})} />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-gray-400">URL</label>
              <input 
                placeholder="https://..."
                className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-black text-sm"
                value={newItem.url || ''}
                onChange={e => setNewItem({...newItem, url: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-gray-400">DOI</label>
              <input 
                placeholder="10.1000/..."
                className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-black text-sm"
                value={newItem.doi || ''}
                onChange={e => setNewItem({...newItem, doi: e.target.value})}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button onClick={() => setIsAdding(false)} className="px-4 py-2 text-sm font-bold text-gray-400">Cancel</button>
            <button onClick={handleAdd} className="bg-black text-white px-6 py-2 rounded-xl text-sm font-bold">Save Source</button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {citations.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
            <BookMarked className="mx-auto text-gray-200 mb-4" size={48} />
            <p className="text-gray-400 text-sm">No citations added yet.</p>
          </div>
        ) : (
          citations.map(citation => (
            <div key={citation.id} className="bg-white p-6 rounded-2xl border border-gray-100 group hover:border-black transition-all">
              <div className="flex justify-between items-start">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest bg-gray-100 px-2 py-0.5 rounded text-gray-500">
                      {citation.type}
                    </span>
                    <span className="text-[10px] font-bold text-gray-300">{citation.year}</span>
                  </div>
                  <p className="text-sm font-serif italic text-gray-800 leading-relaxed">
                    {formatCitation(citation, style)}
                  </p>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => copyToClipboard(formatCitation(citation, style))}
                    className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-black transition-colors"
                    title="Copy formatted citation"
                  >
                    <Copy size={16} />
                  </button>
                  <button 
                    onClick={() => onDelete(citation.id)}
                    className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600 transition-colors"
                    title="Delete source"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function Dashboard({ 
  project, 
  onLogWords,
  onUpdateGoal,
  onBackup,
  onRestore
}: { 
  project: BookProject;
  onLogWords: (words: number) => void;
  onUpdateGoal: (goal: number) => void;
  onBackup: () => void;
  onRestore: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  const [logInput, setLogInput] = useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const chartData = useMemo(() => {
    return project.dailyProgress.map(p => ({
      date: format(parseISO(p.date), 'MMM dd'),
      words: p.wordCount + (p.manualLog || 0),
      goal: project.dailyGoal
    }));
  }, [project.dailyProgress, project.dailyGoal]);

  const todayProgress = useMemo(() => {
    const today = project.dailyProgress.find(p => isSameDay(parseISO(p.date), new Date()));
    return (today?.wordCount || 0) + (today?.manualLog || 0);
  }, [project.dailyProgress]);

  const todayPercent = Math.min(Math.round((todayProgress / project.dailyGoal) * 100), 100);

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <header className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{project.title}</h2>
          <p className="text-gray-500 mt-1">Writing velocity and manuscript health</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Daily Goal</p>
            <input 
              type="number"
              value={project.dailyGoal}
              onChange={(e) => onUpdateGoal(parseInt(e.target.value) || 0)}
              className="text-xl font-bold bg-transparent border-none text-right focus:ring-0 p-0 w-24"
            />
          </div>
          <Target className="text-gray-300" size={24} />
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 text-gray-400 mb-4">
            <FileText size={20} />
            <span className="text-xs font-bold uppercase tracking-wider">Total Words</span>
          </div>
          <div className="text-4xl font-light tracking-tight">{formatWordCount(calculateTotalWordCount(project.chapters))}</div>
          <p className="text-xs text-green-600 mt-2 font-medium">Progressing well</p>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 text-gray-400 mb-4">
            <Target size={20} />
            <span className="text-xs font-bold uppercase tracking-wider">Today's Goal</span>
          </div>
          <div className="text-4xl font-light tracking-tight">{todayPercent}%</div>
          <div className="mt-2 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-black" style={{ width: `${todayPercent}%` }} />
          </div>
          <p className="text-[11px] text-gray-400 mt-2 font-medium">
            {formatWordCount(todayProgress)} / {formatWordCount(project.dailyGoal)} words
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <div className="flex items-center gap-3 text-gray-400 mb-4">
            <History size={20} />
            <span className="text-xs font-bold uppercase tracking-wider">Log Words</span>
          </div>
          <div className="flex gap-2">
            <input 
              type="number"
              value={logInput}
              onChange={(e) => setLogInput(e.target.value)}
              placeholder="Add words..."
              className="flex-1 bg-gray-50 border-none rounded-xl text-sm focus:ring-1 focus:ring-black"
            />
            <button 
              onClick={() => {
                onLogWords(parseInt(logInput) || 0);
                setLogInput('');
              }}
              className="bg-black text-white px-4 py-2 rounded-xl text-xs font-bold"
            >
              Log
            </button>
          </div>
        </div>
      </div>

      {/* Backup & Restore Section */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h4 className="font-bold text-lg">Local Backup & Security</h4>
            <p className="text-sm text-gray-500">Download a full copy of your project to your computer for safe keeping.</p>
          </div>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={onRestore} 
            className="hidden" 
            accept=".json"
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 md:flex-none px-6 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <Upload size={18} />
            Restore from File
          </button>
          <button 
            onClick={onBackup}
            className="flex-1 md:flex-none bg-black text-white px-6 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors shadow-lg shadow-black/10"
          >
            <Download size={18} />
            Backup Project
          </button>
        </div>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-8">Writing Velocity</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorWords" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#000" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#000" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 11, fill: '#999' }} 
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 11, fill: '#999' }} 
              />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
              />
              <Area 
                type="monotone" 
                dataKey="words" 
                stroke="#000" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorWords)" 
              />
              <Line 
                type="monotone" 
                dataKey="goal" 
                stroke="#E5E7EB" 
                strokeDasharray="5 5" 
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function Manuscript({ 
  project, 
  selectedSectionId, 
  setSelectedSectionId,
  onUpdateSection,
  onAddChapter,
  onAddSection,
  onDeleteChapter,
  onDeleteSection,
  onReorderChapter,
  onReorderSection,
  onUpdateChapterTitle,
  onExport
}: { 
  project: BookProject;
  selectedSectionId: string | null;
  setSelectedSectionId: (id: string | null) => void;
  onUpdateSection: (id: string, updates: Partial<Section>) => void;
  onAddChapter: () => void;
  onAddSection: (chapterId: string) => void;
  onDeleteChapter: (id: string) => void;
  onDeleteSection: (chapterId: string, id: string) => void;
  onReorderChapter: (idx: number, direction: 'up' | 'down') => void;
  onReorderSection: (chapterId: string, idx: number, direction: 'up' | 'down') => void;
  onUpdateChapterTitle: (id: string, title: string) => void;
  onExport: () => void;
}) {
  const selectedSection = useMemo(() => {
    for (const chapter of project.chapters) {
      const section = chapter.sections.find(s => s.id === selectedSectionId);
      if (section) return section;
    }
    return null;
  }, [project.chapters, selectedSectionId]);

  return (
    <div className="flex h-full">
      {/* Outline Column */}
      <div className="w-80 border-r border-gray-200 bg-white overflow-auto">
        <div className="p-6 flex flex-col gap-4 border-b border-gray-50 sticky top-0 bg-white z-10">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">Outline</h3>
            <button 
              onClick={onAddChapter}
              className="p-1 hover:bg-gray-100 rounded-md transition-colors flex items-center gap-1 text-[10px] font-bold uppercase"
            >
              <Plus size={14} /> Add Chapter
            </button>
          </div>
          <button 
            onClick={onExport}
            className="w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <Download size={14} />
            Export Manuscript
          </button>
        </div>
        <div className="p-4 space-y-8">
          {project.chapters.map((chapter, cIdx) => (
            <div key={chapter.id} className="space-y-3">
              <div className="flex items-center justify-between group">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-gray-300">CH {cIdx + 1}</span>
                  <div className="flex flex-col">
                    <button onClick={() => onReorderChapter(cIdx, 'up')} className="p-0.5 hover:bg-gray-100 rounded text-gray-300 hover:text-black"><ChevronUp size={10} /></button>
                    <button onClick={() => onReorderChapter(cIdx, 'down')} className="p-0.5 hover:bg-gray-100 rounded text-gray-300 hover:text-black"><ChevronDown size={10} /></button>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => onAddSection(chapter.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-100 rounded text-gray-400 transition-all"
                    title="Add Section"
                  >
                    <Plus size={12} />
                  </button>
                  <button 
                    onClick={() => onDeleteChapter(chapter.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-600 transition-all"
                    title="Delete Chapter"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
              <input 
                value={chapter.title}
                onChange={(e) => onUpdateChapterTitle(chapter.id, e.target.value)}
                className="text-sm font-bold leading-tight w-full bg-transparent border-none focus:ring-0 p-0"
              />
              <div className="space-y-1 ml-2 border-l border-gray-100 pl-3">
                {chapter.sections.map((section, sIdx) => (
                  <div key={section.id} className="group/section relative flex items-center">
                    <button
                      onClick={() => setSelectedSectionId(section.id)}
                      className={cn(
                        "flex-1 text-left px-3 py-2 rounded-lg text-xs transition-all flex items-center justify-between",
                        selectedSectionId === section.id 
                          ? "bg-gray-100 font-semibold text-black" 
                          : "text-gray-500 hover:bg-gray-50"
                      )}
                    >
                      <span className="truncate pr-2">{section.title}</span>
                      {section.status === 'completed' && <CheckCircle2 size={12} className="text-green-500 shrink-0" />}
                    </button>
                    <div className="absolute -left-8 opacity-0 group-hover/section:opacity-100 flex flex-col transition-opacity">
                      <button onClick={() => onReorderSection(chapter.id, sIdx, 'up')} className="p-0.5 hover:bg-gray-100 rounded text-gray-300 hover:text-black"><ChevronUp size={10} /></button>
                      <button onClick={() => onReorderSection(chapter.id, sIdx, 'down')} className="p-0.5 hover:bg-gray-100 rounded text-gray-300 hover:text-black"><ChevronDown size={10} /></button>
                    </div>
                    <button 
                      onClick={() => onDeleteSection(chapter.id, section.id)}
                      className="absolute -right-6 opacity-0 group-hover/section:opacity-100 p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-600 transition-all"
                      title="Delete Section"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Editor Column */}
      <div className="flex-1 bg-white overflow-auto relative">
        {selectedSection ? (
          <div className="max-w-3xl mx-auto py-16 px-8 space-y-8">
            <input 
              type="text"
              value={selectedSection.title}
              onChange={(e) => onUpdateSection(selectedSection.id, { title: e.target.value })}
              className="w-full text-4xl font-bold tracking-tight border-none focus:ring-0 p-0 placeholder-gray-200"
              placeholder="Section Title"
            />
            
            <div className="flex items-center gap-4 text-xs font-medium text-gray-400 border-b border-gray-100 pb-4">
              <div className="flex items-center gap-1.5">
                <FileText size={14} />
                {formatWordCount(selectedSection.content.split(/\s+/).filter(Boolean).length)} words
              </div>
              <div className="flex items-center gap-1.5">
                <Clock size={14} />
                {Math.ceil(selectedSection.content.split(/\s+/).filter(Boolean).length / 200)} min read
              </div>
              <select 
                value={selectedSection.status}
                onChange={(e) => onUpdateSection(selectedSection.id, { status: e.target.value as any })}
                className="bg-transparent border-none focus:ring-0 text-xs font-bold uppercase tracking-wider p-0 cursor-pointer hover:text-black transition-colors"
              >
                <option value="draft">Drafting</option>
                <option value="review">Review</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <textarea 
              value={selectedSection.content}
              onChange={(e) => {
                const content = e.target.value;
                const wordCount = content.split(/\s+/).filter(Boolean).length;
                onUpdateSection(selectedSection.id, { content, wordCount });
              }}
              className="w-full h-[60vh] text-lg leading-relaxed border-none focus:ring-0 p-0 resize-none placeholder-gray-200 font-serif"
              placeholder="Start writing your masterpiece..."
            />
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-300 space-y-4">
            <BookOpen size={48} strokeWidth={1} />
            <p className="text-sm font-medium">Select a section to start writing</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Research({ 
  research, 
  onToggle,
  onAdd
}: { 
  research: ResearchItem[]; 
  onToggle: (id: string) => void;
  onAdd: (item: ResearchItem) => void;
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [newItem, setNewItem] = useState({ title: '', link: '', notes: '', category: 'General' });

  const handleAdd = () => {
    if (!newItem.title) return;
    onAdd({
      id: `r${Date.now()}`,
      ...newItem,
      isCompleted: false
    });
    setNewItem({ title: '', link: '', notes: '', category: 'General' });
    setIsAdding(false);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Research Pipeline</h2>
          <p className="text-gray-500 mt-1">Manage your sources and investigation tasks</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-black text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-gray-800 transition-colors"
        >
          <Plus size={18} />
          Add Resource
        </button>
      </header>

      {isAdding && (
        <div className="bg-white p-6 rounded-2xl border-2 border-black shadow-xl space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input 
              placeholder="Title"
              className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-black"
              value={newItem.title}
              onChange={e => setNewItem({...newItem, title: e.target.value})}
            />
            <input 
              placeholder="URL (optional)"
              className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-black"
              value={newItem.link}
              onChange={e => setNewItem({...newItem, link: e.target.value})}
            />
          </div>
          <textarea 
            placeholder="Notes..."
            className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-black h-24"
            value={newItem.notes}
            onChange={e => setNewItem({...newItem, notes: e.target.value})}
          />
          <div className="flex justify-end gap-3">
            <button onClick={() => setIsAdding(false)} className="px-4 py-2 text-sm font-bold text-gray-400">Cancel</button>
            <button onClick={handleAdd} className="bg-black text-white px-6 py-2 rounded-xl text-sm font-bold">Save Resource</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {research.map(item => (
          <div 
            key={item.id}
            className={cn(
              "p-6 rounded-2xl border transition-all duration-300 group relative",
              item.isCompleted 
                ? "bg-green-50 border-green-100 opacity-75" 
                : "bg-white border-gray-100 hover:border-black hover:shadow-lg"
            )}
          >
            <div className="flex justify-between items-start mb-4">
              <span className={cn(
                "text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded",
                item.isCompleted ? "bg-green-200 text-green-700" : "bg-gray-100 text-gray-500"
              )}>
                {item.category}
              </span>
              <button 
                onClick={() => onToggle(item.id)}
                className={cn(
                  "p-1 rounded-full transition-colors",
                  item.isCompleted ? "text-green-600" : "text-gray-300 hover:text-black"
                )}
              >
                <CheckCircle2 size={24} fill={item.isCompleted ? "currentColor" : "none"} className={item.isCompleted ? "text-green-500" : ""} />
              </button>
            </div>
            
            <h4 className={cn("font-bold text-lg mb-2", item.isCompleted && "line-through text-green-800")}>
              {item.title}
            </h4>
            <p className="text-sm text-gray-500 mb-4 line-clamp-3">{item.notes}</p>
            
            {item.link && (
              <a 
                href={item.link} 
                target="_blank" 
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-xs font-bold hover:underline"
              >
                View Source <ExternalLink size={12} />
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function BrainDump({ 
  topics = [], 
  chapters = [],
  onAdd, 
  onUpdate, 
  onDelete,
  onLinkToChapter
}: { 
  topics?: Topic[]; 
  chapters?: Chapter[];
  onAdd: (topic: Topic) => void;
  onUpdate: (id: string, updates: Partial<Topic>) => void;
  onDelete: (id: string) => void;
  onLinkToChapter: (topicId: string, chapterId: string) => void;
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [newTopic, setNewTopic] = useState({ title: '', description: '', priority: 'medium' as const, tags: [] as string[] });
  const [tagInput, setTagInput] = useState('');

  const handleAdd = () => {
    if (!newTopic.title) return;
    onAdd({
      id: `t${Date.now()}`,
      ...newTopic,
      tags: newTopic.tags
    });
    setNewTopic({ title: '', description: '', priority: 'medium', tags: [] });
    setIsAdding(false);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Brain Dump</h2>
          <p className="text-gray-500 mt-1">Capture and organize your raw ideas before they vanish</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-black text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-gray-800 transition-colors"
        >
          <Plus size={18} />
          New Idea
        </button>
      </header>

      {isAdding && (
        <div className="bg-white p-6 rounded-2xl border-2 border-black shadow-xl space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input 
              placeholder="Topic Title"
              className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-black"
              value={newTopic.title}
              onChange={e => setNewTopic({...newTopic, title: e.target.value})}
            />
            <select 
              className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-black"
              value={newTopic.priority}
              onChange={e => setNewTopic({...newTopic, priority: e.target.value as any})}
            >
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>
          </div>
          <textarea 
            placeholder="Describe the idea..."
            className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-black h-24"
            value={newTopic.description}
            onChange={e => setNewTopic({...newTopic, description: e.target.value})}
          />
          <div className="flex gap-2 items-center">
            <input 
              placeholder="Add tag..."
              className="flex-1 p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-black"
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && tagInput) {
                  setNewTopic({...newTopic, tags: [...newTopic.tags, tagInput]});
                  setTagInput('');
                }
              }}
            />
            <div className="flex gap-1">
              {newTopic.tags.map(tag => (
                <span key={tag} className="bg-gray-100 px-2 py-1 rounded text-xs font-bold">{tag}</span>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setIsAdding(false)} className="px-4 py-2 text-sm font-bold text-gray-400">Cancel</button>
            <button onClick={handleAdd} className="bg-black text-white px-6 py-2 rounded-xl text-sm font-bold">Add to Dump</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {topics.map(topic => (
          <div key={topic.id} className="bg-white p-6 rounded-2xl border border-gray-100 hover:border-black transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className="flex gap-2">
                <span className={cn(
                  "text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded",
                  topic.priority === 'high' ? "bg-red-100 text-red-600" : 
                  topic.priority === 'medium' ? "bg-amber-100 text-amber-600" : "bg-blue-100 text-blue-600"
                )}>
                  {topic.priority}
                </span>
                {topic.tags.map(tag => (
                  <span key={tag} className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded bg-gray-100 text-gray-400">
                    {tag}
                  </span>
                ))}
              </div>
              <button onClick={() => onDelete(topic.id)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                <Trash2 size={16} />
              </button>
            </div>
            
            <h4 className="font-bold text-xl mb-2">{topic.title}</h4>
            <p className="text-sm text-gray-500 mb-6">{topic.description}</p>
            
            <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                <Tag size={14} />
                {topic.tags.length} tags
              </div>
              
              <div className="relative group/link">
                <button className="flex items-center gap-2 text-xs font-bold bg-gray-50 px-3 py-2 rounded-lg hover:bg-black hover:text-white transition-all">
                  Link to Chapter <ArrowRight size={14} />
                </button>
                <div className="absolute bottom-full right-0 mb-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 opacity-0 invisible group-hover/link:opacity-100 group-hover/link:visible transition-all z-20 overflow-hidden">
                  <div className="p-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 border-b border-gray-50">Select Chapter</div>
                  {chapters.map(chapter => (
                    <button 
                      key={chapter.id}
                      onClick={() => onLinkToChapter(topic.id, chapter.id)}
                      className="w-full text-left px-4 py-2 text-xs hover:bg-gray-50 transition-colors truncate"
                    >
                      {chapter.title}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
