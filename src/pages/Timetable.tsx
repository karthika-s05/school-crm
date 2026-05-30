import { useEffect, useState } from 'react';
import { Plus, X, Calendar } from 'lucide-react';
import { api, type TimetableEntry, type Class, type Teacher } from '../lib/supabase';
import { LoadingSpinner, SectionCard } from '../components/ui';

type ApiResponse = { success: boolean; data: any };

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];
const PERIOD_TIMES = ['08:00–08:45', '08:45–09:30', '09:30–10:15', '10:30–11:15', '11:15–12:00', '12:00–12:45', '13:30–14:15', '14:15–15:00'];

export default function Timetable() {
  const [entries, setEntries] = useState<any[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ day_of_week: 'Monday', period_number: '1', subject: '', teacher_id: '', start_time: '08:00', end_time: '08:45' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([api.get<ApiResponse>('/classes'), api.get<ApiResponse>('/teachers')]).then(([cRes, tRes]) => {
      setClasses(cRes.data || []);
      setTeachers(tRes.data || []);
    });
  }, []);

  useEffect(() => { if (selectedClass) loadEntries(); }, [selectedClass]);

  async function loadEntries() {
    setLoading(true);
    const res = await api.get<ApiResponse>(`/timetable/class/${selectedClass}`);
    setEntries(res.data || []);
    setLoading(false);
  }

  async function handleSave() {
    setSaving(true);
    await api.post<ApiResponse>('/timetable', { ...form, class_id: selectedClass, period_number: parseInt(form.period_number) });
    setSaving(false); setShowModal(false); loadEntries();
  }

  function getEntry(day: string, period: number) {
    return entries.find((e: any) => e.day_of_week === day && e.period_number === period);
  }

  return (
    <div className="space-y-5">
      <div className="flex gap-3 items-center">
        <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none">
          <option value="">Select Class</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        {selectedClass && <button onClick={() => { setForm({ day_of_week: 'Monday', period_number: '1', subject: '', teacher_id: '', start_time: '08:00', end_time: '08:45' }); setShowModal(true); }} className="flex items-center gap-2 bg-sky-500 text-white px-4 py-2 rounded-lg text-sm font-medium"><Plus size={16} /> Add Period</button>}
      </div>

      {loading ? <LoadingSpinner /> : !selectedClass ? (
        <div className="bg-white rounded-2xl border p-12 text-center"><Calendar size={48} className="text-gray-200 mx-auto mb-3" /><p className="text-gray-400">Select a class to view timetable</p></div>
      ) : (
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 w-24">Period</th>
                {DAYS.map(d => <th key={d} className="px-4 py-3 text-xs font-semibold text-gray-500">{d}</th>)}
              </tr>
            </thead>
            <tbody>
              {PERIODS.map((p, i) => (
                <tr key={p} className="border-t border-gray-100">
                  <td className="px-4 py-3 text-xs text-gray-500"><div className="font-medium">{p}</div><div className="text-gray-300">{PERIOD_TIMES[i]}</div></td>
                  {DAYS.map(d => {
                    const entry = getEntry(d, p);
                    return (
                      <td key={`${d}-${p}`} className="px-4 py-3 border-l border-gray-50">
                        {entry ? <div className="bg-sky-50 rounded-lg p-2"><p className="text-xs font-medium text-sky-700">{entry.subject}</p><p className="text-xs text-gray-400">{entry.teacher_name}</p></div> : <div className="text-gray-200 text-xs">-</div>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="font-semibold">Add Period</h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded hover:bg-gray-100"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-medium block mb-1">Day</label><select value={form.day_of_week} onChange={e => setForm({...form, day_of_week: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm">{DAYS.map(d => <option key={d} value={d}>{d}</option>)}</select></div>
                <div><label className="text-xs font-medium block mb-1">Period</label><select value={form.period_number} onChange={e => setForm({...form, period_number: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm">{PERIODS.map(p => <option key={p} value={p}>{p}</option>)}</select></div>
              </div>
              <div><label className="text-xs font-medium block mb-1">Subject</label><input value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
              <div><label className="text-xs font-medium block mb-1">Teacher</label><select value={form.teacher_id} onChange={e => setForm({...form, teacher_id: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm"><option value="">Select</option>{teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t bg-gray-50 rounded-b-2xl">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-lg">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="px-5 py-2 text-sm bg-sky-500 text-white rounded-lg disabled:opacity-60">{saving ? 'Saving...' : 'Add'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
