import React from 'react';
import {
  LayoutDashboard, Users, GraduationCap, ClipboardCheck,
  CreditCard, BookOpen, Calendar, Library, Bus, Home,
  Bell, ChevronRight, School
} from 'lucide-react';

export type NavItem = {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
};

export const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
  { id: 'students', label: 'Students', icon: <Users size={20} /> },
  { id: 'teachers', label: 'Teachers', icon: <GraduationCap size={20} /> },
  { id: 'attendance', label: 'Attendance', icon: <ClipboardCheck size={20} /> },
  { id: 'fees', label: 'Fees', icon: <CreditCard size={20} /> },
  { id: 'exams', label: 'Exams & Results', icon: <BookOpen size={20} /> },
  { id: 'timetable', label: 'Timetable', icon: <Calendar size={20} /> },
  { id: 'library', label: 'Library', icon: <Library size={20} /> },
  { id: 'transport', label: 'Transport', icon: <Bus size={20} /> },
  { id: 'hostel', label: 'Hostel', icon: <Home size={20} /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell size={20} /> },
];

type SidebarProps = {
  activeModule: string;
  onNavigate: (id: string) => void;
  collapsed: boolean;
};

export default function Sidebar({ activeModule, onNavigate, collapsed }: SidebarProps) {
  return (
    <aside
      className={`h-full flex flex-col bg-slate-900 text-white transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-slate-700 ${collapsed ? 'justify-center' : ''}`}>
        <div className="w-9 h-9 bg-sky-500 rounded-xl flex items-center justify-center flex-shrink-0">
          <School size={20} className="text-white" />
        </div>
        {!collapsed && (
          <div>
            <p className="font-bold text-sm leading-tight">EduAdmin</p>
            <p className="text-xs text-slate-400">School Management</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const active = activeModule === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group
                ${active
                  ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }
                ${collapsed ? 'justify-center' : ''}
              `}
              title={collapsed ? item.label : undefined}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              {!collapsed && (
                <>
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge != null && (
                    <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                  {active && <ChevronRight size={14} className="opacity-70" />}
                </>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="px-4 py-4 border-t border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-sky-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              AD
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">Admin User</p>
              <p className="text-xs text-slate-400 truncate">admin@school.edu</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
