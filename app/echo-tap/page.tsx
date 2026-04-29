"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type GameState = "ready" | "showing" | "playing" | "complete" | "failed";
type Pad = 0 | 1 | 2 | 3;

const TOTAL_LEVELS = 45;
const pads: Pad[] = [0, 1, 2, 3];

function levelSettings(level: number) {
return {
sequenceLength: Math.min(3 + Math.floor(level / 3), 14),
showSpeed: Math.max(650 - level * 10, 260),
tapWindow: Math.max(1200 - level * 12, 550),
};
}

function seededRandom(seed: number) {
let value = seed;
return () => {
value = (value * 9301 + 49297) % 233280;
return value / 233280;
};
}

function makeSequence(level: number): Pad[] {
const rand = seededRandom(level * 77 + 13);
const { sequenceLength } = levelSettings(level);

return Array.from({ length: sequenceLength }, () =>
Math.floor(rand() * 4)
) as Pad[];
}

function playTone(pad: Pad, type: "good" | "bad" | "show" = "show") {
try {
const AudioContextClass =
window.AudioContext || (window as any).webkitAudioContext;
const audio = new AudioContextClass();
const oscillator = audio.createOscillator();
const gain = audio.createGain();

const frequencies = [260, 340, 430, 520];

oscillator.connect(gain);
gain.connect(audio.destination);

oscillator.type = "sine";
oscillator.frequency.value =
type === "bad" ? 120 : frequencies[pad] ?? 300;

gain.gain.setValueAtTime(type === "bad" ? 0.1 : 0.075, audio.currentTime);
gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.18);

oscillator.start();
oscillator.stop(audio.currentTime + 0.18);
} catch {}
}

export default function Page() {
const [level, setLevel] = useState(1);
const [state, setState] = useState<GameState>("ready");
const [sequence, setSequence] = useState<Pad[]>(makeSequence(1));
const [activePad, setActivePad] = useState<Pad | null>(null);
const [playerIndex, setPlayerIndex] = useState(0);
const [score, setScore] = useState(0);
const [combo, setCombo] = useState(0);
const [message, setMessage] = useState("Tap Start");
const [timeLeft, setTimeLeft] = useState(0);

const timerRef = useRef<any>(null);
const countdownRef = useRef<any>(null);

const settings = useMemo(() => levelSettings(level), [level]);

useEffect(() => {
const saved = localStorage.getItem("echoTapLevel");
if (saved) {
const savedLevel = Math.min(Number(saved), TOTAL_LEVELS);
setLevel(savedLevel);
setSequence(makeSequence(savedLevel));
}
}, []);

useEffect(() => {
if (state !== "playing") return;

setTimeLeft(settings.tapWindow);

countdownRef.current = setInterval(() => {
setTimeLeft((t) => {
const next = t - 100;

if (next <= 0) {
clearInterval(countdownRef.current);
failGame("Too slow!");
return 0;
}

return next;
});
}, 100);

return () => clearInterval(countdownRef.current);
}, [state, playerIndex]);

function startLevel() {
const nextSequence = makeSequence(level);
setSequence(nextSequence);
setPlayerIndex(0);
setScore(0);
setCombo(0);
setMessage("Watch the pattern");
setState("showing");

showSequence(nextSequence);
}

function showSequence(seq: Pad[]) {
let i = 0;

const showNext = () => {
if (i >= seq.length) {
setActivePad(null);
setMessage("Repeat the pattern");
setState("playing");
return;
}

const pad = seq[i];
setActivePad(pad);
playTone(pad, "show");

setTimeout(() => {
setActivePad(null);
i++;
timerRef.current = setTimeout(showNext, Math.max(settings.showSpeed * 0.35, 120));
}, Math.max(settings.showSpeed * 0.55, 140));
};

showNext();
}

function failGame(reason: string) {
setState("failed");
setActivePad(null);
setCombo(0);
setMessage(reason);

playTone(0, "bad");
if (navigator.vibrate) navigator.vibrate(120);
}

function tapPad(pad: Pad) {
if (state !== "playing") return;

const expected = sequence[playerIndex];

setActivePad(pad);
setTimeout(() => setActivePad(null), 160);

if (pad !== expected) {
failGame("Wrong tile!");
return;
}

playTone(pad, "good");
if (navigator.vibrate) navigator.vibrate(25);

const newCombo = combo + 1;
const multiplier = 1 + Math.floor(newCombo / 5) * 0.25;
const earned = Math.round(100 * multiplier);

setCombo(newCombo);
setScore((s) => s + earned);

const nextIndex = playerIndex + 1;

if (nextIndex >= sequence.length) {
setState("complete");
setMessage("Level complete!");
localStorage.setItem("echoTapLevel", String(level));
return;
}

setPlayerIndex(nextIndex);
setMessage(`Good! ${nextIndex}/${sequence.length}`);
}

function nextLevel() {
const next = Math.min(level + 1, TOTAL_LEVELS);
setLevel(next);
setSequence(makeSequence(next));
localStorage.setItem("echoTapLevel", String(next));
setPlayerIndex(0);
setScore(0);
setCombo(0);
setMessage("Tap Start");
setState("ready");
}

function resetLevel() {
setPlayerIndex(0);
setScore(0);
setCombo(0);
setActivePad(null);
setMessage("Tap Start");
setState("ready");
}

function restartGame() {
setLevel(1);
setSequence(makeSequence(1));
localStorage.setItem("echoTapLevel", "1");
resetLevel();
}

return (
<main style={styles.page}>
<section style={styles.card}>
<a href="/" style={styles.back}>← Arcade</a>

<div style={styles.header}>
<div>
<h1 style={styles.title}>Echo Tap</h1>
<p style={styles.subtitle}>
Watch the glowing rhythm, then repeat the sequence before time runs out.
</p>
</div>

<div style={styles.levelBadge}>Level {level}/{TOTAL_LEVELS}</div>
</div>

<div style={styles.stats}>
<div style={styles.statBox}>
<strong>{score}</strong>
<span>Score</span>
</div>
<div style={styles.statBox}>
<strong>{combo}</strong>
<span>Combo</span>
</div>
<div style={styles.statBox}>
<strong>{playerIndex}/{sequence.length}</strong>
<span>Progress</span>
</div>
<div style={styles.statBox}>
<strong>{state === "playing" ? `${Math.ceil(timeLeft / 1000)}s` : "-"}</strong>
<span>Timer</span>
</div>
</div>

<div style={styles.grid}>
{pads.map((pad) => (
<button
key={pad}
onClick={() => tapPad(pad)}
style={{
...styles.pad,
...padStyle(pad),
...(activePad === pad ? styles.activePad : {}),
}}
>
{pad + 1}
</button>
))}
</div>

<div style={styles.status}>{message}</div>

{state === "ready" && (
<button onClick={startLevel} style={styles.primary}>
Start Level
</button>
)}

{state === "showing" && (
<button style={styles.disabled}>
Watch Pattern...
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

function padStyle(pad: Pad): React.CSSProperties {
const colors = [
["#22d3ee", "#0891b2"],
["#a78bfa", "#6d28d9"],
["#34d399", "#059669"],
["#facc15", "#ca8a04"],
];

return {
background: `linear-gradient(145deg, ${colors[pad][0]}, ${colors[pad][1]})`,
boxShadow: `0 0 32px ${colors[pad][0]}55`,
};
}

const styles: Record<string, React.CSSProperties> = {
page: {
minHeight: "100vh",
padding: "clamp(16px, 4vw, 48px)",
background:
"radial-gradient(circle at top left, #4c1d95 0%, #020617 48%, #020617 100%)",
color: "white",
fontFamily:
"-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif",
display: "flex",
justifyContent: "center",
alignItems: "center",
},

card: {
width: "min(860px, 100%)",
padding: "clamp(18px, 4vw, 34px)",
borderRadius: 32,
background: "rgba(15,23,42,0.82)",
border: "1px solid rgba(167,139,250,0.28)",
boxShadow: "0 30px 90px rgba(0,0,0,0.55)",
backdropFilter: "blur(16px)",
},

back: {
color: "#ddd6fe",
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
textShadow: "0 0 28px rgba(167,139,250,0.45)",
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
background: "rgba(167,139,250,0.16)",
border: "1px solid rgba(167,139,250,0.4)",
color: "#ddd6fe",
fontWeight: 900,
},

stats: {
marginTop: 24,
display: "grid",
gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
gap: 12,
},

statBox: {
borderRadius: 18,
padding: 14,
background: "rgba(30,41,59,0.86)",
border: "1px solid rgba(167,139,250,0.18)",
display: "flex",
flexDirection: "column",
textAlign: "center",
gap: 4,
},

grid: {
marginTop: 26,
display: "grid",
gridTemplateColumns: "repeat(2, minmax(120px, 1fr))",
gap: 16,
},

pad: {
height: "clamp(120px, 28vw, 190px)",
borderRadius: 30,
border: "2px solid rgba(255,255,255,0.35)",
color: "rgba(255,255,255,0.92)",
fontSize: 48,
fontWeight: 950,
cursor: "pointer",
transition: "transform 120ms ease, filter 120ms ease, box-shadow 120ms ease",
WebkitTapHighlightColor: "transparent",
},

activePad: {
transform: "scale(1.06)",
filter: "brightness(1.45)",
boxShadow: "0 0 55px rgba(255,255,255,0.75)",
},

status: {
marginTop: 20,
minHeight: 28,
textAlign: "center",
fontSize: 18,
fontWeight: 900,
color: "#ede9fe",
},

primary: {
width: "100%",
marginTop: 18,
padding: 16,
borderRadius: 18,
border: "none",
background: "linear-gradient(135deg, #ddd6fe, #a78bfa)",
color: "#2e1065",
fontWeight: 950,
fontSize: 17,
cursor: "pointer",
boxShadow: "0 0 30px rgba(167,139,250,0.45)",
},

secondary: {
width: "100%",
marginTop: 18,
padding: 16,
borderRadius: 18,
border: "1px solid rgba(167,139,250,0.35)",
background: "rgba(51,65,85,0.9)",
color: "white",
fontWeight: 900,
cursor: "pointer",
},

disabled: {
width: "100%",
marginTop: 18,
padding: 16,
borderRadius: 18,
border: "1px solid rgba(167,139,250,0.35)",
background: "rgba(51,65,85,0.65)",
color: "#cbd5e1",
fontWeight: 900,
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