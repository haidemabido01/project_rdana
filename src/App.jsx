import { useEffect, useState } from 'react';
import { HashRouter, Link, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { Loader2, Menu, X } from 'lucide-react';
import { useOnline } from './hooks/useOnline';
import Sidebar from './components/Sidebar';
import { ConfirmDialog } from './components/Modal';
import { ToastProvider, useToast } from './components/Toast';
import { RoleProvider, useRole } from './context/RoleContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AgencyOverview from './pages/AgencyOverview';
import Reports from './pages/Reports';
import ImpactDashboard from './pages/ImpactDashboard';
import ImpactDeped from './pages/ImpactDeped';
import ImpactMasso from './pages/ImpactMasso';
import ImpactMdrrmo from './pages/ImpactMdrrmo';
import ImpactMeo from './pages/ImpactMeo';
import ImpactMho from './pages/ImpactMho';
import ImpactMpdo from './pages/ImpactMpdo';
import ImpactMswdo from './pages/ImpactMswdo';
import ImpactOmag from './pages/ImpactOmag';
import IncidentEditor from './pages/IncidentEditor';
import IncidentList from './pages/IncidentList';
import ReportView from './pages/ReportView';
import AuditLogs from './pages/AuditLogs';
import DataSets from './pages/DataSets';
import ArchivePage from './pages/Archive';

const COLLAPSE_KEY = 'rdana.sidebar.collapsed';

/* Routes that place the online/offline pill inside their own page
   header instead of letting the shell float it. */
const OWN_STATUS_ROUTES = new Set(['/dashboard']);

function readCollapsed() {
  try {
    return localStorage.getItem(COLLAPSE_KEY) === '1';
  } catch {
    return false;
  }
}

/* The light RDANA capture app. The dashboard shares the same shell but
   is laid out on a wider canvas — it carries tables and grids that do
   not fit the 900px reading column. */
function AppShell() {
  const online = useOnline();
  const { logout } = useAuth();
  const { role } = useRole();
  const { pathname } = useLocation();
  const [drawer, setDrawer] = useState(false);
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const wide =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/impact') ||
    pathname.startsWith('/agency-overview') ||
    pathname.startsWith('/reports') ||
    pathname.startsWith('/archive') ||
    pathname.startsWith('/audit-logs');

  /* A tap on a link or a back gesture should not leave the drawer
     hanging over the form. */
  useEffect(() => {
    setDrawer(false);
  }, [pathname]);

  /* The page behind the drawer must not scroll while it is open. */
  useEffect(() => {
    document.body.style.overflow = drawer ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [drawer]);

  const toggleCollapsed = () => {
    setCollapsed((c) => {
      const next = !c;
      try {
        localStorage.setItem(COLLAPSE_KEY, next ? '1' : '0');
      } catch {
        /* storage unavailable — the choice just will not persist */
      }
      return next;
    });
  };

  const onLogout = () => {
    setDrawer(false);
    setConfirmLogout(true);
  };

  const handleConfirmLogout = async () => {
    setSigningOut(true);
    try {
      await logout();
    } finally {
      setConfirmLogout(false);
      setSigningOut(false);
    }
  };

  const handleCancelLogout = () => {
    if (!signingOut) setConfirmLogout(false);
  };

  return (
    <div className="app-shell">
      {/* Permanent column on wide screens — collapsible to an icon rail */}
      <aside className={`app-sidebar ${collapsed ? 'collapsed' : ''}`}>
        <Sidebar
          onLogout={onLogout}
          collapsed={collapsed}
          onToggleCollapse={toggleCollapsed}
        />
      </aside>

      {/* Off-canvas drawer on phones */}
      <div className={`app-drawer ${drawer ? 'open' : ''}`} aria-hidden={!drawer}>
        <button
          type="button"
          className="app-drawer-scrim"
          aria-label="Close menu"
          onClick={() => setDrawer(false)}
        />
        <div className="app-drawer-panel" role="dialog" aria-label="Menu">
          <button
            type="button"
            className="app-drawer-close"
            aria-label="Close menu"
            onClick={() => setDrawer(false)}
          >
            <X size={17} strokeWidth={2.2} />
          </button>
          <Sidebar onNavigate={() => setDrawer(false)} onLogout={onLogout} />
        </div>
      </div>

      <div className="app-main">
        {/* Phone header — on wide screens the sidebar carries the brand
           and this bar is hidden so the content starts higher. */}
        <header className="appbar">
          <div className="appbar-left">
            <button
              type="button"
              className="app-burger"
              aria-label="Open menu"
              aria-expanded={drawer}
              onClick={() => setDrawer(true)}
            >
              <Menu size={19} strokeWidth={2.2} />
            </button>
            <Link to="/" className="brand appbar-brand">
              <span className="appbar-logo">
                <img src="/icons/icon-192.png" alt="" width="30" height="30" />
              </span>
              <span className="brand-text">
                RDANA <small>Digital Assessment</small>
              </span>
            </Link>
          </div>
          <div className="appbar-right">
            <span className={`badge ${online ? 'badge-success' : 'badge-warning'}`}>
              {online ? 'Online' : 'Offline'}
            </span>
          </div>
        </header>

        <main className={`main ${wide ? 'main-wide' : ''}`}>
          {/* Desktop status pill — floats at the top-right so it never
              pushes the page content down. The dashboard draws its own
              inside the title row instead. */}
          {!OWN_STATUS_ROUTES.has(pathname) && (
            <div className="app-status">
              <span className={`badge ${online ? 'badge-success' : 'badge-warning'}`}>
                {online ? 'Online' : 'Offline'}
              </span>
            </div>
          )}
          <Outlet />
        </main>

        <footer className="footer">
          RDANA Forms 1 &amp; 2 — Rapid Damage Assessment and Needs Analysis · NEMSU Tech Innovation
        </footer>
      </div>

      <ConfirmDialog
        open={confirmLogout}
        title="Sign out of RDANA?"
        message={`You are signed in as ${role?.name || 'current user'}${role?.roleLabel ? ` (${role.roleLabel})` : ''}. Your secure session will end and you will return to the login screen. Local drafts saved on this device are kept.`}
        confirmLabel={signingOut ? 'Signing out...' : 'Sign out'}
        cancelLabel="Stay signed in"
        danger
        busy={signingOut}
        onConfirm={handleConfirmLogout}
        onCancel={handleCancelLogout}
      />
    </div>
  );
}

/* The impact template binds to the toast slot so tab and agency
   changes can report back without the screen reaching for the DOM. */
function ImpactRoute() {
  const notify = useToast();
  return <ImpactDashboard onNotify={notify.info} />;
}

function SessionSplash() {
  return (
    <div className="min-h-screen w-full bg-slate-100 flex flex-col items-center justify-center gap-4 p-6 text-center">
      <span className="w-14 h-14 rounded-2xl bg-navy-900 flex items-center justify-center overflow-hidden shadow-lg">
        <img src="/icons/icon-192.png" alt="" width="46" height="46" />
      </span>
      <div>
        <div className="text-lg font-black text-navy-900 tracking-tight">RDANA</div>
        <div className="mt-1 inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
          <Loader2 size={14} className="animate-spin" />
          Restoring secure session
        </div>
      </div>
    </div>
  );
}

function AppRoutes() {
  const { checking, isAuthenticated } = useAuth();

  if (checking) {
    return <SessionSplash />;
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<IncidentList />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/agency-overview" element={<AgencyOverview />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/archive" element={<ArchivePage />} />
        <Route path="/audit-logs" element={<AuditLogs />} />
        <Route path="/data-sets" element={<DataSets />} />
        <Route path="/impact" element={<ImpactRoute />} />
        <Route path="/impact/mdrrmo" element={<ImpactMdrrmo />} />
        <Route path="/impact/omag" element={<ImpactOmag />} />
        <Route path="/impact/mho" element={<ImpactMho />} />
        <Route path="/impact/deped" element={<ImpactDeped />} />
        <Route path="/impact/mswdo" element={<ImpactMswdo />} />
        <Route path="/impact/masso" element={<ImpactMasso />} />
        <Route path="/impact/meo" element={<ImpactMeo />} />
        <Route path="/impact/mpdo" element={<ImpactMpdo />} />
        <Route path="/incident/new" element={<IncidentEditor />} />
        <Route path="/incident/:id" element={<IncidentEditor />} />
        <Route path="/incident/:id/report" element={<ReportView />} />
      </Route>
      <Route path="*" element={<IncidentList />} />
    </Routes>
  );
}

export default function App() {
  return (
    <HashRouter>
      <RoleProvider>
        <AuthProvider>
          <ToastProvider>
            <AppRoutes />
          </ToastProvider>
        </AuthProvider>
      </RoleProvider>
    </HashRouter>
  );
}
