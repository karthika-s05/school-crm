import { useEffect, useState } from 'react';
import {
  Users, GraduationCap, ClipboardCheck, CreditCard, BookOpen, School,
  AlertCircle, TrendingUp, Clock, Calendar, UserPlus, FileText, Send
} from 'lucide-react';
import { api } from '../lib/supabase';
import {
  StatCard, SectionCard, Badge, LoadingSpinner, Card, Avatar, Button
} from '../components/ui';

type ApiResponse = { success: boolean; data: any };

type DashboardProps = { onNavigate: (id: string) => void };

export default function Dashboard({ onNavigate }: DashboardProps) {
  const [stats, setStats] = useState({
    students: 0, teachers: 0, attendance: { present: 0, total: 0 },
    fees: { collected: 0, pending: 0 }, classes: 0, exams: 0
  });
  const [recentStudents, setRecentStudents] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const [studRes, teachRes, attRes, feesRes, classRes, examRes, notifRes] = await Promise.all([
        api.get<ApiResponse>('/students'),
        api.get<ApiResponse>('/teachers'),
        api.get<ApiResponse>('/attendance'),
        api.get<ApiResponse>('/fees'),
        api.get<ApiResponse>('/classes'),
        api.get<ApiResponse>('/exams'),
        api.get<ApiResponse>('/notifications'),
      ]);

      const students = studRes.data || [];
      const teachers = teachRes.data || [];
      const attData = (attRes.data || []).filter((a: any) => a.date === today);

      setStats({
        students: students.filter((s: any) => s.status === 'active').length,
        teachers: teachers.filter((t: any) => t.status === 'active').length,
        attendance: {
          present: attData.filter((a: any) => a.status === 'present').length,
          total: attData.length
        },
        fees: {
          collected: (feesRes.data || []).reduce((s: number, f: any) => s + Number(f.paid_amount), 0),
          pending: (feesRes.data || []).filter((f: any) => f.status !== 'paid').reduce((s: number, f: any) => s + (Number(f.amount) - Number(f.paid_amount)), 0)
        },
        classes: (classRes.data || []).length,
        exams: (examRes.data || []).filter((e: any) => e.date >= today).length
      });

      setRecentStudents(students.slice(0, 5));
      setNotifications((notifRes.data || []).slice(0, 5));
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  if (loading) return <LoadingSpinner size="lg" />;

  const attRate = stats.attendance.total > 0
    ? Math.round((stats.attendance.present / stats.attendance.total) * 100)
    : 0;
  const feeRate = (stats.fees.collected + stats.fees.pending) > 0
    ? Math.round((stats.fees.collected / (stats.fees.collected + stats.fees.pending)) * 100)
    : 0;

  const quickActions = [
    { label: 'Add Student', icon: UserPlus, color: 'bg-sky-500', module: 'students' },
    { label: 'Add Teacher', icon: GraduationCap, color: 'bg-emerald-500', module: 'teachers' },
    { label: 'Mark Attendance', icon: ClipboardCheck, color: 'bg-amber-500', module: 'attendance' },
    { label: 'Create Exam', icon: BookOpen, color: 'bg-rose-500', module: 'exams' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <Card className="bg-gradient-to-r from-slate-800 to-slate-700 border-0 p-6 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-slate-300 text-sm">Welcome back,</p>
            <h1 className="text-2xl font-bold mt-0.5">Administrator</h1>
            <p className="text-slate-300 text-sm mt-1">
              Here's what's happening at your school today.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center px-4 py-2 bg-slate-700/50 rounded-lg">
              <p className="text-2xl font-bold">{attRate}%</p>
              <p className="text-xs text-slate-300">Attendance</p>
            </div>
            <div className="text-center px-4 py-2 bg-slate-700/50 rounded-lg">
              <p className="text-2xl font-bold">{feeRate}%</p>
              <p className="text-xs text-slate-300">Fees Collected</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Students" value={stats.students} subtitle="Active enrollments" icon={Users} color="sky" />
        <StatCard title="Teachers" value={stats.teachers} subtitle="Staff members" icon={GraduationCap} color="emerald" />
        <StatCard title="Attendance" value={`${attRate}%`} subtitle={`${stats.attendance.present} of ${stats.attendance.total} present`} icon={ClipboardCheck} color="amber" />
        <StatCard title="Classes" value={stats.classes} subtitle="Active classrooms" icon={School} color="teal" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Fees Collected"
          value={`$${(stats.fees.collected / 1000).toFixed(1)}k`}
          subtitle={`${feeRate}% collected`}
          icon={CreditCard}
          color="sky"
          trend={{ value: 8, positive: true }}
        />
        <StatCard
          title="Pending Fees"
          value={`$${(stats.fees.pending / 1000).toFixed(1)}k`}
          subtitle="Outstanding dues"
          icon={CreditCard}
          color="rose"
        />
        <StatCard title="Exams" value={stats.exams} subtitle="Upcoming" icon={BookOpen} color="amber" />
        <StatCard title="Alerts" value={notifications.length} subtitle="Notifications" icon={AlertCircle} color="violet" />
      </div>

      {/* Quick Actions + Recent + Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <SectionCard title="Quick Actions">
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map(action => (
              <button
                key={action.label}
                onClick={() => onNavigate(action.module)}
                className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors text-left group"
              >
                <div className={`w-10 h-10 rounded-lg ${action.color} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                  <action.icon size={18} className="text-white" />
                </div>
                <span className="text-sm font-medium text-gray-700">{action.label}</span>
              </button>
            ))}
          </div>
        </SectionCard>

        {/* Recent Students */}
        <SectionCard
          title="Recent Students"
          action={{ label: 'View All', onClick: () => onNavigate('students') }}
        >
          <div className="space-y-3">
            {recentStudents.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No students yet</p>
            ) : (
              recentStudents.map(student => (
                <div key={student.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <Avatar name={student.name} color="sky" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{student.name}</p>
                    <p className="text-xs text-gray-400 truncate">{student.class_name || 'No class'}</p>
                  </div>
                  <Badge variant={student.status === 'active' ? 'success' : 'danger'} size="sm">
                    {student.status}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </SectionCard>

        {/* Notifications */}
        <SectionCard
          title="Recent Notifications"
          action={{ label: 'View All', onClick: () => onNavigate('notifications') }}
        >
          <div className="space-y-3">
            {notifications.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No notifications</p>
            ) : (
              notifications.map(notif => (
                <div key={notif.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center flex-shrink-0">
                    <AlertCircle size={14} className="text-sky-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{notif.title}</p>
                    <p className="text-xs text-gray-400 line-clamp-1">{notif.message}</p>
                    <p className="text-xs text-gray-300 mt-1">
                      {new Date(notif.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
