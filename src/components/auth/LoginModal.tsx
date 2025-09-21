import React, {useState} from 'react'
import {useAuth} from './AuthContext'

const LoginModal: React.FC<{open: boolean; onClose: () => void}> = ({open, onClose}) => {
  const {login} = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'manager'|'fireofficer'>('fireofficer')
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const res = await login(username.trim(), password, role)
    if (!res.success) setError(res.message || 'Invalid credentials')
    else onClose()
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal>
      <div className="modal" style={{minWidth:420, maxWidth:680, padding:'1.25rem 1.5rem'}}>
        <h2>Officer Login</h2>
        <form onSubmit={submit} className="modal-form">
          <label>
            {role === 'manager' ? 'Admin ID' : 'Username'}
            <div style={{display:'flex',gap:8,alignItems:'center'}}>
              <input value={username} onChange={e => setUsername(e.target.value)} />
            </div>
          </label>
          <label>
            Password
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} />
          </label>

          <div style={{marginTop:8, marginBottom:6}}>
            <div style={{fontSize:12,fontWeight:700,color:'#234',marginBottom:6}}>Role</div>
            <div style={{display:'flex',gap:8}}>
              <button type="button" className={`cat-btn ${role === 'manager' ? 'active' : ''}`} onClick={() => setRole('manager')}>Manager</button>
              <button type="button" className={`cat-btn ${role === 'fireofficer' ? 'active' : ''}`} onClick={() => setRole('fireofficer')}>FireOfficer</button>
            </div>
          </div>

          {error && <div className="modal-error">{error}</div>}
          <div className="modal-actions">
            <button type="button" onClick={onClose} className="modal-secondary">Cancel</button>
            <button type="submit" className="modal-primary">Login</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default LoginModal
