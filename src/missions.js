// Campaign. Each mission is data: map, objective, dialogue, triggers.
//
// objective.type:
//   'reach'     — get to flag E
//   'defend'    — survive all drone waves; base X must survive
//   'launchers' — destroy every launcher L before time runs out (V = thermal)
//   'boss'      — defeat the boss Z (bossIntro: cutscene, bossPhases: lines at 25/50/75% damage)
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
  {
    id: 'toll', title: 'THE $2 MILLION TOLLBOOTH', subtitle: 'Hop the ships across the strait. Shut down the toll.', theme: 'gulf', playable: true,
    objective: { type: 'boss', bossName: 'TOLL COLLECTOR' },
    level: {
      ground: 'd',
      terrain: R('3', 16) + R('_', 3) + R('4', 14) + R('_', 10) + R('3', 14) + R('_', 3) + R('4', 14) + R('_', 10) + R('3', 8) + R('_', 3) + R('3', 30),
      platforms: [[35, 9, 2], [39, 8, 2], [76, 8, 2], [80, 9, 2], [101, 6, 4], [109, 6, 4]],
      blocks: [[12, 9, 'x'], [27, 8, 'b'], [47, 9, 'x'], [48, 9, 'x'], [66, 8, 'b'], [88, 9, 'x']],
      objects: 'P2 S10 O17 S24 S30 B34 O41 D44:4 S50 S55 O58 M62:7 S64 S70 B75 O82 D86:3 H86 S90 O93 G97 Z122',
    },
    intro: [
      ['hq', 'The Strait of Hormuz is closed. Someone set up a tollbooth in the middle of the sea. Two million dollars per ship.'],
      ['president', 'Two million? For WATER? I have made bad deals... no. I have never made a bad deal. This is a bad deal.'],
      ['hero', 'Orders, sir?'],
      ['president', 'Don\'t pay. Never pay. Jump ship to ship and shut that booth down.', 'rambo'],
      ['hq', 'Speedboats in the water. While jumping, hold DOWN to shoot straight down. Watch for jumping mines.'],
    ],
    triggers: [
      { col: 15, radio: ['hq', 'Mines love jumping. Time your leaps.'] },
      { col: 32, radio: ['president', 'A speedboat! Tiny. I have a much bigger boat. Huge boat.'] },
      { col: 70, radio: ['hq', 'Long gap ahead. Use the floating crates.'] },
      { col: 92, radio: ['president', 'I can see the booth. Terrible architecture. Who designed that?'] },
    ],
    bossIntro: [
      ['toll', 'HALT! Toll is two million dollars. Per ship. Per person. Per wave.'],
      ['hero', 'I\'m one guy. On foot.'],
      ['toll', 'Then it\'s two million per foot. Cash or card?'],
      ['president', 'Sergeant, I don\'t PAY tolls. I OWN tolls. Shoot when the window opens!', 'rambo'],
    ],
    bossPhases: [
      { price: 4, radio: ['toll', 'Inflation! It\'s four million now!'] },
      { price: 1, radio: ['toll', 'Okay, okay, discount! One million!'] },
      { price: 0, radio: ['toll', 'FREE! It\'s free! Please stop shooting!'] },
    ],
    outro: [
      ['hq', 'The strait is open. Tankers are moving again.'],
      ['president', 'I\'m putting my name on that booth. GOLD TOLL. Free for everyone. Almost free.', 'happy'],
      ['hero', 'Sir, the booth is at the bottom of the sea.'],
      ['president', 'Then it\'s the deepest toll in history. Incredible depth.', 'happy'],
    ],
  },

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
  {
    id: 'larak', title: 'LARAK ISLAND', subtitle: 'Armored launchers on the island. Call in HIMARS.', theme: 'gulf', playable: true,
    objective: { type: 'launchers', time: 240, special: 'himars', strikes: 3 },
    level: {
      ground: '#',
      terrain: R('3', 18) + R('4', 8) + R('5', 10) + R('6', 8) + R('4', 12) + R(' ', 3) + R('4', 14) + R('5', 12) + R('3', 16) + R('_', 3) + R('3', 20) + R('5', 10) + R('4', 16),
      platforms: [[30, 5, 4], [64, 6, 4], [90, 7, 5], [114, 7, 4], [137, 6, 4]],
      blocks: [[24, 8, 'b'], [46, 8, 'x'], [47, 8, 'x'], [82, 7, 'b'], [109, 9, 'x'], [128, 6, 'b']],
      objects: 'P2 R6 S12 Q20 S27 U32 T40 S49 H52 S62 Q66 U70 S76 T80 G91:6 S88 U94 Q98 R106 S108 S112 M115:6 U120 T126 Q130 H136 S138 U142 R139:5',
    },
    intro: [
      ['hq', 'Larak Island. Five launchers aimed at the shipping lanes. They\'re armored, so small arms will take a while.'],
      ['hq', 'Press V to laser-mark a spot ahead of you. HIMARS hits it a second and a half later. Three strikes to start; radios give you more.'],
      ['president', 'HIMARS. Beautiful name. I\'d put it on a hotel. HIMARS TOWER.', 'happy'],
      ['hero', 'Sir, it\'s a rocket system.'],
      ['president', 'A rocket system with a hotel name. Even better. Four minutes, Sergeant. Go.'],
    ],
    triggers: [
      { col: 16, radio: ['hq', 'RPG gunner ahead. Their rockets are slow. Jump them.'] },
      { col: 56, radio: ['hq', 'Gap in the cliff. Mind your step.'] },
      { col: 100, radio: ['president', 'Water again! Who keeps putting water everywhere?'] },
    ],
    outro: [
      ['hq', 'All five launchers destroyed. The shipping lanes are safe.'],
      ['president', 'Five out of five. Perfect score. They should give me the island. I\'d make it a golf course.', 'happy'],
    ],
  },
  {
    id: 'missilecity', title: 'MISSILE CITY', subtitle: 'Tunnels, rail carts, a depot to blow. Then run.', theme: 'tunnel', playable: true,
    objective: { type: 'demolish', escape: 20 },
    dark: 0.86,
    level: {
      ground: 'r',
      terrain: R('2', 140),
      platforms: [
        [0, 0, 140, 'r'], [0, 1, 140, 'r'],          // потолок
        [0, 6, 30, 'r'], [32, 6, 44, 'r'],          // перекрытие между этажами
        [88, 8, 6], [96, 5, 5], [104, 8, 5], [118, 7, 4],
      ],
      blocks: [[33, 7, 'r'], [33, 8, 'r'], [33, 9, 'r'], [33, 10, 'r'], [40, 5, 'x'], [62, 5, 'b'], [114, 10, 'x'], [114, 9, 'x'], [134, 2, 'c'], [134, 3, 'c'], [134, 4, 'c'], [134, 5, 'c'], [134, 6, 'c'], [134, 7, 'c'], [134, 8, 'c'], [134, 9, 'c'], [134, 10, 'c']],
      door: [[134, 2], [134, 3], [134, 4], [134, 5], [134, 6], [134, 7], [134, 8], [134, 9], [134, 10]],
      lifts: [[30, 6, 11]],
      lamps: [[6, 7], [20, 7], [26, 7], [12, 2], [40, 2], [55, 2], [70, 2], [50, 7], [86, 2], [100, 2], [112, 2], [124, 2], [138, 2]],
      objects: 'P2 S12 V22 S27 H8:5 G14:5 S20:5 S38:5 T45:5 V52:5 S58:5 Q66:5 M70:5 S73:5 S45 S60 H66 G40 V84 S88 Q91:7 Q98:4 S100 V106 T110 S116 Q120:6 S124 J127 S131 E138',
    },
    intro: [
      ['hq', 'Underground missile city. Kilometers of tunnels carved into the mountain. Missiles ride on rails in there.'],
      ['hq', 'Find the main depot and plant C4. Then you have twenty seconds to get out through the blast door.'],
      ['president', 'A city? Underground? No sunlight, no views, no golf. Terrible real estate. Blow it up.'],
      ['hero', 'It\'s dark in there, sir.'],
      ['president', 'You have a flashlight. I have a flashlight too. Mine is gold.', 'happy'],
    ],
    triggers: [
      { col: 16, radio: ['hq', 'Rail cart! Shoot it and it goes up like fireworks. Don\'t stand in its way.'] },
      { col: 28, radio: ['hq', 'Wall ahead. Take the lift to the upper level.'] },
      { col: 76, radio: ['president', 'Look at all those missiles. Very expensive. Very bad. Very boom.'] },
      { col: 112, radio: ['hq', 'The depot is just ahead. The blast door opens when the charge is set.'] },
    ],
    plantRadio: ['hq', 'Charge set! The blast door is open. RUN!'],
    outro: [
      ['hq', 'Massive detonation in the mountain. Missile City is gone.'],
      ['president', 'They call it a missile city. Now it\'s a missile village. A small one. Very small.', 'happy'],
      ['hero', 'Sir, I lost my eyebrows.'],
      ['president', 'Eyebrows grow back. Victories are forever.', 'happy'],
    ],
  },
  {
    id: 'nuke', title: 'FIND THE BOMB', subtitle: 'One of the PEACEFUL ATOM crates is not so peaceful.', theme: 'lab', playable: true,
    objective: { type: 'search', minCol: 40 },
    level: {
      ground: 'c',
      terrain: R('2', 130),
      platforms: [
        [0, 0, 130, 'c'], [0, 1, 130, 'c'],
        [0, 6, 36, 'c'], [38, 6, 40, 'c'],
        [84, 8, 5], [92, 5, 5], [100, 8, 5], [114, 7, 4],
      ],
      blocks: [[39, 7, 'c'], [39, 8, 'c'], [39, 9, 'c'], [39, 10, 'c']],
      lifts: [[36, 6, 11]],
      objects: 'P2 S10 C8 W14 F18 I22 F24 C26 W28 S32 H4:5 C5:5 S8:5 G16:5 C20:5 W26:5 F42:5 C44:5 W46:5 S48:5 I52:5 C54:5 F56:5 W60:5 S64:5 C68:5 T70:5 C50 G60 C62 H66 C74 F82 C85 S86 F88 W90 Q93:4 C93 I94 F96 S98 C99 H100:7 F102 T104 F106 C107 W108 I110 S112 Q115:6 C116 F118 W120 C122 S124 E128',
    },
    intro: [
      ['hq', 'An enrichment bunker deep under a mountain. A bomb core is hidden in one of the crates marked PEACEFUL ATOM.'],
      ['mossad', 'We know which crate. We\'re not allowed to tell you. Listen to the Geiger counter: faster clicks, closer bomb.'],
      ['president', 'Peaceful atom. Sure. And I\'m a very humble man.'],
      ['hq', 'Lasers run on a timer. Shoot a centrifuge and it leaks gas: good against guards, bad for you. Don\'t shoot the scientists.'],
      ['hero', 'Copy. Find it, grab it, get out on the far right.'],
    ],
    triggers: [
      { col: 11, radio: ['hq', 'Laser barrier. Wait for it to switch off, then go.'] },
      { col: 33, radio: ['hq', 'Take the lift to the upper level.'] },
      { col: 50, radio: ['mossad', 'Warmer... or colder. I\'m not allowed to say.'] },
      { col: 80, radio: ['president', 'Look at all those centrifuges. Spinning and spinning. Like the news.'] },
    ],
    foundRadio: [
      ['president', 'You found it! Don\'t drop it. Don\'t shake it. Don\'t sell it.', 'happy'],
      ['hq', 'Bring the core to the extraction point on the far right.'],
    ],
    outro: [
      ['hq', 'Bomb core secured. The bunker is empty.'],
      ['president', 'I\'ll keep it in my office. As a paperweight. A very heavy, very powerful paperweight.', 'happy'],
      ['hero', 'Sir, it goes to the inspectors.'],
      ['president', 'Fine. But I get a photo with it.', 'happy'],
    ],
  },
  {
    id: 'hostages', title: 'FORGOTTEN HOSTAGES', subtitle: 'Night raid on a prison. Five hostages. Bring them home.', theme: 'night', playable: true,
    objective: { type: 'rescue', min: 3 },
    chopper: true,
    level: {
      ground: 'c',
      terrain: R('2', 150),
      platforms: [
        [82, 1, 43, 'c'], [87, 6, 38, 'c'],
        [83, 8, 3], [40, 8, 4], [60, 7, 4],
      ],
      blocks: [[30, 10, 'b'], [30, 9, 'b'], [31, 10, 'b'], [56, 10, 'b'], [76, 10, 'b'], [76, 9, 'b'],
        [82, 2, 'c'], [82, 3, 'c'], [82, 4, 'c'], [82, 5, 'c'], [82, 6, 'c'], [124, 2, 'c'], [124, 3, 'c'], [124, 4, 'c']],
      backdrops: [[82, 124, 2, 10]],
      objects: 'P2 g12 S16 l22 S27 H36 g34 l46 S50 G42:7 T58 g62 Q61:6 l68 S72 Y79 j92 h93 S100 g97 j96:5 h98:5 j104 h105 Q108 S110:5 T116:5 j112:5 h114:5 j118 h119 S122:5 H121 S130 Q134 g138 H128 E146',
    },
    intro: [
      ['hq', 'A political prison outside the capital. Five Western hostages, held for years. Tonight they go home.'],
      ['mossad', 'Searchlights sweep the yard. Get caught in the light and guards come running. Or just shoot the lamps.'],
      ['hq', 'Shoot the cell bars to open them. Freed hostages will follow you. We need at least three of them home alive.'],
      ['president', 'Hostages! Very important. I\'ll be on TV when they land. Big TV. Bring them home, Sergeant.'],
    ],
    triggers: [
      { col: 9, radio: ['hq', 'Guard dogs. Fast and angry. Don\'t let them corner you.'] },
      { col: 80, radio: ['hq', 'The cell block. Hostages on both floors. Use the steps on the left to go up.'] },
    ],
    hostageLines: [
      'Thank you! Four hundred days in here!',
      'Is the internet still a thing?',
      'Who\'s president now? ...Gold? Can I stay?',
      'I\'m a journalist. Can I quote you?',
      'Finally! My cellmate snored.',
    ],
    allFreedRadio: ['hq', 'All hostages free. The chopper is waiting on the far right.'],
    outro: [
      ['hq', 'Chopper is airborne with the hostages. Everyone is going home.'],
      ['president', 'Welcome home! Huge ceremony. I\'ll give the speech. You can stand behind me.', 'happy'],
      ['hero', 'Sir, they want to thank you.'],
      ['president', 'Of course they do. Everybody does.', 'happy'],
    ],
  },
  {
    id: 'lucas', title: 'SHAHED IN REVERSE', subtitle: 'Fly the American LUCAS drone to the factory that designed it.', theme: 'desert', playable: true,
    objective: { type: 'flight', speed: 45 },
    level: {
      ground: 'r',
      terrain: R('2', 20) + R('3', 10) + R('5', 8) + R('7', 6) + R('4', 10) + R('2', 14) + R('3', 12) + R('6', 10) + R('3', 10) + R('2', 20) + R('4', 10) + R('6', 8) + R('3', 12) + R('2', 40),
      platforms: [
        [100, 0, 20, 'r'], [100, 1, 20, 'r'], [100, 2, 20, 'r'], [104, 3, 6, 'r'],
        [120, 0, 18, 'r'], [120, 1, 18, 'r'], [124, 2, 8, 'r'],
      ],
      objects: 'P2:4 a24 D40:3 a48 H52:4 s60 D66:2 D70:4 a74 G78:3 s86 a95 D105:5 a112 s126 H134:4 D140:3 a144 s152 a158 G160:4 D164:3 a170 f176',
    },
    intro: [
      ['hq', 'New approach. LUCAS: our cheap one-way attack drone, modeled on the Shahed. Tonight you fly one remotely.'],
      ['president', 'I asked them to add a gun. And a cupholder. They added the gun.', 'happy'],
      ['hq', 'Arrows fly, Z fires, C drops bombs. When the drone factory is close, press V to dive into it.'],
      ['hero', 'Sending their own design back to them.'],
      ['president', 'Return to sender. With interest. Big interest.'],
    ],
    triggers: [
      { col: 14, radio: ['hq', 'Anti-aircraft guns on the ground. Bomb them or fly high.'] },
      { col: 52, radio: ['hq', 'SAM site! Its missiles home in. Shoot them down or out-turn them.'] },
      { col: 92, radio: ['president', 'A canyon. Don\'t scratch the paint. That drone is a rental.'] },
      { col: 160, radio: ['hq', 'Drone factory ahead. Get close and press V.'] },
    ],
    outro: [
      ['hq', 'Direct hit. The drone factory is out of business.'],
      ['president', 'They made drones. We made a better drone and sent it back. That\'s called a trade deal.', 'happy'],
    ],
  },
  {
    id: 'final', title: 'THE INVISIBLE AYATOLLAH', subtitle: 'Finale. Nobody has seen him. Time to find out why.', theme: 'city', playable: true,
    ally: ['president', 'mossad'],
    objective: { type: 'boss', boss: 'broadcast', bossName: 'THE INVISIBLE AYATOLLAH', goal: 'TAKE DOWN THE BROADCAST →' },
    bossReveal: true,
    allyBarks: {
      president: ['Final mission. My best mission. All my missions are my best.', 'I\'d like to see this guy. Nobody has. Very suspicious.', 'Cardboard! I knew it. I have a nose for cardboard.', 'After this, a parade. Big parade.'],
      mossad: ['Not him. Not him either.', 'We have his address. All seven of them.', 'Cardboard again. They buy it in bulk.', 'Stay close. I already know how this ends.'],
    },
    level: {
      ground: '#',
      terrain: R('3', 30) + R('4', 12) + R('3', 20) + R('5', 8) + R('3', 18) + R('_', 3) + R('3', 24) + R('4', 10) + R('3', 45),
      platforms: [[20, 6, 4], [48, 6, 5], [74, 6, 4], [100, 5, 5], [118, 6, 4], [138, 7, 4], [146, 5, 4]],
      blocks: [[26, 9, 'b'], [44, 8, 'x'], [45, 8, 'x'], [84, 9, 'b'], [108, 9, 'x'], [128, 9, 'b']],
      objects: 'P4 A2 S14 n18 S24 n28 Q34 g38 S46 n50 T56 D60:3 S66 n72 S78 Q82 H76:5 g86 S94 n98 T104 Q102:4 S110 n113 g118 S122 Y120:5 n126 H130 G132 M134 Z163',
    },
    intro: [
      ['hq', 'This is it. The capital. Somewhere ahead is the man nobody has seen in months: the Invisible Ayatollah.'],
      ['mossad', 'Nobody has seen him. Not even us. That bothers me professionally.'],
      ['president', 'I\'m coming too. Final missions need a president. It looks good on the poster.', 'happy'],
      ['hero', 'Sir, Agent Avi, stay close.'],
      ['mossad', 'I\'m always close. Usually in front.'],
    ],
    triggers: [
      { col: 16, radio: ['hq', 'Cutouts of the leader all over the street. Harmless. Shoot them anyway if it helps.'] },
      { col: 88, radio: ['president', 'Water! Again! This whole country is either sand or water.'] },
      { col: 136, radio: ['hq', 'The broadcast bunker. He has to be inside. He\'s live on every channel.'] },
    ],
    bossIntro: [
      ['hq', 'Every channel is showing him LIVE. The signal comes from this bunker.'],
      ['mossad', 'Holograms project a shield. Kill the holograms, then hit the screen while the signal is down.'],
      ['president', 'A man who hides behind a TV. I respect the TV part. Not the hiding part. Fire!', 'rambo'],
    ],
    bossPhases: [
      { radio: ['hq', 'The broadcast is glitching! Keep it up!'] },
      { radio: ['president', 'Cardboard falling from the sky! This is a cardboard regime!'] },
      { radio: ['mossad', 'Last broadcast. After this, reruns only.'] },
    ],
    outro: [
      ['hero', 'Sir... there\'s nobody here. Just an empty chair and a tape recorder.'],
      ['mossad', 'We knew.'],
      ['president', 'Invisible this whole time? That\'s actually a great strategy. Nobody can criticize you.'],
      ['hq', 'The broadcast is off the air. The strait is open, the launchers are gone, the bomb is secured. Mission complete.'],
      ['president', 'OPERATION EPIC FURY. Huge success. The biggest. Sergeant, you can stand next to me in the photo. Slightly behind.', 'happy'],
      ['hero', 'Thank you, sir.'],
    ],
  },
];

// President's radio lines for game events
G.PRESIDENT_BARKS = {
  rage:    [['president', 'My tie! Now you\'re me. Just with a helmet.', 'rambo']],
  civilian:[['president', 'Those were WATERMELONS! Beautiful watermelons. I feel bad for them.'], ['president', 'You blew up a carpet van. Those were nice carpets.']],
  death:   [['president', 'Get up, Sergeant! Winners don\'t lie down. They just rest.'], ['president', 'That\'s not a defeat. It\'s a tactical pause.']],
  scientist: [['president', 'That was a scientist! He was building... peace. Allegedly.'], ['hq', 'Civilian down. Watch your fire, Sergeant.']],
  dive:    [['president', 'Dive! Dive! Like my approval ratings! No, wait...'], ['hq', 'Terminal dive. Impact in three... two...']],
  himars:  [['hq', 'HIMARS inbound. Keep the laser on target.'], ['president', 'Here comes the HIMARS! Beautiful rockets. The best rockets.', 'happy']],
  launcher:[['president', 'Boom! Beautiful. I\'d put that on a magazine cover.', 'happy'], ['hq', 'Launcher destroyed.']],
};
