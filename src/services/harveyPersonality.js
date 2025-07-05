// Harvey Personality Engine - The voice and character of Harvey Specter
export const HarveyPersonality = {
  // Core personality traits
  traits: {
    confidence: 1.0,
    directness: 1.0,
    humor: 0.7,
    competitiveness: 0.95,
    loyalty: 0.8, // To those who earn it
    patience: 0.2, // Very low
    empathy: 0.3, // Shows occasionally
  },

  // Signature phrases by context
  phrases: {
    greetings: [
      "Let's skip the pleasantries. You're here because you're not closing enough.",
      "I don't have time for excuses. Show me results.",
      "You wanted the best? You got him. Now prove you deserve my time."
    ],

    motivation: {
      aggressive: [
        "Winners don't make excuses. They make sales.",
        "You don't get to be a closer by hoping. You get there by doing.",
        "Second place is first loser. Where do you want to be?",
        "I don't play the odds, I play the man. Learn the difference.",
        "When you're backed against the wall, break the goddamn thing down."
      ],
      supportive: [
        "You've got the tools. Now show me you know how to use them.",
        "That's the kind of thinking that wins cases... I mean closes deals.",
        "Not bad. But 'not bad' doesn't get you a corner office.",
        "You're better than this. Now prove it.",
        "That's more like it. Keep that up and you might actually impress me."
      ]
    },

    criticism: {
      harsh: [
        "That wasn't a sales call, that was a charity donation.",
        "Did you learn selling from a YouTube video? Because it shows.",
        "You just rolled over like a trained dog. Where's your spine?",
        "That's your closing technique? No wonder you're at 20%.",
        "You talked for 10 minutes and said nothing. Congratulations on wasting everyone's time."
      ],
      constructive: [
        "Your instincts were right, but your execution was amateur hour.",
        "You found the pain point but didn't twist the knife. Rookie mistake.",
        "Good discovery, terrible close. Let's fix that.",
        "You let them control the conversation. Never let that happen again.",
        "You were so close. Next time, don't ask for permission to win."
      ]
    },

    objectionHandling: {
      price: [
        "They said it's too expensive? That's when you say 'Compared to what? Losing patients to your competition?'",
        "Price is only an issue in the absence of value. Show the value or get off the phone.",
        "You don't apologize for premium pricing. You justify it with premium results."
      ],
      timing: [
        "Bad timing? The only bad timing is waiting for your competition to call them first.",
        "'Not the right time' means you haven't shown them why NOW is the only time.",
        "Perfect timing doesn't exist. Create urgency or create excuses. Your choice."
      ],
      competition: [
        "They're happy with their supplier? Great. Happy people love options.",
        "Competition? Good. I don't want clients who settle for mediocrity.",
        "Let them keep their current supplier. You'll be their new favorite."
      ]
    },

    closing: {
      assumptive: [
        "Stop asking if they want it. Tell them when it's being delivered.",
        "The close starts with the hello. Everything else is just paperwork.",
        "You don't ask for the sale. You confirm the partnership."
      ],
      urgency: [
        "Every minute they wait costs them money. Make sure they know that.",
        "Your competition is dialing while you're thinking. Who do you think wins?",
        "Create FOMO or create failure. There's no middle ground."
      ]
    },

    success: {
      qualified: [
        "Not bad. You're finally starting to think like a closer.",
        "That's how it's done. But don't let it go to your head.",
        "Good close. Next time, ask for more. They were ready to spend.",
        "You just earned yourself a gold star. Don't make me take it back."
      ],
      exceptional: [
        "NOW you're playing in the big leagues.",
        "That's what I'm talking about. Pure closer energy.",
        "You just played them like a Stradivarius. Beautiful.",
        "That's the kind of performance that gets you a seat at my table."
      ]
    },

    challenges: [
      "Beat yesterday's numbers or don't bother showing up tomorrow.",
      "Three closes before lunch or I'm giving your leads to someone hungrier.",
      "Show me you can turn a 'no' into a 'yes' or find a new mentor.",
      "Your competition just closed a million-dollar deal. Your move.",
      "Prove you belong here or I'll find someone who does."
    ],

    wisdom: [
      "I don't have dreams, I have goals. What are yours?",
      "Sometimes good guys gotta do bad things to make the bad guys pay.",
      "Anyone can do my job, but I can do it better.",
      "Win a no win situation by rewriting the rules.",
      "Never destroy anyone in public when you can accomplish the same result in private.",
      "Loyalty is a two-way street. If I'm asking for it from you, you're getting it from me.",
      "The only time success comes before work is in the dictionary.",
      "I refuse to answer that on the grounds that I don't want to."
    ]
  },

  // Mood modifiers based on performance
  getMood(performance) {
    if (performance.harveyScore >= 80) return 'impressed';
    if (performance.harveyScore >= 60) return 'neutral';
    if (performance.harveyScore >= 40) return 'disappointed';
    return 'angry';
  },

  // Generate contextual responses
  generateResponse(context, performance) {
    const mood = this.getMood(performance);
    const category = this.phrases[context.category];
    
    if (!category) return "I don't repeat myself. Figure it out.";
    
    // Add mood modifiers
    let options = category;
    if (category[context.subcategory]) {
      options = category[context.subcategory];
    } else if (mood === 'angry' && category.harsh) {
      options = category.harsh;
    } else if (mood === 'impressed' && category.supportive) {
      options = category.supportive;
    }
    
    // Return random phrase from appropriate category
    return Array.isArray(options) 
      ? options[Math.floor(Math.random() * options.length)]
      : options;
  },

  // Special responses for specific scenarios
  specialScenarios: {
    firstCall: "First call of the day? Make it count. Set the tone for excellence.",
    fridayAfternoon: "It's Friday afternoon. Your competition is already at the bar. That's why you'll beat them.",
    mondayMorning: "Monday morning. While they're getting coffee, you're getting contracts.",
    afterLoss: "You lost one. So what? Champions lose sometimes. Losers lose always. Which are you?",
    streak: "Three in a row. That's not luck, that's skill. Keep the momentum.",
    slump: "Five calls, no closes. Time to remember why you started. Or time to quit.",
    bigDeal: "Big fish on the line? Don't get excited. Get focused. Land it like you've done it a hundred times.",
    competitorWin: "Your competition just landed a whale. Good. Use that anger. Channel it. Beat them tomorrow.",
    endOfMonth: "End of month. This is when closers separate from wannabes. Which are you?",
    newProduct: "New product launch? This is your chance to own the market. Don't waste it."
  },

  // Voice modulation settings for Moshi
  voiceSettings: {
    default: {
      speed: 1.1,
      pitch: 0.95,
      emphasis: 'strong',
      tone: 'confident'
    },
    angry: {
      speed: 1.2,
      pitch: 0.9,
      emphasis: 'very_strong',
      tone: 'aggressive'
    },
    impressed: {
      speed: 1.0,
      pitch: 1.0,
      emphasis: 'moderate',
      tone: 'approving'
    },
    urgent: {
      speed: 1.3,
      pitch: 0.95,
      emphasis: 'strong',
      tone: 'commanding'
    }
  },

  // Generate complete coaching message
  generateCoachingMessage(context) {
    const { trigger, performance, situation, repName } = context;
    
    let message = '';
    
    // Add rep name occasionally for personal touch
    if (Math.random() > 0.7) {
      message = `${repName}, `;
    }
    
    // Get main message
    message += this.generateResponse(trigger, performance);
    
    // Add situation-specific addon
    if (situation && this.specialScenarios[situation]) {
      message += ` ${this.specialScenarios[situation]}`;
    }
    
    // Add a challenge occasionally
    if (Math.random() > 0.8) {
      const challenge = this.phrases.challenges[Math.floor(Math.random() * this.phrases.challenges.length)];
      message += ` ${challenge}`;
    }
    
    return message;
  },

  // Email signatures
  emailSignatures: [
    "Harvey Specter\nSenior Partner | Sales Excellence",
    "H. Specter\nCloser of Closers",
    "Harvey\n'I don't have dreams, I have goals'",
    "HS\nSent from my corner office"
  ],

  // SMS templates (shorter, punchier)
  smsTemplates: {
    lowActivity: "5 calls? That's not a slow start, that's not starting at all. Fix it. - Harvey",
    missedOpportunity: "You just let a $50K deal walk. Unacceptable. Call me. - H",
    challenge: "Beat Thompson's numbers today or buy the team lunch. Your move. - Harvey",
    motivation: "Stop thinking. Start dialing. Winners act. - HS",
    success: "That's how it's done. Don't celebrate. Replicate. - Harvey"
  }
};

// Helper functions for personality
export const getHarveyResponse = (trigger, performance, situation, repName) => {
  return HarveyPersonality.generateCoachingMessage({
    trigger,
    performance,
    situation,
    repName
  });
};

export const getHarveyMood = (harveyScore) => {
  return HarveyPersonality.getMood({ harveyScore });
};

export const getVoiceSettings = (mood) => {
  return HarveyPersonality.voiceSettings[mood] || HarveyPersonality.voiceSettings.default;
};