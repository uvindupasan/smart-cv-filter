import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getHRDashboardAnalytics } from '../utils/api';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, Legend
} from 'recharts';
import {
  FaUsers, FaUserCheck, FaUserGraduate, FaBriefcase, FaHourglassHalf,
  FaCalendarMinus, FaClipboardList, FaUserClock, FaLaptopHouse, FaCalendarCheck,
  FaBirthdayCake, FaBuilding, FaChartLine, FaHistory, FaStar
} from 'react-icons/fa';

const DEPT_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#6366f1'];

export default function HRDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await getHRDashboardAnalytics();
      setData(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load HR Analytics Dashboard.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-semibold text-sm">Loading HR Analytics & Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 font-sans">
        <div className="bg-white p-8 rounded-xl shadow-md text-center max-w-md">
          <div className="text-red-500 text-4xl mb-3">⚠️</div>
          <h3 className="text-lg font-bold text-gray-800 mb-2">{error || 'Something went wrong'}</h3>
          <button
            onClick={fetchDashboard}
            className="px-4 py-2 bg-primary text-white font-semibold rounded-lg text-xs"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { stats, charts, recentActivity } = data;

  const statCards = [
    { title: 'Total Employees', count: stats.totalEmployees, icon: <FaUsers />, bg: 'from-blue-500 to-indigo-600', textColor: 'text-blue-600' },
    { title: 'Active Employees', count: stats.activeEmployees, icon: <FaUserCheck />, bg: 'from-emerald-500 to-teal-600', textColor: 'text-emerald-600' },
    { title: 'Interns', count: stats.interns, icon: <FaUserGraduate />, bg: 'from-violet-500 to-purple-600', textColor: 'text-purple-600' },
    { title: 'Permanent Employees', count: stats.permanentEmployees, icon: <FaBriefcase />, bg: 'from-sky-500 to-blue-600', textColor: 'text-sky-600' },
    { title: 'Employees on Probation', count: stats.employeesOnProbation, icon: <FaHourglassHalf />, bg: 'from-amber-500 to-orange-600', textColor: 'text-amber-600' },
    { title: 'Employees on Leave Today', count: stats.employeesOnLeaveToday, icon: <FaCalendarMinus />, bg: 'from-rose-500 to-red-600', textColor: 'text-rose-600' },
    { title: 'Pending Leave Requests', count: stats.pendingLeaveRequests, icon: <FaClipboardList />, bg: 'from-orange-500 to-amber-600', textColor: 'text-orange-600' },
    { title: 'Late Employees Today', count: stats.lateEmployees, icon: <FaUserClock />, bg: 'from-pink-500 to-rose-600', textColor: 'text-pink-600' },
    { title: 'Currently Working', count: stats.employeesCurrentlyWorking, icon: <FaLaptopHouse />, bg: 'from-teal-500 to-cyan-600', textColor: 'text-teal-600' },
    { title: 'Probation Reviews Due', count: stats.upcomingProbationReviews.length, icon: <FaCalendarCheck />, bg: 'from-indigo-500 to-purple-600', textColor: 'text-indigo-600' },
    { title: 'Upcoming Birthdays', count: stats.upcomingBirthdays.length, icon: <FaBirthdayCake />, bg: 'from-fuchsia-500 to-pink-600', textColor: 'text-fuchsia-600' },
    { title: 'Departments', count: stats.employeesByDepartment.length, icon: <FaBuilding />, bg: 'from-slate-600 to-gray-800', textColor: 'text-gray-700' },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-gray-800">
      <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto">
        {/* Sub Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2.5 bg-primary/10 text-primary rounded-xl text-xl font-black">📊</span>
              <h1 className="text-2xl font-black text-navy m-0 tracking-tight">HR & Workforce Analytics Dashboard</h1>
            </div>
            <p className="text-sm text-gray-500 mt-1 m-0">
              Real-time workforce intelligence, employee distribution, leave monitoring, and activity logs.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span> Live HR Engine Active
            </span>
          </div>
        </div>

      {/* ── SECTION 1: 12 KEY HR METRIC CARDS ─────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
        {statCards.map((card, idx) => (
          <div
            key={idx}
            className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all flex items-center justify-between group"
          >
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 m-0">{card.title}</p>
              <h3 className="text-2xl font-black text-navy m-0 group-hover:scale-105 transition-transform">{card.count}</h3>
            </div>
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${card.bg} text-white flex items-center justify-center text-xl shadow-md group-hover:rotate-6 transition-transform`}>
              {card.icon}
            </div>
          </div>
        ))}
      </div>

      {/* ── SECTION 2: CHARTS GRID ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        
        {/* Chart 1: Department-wise Employee Distribution */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
            <h3 className="text-base font-bold text-navy flex items-center gap-2 m-0">
              <FaBuilding className="text-blue-500" /> Department-wise Distribution
            </h3>
            <span className="text-xs text-gray-400 font-semibold">{charts.departmentDistribution.length} Depts</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.departmentDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" angle={-25} textAnchor="end" tick={{ fontSize: 11, fill: '#64748b' }} interval={0} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff' }}
                  itemStyle={{ color: '#38bdf8', fontWeight: 'bold' }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {charts.departmentDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={DEPT_COLORS[index % DEPT_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Monthly Attendance Trend */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
            <h3 className="text-base font-bold text-navy flex items-center gap-2 m-0">
              <FaUserCheck className="text-emerald-500" /> Monthly Attendance (%)
            </h3>
            <span className="text-xs text-emerald-600 bg-emerald-50 font-bold px-2.5 py-1 rounded-md">Avg ~96%</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.monthlyAttendance} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="attendanceGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis domain={[80, 100]} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff' }}
                  formatter={(val) => [`${val}%`, 'Attendance Rate']}
                />
                <Area type="monotone" dataKey="attendanceRate" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#attendanceGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Monthly Leave Usage */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
            <h3 className="text-base font-bold text-navy flex items-center gap-2 m-0">
              <FaCalendarMinus className="text-rose-500" /> Monthly Leave Usage (Days)
            </h3>
            <span className="text-xs text-rose-600 bg-rose-50 font-bold px-2.5 py-1 rounded-md">Total 90 Days</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.monthlyLeaveUsage} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff' }}
                  formatter={(val) => [`${val} Days`, 'Leave Taken']}
                />
                <Bar dataKey="leaveDays" fill="#f43f5e" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Employee Growth Velocity */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
            <h3 className="text-base font-bold text-navy flex items-center gap-2 m-0">
              <FaChartLine className="text-purple-500" /> Employee Headcount Growth
            </h3>
            <span className="text-xs text-purple-600 bg-purple-50 font-bold px-2.5 py-1 rounded-md">Steady Expansion</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={charts.employeeGrowth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff' }}
                  formatter={(val) => [`${val} Members`, 'Total Headcount']}
                />
                <Line type="monotone" dataKey="total" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 5, fill: '#8b5cf6' }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* ── SECTION 3: PERFORMANCE RATINGS & UPCOMING MILESTONES ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* Performance Rating Distribution Chart */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm lg:col-span-1">
          <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
            <h3 className="text-base font-bold text-navy flex items-center gap-2 m-0">
              <FaStar className="text-amber-400" /> Performance Ratings
            </h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={charts.performanceRatings} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis dataKey="rating" type="category" tick={{ fontSize: 10, fill: '#475569' }} width={110} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff' }}
                  formatter={(val) => [`${val} Employees`, 'Count']}
                />
                <Bar dataKey="count" fill="#eab308" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Upcoming Probation Reviews */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm lg:col-span-1">
          <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
            <h3 className="text-base font-bold text-navy flex items-center gap-2 m-0">
              <FaCalendarCheck className="text-indigo-500" /> Upcoming Probation Reviews
            </h3>
            <span className="text-xs bg-indigo-50 text-indigo-600 font-bold px-2 py-0.5 rounded-full">
              {stats.upcomingProbationReviews.length} Due
            </span>
          </div>

          {stats.upcomingProbationReviews.length === 0 ? (
            <p className="text-gray-400 text-xs py-8 text-center m-0">No probation reviews scheduled within 45 days.</p>
          ) : (
            <div className="flex flex-col gap-3 max-h-64 overflow-y-auto pr-1">
              {stats.upcomingProbationReviews.map((rev) => (
                <div key={rev.id} className="p-3 bg-gray-50/80 rounded-xl border border-gray-100 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-navy m-0">{rev.name}</h4>
                    <p className="text-[11px] text-gray-500 m-0 mt-0.5">{rev.designation} • {rev.department}</p>
                  </div>
                  <span className="text-[11px] font-bold text-indigo-600 bg-indigo-100/60 px-2 py-1 rounded-md">
                    {new Date(rev.reviewDate).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Birthdays */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm lg:col-span-1">
          <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
            <h3 className="text-base font-bold text-navy flex items-center gap-2 m-0">
              <FaBirthdayCake className="text-pink-500" /> Upcoming Birthdays 🎂
            </h3>
            <span className="text-xs bg-pink-50 text-pink-600 font-bold px-2 py-0.5 rounded-full">
              {stats.upcomingBirthdays.length} Soon
            </span>
          </div>

          {stats.upcomingBirthdays.length === 0 ? (
            <p className="text-gray-400 text-xs py-8 text-center m-0">No employee birthdays within next 30 days.</p>
          ) : (
            <div className="flex flex-col gap-3 max-h-64 overflow-y-auto pr-1">
              {stats.upcomingBirthdays.map((bday) => (
                <div key={bday.id} className="p-3 bg-pink-50/40 rounded-xl border border-pink-100/80 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-navy m-0">{bday.name}</h4>
                    <p className="text-[11px] text-gray-500 m-0 mt-0.5">{bday.department}</p>
                  </div>
                  <span className="text-[11px] font-bold text-pink-600 bg-pink-100/80 px-2 py-1 rounded-md">
                    {new Date(bday.dateOfBirth).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* ── SECTION 4: RECENT HR ACTIVITY SECTION ─────────────────── */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-6">
        <div className="flex items-center justify-between mb-5 border-b border-gray-100 pb-4">
          <h3 className="text-base font-bold text-navy flex items-center gap-2 m-0">
            <FaHistory className="text-primary" /> Recent HR Activity Stream
          </h3>
          <span className="text-xs text-gray-400 font-medium">Real-time HR Feed</span>
        </div>

        <div className="flex flex-col gap-3.5">
          {recentActivity.map((act) => (
            <div key={act.id} className="flex items-start gap-3.5 p-3 rounded-xl hover:bg-gray-50 transition-colors">
              <span className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm shrink-0 shadow-sm ${
                act.type === 'leave' ? 'bg-rose-100 text-rose-600' :
                act.type === 'hire' ? 'bg-emerald-100 text-emerald-600' :
                act.type === 'probation' ? 'bg-purple-100 text-purple-600' :
                'bg-blue-100 text-blue-600'
              }`}>
                {act.type === 'leave' ? '🏖️' : act.type === 'hire' ? '👤' : act.type === 'probation' ? '🎓' : '📢'}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 m-0 leading-snug">{act.text}</p>
                <span className="text-[11px] text-gray-400 font-medium mt-0.5 block">{act.time}</span>
              </div>
            </div>
          ))}
        </div>
        </div>
      </div>

    </div>
  );
}
