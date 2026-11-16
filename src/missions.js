// Campaign. Each mission is data: map, objective, dialogue, triggers.
//
// objective.type:
//   'reach'     — get to flag E
//   'defend'    — survive all drone waves; base X must survive
//   'launchers' — destroy every launcher L before time runs out (V = thermal)
//
// Dialogue: [who, text, mood]   who: president | hero | mossad | hq   mood: normal | happy | rambo
// triggers: { col: map column, radio: [who, text, mood] } — short radio line, no pause
const R = (ch, n) => ch.repeat(n);

G.MISSIONS = [
  // ------------------------------------------------------------------ 1
  {
    id: 'landing', title: 'HORMUZ LANDING', subtitle: 'Training. Take the beachhead.', theme: 'gulf', playable: true,
    objective: { type: 'reach' },
    level: {
      ground: '#',
      terrain: R('3', 20) + R('_', 3) + R('3', 15) + R('4', 8) + R('5', 8) + R('3', 6) + R(' ', 3) + R('3', 20) + R('4', 6) + R('3', 10) + R('_', 2) + R('3', 29),
      platforms: [[27, 6, 4], [66, 7, 5], [72, 5, 4], [92, 6, 5], [104, 7, 4]],
      blocks: [[35, 9, 'b'], [42, 7, 'x'], [43, 7, 'x'], [42, 6, 'x'], [80, 9, 'x'], [81, 9, 'x'], [109, 9, 'b'], [110, 9, 'b']],
      objects: 'P2 S14 S31 H28:5 S45 T50 S57 M68:6 S70 G73:4 S78 S86 T96 Y94:5 S106 S113 H105:6 S118 T123 E127',
    },
    intro: [
      ['hq', 'Sgt. Steel, you are on the shore of the Strait of Hormuz. Take the beachhead and reach the extraction point.'],
      ['president', 'Sergeant! President Gold here. I\'m watching you on TV. Great ratings. Huge.', 'happy'],
      ['president', 'Your job is simple: win. I always win. We have that in common.'],
      ['hero', 'Yes, sir. What are the controls?'],
      ['hq', 'Arrows to run. X jumps, Z fires, C throws a grenade. Hold UP to aim up. DOWN + jump drops through a platform.'],
    ],
    triggers: [
      { col: 19, radio: ['hq', 'Water ahead. Soldiers can\'t swim. Neither can you.'] },
      { col: 40, radio: ['president', 'See those crates? Could be anything inside. Even my book!', 'happy'] },
      { col: 65, radio: ['hq', 'M249 machine gun on the platform. Grab it.'] },
      { col: 92, radio: ['president', 'A red tie! Mine! Put it on and you\'re unstoppable. Like me.', 'happy'] },
    ],
    outro: [
      ['hq', 'Beachhead secured. Outstanding work, Sergeant.'],
      ['president', 'Magnificent. Best landing in the history of landings. I\'ll be telling it as my own.', 'happy'],
    ],
  },

  // ------------------------------------------------------------------ 2
  {
    id: 'swarm', title: 'SHAHED SWARM', subtitle: 'Defend the Gulf base.', theme: 'gulf', playable: true,
    objective: {
      type: 'defend', baseHp: 24,
      waves: [
        { drones: 4, interval: 2.2, speed: 45 },
        { drones: 6, interval: 1.6, speed: 55, pickups: 'N' },
        { drones: 6, interval: 1.4, speed: 60, soldiers: 3 },
        { drones: 9, interval: 1.0, speed: 65, pickups: 'H' },
        { drones: 12, interval: 0.8, speed: 70, soldiers: 4, pickups: 'N' },
      ],
    },
    level: {
      ground: 'c',
      terrain: R('3', 46),
      platforms: [[9, 6, 6], [19, 4, 5], [29, 6, 6], [38, 5, 5]],
      blocks: [[15, 9, 'b'], [26, 9, 'b'], [27, 9, 'b']],
      objects: 'X2 P12 N14 G22 H33:5',
    },
    intro: [
      ['hq', 'Radar shows a drone swarm inbound from the east. Target: our base. Hold the line.'],
      ['president', 'Drones? Twenty thousand dollars each? That\'s cheap. I don\'t like cheap.'],
      ['hero', 'How do I take them down, sir?'],
      ['hq', 'The Stinger locks on by itself. The machine gun works the old way. Aim up when they dive.'],
      ['president', 'And remember: every drone you drop is a win. My win. Okay, a little bit yours.', 'happy'],
    ],
    waveRadio: [
      ['hq', 'Wave one. They sound like mopeds.'],
      ['president', 'They\'re flying straight at the base! How rude.'],
      ['hq', 'Infantry with them. Keep them off the base.'],
      ['president', 'MORE drones?! Fine. TIE ON THE HEAD!', 'rambo'],
      ['hq', 'Final wave. The biggest one.'],
    ],
    outro: [
      ['hq', 'Skies are clear. All drones down.'],
      ['president', 'Incredible. I said we\'d win. I always say that, and I\'m always right.', 'happy'],
    ],
  },

  // ------------------------------------------------------------------ 3
  {
    id: 'trucks', title: 'SURPRISE TRUCKS', subtitle: 'Find the launchers among the vans.', theme: 'city', playable: true,
    objective: { type: 'launchers', time: 180 },
    level: {
      ground: '#',
      terrain: R('3', 30) + R('4', 10) + R('3', 40) + R('2', 12) + R('3', 50) + R('3', 8),
      platforms: [[12, 6, 4], [36, 5, 4], [58, 6, 5], [88, 6, 4], [116, 5, 5], [134, 6, 4]],
      blocks: [[24, 9, 'x'], [25, 9, 'x'], [70, 9, 'b'], [100, 10, 'b'], [126, 9, 'x']],
      objects: 'P2 K10 S16 L20 S28 K33 T38 H37:4 K46 S50 L55 S62 K66 G60:5 S74 K78 L84 S90 T96 K103 Y90:5 S108 K112 S118 L122 M118:4 S130 K136 S142 H135:5',
    },
    intro: [
      ['hq', 'Intel says the launchers are disguised as ordinary trucks. Three minutes to launch.'],
      ['hq', 'Switch on thermal vision with V. A hot missile motor glows. Leave the civilian vans alone.'],
      ['president', 'How do you tell a missile truck from a watermelon truck? Very easy. I could tell.'],
      ['hero', 'How, sir?'],
      ['president', 'Instinct. Incredible instinct. Turn on the thermal.', 'happy'],
    ],
    triggers: [
      { col: 40, radio: ['hq', 'Hint: there are more civilian trucks than launchers.'] },
      { col: 90, radio: ['president', 'This market is a bad deal. I\'d put a golf club here.'] },
    ],
    outro: [
      ['hq', 'All launchers destroyed. There will be no launch.'],
      ['president', 'Not a single missile got off the ground. Not one! That\'s a record. My record.', 'happy'],
    ],
  },

  // ------------------------------------------------------------------ 4
  {
    id: 'escort', title: 'PRESIDENTIAL ESCORT', subtitle: 'President Gold goes into battle himself.', theme: 'desert', playable: true,
    ally: 'president',
    objective: { type: 'reach' },
    allyBarks: [
      'I personally invented jumping. Watch.',
      'Those soldiers are fake. Shoot them.',
      'People tell me I\'m the best shot. Everybody says it.',
      'Somebody bring me a burger. Out here. In the desert.',
      'I\'d buy this strait. Great real estate.',
      'Sand. Nothing but sand. Terrible deal.',
      'My golden pistol only fires victories.',
      'Sergeant, am I in the shot? Do I look good?',
    ],
    level: {
      ground: '#',
      terrain: R('3', 25) + R('4', 10) + R('5', 6) + R('3', 15) + R('_', 3) + R('3', 18) + R('4', 8) + R('6', 5) + R('4', 6) + R('3', 54),
      platforms: [[16, 6, 4], [46, 4, 4], [58, 7, 3], [62, 7, 3], [78, 5, 5], [107, 7, 5], [120, 6, 4]],
      blocks: [[22, 9, 'b'], [53, 9, 'x'], [54, 9, 'x'], [73, 9, 'b'], [101, 7, 'x'], [113, 9, 'b'], [114, 9, 'b']],
      objects: 'P3 A1 S18 S24 H17:5 S30 T38 S44 G47:3 S50 S55 S68 T76 S80 M79:4 S86 S90 S95 Y98:4 T104 S110 S116 H121:5 S124 S130 T134 S138 E146',
    },
    intro: [
      ['hq', 'Attention. President Gold has arrived at the front. In person.'],
      ['president', 'Sergeant! I decided this mission needs to look beautiful. So I\'m here.', 'happy'],
      ['hero', 'Sir, it\'s dangerous.'],
      ['president', 'Danger is my middle name. My first name is Gold. I have a golden pistol. Let\'s go.'],
      ['hq', 'By protocol the President cannot die. But if you make him really angry...'],
      ['president', '...then the tie goes on my head. And the movie starts.', 'rambo'],
    ],
    triggers: [
      { col: 58, radio: ['president', 'Water! I don\'t swim. I walk on water. Almost.'] },
      { col: 100, radio: ['hq', 'Approaching extraction. The chopper is waiting.'] },
    ],
    outro: [
      ['president', 'Now THAT was a mission. I filmed it on my phone. Mostly myself.', 'happy'],
      ['hero', 'Sir, you\'re covered in sand.'],
      ['president', 'That\'s not sand. That\'s the golden dust of victory.', 'happy'],
    ],
  },

  // ------------------------------------------------------------------ 5
  { id: 'toll', title: 'THE $2 MILLION TOLLBOOTH', subtitle: 'The strait. Boat deck, mines, a toll-collector boss.', theme: 'gulf', playable: false },

  // ------------------------------------------------------------------ 6
  {
    id: 'mossad', title: 'MOSSAD SHADOW', subtitle: 'Night raid with Agent Avi.', theme: 'night', playable: true,
    ally: 'mossad',
    objective: { type: 'launchers', time: 210 },
    allyBarks: [
      'I was here yesterday. And the day before.',
      'Quiet. Hear that? Not a Shahed. A cricket.',
      'Don\'t shoot the watermelons. We\'ve been through this.',
      'We know where he is. We always know.',
      'Hummus after the mission. My treat.',
      'Better not touch that pager.',
    ],
    level: {
      ground: 'r',
      terrain: R('3', 22) + R('4', 12) + R('3', 10) + R(' ', 3) + R('3', 24) + R('5', 6) + R('3', 20) + R('4', 14) + R('3', 30),
      platforms: [[14, 6, 4], [42, 7, 4], [48, 7, 4], [69, 5, 4], [96, 6, 5], [126, 6, 4]],
      blocks: [[30, 8, 'b'], [56, 9, 'x'], [86, 9, 'b'], [110, 8, 'x'], [111, 8, 'x']],
      objects: 'P3 A6 S16 K12 L26 S33 T38 K52 S58 G60 L64 S68 H70:4 K80 S88 T92 S98 K102 L108 Y97:5 S116 K120 S124 L132 S138 H136',
    },
    intro: [
      ['hq', 'Night operation. A Mossad agent is with you. Call sign: Avi.'],
      ['mossad', 'Shalom. I already beat this level. Twice. Just follow me.'],
      ['hero', 'Are you always ahead?'],
      ['mossad', 'Always. I\'ll mark the launchers in red. The rest is your job.'],
      ['president', 'Mossad! Great guys. I love them very much. They love me too. Probably.', 'happy'],
    ],
    triggers: [
      { col: 44, radio: ['mossad', 'A chasm. Jump across the platforms. I\'m already on the other side.'] },
      { col: 100, radio: ['hq', 'Time is running out. Move faster.'] },
    ],
    outro: [
      ['mossad', 'Clear. I already reported it. Before you were done.'],
      ['president', 'A great joint operation. I came up with it myself. Last night.', 'happy'],
    ],
  },

  // ------------------------------------------------------------------ 7-12
  { id: 'larak', title: 'LARAK ISLAND', subtitle: 'Clear the launchers on the island. Call in HIMARS by radio.', theme: 'gulf', playable: false },
  { id: 'missilecity', title: 'MISSILE CITY', subtitle: 'Underground tunnels with missiles on rails.', theme: 'night', playable: false },
  { id: 'nuke', title: 'FIND THE BOMB', subtitle: 'A bunker full of centrifuges and "Peaceful Atom" crates.', theme: 'night', playable: false },
  { id: 'hostages', title: 'FORGOTTEN HOSTAGES', subtitle: 'A prison. Free the captives.', theme: 'city', playable: false },
  { id: 'lucas', title: 'SHAHED IN REVERSE', subtitle: 'Fly the American LUCAS drone.', theme: 'desert', playable: false },
  { id: 'final', title: 'THE INVISIBLE AYATOLLAH', subtitle: 'Finale. The boss hides behind holograms.', theme: 'city', playable: false },
];

// President's radio lines for game events
G.PRESIDENT_BARKS = {
  rage:    [['president', 'My tie! Now you\'re me. Just with a helmet.', 'rambo']],
  civilian:[['president', 'Those were WATERMELONS! Beautiful watermelons. I feel bad for them.'], ['president', 'You blew up a carpet van. Those were nice carpets.']],
  death:   [['president', 'Get up, Sergeant! Winners don\'t lie down. They just rest.'], ['president', 'That\'s not a defeat. It\'s a tactical pause.']],
  launcher:[['president', 'Boom! Beautiful. I\'d put that on a magazine cover.', 'happy'], ['hq', 'Launcher destroyed.']],
};
