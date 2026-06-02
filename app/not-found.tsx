export default function NotFound() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-sans)", color: "var(--color-body)" }}>
      <div style={{ fontSize: "3rem", fontWeight: 700, color: "var(--color-g-400)", marginBottom: 12 }}>404</div>
      <div style={{ fontSize: "1rem", color: "var(--color-muted)" }}>Page not found.</div>
      <a href="/" style={{ marginTop: 20, fontSize: "0.875rem", color: "var(--color-g-600)" }}>Return home</a>
    </div>
  );
}
