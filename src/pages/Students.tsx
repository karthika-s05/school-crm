import { useEffect, useState } from 'react';
import { UserPlus, Search, Pencil, Trash2, Users } from 'lucide-react';
import { api, type Student, type Class } from '../lib/supabase';
import {
  PageHeader, SectionCard, Badge, LoadingSpinner, EmptyState,
  SearchInput, SelectInput, Button, Modal, ModalFooter,
  FormInput, FormSelect, FormTextarea, Avatar, DataTable
} from '../components/ui';

type ApiResponse = { success: boolean; data: any };

export default function Students() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [form, setForm] = useState({
    name: '', email: '', phone: '', parent_name: '', parent_phone: '',
    class_id: '', dob: '', gender: 'male', address: '', roll_number: '', status: 'active',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    try {
      const [sRes, cRes] = await Promise.all([
        api.get<ApiResponse>('/students'),
        api.get<ApiResponse>('/classes'),
      ]);
      setStudents(sRes.data || []);
      setClasses(cRes.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  function openAdd() {
    setEditing(null);
    setForm({
      name: '', email: '', phone: '', parent_name: '', parent_phone: '',
      class_id: '', dob: '', gender: 'male', address: '', roll_number: '', status: 'active',
    });
    setShowModal(true);
  }

  function openEdit(s: Student) {
    setEditing(s);
    setForm({
      name: s.name, email: s.email || '', phone: s.phone || '',
      parent_name: s.parent_name || '', parent_phone: s.parent_phone || '',
      class_id: s.class_id || '', dob: s.dob || '', gender: s.gender || 'male',
      address: s.address || '', roll_number: s.roll_number || '', status: s.status || 'active',
    });
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const payload = { ...form, class_id: form.class_id || null, dob: form.dob || null };
      if (editing) {
        await api.put<ApiResponse>(`/students/${editing.id}`, payload);
      } else {
        await api.post<ApiResponse>('/students', payload);
      }
    } catch (e) { console.error(e); }
    setSaving(false);
    setShowModal(false);
    fetchAll();
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this student?')) return;
    try { await api.delete<ApiResponse>(`/students/${id}`); } catch (e) { console.error(e); }
    fetchAll();
  }

  const filtered = students.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.roll_number || '').toLowerCase().includes(search.toLowerCase());
    const matchClass = !filterClass || s.class_id === filterClass;
    return matchSearch && matchClass;
  });

  const columns = [
    {
      key: 'name',
      header: 'Student',
      render: (s: any) => (
        <div className="flex items-center gap-3">
          <Avatar name={s.name} color="sky" />
          <div>
            <p className="font-medium text-gray-900">{s.name}</p>
            <p className="text-xs text-gray-400">{s.roll_number || 'No roll number'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'class_name',
      header: 'Class',
      render: (s: any) => <span className="text-gray-600">{s.class_name || '—'}</span>,
    },
    {
      key: 'gender',
      header: 'Gender',
      render: (s: any) => <Badge variant={s.gender === 'male' ? 'info' : 'success'}>{s.gender}</Badge>,
    },
    {
      key: 'parent_name',
      header: 'Parent',
      render: (s: any) => <span className="text-gray-600">{s.parent_name || '—'}</span>,
    },
    {
      key: 'parent_phone',
      header: 'Contact',
      render: (s: any) => <span className="text-gray-500 text-xs">{s.parent_phone || s.phone || '—'}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (s: any) => <Badge variant={s.status === 'active' ? 'success' : 'danger'}>{s.status}</Badge>,
    },
    {
      key: 'actions',
      header: '',
      className: 'w-20',
      render: (s: any) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => openEdit(s)}>
            <Pencil size={14} />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleDelete(s.id)}>
            <Trash2 size={14} className="text-rose-500" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Students"
        subtitle={`${students.length} total students enrolled`}
        action={
          <Button icon={UserPlus} onClick={openAdd}>
            Add Student
          </Button>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by name or roll number..."
          className="flex-1"
        />
        <SelectInput
          value={filterClass}
          onChange={setFilterClass}
          options={classes.map(c => ({ value: c.id, label: c.name }))}
          placeholder="All Classes"
          className="w-48"
        />
      </div>

      <SectionCard title={`Students (${filtered.length})`}>
        {loading ? (
          <LoadingSpinner />
        ) : (
          <DataTable
            columns={columns}
            data={filtered}
            keyExtractor={(s) => s.id}
            emptyMessage="No students found"
            emptyIcon={Users}
          />
        )}
      </SectionCard>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? 'Edit Student' : 'Add New Student'}
        size="lg"
      >
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="Full Name"
              value={form.name}
              onChange={(v) => setForm({ ...form, name: v })}
              required
              placeholder="Enter student's full name"
            />
            <FormInput
              label="Roll Number"
              value={form.roll_number}
              onChange={(v) => setForm({ ...form, roll_number: v })}
              placeholder="e.g., GR10-001"
            />
            <FormSelect
              label="Class"
              value={form.class_id}
              onChange={(v) => setForm({ ...form, class_id: v })}
              options={classes.map(c => ({ value: c.id, label: c.name }))}
              placeholder="Select class"
            />
            <FormSelect
              label="Gender"
              value={form.gender}
              onChange={(v) => setForm({ ...form, gender: v })}
              options={[
                { value: 'male', label: 'Male' },
                { value: 'female', label: 'Female' },
                { value: 'other', label: 'Other' },
              ]}
            />
            <FormInput
              label="Email"
              type="email"
              value={form.email}
              onChange={(v) => setForm({ ...form, email: v })}
              placeholder="student@email.com"
            />
            <FormInput
              label="Phone"
              value={form.phone}
              onChange={(v) => setForm({ ...form, phone: v })}
              placeholder="+1-555-0000"
            />
            <FormInput
              label="Date of Birth"
              type="date"
              value={form.dob}
              onChange={(v) => setForm({ ...form, dob: v })}
            />
            <FormSelect
              label="Status"
              value={form.status}
              onChange={(v) => setForm({ ...form, status: v })}
              options={[
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
              ]}
            />
            <FormInput
              label="Parent/Guardian Name"
              value={form.parent_name}
              onChange={(v) => setForm({ ...form, parent_name: v })}
              placeholder="Parent's full name"
            />
            <FormInput
              label="Parent Phone"
              value={form.parent_phone}
              onChange={(v) => setForm({ ...form, parent_phone: v })}
              placeholder="+1-555-0001"
            />
          </div>
          <FormTextarea
            label="Address"
            value={form.address}
            onChange={(v) => setForm({ ...form, address: v })}
            placeholder="Enter full address"
            rows={2}
          />
        </div>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button onClick={handleSave} loading={saving}>
            {editing ? 'Update Student' : 'Add Student'}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
