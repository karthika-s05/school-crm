import { useEffect, useState } from 'react';
import { Plus, BookOpen, Calendar, Clock, Trash2, Award } from 'lucide-react';
import { api } from '../lib/supabase';
import {
  PageHeader, SectionCard, Badge, LoadingSpinner, EmptyState,
  Button, Modal, ModalFooter, FormInput, FormSelect, Card
} from '../components/ui';

type ApiResponse = { success: boolean; data: any };

export default function Exams() {
  const [exams, setExams] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: '', class_id: '', subject: '', date: '', max_marks: '100', duration_minutes: '60',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    try {
      const [eRes, cRes] = await Promise.all([
        api.get<ApiResponse>('/exams'),
        api.get<ApiResponse>('/classes'),
      ]);
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
        ...form,
        class_id: form.class_id || null,
        max_marks: parseInt(form.max_marks) || 100,
        duration_minutes: parseInt(form.duration_minutes) || 60,
      });
    } catch (e) { console.error(e); }
    setSaving(false);
    setShowModal(false);
    fetchAll();
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this exam?')) return;
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
      <Card className={`p-5 ${isPast ? 'opacity-75' : ''}`} hover>
        <div className="flex items-start justify-between mb-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isPast ? 'bg-gray-100' : 'bg-sky-50'}`}>
            <BookOpen size={22} className={isPast ? 'text-gray-400' : 'text-sky-600'} />
          </div>
          <div className="flex items-center gap-2">
            {!isPast && daysUntil <= 7 && (
              <Badge variant="warning">In {daysUntil} days</Badge>
            )}
            <Badge variant={isPast ? 'neutral' : 'info'}>
              {isPast ? 'Completed' : 'Upcoming'}
            </Badge>
            <Button variant="ghost" size="sm" onClick={() => handleDelete(exam.id)}>
              <Trash2 size={14} className="text-rose-500" />
            </Button>
          </div>
        </div>

        <h3 className="font-semibold text-gray-900 text-base mb-1">{exam.name}</h3>
        <p className="text-sm text-sky-600 font-medium">{exam.subject}</p>
        <p className="text-xs text-gray-400 mt-1">{exam.class_name || 'All Classes'}</p>

        <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Calendar size={12} />
            <span>{new Date(exam.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Award size={12} />
              {exam.max_marks} marks
            </span>
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {exam.duration_minutes} min
            </span>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Examinations"
        subtitle={`${exams.length} exams scheduled`}
        action={
          <Button icon={Plus} onClick={() => {
            setForm({ name: '', class_id: '', subject: '', date: '', max_marks: '100', duration_minutes: '60' });
            setShowModal(true);
          }}>
            Create Exam
          </Button>
        }
      />

      {loading ? (
        <LoadingSpinner />
      ) : exams.length === 0 ? (
        <EmptyState message="No exams scheduled" icon={BookOpen} />
      ) : (
        <>
          {upcoming.length > 0 && (
            <SectionCard title={`Upcoming Exams (${upcoming.length})`}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {upcoming.map((exam) => (
                  <ExamCard key={exam.id} exam={exam} />
                ))}
              </div>
            </SectionCard>
          )}

          {past.length > 0 && (
            <SectionCard title={`Completed Exams (${past.length})`}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {past.map((exam) => (
                  <ExamCard key={exam.id} exam={exam} />
                ))}
              </div>
            </SectionCard>
          )}
        </>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Create New Exam"
      >
        <div className="p-6 space-y-4">
          <FormInput
            label="Exam Name"
            value={form.name}
            onChange={(v) => setForm({ ...form, name: v })}
            required
            placeholder="e.g., Mid-Term Mathematics"
          />
          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="Subject"
              value={form.subject}
              onChange={(v) => setForm({ ...form, subject: v })}
              placeholder="e.g., Mathematics"
            />
            <FormSelect
              label="Class"
              value={form.class_id}
              onChange={(v) => setForm({ ...form, class_id: v })}
              options={classes.map(c => ({ value: c.id, label: c.name }))}
              placeholder="All Classes"
            />
          </div>
          <FormInput
            label="Date"
            type="date"
            value={form.date}
            onChange={(v) => setForm({ ...form, date: v })}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="Maximum Marks"
              type="number"
              value={form.max_marks}
              onChange={(v) => setForm({ ...form, max_marks: v })}
              placeholder="100"
            />
            <FormInput
              label="Duration (minutes)"
              type="number"
              value={form.duration_minutes}
              onChange={(v) => setForm({ ...form, duration_minutes: v })}
              placeholder="60"
            />
          </div>
        </div>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button onClick={handleSave} loading={saving}>Create Exam</Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
