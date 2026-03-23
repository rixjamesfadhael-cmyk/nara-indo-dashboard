const EmptyState = ({
  title = "Tidak ada data",
  description = "",
  actionLabel,
  onAction,
}) => {
  return (
    <div style={{
      padding: "60px 20px",
      textAlign: "center",
      background: "var(--bg-card)",
      borderRadius: "12px",
      border: "1px solid var(--border)",
      marginTop: "20px",
    }}>
      <div style={{ fontSize: "48px", marginBottom: "16px" }}>📂</div>

      <h2 style={{ fontSize: "20px", fontWeight: "600", marginBottom: "8px", color: "var(--text)" }}>
        {title}
      </h2>

      {description && (
        <p style={{ fontSize: "14px", color: "var(--text-muted)", marginBottom: actionLabel ? "20px" : "0" }}>
          {description}
        </p>
      )}

      {actionLabel && (
        <button
          onClick={onAction}
          style={{ padding: "10px 18px", borderRadius: "8px", border: "none", backgroundColor: "#2563eb", color: "#ffffff", fontWeight: "500", cursor: "pointer" }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}

export default EmptyState