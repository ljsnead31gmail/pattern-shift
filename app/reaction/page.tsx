"use client";

import { useEffect, useRef, useState } from "react";

type Phase = "idle" | "waiting" | "go" | "result" | "toosoon";

export default function Page() {
const [phase, setPhase] = useState<Phase>("idle");
const [reactionTime, setReactionTime] = useState<number | null>(null);
const [best, setBest] = useState<number | null>(null);
const [streak, setStreak] = useState(0);
const [fake, setFake] = useState(false);

const startRef = useRef<number>(0);
const timerRef = useRef<any>(null);

// Load best score
useEffect(() => {
const saved = localStorage.getItem("reactionBest");
if (saved) setBest(Number(saved));
}, []);

function startGame() {
setPhase("waiting");
setReactionTime(null);
setFake(false);

const delay = 1200 + Math.random() * 2000;

timerRef.current = setTimeout(() => {
// 20% chance fake-out
if (Math.random() < 0.2) {
setFake(true);
setTimeout(() => setFake(false), 200);
startGame();
return;
}

startRef.current = performance.now();
setPhase("go");
}, delay);
}

function handleTap() {
if (phase === "waiting") {
clearTimeout(timerRef.current);
setPhase("toosoon");
setStreak(0);
return;
}

if (phase === "go") {
const time = Math.floor(performance.now() - startRef.current);
setReactionTime(time);
setPhase("result");

const newBest = best === null || time < best ? time : best;
setBest(newBest);
localStorage.setItem("reactionBest", String(newBest));

setStreak((s) => s + 1);
}
}

function reset() {
setPhase("idle");
setReactionTime(null);
}

return (
<main
onClick={handleTap}
style={{
...styles.page,
background:
phase === "go"
? "#16a34a"
: phase === "waiting"
? fake
? "#eab308"
: "#020617"
: "#020617",
}}
>
<div style={styles.card}>
<h1 style={styles.title}>Reaction Test</h1>

{phase === "idle" && (
<>
<p style={styles.text}>Tap when the screen turns green</p>
<button style={styles.button} onClick={startGame}>
Start
</button>
</>
)}

{phase === "waiting" && (
<p style={styles.text}>Wait for green…</p>
)}

{phase === "go" && (
<p style={styles.big}>TAP!</p>
)}

{phase === "toosoon" && (
<>
<p style={styles.big}>Too Soon!</p>
<button style={styles.button} onClick={reset}>
Try Again
</button>
</>
)}

{phase === "result" && (
<>
<p style={styles.big}>{reactionTime} ms</p>
<p style={styles.text}>Streak: {streak}</p>
<p style={styles.text}>
Best: {best !== null ? `${best} ms` : "-"}
</p>

<button style={styles.button} onClick={startGame}>
Try Again
</button>
</>
)}
</div>
</main>
);
}

const styles: any = {
page: {
minHeight: "100vh",
display: "flex",
justifyContent: "center",
alignItems: "center",
color: "white",
fontFamily:
"-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial",
transition: "background 0.2s ease",
},

card: {
width: "90%",
maxWidth: 420,
padding: 30,
borderRadius: 24,
background: "rgba(15,23,42,0.85)",
textAlign: "center",
boxShadow: "0 30px 80px rgba(0,0,0,0.5)",
},

title: {
fontSize: 42,
marginBottom: 10,
},

text: {
fontSize: 18,
marginBottom: 20,
color: "#cbd5e1",
},

big: {
fontSize: 48,
fontWeight: 800,
marginBottom: 20,
},

button: {
padding: "14px 20px",
borderRadius: 12,
border: "none",
background: "#22d3ee",
color: "#020617",
fontWeight: 700,
cursor: "pointer",
},
};