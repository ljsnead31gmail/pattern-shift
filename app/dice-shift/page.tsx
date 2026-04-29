"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type GameState = "ready" | "playing" | "complete" | "failed";
type Die = {
id: number;
x: number;
y: number;
value: number;
locked: boolean;
speed: number;
};

const TOTAL_LEVELS = 45;

function levelSettings(level: number) {
return {
diceCount: Math.min(2 + Math.floor((level - 1) / 6), 8),
target: 7 + level,
speed: 1.2 + level * 0.08,
lockGoal: Math.min(2 + Math.floor(level / 5), 6),
};
}

function makeDice(level: number): Die[] {
const settings = levelSettings(level);

return Array.from({ length: settings.diceCount }, (_, i) => ({
id: i,
x: -80 - i * 110,
y: 18 + ((i * 71 + level * 13) % 65),
value: ((i + level) % 6) + 1,
locked: false,
speed: settings.speed + i * 0.08,
}));
}

export default function Page() {
const [level, setLevel] = useState(1);
const [state, setState] = useState<GameState>("ready");
const [dice, setDice] = useState<Die[]>(makeDice(1));
const [score, setScore] = useState(0);
const [locks, setLocks] = useState(0);
const [misses, setMisses] = useState(0);
const [message, setMessage] = useState("Tap Start");

const areaRef = useRef<HTMLDivElement | null>(null);
const frameRef = useRef<number | null>(null);

const settings = levelSettings(level);
const lockedTotal = useMemo(
() => dice.filter((d) => d.locked).reduce((sum, d) => sum + d.value, 0),
[dice]
);

useEffect(() => {
const saved = localStorage.getItem("diceShiftLevel");
if (saved) {
const savedLevel = Math.min(Number(saved), TOTAL_LEVELS);
setLevel(savedLevel);
setDice(makeDice(savedLevel));
}
}, []);

useEffect(() => {
if (state !== "playing") return;

function animate() {
const width = areaRef.current?.clientWidth ?? 800;

setDice((current) =>
current.map((die) => {
if (die.locked) return die;

let nextX = die.x + die.speed;
if (nextX > width + 80) nextX = -80;

const nextValue =
Math.floor((performance.now() / (220 - level * 2 + die.id * 9)) % 6) + 1;

return {
...die,
x: nextX,
value: nextValue,
};
})
);

frameRef.current = requestAnimationFrame(animate);
}

frameRef.current = requestAnimationFrame(animate);

return () => {
if (frameRef.current) cancelAnimationFrame(frameRef.current);
};
}, [state, level]);

function startGame() {
setDice(makeDice(level));
setScore(0);
setLocks(0);
setMisses(0);
setMessage(`Lock dice to hit target total ${settings.target}`);
setState("playing");
}

function resetLevel() {
setDice(makeDice(level));
setScore(0);
setLocks(0);
setMisses(0);
setMessage("Tap Start");
setState("ready");
}

function restartGame() {
setLevel(1);
localStorage.setItem("diceShiftLevel", "1");
setDice(makeDice(1));
setScore(0);
setLocks(0);
setMisses(0);
setMessage("Tap Start");
setState("ready");
}

function nextLevel() {
const next = Math.min(level + 1, TOTAL_LEVELS);
setLevel(next);
localStorage.setItem("diceShiftLevel", String(next));
setDice(makeDice(next));
setScore(0);
setLocks(0);
setMisses(0);
setMessage("Tap Start");
setState("ready");
}

function lockDie(id: number) {
if (state !== "playing") return;

const die = dice.find((d) => d.id === id);
if (!die || die.locked) return;

const nextDice = dice.map((d) =>
d.id === id ? { ...d, locked: true } : d
);

const nextTotal = nextDice
.filter((d) => d.locked)
.reduce((sum, d) => sum + d.value, 0);

const distance = Math.abs(settings.target - nextTotal);
const earned = Math.max(0, 120 - distance * 25);
const nextScore = score + earned;
const nextLocks = locks + 1;

setDice(nextDice);
setScore(nextScore);
setLocks(nextLocks);

if (navigator.vibrate) navigator.vibrate(30);

if (nextTotal === settings.target) {
setScore(nextScore + 250);
setState("complete");
setMessage("Perfect target hit!");
return;
}

if (nextTotal > settings.target) {
const nextMisses = misses + 1;
setMisses(nextMisses);
setMessage("Bust! Total went over target.");

if (nextMisses >= 3) {
setState("failed");
setMessage("Level failed — too many busts");
}

return;
}

if (nextLocks >= settings.lockGoal) {
if (distance <= 2) {
setState("complete");
setMessage("Close enough — level complete!");
} else {
const nextMisses = misses + 1;
setMisses(nextMisses);
setMessage("Not close enough. Try again.");

if (nextMisses >= 3) {
setState("failed");
setMessage("Level failed — try again");
} else {
setTimeout(() => {
setDice(makeDice(level));
setLocks(0);
}, 700);
}
}
} else {
setMessage(`Total ${nextTotal}. Keep locking dice.`);
}
}

return (
<main style={styles.page}>
<section style={styles.card}>
<a href="/" style={styles.back}>← Arcade</a>

<div style={styles.header}>
<div>
<h1 style={styles.title}>Dice Shift</h1>
<p style={styles.subtitle}>
Moving dice change value as they travel. Tap to lock the right numbers and hit the target.
</p>
</div>

<div style={styles.levelBadge}>Level {level}/{TOTAL_LEVELS}</div>
</div>

<div style={styles.targetPanel}>
<div>
<span style={styles.label}>Target</span>
<strong>{settings.target}</strong>
</div>
<div>
<span style={styles.label}>Locked Total</span>
<strong>{lockedTotal}</strong>
</div>
<div>
<span style={styles.label}>Score</span>
<strong>{score}</strong>
</div>
</div>

<div ref={areaRef} style={styles.playArea}>
<div style={styles.centerGlow} />

{state === "playing" &&
dice.map((die) => (
<button
key={die.id}
onClick={() => lockDie(die.id)}
style={{
...styles.die,
left: die.x,
top: `${die.y}%`,
opacity: die.locked ? 0.38 : 1,
transform: die.locked ? "scale(0.9)" : "scale(1)",
}}
>
{die.value}
</button>
))}
</div>

<div style={styles.status}>{message}</div>

<div style={styles.stats}>
<div style={styles.statBox}>
<strong>{settings.diceCount}</strong>
<span>Dice</span>
</div>
<div style={styles.statBox}>
<strong>{locks}/{settings.lockGoal}</strong>
<span>Locks</span>
</div>
<div style={styles.statBox}>
<strong>{misses}/3</strong>
<span>Busts</span>
</div>
</div>

{state === "ready" && (
<button onClick={startGame} style={styles.primary}>Start Level</button>
)}

{state === "playing" && (
<button onClick={resetLevel} style={styles.secondary}>Reset Level</button>
)}

{state === "complete" && (
<button onClick={nextLevel} style={styles.primary}>Next Level</button>
)}

{state === "failed" && (
<button onClick={resetLevel} style={styles.primary}>Try Again</button>
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
"radial-gradient(circle at top left, #7c2d12 0%, #020617 45%, #020617 100%)",
color: "white",
fontFamily:
"-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif",
display: "flex",
justifyContent: "center",
alignItems: "center",
},

card: {
width: "min(960px, 100%)",
padding: "clamp(18px, 4vw, 34px)",
borderRadius: 32,
background: "rgba(15,23,42,0.82)",
border: "1px solid rgba(251,146,60,0.25)",
boxShadow: "0 30px 90px rgba(0,0,0,0.55)",
backdropFilter: "blur(16px)",
},

back: {
color: "#fed7aa",
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
textShadow: "0 0 28px rgba(251,146,60,0.35)",
},

subtitle: {
color: "#cbd5e1",
fontSize: "clamp(15px, 3vw, 19px)",
marginTop: 8,
maxWidth: 620,
},

levelBadge: {
padding: "12px 18px",
borderRadius: 999,
background: "rgba(251,146,60,0.14)",
border: "1px solid rgba(251,146,60,0.35)",
color: "#fed7aa",
fontWeight: 900,
},

targetPanel: {
display: "grid",
gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
gap: 12,
marginTop: 24,
},

label: {
display: "block",
color: "#cbd5e1",
fontSize: 13,
marginBottom: 4,
},

playArea: {
marginTop: 24,
height: "clamp(320px, 55vh, 520px)",
position: "relative",
overflow: "hidden",
borderRadius: 28,
background:
"linear-gradient(145deg, rgba(2,6,23,0.95), rgba(30,41,59,0.78))",
border: "1px solid rgba(251,146,60,0.25)",
boxShadow:
"inset 0 0 50px rgba(251,146,60,0.08), 0 20px 60px rgba(0,0,0,0.38)",
},

centerGlow: {
position: "absolute",
inset: "18% 42%",
borderRadius: 999,
background: "rgba(251,146,60,0.08)",
boxShadow: "0 0 60px rgba(251,146,60,0.18)",
},

die: {
position: "absolute",
width: 64,
height: 64,
borderRadius: 18,
border: "2px solid rgba(255,255,255,0.65)",
background: "linear-gradient(145deg, #fed7aa, #fb923c)",
color: "#431407",
fontSize: 32,
fontWeight: 950,
cursor: "pointer",
boxShadow: "0 0 30px rgba(251,146,60,0.55)",
transition: "transform 120ms ease, opacity 120ms ease",
WebkitTapHighlightColor: "transparent",
},

status: {
marginTop: 18,
textAlign: "center",
fontWeight: 900,
color: "#ffedd5",
fontSize: 18,
minHeight: 28,
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
border: "1px solid rgba(251,146,60,0.18)",
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
background: "linear-gradient(135deg, #fed7aa, #fb923c)",
color: "#431407",
fontWeight: 950,
fontSize: 17,
cursor: "pointer",
boxShadow: "0 0 30px rgba(251,146,60,0.45)",
},

secondary: {
width: "100%",
marginTop: 18,
padding: 16,
borderRadius: 18,
border: "1px solid rgba(251,146,60,0.35)",
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