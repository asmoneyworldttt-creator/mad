import { useState, useEffect } from 'react';
import { DndContext, closestCorners, useSensor, useSensors, PointerSensor, DragOverlay } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, GripVertical, CheckCircle2, AlertCircle, Clock, User, Calendar, Tag } from 'lucide-react';
import { supabase } from '../../supabase';
import { useToast } from '../Toast';
import { CustomSelect } from '../ui/CustomControls';

type TaskStatus = 'todo' | 'in_progress' | 'done';
type Priority = 'Low' | 'Normal' | 'High' | 'Urgent';

interface Task {
    id: number;
    title: string;
    description?: string;
    status: TaskStatus;
    priority: Priority;
    due_date?: string;
    assignee_id?: number;
    created_at: string;
}

export function Tasks({ userRole, theme }: { userRole: string; theme?: 'light' | 'dark' }) {
    const { showToast } = useToast();
    const isDark = theme === 'dark';
    const [tasks, setTasks] = useState<Task[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [activeId, setActiveId] = useState<number | null>(null);
    const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'Normal' as Priority, due_date: '' });

    const COLUMNS: { id: TaskStatus; label: string; icon: any; color: string }[] = [
        { id: 'todo', label: 'To Do', icon: Clock, color: 'text-slate-400' },
        { id: 'in_progress', label: 'In Progress', icon: AlertCircle, color: 'text-amber-400' },
        { id: 'done', label: 'Done', icon: CheckCircle2, color: 'text-emerald-400' }
    ];

    const PRIORITY_STYLES: Record<Priority, string> = {
        Low: 'bg-slate-100/10 text-slate-500 border-slate-200/20',
        Normal: 'bg-primary/10 text-primary border-primary/20',
        High: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
        Urgent: 'bg-rose-500/10 text-rose-500 border-rose-500/20'
    };

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

    useEffect(() => {
        fetchTasks();
        const channel = supabase.channel('tasks-board')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => fetchTasks())
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, []);

    const fetchTasks = async () => {
        const { data, error } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
        if (data) setTasks(data);
    };

    const handleDragEnd = async (event: any) => {
        const { active, over } = event;
        setActiveId(null);
        if (!over) return;

        const taskId = active.id;
        const newStatus = over.data?.current?.columnId as TaskStatus;
        if (!newStatus) return;

        const task = tasks.find(t => t.id === taskId);
        if (!task || task.status === newStatus) return;

        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
        await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId);
    };

    const addTask = async () => {
        if (!newTask.title.trim()) return showToast('Task title is required', 'error');
        const { error } = await supabase.from('tasks').insert({
            title: newTask.title,
            description: newTask.description,
            priority: newTask.priority,
            due_date: newTask.due_date || null,
            status: 'todo'
        });
        if (!error) {
            showToast('Task created', 'success');
            setShowForm(false);
            setNewTask({ title: '', description: '', priority: 'Normal', due_date: '' });
        }
    };

    const overdueCount = tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done').length;

    return (
        <div className="animate-slide-up space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className={`text-3xl font-bold tracking-tight flex items-center gap-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        Task Board
                        {overdueCount > 0 && (
                            <span className="text-[10px] font-extrabold px-3 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full uppercase tracking-widest animate-pulse">
                                {overdueCount} Overdue
                            </span>
                        )}
                    </h2>
                    <p className={`font-medium text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Manage internal tasks and follow-ups.
                    </p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-105 hover:bg-primary/90 transition-all active:scale-95"
                >
                    <Plus size={18} /> New Task
                </button>
            </div>

            {/* New Task Form */}
            {showForm && (
                <div className={`p-8 rounded-[2rem] border animate-slide-up ${isDark ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
                    <h3 className={`font-bold text-lg mb-6 ${isDark ? 'text-white' : 'text-slate-900'}`}>Add New Task</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <input
                                placeholder="Task title..."
                                value={newTask.title}
                                onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                                className={`w-full rounded-2xl px-6 py-4 font-bold outline-none border transition-all ${isDark ? 'bg-white/5 border-white/10 text-white focus:border-primary/50' : 'bg-slate-50 border-slate-200 focus:border-primary'}`}
                            />
                        </div>
                        <textarea
                            placeholder="Description (optional)..."
                            value={newTask.description}
                            onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                            className={`rounded-2xl px-6 py-4 font-medium text-sm outline-none border resize-none h-24 transition-all ${isDark ? 'bg-white/5 border-white/10 text-white focus:border-primary/50' : 'bg-slate-50 border-slate-200 focus:border-primary'}`}
                        />
                        <div className="space-y-4">
                            <CustomSelect 
                                value={newTask.priority} 
                                onChange={val => setNewTask({ ...newTask, priority: val as Priority })}
                                options={['Low', 'Normal', 'High', 'Urgent']}
                            />
                            <input
                                type="date"
                                value={newTask.due_date}
                                onChange={e => setNewTask({ ...newTask, due_date: e.target.value })}
                                className={`w-full rounded-2xl px-6 py-4 font-bold outline-none border transition-all ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200'}`}
                            />
                        </div>
                    </div>
                    <div className="flex gap-3 mt-6">
                        <button onClick={addTask} className="px-8 py-3 bg-primary text-white rounded-2xl font-bold hover:bg-primary/90 active:scale-95 transition-all shadow-lg shadow-primary/20">
                            Create Task
                        </button>
                        <button onClick={() => setShowForm(false)} className={`px-8 py-3 rounded-2xl font-bold transition-all ${isDark ? 'bg-white/5 text-slate-400' : 'bg-slate-100 text-slate-600'}`}>
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Kanban Board */}
            <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={(e) => setActiveId(e.active.id as number)} onDragEnd={handleDragEnd}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {COLUMNS.map(col => {
                        const colTasks = tasks.filter(t => t.status === col.id);
                        return (
                            <div key={col.id} className={`rounded-[2rem] border p-6 min-h-[500px] ${isDark ? 'bg-slate-900/60 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <col.icon size={18} className={col.color} />
                                        <h3 className="font-bold text-base">{col.label}</h3>
                                    </div>
                                    <span className={`text-xs font-extrabold px-3 py-1 rounded-full ${isDark ? 'bg-white/5' : 'bg-white shadow-sm border border-slate-100'}`}>
                                        {colTasks.length}
                                    </span>
                                </div>

                                <SortableContext
                                    id={col.id}
                                    items={colTasks.map(t => t.id)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    <div className="space-y-3">
                                        {colTasks.map(task => (
                                            <SortableTaskCard key={task.id} task={task} columnId={col.id} isDark={isDark} priorityStyles={PRIORITY_STYLES} />
                                        ))}
                                        {colTasks.length === 0 && (
                                            <div className={`py-12 text-center rounded-2xl border-2 border-dashed ${isDark ? 'border-white/5 text-slate-600' : 'border-slate-200 text-slate-300'}`}>
                                                <p className="text-xs font-bold uppercase tracking-widest">Drop here</p>
                                            </div>
                                        )}
                                    </div>
                                </SortableContext>
                            </div>
                        );
                    })}
                </div>
            </DndContext>
        </div>
    );
}

function SortableTaskCard({ task, columnId, isDark, priorityStyles }: { task: Task; columnId: string; isDark: boolean; priorityStyles: Record<string, string> }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: task.id,
        data: { columnId }
    });

    const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';

    return (
        <div
            ref={setNodeRef}
            style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
            className={`p-5 rounded-2xl border cursor-grab active:cursor-grabbing hover:shadow-md transition-all group relative ${isOverdue ? 'border-rose-500/30 bg-rose-500/5' : isDark ? 'bg-white/5 border-white/10 hover:border-white/20' : 'bg-white border-slate-100 hover:border-slate-200 shadow-sm'}`}
            {...attributes}
            {...listeners}
        >
            <div className="flex justify-between items-start mb-2">
                <span className={`text-[9px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-widest border ${priorityStyles[task.priority]}`}>
                    {task.priority}
                </span>
                {isOverdue && <span className="text-[9px] font-extrabold text-rose-400 uppercase tracking-widest">Overdue</span>}
            </div>
            <h4 className={`font-bold text-sm mb-1 mt-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>{task.title}</h4>
            {task.description && <p className={`text-xs line-clamp-2 mb-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{task.description}</p>}
            {task.due_date && (
                <div className={`flex items-center gap-1 text-[10px] font-bold ${isOverdue ? 'text-rose-400' : isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    <Calendar size={10} />
                    {new Date(task.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </div>
            )}
            <div className="absolute right-3 bottom-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <GripVertical size={16} className={isDark ? 'text-slate-600' : 'text-slate-300'} />
            </div>
        </div>
    );
}
