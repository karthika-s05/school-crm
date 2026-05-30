import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

type StatCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color: 'sky' | 'emerald' | 'amber' | 'rose' | 'violet' | 'teal';
  trend?: { value: number; positive: boolean };
};

const colorMap = {
  sky:    { bg: 'bg-sky-50',    icon: 'bg-sky-500',    text: 'text-sky-600',    ring: 'ring-sky-100' },
  emerald:{ bg: 'bg-emerald-50', icon: 'bg-emerald-500', text: 'text-emerald-600', ring: 'ring-emerald-100' },
  amber:  { bg: 'bg-amber-50',  icon: 'bg-amber-500',  text: 'text-amber-600',  ring: 'ring-amber-100' },
  rose:   { bg: 'bg-rose-50',   icon: 'bg-rose-500',   text: 'text-rose-600',   ring: 'ring-rose-100' },
  violet: { bg: 'bg-blue-50',   icon: 'bg-blue-500',   text: 'text-blue-600',   ring: 'ring-blue-100' },
  teal:   { bg: 'bg-teal-50',   icon: 'bg-teal-500',   text: 'text-teal-600',   ring: 'ring-teal-100' },
};

export function StatCard({ title, value, subtitle, icon: Icon, color, trend }: StatCardProps) {
  const c = colorMap[color];
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
          {trend && (
            <p className={`text-xs font-medium mt-2 ${trend.positive ? 'text-emerald-600' : 'text-rose-500'}`}>
              {trend.positive ? '▲' : '▼'} {Math.abs(trend.value)}% vs last month
            </p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-2xl ${c.icon} ring-4 ${c.ring} flex items-center justify-center`}>
          <Icon size={22} className="text-white" />
        </div>
      </div>
    </div>
  );
}

type SectionCardProps = {
  title: string;
  children: ReactNode;
  action?: { label: string; onClick: () => void };
  className?: string;
};

export function SectionCard({ title, children, action, className = '' }: SectionCardProps) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 ${className}`}>
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
        <h3 className="font-semibold text-gray-800 text-sm">{title}</h3>
        {action && (
          <button
            onClick={action.onClick}
            className="text-xs text-sky-600 font-medium hover:text-sky-700 transition-colors"
          >
            {action.label}
          </button>
        )}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

type BadgeProps = {
  children: ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
};

const badgeVariants = {
  success: 'bg-emerald-100 text-emerald-700',
  warning: 'bg-amber-100 text-amber-700',
  danger:  'bg-rose-100 text-rose-700',
  info:    'bg-sky-100 text-sky-700',
  neutral: 'bg-gray-100 text-gray-600',
};

export function Badge({ children, variant = 'neutral' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${badgeVariants[variant]}`}>
      {children}
    </span>
  );
}

export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="w-8 h-8 border-4 border-sky-200 border-t-sky-500 rounded-full animate-spin" />
    </div>
  );
}

type EmptyStateProps = {
  message: string;
  icon?: LucideIcon;
};

export function EmptyState({ message, icon: Icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon && <Icon size={48} className="text-gray-200 mb-3" />}
      <p className="text-gray-400 text-sm">{message}</p>
    </div>
  );
}
