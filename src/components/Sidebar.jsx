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
          className={page === 'dashboard' ? 'active' : ''}
          onClick={() => setPage('dashboard')}
        >
          <LayoutDashboard size={ICON_SIZE} className="icon" />
          <span>Dashboard</span>
        </button>

        <button
          className={page === 'projects' ? 'active' : ''}
          onClick={() => setPage('projects')}
        >
          <FolderKanban size={ICON_SIZE} className="icon" />
          <span>Proyek</span>
        </button>

        <button
          className={page === 'history' ? 'active' : ''}
          onClick={() => setPage('history')}
        >
          <History size={ICON_SIZE} className="icon" />
          <span>Histori</span>
        </button>

        <button
          className={page === 'archives' ? 'active' : ''}
          onClick={() => setPage('archives')}
        >
          <Archive size={ICON_SIZE} className="icon" />
          <span>Arsip</span>
        </button>
      </nav>

      <button className="logout" onClick={() => signOut(auth)}>
        <LogOut size={ICON_SIZE} className="icon" />
        <span>Logout</span>
      </button>

      <style>{`
        .sidebar {
          height: 100vh;
          width: 64px;
          background: #0f172a;
          color: #94a3b8; /* warna icon & text default */
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 12px 6px;
          transition: width 0.25s ease;
          overflow: hidden;
        }

        .sidebar:hover {
          width: 220px;
        }

        nav {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        button {
          all: unset;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px;
          border-radius: 10px;
          cursor: pointer;
          font-size: 14px;
          white-space: nowrap;
          color: inherit; /* icon ikut warna text */
        }

        .icon {
          min-width: ${ICON_SIZE}px;
          flex-shrink: 0;
        }

        button:hover {
          background: rgba(255,255,255,0.08);
          color: #ffffff;
        }

        .active {
          background: rgba(255,255,255,0.15);
          color: #ffffff;
          font-weight: 600;
        }

        button span {
          opacity: 0;
          transition: opacity 0.15s ease;
        }

        .sidebar:hover button span {
          opacity: 1;
        }

        .logout {
          color: #fca5a5;
        }

        .logout:hover {
          background: rgba(248,113,113,0.15);
          color: #ffffff;
        }
      `}</style>
    </aside>
  )
}
