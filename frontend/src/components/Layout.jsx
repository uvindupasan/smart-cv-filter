import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  FaBullhorn, FaChartBar, FaPlusCircle, FaSignOutAlt,
  FaRobot, FaUserCircle, FaBars, FaTimes, FaChevronLeft, FaChevronRight, FaUsers,
  FaBuilding, FaClock, FaCalendarAlt, FaUserCheck, FaFolderOpen
} from 'react-icons/fa';

export default function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [mobileOpen, setMobileOpen]   = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const navItems = [
    {
      label: 'Recruitment & CV Filter',
      path: '/',
      icon: <FaBullhorn className="text-lg" />,
      badge: 'ATS Core'
    },
    {
      label: 'HR Workforce Analytics',
      path: '/hr-dashboard',
      icon: <FaChartBar className="text-lg" />,
      badge: 'Analytics'
    },
    {
      label: 'Employee Directory',
      path: '/employees',
      icon: <FaUsers className="text-lg" />,
      badge: 'Database'
    },
    {
      label: 'Employee Onboarding',
      path: '/onboarding',
      icon: <FaUserCheck className="text-lg" />,
    },
    {
      label: 'Employee Documents',
      path: '/documents',
      icon: <FaFolderOpen className="text-lg" />,
    },
    {
      label: 'Departments & Roles',
      path: '/departments',
      icon: <FaBuilding className="text-lg font-bold" />,
    },
    {
      label: 'Attendance Tracking',
      path: '/attendance',
      icon: <FaClock className="text-lg" />,
    },
    {
      label: 'Leave Management',
      path: '/leaves',
      icon: <FaCalendarAlt className="text-lg" />,
    },
    {
      label: 'Post Job Campaign',
      path: '/campaigns/new',
      icon: <FaPlusCircle className="text-lg" />,
    }
  ];

  return (
    <div className="min-h-screen flex bg-[#f8fafc] font-sans antialiased text-gray-800">
      
      {/* ── Mobile Sidebar Backdrop ─────────────────── */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-navy/60 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* ── Collapsible Sidebar Component ──────────── */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        ${isCollapsed ? 'lg:w-20' : 'lg:w-64'} w-64 bg-slate-900 text-white flex flex-col justify-between
        transform ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
        transition-all duration-300 ease-in-out shadow-xl border-r border-slate-800 select-none
      `}>
        <div>
          
          {/* Sidebar Header / Logo (Clickable to Collapse/Expand) */}
          <div
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? "Click to expand sidebar" : "Click logo to collapse sidebar"}
            className={`
              h-16 px-4 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}
              border-b border-slate-800/80 bg-slate-950/40 cursor-pointer hover:bg-slate-800/50 transition-colors group
            `}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-emerald-400 flex items-center justify-center text-white text-xl shadow-lg shadow-primary/30 font-black group-hover:scale-105 transition-transform shrink-0">
                🎯
              </div>
              {!isCollapsed && (
                <div className="min-w-0">
                  <h1 className="text-base font-black text-white m-0 tracking-tight leading-tight truncate">Smart CV Filter</h1>
                  <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider m-0 truncate">HR & ATS Enterprise</p>
                </div>
              )}
            </div>

            {/* Collapse Icon Indicator */}
            <div className="hidden lg:flex items-center text-slate-400 group-hover:text-white transition-colors">
              {isCollapsed ? (
                <FaChevronRight className="text-xs bg-slate-800 p-1 rounded-md" />
              ) : (
                <FaChevronLeft className="text-xs bg-slate-800 p-1 rounded-md" />
              )}
            </div>

            <button
              onClick={(e) => { e.stopPropagation(); setMobileOpen(false); }}
              className="lg:hidden text-slate-400 hover:text-white text-xl border-0 bg-transparent cursor-pointer"
            >
              <FaTimes />
            </button>
          </div>

          {/* Navigation Links Group */}
          <div className="p-3 space-y-1.5">
            {!isCollapsed && (
              <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 m-0">
                Main Menu
              </p>
            )}

            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  title={isCollapsed ? item.label : undefined}
                  onClick={() => setMobileOpen(false)}
                  className={`
                    flex items-center ${isCollapsed ? 'justify-center py-3' : 'justify-between px-3.5 py-3'}
                    rounded-xl font-semibold text-xs no-underline transition-all duration-200 group
                    ${isActive
                      ? 'bg-primary text-white shadow-md shadow-primary/30 font-bold'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    }
                  `}
                >
                  <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
                    <span className={`${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'} transition-colors`}>
                      {item.icon}
                    </span>
                    {!isCollapsed && <span>{item.label}</span>}
                  </div>

                  {!isCollapsed && item.badge && (
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Sidebar Footer Section */}
        <div className="p-3 space-y-3 border-t border-slate-800/80 bg-slate-950/40">
          
          {/* AI Engine Status Card */}
          <div
            title={isCollapsed ? "SBERT AI Engine: Fine-Tuned Active" : undefined}
            className={`p-2.5 bg-slate-800/60 rounded-xl border border-slate-700/50 flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-sm font-bold shrink-0 relative">
              <FaRobot />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold text-slate-200 m-0 leading-snug truncate">SBERT AI Engine</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] text-emerald-400 font-semibold truncate">Fine-Tuned Active</span>
                </div>
              </div>
            )}
          </div>

          {/* Current User Info & Logout */}
          <div className={`flex items-center ${isCollapsed ? 'justify-center flex-col gap-2' : 'justify-between'} pt-1`}>
            <div
              title={isCollapsed ? `${user.name || 'HR Admin'} (${user.email || 'admin@axcertro.com'})` : undefined}
              className="flex items-center gap-2.5 min-w-0"
            >
              <div className="w-8 h-8 rounded-full bg-slate-700 text-slate-300 flex items-center justify-center text-sm shrink-0">
                <FaUserCircle />
              </div>
              {!isCollapsed && (
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate m-0">{user.name || 'HR Admin'}</p>
                  <p className="text-[10px] text-slate-400 truncate m-0">{user.email || 'admin@axcertro.com'}</p>
                </div>
              )}
            </div>

            <button
              onClick={handleLogout}
              title="Logout from system"
              className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800/80 cursor-pointer border-0 transition-colors"
            >
              <FaSignOutAlt className="text-base" />
            </button>
          </div>

        </div>
      </aside>

      {/* ── Main Content Area ──────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Mobile Navbar Header */}
        <header className="lg:hidden bg-slate-900 text-white h-14 px-4 flex items-center justify-between border-b border-slate-800 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="text-slate-300 text-xl border-0 bg-transparent cursor-pointer p-1"
            >
              <FaBars />
            </button>
            <span className="font-bold text-sm">Smart CV Filter & HR</span>
          </div>
          <span className="text-xs bg-primary/20 text-emerald-300 font-bold px-2.5 py-1 rounded-md">
            HR Admin
          </span>
        </header>

        {/* Page Container */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

    </div>
  );
}
