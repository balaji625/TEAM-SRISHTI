/**
 * Application Router — all routes defined here.
 * Route groups:
 *   Public  /  /about  /how-it-works  /contact
 *   Auth    /login  /register
 *   User    /user/*
 *   Hospital /hospital/*
 *   Professional /professional/*
 *   Expert  /expert/*
 *   Admin   /admin/*
 */

import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';

// Layouts
import PublicLayout from '../components/layout/PublicLayout';
import DashboardLayout from '../components/layout/DashboardLayout';

// Route guards
import ProtectedRoute from './ProtectedRoute';
import RoleRoute from './RoleRoute';

// Public pages
import Landing from '../pages/public/Landing';
import About from '../pages/public/About';
import HowItWorks from '../pages/public/HowItWorks';
import Contact from '../pages/public/Contact';

// Auth pages
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';

// Utility pages
import NotFound from '../pages/NotFound';
import Unauthorized from '../pages/Unauthorized';

// ── User pages ────────────────────────────────────────────────────────────────
import UserDashboard, { UserSidebar } from '../pages/user/UserDashboard';
import UserProfile from '../pages/user/UserProfile';
import AIAssistant from '../pages/user/AIAssistant';
import UserAppointments from '../pages/user/UserAppointments';
import UserNotifications from '../pages/user/UserNotifications';
import FindHospitals from '../pages/user/FindHospitals';
import HospitalDetail from '../pages/user/HospitalDetail';
import FindProfessionals from '../pages/user/FindProfessionals';
import ProfessionalDetail from '../pages/user/ProfessionalDetail';
import HealthReports from '../pages/user/HealthReports';
import HealthHistory from '../pages/user/HealthHistory';
import PreventiveCare from '../pages/user/PreventiveCare';
import ExpertHelp from '../pages/user/ExpertHelp';
import EmergencyPage from '../pages/user/EmergencyPage';
import UserReferrals from '../pages/user/UserReferrals';
import HealthPassport from '../pages/user/HealthPassport';

// ── Hospital pages ────────────────────────────────────────────────────────────
import HospitalDashboard, { HospitalSidebar } from '../pages/hospital/HospitalDashboard';
import HospitalProfile from '../pages/hospital/HospitalProfile';
import HospitalDoctors from '../pages/hospital/HospitalDoctors';
import AddDoctor from '../pages/hospital/AddDoctor';
import HospitalAssociations from '../pages/hospital/HospitalAssociations';
import HospitalAppointments from '../pages/hospital/HospitalAppointments';
import HospitalRequests from '../pages/hospital/HospitalRequests';
import HospitalAnalytics from '../pages/hospital/HospitalAnalytics';
import HospitalNotifications from '../pages/hospital/HospitalNotifications';
import HospitalSettings from '../pages/hospital/HospitalSettings';
import HospitalReferrals from '../pages/hospital/HospitalReferrals';

// ── Professional pages ────────────────────────────────────────────────────────
import ProfessionalDashboard, { ProfessionalSidebar } from '../pages/professional/ProfessionalDashboard';
import ProfessionalProfile       from '../pages/professional/ProfessionalProfile';
import ProfessionalAssociations  from '../pages/professional/ProfessionalAssociations';
import ProfessionalRequests      from '../pages/professional/ProfessionalRequests';
import ProfessionalAvailability  from '../pages/professional/ProfessionalAvailability';
import ProfessionalNotifications from '../pages/professional/ProfessionalNotifications';
import ProfessionalAppointments  from '../pages/professional/ProfessionalAppointments';
import ProfessionalCredentials   from '../pages/professional/ProfessionalCredentials';
import ProfessionalSettings      from '../pages/professional/ProfessionalSettings';
import ProfessionalConsultations from '../pages/professional/ProfessionalConsultations';
import ProfessionalReferrals     from '../pages/professional/ProfessionalReferrals';

// ── Expert pages ──────────────────────────────────────────────────────────────
import ExpertDashboard, { ExpertSidebar } from '../pages/expert/ExpertDashboard';
import ExpertProfile from '../pages/expert/ExpertProfile';
import ExpertRequests    from '../pages/expert/ExpertRequests';
import ExpertEscalations from '../pages/expert/ExpertEscalations';
import ExpertCredentials   from '../pages/expert/ExpertCredentials';
import ExpertAvailability  from '../pages/expert/ExpertAvailability';
import ExpertConsultations from '../pages/expert/ExpertConsultations';
import ExpertNotifications from '../pages/expert/ExpertNotifications';
import ExpertSettings      from '../pages/expert/ExpertSettings';


// ── Admin pages ───────────────────────────────────────────────────────────────
import AdminLogin          from '../pages/admin/AdminLogin';
import AdminDashboard, { AdminSidebar } from '../pages/admin/AdminDashboard';
import AdminAiSafety       from '../pages/admin/AdminAiSafety';

import AdminUsers          from '../pages/admin/AdminUsers';
import AdminHospitals      from '../pages/admin/AdminHospitals';
import AdminProfessionals  from '../pages/admin/AdminProfessionals';
import AdminExperts        from '../pages/admin/AdminExperts';
import AdminAnalytics      from '../pages/admin/AdminAnalytics';
import AdminAuditLogs      from '../pages/admin/AdminAuditLogs';
import AdminAppointments   from '../pages/admin/AdminAppointments';
import AdminRequests       from '../pages/admin/AdminRequests';
import AdminSettings       from '../pages/admin/AdminSettings';

// ── Helper: placeholder page for routes added in later stages ─────────────────
const ComingSoon = ({ title }) => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="text-center">
      <p className="text-4xl font-extrabold text-gray-100">Soon</p>
      <h2 className="text-xl font-bold text-gray-800 mt-2">{title}</h2>
      <p className="text-sm text-gray-500 mt-1">This feature will be implemented in a later stage.</p>
    </div>
  </div>
);

const router = createBrowserRouter([
  // ── Public routes ────────────────────────────────────────────────────────────
  {
    element: <PublicLayout />,
    children: [
      { path: '/', element: <Landing /> },
      { path: '/about', element: <About /> },
      { path: '/how-it-works', element: <HowItWorks /> },
      { path: '/contact', element: <Contact /> },
    ],
  },

  // ── Auth routes (no layout wrapper) ─────────────────────────────────────────
  { path: '/login', element: <Login /> },
  { path: '/register', element: <Register /> },
  { path: '/admin/login', element: <AdminLogin /> },


  // ── Utility ─────────────────────────────────────────────────────────────────
  { path: '/unauthorized', element: <Unauthorized /> },

  // ── User routes ──────────────────────────────────────────────────────────────
  {
    path: '/user',
    element: (
      <ProtectedRoute>
        <RoleRoute allowedRoles={['USER']}>
          <DashboardLayout sidebar={UserSidebar} />
        </RoleRoute>
      </ProtectedRoute>
    ),
    children: [
      { index: true,               element: <Navigate to="/user/dashboard" replace /> },
      { path: 'dashboard',         element: <UserDashboard /> },
      { path: 'ai',                element: <AIAssistant /> },
      { path: 'hospitals',         element: <FindHospitals /> },
      { path: 'hospitals/:id',     element: <HospitalDetail /> },
      { path: 'professionals',     element: <FindProfessionals /> },
      { path: 'professionals/:id', element: <ProfessionalDetail /> },
      { path: 'appointments',      element: <UserAppointments /> },
      { path: 'referrals',         element: <UserReferrals /> },
      { path: 'passport',          element: <HealthPassport /> },
      { path: 'reports',           element: <HealthReports /> },
      { path: 'reports/:id',       element: <ComingSoon title="Report Details" /> },
      { path: 'history',           element: <HealthHistory /> },
      { path: 'preventive',        element: <PreventiveCare /> },
      { path: 'experts',           element: <ExpertHelp /> },
      { path: 'emergency',         element: <EmergencyPage /> },
      { path: 'notifications',     element: <UserNotifications /> },
      { path: 'profile',           element: <UserProfile /> },
      { path: 'consent',           element: <UserProfile defaultTab="consent" /> },
    ],
  },

  // ── Hospital routes ───────────────────────────────────────────────────────────
  {
    path: '/hospital',
    element: (
      <ProtectedRoute>
        <RoleRoute allowedRoles={['HOSPITAL']}>
          <DashboardLayout sidebar={HospitalSidebar} />
        </RoleRoute>
      </ProtectedRoute>
    ),
    children: [
      { index: true,                    element: <Navigate to="/hospital/dashboard" replace /> },
      { path: 'dashboard',              element: <HospitalDashboard /> },
      { path: 'profile',                element: <HospitalProfile /> },
      { path: 'doctors',                element: <HospitalDoctors /> },
      { path: 'doctors/add',            element: <AddDoctor /> },
      { path: 'doctors/:id',            element: <ComingSoon title="Doctor Details" /> },
      { path: 'doctors/:id/edit',       element: <ComingSoon title="Edit Doctor" /> },
      { path: 'associations',           element: <HospitalAssociations /> },
      { path: 'appointments',           element: <HospitalAppointments /> },
      { path: 'referrals',              element: <HospitalReferrals /> },
      { path: 'requests',               element: <HospitalRequests /> },
      { path: 'analytics',              element: <HospitalAnalytics /> },
      { path: 'notifications',          element: <HospitalNotifications /> },
      { path: 'settings',               element: <HospitalSettings /> },
    ],
  },

  // ── Professional routes ───────────────────────────────────────────────────────
  {
    path: '/professional',
    element: (
      <ProtectedRoute>
        <RoleRoute allowedRoles={['PROFESSIONAL']}>
          <DashboardLayout sidebar={ProfessionalSidebar} />
        </RoleRoute>
      </ProtectedRoute>
    ),
    children: [
      { index: true,              element: <Navigate to="/professional/dashboard" replace /> },
      { path: 'dashboard',        element: <ProfessionalDashboard /> },
      { path: 'profile',          element: <ProfessionalProfile /> },
      { path: 'credentials',      element: <ProfessionalCredentials /> },
      { path: 'associations',     element: <ProfessionalAssociations /> },
      { path: 'associations/:id', element: <ProfessionalAssociations /> },
      { path: 'availability',     element: <ProfessionalAvailability /> },
      { path: 'requests',         element: <ProfessionalRequests /> },
      { path: 'appointments',     element: <ProfessionalAppointments /> },
      { path: 'referrals',        element: <ProfessionalReferrals /> },
      { path: 'consultations',    element: <ProfessionalConsultations /> },
      { path: 'notifications',    element: <ProfessionalNotifications /> },
      { path: 'settings',         element: <ProfessionalSettings /> },
    ],
  },

  // ── Expert routes ─────────────────────────────────────────────────────────────
  {
    path: '/expert',
    element: (
      <ProtectedRoute>
        <RoleRoute allowedRoles={['EXPERT']}>
          <DashboardLayout sidebar={ExpertSidebar} />
        </RoleRoute>
      </ProtectedRoute>
    ),
    children: [
      { index: true,           element: <Navigate to="/expert/dashboard" replace /> },
      { path: 'dashboard',     element: <ExpertDashboard /> },
      { path: 'profile',       element: <ExpertProfile /> },
      { path: 'credentials',   element: <ExpertCredentials /> },
      { path: 'availability',  element: <ExpertAvailability /> },
      { path: 'requests',      element: <ExpertRequests /> },
      { path: 'consultations', element: <ExpertConsultations /> },
      { path: 'escalations',   element: <ExpertEscalations /> },
      { path: 'notifications', element: <ExpertNotifications /> },
      { path: 'settings',      element: <ExpertSettings /> },
    ],
  },

  // ── Admin routes ──────────────────────────────────────────────────────────────
  {
    path: '/admin',
    element: (
      <ProtectedRoute>
        <RoleRoute allowedRoles={['ADMIN']}>
          <DashboardLayout sidebar={AdminSidebar} />
        </RoleRoute>
      </ProtectedRoute>
    ),
    children: [
    { index: true,                      element: <Navigate to="/admin/dashboard" replace /> },
    { path: 'dashboard',                element: <AdminDashboard /> },
    { path: 'users',                    element: <AdminUsers /> },
    { path: 'hospitals',                element: <AdminHospitals /> },
    { path: 'hospitals/verify',         element: <AdminHospitals /> },
    { path: 'professionals',            element: <AdminProfessionals /> },
    { path: 'professionals/verify',     element: <AdminProfessionals /> },
    { path: 'experts',                  element: <AdminExperts /> },
    { path: 'experts/verify',           element: <AdminExperts /> },
    { path: 'appointments',             element: <AdminAppointments /> },
    { path: 'requests',                 element: <AdminRequests /> },
    { path: 'ai-safety',                element: <AdminAiSafety /> },
    { path: 'analytics',                element: <AdminAnalytics /> },
    { path: 'audit-logs',               element: <AdminAuditLogs /> },
    { path: 'settings',                 element: <AdminSettings /> },
  ],
  },

  // ── 404 ───────────────────────────────────────────────────────────────────────
  { path: '*', element: <NotFound /> },
]);

const AppRouter = () => <RouterProvider router={router} />;
export default AppRouter;
