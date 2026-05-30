import { useEffect, useState } from 'react';
import { Calendar, Plus, Clock, User, BookOpen } from 'lucide-react';
import { api } from '../lib/supabase';
import {
  PageHeader, LoadingSpinner, EmptyState,
  SelectInput, Button, Modal, ModalFooter, FormInput, FormSelect, Card
} from '../components/ui';

type ApiResponse = { success: boolean; data: any };

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];
const PERIOD_TIMES = [
  '08:00 - 08:45', '08:45 - 09:30', '09:30 - 10:15', '10:30 - 11:15',
  '11:15 - 12:00', '12:00 - 12:45', '13:30 - 14:15', '14:15 - 15:00'
];

export default function Timetable() {
  const [entries, setEntries] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    day_of_week: 'Monday', period_number: '1', subject: '', teacher_id: '',
    start_time: '08:00', end_time: '08:45',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get<ApiResponse>('/classes'),
      api.get<ApiResponse>('/teachers'),
    ]).then(([cRes, tRes]) => {
      setClasses(cRes.data || []);
      setTeachers(tRes.data || []);
    });
  }, []);

  useEffect(() => {
    if (selectedClass) loadEntries();
  }, [selectedClass]);

  async function loadEntries() {
    setLoading(true);
    try {
      const res = await api.get<ApiResponse>(`/timetable/class/${selectedClass}`);
      setEntries(res.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function handleSave() {
    if (!form.subject.trim()) return;
    setSaving(true);
    try {
      await api.post<ApiResponse>('/timetable', {
        ...form,
        class_id: selectedClass,
        period_number: parseInt(form.period_number),
      });
    } catch (e) { console.error(e); }
    setSaving(false);
    setShowModal(false);
    loadEntries();
  }

  function getEntry(day: string, period: number) {
    return entries.find((e: any) => e.day_of_week === day && e.period_number === period);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Timetable"
        subtitle="Manage class schedules and periods"
      />

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-3 items-center">
          <SelectInput
            value={selectedClass}
            onChange={setSelectedClass}
            options={classes.map(c => ({ value: c.id, label: c.name }))}
            placeholder="Select Class"
            className="w-48"
          />
          {selectedClass && (
            <Button
              icon={Plus}
              onClick={() => {
                setForm({
                  day_of_week: 'Monday', period_number: '1', subject: '',
                  teacher_id: '', start_time: '08:00', end_time: '08:45',
                });
                setShowModal(true);
              }}
            >
              Add Period
            </Button>
          )}
        </div>
      </div>

      {!selectedClass ? (
        <EmptyState message="Select a class to view timetable" icon={Calendar} />
      ) : loading ? (
        <LoadingSpinner />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-28">
                    <div className="flex flex-col">
                      <span>Period</span>
                      <span className="text-gray-300 font-normal normal-case">Time</span>
                    </div>
                  </th>
                  {DAYS.map(day => (
                    <th key={day} className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PERIODS.map((period, i) => (
                  <tr key={period} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-4 py-3 bg-gray-50/50">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-700">Period {period}</span>
                        <span className="text-xs text-gray-400">{PERIOD_TIMES[i]}</span>
                      </div>
                    </td>
                    {DAYS.map(day => {
                      const entry = getEntry(day, period);
                      return (
                        <td key={`${day}-${period}`} className="px-4 py-3 border-l border-gray-50">
                          {entry ? (
                            <div className="bg-sky-50 rounded-lg p-3 min-h-[60px]">
                              <p className="font-medium text-sky-700 text-sm">{entry.subject}</p>
                              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                <User size={10} />
                                {entry.teacher_name || 'No teacher'}
                              </p>
                            </div>
                          ) : (
                            <div className="text-gray-200 text-xs py-4 text-center">-</div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Add Period to Timetable"
      >
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormSelect
              label="Day"
              value={form.day_of_week}
              onChange={(v) => setForm({ ...form, day_of_week: v })}
              options={DAYS.map(d => ({ value: d, label: d }))}
            />
            <FormSelect
              label="Period"
              value={form.period_number}
              onChange={(v) => setForm({ ...form, period_number: v })}
              options={PERIODS.map(p => ({ value: String(p), label: `Period ${p}` }))}
            />
          </div>
          <FormInput
            label="Subject"
            value={form.subject}
            onChange={(v) => setForm({ ...form, subject: v })}
            required
            placeholder="e.g., Mathematics"
          />
          <FormSelect
            label="Teacher"
            value={form.teacher_id}
            onChange={(v) => setForm({ ...form, teacher_id: v })}
            options={teachers.map(t => ({ value: t.id, label: t.name }))}
            placeholder="Select teacher"
          />
          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="Start Time"
              type="time"
              value={form.start_time}
              onChange={(v) => setForm({ ...form, start_time: v })}
            />
            <FormInput
              label="End Time"
              type="time"
              value={form.end_time}
              onChange={(v) => setForm({ ...form, end_time: v })}
            />
          </div>
        </div>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button onClick={handleSave} loading={saving}>Add Period</Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
