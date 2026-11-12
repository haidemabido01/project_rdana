import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  Check,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  LogIn,
  UserRound
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ROLE_LEVELS, ROLES } from '../lib/roles';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!username.trim()) {
      setError('Enter your username to continue.');
      return;
    }
    if (!password) {
      setError('Enter your password to continue.');
      return;
    }

    setBusy(true);
    const result = await login(username.trim(), password, remember);

    if (!result.ok) {
      setBusy(false);
      setError(result.error);
      return;
    }

    const role = ROLES[result.account.roleId];
    navigate(role?.level === ROLE_LEVELS.AGENCY ? '/agency-overview' : '/dashboard', {
      replace: true
    });
  };

  return (
    <div
      className="min-h-screen w-full relative flex items-center justify-center font-sans overflow-hidden"
      data-shell="ardana"
      data-tailwind
    >
      {/* Background photo, centered in the viewport */}
      <img
        src="/tagbina-bg.jpg"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover object-center"
        style={{ objectPosition: 'center center' }}
      />
      {/* Dark gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(135deg, rgba(10,31,68,0.84) 0%, rgba(10,31,68,0.58) 50%, rgba(249,115,22,0.32) 100%)'
        }}
      />

      {/* Subtle noise texture */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")"
        }}
      />

      {/* Glassmorphism login card */}
      <div
        className="relative z-10 w-full max-w-md mx-4 sm:mx-auto rounded-3xl overflow-hidden"
        style={{
          background: 'rgba(255,255,255,0.09)',
          backdropFilter: 'blur(28px) saturate(180%)',
          WebkitBackdropFilter: 'blur(28px) saturate(180%)',
          border: '1px solid rgba(255,255,255,0.22)',
          boxShadow:
            '0 8px 40px rgba(10,31,68,0.50), inset 0 1px 0 rgba(255,255,255,0.18)'
        }}
      >
        <div className="p-8 sm:p-10">
          {/* Logo */}
          <div className="flex justify-center mb-7">
            <img
              src="/icons/icon-192.png"
              alt="RDANA logo"
              width="104"
              height="104"
              className="w-24 h-24 sm:w-28 sm:h-28 object-contain drop-shadow-[0_10px_30px_rgba(0,0,0,0.45)]"
            />
          </div>

          {/* Heading */}
          <div className="mb-7 text-center">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight">
              Welcome to RDANA
            </h1>
            <p className="mt-2 text-sm font-medium" style={{ color: 'rgba(255,255,255,0.72)' }}>
              Municipality of Tagbina · Surigao del Sur
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Username */}
            <div>
              <label
                htmlFor="username"
                className="block text-xs font-bold mb-1.5"
                style={{ color: 'rgba(255,255,255,0.75)' }}
              >
                Username
              </label>
              <div className="relative">
                <UserRound
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: 'rgba(255,255,255,0.45)' }}
                />
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  placeholder="e.g. crissalen.danao"
                  className="login-input w-full text-sm pl-10 pr-3 py-3 rounded-xl text-white placeholder:text-white/60 focus:outline-none transition-all"
                  style={{
                    background: 'rgba(10,31,68,0.35)',
                    border: '1px solid rgba(255,255,255,0.20)'
                  }}
                  onFocus={(e) => {
                    e.target.style.border = '1px solid rgba(249,115,22,0.85)';
                    e.target.style.background = 'rgba(10,31,68,0.50)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.18)';
                  }}
                  onBlur={(e) => {
                    e.target.style.border = '1px solid rgba(255,255,255,0.20)';
                    e.target.style.background = 'rgba(10,31,68,0.35)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-bold mb-1.5"
                style={{ color: 'rgba(255,255,255,0.75)' }}
              >
                Password
              </label>
              <div className="relative">
                <Lock
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: 'rgba(255,255,255,0.45)' }}
                />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  className="login-input w-full text-sm pl-10 pr-11 py-3 rounded-xl text-white placeholder:text-white/60 focus:outline-none transition-all"
                  style={{
                    background: 'rgba(10,31,68,0.35)',
                    border: '1px solid rgba(255,255,255,0.20)'
                  }}
                  onFocus={(e) => {
                    e.target.style.border = '1px solid rgba(249,115,22,0.85)';
                    e.target.style.background = 'rgba(10,31,68,0.50)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.18)';
                  }}
                  onBlur={(e) => {
                    e.target.style.border = '1px solid rgba(255,255,255,0.20)';
                    e.target.style.background = 'rgba(10,31,68,0.35)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors"
                  style={{ color: 'rgba(255,255,255,0.45)' }}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <div className="flex items-center justify-between gap-3">
              <label
                className="group flex items-center gap-2.5 text-xs font-medium cursor-pointer select-none"
                style={{ color: 'rgba(255,255,255,0.72)' }}
              >
                <span className="relative flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="peer sr-only"
                  />
                  <span
                    aria-hidden="true"
                    className="w-[18px] h-[18px] rounded-md flex items-center justify-center transition-all peer-focus-visible:ring-2 peer-focus-visible:ring-orange-400/70"
                    style={{
                      background: remember
                        ? 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)'
                        : 'rgba(255,255,255,0.10)',
                      border: remember
                        ? '1px solid rgba(249,115,22,0.85)'
                        : '1px solid rgba(255,255,255,0.28)',
                      boxShadow: remember ? '0 2px 10px rgba(249,115,22,0.45)' : 'none'
                    }}
                  >
                    <Check
                      size={12}
                      strokeWidth={3.5}
                      className="transition-opacity"
                      style={{ color: '#fff', opacity: remember ? 1 : 0 }}
                    />
                  </span>
                </span>
                <span>Keep me signed in</span>
              </label>
            </div>

            {/* Error */}
            {error && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-xl px-3 py-2.5 text-xs"
                style={{
                  background: 'rgba(239,68,68,0.16)',
                  border: '1px solid rgba(239,68,68,0.38)',
                  color: '#fca5a5'
                }}
              >
                <AlertCircle size={14} className="flex-none mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={busy}
              id="login-submit"
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-white text-sm font-bold transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                boxShadow: '0 4px 20px rgba(249,115,22,0.42)'
              }}
              onMouseEnter={(e) => {
                if (!busy)
                  e.currentTarget.style.boxShadow = '0 6px 28px rgba(249,115,22,0.62)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(249,115,22,0.42)';
              }}
            >
              {busy ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Signing in…</span>
                </>
              ) : (
                <>
                  <LogIn size={16} />
                  <span>Sign in to RDANA</span>
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <p
            className="mt-6 text-center text-[10px] leading-relaxed"
            style={{ color: 'rgba(255,255,255,0.33)' }}
          >
            NEMSU Tech Innovation · Municipality of Tagbina, Surigao del Sur
            <br />
            Contact MDRRMO Command Center for account issues.
          </p>
        </div>
      </div>
    </div>
  );
}
