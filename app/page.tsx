"use client";

import { useEffect, useMemo, useState } from "react";

type Dir = "top" | "right" | "bottom" | "left";
type Tile = { sides: Dir[] };

const rotateMap: Record<Dir, Dir> = {
top: "right",
right: "bottom",
bottom: "left",
left: "top",
};

const opposite: Record<Dir, Dir> = {
top: "bottom",
right: "left",
bottom: "top",
left: "right",
};

const directions: Dir[] = ["top", "right", "bottom", "left"];

function rotateTile(tile: Tile): Tile {
return { sides: tile.sides.map((s) => rotateMap[s]) };
}

function sameSides(a: Dir[], b: Dir[]) {
return [...a].sort().join("-") === [...b].sort().join("-");
}

const baseLevel: Tile[] = [
{ sides: ["right", "bottom"] }, { sides: ["left", "right"] }, { sides: ["left", "right"] }, { sides: ["left", "bottom"] },
{ sides: ["top", "bottom"] }, { sides: ["right", "bottom"] }, { sides: ["left", "bottom"] }, { sides: ["top", "bottom"] },
{ sides: ["top", "bottom"] }, { sides: ["top", "right"] }, { sides: ["top", "left"] }, { sides: ["top", "bottom"] },
{ sides: ["top", "right"] }, { sides: ["left", "right"] }, { sides: ["left", "right"] }, { sides: ["top", "left"] },
];

function seededRandom(seed: number) {
let value = seed;
return () => {
value = (value * 9301 + 49297) % 233280;
return value / 233280;
};
}

function getNeighbor(index: number, dir: Dir): number | null {
const row = Math.floor(index / 4);
const col = index % 4;

if (dir === "top" && row > 0) return index - 4;
if (dir === "right" && col < 3) return index + 1;
if (dir === "bottom" && row < 3) return index + 4;
if (dir === "left" && col > 0) return index - 1;

return null;
}

function makeGeneratedPattern(seed: number): Tile[] {
const rand = seededRandom(seed);
const pattern: Tile[] = Array.from({ length: 16 }, () => ({ sides: [] }));

const visited = new Set<number>();
const stack = [0];
visited.add(0);

while (stack.length > 0) {
const current = stack[stack.length - 1];

const options = directions
.map((dir) => ({ dir, next: getNeighbor(current, dir) }))
.filter((x) => x.next !== null && !visited.has(x.next));

if (options.length === 0) {
stack.pop();
continue;
}

const pick = options[Math.floor(rand() * options.length)];
const next = pick.next as number;

pattern[current].sides.push(pick.dir);
pattern[next].sides.push(opposite[pick.dir]);

visited.add(next);
stack.push(next);
}

return pattern;
}

const levels: Tile[][] = [
baseLevel,
...Array.from({ length: 44 }, (_, i) => makeGeneratedPattern(i + 100)),
];

function makeLevel(pattern: Tile[], levelNumber = 0): Tile[] {
const scrambled = pattern.map((tile, index) => {
let t = { sides: [...tile.sides] as Dir[] };

let turns = ((index + 1) * (levelNumber + 2)) % 4;
if (turns === 0) turns = 1;

for (let i = 0; i < turns; i++) {
t = rotateTile(t);
}

return t;
});

const alreadySolved = scrambled.every((tile, i) =>
sameSides(tile.sides, pattern[i].sides)
);

if (alreadySolved) {
scrambled[0] = rotateTile(scrambled[0]);
}

return scrambled;
}

function playTone(type: "click" | "win" | "hint") {
try {
const AudioContextClass =
window.AudioContext || (window as any).webkitAudioContext;
const audio = new AudioContextClass();
const oscillator = audio.createOscillator();
const gain = audio.createGain();

oscillator.connect(gain);
gain.connect(audio.destination);

oscillator.type = "sine";
oscillator.frequency.value =
type === "win" ? 680 : type === "hint" ? 440 : 260;

gain.gain.setValueAtTime(0.08, audio.currentTime);
gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.16);

oscillator.start();
oscillator.stop(audio.currentTime + 0.16);
} catch {
// sound safely ignored if blocked
}
}

export default function Page() {
const [level, setLevel] = useState(0);
const [tiles, setTiles] = useState<Tile[]>(makeLevel(levels[0], 0));
const [moves, setMoves] = useState(0);
const [hintIndex, setHintIndex] = useState<number | null>(null);
const [showConfetti, setShowConfetti] = useState(false);

useEffect(() => {
const saved = localStorage.getItem("patternShiftProgress");
if (saved) {
const parsed = JSON.parse(saved);
const savedLevel = Math.min(parsed.level ?? 0, levels.length - 1);
setLevel(savedLevel);
setTiles(makeLevel(levels[savedLevel], savedLevel));
setMoves(0);
}
}, []);

const solved = tiles.every((tile, i) =>
sameSides(tile.sides, levels[level][i].sides)
);

useEffect(() => {
if (solved) {
playTone("win");
setShowConfetti(true);
setTimeout(() => setShowConfetti(false), 1400);
localStorage.setItem(
"patternShiftProgress",
JSON.stringify({ level })
);
}
}, [solved, level]);

function rotate(i: number) {
if (solved) return;

const copy = [...tiles];
copy[i] = rotateTile(copy[i]);
setTiles(copy);
setMoves((m) => m + 1);
setHintIndex(null);
playTone("click");
}

function nextLevel() {
const next = (level + 1) % levels.length;
setLevel(next);
setTiles(makeLevel(levels[next], next));
setMoves(0);
setHintIndex(null);
localStorage.setItem("patternShiftProgress", JSON.stringify({ level: next }));
}

function reset() {
setTiles(makeLevel(levels[level], level));
setMoves(0);
setHintIndex(null);
}

function hint() {
const wrongIndex = tiles.findIndex(
(tile, i) => !sameSides(tile.sides, levels[level][i].sides)
);

if (wrongIndex >= 0) {
setHintIndex(wrongIndex);
playTone("hint");
setTimeout(() => setHintIndex(null), 1600);
}
}

function restartProgress() {
localStorage.removeItem("patternShiftProgress");
setLevel(0);
setTiles(makeLevel(levels[0], 0));
setMoves(0);
setHintIndex(null);
}

const confettiPieces = useMemo(
() =>
Array.from({ length: 26 }, (_, i) => ({
left: `${(i * 37) % 100}%`,
delay: `${(i % 8) * 0.06}s`,
})),
[]
);

return (
<main style={styles.page}>
{showConfetti && (
<div style={styles.confettiWrap}>
{confettiPieces.map((piece, i) => (
<span
key={i}
style={{
...styles.confetti,
left: piece.left,
animationDelay: piece.delay,
}}
/>
))}
</div>
)}

<section style={styles.gameCard}>
<div style={styles.header}>
<div>
<h1 style={styles.title}>Pattern Shift</h1>
<p style={styles.subtitle}>
Rotate the tiles until every glowing line matches the hidden pattern.
</p>
</div>
<div style={styles.levelPill}>Level {level + 1}</div>
</div>

<div style={styles.grid}>
{tiles.map((tile, i) => (
<button
key={i}
onClick={() => rotate(i)}
style={{
...styles.tile,
...(hintIndex === i ? styles.hintTile : {}),
}}
aria-label={`Rotate tile ${i + 1}`}
>
<TileView tile={tile} />
</button>
))}
</div>
</section>

<aside style={styles.panel}>
<h2 style={styles.panelTitle}>Game Status</h2>

<div style={styles.stats}>
<div style={styles.statBox}>
<strong style={styles.statNumber}>{moves}</strong>
<span>Moves</span>
</div>

<div style={styles.statBox}>
<strong style={styles.statNumber}>{levels.length}</strong>
<span>Levels</span>
</div>
</div>

{solved ? (
<button onClick={nextLevel} style={styles.win}>
✓ Level Complete — Next
</button>
) : (
<div style={styles.wait}>Solve to Continue</div>
)}

<button onClick={hint} style={styles.secondary}>
Hint
</button>

<button onClick={reset} style={styles.secondary}>
Reset Level
</button>

<button onClick={restartProgress} style={styles.danger}>
Restart Game
</button>

<p style={styles.instructions}>
Tap a tile to rotate it. The level completes when all paths match the
correct pattern.
</p>
</aside>
</main>
);
}

function TileView({ tile }: { tile: Tile }) {
return (
<div style={styles.inner}>
<div style={styles.dot} />
{tile.sides.includes("top") && <div style={styles.topLine} />}
{tile.sides.includes("right") && <div style={styles.rightLine} />}
{tile.sides.includes("bottom") && <div style={styles.bottomLine} />}
{tile.sides.includes("left") && <div style={styles.leftLine} />}
</div>
);
}

const cyan = "#22d3ee";
const LINE = 18;

const styles: Record<string, React.CSSProperties> = {
page: {
minHeight: "100vh",
padding: "clamp(16px, 4vw, 48px)",
background:
"radial-gradient(circle at top left, #155e75 0%, #020617 45%, #020617 100%)",
color: "white",
fontFamily:
"-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif",
display: "flex",
justifyContent: "center",
alignItems: "flex-start",
gap: 28,
flexWrap: "wrap",
overflowX: "hidden",
},

gameCard: {
width: "min(100%, 620px)",
padding: "clamp(16px, 3vw, 28px)",
borderRadius: 30,
background: "rgba(15, 23, 42, 0.72)",
border: "1px solid rgba(148, 163, 184, 0.25)",
boxShadow: "0 30px 80px rgba(0,0,0,0.45)",
backdropFilter: "blur(14px)",
},

header: {
display: "flex",
justifyContent: "space-between",
gap: 16,
alignItems: "flex-start",
marginBottom: 20,
flexWrap: "wrap",
},

title: {
fontSize: "clamp(38px, 8vw, 60px)",
margin: 0,
fontWeight: 900,
letterSpacing: "-2px",
textShadow: "0 0 24px rgba(34,211,238,0.35)",
},

subtitle: {
color: "#cbd5e1",
margin: "8px 0 0",
fontSize: "clamp(14px, 3vw, 17px)",
lineHeight: 1.45,
},

levelPill: {
padding: "10px 16px",
borderRadius: 999,
color: "#a5f3fc",
background: "rgba(14,165,233,0.18)",
border: "1px solid rgba(34,211,238,0.35)",
fontWeight: 800,
boxShadow: "0 0 24px rgba(34,211,238,0.25)",
},

grid: {
display: "grid",
gridTemplateColumns: "repeat(4, minmax(64px, 120px))",
gap: "clamp(8px, 2vw, 14px)",
justifyContent: "center",
},

tile: {
aspectRatio: "1 / 1",
width: "100%",
borderRadius: 22,
border: "1px solid rgba(148,163,184,0.35)",
background:
"linear-gradient(145deg, rgba(51,65,85,0.95), rgba(15,23,42,0.95))",
position: "relative",
cursor: "pointer",
overflow: "hidden",
boxShadow:
"inset 0 1px 0 rgba(255,255,255,0.12), 0 12px 28px rgba(0,0,0,0.35)",
transition: "transform 140ms ease, box-shadow 140ms ease",
WebkitTapHighlightColor: "transparent",
},

hintTile: {
transform: "scale(1.06)",
boxShadow:
"0 0 0 3px rgba(251,191,36,0.9), 0 0 36px rgba(251,191,36,0.85)",
},

inner: {
position: "absolute",
inset: 0,
},

dot: {
width: "clamp(24px, 7vw, 34px)",
height: "clamp(24px, 7vw, 34px)",
borderRadius: "50%",
background: "linear-gradient(145deg, #ffffff, #dbeafe)",
position: "absolute",
left: "50%",
top: "50%",
transform: "translate(-50%,-50%)",
boxShadow:
"0 0 16px rgba(255,255,255,0.85), 0 0 30px rgba(34,211,238,0.9)",
zIndex: 5,
},

topLine: {
position: "absolute",
width: LINE,
height: "52%",
left: "50%",
top: 0,
transform: "translateX(-50%)",
background: cyan,
borderRadius: 999,
boxShadow: "0 0 12px rgba(34,211,238,1), 0 0 26px rgba(34,211,238,0.9)",
},

bottomLine: {
position: "absolute",
width: LINE,
height: "52%",
left: "50%",
bottom: 0,
transform: "translateX(-50%)",
background: cyan,
borderRadius: 999,
boxShadow: "0 0 12px rgba(34,211,238,1), 0 0 26px rgba(34,211,238,0.9)",
},

leftLine: {
position: "absolute",
height: LINE,
width: "52%",
left: 0,
top: "50%",
transform: "translateY(-50%)",
background: cyan,
borderRadius: 999,
boxShadow: "0 0 12px rgba(34,211,238,1), 0 0 26px rgba(34,211,238,0.9)",
},

rightLine: {
position: "absolute",
height: LINE,
width: "52%",
right: 0,
top: "50%",
transform: "translateY(-50%)",
background: cyan,
borderRadius: 999,
boxShadow: "0 0 12px rgba(34,211,238,1), 0 0 26px rgba(34,211,238,0.9)",
},

panel: {
width: "min(100%, 330px)",
padding: 26,
borderRadius: 28,
background: "rgba(15,23,42,0.78)",
border: "1px solid rgba(148,163,184,0.25)",
boxShadow: "0 30px 80px rgba(0,0,0,0.45)",
backdropFilter: "blur(14px)",
},

panelTitle: {
margin: "0 0 18px",
fontSize: 30,
},

stats: {
display: "grid",
gridTemplateColumns: "1fr 1fr",
gap: 12,
marginBottom: 16,
},

statBox: {
padding: 16,
borderRadius: 18,
background: "rgba(30,41,59,0.85)",
border: "1px solid rgba(148,163,184,0.18)",
display: "flex",
flexDirection: "column",
gap: 4,
color: "#cbd5e1",
},

statNumber: {
color: "white",
fontSize: 30,
},

wait: {
background: "linear-gradient(135deg, #22d3ee, #06b6d4)",
color: "#020617",
padding: 16,
borderRadius: 16,
textAlign: "center",
fontWeight: 900,
boxShadow: "0 0 30px rgba(34,211,238,0.45)",
marginBottom: 12,
},

win: {
width: "100%",
background: "linear-gradient(135deg, #10b981, #059669)",
color: "white",
border: "none",
borderRadius: 16,
padding: 16,
fontWeight: 900,
cursor: "pointer",
boxShadow: "0 0 30px rgba(16,185,129,0.45)",
marginBottom: 12,
},

secondary: {
width: "100%",
marginTop: 10,
padding: 13,
borderRadius: 14,
border: "1px solid rgba(148,163,184,0.35)",
background: "rgba(51,65,85,0.9)",
color: "white",
cursor: "pointer",
fontWeight: 800,
},

danger: {
width: "100%",
marginTop: 10,
padding: 13,
borderRadius: 14,
border: "1px solid rgba(248,113,113,0.45)",
background: "rgba(127,29,29,0.45)",
color: "#fecaca",
cursor: "pointer",
fontWeight: 800,
},

instructions: {
marginTop: 18,
color: "#cbd5e1",
lineHeight: 1.45,
fontSize: 14,
},

confettiWrap: {
pointerEvents: "none",
position: "fixed",
inset: 0,
overflow: "hidden",
zIndex: 20,
},

confetti: {
position: "absolute",
top: -20,
width: 10,
height: 18,
borderRadius: 3,
background: cyan,
animation: "fall 1.4s ease-in forwards",
boxShadow: "0 0 16px rgba(34,211,238,0.9)",
},
};