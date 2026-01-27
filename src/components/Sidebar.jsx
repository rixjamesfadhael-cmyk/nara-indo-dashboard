import {
  LayoutDashboard,
  FolderKanban,
  History,
  Archive,
  LogOut
} from 'lucide-react'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase'

const ICON_SIZE = 18

export default function Sidebar({ page, setPage }) {
  return (
    <aside className="sidebar">
      <nav>
        <button
          className={`item ${page === 'dashboard' ? 'active' : ''}`}
          onClick={() => setPage('dashboard')}
        >
          <LayoutDashboard size={ICON_SIZE} />
          <span>Dashboard</span>
        </button>

        <button
          className={`item ${page === 'projects' ? 'active' : ''}`}
          onClick={() => setPage('projects')}
        >
          <FolderKanban size={ICON_SIZE} />
          <span>Proyek</span>
        </button>

        <button
          className={`item ${page === 'history' ? 'active' : ''}`}
          onClick={() => setPage('history')}
        >
          <History size={ICON_SIZE} />
          <span>Histori</span>
        </button>

        <button
          className={`item ${page === 'archives' ? 'active' : ''}`}
          onClick={() => setPage('archives')}
        >
          <Archive size={ICON_SIZE} />
          <span>Arsip</span>
        </button>
      </nav>

      <button className="item logout" onClick={() => signOut(auth)}>
        <LogOut size={ICON_SIZE} />
        <span>Logout</span>
      </button>
    </aside>
  )
}
