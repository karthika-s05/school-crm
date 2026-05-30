import { useEffect, useState } from 'react';
import { Search, Plus, CreditCard, Check, X, ChevronDown } from 'lucide-react';
import { supabase, type Fee, type Student } from '../lib/supabase';
import { Badge, LoadingSpinner, EmptyState, SectionCard, StatCard } from '../components/ui';

export default function Fees() {
  const [fees, setFees] = useState<Fee[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingFee, setEditingFee] = useState<Fee | null>(null);
  const [form, setForm] = useState({
    student_id: '', amount: '', paid_amount: '', due_date: '', fee_type: 'tuition', status: 'pending', academic_year: '2025-26',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    const [fRes, sRes] = await Promise.all([
      supabase.from('fees').select('*, students(name, roll_number, classes(name))').order('due_date', { ascending: false }),
      supabase.from('students').select('id, name, roll_number').order('name'),
    ]);
    setFees((fRes.data || []) as unknown as Fee[]);
    setStudents((sRes.data || []) as Student[]);
    setLoading(false);
  }

  function openAdd() {
    setEditingFee(null);
    setForm({ student_id: '', amount: '', paid_amount: '0', due_date: new Date().toISOString().split('T')[0], fee_type: 'tuition', status: 'pending', academic_year: '2025-26' });
    setShowModal(true);
  }

  function openEdit(f: Fee) {
    setEditingFee(f);
    setForm({
      student_id: f.student_id, amount: String(f.amount), paid_amount: String(f.paid_amount),
      due_date: f.due_date, fee_type: f.fee_type, status: f.status, academic_year: f.academic_year,
    });
    setShowModal(true);
  }

  async function handleSave() {
    setSaving(true);
    const paidAmt = parseFloat(form.paid_amount) || 0;
    const totalAmt = parseFloat(form.amount) || 0;
    const status = paidAmt >= totalAmt ? 'paid' : paidAmt > 0 ? 'partial' : 'pending';
    const payload = {
      student_id: form.student_id,
      amount: totalAmt,
      paid_amount: paidAmt,
      due_date: form.due_date,
      fee_type: form.fee_type,
      status,
      academic_year: form.academic_year,
      paid_date: paidAmt >= totalAmt ? new Date().toISOString().split('T')[0] : null,
    };
    if (editingFee) {
      await supabase.from('fees').update(payload).eq('id', editingFee.id);
    } else {
      await supabase.from('fees').insert(payload);
    }
    setSaving(false);
    setShowModal(false);
    fetchAll();
  }

  const filtered = fees.filter(f => {
    const name = (f as any).students?.name?.toLowerCase() || '';
    const roll = (f as any).students?.roll_number?.toLowerCase() || '';
    const matchSearch = name.includes(search.toLowerCase()) || roll.includes(search.toLowerCase());
    const matchStatus = !filterStatus || f.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalCollected = fees.reduce((s, f) => s + Number(f.paid_amount), 0);
  const totalPending = fees.filter(f => f.status !== 'paid').reduce((s, f) => s + (Number(f.amount) - Number(f.paid_amount)), 0);
  const paidCount = fees.filter(f => f.status === 'paid').length;
  const pendingCount = fees.filter(f => f.status === 'pending').length;

  const statusVariant = (s: string) => {
    if (s === 'paid') return 'success';
    if (s === 'partial') return 'warning';
    return 'danger';
  };

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Collected" value={`$${(totalCollected/1000).toFixed(1)}k`} icon={CreditCard} color="emerald" />
        <StatCard title="Pending" value={`$${(totalPending/1000).toFixed(1)}k`} icon={CreditCard} color="rose" />
        <StatCard title="Paid" value={paidCount} subtitle="Fully paid" icon={Check} color="sky" />
        <StatCard title="Outstanding" value={pendingCount} subtitle="Not yet paid" icon={X} color="amber" />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
            <Search size={16} className="text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search student..." className="outline-none text-sm text-gray-700 w-36" />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none">
            <option value="">All Status</option>
            <option value="paid">Paid</option>
            <option value="partial">Partial</option>
            <option value="pending">Pending</option>
          </select>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus size={16} /> Add Fee Record
        </button>
      </div>

      {/* Table */}
      <SectionCard title={`Fee Records (${filtered.length})`}>
        {loading ? <LoadingSpinner /> : filtered.length === 0 ? <EmptyState message="No fee records" icon={CreditCard} /> : (
          <div className="overflow-x-auto -mx-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Student', 'Class', 'Fee Type', 'Amount', 'Paid', 'Balance', 'Due Date', 'Status', ''].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((f, i) => {
                  const balance = Number(f.amount) - Number(f.paid_amount);
                  return (
                    <tr key={f.id} className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${i % 2 === 0 ? '' : 'bg-gray-50/30'}`}>
                      <td className="px-5 py-3 font-medium text-gray-800 whitespace-nowrap">{(f as any).students?.name || '—'}</td>
                      <td className="px-5 py-3 text-gray-500 text-xs whitespace-nowrap">{(f as any).students?.classes?.name || '—'}</td>
                      <td className="px-5 py-3 text-gray-600 capitalize">{f.fee_type}</td>
                      <td className="px-5 py-3 font-medium text-gray-800">${Number(f.amount).toLocaleString()}</td>
                      <td className="px-5 py-3 text-emerald-600 font-medium">${Number(f.paid_amount).toLocaleString()}</td>
                      <td className="px-5 py-3 text-rose-500 font-medium">{balance > 0 ? `$${balance.toLocaleString()}` : '—'}</td>
                      <td className="px-5 py-3 text-gray-500 text-xs whitespace-nowrap">{f.due_date}</td>
                      <td className="px-5 py-3"><Badge variant={statusVariant(f.status)}>{f.status}</Badge></td>
                      <td className="px-5 py-3">
                        <button onClick={() => openEdit(f)} className="p-1.5 rounded-lg hover:bg-sky-50 text-gray-400 hover:text-sky-600 transition-colors">
                          <ChevronDown size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="font-semibold text-gray-900">{editingFee ? 'Edit Fee Record' : 'Add Fee Record'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Student *</label>
                <select value={form.student_id} onChange={e => setForm({...form, student_id: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-200">
                  <option value="">Select student</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Total Amount</label>
                  <input type="number" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-200" placeholder="5000" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Paid Amount</label>
                  <input type="number" value={form.paid_amount} onChange={e => setForm({...form, paid_amount: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-200" placeholder="0" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Due Date</label>
                  <input type="date" value={form.due_date} onChange={e => setForm({...form, due_date: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-200" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Fee Type</label>
                  <select value={form.fee_type} onChange={e => setForm({...form, fee_type: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-200">
                    <option value="tuition">Tuition</option>
                    <option value="transport">Transport</option>
                    <option value="hostel">Hostel</option>
                    <option value="library">Library</option>
                    <option value="exam">Exam</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Academic Year</label>
                <input value={form.academic_year} onChange={e => setForm({...form, academic_year: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-200" placeholder="2025-26" />
              </div>
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t bg-gray-50 rounded-b-2xl">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="px-5 py-2 text-sm bg-sky-500 hover:bg-sky-600 text-white rounded-lg transition-colors disabled:opacity-60 font-medium">
                {saving ? 'Saving...' : editingFee ? 'Update' : 'Add Record'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
