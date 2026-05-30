import { useEffect, useState } from 'react';
import { Plus, Bell, X, AlertCircle, Info } from 'lucide-react';
import { api, type Notification } from '../lib/supabase';
import { Badge, LoadingSpinner, EmptyState, SectionCard } from '../components/ui';

type ApiResponse = { success: boolean; data: any };

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', message: '', type: 'info', target_audience: 'all' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    try {
      const res = await api.get<ApiResponse>('/notifications');
      setNotifications(res.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function handleSave() {
    if (!form.title.trim() || !form.message.trim()) return;
    setSaving(true);
    try { await api.post<ApiResponse>('/notifications', form); } catch (e) { console.error(e); }
    setSaving(false); setShowModal(false); fetchAll();
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-lg text-sm font-medium"><Plus size={16} /> Create Notification</button>
      </div>

      {notifications.length === 0 ? <EmptyState message="No notifications" icon={Bell} /> : (
        <div className="space-y-3">
          {notifications.map(n => (
            <div key={n.id} className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${n.type === 'warning' ? 'bg-amber-50' : 'bg-sky-50'}`}>
                  {n.type === 'warning' ? <AlertCircle size={18} className="text-amber-500" /> : <Info size={18} className="text-sky-500" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-gray-900">{n.title}</h4>
                    <Badge variant={n.type === 'warning' ? 'warning' : 'info'}>{n.target_audience}</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-2">{new Date(n.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="font-semibold">Create Notification</h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded hover:bg-gray-100"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-3">
              <div><label className="text-xs font-medium block mb-1">Title</label><input value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
              <div><label className="text-xs font-medium block mb-1">Message</label><textarea value={form.message} onChange={e => setForm({...form, message: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm" rows={3} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-medium block mb-1">Type</label><select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm"><option value="info">Info</option><option value="warning">Warning</option></select></div>
                <div><label className="text-xs font-medium block mb-1">Audience</label><select value={form.target_audience} onChange={e => setForm({...form, target_audience: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm"><option value="all">All</option><option value="students">Students</option><option value="parents">Parents</option></select></div>
              </div>
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t bg-gray-50 rounded-b-2xl">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-lg">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="px-5 py-2 text-sm bg-sky-500 text-white rounded-lg disabled:opacity-60">{saving ? 'Saving...' : 'Send'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
