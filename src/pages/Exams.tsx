import { useEffect, useState } from 'react';
import { Plus, BookOpen, X, Calendar } from 'lucide-react';
import { api, type Exam, type Class } from '../lib/supabase';
import { Badge, LoadingSpinner, EmptyState } from '../components/ui';

type ApiResponse = { success: boolean; data: any };

export default function Exams() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', class_id: '', subject: '', date: '', max_marks: '100', duration_minutes: '60' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    try {
      const [eRes, cRes] = await Promise.all([api.get<ApiResponse>('/exams'), api.get<ApiResponse>('/classes')]);
      setExams(eRes.data || []);
      setClasses(cRes.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function handleSave() {
    if (!form.name.trim() || !form.date) return;
    setSaving(true);
    try {
      await api.post<ApiResponse>('/exams', {
        name: form.name, class_id: form.class_id || null, subject: form.subject,
        date: form.date, max_marks: parseInt(form.max_marks) || 100, duration_minutes: parseInt(form.duration_minutes) || 60,
      });
    } catch (e) { console.error(e); }
    setSaving(false); setShowModal(false); fetchAll();
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this exam?')) return;
    try { await api.delete<ApiResponse>(`/exams/${id}`); } catch (e) { console.error(e); }
    fetchAll();
  }

  const today = new Date().toISOString().split('T')[0];
  const upcoming = exams.filter((e: any) => e.date >= today);
  const past = exams.filter((e: any) => e.date < today);

  const ExamCard = ({ exam }: { exam: any }) => {
    const isPast = exam.date < today;
    const daysUntil = Math.ceil((new Date(exam.date).getTime() - new Date().getTime()) / (1000*60*60*24));
    return (
      <div className={`bg-white rounded-2xl border shadow-sm p-4 hover:shadow-md transition-shadow ${isPast ? 'border-gray-100 opacity-75' : 'border-sky-100'}`}>
        <div className="flex items-start justify-between mb-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isPast ? 'bg-gray-100' : 'bg-sky-50'}`}>
            <BookOpen size={18} className={isPast ? 'text-gray-400' : 'text-sky-600'} />
          </div>
          <div className="flex items-center gap-2">
            {!isPast && daysUntil <= 7 && <Badge variant="warning">In {daysUntil}d</Badge>}
            <Badge variant={isPast ? 'neutral' : 'info'}>{isPast ? 'Completed' : 'Upcoming'}</Badge>
            <button onClick={() => handleDelete(exam.id)} className="p-1 text-gray-300 hover:text-rose-500"><X size={14} /></button>
          </div>
        </div>
        <h4 className="font-semibold text-gray-900 text-sm">{exam.name}</h4>
        <p className="text-xs text-sky-600 font-medium">{exam.subject}</p>
        <p className="text-xs text-gray-400">{exam.class_name || 'All Classes'}</p>
        <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between text-xs text-gray-500">
          <span>{new Date(exam.date).toLocaleDateString()}</span>
          <span>{exam.max_marks} marks</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <button onClick={() => { setForm({ name: '', class_id: '', subject: '', date: '', max_marks: '100', duration_minutes: '60' }); setShowModal(true); }} className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-lg text-sm font-medium"><Plus size={16} /> Create Exam</button>
      </div>

      {loading ? <LoadingSpinner /> : exams.length === 0 ? <EmptyState message="No exams scheduled" icon={BookOpen} /> : (
        <>
          {upcoming.length > 0 && <div><h3 className="text-sm font-semibold text-gray-600 mb-3">Upcoming ({upcoming.length})</h3><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">{upcoming.map(e => <ExamCard key={e.id} exam={e} />)}</div></div>}
          {past.length > 0 && <div><h3 className="text-sm font-semibold text-gray-400 mb-3 mt-4">Completed ({past.length})</h3><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">{past.map(e => <ExamCard key={e.id} exam={e} />)}</div></div>}
        </>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="font-semibold text-gray-900">Create Exam</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-3">
              <div><label className="text-xs font-medium text-gray-600 block mb-1">Exam Name *</label><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-medium text-gray-600 block mb-1">Subject</label><input value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" /></div>
                <div><label className="text-xs font-medium text-gray-600 block mb-1">Class</label><select value={form.class_id} onChange={e => setForm({...form, class_id: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none"><option value="">All Classes</option>{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
              </div>
              <div><label className="text-xs font-medium text-gray-600 block mb-1">Date *</label><input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-medium text-gray-600 block mb-1">Max Marks</label><input type="number" value={form.max_marks} onChange={e => setForm({...form, max_marks: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" /></div>
                <div><label className="text-xs font-medium text-gray-600 block mb-1">Duration (min)</label><input type="number" value={form.duration_minutes} onChange={e => setForm({...form, duration_minutes: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" /></div>
              </div>
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t bg-gray-50 rounded-b-2xl">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-lg">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="px-5 py-2 text-sm bg-sky-500 hover:bg-sky-600 text-white rounded-lg disabled:opacity-60 font-medium">{saving ? 'Saving...' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
