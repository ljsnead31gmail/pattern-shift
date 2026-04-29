"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type GameState = "ready" | "showing" | "playing" | "complete" | "failed";
type Pad = 0 | 1 | 2 | 3;
type Step = {
pad: Pad;
fake?: boolean;
};

const TOTAL_LEVELS = 45;
const pads: Pad[] = [0, 1, 2, 3];

function levelSettings(level: number) {
return {
sequenceLength: Math.min(3 + Math.floor(level / 3), 16),
showSpeed: Math.max(650 - level * 10, 240),
tapWindow: Math.max(1100 - level * 12, 500),
fakeChance: Math.min(0.08 + level * 0.008, 0.32),
};
}

function seededRandom(seed: number) {
let value = seed;
return () => {
value = (value * 9301 + 49297) % 233280;
return value / 233280;
};
}

function makeSequence(level: number): Step[] {
const rand = seededRandom(level * 97 + 21);
const settings = levelSettings(level);
const sequence: Step[] = [];

for (let i = 0; i < settings.sequenceLength; i++) {
if (i > 1 && rand() < settings.fakeChance) {
sequence.push({
pad: Math.floor(rand() * 4) as Pad,
fake: true,
});
}

sequence.push({
pad: Math.floor(rand() * 4) as Pad,
fake: false,
});
}

return sequence;
}

function realSteps(sequence: Step[]) {
return sequence.filter((s) => !s.fake);
}

function playTone(pad: Pad, type: "show" | "good" | "bad" | "fake" = "show") {
try {
const AudioContextClass =
window.AudioContext || (window as any).webkitAudioContext;
const audio = new AudioContextClass();
const oscillator = audio.createOscillator();
const gain = audio.createGain();

const frequencies = [260, 340, 430, 520];

oscillator.connect(gain);
gain.connect(audio.destination);
oscillator.type = type === "fake" ? "triangle" : "sine";
oscillator.frequency.value =
type === "bad" ? 120 : type === "fake" ? 180 : frequencies[pad];

gain.gain.setValueAtTime(type === "bad" ? 0.1 : 0.075, audio.currentTime);
gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.18);

oscillator.start();
oscillator.stop(audio.currentTime + 0.18);
} catch {}
}

export default function Page() {
const [level, setLevel] = useState(1);
const [state, setState] = useState<GameState>("ready");
const [sequence, setSequence] = useState<Step[]>(makeSequence(1));
const [activePad, setActivePad] = useState<Pad | null>(null);
const [fakeActive, setFakeActive] = useState(false);
const [playerIndex, setPlayerIndex] = useState(0);
const [score, setScore] = useState(0);
const [combo, setCombo] = useState(0);
const [bestCombo, setBestCombo] = useState(0);
const [message, setMessage] = useState("Tap Start");
const [timeLeft, setTimeLeft] = useState(0);
const [hitLabel, setHitLabel] = useState("");

const countdownRef = useRef<any>(null);
const showTimerRef = useRef<any>(null);
const stepStartRef = useRef<number>(0);

const settings = useMemo(() => levelSettings(level), [level]);
const targetSequence = useMemo(() => realSteps(sequence), [sequence]);

useEffect(() => {
const saved = localStorage.getItem("echoTapProLevel");
if (saved) {
const savedLevel = Math.min(Number(saved), TOTAL_LEVELS);
setLevel(savedLevel);
setSequence(makeSequence(savedLevel));
}
}, []);

useEffect(() => {
if (state !== "playing") return;

stepStartRef.current = performance.now();
setTimeLeft(settings.tapWindow);

countdownRef.current = setInterval(() => {
setTimeLeft((t) => {
const next = t - 50;

if (next <= 0) {
clearInterval(countdownRef.current);
failGame("Too slow!");
return 0;
}

return next;
});
}, 50);

return () => clearInterval(countdownRef.current);
}, [state, playerIndex, settings.tapWindow]);

function startLevel() {
const nextSequence = makeSequence(level);

clearInterval(countdownRef.current);
clearTimeout(showTimerRef.current);

setSequence(nextSequence);
setPlayerIndex(0);
setScore(0);
setCombo(0);
setBestCombo(0);
setHitLabel("");
setMessage("Watch the rhythm. Ignore fake red flashes.");
setState("showing");

showSequence(nextSequence);
}

function showSequence(seq: Step[]) {
let i = 0;

const showNext = () => {
if (i >= seq.length) {
setActivePad(null);
setFakeActive(false);
setMessage("Repeat the real pattern");
setState("playing");
return;
}

const step = seq[i];
setActivePad(step.pad);
setFakeActive(Boolean(step.fake));
playTone(step.pad, step.fake ? "fake" : "show");

showTimerRef.current = setTimeout(() => {
setActivePad(null);
setFakeActive(false);
i++;
showTimerRef.current = setTimeout(
showNext,
Math.max(settings.showSpeed * 0.3, 90)
);
}, Math.max(settings.showSpeed * 0.55, 120));
};

showNext();
}

function failGame(reason: string) {
clearInterval(countdownRef.current);
clearTimeout(showTimerRef.current);

setState("failed");
setActivePad(null);
setFakeActive(false);
setCombo(0);
setHitLabel("Miss");
setMessage(reason);

playTone(0, "bad");
if (navigator.vibrate) navigator.vibrate(120);
}

function tapPad(pad: Pad) {
if (state !== "playing") return;

const expected = targetSequence[playerIndex]?.pad;

setActivePad(pad);
setFakeActive(false);
setTimeout(() => setActivePad(null), 130);

if (pad !== expected) {
failGame("Wrong tile!");
return;
}

clearInterval(countdownRef.current);

const elapsed = performance.now() - stepStartRef.current;
const remainingRatio = Math.max(0, timeLeft / settings.tapWindow);

let quality = "Good";
let base = 80;

if (remainingRatio > 0.72) {
quality = "Perfect";
base = 130;
} else if (remainingRatio > 0.38) {
quality = "Good";
base = 90;
} else {
quality = "Late";
base = 55;
}

const newCombo = combo + 1;
const multiplier = 1 + Math.floor(newCombo / 5) * 0.25;
const earned = Math.round(base * multiplier);
const nextScore = score + earned;

setCombo(newCombo);
setBestCombo((b) => Math.max(b, newCombo));
setScore(nextScore);
setHitLabel(quality);
setMessage(`${quality}! +${earned} x${multiplier.toFixed(2)}`);

playTone(pad, "good");
if (navigator.vibrate) navigator.vibrate(quality === "Perfect" ? 35 : 20);

const nextIndex = playerIndex + 1;

if (nextIndex >= targetSequence.length) {
setState("complete");
setMessage("Level complete!");
localStorage.setItem("echoTapProLevel", String(level));
return;
}

setPlayerIndex(nextIndex);
}

function nextLevel() {
const next = Math.min(level + 1, TOTAL_LEVELS);
setLevel(next);
setSequence(makeSequence(next));
localStorage.setItem("echoTapProLevel", String(next));
setPlayerIndex(0);
setScore(0);
setCombo(0);
setBestCombo(0);
setHitLabel("");
setMessage("Tap Start");
setState("ready");
}

function resetLevel() {
clearInterval(countdownRef.current);
clearTimeout(showTimerRef.current);

setPlayerIndex(0);
setScore(0);
setCombo(0);
setBestCombo(0);
setActivePad(null);
setFakeActive(false);
setHitLabel("");
setMessage("Tap Start");
setState("ready");
}

function restartGame() {
setLevel(1);
setSequence(makeSequence(1));
localStorage.setItem("echoTapProLevel", "1");
resetLevel();
}

return (
<main style={styles.page}>
<section style={styles.card}>
<a href="/" style={styles.back}>
← Arcade
</a>

<div style={styles.header}>
<div>
<h1 style={styles.title}>Echo Tap Pro</h1>
<p style={styles.subtitle}>
Memorize the rhythm, ignore fake flashes, and repeat the real
pattern.
</p>
</div>

<div style={styles.levelBadge}>
Level {level}/{TOTAL_LEVELS}
</div>
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
<strong>{bestCombo}</strong>
<span>Best Combo</span>
</div>
<div style={styles.statBox}>
<strong>
{playerIndex}/{targetSequence.length}
</strong>
<span>Progress</span>
</div>
<div style={styles.statBox}>
<strong>
{state === "playing"
? `${Math.ceil(timeLeft / 1000)}s`
: "-"}
</strong>
<span>Timer</span>
</div>
</div>

<div style={styles.timerTrack}>
<div
style={{
...styles.timerFill,
width:
state === "playing"
? `${Math.max(0, (timeLeft / settings.tapWindow) * 100)}%`
: "0%",
}}
/>
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
...(activePad === pad && fakeActive ? styles.fakePad : {}),
}}
>
{pad + 1}
</button>
))}
</div>

<div style={styles.status}>
{hitLabel && <span style={styles.hitLabel}>{hitLabel}</span>}
{message}
</div>

{state === "ready" && (
<button onClick={startLevel} style={styles.primary}>
Start Level
</button>
)}

{state === "showing" && (
<button style={styles.disabled}>Watch Pattern...</button>
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
width: "min(900px, 100%)",
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
gridTemplateColumns: "repeat(auto-fit, minmax(105px, 1fr))",
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

timerTrack: {
marginTop: 18,
height: 10,
borderRadius: 999,
background: "rgba(255,255,255,0.1)",
overflow: "hidden",
},

timerFill: {
height: "100%",
borderRadius: 999,
background: "linear-gradient(90deg, #22d3ee, #a78bfa)",
transition: "width 80ms linear",
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
filter: "brightness(1.5)",
boxShadow: "0 0 65px rgba(255,255,255,0.85)",
},

fakePad: {
filter: "brightness(1.35) saturate(0.3)",
background: "linear-gradient(145deg, #f87171, #991b1b)",
},

status: {
marginTop: 20,
minHeight: 32,
textAlign: "center",
fontSize: 18,
fontWeight: 900,
color: "#ede9fe",
},

hitLabel: {
display: "inline-block",
marginRight: 10,
padding: "4px 10px",
borderRadius: 999,
background: "rgba(167,139,250,0.18)",
color: "#ddd6fe",
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