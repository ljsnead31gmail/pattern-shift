"use client";

import React from "react";

export default function Page() {
return (
<main style={styles.page}>
<div style={styles.backgroundGlowOne} />
<div style={styles.backgroundGlowTwo} />

<section style={styles.hero}>
<div style={styles.badge}>Mini Arcade</div>

<h1 style={styles.title}>Choose Your Game</h1>

<p style={styles.subtitle}>
Fast, polished browser games built for desktop and mobile.
</p>

<div style={styles.grid}>
<GameCard
href="/pattern-shift"
icon={<PuzzleIcon />}
title="Pattern Shift"
description="Rotate glowing tiles and solve the hidden path."
tag="Puzzle"
/>

<GameCard
href="/reaction"
icon={<LightningIcon />}
title="Reaction Test"
description="Tap when the screen turns green. Beat your best time."
tag="Speed"
/>

<GameCard
href="/reaction-upgrade"
icon={<TargetIcon />}
title="Center Strike"
description="Hit moving balls as they cross the center line."
tag="Precision"
/>
</div>
</section>
</main>
);
}

function GameCard({
href,
icon,
title,
description,
tag,
}: {
href: string;
icon: React.ReactNode;
title: string;
description: string;
tag: string;
}) {
return (
<a
href={href}
style={styles.card}
onMouseEnter={(e) => {
e.currentTarget.style.transform = "translateY(-8px) scale(1.03)";
e.currentTarget.style.boxShadow =
"0 35px 90px rgba(0,0,0,0.55), 0 0 45px rgba(34,211,238,0.28)";
e.currentTarget.style.border = "1px solid rgba(34,211,238,0.55)";
}}
onMouseLeave={(e) => {
e.currentTarget.style.transform = "translateY(0) scale(1)";
e.currentTarget.style.boxShadow = "0 25px 70px rgba(0,0,0,0.42)";
e.currentTarget.style.border = "1px solid rgba(148,163,184,0.25)";
}}
>
<div style={styles.cardTop}>
<div style={styles.iconBox}>{icon}</div>
<span style={styles.tag}>{tag}</span>
</div>

<h2 style={styles.cardTitle}>{title}</h2>
<p style={styles.cardText}>{description}</p>

<div style={styles.playRow}>
<span>Play now</span>
<span style={styles.arrow}>→</span>
</div>
</a>
);
}

function PuzzleIcon() {
return (
<svg width="54" height="54" viewBox="0 0 54 54" style={styles.svgIcon}>
<rect
x="5"
y="5"
width="44"
height="44"
rx="14"
fill="rgba(15,23,42,0.95)"
stroke="#22d3ee"
strokeWidth="2.5"
/>

<path
d="
M18 17
H25
C25 13.8 29 13.8 29 17
H36
V24
C39.2 24 39.2 30 36 30
V37
H29
C29 40.2 25 40.2 25 37
H18
V30
C14.8 30 14.8 24 18 24
Z
"
fill="#22d3ee"
/>

<path
d="
M18 17
H25
C25 13.8 29 13.8 29 17
H36
V24
C39.2 24 39.2 30 36 30
V37
H29
C29 40.2 25 40.2 25 37
H18
V30
C14.8 30 14.8 24 18 24
Z
"
fill="none"
stroke="#a5f3fc"
strokeWidth="2"
strokeLinejoin="round"
/>
</svg>
);
}

function LightningIcon() {
return (
<svg width="54" height="54" viewBox="0 0 54 54" style={styles.svgIcon}>
<rect
x="5"
y="5"
width="44"
height="44"
rx="14"
fill="rgba(15,23,42,0.95)"
stroke="#22d3ee"
strokeWidth="2.5"
/>
<path
d="M31 8L16 31h11l-4 15 16-27H28z"
fill="#22d3ee"
/>
<path
d="M31 8L16 31h11"
fill="none"
stroke="#a5f3fc"
strokeWidth="2"
strokeLinecap="round"
/>
</svg>
);
}

function TargetIcon() {
return (
<svg width="54" height="54" viewBox="0 0 54 54" style={styles.svgIcon}>
<rect
x="5"
y="5"
width="44"
height="44"
rx="14"
fill="rgba(15,23,42,0.95)"
stroke="#22d3ee"
strokeWidth="2.5"
/>
<circle
cx="27"
cy="27"
r="14"
fill="none"
stroke="#22d3ee"
strokeWidth="3"
/>
<circle
cx="27"
cy="27"
r="7"
fill="none"
stroke="#67e8f9"
strokeWidth="3"
/>
<circle cx="27" cy="27" r="3.5" fill="white" />
<line
x1="27"
y1="10"
x2="27"
y2="17"
stroke="#a5f3fc"
strokeWidth="2"
strokeLinecap="round"
/>
<line
x1="27"
y1="37"
x2="27"
y2="44"
stroke="#a5f3fc"
strokeWidth="2"
strokeLinecap="round"
/>
<line
x1="10"
y1="27"
x2="17"
y2="27"
stroke="#a5f3fc"
strokeWidth="2"
strokeLinecap="round"
/>
<line
x1="37"
y1="27"
x2="44"
y2="27"
stroke="#a5f3fc"
strokeWidth="2"
strokeLinecap="round"
/>
</svg>
);
}

const styles: Record<string, React.CSSProperties> = {
page: {
minHeight: "100vh",
position: "relative",
overflow: "hidden",
background:
"radial-gradient(circle at top left, #155e75 0%, #020617 45%, #020617 100%)",
color: "white",
fontFamily:
"-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif",
display: "flex",
alignItems: "center",
justifyContent: "center",
padding: "clamp(20px, 5vw, 60px)",
},

backgroundGlowOne: {
position: "absolute",
width: 420,
height: 420,
borderRadius: "50%",
background: "rgba(34,211,238,0.18)",
filter: "blur(70px)",
top: -120,
left: -120,
},

backgroundGlowTwo: {
position: "absolute",
width: 360,
height: 360,
borderRadius: "50%",
background: "rgba(16,185,129,0.14)",
filter: "blur(80px)",
bottom: -120,
right: -100,
},

hero: {
width: "min(1080px, 100%)",
position: "relative",
zIndex: 2,
textAlign: "center",
},

badge: {
display: "inline-flex",
padding: "10px 16px",
borderRadius: 999,
background: "rgba(15,23,42,0.7)",
border: "1px solid rgba(34,211,238,0.32)",
color: "#a5f3fc",
fontWeight: 800,
boxShadow: "0 0 25px rgba(34,211,238,0.22)",
marginBottom: 18,
},

title: {
fontSize: "clamp(44px, 8vw, 82px)",
lineHeight: 0.95,
margin: 0,
fontWeight: 950,
letterSpacing: "-3px",
textShadow: "0 0 35px rgba(34,211,238,0.35)",
},

subtitle: {
color: "#cbd5e1",
fontSize: "clamp(16px, 3vw, 22px)",
maxWidth: 620,
margin: "22px auto 34px",
lineHeight: 1.5,
},

grid: {
display: "grid",
gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
gap: 22,
width: "100%",
},

card: {
textDecoration: "none",
color: "white",
textAlign: "left",
padding: 28,
borderRadius: 30,
background:
"linear-gradient(145deg, rgba(15,23,42,0.88), rgba(30,41,59,0.72))",
border: "1px solid rgba(148,163,184,0.25)",
boxShadow: "0 25px 70px rgba(0,0,0,0.42)",
backdropFilter: "blur(16px)",
transition:
"transform 180ms ease, box-shadow 180ms ease, border 180ms ease",
WebkitTapHighlightColor: "transparent",
},

cardTop: {
display: "flex",
alignItems: "center",
justifyContent: "space-between",
gap: 12,
marginBottom: 22,
},

iconBox: {
width: 72,
height: 72,
borderRadius: 24,
display: "grid",
placeItems: "center",
background: "rgba(34,211,238,0.09)",
border: "1px solid rgba(34,211,238,0.22)",
boxShadow: "0 0 30px rgba(34,211,238,0.18)",
},

svgIcon: {
filter: "drop-shadow(0 0 10px rgba(34,211,238,0.65))",
},

tag: {
padding: "8px 12px",
borderRadius: 999,
background: "rgba(255,255,255,0.08)",
color: "#cbd5e1",
fontSize: 13,
fontWeight: 800,
},

cardTitle: {
fontSize: 30,
margin: "0 0 10px",
letterSpacing: "-1px",
},

cardText: {
color: "#cbd5e1",
fontSize: 16,
lineHeight: 1.5,
margin: "0 0 24px",
},

playRow: {
display: "flex",
alignItems: "center",
justifyContent: "space-between",
color: "#67e8f9",
fontWeight: 900,
},

arrow: {
fontSize: 28,
},
};