import React from 'react'

type Officer = { officer_id?: string; _id?: string; id?: string; name: string; email: string; phone?: string }

const Officers: React.FC = () => {
  const [officers, setOfficers] = React.useState<Officer[]>([])
  const [loading, setLoading] = React.useState(false)
  const [showAdd, setShowAdd] = React.useState(false)
  const [name, setName] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [error, setError] = React.useState<string | null>(null)
  const [successId, setSuccessId] = React.useState<string | null>(null)

  const fetchOfficers = async () => {
    setLoading(true)
    try {
      const res = await fetch('http://localhost:3000/admin/officers')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setOfficers(data || [])
    } catch (err) {
      // keep empty
    } finally { setLoading(false) }
  }

  React.useEffect(() => { fetchOfficers() }, [])

  const [officerId, setOfficerId] = React.useState('')
  const [phone, setPhone] = React.useState('')

  const submitAdd = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setError(null)
    if (!officerId || !name || !email) { setError('Officer ID, name and email are required'); return }
    try {
      const payload: any = { officer_id: officerId, name, phone, email }
      if (password) payload.password = password
      const res = await fetch('http://localhost:3000/admin/add-officer', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify(payload)
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError(body.message || 'Failed to add officer')
        return
      }
      const data = await res.json()
      // expect { id: 'OFF123', ... }
      const newId = data.officer_id ?? data.id ?? data._id ?? (data.officer && (data.officer.officer_id ?? data.officer.id)) ?? null
  setSuccessId(newId)
  setShowAdd(false)
  setName(''); setEmail(''); setPassword('')
      setOfficerId(''); setPhone('')
      fetchOfficers()
    } catch (err) { setError('Network error') }
  }

  return (
    <div className="rates-root">
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <h3 className="rates-title">Officers</h3>
        <div>
          <button className="modal-primary" onClick={() => setShowAdd(true)}>Add Officer</button>
        </div>
      </div>

      {loading ? <div>Loading...</div> : (
        <div style={{marginTop:12}}>
          {officers.length === 0 ? (
            <div className="vehicle-empty">No officers found</div>
          ) : (
            <>
              <div className="list-header">
                <div style={{width:140}}>Officer ID</div>
                <div style={{flex:1}}>Name</div>
                <div style={{flex:1}}>Email</div>
                <div style={{width:120,textAlign:'center'}}>Phone</div>
              </div>

              <div className="vehicle-list">
                {officers.map(o => {
                  const key = o.officer_id ?? o._id ?? o.id ?? o.email
                  const displayId = o.officer_id ?? o._id ?? o.id ?? '—'
                  return (
                    <div key={key} className="vehicle-row">
                      <div style={{width:140}}>{displayId}</div>
                      <div style={{flex:1,textAlign:'left'}}>{o.name}</div>
                      <div style={{flex:1,textAlign:'left'}}>{o.email}</div>
                      <div style={{width:120,textAlign:'center'}}>{o.phone ?? '—'}</div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      )}

      {showAdd && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>Add Officer</h3>
            <form onSubmit={submitAdd} className="modal-form">
              <label>
                Officer ID
                <input className="add-input" value={officerId} onChange={e => setOfficerId(e.target.value)} />
              </label>
              <label>
                Name
                <input className="add-input" value={name} onChange={e => setName(e.target.value)} />
              </label>
              <label>
                Phone
                <input className="add-input" value={phone} onChange={e => setPhone(e.target.value)} />
              </label>
              <label>
                Email
                <input className="add-input" value={email} onChange={e => setEmail(e.target.value)} />
              </label>
              <label>
                Password (optional)
                <input className="add-input" type="password" value={password} onChange={e => setPassword(e.target.value)} />
              </label>
              {error && <div className="modal-error">{error}</div>}
              <div style={{display:'flex',justifyContent:'flex-end',gap:8,marginTop:8}}>
                <button type="button" className="modal-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
                <button type="submit" className="modal-primary">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {successId && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>Officer Created</h3>
            <p>Officer created successfully. ID: <strong>{successId}</strong></p>
            <div style={{display:'flex',justifyContent:'flex-end'}}>
              <button className="modal-primary" onClick={() => setSuccessId(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Officers
