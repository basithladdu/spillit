#!/usr/bin/env node

/**
 * Instagram Reel Generator for Spillit
 * Creates engaging reel scripts for social media promotion
 * Usage: node scripts/generate-ig-reel.js [theme]
 */

const fs = require('fs');
const path = require('path');

const REEL_TEMPLATES = {
  // Hook-First Format (best for Instagram)
  'hook-first': {
    duration: '15-30 seconds',
    scenes: [
      {
        title: 'Hook (0-2s)',
        copy: 'POV: You just witnessed something that changed your perspective.',
        visuals: ['Quick map pan', 'Red pin drops', 'Surprised face reaction'],
        music: 'Trending sound',
      },
      {
        title: 'Problem (2-5s)',
        copy: 'But you don\'t know where to share it... or do you?',
        visuals: ['Phone swipe', 'Confused emoji', 'Search bars'],
        music: 'Same trending sound (build)',
      },
      {
        title: 'Solution (5-10s)',
        copy: 'Spill It: Drop a photo. Pin the spot. Stay anonymous. Done.',
        visuals: ['App demo', 'Upload animation', 'Map update', 'Notification ping'],
        music: 'Drop/beat sync',
      },
      {
        title: 'CTA (10-12s)',
        copy: 'Every place holds a secret. What\'s yours?',
        visuals: ['App screenshot', 'Logo reveal', 'QR code'],
        music: 'Outro',
      },
    ],
    hashtags: ['#SpillIt', '#AnonymousApp', '#MapApp', '#CommunitySharing', '#TeenTok', '#NewApp'],
    captions: [
      'Just dropped 🔥 Share your secrets anonymously on the map.',
      'Your story. Your spot. No names. 📍 Download now.',
      'Turn moments into memories. Pin them to the world. 🌍',
    ],
  },

  // Trend-Jacking Format
  'trend-jacking': {
    duration: '8-15 seconds',
    scenes: [
      {
        title: 'Trending Audio + Hook',
        copy: '[Use trending sound] + "Wait for the payoff"',
        visuals: ['Trending format video', 'Person looking at phone'],
        music: 'Trending sound (full)',
      },
      {
        title: 'Twist Reveal',
        copy: 'This is happening on Spill It RIGHT NOW',
        visuals: ['Real app screenshots', 'Actual memory pins', 'Live feed'],
        music: 'Sound builds',
      },
      {
        title: 'CTA',
        copy: 'Download link in bio 👇',
        visuals: ['Download button', 'App icon', 'QR code'],
        music: 'Sound peak',
      },
    ],
    hashtags: ['#ForYou', '#FYP', '#Viral', '#SpillIt', '#NewApp'],
    captions: [
      'This app is crazy 💀 (in a good way)',
      'Why is nobody talking about this yet?',
      'POV: You just found your new favorite app',
    ],
  },

  // Educational/Demo Format
  'educational': {
    duration: '20-30 seconds',
    scenes: [
      {
        title: 'Problem Statement (0-5s)',
        copy: 'You see something. A moment. A broken thing. A beautiful view.',
        visuals: ['Split screen: street scene, moment, broken item, sunset'],
        music: 'Calm, inspiring',
      },
      {
        title: 'Traditional Way (5-10s)',
        copy: 'Normally you\'d just forget it... or tell your friend.',
        visuals: ['Sad face, phone scroll, conversation'],
        music: 'Same music continues',
      },
      {
        title: 'Spill It Way (10-20s)',
        copy: 'Spill It lets you pin it to the exact spot, help your community see it.',
        visuals: [
          'App open',
          'Camera opens',
          'Snap photo',
          'Pin drops on map',
          'Location auto-fills',
          'Caption added',
          'Published (poof animation)',
        ],
        music: 'Uplifting moment',
      },
      {
        title: 'Impact (20-25s)',
        copy: 'Now 1000s of people know. Action gets taken.',
        visuals: ['Map with multiple pins', 'Notification', 'Real community impact'],
        music: 'Triumphant moment',
      },
      {
        title: 'CTA (25-30s)',
        copy: 'Be the change. Spill It.',
        visuals: ['App icon', 'Download prompt'],
        music: 'Outro',
      },
    ],
    hashtags: ['#SpillIt', '#CommunityAction', '#MakeDifference', '#AnonymousApp'],
    captions: [
      'This app just made me realize I can actually DO something about issues I see.',
      'Finally a way to report issues AND stay anonymous 🙌',
      'Community-powered problem solving 📍',
    ],
  },

  // FOMO/Urgency Format
  'fomo': {
    duration: '10-15 seconds',
    scenes: [
      {
        title: 'The Scene (0-3s)',
        copy: '[Trending audio hook]',
        visuals: ['Active people using app', 'Pins dropping', 'Engagement notifications'],
        music: 'High-energy trending sound',
      },
      {
        title: 'Missing Out (3-7s)',
        copy: 'Your city is already spilling. Are you?',
        visuals: ['Map with tons of pins', 'Feed of new memories', 'Comments/reactions'],
        music: 'Sound intensifies',
      },
      {
        title: 'Join (7-12s)',
        copy: 'Don\'t miss out. Download now.',
        visuals: ['Download screen', 'App opening', 'First memory posted'],
        music: 'Sound peak + beat drop',
      },
      {
        title: 'Outro (12-15s)',
        copy: 'Spill It',
        visuals: ['Logo', 'QR code'],
        music: 'Sound outro',
      },
    ],
    hashtags: ['#SpillIt', '#FYP', '#NewApp', '#Limited', '#JoinNow'],
    captions: [
      '2000+ people already spilling. Your city waiting for you 📍',
      'This is the app your city needed',
      'FOMO is real. Download now 👇',
    ],
  },
};

// Generate Instagram Reel Script
function generateReelScript(theme = 'hook-first') {
  const template = REEL_TEMPLATES[theme] || REEL_TEMPLATES['hook-first'];

  const script = {
    title: `Spillit Instagram Reel - ${theme.replace('-', ' ').toUpperCase()}`,
    duration: template.duration,
    theme,
    generatedAt: new Date().toISOString(),
    videoSpecs: {
      format: 'Vertical (9:16)',
      minDuration: '15 seconds',
      maxDuration: '90 seconds',
      recommended: '30-45 seconds',
      fps: '30fps',
      resolution: '1080x1920',
      audio: 'Trending Instagram/TikTok sound',
    },
    scenes: template.scenes.map((scene, idx) => ({
      sceneNumber: idx + 1,
      ...scene,
      tips: getSceneTips(scene.title),
    })),
    hashtags: template.hashtags,
    suggestedCaptions: template.captions,
    productionTips: [
      '🎬 Use your phone vertical camera',
      '🔊 Pick a trending sound FIRST (it drives the narrative)',
      '⚡ Quick cuts (0.5-1s per visual) keep engagement',
      '📍 Show real Spillit features/data',
      '🎯 First 3 seconds must hook viewers',
      '💾 Export as .mp4 (Instagram prefers)',
      '📱 Test on mobile before posting',
      '🔗 Add clickable link sticker to bio/link',
    ],
    postingStrategy: {
      bestTimes: [
        '6-9 AM (commute time)',
        '12-1 PM (lunch break)',
        '6-9 PM (evening scroll)',
      ],
      postingDays: 'Tuesday-Thursday',
      frequency: '3-5 reels per week for growth',
      lifespan: '7-14 days peak engagement',
    },
    contentCalendar: [
      { week: 1, theme: 'hook-first', focus: 'App introduction' },
      { week: 2, theme: 'educational', focus: 'Problem-solving aspect' },
      { week: 3, theme: 'trend-jacking', focus: 'Viral momentum' },
      { week: 4, theme: 'fomo', focus: 'Community adoption' },
      { week: 5, theme: 'educational', focus: 'Real user stories' },
      { week: 6, theme: 'hook-first', focus: 'Feature deep-dive' },
    ],
  };

  return script;
}

// Scene-specific production tips
function getSceneTips(sceneTitle) {
  const tips = {
    'Hook (0-2s)': 'Most viewers leave at 3s. Make it STOP them scrolling.',
    'Problem (2-5s)': 'Show the pain point clearly. Make them nod "yes, that\'s me".',
    'Solution (5-10s)': 'Show the app in action. Real, actual features.',
    'CTA (10-12s)': 'Make the call-to-action dead simple. QR + "Download" or link.',
    'Trending Audio + Hook': 'Align your visuals with beat drops for maximum impact.',
    'Twist Reveal': 'The surprise should be obvious but delightful.',
    'Problem Statement (0-5s)': 'Use real footage or high-quality stock. Avoid generic corporate vibes.',
    'Traditional Way (5-10s)': 'Exaggerate the frustration for effect (but keep it relatable).',
    'Spill It Way (10-20s)': 'Screen recording of actual app flow is gold here.',
    'Impact (20-25s)': 'Show real data: number of users, active pins, engagement.',
    'The Scene (0-3s)': 'Energy must match the trending audio perfectly.',
    'Missing Out (3-7s)': 'Show your city\'s map with LOTS of activity.',
    'Join (7-12s)': 'Make downloading look effortless.',
  };
  return tips[sceneTitle] || 'Execute this scene clearly and keep it tight.';
}

// Generate social media captions
function generateCaptions() {
  return {
    shortForm: [
      '📍 Spill It - Drop your truth, stay anonymous.',
      'Every place has a story. What\'s yours? 🗺️',
      'Your secret. The map. No names.',
      'Share what you see. Help your community. Stay anonymous. 🔥',
      'The app that turns moments into movement.',
    ],
    mediumForm: [
      'Just launched: Spill It 🔥 An anonymous mapping app for sharing what you see, where you see it. No names. No judgment. Just community impact.\n\nYour observation could be the change your city needs. 📍',
      'Tired of seeing issues but feeling powerless? Spill It lets you:\n✓ Take a photo\n✓ Pin the spot\n✓ Stay completely anonymous\n✓ Empower your community\n\nDownload now 👇',
    ],
    longForm: [
      `We built Spill It because the world needs a better way to share what we see.

You spot a pothole, broken bench, beautiful moment, community issue.

Normally? You scroll past. Maybe text a friend.

With Spill It? You snap a photo, pin the exact spot on the map, add context, and stay completely anonymous.

One photo. One pin. Thousands of people informed. Real change triggered.

This is crowdsourced community intelligence. This is how we solve problems together.

Download Spill It today. Your observation could change everything. 🗺️📍

Link in bio.`,
    ],
  };
}

// Save script to file
function saveScript(script, filename = 'reel-script.json') {
  const outputPath = path.join(__dirname, `..`, 'marketing', filename);
  const marketingDir = path.join(__dirname, '..', 'marketing');

  // Create marketing directory if it doesn't exist
  if (!fs.existsSync(marketingDir)) {
    fs.mkdirSync(marketingDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(script, null, 2));
  console.log(`✅ Reel script saved to: ${outputPath}`);

  return outputPath;
}

// Main execution
function main() {
  const theme = process.argv[2] || 'hook-first';

  console.log(`\n🎬 Generating Instagram Reel Script: ${theme}\n`);

  const script = generateReelScript(theme);
  const captions = generateCaptions();

  // Print to console
  console.log('='.repeat(60));
  console.log(`SPILLIT INSTAGRAM REEL - ${theme.toUpperCase()}`);
  console.log('='.repeat(60));
  console.log(`\nDuration: ${script.duration}`);
  console.log(`Theme: ${script.theme}`);
  console.log('\n📹 SCENES:\n');

  script.scenes.forEach((scene) => {
    console.log(`\n${scene.sceneNumber}. ${scene.title}`);
    console.log(`   Copy: "${scene.copy}"`);
    console.log(`   Visuals: ${scene.visuals.join(' → ')}`);
    console.log(`   Tip: ${scene.tips}`);
  });

  console.log('\n\n📝 HASHTAGS:');
  console.log(script.hashtags.join(' '));

  console.log('\n\n💬 SUGGESTED CAPTIONS:');
  script.suggestedCaptions.forEach((cap, i) => {
    console.log(`   ${i + 1}. "${cap}"`);
  });

  console.log('\n\n🎯 PRODUCTION TIPS:');
  script.productionTips.forEach((tip) => {
    console.log(`   ${tip}`);
  });

  console.log('\n\n⏱️ POSTING STRATEGY:');
  console.log(`   Best Times: ${script.postingStrategy.bestTimes.join(', ')}`);
  console.log(`   Days: ${script.postingStrategy.postingDays}`);
  console.log(`   Frequency: ${script.postingStrategy.frequency}`);

  console.log('\n\n📅 4-WEEK CONTENT CALENDAR:');
  script.contentCalendar.forEach((week) => {
    console.log(`   Week ${week.week}: ${week.theme.toUpperCase()} - ${week.focus}`);
  });

  // Save to file
  saveScript(script, `reel-${theme}-${Date.now()}.json`);

  // Also save captions
  const captionsPath = path.join(__dirname, '..', 'marketing', 'captions.json');
  const marketingDir = path.join(__dirname, '..', 'marketing');
  if (!fs.existsSync(marketingDir)) {
    fs.mkdirSync(marketingDir, { recursive: true });
  }
  fs.writeFileSync(captionsPath, JSON.stringify(captions, null, 2));
  console.log(`✅ Captions saved to: ${captionsPath}`);

  console.log('\n✅ Script generation complete!\n');
}

// Show available themes
function showThemes() {
  console.log('Available reel templates:\n');
  Object.keys(REEL_TEMPLATES).forEach((theme) => {
    console.log(`  • ${theme}`);
  });
  console.log(
    '\nUsage: node scripts/generate-ig-reel.js [theme]\n',
  );
}

// Run
if (process.argv[2] === '--list' || process.argv[2] === '-l') {
  showThemes();
} else {
  main();
}

module.exports = { generateReelScript, generateCaptions, REEL_TEMPLATES };
