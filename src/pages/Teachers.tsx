import { useEffect, useState } from 'react';
import { UserPlus, Search, Pencil, Trash2, X, GraduationCap } from 'lucide-react';
import { supabase, type Teacher } from '../lib/supabase';
import { Badge, LoadingSpinner, EmptyState, SectionCard } from '../components/ui';

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
    const { data } = await supabase.from('teachers').select('*').order('name');
    setTeachers(data || []);
    setLoading(false);
  }

  function openAdd() {
    setEditing(null);
    setForm({ name: '', email: '', phone: '', subject: '', qualification: '', join_date: new Date().toISOString().split('T')[0], status: 'active' });
    setShowModal(true);
  }

  function openEdit(t: Teacher) {
    setEditing(t);
    setForm({ name: t.name, email: t.email, phone: t.phone, subject: t.subject, qualification: t.qualification, join_date: t.join_date, status: t.status });
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.name.trim() || !form.email.trim()) return;
    setSaving(true);
    if (editing) {
      await supabase.from('teachers').update(form).eq('id', editing.id);
    } else {
      await supabase.from('teachers').insert(form);
    }
    setSaving(false);
    setShowModal(false);
    fetchAll();
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this teacher?')) return;
    await supabase.from('teachers').delete().eq('id', id);
    fetchAll();
  }

  const filtered = teachers.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.subject.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 flex-1 max-w-sm">
          <Search size={16} className="text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search teachers..." className="outline-none text-sm flex-1 text-gray-700" />
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <UserPlus size={16} /> Add Teacher
        </button>
      </div>

      {/* Cards grid */}
      {loading ? <LoadingSpinner /> : filtered.length === 0 ? (
        <EmptyState message="No teachers found" icon={GraduationCap} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(t => (
            <div key={t.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-lg">
                  {t.name.charAt(0)}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(t)} className="p-1.5 rounded-lg hover:bg-sky-50 text-gray-400 hover:text-sky-600 transition-colors"><Pencil size={14} /></button>
                  <button onClick={() => handleDelete(t.id)} className="p-1.5 rounded-lg hover:bg-rose-50 text-gray-400 hover:text-rose-500 transition-colors"><Trash2 size={14} /></button>
                </div>
              </div>
              <h4 className="font-semibold text-gray-900 text-sm leading-tight">{t.name}</h4>
              <p className="text-xs text-emerald-600 font-medium mt-0.5">{t.subject}</p>
              <p className="text-xs text-gray-400 mt-1">{t.qualification}</p>
              <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between">
                <span className="text-xs text-gray-400">Since {new Date(t.join_date).getFullYear()}</span>
                <Badge variant={t.status === 'active' ? 'success' : 'danger'}>{t.status}</Badge>
              </div>
              {t.email && <p className="text-xs text-gray-400 mt-2 truncate">{t.email}</p>}
              {t.phone && <p className="text-xs text-gray-400 mt-0.5">{t.phone}</p>}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="font-semibold text-gray-900">{editing ? 'Edit Teacher' : 'Add New Teacher'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-3">
              {[
                { label: 'Full Name *', key: 'name', type: 'text', placeholder: 'Teacher name' },
                { label: 'Email *', key: 'email', type: 'email', placeholder: 'teacher@school.edu' },
                { label: 'Phone', key: 'phone', type: 'text', placeholder: '+1-555-0000' },
                { label: 'Subject', key: 'subject', type: 'text', placeholder: 'Mathematics' },
                { label: 'Qualification', key: 'qualification', type: 'text', placeholder: 'M.Sc Physics' },
                { label: 'Join Date', key: 'join_date', type: 'date', placeholder: '' },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs font-medium text-gray-600 block mb-1">{f.label}</label>
                  <input
                    type={f.type}
                    value={(form as any)[f.key]}
                    onChange={e => setForm({...form, [f.key]: e.target.value})}
                    placeholder={f.placeholder}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
                  />
                </div>
              ))}
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Status</label>
                <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-200">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="on_leave">On Leave</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t bg-gray-50 rounded-b-2xl">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="px-5 py-2 text-sm bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors disabled:opacity-60 font-medium">
                {saving ? 'Saving...' : editing ? 'Update' : 'Add Teacher'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
