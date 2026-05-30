import { useEffect, useState } from 'react';
import { Plus, X, Calendar } from 'lucide-react';
import { supabase, type TimetableEntry, type Class, type Teacher } from '../lib/supabase';
import { LoadingSpinner, SectionCard } from '../components/ui';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];
const PERIOD_TIMES = ['08:00–08:45', '08:45–09:30', '09:30–10:15', '10:30–11:15', '11:15–12:00', '12:00–12:45', '13:30–14:15', '14:15–15:00'];

export default function Timetable() {
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ day_of_week: 'Monday', period_number: '1', subject: '', teacher_id: '', start_time: '08:00', end_time: '08:45' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      supabase.from('classes').select('*').order('grade'),
      supabase.from('teachers').select('*').order('name'),
    ]).then(([cRes, tRes]) => {
      setClasses((cRes.data || []) as Class[]);
      setTeachers((tRes.data || []) as Teacher[]);
    });
  }, []);

  useEffect(() => { if (selectedClass) loadEntries(); }, [selectedClass]);

  async function loadEntries() {
    setLoading(true);
    const { data } = await supabase.from('timetable').select('*, teachers(name, subject)').eq('class_id', selectedClass).order('period_number');
    setEntries((data || []) as unknown as TimetableEntry[]);
    setLoading(false);
  }

  async function handleSave() {
    if (!form.subject || !selectedClass) return;
    setSaving(true);
    await supabase.from('timetable').insert({
      class_id: selectedClass,
      day_of_week: form.day_of_week,
      period_number: parseInt(form.period_number),
      subject: form.subject,
      teacher_id: form.teacher_id || null,
      start_time: form.start_time,
      end_time: form.end_time,
    });
    setSaving(false);
    setShowModal(false);
    loadEntries();
  }

  async function handleDelete(id: string) {
    await supabase.from('timetable').delete().eq('id', id);
    loadEntries();
  }

  const getCell = (day: string, period: number) =>
    entries.filter(e => e.day_of_week === day && e.period_number === period);

  const subjectColors: Record<string, string> = {
    Mathematics: 'bg-sky-100 text-sky-700 border-sky-200',
    Science: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    English: 'bg-amber-100 text-amber-700 border-amber-200',
    History: 'bg-rose-100 text-rose-700 border-rose-200',
    Geography: 'bg-teal-100 text-teal-700 border-teal-200',
    'Computer Science': 'bg-blue-100 text-blue-700 border-blue-200',
    'Physical Education': 'bg-orange-100 text-orange-700 border-orange-200',
    'Art & Design': 'bg-pink-100 text-pink-700 border-pink-200',
  };

  const getColor = (subject: string) => subjectColors[subject] || 'bg-gray-100 text-gray-700 border-gray-200';

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row gap-3 items-end justify-between">
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">Select Class</label>
          <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-200">
            <option value="">Choose a class...</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        {selectedClass && (
          <button onClick={() => { setForm({ day_of_week: 'Monday', period_number: '1', subject: '', teacher_id: '', start_time: '08:00', end_time: '08:45' }); setShowModal(true); }} className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <Plus size={16} /> Add Period
          </button>
        )}
      </div>

      {!selectedClass ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <Calendar size={48} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Select a class to view timetable</p>
        </div>
      ) : loading ? <LoadingSpinner /> : (
        <SectionCard title={`Weekly Timetable - ${classes.find(c => c.id === selectedClass)?.name}`}>
          <div className="overflow-x-auto -mx-5">
            <table className="w-full text-xs min-w-[700px]">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-gray-500 font-semibold w-24 whitespace-nowrap">Period</th>
                  {DAYS.map(d => (
                    <th key={d} className="text-left px-3 py-3 text-gray-500 font-semibold whitespace-nowrap">{d}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PERIODS.map((p, pi) => (
                  <tr key={p} className="border-b border-gray-50">
                    <td className="px-5 py-3 text-gray-400 font-medium whitespace-nowrap">
                      <div>P{p}</div>
                      <div className="text-gray-300" style={{ fontSize: '9px' }}>{PERIOD_TIMES[pi]}</div>
                    </td>
                    {DAYS.map(d => {
                      const cells = getCell(d, p);
                      return (
                        <td key={d} className="px-3 py-2 min-w-[100px]">
                          {cells.map(cell => (
                            <div key={cell.id} className={`text-xs px-2 py-1.5 rounded-lg border mb-1 flex items-start justify-between gap-1 ${getColor(cell.subject)}`}>
                              <div>
                                <div className="font-semibold">{cell.subject}</div>
                                {(cell as any).teachers?.name && <div className="opacity-70" style={{ fontSize: '9px' }}>{(cell as any).teachers.name.split(' ')[0]}</div>}
                              </div>
                              <button onClick={() => handleDelete(cell.id)} className="opacity-50 hover:opacity-100 flex-shrink-0 mt-0.5">
                                <X size={10} />
                              </button>
                            </div>
                          ))}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="font-semibold text-gray-900">Add Period</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Day</label>
                  <select value={form.day_of_week} onChange={e => setForm({...form, day_of_week: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-200">
                    {DAYS.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Period</label>
                  <select value={form.period_number} onChange={e => setForm({...form, period_number: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-200">
                    {PERIODS.map(p => <option key={p} value={p}>Period {p}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Subject *</label>
                <input value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-200" placeholder="Mathematics" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Teacher</label>
                <select value={form.teacher_id} onChange={e => setForm({...form, teacher_id: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-200">
                  <option value="">Select teacher</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Start Time</label>
                  <input type="time" value={form.start_time} onChange={e => setForm({...form, start_time: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-200" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">End Time</label>
                  <input type="time" value={form.end_time} onChange={e => setForm({...form, end_time: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-200" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t bg-gray-50 rounded-b-2xl">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="px-5 py-2 text-sm bg-sky-500 hover:bg-sky-600 text-white rounded-lg transition-colors disabled:opacity-60 font-medium">
                {saving ? 'Saving...' : 'Add Period'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
