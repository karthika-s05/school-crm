import { useEffect, useState } from 'react';
import { Search, Plus, CreditCard, Check, X } from 'lucide-react';
import { api, type Fee, type Student } from '../lib/supabase';
import { Badge, LoadingSpinner, EmptyState, SectionCard, StatCard } from '../components/ui';

type ApiResponse = { success: boolean; data: any };

export default function Fees() {
  const [fees, setFees] = useState<any[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingFee, setEditingFee] = useState<any>(null);
  const [form, setForm] = useState({ student_id: '', amount: '', paid_amount: '0', due_date: '', fee_type: 'tuition', academic_year: '2025-26' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    try {
      const [fRes, sRes] = await Promise.all([api.get<ApiResponse>('/fees'), api.get<ApiResponse>('/students')]);
      setFees(fRes.data || []);
      setStudents(sRes.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  function openAdd() {
    setEditingFee(null);
    setForm({ student_id: '', amount: '', paid_amount: '0', due_date: new Date().toISOString().split('T')[0], fee_type: 'tuition', academic_year: '2025-26' });
    setShowModal(true);
  }

  function openEdit(f: any) {
    setEditingFee(f);
    setForm({ student_id: f.student_id, amount: String(f.amount), paid_amount: String(f.paid_amount), due_date: f.due_date, fee_type: f.fee_type, academic_year: f.academic_year });
    setShowModal(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload = { ...form, amount: parseFloat(form.amount), paid_amount: parseFloat(form.paid_amount) };
      if (editingFee) await api.put<ApiResponse>(`/fees/${editingFee.id}`, payload);
      else await api.post<ApiResponse>('/fees', payload);
    } catch (e) { console.error(e); }
    setSaving(false); setShowModal(false); fetchAll();
  }

  const filtered = fees.filter(f => {
    const matchSearch = (f.student_name || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = !filterStatus || f.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalCollected = fees.reduce((s, f) => s + Number(f.paid_amount), 0);
  const totalPending = fees.filter(f => f.status !== 'paid').reduce((s, f) => s + (Number(f.amount) - Number(f.paid_amount)), 0);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total Collected" value={`$${totalCollected.toLocaleString()}`} icon={CreditCard} color="emerald" />
        <StatCard title="Pending Amount" value={`$${totalPending.toLocaleString()}`} icon={CreditCard} color="rose" />
        <StatCard title="Total Records" value={fees.length} icon={CreditCard} color="sky" />
      </div>

      <div className="flex flex-wrap gap-3 justify-between">
        <div className="flex gap-2">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
            <Search size={16} className="text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="outline-none text-sm" />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none">
            <option value="">All Status</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="partial">Partial</option>
          </select>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-lg text-sm font-medium"><Plus size={16} /> Add Fee</button>
      </div>

      {filtered.length === 0 ? <EmptyState message="No fee records found" icon={CreditCard} /> : (
        <SectionCard title={`Fee Records (${filtered.length})`}>
          <div className="overflow-x-auto -mx-5">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-100">{['Student', 'Type', 'Amount', 'Paid', 'Due Date', 'Status', ''].map(h => <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>)}</tr></thead>
              <tbody>
                {filtered.map((f, i) => (
                  <tr key={f.id} className={`border-b border-gray-50 hover:bg-gray-50 ${i % 2 === 0 ? '' : 'bg-gray-50/30'}`}>
                    <td className="px-5 py-3 font-medium">{f.student_name}</td>
                    <td className="px-5 py-3 text-gray-600">{f.fee_type}</td>
                    <td className="px-5 py-3">${Number(f.amount).toLocaleString()}</td>
                    <td className="px-5 py-3">${Number(f.paid_amount).toLocaleString()}</td>
                    <td className="px-5 py-3 text-gray-500">{f.due_date}</td>
                    <td className="px-5 py-3"><Badge variant={f.status === 'paid' ? 'success' : f.status === 'partial' ? 'warning' : 'danger'}>{f.status}</Badge></td>
                    <td className="px-5 py-3"><button onClick={() => openEdit(f)} className="text-sky-500 hover:text-sky-700 text-xs">Edit</button></td>
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
              <h3 className="font-semibold">{editingFee ? 'Edit Fee' : 'Add Fee'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded hover:bg-gray-100"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-3">
              <div><label className="text-xs font-medium block mb-1">Student</label><select value={form.student_id} onChange={e => setForm({...form, student_id: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm">{students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-medium block mb-1">Amount</label><input type="number" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="text-xs font-medium block mb-1">Paid</label><input type="number" value={form.paid_amount} onChange={e => setForm({...form, paid_amount: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
              </div>
              <div><label className="text-xs font-medium block mb-1">Due Date</label><input type="date" value={form.due_date} onChange={e => setForm({...form, due_date: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t bg-gray-50 rounded-b-2xl">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-lg">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="px-5 py-2 text-sm bg-sky-500 text-white rounded-lg disabled:opacity-60">{saving ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
