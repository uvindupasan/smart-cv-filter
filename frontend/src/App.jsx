// App.jsx — Main app with routing
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login          from './pages/Login';
import Dashboard      from './pages/Dashboard';
import CampaignCreate from './pages/CampaignCreate';
import CampaignView   from './pages/CampaignView';
import CampaignEdit   from './pages/CampaignEdit';
import Apply          from './pages/Apply';
import HRDashboard    from './pages/HRDashboard';
import EmployeesList  from './pages/EmployeesList';
import Departments    from './pages/Departments';
import Attendance     from './pages/Attendance';
import Leaves         from './pages/Leaves';
import Onboarding     from './pages/Onboarding';
import EmployeeDocuments from './pages/EmployeeDocuments';

import Layout         from './components/Layout';

// Protected route wrapper
function PrivateRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? <Layout>{children}</Layout> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/login"       element={<Login />} />
        <Route path="/apply/:slug" element={<Apply />} />

        {/* Protected HR admin routes */}
        <Route path="/" element={
          <PrivateRoute><Dashboard /></PrivateRoute>
        } />
        <Route path="/hr-dashboard" element={
          <PrivateRoute><HRDashboard /></PrivateRoute>
        } />
        <Route path="/employees" element={
          <PrivateRoute><EmployeesList /></PrivateRoute>
        } />
        <Route path="/onboarding" element={
          <PrivateRoute><Onboarding /></PrivateRoute>
        } />
        <Route path="/documents" element={
          <PrivateRoute><EmployeeDocuments /></PrivateRoute>
        } />
        <Route path="/departments" element={
          <PrivateRoute><Departments /></PrivateRoute>
        } />
        <Route path="/attendance" element={
          <PrivateRoute><Attendance /></PrivateRoute>
        } />
        <Route path="/leaves" element={
          <PrivateRoute><Leaves /></PrivateRoute>
        } />
        <Route path="/campaigns/new" element={
          <PrivateRoute><CampaignCreate /></PrivateRoute>
        } />
        <Route path="/campaigns/:id" element={
          <PrivateRoute><CampaignView /></PrivateRoute>
        } />
        <Route path="/campaigns/:id/edit" element={
          <PrivateRoute><CampaignEdit /></PrivateRoute>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
