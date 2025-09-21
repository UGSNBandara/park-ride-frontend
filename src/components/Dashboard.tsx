import React from 'react';
import './Dashboard.css';
import { AuthProvider, useAuth } from './auth/AuthContext'
import LoginModal from './auth/LoginModal'
import ProtectedDialog from './auth/ProtectedDialog'
import HomeContent from './HomeContent'
import VehicleRates from './VehicleRates'
import VehicleIn from './VehicleIn'
import VehicleOut from './VehicleOut'
import Officers from './Officers'
import IncomeDashboard from './IncomeDashboard'

// image is used inside HomeContent (public/assets/park.png)

const InnerDashboard: React.FC = () => {
  const { user, logout } = useAuth()
  const [showLogin, setShowLogin] = React.useState(false)
  const [showProtected, setShowProtected] = React.useState(false)
  const [showChangePwd, setShowChangePwd] = React.useState(false)
  const [pwdPosting, setPwdPosting] = React.useState(false)
  const [pwdError, setPwdError] = React.useState<string | null>(null)
  const [pwdSuccess, setPwdSuccess] = React.useState<string | null>(null)
  const [currentPwd, setCurrentPwd] = React.useState('')
  const [newPwd, setNewPwd] = React.useState('')
  const [view, setView] = React.useState<'home' | 'rates' | 'vehicle-in' | 'vehicle-out' | 'officers' | 'income'>('rates')

  const handleProtectedClick = (e: React.MouseEvent, target: 'vehicle-in' | 'vehicle-out') => {
    e.preventDefault()
    if (!user) {
      setShowProtected(true)
      return
    }
    // if authenticated, switch to the appropriate officer view or flow
    setView(target)
  }

  return (
    <div className="dashboard-root">
      <header className="topbar">
  <div className="brand" role="button" tabIndex={0} onClick={() => setView('home')} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setView('rates') }}>Park & Ride - Kadawatha</div>
        <nav className="nav">
          <div className="nav-left">
            <button className={`nav-btn ${view === 'rates' ? 'active' : ''}`} onClick={() => setView('rates')}>Availability</button>
            <button className={`nav-btn ${view === 'vehicle-in' ? 'active' : ''}`} onClick={(e) => handleProtectedClick(e, 'vehicle-in')}>Vehicle In</button>
            <button className={`nav-btn ${view === 'vehicle-out' ? 'active' : ''}`} onClick={(e) => handleProtectedClick(e, 'vehicle-out')}>Vehicle Out</button>
            {user && user.role === 'manager' && (
              <>
                <button className={`nav-btn ${view === 'income' ? 'active' : ''}`} onClick={() => setView('income')}>Income</button>
                <button className={`nav-btn ${view === 'officers' ? 'active' : ''}`} onClick={() => setView('officers')}>Officers</button>
              </>
            )}
          </div>
          <div className="nav-right">
            {user && user.role === 'fireofficer' && (
              <button className="nav-btn" onClick={() => setShowChangePwd(true)}>Change Password</button>
            )}
            {user ? (
              <button className="nav-btn primary" onClick={() => { logout(); setView('home') }}>Logout</button>
            ) : (
              <button className="nav-btn primary" onClick={() => setShowLogin(true)}>Login</button>
            )}
          </div>
        </nav>
      </header>

      {/* Middle content switches based on view state */}
      <main className="middle-content">
        {view === 'home' && <HomeContent />}
  {view === 'rates' && <VehicleRates />}
  {view === 'income' && <IncomeDashboard />}
        {view === 'vehicle-in' && (
          <VehicleIn />
        )}
        {view === 'vehicle-out' && (
          <VehicleOut />
        )}
        {view === 'officers' && (
          <Officers />
        )}
      </main>

  <footer className="site-footer">
        <div className="footer-actions">
          <div className="footer-item" tabIndex={0} aria-label="terms">
            Terms
            <div className="tooltip">Terms and conditions apply</div>
          </div>
          <div className="footer-item" tabIndex={0} aria-label="privacy">
            Privacy
            <div className="tooltip">We respect your privacy</div>
          </div>
          <div className="footer-item" tabIndex={0} aria-label="contact">
            Contact
            <div className="tooltip">sachinisilva@gmail.com</div>
          </div>
        </div>
        <div className="copyright">2025@Park&Ride</div>
      </footer>
      <LoginModal open={showLogin} onClose={() => setShowLogin(false)} />
      <ProtectedDialog open={showProtected} onClose={() => setShowProtected(false)} />
      {showChangePwd && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3 style={{marginTop:0}}>Change Password</h3>
            <label>Officer ID</label>
            <input className="add-input" value={(() => {
              try { const raw = localStorage.getItem('park_user'); if (!raw) return '';
                const u = JSON.parse(raw); return u?.profile?.officer_id ?? u?.profile?._id ?? u?.username ?? '' } catch { return '' }
            })()} readOnly />
            <label style={{marginTop:8}}>Current Password</label>
            <input className="add-input" type="password" value={currentPwd} onChange={e => setCurrentPwd(e.target.value)} />
            <label style={{marginTop:8}}>New Password</label>
            <input className="add-input" type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} />
            {pwdError && <div className="modal-error">{pwdError}</div>}
            {pwdSuccess && <div style={{marginTop:8,color:'#116622'}}>{pwdSuccess}</div>}
            <div style={{display:'flex',justifyContent:'flex-end',gap:8,marginTop:12}}>
              <button className="modal-secondary" onClick={() => { setShowChangePwd(false); setCurrentPwd(''); setNewPwd(''); setPwdError(null); setPwdSuccess(null) }} disabled={pwdPosting}>Cancel</button>
              <button className="modal-primary" onClick={async () => {
                setPwdError(null); setPwdSuccess(null);
                if (!currentPwd || !newPwd) { setPwdError('Please fill both passwords'); return }
                setPwdPosting(true)
                try {
                  const officerId = (() => { try { const raw = localStorage.getItem('park_user'); if (!raw) return ''; const u = JSON.parse(raw); return u?.profile?.officer_id ?? u?.profile?._id ?? u?.username ?? '' } catch { return '' } })()
                  const res = await fetch('http://localhost:3000/officer/change-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ officer_id: officerId, current_password: currentPwd, new_password: newPwd }) })
                  const body = await res.json().catch(() => ({}))
                  if (!res.ok) { setPwdError(body?.message ?? 'Failed to change password'); return }
                  // On success: show message, then force logout and present login modal for re-authentication
                  setPwdSuccess(body?.message ?? 'Password changed successfully')
                  // small delay to show success message, then logout and open login
                  setTimeout(() => {
                    try { logout(); } catch {}
                    setShowChangePwd(false)
                    setCurrentPwd(''); setNewPwd(''); setPwdError(null); setPwdSuccess(null)
                    setShowLogin(true)
                  }, 800)
                } catch (err: any) { setPwdError(err?.message ?? 'Network error') }
                finally { setPwdPosting(false) }
              }} disabled={pwdPosting}>{pwdPosting ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const Dashboard: React.FC = () => (
  <AuthProvider>
    <InnerDashboard />
  </AuthProvider>
)

export default Dashboard;