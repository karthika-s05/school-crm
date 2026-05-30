import { useEffect, useState } from 'react';
import { Bell, Plus, AlertCircle, Info, CheckCircle, Calendar, Users, Megaphone } from 'lucide-react';
import { api } from '../lib/supabase';
import {
  PageHeader, SectionCard, Badge, LoadingSpinner, EmptyState,
  Button, Modal, ModalFooter, FormInput, FormTextarea, FormSelect, Card
} from '../components/ui';

type ApiResponse = { success: boolean; data: any };

export default function Notifications() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    title: '', message: '', type: 'info', target_audience: 'all',
  });
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
    try {
      await api.post<ApiResponse>('/notifications', form);
    } catch (e) { console.error(e); }
    setSaving(false);
    setShowModal(false);
    fetchAll();
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertCircle size={18} className="text-amber-500" />;
      case 'event': return <Calendar size={18} className="text-sky-500" />;
      case 'success': return <CheckCircle size={18} className="text-emerald-500" />;
      default: return <Info size={18} className="text-gray-500" />;
    }
  };

  const getAudienceLabel = (audience: string) => {
    const labels: Record<string, string> = {
      'all': 'Everyone',
      'students': 'Students',
      'parents': 'Parents',
      'teachers': 'Teachers',
    };
    return labels[audience] || audience;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        subtitle={`${notifications.length} announcements sent`}
        action={<Button icon={Plus} onClick={() => setShowModal(true)}>Create Notification</Button>}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SectionCard title="Info" className="text-center">
          <div className="py-4">
            <Info size={32} className="text-sky-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{notifications.filter(n => n.type === 'info').length}</p>
            <p className="text-xs text-gray-400">Informational</p>
          </div>
        </SectionCard>
        <SectionCard title="Warnings" className="text-center">
          <div className="py-4">
            <AlertCircle size={32} className="text-amber-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{notifications.filter(n => n.type === 'warning').length}</p>
            <p className="text-xs text-gray-400">Important notices</p>
          </div>
        </SectionCard>
        <SectionCard title="Events" className="text-center">
          <div className="py-4">
            <Calendar size={32} className="text-emerald-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{notifications.filter(n => n.type === 'event').length}</p>
            <p className="text-xs text-gray-400">Upcoming events</p>
          </div>
        </SectionCard>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : notifications.length === 0 ? (
        <EmptyState message="No notifications sent yet" icon={Bell} />
      ) : (
        <div className="space-y-3">
          {notifications.map(notification => (
            <Card key={notification.id} className="p-5" hover>
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  notification.type === 'warning' ? 'bg-amber-50' :
                  notification.type === 'event' ? 'bg-sky-50' :
                  'bg-gray-50'
                }`}>
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                    <Badge variant={
                      notification.type === 'warning' ? 'warning' :
                      notification.type === 'event' ? 'info' : 'neutral'
                    } size="sm">
                      {notification.type}
                    </Badge>
                    <Badge variant="neutral" size="sm">
                      <Users size={10} className="mr-1" />
                      {getAudienceLabel(notification.target_audience)}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{notification.message}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(notification.created_at).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Create Notification"
      >
        <div className="p-6 space-y-4">
          <FormInput
            label="Title"
            value={form.title}
            onChange={(v) => setForm({ ...form, title: v })}
            required
            placeholder="Notification title"
          />
          <FormTextarea
            label="Message"
            value={form.message}
            onChange={(v) => setForm({ ...form, message: v })}
            required
            placeholder="Write your message here..."
            rows={4}
          />
          <div className="grid grid-cols-2 gap-4">
            <FormSelect
              label="Type"
              value={form.type}
              onChange={(v) => setForm({ ...form, type: v })}
              options={[
                { value: 'info', label: 'Information' },
                { value: 'warning', label: 'Warning' },
                { value: 'event', label: 'Event' },
              ]}
            />
            <FormSelect
              label="Audience"
              value={form.target_audience}
              onChange={(v) => setForm({ ...form, target_audience: v })}
              options={[
                { value: 'all', label: 'Everyone' },
                { value: 'students', label: 'Students' },
                { value: 'parents', label: 'Parents' },
                { value: 'teachers', label: 'Teachers' },
              ]}
            />
          </div>
        </div>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button onClick={handleSave} loading={saving}>
            <Megaphone size={16} className="mr-1" />
            Send Notification
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
