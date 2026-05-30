import { useEffect, useState } from 'react';
import { UserPlus, Search, Pencil, Trash2, GraduationCap, Mail, Phone, Calendar } from 'lucide-react';
import { api, type Teacher } from '../lib/supabase';
import {
  PageHeader, Badge, LoadingSpinner, EmptyState, SearchInput,
  Button, Modal, ModalFooter, FormInput, FormSelect, Avatar, Card
} from '../components/ui';

type ApiResponse = { success: boolean; data: any };

export default function Teachers() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Teacher | null>(null);
  const [form, setForm] = useState({
    name: '', email: '', phone: '', subject: '', qualification: '', join_date: '', status: 'active',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    try {
      const res = await api.get<ApiResponse>('/teachers');
      setTeachers(res.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  function openAdd() {
    setEditing(null);
    setForm({
      name: '', email: '', phone: '', subject: '', qualification: '',
      join_date: new Date().toISOString().split('T')[0], status: 'active',
    });
    setShowModal(true);
  }

  function openEdit(t: Teacher) {
    setEditing(t);
    setForm({
      name: t.name, email: t.email || '', phone: t.phone || '',
      subject: t.subject || '', qualification: t.qualification || '',
      join_date: t.join_date || '', status: t.status || 'active',
    });
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.name.trim() || !form.email.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        await api.put<ApiResponse>(`/teachers/${editing.id}`, form);
      } else {
        await api.post<ApiResponse>('/teachers', form);
      }
    } catch (e) { console.error(e); }
    setSaving(false);
    setShowModal(false);
    fetchAll();
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this teacher?')) return;
    try { await api.delete<ApiResponse>(`/teachers/${id}`); } catch (e) { console.error(e); }
    fetchAll();
  }

  const filtered = teachers.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    (t.subject || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Teachers"
        subtitle={`${teachers.length} teaching staff members`}
        action={<Button icon={UserPlus} onClick={openAdd}>Add Teacher</Button>}
      />

      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Search by name or subject..."
        className="max-w-md"
      />

      {loading ? (
        <LoadingSpinner />
      ) : filtered.length === 0 ? (
        <EmptyState message="No teachers found" icon={GraduationCap} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(teacher => (
            <Card key={teacher.id} className="p-5" hover>
              <div className="flex items-start justify-between mb-4">
                <Avatar name={teacher.name} color="emerald" size="lg" />
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(teacher)}>
                    <Pencil size={14} />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(teacher.id)}>
                    <Trash2 size={14} className="text-rose-500" />
                  </Button>
                </div>
              </div>

              <h3 className="font-semibold text-gray-900 text-base">{teacher.name}</h3>
              <p className="text-sm text-emerald-600 font-medium mt-0.5">{teacher.subject || 'General'}</p>
              <p className="text-xs text-gray-400 mt-1">{teacher.qualification || 'N/A'}</p>

              <div className="mt-4 pt-4 border-t border-gray-50 space-y-2">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Mail size={12} />
                  <span className="truncate">{teacher.email || 'No email'}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Phone size={12} />
                  <span>{teacher.phone || 'No phone'}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Calendar size={12} />
                  <span>Joined {teacher.join_date ? new Date(teacher.join_date).getFullYear() : 'N/A'}</span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-gray-400">{(teacher as any).class_name || 'No class assigned'}</span>
                <Badge variant={teacher.status === 'active' ? 'success' : 'danger'}>{teacher.status}</Badge>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? 'Edit Teacher' : 'Add New Teacher'}
      >
        <div className="p-6 space-y-4">
          <FormInput
            label="Full Name"
            value={form.name}
            onChange={(v) => setForm({ ...form, name: v })}
            required
            placeholder="Teacher's full name"
          />
          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="Email"
              type="email"
              value={form.email}
              onChange={(v) => setForm({ ...form, email: v })}
              required
              placeholder="teacher@school.edu"
            />
            <FormInput
              label="Phone"
              value={form.phone}
              onChange={(v) => setForm({ ...form, phone: v })}
              placeholder="+1-555-0000"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="Subject"
              value={form.subject}
              onChange={(v) => setForm({ ...form, subject: v })}
              placeholder="e.g., Mathematics"
            />
            <FormInput
              label="Qualification"
              value={form.qualification}
              onChange={(v) => setForm({ ...form, qualification: v })}
              placeholder="e.g., M.Sc, B.Ed"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="Join Date"
              type="date"
              value={form.join_date}
              onChange={(v) => setForm({ ...form, join_date: v })}
            />
            <FormSelect
              label="Status"
              value={form.status}
              onChange={(v) => setForm({ ...form, status: v })}
              options={[
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
                { value: 'on_leave', label: 'On Leave' },
              ]}
            />
          </div>
        </div>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button onClick={handleSave} loading={saving}>
            {editing ? 'Update Teacher' : 'Add Teacher'}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
