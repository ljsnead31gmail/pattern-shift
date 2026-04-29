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

function levelSettings(level: number) {
return {
aiHealth: 22 + level * 4,
aiDice: Math.min(2 + Math.floor(level / 7), 6),
playerDice: Math.min(3 + Math.floor(level / 10), 6),
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
let label = "Basic Roll";

if (hasStraight) {
bonus = 14;
label = "Straight!";
} else if (maxMatch >= 5) {
bonus = 24;
label = "Five of a Kind!";
} else if (maxMatch === 4) {
bonus = 16;
label = "Four of a Kind!";
} else if (maxMatch === 3) {
bonus = 9;
label = "Triple!";
} else if (maxMatch === 2) {
bonus = 4;
label = "Pair!";
}

return { damage: total + bonus, total, bonus, label };
}

export default function Page() {
const [level, setLevel] = useState(1);
const settings = useMemo(() => levelSettings(level), [level]);

const [state, setState] = useState<GameState>("ready");
const [playerHealth, setPlayerHealth] = useState(STARTING_HEALTH);
const [aiHealth, setAiHealth] = useState(settings.aiHealth);
const [playerDice, setPlayerDice] = useState<Die[]>(makeDice(settings.playerDice));
const [aiDice, setAiDice] = useState<Die[]>(makeDice(settings.aiDice));
const [rerollsLeft, setRerollsLeft] = useState(settings.rerolls);
const [round, setRound] = useState(1);
const [message, setMessage] = useState("Tap Start Duel");

useEffect(() => {
const saved = localStorage.getItem("diceDuelLevel");
if (saved) {
const savedLevel = Math.min(Number(saved), TOTAL_LEVELS);
setLevel(savedLevel);
}
}, []);

useEffect(() => {
setAiHealth(settings.aiHealth);
setPlayerDice(makeDice(settings.playerDice));
setAiDice(makeDice(settings.aiDice));
setRerollsLeft(settings.rerolls);
}, [settings.aiDice, settings.aiHealth, settings.playerDice, settings.rerolls]);

function startDuel() {
setPlayerHealth(STARTING_HEALTH);
setAiHealth(settings.aiHealth);
setPlayerDice(makeDice(settings.playerDice));
setAiDice(makeDice(settings.aiDice));
setRerollsLeft(settings.rerolls);
setRound(1);
setMessage("Lock dice you like, reroll the rest, then attack.");
setState("player");
}

function toggleLock(id: number) {
if (state !== "player") return;

setPlayerDice((dice) =>
dice.map((die) =>
die.id === id ? { ...die, locked: !die.locked } : die
)
);
}

function rerollUnlocked() {
if (state !== "player" || rerollsLeft <= 0) return;

setPlayerDice((dice) =>
dice.map((die) =>
die.locked ? die : { ...die, value: rollValue() }
)
);

setRerollsLeft((r) => r - 1);
setMessage("Rerolled unlocked dice.");
}

function playerAttack() {
if (state !== "player") return;

const result = scoreDice(playerDice);
const nextAiHealth = Math.max(0, aiHealth - result.damage);

setAiHealth(nextAiHealth);
setMessage(`${result.label} You dealt ${result.damage} damage.`);

if (nextAiHealth <= 0) {
setState("complete");
setMessage("You won the duel!");
localStorage.setItem("diceDuelLevel", String(level));
return;
}

setState("ai");

setTimeout(() => {
aiTurn();
}, 900);
}

function aiTurn() {
const rolled = makeDice(settings.aiDice);
const result = scoreDice(rolled);
const damage = result.damage + settings.aiBonus;
const nextPlayerHealth = Math.max(0, playerHealth - damage);

setAiDice(rolled);
setPlayerHealth(nextPlayerHealth);
setMessage(`AI used ${result.label} and dealt ${damage} damage.`);

if (nextPlayerHealth <= 0) {
setState("failed");
setMessage("You lost the duel. Try again.");
return;
}

setState("roundOver");
}

function nextRound() {
setRound((r) => r + 1);
setPlayerDice(makeDice(settings.playerDice));
setRerollsLeft(settings.rerolls);
setMessage("New round. Lock dice, reroll, then attack.");
setState("player");
}

function nextLevel() {
const next = Math.min(level + 1, TOTAL_LEVELS);
setLevel(next);
localStorage.setItem("diceDuelLevel", String(next));
setState("ready");
setMessage("Tap Start Duel");
}

function resetLevel() {
setState("ready");
setPlayerHealth(STARTING_HEALTH);
setAiHealth(settings.aiHealth);
setPlayerDice(makeDice(settings.playerDice));
setAiDice(makeDice(settings.aiDice));
setRerollsLeft(settings.rerolls);
setRound(1);
setMessage("Tap Start Duel");
}

function restartGame() {
setLevel(1);
localStorage.setItem("diceDuelLevel", "1");
setState("ready");
setPlayerHealth(STARTING_HEALTH);
setAiHealth(levelSettings(1).aiHealth);
setPlayerDice(makeDice(levelSettings(1).playerDice));
setAiDice(makeDice(levelSettings(1).aiDice));
setRerollsLeft(levelSettings(1).rerolls);
setRound(1);
setMessage("Tap Start Duel");
}

const playerScore = scoreDice(playerDice);
const aiScore = scoreDice(aiDice);

return (
<main style={styles.page}>
<section style={styles.card}>
<a href="/" style={styles.back}>
← Arcade
</a>

<div style={styles.header}>
<div>
<h1 style={styles.title}>Dice Duel</h1>
<p style={styles.subtitle}>
Lock dice, reroll the rest, and outscore the AI before it knocks you out.
</p>
</div>

<div style={styles.levelBadge}>
Level {level}/{TOTAL_LEVELS}
</div>
</div>

<div style={styles.healthRow}>
<HealthBox label="You" health={playerHealth} max={STARTING_HEALTH} />
<HealthBox label="AI" health={aiHealth} max={settings.aiHealth} />
</div>

<div style={styles.board}>
<div style={styles.side}>
<h2 style={styles.sideTitle}>Your Dice</h2>
<div style={styles.diceRow}>
{playerDice.map((die) => (
<button
key={die.id}
onClick={() => toggleLock(die.id)}
style={{
...styles.die,
...(die.locked ? styles.lockedDie : {}),
}}
>
{die.value}
</button>
))}
</div>
<p style={styles.scoreText}>
{playerScore.label}: {playerScore.damage} damage
</p>
</div>

<div style={styles.side}>
<h2 style={styles.sideTitle}>AI Dice</h2>
<div style={styles.diceRow}>
{aiDice.map((die) => (
<div key={die.id} style={{ ...styles.die, ...styles.aiDie }}>
{die.value}
</div>
))}
</div>
<p style={styles.scoreText}>
{aiScore.label}: {aiScore.damage + settings.aiBonus} damage
</p>
</div>
</div>

<div style={styles.status}>{message}</div>

<div style={styles.stats}>
<div style={styles.statBox}>
<strong>{round}</strong>
<span>Round</span>
</div>
<div style={styles.statBox}>
<strong>{rerollsLeft}</strong>
<span>Rerolls</span>
</div>
<div style={styles.statBox}>
<strong>{settings.aiBonus}</strong>
<span>AI Bonus</span>
</div>
</div>

{state === "ready" && (
<button onClick={startDuel} style={styles.primary}>
Start Duel
</button>
)}

{state === "player" && (
<>
<button
onClick={rerollUnlocked}
style={{
...styles.secondary,
opacity: rerollsLeft <= 0 ? 0.5 : 1,
}}
>
Reroll Unlocked Dice
</button>
<button onClick={playerAttack} style={styles.primary}>
Attack
</button>
</>
)}

{state === "ai" && (
<button style={styles.disabled}>AI Thinking...</button>
)}

{state === "roundOver" && (
<button onClick={nextRound} style={styles.primary}>
Next Round
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

function HealthBox({
label,
health,
max,
}: {
label: string;
health: number;
max: number;
}) {
const percent = Math.max(0, Math.min(100, (health / max) * 100));

return (
<div style={styles.healthBox}>
<div style={styles.healthTop}>
<strong>{label}</strong>
<span>
{health}/{max}
</span>
</div>
<div style={styles.healthTrack}>
<div style={{ ...styles.healthFill, width: `${percent}%` }} />
</div>
</div>
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
width: "min(980px, 100%)",
padding: "clamp(18px, 4vw, 34px)",
borderRadius: 32,
background: "rgba(15,23,42,0.84)",
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

healthRow: {
marginTop: 24,
display: "grid",
gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
gap: 14,
},

healthBox: {
borderRadius: 18,
padding: 16,
background: "rgba(30,41,59,0.86)",
border: "1px solid rgba(251,146,60,0.18)",
},

healthTop: {
display: "flex",
justifyContent: "space-between",
marginBottom: 10,
},

healthTrack: {
height: 12,
borderRadius: 999,
background: "rgba(255,255,255,0.12)",
overflow: "hidden",
},

healthFill: {
height: "100%",
borderRadius: 999,
background: "linear-gradient(90deg, #fb923c, #fed7aa)",
transition: "width 180ms ease",
},

board: {
marginTop: 24,
display: "grid",
gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
gap: 18,
},

side: {
padding: 18,
borderRadius: 24,
background: "rgba(2,6,23,0.45)",
border: "1px solid rgba(251,146,60,0.18)",
},

sideTitle: {
margin: "0 0 14px",
},

diceRow: {
display: "flex",
flexWrap: "wrap",
gap: 12,
},

die: {
width: 64,
height: 64,
borderRadius: 18,
border: "2px solid rgba(255,255,255,0.65)",
background: "linear-gradient(145deg, #fed7aa, #fb923c)",
color: "#431407",
fontSize: 32,
fontWeight: 950,
cursor: "pointer",
boxShadow: "0 0 30px rgba(251,146,60,0.45)",
transition: "transform 140ms ease, opacity 140ms ease",
},

lockedDie: {
transform: "scale(0.92)",
background: "linear-gradient(145deg, #bbf7d0, #22c55e)",
},

aiDie: {
cursor: "default",
background: "linear-gradient(145deg, #fecaca, #ef4444)",
},

scoreText: {
color: "#ffedd5",
fontWeight: 800,
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

disabled: {
width: "100%",
marginTop: 18,
padding: 16,
borderRadius: 18,
border: "1px solid rgba(251,146,60,0.35)",
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