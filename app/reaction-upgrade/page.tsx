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
type HitQuality = "Perfect" | "Early" | "Late" | "Miss";

const TOTAL_LEVELS = 45;

function getTolerance(level: number) {
return Math.max(90 - level * 1.2, 32);
}

function getPerfectZone(level: number) {
return Math.max(28 - level * 0.25, 14);
}

function levelSettings(level: number) {
const dotCount = Math.min(1 + Math.floor((level - 1) / 5), 10);
const speed = 2.2 + level * 0.18;
const targetScore = 350 + level * 75;
return { dotCount, speed, targetScore };
}

function makeDots(level: number): Dot[] {
const { dotCount, speed } = levelSettings(level);
const colors = ["#22d3ee", "#a78bfa", "#34d399", "#facc15", "#fb7185"];

return Array.from({ length: dotCount }, (_, i) => ({
id: i,
y: 18 + ((i * 67 + level * 13) % 68),
size: Math.max(18, 34 - Math.floor(level / 5)),
speed: speed + i * 0.25,
delay: 0,
color: colors[(i + level) % colors.length],
}));
}

function shuffleDots(dots: Dot[]) {
const copy = [...dots];

for (let i = copy.length - 1; i > 0; i--) {
const j = Math.floor(Math.random() * (i + 1));
[copy[i], copy[j]] = [copy[j], copy[i]];
}

return copy.map((dot, index) => ({
...dot,
id: index,
y: 15 + Math.floor(Math.random() * 70),
}));
}

export default function Page() {
const [level, setLevel] = useState(1);
const [state, setState] = useState<GameState>("ready");
const [score, setScore] = useState(0);
const [combo, setCombo] = useState(0);
const [bestCombo, setBestCombo] = useState(0);
const [misses, setMisses] = useState(0);
const [message, setMessage] = useState("Tap Start");
const [lastHit, setLastHit] = useState<HitQuality | null>(null);
const [slowMo, setSlowMo] = useState(false);
const [position, setPosition] = useState(-60);
const [activeDotIndex, setActiveDotIndex] = useState(0);
const [dotRun, setDotRun] = useState<Dot[]>([]);

const areaRef = useRef<HTMLDivElement | null>(null);
const frameRef = useRef<number | null>(null);
const startTimeRef = useRef<number>(0);

const baseDots = useMemo(() => makeDots(level), [level]);
const settings = levelSettings(level);
const tolerance = getTolerance(level);
const perfectZone = getPerfectZone(level);

const activeDot = dotRun[activeDotIndex] ?? baseDots[0];

useEffect(() => {
const saved = localStorage.getItem("centerStrikeLevel");
if (saved) setLevel(Math.min(Number(saved), TOTAL_LEVELS));
}, []);

useEffect(() => {
setDotRun(shuffleDots(baseDots));
setActiveDotIndex(0);
}, [baseDots]);

useEffect(() => {
if (state !== "playing" || !activeDot) return;

startTimeRef.current = performance.now();

function animate(now: number) {
const width = areaRef.current?.clientWidth ?? 800;
const slowFactor = slowMo ? 0.35 : 1;
const cycle = width + activeDot.size * 2;

const elapsed = Math.max(0, now - startTimeRef.current);
const x =
((elapsed * activeDot.speed * 0.06 * slowFactor) % cycle) -
activeDot.size;

setPosition(x);
frameRef.current = requestAnimationFrame(animate);
}

frameRef.current = requestAnimationFrame(animate);

return () => {
if (frameRef.current) cancelAnimationFrame(frameRef.current);
};
}, [state, activeDot, slowMo]);

function randomizeNextBall() {
setActiveDotIndex((current) => {
const next = current + 1;

if (next >= dotRun.length) {
setDotRun(shuffleDots(baseDots));
return 0;
}

return next;
});

setPosition(-60);
startTimeRef.current = performance.now();
}

function startGame() {
setScore(0);
setCombo(0);
setBestCombo(0);
setMisses(0);
setLastHit(null);
setSlowMo(false);
setPosition(-60);
setDotRun(shuffleDots(baseDots));
setActiveDotIndex(0);
setMessage("Tap anywhere when the ball crosses the center line");
setState("playing");
}

function resetLevel() {
setScore(0);
setCombo(0);
setBestCombo(0);
setMisses(0);
setLastHit(null);
setSlowMo(false);
setPosition(-60);
setDotRun(shuffleDots(baseDots));
setActiveDotIndex(0);
setMessage("Tap Start");
setState("ready");
}

function nextLevel() {
const next = Math.min(level + 1, TOTAL_LEVELS);
setLevel(next);
localStorage.setItem("centerStrikeLevel", String(next));
setScore(0);
setCombo(0);
setBestCombo(0);
setMisses(0);
setLastHit(null);
setSlowMo(false);
setPosition(-60);
setActiveDotIndex(0);
setMessage("Tap Start");
setState("ready");
}

function restartGame() {
setLevel(1);
localStorage.setItem("centerStrikeLevel", "1");
resetLevel();
}

function handlePlayAreaTap() {
if (state !== "playing" || !activeDot) return;

const areaWidth = areaRef.current?.clientWidth ?? 800;
const center = areaWidth / 2;
const dotCenter = position + activeDot.size / 2;
const distance = Math.abs(dotCenter - center);
const isEarly = dotCenter < center;

let quality: HitQuality = "Miss";
let points = 0;

if (distance <= perfectZone) {
quality = "Perfect";
points = 100;
setSlowMo(true);
setTimeout(() => setSlowMo(false), 260);
} else if (distance <= tolerance) {
quality = isEarly ? "Early" : "Late";
points = 50;
}

if (quality === "Miss") {
const newMisses = misses + 1;
setMisses(newMisses);
setCombo(0);
setLastHit("Miss");
setMessage("Miss! Too far from center.");

if (navigator.vibrate) navigator.vibrate(80);

if (newMisses >= 3) {
setState("failed");
setMessage("Level failed — try again");
}

return;
}

const newCombo = combo + 1;
const multiplier = 1 + Math.floor(newCombo / 5) * 0.25;
const earned = Math.round(points * multiplier);
const newScore = score + earned;

setScore(newScore);
setCombo(newCombo);
setBestCombo((b) => Math.max(b, newCombo));
setLastHit(quality);
setMessage(`${quality}! +${earned} points x${multiplier.toFixed(2)}`);

if (navigator.vibrate) navigator.vibrate(quality === "Perfect" ? 35 : 20);

if (newScore >= settings.targetScore) {
setState("complete");
setMessage("Level complete!");
return;
}

randomizeNextBall();
}

return (
<main style={styles.page}>
<section style={styles.card}>
<a href="/" style={styles.back}>
← Arcade
</a>

<div style={styles.header}>
<div>
<h1 style={styles.title}>Center Strike</h1>
<p style={styles.subtitle}>
Hit each ball as it crosses the center. After each hit, the next
random ball appears.
</p>
</div>

<div style={styles.levelBadge}>
Level {level}/{TOTAL_LEVELS}
</div>
</div>

<div
ref={areaRef}
style={styles.playArea}
onPointerDown={handlePlayAreaTap}
>
<div style={{ ...styles.hitZone, width: tolerance * 2 }} />
<div style={{ ...styles.perfectZone, width: perfectZone * 2 }} />
<div style={styles.centerLine} />

{state === "playing" && activeDot && (
<div
style={{
...styles.dot,
top: `${activeDot.y}%`,
width: activeDot.size,
height: activeDot.size,
background: activeDot.color,
boxShadow: `0 0 24px ${activeDot.color}`,
transform: `translateX(${position}px) ${
slowMo ? "scale(1.2)" : "scale(1)"
}`,
}}
/>
)}
</div>

<div style={styles.status}>
{lastHit && <span style={styles.hitLabel}>{lastHit}</span>}
{message}
</div>

<div style={styles.stats}>
<div style={styles.statBox}>
<strong>{score}</strong>
<span>Score</span>
</div>
<div style={styles.statBox}>
<strong>{settings.targetScore}</strong>
<span>Goal</span>
</div>
<div style={styles.statBox}>
<strong>{combo}</strong>
<span>Combo</span>
</div>
<div style={styles.statBox}>
<strong>{bestCombo}</strong>
<span>Best Combo</span>
</div>
<div style={styles.statBox}>
<strong>{misses}/3</strong>
<span>Misses</span>
</div>
<div style={styles.statBox}>
<strong>{dotRun.length}</strong>
<span>Balls</span>
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
cursor: "pointer",
},

hitZone: {
position: "absolute",
top: 0,
bottom: 0,
left: "50%",
transform: "translateX(-50%)",
background: "rgba(34,211,238,0.08)",
zIndex: 0,
},

perfectZone: {
position: "absolute",
top: 0,
bottom: 0,
left: "50%",
transform: "translateX(-50%)",
background: "rgba(16,185,129,0.16)",
zIndex: 0,
},

centerLine: {
position: "absolute",
top: 0,
bottom: 0,
left: "50%",
width: 4,
transform: "translateX(-50%)",
background: "rgba(255,255,255,0.95)",
boxShadow: "0 0 28px rgba(255,255,255,0.8)",
zIndex: 1,
},

dot: {
position: "absolute",
left: 0,
borderRadius: "50%",
border: "none",
zIndex: 2,
pointerEvents: "none",
transition: "transform 90ms ease, box-shadow 120ms ease",
},

status: {
marginTop: 18,
textAlign: "center",
fontWeight: 900,
color: "#e0f2fe",
fontSize: 18,
minHeight: 28,
},

hitLabel: {
display: "inline-block",
marginRight: 10,
padding: "4px 10px",
borderRadius: 999,
background: "rgba(34,211,238,0.18)",
color: "#a5f3fc",
},

stats: {
marginTop: 18,
display: "grid",
gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
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