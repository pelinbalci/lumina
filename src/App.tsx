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
  ArrowRight
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
import { format, subDays, isSameDay, parseISO, startOfDay } from 'date-fns';
import { cn, formatWordCount, calculateTotalWordCount } from './lib/utils';
import { BookProject, Chapter, Section, ResearchItem, DailyProgress, Topic } from './types';

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
  ]
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
        topics: parsed.topics || INITIAL_DATA.topics || [],
        dailyProgress: parsed.dailyProgress || INITIAL_DATA.dailyProgress || []
      };
    }
    return INITIAL_DATA;
  });
  const [activeTab, setActiveTab] = useState<'dashboard' | 'manuscript' | 'research' | 'braindump'>('dashboard');
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
            onReorderChapter={handleReorderChapter}
            onReorderSection={handleReorderSection}
            onUpdateChapterTitle={(id, title) => setProject(prev => ({
              ...prev,
              chapters: prev.chapters.map(c => c.id === id ? { ...c, title } : c)
            }))}
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

function Dashboard({ 
  project, 
  onLogWords,
  onUpdateGoal
}: { 
  project: BookProject;
  onLogWords: (words: number) => void;
  onUpdateGoal: (goal: number) => void;
}) {
  const [logInput, setLogInput] = useState('');

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
  onReorderChapter,
  onReorderSection,
  onUpdateChapterTitle
}: { 
  project: BookProject;
  selectedSectionId: string | null;
  setSelectedSectionId: (id: string | null) => void;
  onUpdateSection: (id: string, updates: Partial<Section>) => void;
  onAddChapter: () => void;
  onAddSection: (chapterId: string) => void;
  onReorderChapter: (idx: number, direction: 'up' | 'down') => void;
  onReorderSection: (chapterId: string, idx: number, direction: 'up' | 'down') => void;
  onUpdateChapterTitle: (id: string, title: string) => void;
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
        <div className="p-6 flex justify-between items-center border-b border-gray-50 sticky top-0 bg-white z-10">
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">Outline</h3>
          <button 
            onClick={onAddChapter}
            className="p-1 hover:bg-gray-100 rounded-md transition-colors flex items-center gap-1 text-[10px] font-bold uppercase"
          >
            <Plus size={14} /> Add Chapter
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
                <button 
                  onClick={() => onAddSection(chapter.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-100 rounded text-gray-400 transition-all"
                >
                  <Plus size={12} />
                </button>
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
