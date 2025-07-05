// Simple Harvey Coach Demo - No database required
import { HarveyPersonality } from './src/services/harveyPersonality.js';

console.log('🎯 Harvey Specter Sales Coach Demo\n');
console.log('="="="="="="="="="="="="="="="="="=\n');

// Show Harvey's personality in action
const demoScenarios = [
  {
    context: "Low morning activity (2 calls by 10 AM)",
    response: HarveyPersonality.phrases.motivation.aggressive[0]
  },
  {
    context: "Failed to close after 10-minute call",
    response: HarveyPersonality.phrases.criticism.harsh[1]
  },
  {
    context: "Accepted 'happy with current supplier' objection",
    response: HarveyPersonality.phrases.objectionHandling.competition[0]
  },
  {
    context: "Successfully closed a deal",
    response: HarveyPersonality.phrases.success.qualified[1]
  },
  {
    context: "Rep asks how to handle price objections",
    response: HarveyPersonality.phrases.objectionHandling.price[0]
  }
];

console.log('🎭 HARVEY\'S COACHING SAMPLES:\n');
demoScenarios.forEach((scenario, index) => {
  console.log(`${index + 1}. Scenario: ${scenario.context}`);
  console.log(`   Harvey: "${scenario.response}"\n`);
});

// Show daily challenges
console.log('📋 HARVEY\'S DAILY CHALLENGES:\n');
const challenges = HarveyPersonality.phrases.challenges;
challenges.slice(0, 3).forEach((challenge, index) => {
  console.log(`Challenge ${index + 1}: "${challenge}"\n`);
});

// Show Harvey's wisdom
console.log('💎 HARVEY\'S WISDOM:\n');
const wisdom = HarveyPersonality.phrases.wisdom;
wisdom.slice(0, 3).forEach((quote) => {
  console.log(`"${quote}"\n`);
});

// Demo conversation flow
console.log('🎬 SAMPLE COACHING CONVERSATION:\n');
console.log('Rep: "I just had a 15-minute call and they said they need to think about it."');
console.log('Harvey: "' + HarveyPersonality.phrases.criticism.harsh[3] + '"');
console.log('\nRep: "But they seemed interested..."');
console.log('Harvey: "' + HarveyPersonality.phrases.closing.assumptive[0] + '"');
console.log('\nRep: "What should I do next time?"');
console.log('Harvey: "' + HarveyPersonality.phrases.closing.urgency[0] + '"');

// Show special scenarios
console.log('\n⏰ TIME-BASED COACHING:\n');
Object.entries(HarveyPersonality.specialScenarios).slice(0, 4).forEach(([scenario, message]) => {
  console.log(`${scenario}: "${message}"\n`);
});

console.log('✅ Harvey is ready to transform your sales team!\n');
console.log('To integrate Harvey with your system:');
console.log('1. Import harveyCoach service');
console.log('2. Initialize for each rep: harveyCoach.initializeRep(repId, repName)');
console.log('3. Harvey will monitor and coach automatically');
console.log('4. Check the leaderboard: harveyCoach.updateLeaderboard()');
console.log('\n"That\'s how winners do it. Now go close some deals." - Harvey');