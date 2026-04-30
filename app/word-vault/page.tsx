"use client";

import { useEffect, useMemo, useState } from "react";

type GameState = "ready" | "playing" | "complete" | "failed";

type WordItem = {
word: string;
category: string;
clue: string;
};

const TOTAL_LEVELS = 45;

const WORDS: WordItem[] = [
{ word: "APPLE", category: "Food", clue: "A common fruit." },
{ word: "BRAIN", category: "Body", clue: "Used for thinking." },
{ word: "CHAIR", category: "Object", clue: "You sit on it." },
{ word: "DREAM", category: "Mind", clue: "It happens while sleeping." },
{ word: "EARTH", category: "Space", clue: "Our planet." },
{ word: "FLAME", category: "Energy", clue: "A small fire." },
{ word: "GRASS", category: "Nature", clue: "Green ground cover." },
{ word: "HEART", category: "Body", clue: "It pumps blood." },
{ word: "IMAGE", category: "Art", clue: "A picture or visual." },
{ word: "JELLY", category: "Food", clue: "A sweet spread." },
{ word: "KNIFE", category: "Tool", clue: "Used for cutting." },
{ word: "LIGHT", category: "Energy", clue: "It helps you see." },
{ word: "MONEY", category: "Finance", clue: "Used to buy things." },
{ word: "NIGHT", category: "Time", clue: "When the sky is dark." },
{ word: "OCEAN", category: "Nature", clue: "A huge body of water." },
{ word: "POWER", category: "Energy", clue: "Strength or electricity." },
{ word: "QUEST", category: "Adventure", clue: "A mission or journey." },
{ word: "ROBOT", category: "Technology", clue: "A machine that acts." },
{ word: "SOUND", category: "Sense", clue: "Something you hear." },
{ word: "TABLE", category: "Object", clue: "Furniture with a flat top." },
{ word: "UNITY", category: "Idea", clue: "Being together." },
{ word: "VOICE", category: "Sound", clue: "Used to speak." },
{ word: "WORLD", category: "Place", clue: "The place we live." },
{ word: "YOUTH", category: "Age", clue: "A young stage of life." },
{ word: "ZEBRA", category: "Animal", clue: "Striped animal." },
{ word: "ANCHOR", category: "Object", clue: "Keeps a boat in place." },
{ word: "BOTTLE", category: "Object", clue: "Holds liquid." },
{ word: "CASTLE", category: "Place", clue: "A fortified royal home." },
{ word: "DANGER", category: "Warning", clue: "Something unsafe." },
{ word: "ENGINE", category: "Machine", clue: "Powers a vehicle." },
{ word: "FOREST", category: "Nature", clue: "Many trees together." },
{ word: "GARDEN", category: "Nature", clue: "A place where plants grow." },
{ word: "HUNTER", category: "Role", clue: "One who searches prey." },
{ word: "ISLAND", category: "Place", clue: "Land surrounded by water." },
{ word: "JACKET", category: "Clothing", clue: "Worn over a shirt." },
{ word: "KERNEL", category: "Food", clue: "A seed or core." },
{ word: "LEGEND", category: "Story", clue: "A famous tale." },
{ word: "MARKET", category: "Place", clue: "Where goods are sold." },
{ word: "NUMBER", category: "Math", clue: "Used for counting." },
{ word: "ORANGE", category: "Food", clue: "A citrus fruit." },
{ word: "PLANET", category: "Space", clue: "It orbits a star." },
{ word: "QUIVER", category: "Object", clue: "Holds arrows." },
{ word: "REWARD", category: "Prize", clue: "Given for success." },
{ word: "SILVER", category: "Metal", clue: "A shiny precious metal." },
{ word: "TARGET", category: "Goal", clue: "Something aimed at." },
{ word: "UNLOCK", category: "Action", clue: "To open access." },
{ word: "VISION", category: "Sense", clue: "Ability to see." },
{ word: "WEAPON", category: "Object", clue: "Used in combat." },
{ word: "YELLOW", category: "Color", clue: "The color of sunshine." },
{ word: "ZODIAC", category: "Astrology", clue: "A circle of signs." },
{ word: "BALANCE", category: "Idea", clue: "Keeping things even." },
{ word: "CAPTAIN", category: "Role", clue: "Leader of a ship or team." },
{ word: "DELIGHT", category: "Feeling", clue: "Great happiness." },
{ word: "ELEMENT", category: "Science", clue: "A basic substance." },
{ word: "FANTASY", category: "Story", clue: "Often includes magic." },
{ word: "GENERAL", category: "Role", clue: "A high military rank." },
{ word: "HARVEST", category: "Farming", clue: "Gathering crops." },
{ word: "INSIGHT", category: "Mind", clue: "A deep understanding." },
{ word: "JOURNEY", category: "Travel", clue: "A long trip." },
{ word: "KINGDOM", category: "Place", clue: "A land ruled by a monarch." },
{ word: "LIBRARY", category: "Place", clue: "A place full of books." },
{ word: "MYSTERY", category: "Story", clue: "Something unknown to solve." },
{ word: "NETWORK", category: "Technology", clue: "Connected systems." },
{ word: "OFFLINE", category: "Technology", clue: "Not connected." },
{ word: "PACKAGE", category: "Object", clue: "Something delivered." },
{ word: "QUALITY", category: "Measure", clue: "How good something is." },
{ word: "RESCUE", category: "Action", clue: "Saving someone." },
{ word: "SCIENCE", category: "Study", clue: "Knowledge through testing." },
{ word: "THEATER", category: "Place", clue: "Where shows are performed." },
{ word: "UNKNOWN", category: "Mystery", clue: "Not yet identified." },
{ word: "VARIANT", category: "Type", clue: "A different version." },
{ word: "WEATHER", category: "Nature", clue: "Rain, sun, wind, etc." },
{ word: "ZEPHYR", category: "Nature", clue: "A gentle breeze." },
{ word: "ARTICLE", category: "Writing", clue: "A written piece." },
{ word: "BENEATH", category: "Position", clue: "Under something." },
{ word: "CENTURY", category: "Time", clue: "One hundred years." },
{ word: "DIGITAL", category: "Technology", clue: "Electronic or computer-based." },
{ word: "EXAMPLE", category: "Idea", clue: "A sample or model." },
{ word: "FREEDOM", category: "Idea", clue: "Being free." },
{ word: "GROWTH", category: "Change", clue: "Increase over time." },
{ word: "HARMONY", category: "Music", clue: "Sounds that fit together." },
{ word: "INITIAL", category: "Order", clue: "First or beginning." },
{ word: "JOURNAL", category: "Writing", clue: "A written record." },
{ word: "KINDNESS", category: "Trait", clue: "Being caring." },
{ word: "LEADING", category: "Action", clue: "Guiding others." },
{ word: "MISSION", category: "Goal", clue: "A task or purpose." },
{ word: "NATURAL", category: "Nature", clue: "Not artificial." },
{ word: "ORBITAL", category: "Space", clue: "Related to orbiting." },
{ word: "PIONEER", category: "Role", clue: "First to explore or create." },
{ word: "QUANTUM", category: "Science", clue: "Very small-scale physics." },
{ word: "REALITY", category: "Idea", clue: "What is real." },
{ word: "STATION", category: "Place", clue: "A stop or base." },
{ word: "TREASURE", category: "Adventure", clue: "Hidden riches." },
{ word: "UPGRADE", category: "Action", clue: "Make better." },
{ word: "VICTORY", category: "Result", clue: "Winning." },
{ word: "WORKING", category: "Action", clue: "Doing a job." },
{ word: "YOUTHFUL", category: "Trait", clue: "Young in spirit." },
{ word: "ZONING", category: "Planning", clue: "Rules for land use." },
{ word: "ADVENTURE", category: "Story", clue: "An exciting journey." },
{ word: "BLUEPRINT", category: "Design", clue: "A building plan." },
{ word: "CROSSING", category: "Travel", clue: "A place to pass over." },
{ word: "DYNAMICS", category: "Motion", clue: "Forces and movement." },
{ word: "ELEVATOR", category: "Machine", clue: "Moves between floors." },
{ word: "FOOTPRINT", category: "Trace", clue: "A mark left by a foot." },
{ word: "GRAPHICS", category: "Design", clue: "Visual images." },
{ word: "HEADLINE", category: "Writing", clue: "Title of a news story." },
{ word: "IDENTITY", category: "Person", clue: "Who someone is." },
{ word: "KEYBOARD", category: "Technology", clue: "Used to type." },
{ word: "LANGUAGE", category: "Communication", clue: "Used to speak or write." },
{ word: "MIDNIGHT", category: "Time", clue: "12:00 at night." },
{ word: "NOTEBOOK", category: "Object", clue: "Used for writing notes." },
{ word: "OBSERVER", category: "Role", clue: "One who watches." },
{ word: "PLATFORM", category: "Technology", clue: "A base system or stage." },
{ word: "QUESTION", category: "Language", clue: "Something asked." },
{ word: "RECOVERY", category: "Action", clue: "Returning to normal." },
{ word: "SECURITY", category: "Safety", clue: "Protection from harm." },
{ word: "TRANSFER", category: "Action", clue: "Moving from one place to another." },
{ word: "ULTIMATE", category: "Level", clue: "Final or greatest." },
{ word: "VACATION", category: "Travel", clue: "Time away from work." },
{ word: "WILDLIFE", category: "Nature", clue: "Animals in nature." },
{ word: "YARDSTICK", category: "Tool", clue: "Used to measure." },
{ word: "ACTIVITY", category: "Action", clue: "Something being done." },
{ word: "BREAKING", category: "Action", clue: "Coming apart." },
{ word: "CHALLENGE", category: "Game", clue: "A difficult task." },
{ word: "DISCOVERY", category: "Finding", clue: "Finding something new." },
{ word: "EQUATION", category: "Math", clue: "A math statement." },
{ word: "FOCUSING", category: "Mind", clue: "Concentrating." },
{ word: "GRAVITY", category: "Science", clue: "Force that pulls things down." },
{ word: "HIGHLIGHT", category: "Action", clue: "Make something stand out." },
{ word: "INVENTION", category: "Creation", clue: "Something newly made." },
{ word: "JUNCTION", category: "Place", clue: "Where things meet." },
{ word: "KNOWLEDGE", category: "Mind", clue: "Information understood." },
{ word: "LIFETIME", category: "Time", clue: "Duration of life." },
{ word: "MOUNTAIN", category: "Nature", clue: "A very high landform." },
{ word: "NAVIGATE", category: "Travel", clue: "Find a path." },
{ word: "ORGANIZE", category: "Action", clue: "Put in order." },
{ word: "POSITION", category: "Place", clue: "Where something is located." },
{ word: "QUANTITY", category: "Measure", clue: "An amount." },
{ word: "REFLECT", category: "Action", clue: "Bounce back or think deeply." },
{ word: "STRATEGY", category: "Plan", clue: "A plan to win." },
{ word: "THINKING", category: "Mind", clue: "Using your brain." },
{ word: "UNIVERSE", category: "Space", clue: "Everything that exists." },
{ word: "VISUALIZE", category: "Mind", clue: "Picture in your mind." },
{ word: "WORKFLOW", category: "Process", clue: "Steps in work." },
{ word: "YESTERDAY", category: "Time", clue: "The day before today." },
{ word: "ALGORITHM", category: "Technology", clue: "A step-by-step procedure." },
{ word: "BRILLIANT", category: "Trait", clue: "Very smart or bright." },
{ word: "COMPUTING", category: "Technology", clue: "Using computers." },
{ word: "DEVELOPER", category: "Role", clue: "A person who builds software." },
{ word: "ENCRYPTION", category: "Security", clue: "Protecting data by encoding it." },
{ word: "FRAMEWORK", category: "Technology", clue: "A structure for building." },
{ word: "GENERATOR", category: "Machine", clue: "Something that produces." },
{ word: "HYPOTHESIS", category: "Science", clue: "A testable idea." },
{ word: "INTERFACE", category: "Technology", clue: "Where users interact." },
{ word: "JUDGEMENT", category: "Decision", clue: "An opinion or decision." },
{ word: "KEYSTONE", category: "Structure", clue: "A central supporting piece." },
{ word: "LANDSCAPE", category: "Nature", clue: "Visible land scenery." },
{ word: "MOTIVATION", category: "Mind", clue: "Reason to act." },
{ word: "NARRATIVE", category: "Story", clue: "A told sequence of events." },
{ word: "OPERATING", category: "Action", clue: "Running or functioning." },
{ word: "PERFORMANCE", category: "Result", clue: "How well something works." },
{ word: "QUICKNESS", category: "Speed", clue: "Being fast." },
{ word: "RESOLUTION", category: "Result", clue: "A solution or clarity." },
{ word: "STRUCTURE", category: "Design", clue: "How something is built." },
{ word: "TRANSFORM", category: "Action", clue: "Change form." },
{ word: "UTILITIES", category: "Tools", clue: "Useful services or tools." },
{ word: "VALIDATION", category: "Check", clue: "Confirming something is correct." },
{ word: "WORKSPACE", category: "Place", clue: "Where work is done." },
{ word: "YIELDING", category: "Action", clue: "Giving way or producing." },
{ word: "ZENITHAL", category: "Position", clue: "Related to the highest point." },
{ word: "ARCHETYPE", category: "Pattern", clue: "A classic model." },
{ word: "BLUEPRINTS", category: "Design", clue: "Detailed plans." },
{ word: "CONNECTION", category: "Link", clue: "A relationship or link." },
{ word: "DEPLOYMENT", category: "Technology", clue: "Publishing or releasing software." },
{ word: "EVALUATION", category: "Review", clue: "Assessment or judging." },
{ word: "FORMATION", category: "Creation", clue: "The process of forming." },
{ word: "GUIDANCE", category: "Help", clue: "Direction or advice." },
{ word: "HIERARCHY", category: "Structure", clue: "Ranked levels." },
{ word: "IMPLEMENT", category: "Action", clue: "Put into effect." },
{ word: "JUSTIFIED", category: "Reason", clue: "Supported by reason." },
{ word: "LOCALHOST", category: "Technology", clue: "Your own computer in web development." },
{ word: "MECHANISM", category: "Machine", clue: "A working system." },
{ word: "NORMALIZE", category: "Action", clue: "Make standard." },
{ word: "OPTIMIZER", category: "Technology", clue: "Improves efficiency." },
{ word: "PROCESSING", category: "Action", clue: "Handling information." },
{ word: "QUERYING", category: "Technology", clue: "Asking a database for data." },
{ word: "RECURSION", category: "Programming", clue: "A function calling itself." },
{ word: "SIMULATION", category: "Model", clue: "A realistic imitation." },
{ word: "TEMPLATE", category: "Design", clue: "A reusable pattern." },
{ word: "UNIFYING", category: "Action", clue: "Bringing together." },
{ word: "VARIABLES", category: "Programming", clue: "Named values in code." },
{ word: "WORKAROUND", category: "Solution", clue: "A temporary fix." },
{ word: "ZEROING", category: "Action", clue: "Setting to zero." },
];

function seededIndex(seed: number, max: number) {
const value = Math.abs(Math.sin(seed * 9999.77) * 10000);
return Math.floor(value) % max;
}

function levelWord(level: number) {
let min = 5;
let max = 6;

if (level > 10) {
min = 6;
max = 7;
}

if (level > 20) {
min = 7;
max = 9;
}

if (level > 35) {
min = 8;
max = 10;
}

const pool = WORDS.filter(
(item) => item.word.length >= min && item.word.length <= max
);

const list = pool.length > 0 ? pool : WORDS;
const index = seededIndex(level + 37, list.length);

return list[index];
}

function levelSettings(level: number) {
return {
startingScore: 1200 + level * 40,
guessesAllowed: Math.max(5 - Math.floor(level / 12), 2),
revealCost: 120 + level * 4,
clueCost: 180 + level * 5,
categoryCost: 100 + level * 3,
};
}

export default function Page() {
const [level, setLevel] = useState(1);
const [state, setState] = useState<GameState>("ready");
const [revealed, setRevealed] = useState<number[]>([]);
const [guess, setGuess] = useState("");
const [guessesLeft, setGuessesLeft] = useState(5);
const [score, setScore] = useState(0);
const [showCategory, setShowCategory] = useState(false);
const [showClue, setShowClue] = useState(false);
const [message, setMessage] = useState("Tap Start");

const item = useMemo(() => levelWord(level), [level]);
const settings = useMemo(() => levelSettings(level), [level]);

useEffect(() => {
const saved = localStorage.getItem("wordVaultLevel");
if (saved) {
const savedLevel = Math.min(Number(saved), TOTAL_LEVELS);
setLevel(savedLevel);
}
}, []);

useEffect(() => {
setGuessesLeft(settings.guessesAllowed);
}, [settings.guessesAllowed]);

function startLevel() {
setState("playing");
setRevealed([]);
setGuess("");
setGuessesLeft(settings.guessesAllowed);
setScore(settings.startingScore);
setShowCategory(false);
setShowClue(false);
setMessage("Reveal carefully or make a guess.");
}

function revealLetter() {
if (state !== "playing") return;

const hidden = item.word
.split("")
.map((_, i) => i)
.filter((i) => !revealed.includes(i));

if (hidden.length === 0) return;

const randomHiddenIndex = Math.floor(Math.random() * hidden.length);
const nextIndex = hidden[randomHiddenIndex];

setRevealed((r) => [...r, nextIndex]);
setScore((s) => Math.max(0, s - settings.revealCost));
setMessage("Letter revealed.");
}

function revealCategory() {
if (state !== "playing" || showCategory) return;
setShowCategory(true);
setScore((s) => Math.max(0, s - settings.categoryCost));
setMessage("Category revealed.");
}

function revealClue() {
if (state !== "playing" || showClue) return;
setShowClue(true);
setScore((s) => Math.max(0, s - settings.clueCost));
setMessage("Clue revealed.");
}

function submitGuess() {
if (state !== "playing") return;

const cleanGuess = guess.trim().toUpperCase();

if (!cleanGuess) return;

if (cleanGuess === item.word) {
setState("complete");
setRevealed(item.word.split("").map((_, i) => i));
setMessage(`Unlocked! Final score: ${score}`);
localStorage.setItem("wordVaultLevel", String(level));
return;
}

const nextGuesses = guessesLeft - 1;
setGuessesLeft(nextGuesses);
setScore((s) => Math.max(0, s - 150));
setGuess("");

if (nextGuesses <= 0) {
setState("failed");
setMessage(`Vault sealed. The word was ${item.word}.`);
return;
}

setMessage("Wrong guess. Try again.");
}

function nextLevel() {
const next = Math.min(level + 1, TOTAL_LEVELS);
setLevel(next);
localStorage.setItem("wordVaultLevel", String(next));
setState("ready");
setMessage("Tap Start");
setGuess("");
setRevealed([]);
setShowCategory(false);
setShowClue(false);
}

function resetLevel() {
setState("ready");
setMessage("Tap Start");
setGuess("");
setRevealed([]);
setShowCategory(false);
setShowClue(false);
setScore(0);
setGuessesLeft(settings.guessesAllowed);
}

function restartGame() {
setLevel(1);
localStorage.setItem("wordVaultLevel", "1");
resetLevel();
}

const displayWord = item.word
.split("")
.map((letter, i) => (revealed.includes(i) ? letter : "_"));

return (
<main style={styles.page}>
<section style={styles.card}>
<a href="/" style={styles.back}>
← Arcade
</a>

<div style={styles.header}>
<div>
<h1 style={styles.title}>Word Vault</h1>
<p style={styles.subtitle}>
Crack the hidden word. Every clue helps, but every clue costs points.
</p>
</div>

<div style={styles.levelBadge}>
Level {level}/{TOTAL_LEVELS}
</div>
</div>

<div style={styles.vault}>
<div style={styles.wordRow}>
{displayWord.map((letter, i) => (
<div key={i} style={styles.letterBox}>
{letter}
</div>
))}
</div>

<div style={styles.infoGrid}>
<div style={styles.infoBox}>
<strong>{score}</strong>
<span>Score</span>
</div>

<div style={styles.infoBox}>
<strong>{guessesLeft}</strong>
<span>Guesses</span>
</div>

<div style={styles.infoBox}>
<strong>{item.word.length}</strong>
<span>Letters</span>
</div>
</div>

<div style={styles.clueArea}>
<p>
<strong>Category:</strong>{" "}
{showCategory ? item.category : "Locked"}
</p>
<p>
<strong>Clue:</strong> {showClue ? item.clue : "Locked"}
</p>
</div>

<div style={styles.status}>{message}</div>

{state === "ready" && (
<button onClick={startLevel} style={styles.primary}>
Start Level
</button>
)}

{state === "playing" && (
<>
<div style={styles.actions}>
<button onClick={revealLetter} style={styles.secondary}>
Reveal Letter -{settings.revealCost}
</button>

<button onClick={revealCategory} style={styles.secondary}>
Category -{settings.categoryCost}
</button>

<button onClick={revealClue} style={styles.secondary}>
Clue -{settings.clueCost}
</button>
</div>

<div style={styles.guessRow}>
<input
value={guess}
onChange={(e) => setGuess(e.target.value)}
onKeyDown={(e) => {
if (e.key === "Enter") submitGuess();
}}
placeholder="Type your guess"
style={styles.input}
/>

<button onClick={submitGuess} style={styles.primarySmall}>
Guess
</button>
</div>
</>
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
</div>
</section>
</main>
);
}

const styles: Record<string, React.CSSProperties> = {
page: {
minHeight: "100vh",
padding: "clamp(16px, 4vw, 48px)",
background:
"radial-gradient(circle at top left, #0f766e 0%, #020617 48%, #020617 100%)",
color: "white",
fontFamily:
"-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif",
display: "flex",
justifyContent: "center",
alignItems: "center",
},
card: {
width: "min(940px, 100%)",
padding: "clamp(18px, 4vw, 34px)",
borderRadius: 32,
background: "rgba(15,23,42,0.84)",
border: "1px solid rgba(45,212,191,0.25)",
boxShadow: "0 30px 90px rgba(0,0,0,0.55)",
backdropFilter: "blur(16px)",
},
back: {
color: "#99f6e4",
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
textShadow: "0 0 28px rgba(45,212,191,0.35)",
},
subtitle: {
color: "#cbd5e1",
fontSize: "clamp(15px, 3vw, 19px)",
marginTop: 8,
maxWidth: 620,
lineHeight: 1.45,
},
levelBadge: {
padding: "12px 18px",
borderRadius: 999,
background: "rgba(45,212,191,0.14)",
border: "1px solid rgba(45,212,191,0.35)",
color: "#99f6e4",
fontWeight: 900,
},
vault: {
marginTop: 28,
padding: "clamp(18px, 4vw, 30px)",
borderRadius: 28,
background:
"linear-gradient(145deg, rgba(2,6,23,0.92), rgba(30,41,59,0.72))",
border: "1px solid rgba(45,212,191,0.22)",
boxShadow:
"inset 0 0 60px rgba(45,212,191,0.08), 0 20px 60px rgba(0,0,0,0.38)",
},
wordRow: {
display: "flex",
justifyContent: "center",
flexWrap: "wrap",
gap: 10,
},
letterBox: {
width: "clamp(42px, 9vw, 68px)",
height: "clamp(52px, 10vw, 78px)",
borderRadius: 16,
display: "grid",
placeItems: "center",
background: "rgba(20,184,166,0.12)",
border: "1px solid rgba(45,212,191,0.35)",
boxShadow: "0 0 24px rgba(45,212,191,0.18)",
fontSize: "clamp(26px, 6vw, 42px)",
fontWeight: 950,
color: "#ccfbf1",
},
infoGrid: {
marginTop: 24,
display: "grid",
gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
gap: 12,
},
infoBox: {
padding: 14,
borderRadius: 18,
background: "rgba(30,41,59,0.82)",
border: "1px solid rgba(45,212,191,0.18)",
display: "flex",
flexDirection: "column",
textAlign: "center",
gap: 4,
},
clueArea: {
marginTop: 20,
color: "#e2e8f0",
lineHeight: 1.5,
},
status: {
marginTop: 18,
textAlign: "center",
fontWeight: 900,
color: "#ccfbf1",
fontSize: 18,
minHeight: 28,
},
actions: {
marginTop: 18,
display: "grid",
gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
gap: 12,
},
guessRow: {
marginTop: 16,
display: "flex",
gap: 12,
flexWrap: "wrap",
},
input: {
flex: 1,
minWidth: 220,
padding: 16,
borderRadius: 16,
border: "1px solid rgba(45,212,191,0.35)",
background: "rgba(15,23,42,0.88)",
color: "white",
fontSize: 17,
outline: "none",
},
primary: {
width: "100%",
marginTop: 18,
padding: 16,
borderRadius: 18,
border: "none",
background: "linear-gradient(135deg, #99f6e4, #14b8a6)",
color: "#042f2e",
fontWeight: 950,
fontSize: 17,
cursor: "pointer",
boxShadow: "0 0 30px rgba(45,212,191,0.45)",
},
primarySmall: {
padding: "16px 24px",
borderRadius: 18,
border: "none",
background: "linear-gradient(135deg, #99f6e4, #14b8a6)",
color: "#042f2e",
fontWeight: 950,
fontSize: 17,
cursor: "pointer",
},
secondary: {
padding: 14,
borderRadius: 16,
border: "1px solid rgba(45,212,191,0.32)",
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