import { useEffect, useState } from 'react';
import { UserPlus, Search, Pencil, Trash2, X, Users } from 'lucide-react';
import { api, type Student, type Class } from '../lib/supabase';
import { Badge, LoadingSpinner, EmptyState, SectionCard } from '../components/ui';

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
    setForm({ name: '', email: '', phone: '', parent_name: '', parent_phone: '', class_id: '', dob: '', gender: 'male', address: '', roll_number: '', status: 'active' });
    setShowModal(true);
  }

  function openEdit(s: Student) {
    setEditing(s);
    setForm({
      name: s.name, email: s.email || '', phone: s.phone || '',
      parent_name: s.parent_name || '', parent_phone: s.parent_phone || '',
      class_id: s.class_id || '', dob: s.dob || '', gender: s.gender,
      address: s.address || '', roll_number: s.roll_number || '', status: s.status,
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
    if (!confirm('Delete this student?')) return;
    try { await api.delete<ApiResponse>(`/students/${id}`); } catch (e) { console.error(e); }
    fetchAll();
  }

  const filtered = students.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.roll_number || '').toLowerCase().includes(search.toLowerCase());
    const matchClass = !filterClass || s.class_id === filterClass;
    return matchSearch && matchClass;
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-1 flex-wrap">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 flex-1 min-w-48">
            <Search size={16} className="text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search students..." className="outline-none text-sm flex-1 text-gray-700" />
          </div>
          <select value={filterClass} onChange={e => setFilterClass(e.target.value)} className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none">
            <option value="">All Classes</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <UserPlus size={16} /> Add Student
        </button>
      </div>

      <SectionCard title={`Students (${filtered.length})`}>
        {loading ? <LoadingSpinner /> : filtered.length === 0 ? (
          <EmptyState message="No students found" icon={Users} />
        ) : (
          <div className="overflow-x-auto -mx-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Roll No', 'Name', 'Class', 'Gender', 'Parent', 'Parent Phone', 'Status', ''].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, i) => (
                  <tr key={s.id} className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${i % 2 === 0 ? '' : 'bg-gray-50/30'}`}>
                    <td className="px-5 py-3 font-mono text-xs text-gray-500">{s.roll_number || '—'}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-sky-100 flex items-center justify-center text-sky-700 text-xs font-bold flex-shrink-0">{s.name.charAt(0)}</div>
                        <span className="font-medium text-gray-800 whitespace-nowrap">{s.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-gray-600 whitespace-nowrap">{(s as any).class_name || '—'}</td>
                    <td className="px-5 py-3"><Badge variant={s.gender === 'male' ? 'info' : 'success'}>{s.gender}</Badge></td>
                    <td className="px-5 py-3 text-gray-600 whitespace-nowrap">{s.parent_name || '—'}</td>
                    <td className="px-5 py-3 text-gray-500 text-xs">{s.parent_phone || '—'}</td>
                    <td className="px-5 py-3"><Badge variant={s.status === 'active' ? 'success' : 'danger'}>{s.status}</Badge></td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg hover:bg-sky-50 text-gray-400 hover:text-sky-600 transition-colors"><Pencil size={14} /></button>
                        <button onClick={() => handleDelete(s.id)} className="p-1.5 rounded-lg hover:bg-rose-50 text-gray-400 hover:text-rose-500 transition-colors"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="font-semibold text-gray-900">{editing ? 'Edit Student' : 'Add New Student'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs font-medium text-gray-600 block mb-1">Full Name *</label>
                  <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-200" placeholder="Student name" />
                </div>
                <div><label className="text-xs font-medium text-gray-600 block mb-1">Roll Number</label><input value={form.roll_number} onChange={e => setForm({...form, roll_number: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-200" /></div>
                <div><label className="text-xs font-medium text-gray-600 block mb-1">Class</label><select value={form.class_id} onChange={e => setForm({...form, class_id: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none"><option value="">Select class</option>{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                <div><label className="text-xs font-medium text-gray-600 block mb-1">Gender</label><select value={form.gender} onChange={e => setForm({...form, gender: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none"><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select></div>
                <div><label className="text-xs font-medium text-gray-600 block mb-1">Date of Birth</label><input type="date" value={form.dob} onChange={e => setForm({...form, dob: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" /></div>
                <div><label className="text-xs font-medium text-gray-600 block mb-1">Email</label><input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" /></div>
                <div><label className="text-xs font-medium text-gray-600 block mb-1">Parent Name</label><input value={form.parent_name} onChange={e => setForm({...form, parent_name: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" /></div>
                <div><label className="text-xs font-medium text-gray-600 block mb-1">Parent Phone</label><input value={form.parent_phone} onChange={e => setForm({...form, parent_phone: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" /></div>
                <div className="col-span-2"><label className="text-xs font-medium text-gray-600 block mb-1">Address</label><textarea value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none resize-none" rows={2} /></div>
                <div><label className="text-xs font-medium text-gray-600 block mb-1">Status</label><select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none"><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
              </div>
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t bg-gray-50 rounded-b-2xl">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="px-5 py-2 text-sm bg-sky-500 hover:bg-sky-600 text-white rounded-lg transition-colors disabled:opacity-60 font-medium">{saving ? 'Saving...' : editing ? 'Update' : 'Add Student'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
