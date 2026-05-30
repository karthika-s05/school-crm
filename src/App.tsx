import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Teachers from './pages/Teachers';
import Attendance from './pages/Attendance';
import Fees from './pages/Fees';
import Exams from './pages/Exams';
import Timetable from './pages/Timetable';
import Library from './pages/Library';
import Transport from './pages/Transport';
import Hostel from './pages/Hostel';
import Notifications from './pages/Notifications';

const PAGE_TITLES: Record<string, string> = {
  dashboard: 'Dashboard',
  students: 'Student Management',
  teachers: 'Teacher Management',
  attendance: 'Attendance',
  fees: 'Fees Management',
  exams: 'Exams & Results',
  timetable: 'Timetable',
  library: 'Library',
  transport: 'Transport',
  hostel: 'Hostel Management',
  notifications: 'Notifications & Announcements',
};

function App() {
  const [activeModule, setActiveModule] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const renderPage = () => {
    switch (activeModule) {
      case 'dashboard': return <Dashboard onNavigate={setActiveModule} />;
      case 'students': return <Students />;
      case 'teachers': return <Teachers />;
      case 'attendance': return <Attendance />;
      case 'fees': return <Fees />;
      case 'exams': return <Exams />;
      case 'timetable': return <Timetable />;
      case 'library': return <Library />;
      case 'transport': return <Transport />;
      case 'hostel': return <Hostel />;
      case 'notifications': return <Notifications />;
      default: return <Dashboard onNavigate={setActiveModule} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar
        activeModule={activeModule}
        onNavigate={setActiveModule}
        collapsed={sidebarCollapsed}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          title={PAGE_TITLES[activeModule] || 'Dashboard'}
          onToggleSidebar={() => setSidebarCollapsed(c => !c)}
          notificationCount={3}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}

export default App;
