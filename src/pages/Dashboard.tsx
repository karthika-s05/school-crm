import { useEffect, useState } from 'react';
import { Users, GraduationCap, ClipboardCheck, CreditCard, BookOpen, School, UserPlus, UserCheck, FileText, Send, TrendingUp, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { api, type Student, type Notification } from '../lib/supabase';
import { StatCard, SectionCard, Badge, LoadingSpinner } from '../components/ui';

type ApiResponse = { success: boolean; data: any };

type DashboardProps = { onNavigate: (id: string) => void };

export default function Dashboard({ onNavigate }: DashboardProps) {
  const [stats, setStats] = useState({ students: 0, teachers: 0, attendance: { present: 0, total: 0 }, fees: { collected: 0, pending: 0 }, classes: 0, exams: 0 });
  const [recentStudents, setRecentStudents] = useState<Student[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const [studRes, teachRes, attRes, feesRes, classRes, examRes, notifRes, recentRes] = await Promise.all([
        api.get<ApiResponse>('/students'),
        api.get<ApiResponse>('/teachers'),
        api.get<ApiResponse>('/attendance'),
        api.get<ApiResponse>('/fees'),
        api.get<ApiResponse>('/classes'),
        api.get<ApiResponse>('/exams'),
        api.get<ApiResponse>('/notifications'),
        api.get<ApiResponse>('/students'),
      ]);
      const attData = attRes.data?.filter((a: any) => a.date === today) || [];
      const students = studRes.data?.filter((s: any) => s.status === 'active') || [];
      setStats({
        students: students.length,
        teachers: teachRes.data?.filter((t: any) => t.status === 'active')?.length || 0,
        attendance: { present: attData.filter((a: any) => a.status === 'present').length, total: attData.length },
        fees: {
          collected: feesRes.data?.reduce((s: number, f: any) => s + Number(f.paid_amount), 0) || 0,
          pending: feesRes.data?.filter((f: any) => f.status !== 'paid').reduce((s: number, f: any) => s + (Number(f.amount) - Number(f.paid_amount)), 0) || 0,
        },
        classes: classRes.data?.length || 0,
        exams: examRes.data?.filter((e: any) => e.date >= today)?.length || 0,
      });
      setNotifications(notifRes.data?.slice(0, 5) || []);
      setRecentStudents((recentRes.data || []).slice(0, 5));
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  if (loading) return <LoadingSpinner />;

  const attRate = stats.attendance.total > 0 ? Math.round((stats.attendance.present / stats.attendance.total) * 100) : 0;
  const feeRate = (stats.fees.collected + stats.fees.pending) > 0 ? Math.round((stats.fees.collected / (stats.fees.collected + stats.fees.pending)) * 100) : 0;

  const quickActions = [
    { label: 'Add Student', icon: UserPlus, color: 'bg-sky-500', module: 'students' },
    { label: 'Add Teacher', icon: GraduationCap, color: 'bg-emerald-500', module: 'teachers' },
    { label: 'Mark Attendance', icon: UserCheck, color: 'bg-amber-500', module: 'attendance' },
    { label: 'Create Exam', icon: BookOpen, color: 'bg-rose-500', module: 'exams' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <p className="text-slate-300 text-sm mt-1">School Management System Overview</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Students" value={stats.students} subtitle="Active" icon={Users} color="sky" />
        <StatCard title="Teachers" value={stats.teachers} subtitle="Staff" icon={GraduationCap} color="emerald" />
        <StatCard title="Attendance" value={`${attRate}%`} subtitle="Today" icon={ClipboardCheck} color="amber" />
        <StatCard title="Classes" value={stats.classes} subtitle="Total" icon={School} color="teal" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Fees Collected" value={`$${(stats.fees.collected / 1000).toFixed(1)}k`} subtitle={`${feeRate}%`} icon={CreditCard} color="sky" />
        <StatCard title="Pending Fees" value={`$${(stats.fees.pending / 1000).toFixed(1)}k`} subtitle="Due" icon={CreditCard} color="rose" />
        <StatCard title="Exams" value={stats.exams} subtitle="Upcoming" icon={BookOpen} color="amber" />
        <StatCard title="Notifications" value={notifications.length} subtitle="Recent" icon={AlertCircle} color="violet" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <SectionCard title="Quick Actions">
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map(a => (
              <button key={a.label} onClick={() => onNavigate(a.module)} className="flex items-center gap-2 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors text-left">
                <div className={`w-8 h-8 rounded-lg ${a.color} flex items-center justify-center`}><a.icon size={16} className="text-white" /></div>
                <span className="text-xs font-medium text-gray-700">{a.label}</span>
              </button>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Recent Students" action={{ label: 'View All', onClick: () => onNavigate('students') }}>
          <div className="space-y-3">
            {recentStudents.map(s => (
              <div key={s.id} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center text-sky-700 text-xs font-bold">{s.name.charAt(0)}</div>
                <div className="flex-1"><p className="text-sm font-medium text-gray-800">{s.name}</p><p className="text-xs text-gray-400">{(s as any).class_name || 'N/A'}</p></div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Notifications" action={{ label: 'View All', onClick: () => onNavigate('notifications') }}>
          <div className="space-y-3">
            {notifications.map(n => (
              <div key={n.id} className="flex items-start gap-3">
                <CheckCircle2 size={16} className="text-emerald-500 mt-0.5" />
                <div className="flex-1"><p className="text-sm font-medium text-gray-800">{n.title}</p><p className="text-xs text-gray-400">{n.message}</p></div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
