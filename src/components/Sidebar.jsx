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
  { key: 'projects', label: 'Proyek',     icon: FolderKanban },
  { key: 'history',  label: 'Histori',   icon: History },
  { key: 'archives', label: 'Arsip',     icon: Archive },
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

  return (
    <>
      {/* ── Inline styles ── */}
      <style>{`
        .sidebar {
          --sb-collapsed: 56px;
          --sb-expanded: 220px;
          --sb-bg-top: #1a2332;
          --sb-bg-bot: #151c28;
          --sb-accent: #3b82f6;
          --sb-text-muted: #94a3b8;
          --sb-text-active: #f1f5f9;
          --sb-hover-bg: rgba(255,255,255,0.06);
          --sb-active-bg: rgba(59,130,246,0.20);
          --sb-border: rgba(255,255,255,0.06);
          --sb-transition: 0.22s ease;

          width: var(--sb-collapsed);
          flex-shrink: 0;
          background: linear-gradient(180deg, var(--sb-bg-top) 0%, var(--sb-bg-bot) 100%);
          border-right: 1px solid var(--sb-border);
          display: flex;
          flex-direction: column;
          transition: width var(--sb-transition), box-shadow var(--sb-transition);
          overflow: hidden;
          z-index: 200;
          min-height: 100vh;
        }

        .sidebar:hover,
        .sidebar.pinned {
          width: var(--sb-expanded);
          box-shadow: 8px 0 32px rgba(0,0,0,0.22);
        }

        /* Brand */
        .sb-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px 10px;
          border-bottom: 1px solid var(--sb-border);
          min-height: 56px;
          white-space: nowrap;
        }

        .sb-brand-mark {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 700;
          color: #fff;
          flex-shrink: 0;
          letter-spacing: -0.5px;
        }

        .sb-brand-text {
          font-size: 15px;
          font-weight: 700;
          color: #e2e8f0;
          max-width: 0;
          overflow: hidden;
          opacity: 0;
          transition: max-width var(--sb-transition), opacity 0.18s ease;
        }

        .sidebar:hover .sb-brand-text,
        .sidebar.pinned .sb-brand-text {
          max-width: 160px;
          opacity: 1;
        }

        /* Nav */
        .sb-nav {
          flex: 1;
          padding: 10px 8px;
          display: flex;
          flex-direction: column;
          gap: 2px;
          list-style: none;
          margin: 0;
        }

        .sb-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 10px;
          border-radius: 10px;
          color: var(--sb-text-muted);
          background: none;
          border: none;
          cursor: pointer;
          width: 100%;
          text-align: left;
          font-family: inherit;
          font-size: 14px;
          transition: background 0.15s, color 0.15s;
          white-space: nowrap;
        }

        .sb-item:hover {
          background: var(--sb-hover-bg);
          color: var(--sb-text-active);
        }

        .sb-item.active {
          background: var(--sb-active-bg);
          color: var(--sb-text-active);
        }

        .sb-item svg {
          flex-shrink: 0;
          width: 32px;
          display: flex;
          justify-content: center;
        }

        .sb-label {
          max-width: 0;
          overflow: hidden;
          opacity: 0;
          pointer-events: none;
          transition: max-width var(--sb-transition), opacity 0.18s ease;
        }

        .sidebar:hover .sb-label,
        .sidebar.pinned .sb-label {
          max-width: 160px;
          opacity: 1;
          pointer-events: auto;
        }

        /* Footer */
        .sb-footer {
          padding: 10px 8px 14px;
          border-top: 1px solid var(--sb-border);
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .sb-item.pin {
          font-size: 12px;
          color: #64748b;
        }

        .sb-item.pin:hover {
          color: #94a3b8;
        }

        .sb-item.logout {
          color: #f87171;
        }

        .sb-item.logout:hover {
          background: rgba(248,113,113,0.12);
          color: #fca5a5;
        }
      `}</style>

      <aside className={`sidebar${pinned ? ' pinned' : ''}`}>
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
            {pinned
              ? <PinOff size={ICON_SIZE} />
              : <Pin size={ICON_SIZE} />
            }
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
    </>
  )
}