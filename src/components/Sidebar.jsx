export default function Sidebar({ page, setPage, onLogout }) {
  return (
    <div style={wrap}>
      <div>
        <h2 style={logo}>PROJECT APP</h2>

        <MenuButton label="Dashboard" active={page === 'dashboard'} onClick={() => setPage('dashboard')} />
        <MenuButton label="Proyek" active={page === 'projects'} onClick={() => setPage('projects')} />
        <MenuButton label="Histori" active={page === 'history'} onClick={() => setPage('history')} />
      </div>

      <div style={footer}>
        <MenuButton label="Logout" danger onClick={onLogout} />
      </div>
    </div>
  )
}

function MenuButton({ label, onClick, active, danger }) {
  return (
    <button
      onClick={onClick}
      style={{
        ...btn,
        background: active ? '#1e293b' : 'transparent',
        color: danger ? '#ef4444' : '#e5e7eb',
        fontWeight: active ? 700 : 400
      }}
    >
      {label}
    </button>
  )
}

/* ===== STYLE ===== */

const wrap = {
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  padding: 20,
  boxSizing: 'border-box'
}

const logo = {
  marginBottom: 20,
  fontSize: 16,
  fontWeight: 800,
  color: '#fff'
}

const btn = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 6,
  border: 'none',
  background: 'transparent',
  textAlign: 'left',
  cursor: 'pointer',
  fontSize: 14
}

const footer = {
  marginTop: 'auto'
}
