import { useEffect, useState } from 'react';
import { CreditCard, Search, Plus, Pencil, DollarSign, TrendingUp, AlertCircle } from 'lucide-react';
import { api } from '../lib/supabase';
import {
  PageHeader, SectionCard, Badge, LoadingSpinner, EmptyState,
  SearchInput, SelectInput, Button, Modal, ModalFooter,
  FormInput, FormSelect, StatCard, DataTable
} from '../components/ui';

type ApiResponse = { success: boolean; data: any };

export default function Fees() {
  const [fees, setFees] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingFee, setEditingFee] = useState<any>(null);
  const [form, setForm] = useState({
    student_id: '', amount: '', paid_amount: '0', due_date: '', fee_type: 'tuition', academic_year: '2025-26',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    try {
      const [fRes, sRes] = await Promise.all([
        api.get<ApiResponse>('/fees'),
        api.get<ApiResponse>('/students'),
      ]);
      setFees(fRes.data || []);
      setStudents(sRes.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  function openAdd() {
    setEditingFee(null);
    setForm({
      student_id: '', amount: '', paid_amount: '0',
      due_date: new Date().toISOString().split('T')[0],
      fee_type: 'tuition', academic_year: '2025-26',
    });
    setShowModal(true);
  }

  function openEdit(f: any) {
    setEditingFee(f);
    setForm({
      student_id: f.student_id, amount: String(f.amount),
      paid_amount: String(f.paid_amount), due_date: f.due_date,
      fee_type: f.fee_type, academic_year: f.academic_year,
    });
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.student_id || !form.amount) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        amount: parseFloat(form.amount),
        paid_amount: parseFloat(form.paid_amount),
      };
      if (editingFee) {
        await api.put<ApiResponse>(`/fees/${editingFee.id}`, payload);
      } else {
        await api.post<ApiResponse>('/fees', payload);
      }
    } catch (e) { console.error(e); }
    setSaving(false);
    setShowModal(false);
    fetchAll();
  }

  const filtered = fees.filter(f => {
    const matchSearch = (f.student_name || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = !filterStatus || f.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalCollected = fees.reduce((s, f) => s + Number(f.paid_amount), 0);
  const totalPending = fees.filter(f => f.status !== 'paid').reduce((s, f) => s + (Number(f.amount) - Number(f.paid_amount)), 0);
  const totalAmount = fees.reduce((s, f) => s + Number(f.amount), 0);
  const collectionRate = totalAmount > 0 ? Math.round((totalCollected / totalAmount) * 100) : 0;

  const columns = [
    {
      key: 'student_name',
      header: 'Student',
      render: (f: any) => <span className="font-medium text-gray-900">{f.student_name || 'Unknown'}</span>,
    },
    {
      key: 'fee_type',
      header: 'Type',
      render: (f: any) => (
        <Badge variant="neutral" size="sm">{f.fee_type}</Badge>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (f: any) => (
        <span className="font-medium">${Number(f.amount).toLocaleString()}</span>
      ),
    },
    {
      key: 'paid_amount',
      header: 'Paid',
      render: (f: any) => (
        <span className="text-emerald-600">${Number(f.paid_amount).toLocaleString()}</span>
      ),
    },
    {
      key: 'balance',
      header: 'Balance',
      render: (f: any) => {
        const balance = Number(f.amount) - Number(f.paid_amount);
        return <span className={balance > 0 ? 'text-rose-600' : 'text-gray-400'}>${balance.toLocaleString()}</span>;
      },
    },
    {
      key: 'due_date',
      header: 'Due Date',
      render: (f: any) => <span className="text-gray-500 text-sm">{f.due_date}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (f: any) => (
        <Badge variant={f.status === 'paid' ? 'success' : f.status === 'partial' ? 'warning' : 'danger'}>
          {f.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-16',
      render: (f: any) => (
        <Button variant="ghost" size="sm" onClick={() => openEdit(f)}>
          <Pencil size={14} />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fees Management"
        subtitle="Track fee payments and dues"
        action={<Button icon={Plus} onClick={openAdd}>Add Fee</Button>}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Collected"
          value={`$${totalCollected.toLocaleString()}`}
          subtitle="This academic year"
          icon={DollarSign}
          color="emerald"
          trend={{ value: 12, positive: true }}
        />
        <StatCard
          title="Pending Amount"
          value={`$${totalPending.toLocaleString()}`}
          subtitle="Outstanding dues"
          icon={AlertCircle}
          color="rose"
        />
        <StatCard
          title="Collection Rate"
          value={`${collectionRate}%`}
          subtitle="Payment efficiency"
          icon={TrendingUp}
          color="sky"
        />
        <StatCard
          title="Total Records"
          value={fees.length}
          subtitle="Fee entries"
          icon={CreditCard}
          color="amber"
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by student name..."
          className="flex-1 max-w-sm"
        />
        <SelectInput
          value={filterStatus}
          onChange={setFilterStatus}
          options={[
            { value: 'paid', label: 'Paid' },
            { value: 'pending', label: 'Pending' },
            { value: 'partial', label: 'Partial' },
          ]}
          placeholder="All Status"
          className="w-40"
        />
      </div>

      <SectionCard title={`Fee Records (${filtered.length})`}>
        {loading ? (
          <LoadingSpinner />
        ) : (
          <DataTable
            columns={columns}
            data={filtered}
            keyExtractor={(f) => f.id}
            emptyMessage="No fee records found"
            emptyIcon={CreditCard}
          />
        )}
      </SectionCard>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingFee ? 'Edit Fee Record' : 'Add Fee Record'}
      >
        <div className="p-6 space-y-4">
          <FormSelect
            label="Student"
            value={form.student_id}
            onChange={(v) => setForm({ ...form, student_id: v })}
            options={students.map(s => ({ value: s.id, label: s.name }))}
            placeholder="Select student"
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="Total Amount"
              type="number"
              value={form.amount}
              onChange={(v) => setForm({ ...form, amount: v })}
              placeholder="0.00"
              required
            />
            <FormInput
              label="Paid Amount"
              type="number"
              value={form.paid_amount}
              onChange={(v) => setForm({ ...form, paid_amount: v })}
              placeholder="0.00"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="Due Date"
              type="date"
              value={form.due_date}
              onChange={(v) => setForm({ ...form, due_date: v })}
              required
            />
            <FormSelect
              label="Fee Type"
              value={form.fee_type}
              onChange={(v) => setForm({ ...form, fee_type: v })}
              options={[
                { value: 'tuition', label: 'Tuition Fee' },
                { value: 'library', label: 'Library Fee' },
                { value: 'transport', label: 'Transport Fee' },
                { value: 'hostel', label: 'Hostel Fee' },
                { value: 'lab', label: 'Lab Fee' },
                { value: 'other', label: 'Other' },
              ]}
            />
          </div>
          <FormInput
            label="Academic Year"
            value={form.academic_year}
            onChange={(v) => setForm({ ...form, academic_year: v })}
            placeholder="2025-26"
          />
        </div>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button onClick={handleSave} loading={saving}>
            {editingFee ? 'Update Fee' : 'Add Fee'}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
