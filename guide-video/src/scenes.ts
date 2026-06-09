// Shared scene + narration data. NO remotion imports here so the
// standalone voiceover generator can import it via `node --strip-types`.

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;

// ElevenLabs voice to narrate the guide. Rachel (premade) — confirmed callable on this account.
export const VOICE_ID = "21m00Tcm4TlvDq8ikWAM";

export type SceneMeta = {
  id: string; // also the mp3 filename stem
  min: number; // minimum frames if no/short audio (lets animations breathe)
  text: string; // narration
};

// Order MUST match the scene order rendered in ArmyGuide.tsx:
// title, idea, then the 8 units, then strategy, outro.
export const SCENES: SceneMeta[] = [
  {
    id: "00-title",
    min: 95,
    text: "Welcome to your Dwarf Guilds field guide. This army is a turtle that hits like a truck. You hold a tight cluster of markers behind a Sturdy wall, then counter-punch everything that tries to take them.",
  },
  {
    id: "01-idea",
    min: 150,
    text: "Here's what matters. When you tag a marker, it stays yours, even after you leave, until he touches it again. And if you both stand on one, it's only a tie. You are slow, so don't chase. Seize the close markers, hold them on tanky bodies, and use your two fast vehicles and the ambush drill to kill anything that could reach your ground.",
  },
  {
    id: "02-fortress",
    min: 155,
    text: "The Fortress Tank is your anchor. Tough eighteen and Sturdy mean it shrugs off his shooting, and it throws sixteen shots a turn. Deploy a Berserker squad inside it, drive up turn one, and let them charge out turn two. Just keep it away from his heaviest armour-piercing guns.",
  },
  {
    id: "03-drill",
    min: 150,
    text: "The Assault Drill is your one ambush piece. Keep it in reserve, then on round two drop it behind his lines, right next to his artillery, a gun team, or a tank. Impact six plus six attacks at armour-piercing four delete most support in a single charge. Remember it can't seize the turn it lands.",
  },
  {
    id: "04-attackvehicle",
    min: 145,
    text: "The Attack Vehicle is your fast tank-hunter. Slide it to a flank and line up his transports and tanks. Two shots at armour-piercing four with Deadly three wreck most vehicles outright. But it's fragile, so shoot from cover and never leave it in the open.",
  },
  {
    id: "05-berserkers-vet",
    min: 150,
    text: "Berserkers are your counter-punch. On the charge, Melee Slayer pushes their axes to armour-piercing four against anything tough, and Furious adds hits on sixes. Ride them in the Fortress Tank, disembark, and charge his vehicles and monsters. They are Slow, so never try to walk them across the table.",
  },
  {
    id: "06-berserkers-champ",
    min: 145,
    text: "Your second Berserker squad, led by a Dwarf Champion, holds the centre. Fearless bodies plant on the central marker, then counter-charge anyone who comes for it, hitting his tough units at armour-piercing four. Pick a marker and hold it; don't chase.",
  },
  {
    id: "07-sniper",
    min: 145,
    text: "The Sniper Team is your hero killer. Scout deploys it with a clean lane to his back line. Takedown lets you pull his hero, caster, or a key gun crew straight out of its squad from thirty inches. Stealth and Sturdy keep it alive in cover all game. Never let it get into melee.",
  },
  {
    id: "08-ironvets",
    min: 145,
    text: "Iron Veterans are your home guard. Plant them on your key marker and stay. Sturdy makes them Defense two at range, so they tank the gunline, and anything that closes within six inches eats ten shots at armour-piercing two. Don't push them forward; they hold ground.",
  },
  {
    id: "09-thunder",
    min: 140,
    text: "Thunder Support is your anti-horde gun. Park it in the backfield and never move it. Three indirect blast shots ignore cover and need no line of sight, so drop them on his densest blob. It's your main answer to an Orc swarm.",
  },
  {
    id: "10-strategy",
    min: 215,
    text: "The plan. Round one: tag the close markers and roll the Fortress Tank up with the Berserkers inside. Round two: the drill ambushes his backline while the Berserkers disembark and charge. Rounds three and four: hold your ground, keep killing anything that could reach a marker, then clear him off the points you want and own them outright. Don't settle for a tie.",
  },
  {
    id: "11-outro",
    min: 110,
    text: "Turtle up, then counter-punch. Make him break on your Sturdy wall, and kill everything that could take your ground. That is how you win. Now go kill Bill.",
  },
];

export const audioPath = (id: string) => `voiceover/${id}.mp3`;
