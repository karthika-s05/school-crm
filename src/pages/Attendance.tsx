import { useEffect, useState } from 'react';
import { Calendar as CalendarIcon, CheckCircle2, XCircle, Clock, ClipboardCheck, Users, Save } from 'lucide-react';
import { api } from '../lib/supabase';
import {
  PageHeader, SectionCard, Badge, LoadingSpinner, EmptyState,
  Button, SelectInput, Avatar, Card, StatCard
} from '../components/ui';

type ApiResponse = { success: boolean; data: any };

export default function Attendance() {
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [records, setRecords] = useState<Map<string, string>>(new Map());
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get<ApiResponse>('/classes').then((res) => setClasses(res.data || []));
  }, []);

  useEffect(() => {
    if (selectedClass) loadClassStudents();
  }, [selectedClass, selectedDate]);

  async function loadClassStudents() {
    setLoading(true);
    try {
      const [sRes, aRes] = await Promise.all([
        api.get<ApiResponse>(`/students?class_id=${selectedClass}&status=active`),
        api.get<ApiResponse>(`/attendance?date=${selectedDate}`),
      ]);
      setStudents(sRes.data || []);
      const recMap = new Map<string, string>();
      (aRes.data || []).forEach((a: any) => {
        if (a.student_id) recMap.set(a.student_id, a.status);
      });
      setRecords(recMap);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  function setStatus(studentId: string, status: 'present' | 'absent' | 'late') {
    setRecords(prev => new Map(prev).set(studentId, status));
  }

  function markAll(status: 'present' | 'absent') {
    const newRecords = new Map<string, string>();
    students.forEach(s => newRecords.set(s.id, status));
    setRecords(newRecords);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const recordsArray = students.map(s => ({
        student_id: s.id,
        date: selectedDate,
        status: records.get(s.id) || 'present',
      }));
      await api.post<ApiResponse>('/attendance/bulk', { records: recordsArray });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) { console.error(e); }
    setSaving(false);
  }

  const present = Array.from(records.values()).filter(s => s === 'present').length;
  const absent = Array.from(records.values()).filter(s => s === 'absent').length;
  const late = Array.from(records.values()).filter(s => s === 'late').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance"
        subtitle="Mark daily attendance for students"
      />

      <Card className="p-5">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Select Class</label>
            <SelectInput
              value={selectedClass}
              onChange={setSelectedClass}
              options={classes.map(c => ({ value: c.id, label: c.name }))}
              placeholder="Choose a class..."
              className="w-full sm:w-64"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-300"
            />
          </div>
          {students.length > 0 && (
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => markAll('present')}>
                All Present
              </Button>
              <Button variant="secondary" size="sm" onClick={() => markAll('absent')}>
                All Absent
              </Button>
            </div>
          )}
        </div>

        {students.length > 0 && (
          <div className="flex gap-6 mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-sm text-gray-600 font-medium">{present} Present</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500" />
              <span className="text-sm text-gray-600 font-medium">{absent} Absent</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="text-sm text-gray-600 font-medium">{late} Late</span>
            </div>
            <div className="text-sm text-gray-400 ml-auto">
              {students.length} total students
            </div>
          </div>
        )}
      </Card>

      {!selectedClass ? (
        <EmptyState message="Select a class to mark attendance" icon={ClipboardCheck} />
      ) : loading ? (
        <LoadingSpinner />
      ) : students.length === 0 ? (
        <EmptyState message="No students in this class" icon={Users} />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {students.map(student => {
              const status = records.get(student.id) || 'present';
              const statusStyles = {
                present: 'border-emerald-200 bg-emerald-50',
                absent: 'border-rose-200 bg-rose-50',
                late: 'border-amber-200 bg-amber-50',
              };

              return (
                <Card key={student.id} className={`p-4 border-2 ${statusStyles[status as keyof typeof statusStyles]}`}>
                  <div className="flex items-center gap-3">
                    <Avatar name={student.name} color="sky" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{student.name}</p>
                      <p className="text-xs text-gray-400">{student.roll_number || 'No roll number'}</p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setStatus(student.id, 'present')}
                        className={`p-2 rounded-lg transition-all ${status === 'present' ? 'bg-emerald-500 text-white' : 'bg-gray-100 hover:bg-emerald-100 text-gray-400'}`}
                        title="Present"
                      >
                        <CheckCircle2 size={16} />
                      </button>
                      <button
                        onClick={() => setStatus(student.id, 'late')}
                        className={`p-2 rounded-lg transition-all ${status === 'late' ? 'bg-amber-500 text-white' : 'bg-gray-100 hover:bg-amber-100 text-gray-400'}`}
                        title="Late"
                      >
                        <Clock size={16} />
                      </button>
                      <button
                        onClick={() => setStatus(student.id, 'absent')}
                        className={`p-2 rounded-lg transition-all ${status === 'absent' ? 'bg-rose-500 text-white' : 'bg-gray-100 hover:bg-rose-100 text-gray-400'}`}
                        title="Absent"
                      >
                        <XCircle size={16} />
                      </button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              loading={saving}
              icon={saved ? CheckCircle2 : Save}
              variant={saved ? 'secondary' : 'primary'}
              size="lg"
            >
              {saved ? 'Saved!' : 'Save Attendance'}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
