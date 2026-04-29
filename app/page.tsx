export default function Page() {
return (
<main style={styles.page}>
<h1 style={styles.title}>Mini Arcade</h1>
<p style={styles.subtitle}>Choose a game</p>

<div style={styles.cards}>
<a href="/pattern-shift" style={styles.card}>
<h2>Pattern Shift</h2>
<p>Rotate glowing tiles to solve the pattern.</p>
</a>

<a href="/reaction" style={styles.card}>
<h2>Reaction Test</h2>
<p>Tap when the screen turns green.</p>
</a>
</div>
</main>
);
}

const styles: any = {
page: {
minHeight: "100vh",
background: "radial-gradient(circle at top left, #155e75, #020617 55%)",
color: "white",
fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial",
display: "flex",
flexDirection: "column",
alignItems: "center",
justifyContent: "center",
padding: 24,
},
title: {
fontSize: 60,
margin: 0,
fontWeight: 900,
},
subtitle: {
color: "#cbd5e1",
fontSize: 20,
},
cards: {
display: "grid",
gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
gap: 20,
width: "min(720px, 100%)",
marginTop: 30,
},
card: {
textDecoration: "none",
color: "white",
padding: 26,
borderRadius: 24,
background: "rgba(15,23,42,0.78)",
border: "1px solid rgba(148,163,184,0.25)",
boxShadow: "0 30px 80px rgba(0,0,0,0.35)",
},
};