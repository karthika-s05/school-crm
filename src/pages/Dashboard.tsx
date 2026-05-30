import { useEffect, useState } from 'react';
import {
  Users, GraduationCap, ClipboardCheck, CreditCard,
  BookOpen, School, UserPlus, UserCheck, FileText,
  Send, TrendingUp, AlertCircle, CheckCircle2, Clock
} from 'lucide-react';
import { supabase, type Student, type Teacher, type Notification } from '../lib/supabase';
import { StatCard, SectionCard, Badge, LoadingSpinner } from '../components/ui';

type DashboardProps = {
  onNavigate: (id: string) => void;
};

type DashboardStats = {
  totalStudents: number;
  totalTeachers: number;
  presentToday: number;
  totalStudentsForAttendance: number;
  feesCollected: number;
  feesPending: number;
  totalClasses: number;
  upcomingExams: number;
};

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// Mini bar chart component
function BarChart({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-1 h-16">
      {data.map((v, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div
            className={`w-full rounded-sm ${color} transition-all duration-500`}
            style={{ height: `${(v / max) * 56}px` }}
          />
          <span className="text-xs text-gray-400" style={{ fontSize: '9px' }}>{MONTHS[i]}</span>
        </div>
      ))}
    </div>
  );
}

// Donut-ish progress ring
function ProgressRing({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  const r = 28;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="72" height="72" className="-rotate-90">
        <circle cx="36" cy="36" r={r} fill="none" stroke="#f1f5f9" strokeWidth="7" />
        <circle
          cx="36" cy="36" r={r} fill="none"
          stroke={color} strokeWidth="7"
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeLinecap="round"
          className="transition-all duration-700"
        />
      </svg>
      <span className="absolute text-sm font-bold text-gray-800">{pct}%</span>
    </div>
  );
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0, totalTeachers: 0,
    presentToday: 0, totalStudentsForAttendance: 0,
    feesCollected: 0, feesPending: 0,
    totalClasses: 0, upcomingExams: 0,
  });
  const [recentStudents, setRecentStudents] = useState<Student[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    setLoading(true);
    const today = new Date().toISOString().split('T')[0];

    const [studRes, teachRes, attRes, feesRes, classRes, examRes, notifRes, recentRes] = await Promise.all([
      supabase.from('students').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('teachers').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('attendance').select('status').eq('date', today),
      supabase.from('fees').select('amount, paid_amount, status'),
      supabase.from('classes').select('id', { count: 'exact', head: true }),
      supabase.from('exams').select('id', { count: 'exact', head: true }).gte('date', today),
      supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(5),
      supabase.from('students').select('id, name, class_id, admission_date, gender, classes(name)').order('created_at', { ascending: false }).limit(5),
    ]);

    const attData = attRes.data || [];
    const present = attData.filter(a => a.status === 'present').length;
    const feesData = feesRes.data || [];
    const collected = feesData.reduce((s, f) => s + Number(f.paid_amount), 0);
    const pending = feesData.filter(f => f.status !== 'paid').reduce((s, f) => s + (Number(f.amount) - Number(f.paid_amount)), 0);

    setStats({
      totalStudents: studRes.count || 0,
      totalTeachers: teachRes.count || 0,
      presentToday: present,
      totalStudentsForAttendance: attData.length,
      feesCollected: collected,
      feesPending: pending,
      totalClasses: classRes.count || 0,
      upcomingExams: examRes.count || 0,
    });
    setNotifications((notifRes.data || []) as Notification[]);
    setRecentStudents((recentRes.data || []) as unknown as Student[]);
    setLoading(false);
  }

  if (loading) return <LoadingSpinner />;

  const attendanceRate = stats.totalStudentsForAttendance > 0
    ? Math.round((stats.presentToday / stats.totalStudentsForAttendance) * 100)
    : 0;

  const feeCollectionRate = (stats.feesCollected + stats.feesPending) > 0
    ? Math.round((stats.feesCollected / (stats.feesCollected + stats.feesPending)) * 100)
    : 0;

  const quickActions = [
    { label: 'Add Student', icon: UserPlus, color: 'bg-sky-500', module: 'students' },
    { label: 'Add Teacher', icon: GraduationCap, color: 'bg-emerald-500', module: 'teachers' },
    { label: 'Mark Attendance', icon: UserCheck, color: 'bg-amber-500', module: 'attendance' },
    { label: 'Create Exam', icon: BookOpen, color: 'bg-rose-500', module: 'exams' },
    { label: 'Generate Report', icon: FileText, color: 'bg-teal-500', module: 'fees' },
    { label: 'Send Notice', icon: Send, color: 'bg-blue-500', module: 'notifications' },
  ];

  const notifTypeVariant = (type: string) => {
    if (type === 'warning') return 'warning';
    if (type === 'event') return 'info';
    if (type === 'danger') return 'danger';
    return 'neutral';
  };

  const notifIcon = (type: string) => {
    if (type === 'warning') return <AlertCircle size={16} className="text-amber-500" />;
    if (type === 'event') return <TrendingUp size={16} className="text-sky-500" />;
    return <CheckCircle2 size={16} className="text-emerald-500" />;
  };

  const monthlyAdmissions = [3, 5, 2, 4, 7, 6, 8, 5, 9, 4, 6, 7];
  const monthlyFees = [45000, 52000, 38000, 61000, 55000, 70000, 65000, 72000, 58000, 80000, 75000, 90000];

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-2xl p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-slate-300 text-sm">Welcome back,</p>
            <h2 className="text-2xl font-bold mt-0.5">Admin User</h2>
            <p className="text-slate-300 text-sm mt-1">Here's what's happening at your school today.</p>
          </div>
          <div className="hidden md:flex items-center gap-6 bg-slate-700/50 rounded-xl px-5 py-3">
            <div className="text-center">
              <ProgressRing value={stats.presentToday} max={stats.totalStudentsForAttendance} color="#38bdf8" />
              <p className="text-xs text-slate-400 mt-1">Attendance</p>
            </div>
            <div className="text-center">
              <ProgressRing value={stats.feesCollected} max={stats.feesCollected + stats.feesPending} color="#34d399" />
              <p className="text-xs text-slate-400 mt-1">Fees Paid</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Students" value={stats.totalStudents} subtitle="Active enrollments" icon={Users} color="sky" trend={{ value: 12, positive: true }} />
        <StatCard title="Total Teachers" value={stats.totalTeachers} subtitle="On staff" icon={GraduationCap} color="emerald" trend={{ value: 5, positive: true }} />
        <StatCard title="Attendance Today" value={`${attendanceRate}%`} subtitle={`${stats.presentToday} of ${stats.totalStudentsForAttendance} present`} icon={ClipboardCheck} color="amber" />
        <StatCard title="Total Classes" value={stats.totalClasses} subtitle="Active classrooms" icon={School} color="teal" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Fees Collected" value={`$${(stats.feesCollected / 1000).toFixed(1)}k`} subtitle={`${feeCollectionRate}% collected`} icon={CreditCard} color="sky" trend={{ value: 8, positive: true }} />
        <StatCard title="Pending Fees" value={`$${(stats.feesPending / 1000).toFixed(1)}k`} subtitle="Due this quarter" icon={CreditCard} color="rose" />
        <StatCard title="Upcoming Exams" value={stats.upcomingExams} subtitle="Scheduled exams" icon={BookOpen} color="amber" />
        <StatCard title="Notifications" value={notifications.length} subtitle="Recent alerts" icon={AlertCircle} color="violet" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SectionCard title="Monthly Admissions Trend">
          <BarChart data={monthlyAdmissions} color="bg-sky-400" />
          <div className="mt-3 flex justify-between text-xs text-gray-400">
            <span>Jan 2025</span>
            <span>Dec 2025</span>
          </div>
        </SectionCard>
        <SectionCard title="Fee Collection (Monthly)">
          <BarChart data={monthlyFees.map(v => Math.floor(v / 1000))} color="bg-emerald-400" />
          <div className="mt-3 flex justify-between text-xs text-gray-400">
            <span>Jan 2025</span>
            <span>Values in $000s</span>
          </div>
        </SectionCard>
      </div>

      {/* Quick Actions + Recent + Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Quick Actions */}
        <SectionCard title="Quick Actions">
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map((action) => (
              <button
                key={action.label}
                onClick={() => onNavigate(action.module)}
                className="flex items-center gap-2 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors text-left group"
              >
                <div className={`w-8 h-8 rounded-lg ${action.color} flex items-center justify-center flex-shrink-0`}>
                  <action.icon size={16} className="text-white" />
                </div>
                <span className="text-xs font-medium text-gray-700 group-hover:text-gray-900">{action.label}</span>
              </button>
            ))}
          </div>
        </SectionCard>

        {/* Recent Admissions */}
        <SectionCard title="Recent Admissions" action={{ label: 'View All', onClick: () => onNavigate('students') }}>
          <div className="space-y-3">
            {recentStudents.map((s) => (
              <div key={s.id} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center text-sky-700 text-xs font-bold flex-shrink-0">
                  {s.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{s.name}</p>
                  <p className="text-xs text-gray-400 truncate">
                    {(s as any).classes?.name || 'N/A'}
                  </p>
                </div>
                <Badge variant={s.gender === 'male' ? 'info' : 'success'}>
                  {s.gender === 'male' ? 'M' : 'F'}
                </Badge>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Notifications */}
        <SectionCard title="Notifications" action={{ label: 'View All', onClick: () => onNavigate('notifications') }}>
          <div className="space-y-3">
            {notifications.map((n) => (
              <div key={n.id} className="flex items-start gap-3">
                <div className="mt-0.5 flex-shrink-0">{notifIcon(n.type)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 leading-tight truncate">{n.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{n.message}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock size={10} className="text-gray-300" />
                    <span className="text-xs text-gray-300">
                      {new Date(n.created_at).toLocaleDateString()}
                    </span>
                    <Badge variant={notifTypeVariant(n.type)}>{n.target_audience}</Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
