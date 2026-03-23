import { useState, useEffect } from 'react'
import {
  LayoutDashboard,
  FolderKanban,
  History,
  Archive,
  LogOut,
  Pin,
  PinOff
} from 'lucide-react'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase'

const ICON_SIZE = 18

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'projects',  label: 'Proyek',    icon: FolderKanban },
  { key: 'history',   label: 'Histori',   icon: History },
  { key: 'archives',  label: 'Arsip',     icon: Archive },
]

export default function Sidebar({ page, setPage }) {
  const [pinned, setPinned] = useState(() => {
    try { return localStorage.getItem('proflow_sidebar_pinned') === '1' } catch { return false }
  })

  useEffect(() => {
    try { localStorage.setItem('proflow_sidebar_pinned', pinned ? '1' : '0') } catch {}
    if (pinned) {
      document.body.classList.add('sidebar-pinned')
    } else {
      document.body.classList.remove('sidebar-pinned')
    }
  }, [pinned])

  const handleMouseEnter = () => {
    document.body.classList.add('sidebar-expanded')
  }

  const handleMouseLeave = () => {
    document.body.classList.remove('sidebar-expanded')
  }

  return (
    <aside
      className={`sidebar${pinned ? ' pinned' : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Brand */}
      <div className="sb-brand">
        <div className="sb-brand-mark">NI</div>
        <span className="sb-brand-text">Nara Indo</span>
      </div>

      {/* Nav */}
      <ul className="sb-nav">
        {NAV_ITEMS.map(({ key, label, icon: Icon }) => (
          <li key={key}>
            <button
              className={`sb-item${page === key ? ' active' : ''}`}
              onClick={() => setPage(key)}
              title={label}
            >
              <Icon size={ICON_SIZE} />
              <span className="sb-label">{label}</span>
            </button>
          </li>
        ))}
      </ul>

      {/* Footer */}
      <div className="sb-footer">
        <button
          className="sb-item pin"
          onClick={() => setPinned(p => !p)}
          title={pinned ? 'Lepas sematan' : 'Sematkan menu'}
        >
          {pinned ? <PinOff size={ICON_SIZE} /> : <Pin size={ICON_SIZE} />}
          <span className="sb-label">{pinned ? 'Lepas sematan' : 'Sematkan menu'}</span>
        </button>

        <button
          className="sb-item logout"
          onClick={() => signOut(auth)}
          title="Logout"
        >
          <LogOut size={ICON_SIZE} />
          <span className="sb-label">Logout</span>
        </button>
      </div>
    </aside>
  )
}