import { useEffect, useState } from 'react';
import { Plus, Bell, X, AlertCircle, Info, Star } from 'lucide-react';
import { supabase, type Notification } from '../lib/supabase';
import { Badge, LoadingSpinner, EmptyState } from '../components/ui';

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', message: '', type: 'info', target_audience: 'all', created_by: 'Admin' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    const { data } = await supabase.from('notifications').select('*').order('created_at', { ascending: false });
    setNotifications((data || []) as Notification[]);
    setLoading(false);
  }

  async function handleSave() {
    if (!form.title.trim() || !form.message.trim()) return;
    setSaving(true);
    await supabase.from('notifications').insert(form);
    setSaving(false);
    setShowModal(false);
    fetchAll();
  }

  async function handleDelete(id: string) {
    await supabase.from('notifications').delete().eq('id', id);
    fetchAll();
  }

  async function markRead(id: string) {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  }

  const notifIcon = (type: string) => {
    if (type === 'warning') return <AlertCircle size={18} className="text-amber-500" />;
    if (type === 'event') return <Star size={18} className="text-sky-500" />;
    if (type === 'danger') return <AlertCircle size={18} className="text-rose-500" />;
    return <Info size={18} className="text-teal-500" />;
  };

  const typeVariant = (type: string): 'warning' | 'danger' | 'info' | 'neutral' => {
    if (type === 'warning') return 'warning';
    if (type === 'danger') return 'danger';
    if (type === 'event') return 'info';
    return 'neutral';
  };

  const audienceVariant = (a: string): 'success' | 'info' | 'warning' | 'neutral' => {
    if (a === 'all') return 'success';
    if (a === 'students') return 'info';
    if (a === 'teachers') return 'warning';
    return 'neutral';
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">{notifications.filter(n => !n.is_read).length} unread</span>
        </div>
        <button onClick={() => { setForm({ title: '', message: '', type: 'info', target_audience: 'all', created_by: 'Admin' }); setShowModal(true); }} className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus size={16} /> New Notice
        </button>
      </div>

      {loading ? <LoadingSpinner /> : notifications.length === 0 ? <EmptyState message="No notifications yet" icon={Bell} /> : (
        <div className="space-y-3">
          {notifications.map(n => (
            <div key={n.id} className={`bg-white rounded-2xl border shadow-sm p-4 hover:shadow-md transition-all ${!n.is_read ? 'border-sky-200 shadow-sky-50' : 'border-gray-100'}`}>
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  n.type === 'warning' ? 'bg-amber-50' : n.type === 'event' ? 'bg-sky-50' : 'bg-teal-50'
                }`}>
                  {notifIcon(n.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className={`font-semibold text-sm ${n.is_read ? 'text-gray-700' : 'text-gray-900'}`}>{n.title}</h4>
                      <p className="text-sm text-gray-500 mt-1 leading-relaxed">{n.message}</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {!n.is_read && (
                        <button onClick={() => markRead(n.id)} className="text-xs text-sky-600 hover:text-sky-700 font-medium px-2 py-1 rounded-lg hover:bg-sky-50">Mark read</button>
                      )}
                      <button onClick={() => handleDelete(n.id)} className="p-1.5 rounded-lg hover:bg-rose-50 text-gray-300 hover:text-rose-500 transition-colors"><X size={14} /></button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={typeVariant(n.type)}>{n.type}</Badge>
                    <Badge variant={audienceVariant(n.target_audience)}>{n.target_audience}</Badge>
                    <span className="text-xs text-gray-400 ml-1">
                      {n.created_by} · {new Date(n.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    {!n.is_read && <span className="w-2 h-2 bg-sky-500 rounded-full ml-auto" />}
                  </div>
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
              <h3 className="font-semibold text-gray-900">New Announcement</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Title *</label>
                <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-200" placeholder="Announcement title" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Message *</label>
                <textarea value={form.message} onChange={e => setForm({...form, message: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-200 resize-none" rows={4} placeholder="Announcement details..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Type</label>
                  <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-200">
                    <option value="info">Info</option>
                    <option value="warning">Warning</option>
                    <option value="event">Event</option>
                    <option value="danger">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Target</label>
                  <select value={form.target_audience} onChange={e => setForm({...form, target_audience: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-200">
                    <option value="all">Everyone</option>
                    <option value="students">Students</option>
                    <option value="teachers">Teachers</option>
                    <option value="parents">Parents</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Posted By</label>
                <input value={form.created_by} onChange={e => setForm({...form, created_by: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-200" placeholder="Admin" />
              </div>
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t bg-gray-50 rounded-b-2xl">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="px-5 py-2 text-sm bg-sky-500 hover:bg-sky-600 text-white rounded-lg transition-colors disabled:opacity-60 font-medium">
                {saving ? 'Posting...' : 'Post Notice'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
