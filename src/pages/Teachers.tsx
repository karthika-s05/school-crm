import { useEffect, useState } from 'react';
import { UserPlus, Search, Pencil, Trash2, X, GraduationCap } from 'lucide-react';
import { api, type Teacher } from '../lib/supabase';
import { Badge, LoadingSpinner, EmptyState } from '../components/ui';

type ApiResponse = { success: boolean; data: any };

export default function Teachers() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Teacher | null>(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', qualification: '', join_date: '', status: 'active' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    try { const res = await api.get<ApiResponse>('/teachers'); setTeachers(res.data || []); } catch (e) { console.error(e); }
    setLoading(false);
  }

  function openAdd() {
    setEditing(null);
    setForm({ name: '', email: '', phone: '', subject: '', qualification: '', join_date: new Date().toISOString().split('T')[0], status: 'active' });
    setShowModal(true);
  }

  function openEdit(t: Teacher) {
    setEditing(t);
    setForm({ name: t.name, email: t.email || '', phone: t.phone || '', subject: t.subject || '', qualification: t.qualification || '', join_date: t.join_date || '', status: t.status || 'active' });
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.name.trim() || !form.email.trim()) return;
    setSaving(true);
    try {
      if (editing) await api.put<ApiResponse>(`/teachers/${editing.id}`, form);
      else await api.post<ApiResponse>('/teachers', form);
    } catch (e) { console.error(e); }
    setSaving(false); setShowModal(false); fetchAll();
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this teacher?')) return;
    try { await api.delete<ApiResponse>(`/teachers/${id}`); } catch (e) { console.error(e); }
    fetchAll();
  }

  const filtered = teachers.filter(t => t.name.toLowerCase().includes(search.toLowerCase()) || (t.subject || '').toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 flex-1 max-w-sm">
          <Search size={16} className="text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search teachers..." className="outline-none text-sm flex-1 text-gray-700" />
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"><UserPlus size={16} /> Add Teacher</button>
      </div>

      {loading ? <LoadingSpinner /> : filtered.length === 0 ? <EmptyState message="No teachers found" icon={GraduationCap} /> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(t => (
            <div key={t.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-lg">{t.name.charAt(0)}</div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(t)} className="p-1.5 rounded-lg hover:bg-sky-50 text-gray-400 hover:text-sky-600"><Pencil size={14} /></button>
                  <button onClick={() => handleDelete(t.id)} className="p-1.5 rounded-lg hover:bg-rose-50 text-gray-400 hover:text-rose-500"><Trash2 size={14} /></button>
                </div>
              </div>
              <h4 className="font-semibold text-gray-900 text-sm">{t.name}</h4>
              <p className="text-xs text-emerald-600 font-medium">{t.subject}</p>
              <p className="text-xs text-gray-400">{t.qualification}</p>
              <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between">
                <span className="text-xs text-gray-400">Since {new Date(t.join_date).getFullYear()}</span>
                <Badge variant={t.status === 'active' ? 'success' : 'danger'}>{t.status}</Badge>
              </div>
              {t.email && <p className="text-xs text-gray-400 mt-2 truncate">{t.email}</p>}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="font-semibold text-gray-900">{editing ? 'Edit Teacher' : 'Add Teacher'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-3">
              {[{ label: 'Name *', key: 'name' }, { label: 'Email *', key: 'email' }, { label: 'Phone', key: 'phone' }, { label: 'Subject', key: 'subject' }, { label: 'Qualification', key: 'qualification' }].map(f => (
                <div key={f.key}><label className="text-xs font-medium text-gray-600 block mb-1">{f.label}</label><input value={(form as any)[f.key]} onChange={e => setForm({...form, [f.key]: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-200" /></div>
              ))}
              <div><label className="text-xs font-medium text-gray-600 block mb-1">Status</label><select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none"><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t bg-gray-50 rounded-b-2xl">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-lg">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="px-5 py-2 text-sm bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg disabled:opacity-60 font-medium">{saving ? 'Saving...' : editing ? 'Update' : 'Add'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
