"use client";

import { useEffect, useMemo, useState } from "react";

type GameState = "ready" | "player" | "ai" | "roundOver" | "complete" | "failed";
type Die = {
id: number;
value: number;
locked: boolean;
};

const TOTAL_LEVELS = 45;
const STARTING_HEALTH = 30;

// 🔥 UPDATED: SAME DICE COUNT FOR BOTH
function levelSettings(level: number) {
const diceCount = Math.min(3 + Math.floor(level / 8), 6);

return {
aiHealth: 22 + level * 4,
diceCount,
playerDice: diceCount,
aiDice: diceCount,
rerolls: Math.max(3 - Math.floor(level / 16), 1),
aiBonus: Math.floor(level / 6),
};
}

function rollValue() {
return Math.floor(Math.random() * 6) + 1;
}

function makeDice(count: number): Die[] {
return Array.from({ length: count }, (_, i) => ({
id: i,
value: rollValue(),
locked: false,
}));
}

function sumDice(dice: Die[]) {
return dice.reduce((sum, die) => sum + die.value, 0);
}

function scoreDice(dice: Die[]) {
const total = sumDice(dice);

const counts = dice.reduce<Record<number, number>>((acc, die) => {
acc[die.value] = (acc[die.value] ?? 0) + 1;
return acc;
}, {});

const maxMatch = Math.max(...Object.values(counts));

const hasStraight =
[1, 2, 3, 4, 5].every((n) => counts[n]) ||
[2, 3, 4, 5, 6].every((n) => counts[n]);

let bonus = 0;
let label = "Roll";

if (hasStraight) {
bonus = 14;
label = "Straight!";
} else if (maxMatch >= 5) {
bonus = 24;
label = "Five!";
} else if (maxMatch === 4) {
bonus = 16;
label = "Four!";
} else if (maxMatch === 3) {
bonus = 9;
label = "Triple!";
} else if (maxMatch === 2) {
bonus = 4;
label = "Pair!";
}

return { damage: total + bonus, label };
}

export default function Page() {
const [level, setLevel] = useState(1);
const settings = useMemo(() => levelSettings(level), [level]);

const [state, setState] = useState<GameState>("ready");
const [playerHealth, setPlayerHealth] = useState(STARTING_HEALTH);
const [aiHealth, setAiHealth] = useState(settings.aiHealth);

const [playerDice, setPlayerDice] = useState<Die[]>(
makeDice(settings.playerDice)
);
const [aiDice, setAiDice] = useState<Die[]>(makeDice(settings.aiDice));

const [rerollsLeft, setRerollsLeft] = useState(settings.rerolls);
const [message, setMessage] = useState("Start the duel");

useEffect(() => {
setAiHealth(settings.aiHealth);
setPlayerDice(makeDice(settings.playerDice));
setAiDice(makeDice(settings.aiDice));
setRerollsLeft(settings.rerolls);
}, [settings]);

function startDuel() {
setPlayerHealth(STARTING_HEALTH);
setAiHealth(settings.aiHealth);
setPlayerDice(makeDice(settings.playerDice));
setAiDice(makeDice(settings.aiDice));
setRerollsLeft(settings.rerolls);
setState("player");
setMessage("Lock dice or reroll");
}

function toggleLock(id: number) {
if (state !== "player") return;

setPlayerDice((dice) =>
dice.map((d) =>
d.id === id ? { ...d, locked: !d.locked } : d
)
);
}

function reroll() {
if (state !== "player" || rerollsLeft <= 0) return;

setPlayerDice((dice) =>
dice.map((d) =>
d.locked ? d : { ...d, value: rollValue() }
)
);

setRerollsLeft((r) => r - 1);
}

function playerAttack() {
const result = scoreDice(playerDice);

const nextAI = Math.max(0, aiHealth - result.damage);
setAiHealth(nextAI);

if (nextAI <= 0) {
setState("complete");
setMessage("You win!");
return;
}

setState("ai");

setTimeout(aiTurn, 800);
}

function aiTurn() {
const rolled = makeDice(settings.aiDice);
const result = scoreDice(rolled);

const dmg = result.damage + settings.aiBonus;

const nextPlayer = Math.max(0, playerHealth - dmg);
setPlayerHealth(nextPlayer);
setAiDice(rolled);

if (nextPlayer <= 0) {
setState("failed");
setMessage("You lost!");
return;
}

setState("roundOver");
}

function nextRound() {
setPlayerDice(makeDice(settings.playerDice));
setRerollsLeft(settings.rerolls);
setState("player");
}

function nextLevel() {
setLevel((l) => Math.min(l + 1, TOTAL_LEVELS));
setState("ready");
}

function reset() {
setState("ready");
setPlayerHealth(STARTING_HEALTH);
setAiHealth(settings.aiHealth);
setPlayerDice(makeDice(settings.playerDice));
setAiDice(makeDice(settings.aiDice));
setRerollsLeft(settings.rerolls);
}

return (
<main style={styles.page}>
<div style={styles.card}>
<h1>Dice Duel</h1>

<div style={styles.healthRow}>
<div>You: {playerHealth}</div>
<div>AI: {aiHealth}</div>
</div>

<div style={styles.section}>
<h3>Your Dice</h3>
<div style={styles.row}>
{playerDice.map((d) => (
<button
key={d.id}
onClick={() => toggleLock(d.id)}
style={{
...styles.die,
background: d.locked ? "#22c55e" : "#fb923c",
}}
>
{d.value}
</button>
))}
</div>
</div>

<div style={styles.section}>
<h3>AI Dice</h3>
<div style={styles.row}>
{aiDice.map((d) => (
<div key={d.id} style={styles.die}>
{d.value}
</div>
))}
</div>
</div>

<p>{message}</p>

{state === "ready" && (
<button onClick={startDuel}>Start</button>
)}

{state === "player" && (
<>
<button onClick={reroll}>Reroll ({rerollsLeft})</button>
<button onClick={playerAttack}>Attack</button>
</>
)}

{state === "roundOver" && (
<button onClick={nextRound}>Next Round</button>
)}

{state === "complete" && (
<button onClick={nextLevel}>Next Level</button>
)}

{state === "failed" && (
<button onClick={reset}>Retry</button>
)}
</div>
</main>
);
}

const styles: any = {
page: {
minHeight: "100vh",
background: "#020617",
color: "white",
display: "flex",
justifyContent: "center",
alignItems: "center",
},
card: {
padding: 30,
borderRadius: 20,
background: "#0f172a",
width: 400,
},
row: {
display: "flex",
gap: 10,
marginTop: 10,
},
die: {
width: 60,
height: 60,
borderRadius: 12,
background: "#fb923c",
display: "flex",
justifyContent: "center",
alignItems: "center",
fontSize: 24,
},
healthRow: {
display: "flex",
justifyContent: "space-between",
},
section: {
marginTop: 20,
},
};