import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Clock, ClipboardCheck } from 'lucide-react';
import { api, type Student, type Class } from '../lib/supabase';
import { Badge, LoadingSpinner, EmptyState, SectionCard } from '../components/ui';

type AttendanceRecord = { student_id: string; status: 'present' | 'absent' | 'late' };

export default function Attendance() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get('/classes').then((res: any) => setClasses(res.data || []));
  }, []);

  useEffect(() => {
    if (selectedClass) loadClassStudents();
  }, [selectedClass, selectedDate]);

  async function loadClassStudents() {
    setLoading(true);
    const [sRes, aRes] = await Promise.all([
      api.get(`/students?class_id=${selectedClass}&status=active`),
      api.get(`/attendance?date=${selectedDate}`),
    ]);
    const studentsData = (sRes.data || []) as Student[];
    const attendanceData = aRes.data || [];
    setStudents(studentsData);
    const recs: AttendanceRecord[] = studentsData.map(s => {
      const existing = attendanceData.find((a: any) => a.student_id === s.id);
      return { student_id: s.id, status: (existing?.status as 'present' | 'absent' | 'late') || 'present' };
    });
    setRecords(recs);
    setLoading(false);
  }

  function setStatus(studentId: string, status: 'present' | 'absent' | 'late') {
    setRecords(prev => prev.map(r => r.student_id === studentId ? { ...r, status } : r));
  }

  function markAll(status: 'present' | 'absent') {
    setRecords(prev => prev.map(r => ({ ...r, status })));
  }

  async function handleSave() {
    setSaving(true);
    const rows = records.map(r => ({ student_id: r.student_id, date: selectedDate, status: r.status }));
    await api.post('/attendance/bulk', { records: rows });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const present = records.filter(r => r.status === 'present').length;
  const absent = records.filter(r => r.status === 'absent').length;
  const late = records.filter(r => r.status === 'late').length;

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="text-xs font-medium text-gray-600 block mb-1">Select Class</label>
            <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-200">
              <option value="">Choose a class...</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Date</label>
            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-200" />
          </div>
          {students.length > 0 && (
            <div className="flex gap-2">
              <button onClick={() => markAll('present')} className="px-3 py-2 text-xs font-medium bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors">All Present</button>
              <button onClick={() => markAll('absent')} className="px-3 py-2 text-xs font-medium bg-rose-50 text-rose-700 rounded-lg hover:bg-rose-100 transition-colors">All Absent</button>
            </div>
          )}
        </div>

        {students.length > 0 && (
          <div className="flex gap-4 mt-4 pt-4 border-t border-gray-50">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-xs text-gray-600 font-medium">{present} Present</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500" />
              <span className="text-xs text-gray-600 font-medium">{absent} Absent</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="text-xs text-gray-600 font-medium">{late} Late</span>
            </div>
            <div className="text-xs text-gray-400 ml-auto">
              {students.length} total
            </div>
          </div>
        )}
      </div>

      {/* Attendance List */}
      {!selectedClass ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <ClipboardCheck size={48} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Select a class to mark attendance</p>
        </div>
      ) : loading ? <LoadingSpinner /> : students.length === 0 ? (
        <EmptyState message="No students in this class" icon={ClipboardCheck} />
      ) : (
        <SectionCard title={`Attendance - ${selectedDate}`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {students.map(s => {
              const rec = records.find(r => r.student_id === s.id);
              const status = rec?.status || 'present';
              return (
                <div key={s.id} className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                  status === 'present' ? 'border-emerald-200 bg-emerald-50'
                  : status === 'absent' ? 'border-rose-200 bg-rose-50'
                  : 'border-amber-200 bg-amber-50'
                }`}>
                  <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-700 text-xs font-bold flex-shrink-0">
                    {s.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{s.name}</p>
                    <p className="text-xs text-gray-400">{s.roll_number}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => setStatus(s.id, 'present')} title="Present" className={`p-1 rounded-md transition-colors ${status === 'present' ? 'text-emerald-600' : 'text-gray-300 hover:text-emerald-400'}`}>
                      <CheckCircle2 size={18} />
                    </button>
                    <button onClick={() => setStatus(s.id, 'late')} title="Late" className={`p-1 rounded-md transition-colors ${status === 'late' ? 'text-amber-500' : 'text-gray-300 hover:text-amber-400'}`}>
                      <Clock size={18} />
                    </button>
                    <button onClick={() => setStatus(s.id, 'absent')} title="Absent" className={`p-1 rounded-md transition-colors ${status === 'absent' ? 'text-rose-500' : 'text-gray-300 hover:text-rose-400'}`}>
                      <XCircle size={18} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-5 flex justify-end">
            <button onClick={handleSave} disabled={saving} className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
              saved ? 'bg-emerald-500 text-white' : 'bg-sky-500 hover:bg-sky-600 text-white'
            } disabled:opacity-60`}>
              {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Attendance'}
            </button>
          </div>
        </SectionCard>
      )}
    </div>
  );
}
