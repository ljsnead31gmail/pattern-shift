"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Dot = {
id: number;
y: number;
size: number;
speed: number;
delay: number;
color: string;
};

type GameState = "ready" | "playing" | "complete" | "failed";

const TOTAL_LEVELS = 45;
const CENTER_TOLERANCE = 34;

function levelSettings(level: number) {
const dotCount = Math.min(1 + Math.floor((level - 1) / 5), 10);
const speed = 2.2 + level * 0.18;
const targetHits = Math.min(3 + Math.floor(level / 3), 18);

return { dotCount, speed, targetHits };
}

function makeDots(level: number): Dot[] {
const { dotCount, speed } = levelSettings(level);
const colors = ["#22d3ee", "#a78bfa", "#34d399", "#facc15", "#fb7185"];

return Array.from({ length: dotCount }, (_, i) => ({
id: i,
y: 18 + ((i * 67 + level * 13) % 68),
size: Math.max(18, 34 - Math.floor(level / 5)),
speed: speed + i * 0.25,
delay: i * 500,
color: colors[(i + level) % colors.length],
}));
}

export default function Page() {
const [level, setLevel] = useState(1);
const [state, setState] = useState<GameState>("ready");
const [hits, setHits] = useState(0);
const [misses, setMisses] = useState(0);
const [message, setMessage] = useState("Tap Start");
const [positions, setPositions] = useState<Record<number, number>>({});

const areaRef = useRef<HTMLDivElement | null>(null);
const frameRef = useRef<number | null>(null);
const startTimeRef = useRef<number>(0);

const dots = useMemo(() => makeDots(level), [level]);
const settings = levelSettings(level);

useEffect(() => {
const saved = localStorage.getItem("reactionUpgradeLevel");
if (saved) setLevel(Math.min(Number(saved), TOTAL_LEVELS));
}, []);

useEffect(() => {
if (state !== "playing") return;

startTimeRef.current = performance.now();

function animate(now: number) {
const width = areaRef.current?.clientWidth ?? 800;
const nextPositions: Record<number, number> = {};

dots.forEach((dot) => {
const elapsed = Math.max(0, now - startTimeRef.current - dot.delay);
const cycle = width + dot.size * 2;
const x = ((elapsed * dot.speed * 0.06) % cycle) - dot.size;
nextPositions[dot.id] = x;
});

setPositions(nextPositions);
frameRef.current = requestAnimationFrame(animate);
}

frameRef.current = requestAnimationFrame(animate);

return () => {
if (frameRef.current) cancelAnimationFrame(frameRef.current);
};
}, [state, dots]);

function startGame() {
setHits(0);
setMisses(0);
setMessage("Hit the dot when it crosses the center line");
setState("playing");
}

function resetLevel() {
setHits(0);
setMisses(0);
setMessage("Tap Start");
setState("ready");
}

function nextLevel() {
const next = Math.min(level + 1, TOTAL_LEVELS);
setLevel(next);
localStorage.setItem("reactionUpgradeLevel", String(next));
setHits(0);
setMisses(0);
setMessage("Tap Start");
setState("ready");
}

function restartGame() {
setLevel(1);
localStorage.setItem("reactionUpgradeLevel", "1");
resetLevel();
}

function tapDot(dot: Dot) {
if (state !== "playing") return;

const areaWidth = areaRef.current?.clientWidth ?? 800;
const center = areaWidth / 2;
const dotCenter = (positions[dot.id] ?? -999) + dot.size / 2;
const distance = Math.abs(dotCenter - center);

if (distance <= CENTER_TOLERANCE) {
const newHits = hits + 1;
setHits(newHits);
setMessage("Perfect hit!");

if (navigator.vibrate) navigator.vibrate(35);

if (newHits >= settings.targetHits) {
setState("complete");
setMessage("Level complete!");
}
} else {
const newMisses = misses + 1;
setMisses(newMisses);
setMessage("Missed center!");

if (navigator.vibrate) navigator.vibrate(80);

if (newMisses >= 3) {
setState("failed");
setMessage("Level failed — try again");
}
}
}

return (
<main style={styles.page}>
<section style={styles.card}>
<a href="/" style={styles.back}>← Arcade</a>

<div style={styles.header}>
<div>
<h1 style={styles.title}>Center Strike</h1>
<p style={styles.subtitle}>
Tap each moving dot as it crosses the center line.
</p>
</div>

<div style={styles.levelBadge}>Level {level}/{TOTAL_LEVELS}</div>
</div>

<div ref={areaRef} style={styles.playArea}>
<div style={styles.centerLine} />

{dots.map((dot) => (
<button
key={dot.id}
onClick={(e) => {
e.stopPropagation();
tapDot(dot);
}}
style={{
...styles.dot,
top: `${dot.y}%`,
width: dot.size,
height: dot.size,
background: dot.color,
boxShadow: `0 0 22px ${dot.color}`,
transform: `translateX(${positions[dot.id] ?? -60}px)`,
}}
aria-label="Tap moving dot"
/>
))}
</div>

<div style={styles.status}>{message}</div>

<div style={styles.stats}>
<div style={styles.statBox}>
<strong>{hits}</strong>
<span>Hits</span>
</div>
<div style={styles.statBox}>
<strong>{settings.targetHits}</strong>
<span>Goal</span>
</div>
<div style={styles.statBox}>
<strong>{misses}/3</strong>
<span>Misses</span>
</div>
<div style={styles.statBox}>
<strong>{dots.length}</strong>
<span>Dots</span>
</div>
</div>

{state === "ready" && (
<button onClick={startGame} style={styles.primary}>
Start Level
</button>
)}

{state === "playing" && (
<button onClick={resetLevel} style={styles.secondary}>
Reset Level
</button>
)}

{state === "complete" && (
<button onClick={nextLevel} style={styles.primary}>
Next Level
</button>
)}

{state === "failed" && (
<button onClick={resetLevel} style={styles.primary}>
Try Again
</button>
)}

<button onClick={restartGame} style={styles.danger}>
Restart From Level 1
</button>
</section>
</main>
);
}

const styles: Record<string, React.CSSProperties> = {
page: {
minHeight: "100vh",
padding: "clamp(16px, 4vw, 48px)",
background:
"radial-gradient(circle at top left, #155e75 0%, #020617 48%, #020617 100%)",
color: "white",
fontFamily:
"-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif",
display: "flex",
justifyContent: "center",
alignItems: "center",
},

card: {
width: "min(920px, 100%)",
padding: "clamp(18px, 4vw, 34px)",
borderRadius: 32,
background: "rgba(15,23,42,0.78)",
border: "1px solid rgba(148,163,184,0.25)",
boxShadow: "0 30px 90px rgba(0,0,0,0.55)",
backdropFilter: "blur(16px)",
},

back: {
color: "#67e8f9",
textDecoration: "none",
fontWeight: 800,
},

header: {
marginTop: 18,
display: "flex",
justifyContent: "space-between",
gap: 18,
alignItems: "flex-start",
flexWrap: "wrap",
},

title: {
fontSize: "clamp(42px, 8vw, 76px)",
margin: 0,
fontWeight: 950,
letterSpacing: "-3px",
textShadow: "0 0 28px rgba(34,211,238,0.35)",
},

subtitle: {
color: "#cbd5e1",
fontSize: "clamp(15px, 3vw, 19px)",
marginTop: 8,
},

levelBadge: {
padding: "12px 18px",
borderRadius: 999,
background: "rgba(34,211,238,0.14)",
border: "1px solid rgba(34,211,238,0.35)",
color: "#a5f3fc",
fontWeight: 900,
},

playArea: {
marginTop: 28,
height: "clamp(300px, 55vh, 500px)",
position: "relative",
overflow: "hidden",
borderRadius: 28,
background:
"linear-gradient(145deg, rgba(2,6,23,0.95), rgba(30,41,59,0.72))",
border: "1px solid rgba(148,163,184,0.28)",
boxShadow:
"inset 0 0 50px rgba(34,211,238,0.08), 0 20px 60px rgba(0,0,0,0.38)",
touchAction: "manipulation",
},

centerLine: {
position: "absolute",
top: 0,
bottom: 0,
left: "50%",
width: 4,
transform: "translateX(-50%)",
background: "rgba(255,255,255,0.9)",
boxShadow: "0 0 28px rgba(255,255,255,0.8)",
zIndex: 1,
},

dot: {
position: "absolute",
left: 0,
borderRadius: "50%",
border: "none",
cursor: "pointer",
zIndex: 2,
transition: "box-shadow 120ms ease, scale 120ms ease",
WebkitTapHighlightColor: "transparent",
},

status: {
marginTop: 18,
textAlign: "center",
fontWeight: 900,
color: "#e0f2fe",
fontSize: 18,
},

stats: {
marginTop: 18,
display: "grid",
gridTemplateColumns: "repeat(4, 1fr)",
gap: 12,
},

statBox: {
borderRadius: 18,
padding: 14,
background: "rgba(30,41,59,0.86)",
border: "1px solid rgba(148,163,184,0.18)",
display: "flex",
flexDirection: "column",
textAlign: "center",
gap: 4,
},

primary: {
width: "100%",
marginTop: 18,
padding: 16,
borderRadius: 18,
border: "none",
background: "linear-gradient(135deg, #22d3ee, #06b6d4)",
color: "#020617",
fontWeight: 950,
fontSize: 17,
cursor: "pointer",
boxShadow: "0 0 30px rgba(34,211,238,0.45)",
},

secondary: {
width: "100%",
marginTop: 18,
padding: 16,
borderRadius: 18,
border: "1px solid rgba(148,163,184,0.35)",
background: "rgba(51,65,85,0.9)",
color: "white",
fontWeight: 900,
cursor: "pointer",
},

danger: {
width: "100%",
marginTop: 10,
padding: 13,
borderRadius: 16,
border: "1px solid rgba(248,113,113,0.45)",
background: "rgba(127,29,29,0.45)",
color: "#fecaca",
fontWeight: 900,
cursor: "pointer",
},
};