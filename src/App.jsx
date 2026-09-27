import { HashRouter, Link, Route, Routes } from 'react-router-dom';
import { useOnline } from './hooks/useOnline';
import IncidentEditor from './pages/IncidentEditor';
import IncidentList from './pages/IncidentList';
import ReportView from './pages/ReportView';

export default function App() {
  const online = useOnline();
  return (
    <HashRouter>
      <div className="app">
        <header className="appbar">
          <Link to="/" className="brand">
            <span className="brand-mark">RDANA</span>
            <span className="brand-text">
              Form 1 <small>Digital Assessment</small>
            </span>
          </Link>
          <div className="appbar-right">
            <span className={`badge ${online ? 'badge-success' : 'badge-warning'}`}>
              {online ? 'Online' : 'Offline'}
            </span>
            <span className="badge badge-info">Local-first</span>
          </div>
        </header>
        <main className="main">
          <Routes>
            <Route path="/" element={<IncidentList />} />
            <Route path="/incident/new" element={<IncidentEditor />} />
            <Route path="/incident/:id" element={<IncidentEditor />} />
            <Route path="/incident/:id/report" element={<ReportView />} />
          </Routes>
        </main>
        <footer className="footer">
          RDANA Form 1 — Rapid Damage Assessment and Needs Analysis · NEMSU Tech Innovation
        </footer>
      </div>
    </HashRouter>
  );
}