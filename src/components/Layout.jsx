export default function Layout({ sidebar, header, children }) {
  return (
    <>
      {sidebar}

      <div className="main-content">
        <div style={headerWrap}>{header}</div>
        <div style={content}>{children}</div>
      </div>
    </>
  )
}

const headerWrap = {
  background: '#ffffff',
  borderBottom: '1px solid #e5e7eb',
  padding: '12px 20px',
}

const content = {
  flex: 1,
  padding: 24,
}