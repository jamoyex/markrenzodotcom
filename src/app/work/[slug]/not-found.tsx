export default function ProjectNotFound() {
  return (
    <main style={{ padding: "12vh 8vw", maxWidth: 900 }}>
      <p style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>
        A LITTLE DETOUR
      </p>
      <h1
        style={{
          fontSize: "clamp(48px, 8vw, 100px)",
          lineHeight: 1.05,
          margin: "24px 0",
        }}
      >
        That project isn’t here.
      </h1>
      <p style={{ lineHeight: 1.7 }}>
        Let’s take you back to the things I’ve been making.
      </p>
      <a
        href="/#work"
        style={{
          display: "inline-block",
          borderBottom: "1px solid",
          padding: "12px 0",
          marginTop: 24,
        }}
      >
        Explore my work ↗
      </a>
    </main>
  );
}
