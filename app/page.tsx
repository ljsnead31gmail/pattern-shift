"use client";

import { useState } from "react";

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

// ===== BASE LEVEL
const baseLevel: Tile[] = [
{ sides: ["right", "bottom"] }, { sides: ["left", "right"] }, { sides: ["left", "right"] }, { sides: ["left", "bottom"] },
{ sides: ["top", "bottom"] }, { sides: ["right", "bottom"] }, { sides: ["left", "bottom"] }, { sides: ["top", "bottom"] },
{ sides: ["top", "bottom"] }, { sides: ["top", "right"] }, { sides: ["top", "left"] }, { sides: ["top", "bottom"] },
{ sides: ["top", "right"] }, { sides: ["left", "right"] }, { sides: ["left", "right"] }, { sides: ["top", "left"] },
];

// ===== RANDOM GENERATOR
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

// ===== SCRAMBLE
function makeLevel(pattern: Tile[], levelNumber = 0): Tile[] {
let scrambled = pattern.map((tile, index) => {
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

// ===== GAME
export default function Page() {
const [level, setLevel] = useState(0);
const [tiles, setTiles] = useState(makeLevel(levels[0], 0));
const [moves, setMoves] = useState(0);

const solved = tiles.every((tile, i) =>
sameSides(tile.sides, levels[level][i].sides)
);

function rotate(i: number) {
if (solved) return;
const copy = [...tiles];
copy[i] = rotateTile(copy[i]);
setTiles(copy);
setMoves((m) => m + 1);
}

function nextLevel() {
const next = (level + 1) % levels.length;
setLevel(next);
setTiles(makeLevel(levels[next], next));
setMoves(0);
}

function reset() {
setTiles(makeLevel(levels[level], level));
setMoves(0);
}

return (
<main style={styles.page}>
<div>
<h1 style={styles.title}>Pattern Shift</h1>

<div style={styles.grid}>
{tiles.map((tile, i) => (
<button key={i} onClick={() => rotate(i)} style={styles.tile}>
<TileView tile={tile} />
</button>
))}
</div>
</div>

<div style={styles.panel}>
<h2>Level {level + 1}</h2>
<p>Moves: {moves}</p>
<p>Total Levels: {levels.length}</p>

{solved ? (
<button onClick={nextLevel} style={styles.win}>
✓ Next Level
</button>
) : (
<div style={styles.wait}>Solve to Continue</div>
)}

<button onClick={reset} style={styles.reset}>
Reset
</button>
</div>
</main>
);
}

// ===== TILE UI
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

// ===== MODERN STYLES
const cyan = "#22d3ee";
const LINE = 18;

const styles: any = {
page: {
display: "flex",
gap: 40,
padding: 50,
background:
"radial-gradient(circle at top left, #164e63 0%, #020617 50%, #020617 100%)",
color: "white",
minHeight: "100vh",
fontFamily:
"-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial",
},

title: {
fontSize: 60,
fontWeight: 900,
marginBottom: 20,
textShadow: "0 0 25px rgba(34,211,238,0.4)",
},

grid: {
display: "grid",
gridTemplateColumns: "repeat(4,120px)",
gap: 14,
padding: 20,
borderRadius: 30,
background: "rgba(15,23,42,0.7)",
boxShadow: "0 30px 80px rgba(0,0,0,0.5)",
backdropFilter: "blur(10px)",
},

tile: {
width: 120,
height: 120,
borderRadius: 22,
background: "linear-gradient(145deg,#334155,#0f172a)",
border: "1px solid rgba(148,163,184,0.3)",
position: "relative",
cursor: "pointer",
},

inner: { position: "absolute", inset: 0 },

dot: {
width: 34,
height: 34,
borderRadius: "50%",
background: "white",
position: "absolute",
left: "50%",
top: "50%",
transform: "translate(-50%,-50%)",
boxShadow: "0 0 20px #22d3ee",
},

topLine: {
position: "absolute",
width: LINE,
height: "50%",
left: "50%",
top: 0,
transform: "translateX(-50%)",
background: cyan,
borderRadius: 999,
boxShadow: "0 0 20px #22d3ee",
},

bottomLine: {
position: "absolute",
width: LINE,
height: "50%",
left: "50%",
bottom: 0,
transform: "translateX(-50%)",
background: cyan,
borderRadius: 999,
boxShadow: "0 0 20px #22d3ee",
},

leftLine: {
position: "absolute",
height: LINE,
width: "50%",
left: 0,
top: "50%",
transform: "translateY(-50%)",
background: cyan,
borderRadius: 999,
boxShadow: "0 0 20px #22d3ee",
},

rightLine: {
position: "absolute",
height: LINE,
width: "50%",
right: 0,
top: "50%",
transform: "translateY(-50%)",
background: cyan,
borderRadius: 999,
boxShadow: "0 0 20px #22d3ee",
},

panel: {
width: 300,
padding: 25,
borderRadius: 25,
background: "rgba(15,23,42,0.75)",
boxShadow: "0 30px 80px rgba(0,0,0,0.5)",
},

win: {
width: "100%",
background: "linear-gradient(135deg,#10b981,#059669)",
padding: 16,
borderRadius: 14,
border: "none",
marginTop: 15,
color: "white",
fontWeight: 700,
cursor: "pointer",
},

wait: {
background: "linear-gradient(135deg,#22d3ee,#06b6d4)",
color: "#020617",
padding: 16,
borderRadius: 14,
marginTop: 15,
textAlign: "center",
fontWeight: 700,
},

reset: {
marginTop: 12,
padding: 12,
borderRadius: 12,
background: "#334155",
color: "white",
border: "none",
cursor: "pointer",
},
};