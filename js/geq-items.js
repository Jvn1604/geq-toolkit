/* ============================================================
 * GEQ Item Bank & Scoring Definitions
 * Source: IJsselsteijn, W.A., de Kort, Y.A.W., & Poels, K. (2013).
 * The Game Experience Questionnaire. Technische Universiteit Eindhoven.
 * Do not edit item wording — validity of the instrument depends on it.
 * ============================================================ */

const GEQ_SCALE = [
  { value: 0, label: "not at all" },
  { value: 1, label: "slightly" },
  { value: 2, label: "moderately" },
  { value: 3, label: "fairly" },
  { value: 4, label: "extremely" }
];

const GEQ_MODULES = {
  core: {
    id: "core",
    name: "Core Module",
    instruction:
      "Please indicate how you felt while playing the game for each of the items.",
    items: [
      "I felt content",
      "I felt skilful",
      "I was interested in the game's story",
      "I thought it was fun",
      "I was fully occupied with the game",
      "I felt happy",
      "It gave me a bad mood",
      "I thought about other things",
      "I found it tiresome",
      "I felt competent",
      "I thought it was hard",
      "It was aesthetically pleasing",
      "I forgot everything around me",
      "I felt good",
      "I was good at it",
      "I felt bored",
      "I felt successful",
      "I felt imaginative",
      "I felt that I could explore things",
      "I enjoyed it",
      "I was fast at reaching the game's targets",
      "I felt annoyed",
      "I felt pressured",
      "I felt irritable",
      "I lost track of time",
      "I felt challenged",
      "I found it impressive",
      "I was deeply concentrated in the game",
      "I felt frustrated",
      "It felt like a rich experience",
      "I lost connection with the outside world",
      "I felt time pressure",
      "I had to put a lot of effort into it"
    ],
    // Item numbers are 1-based, matching the published scoring guidelines.
    components: {
      "Competence": [2, 10, 15, 17, 21],
      "Sensory and Imaginative Immersion": [3, 12, 18, 19, 27, 30],
      "Flow": [5, 13, 25, 28, 31],
      "Tension/Annoyance": [22, 24, 29],
      "Challenge": [11, 23, 26, 32, 33],
      "Negative Affect": [7, 8, 9, 16],
      "Positive Affect": [1, 4, 6, 14, 20]
    }
  },

  ingame: {
    id: "ingame",
    name: "In-game Module",
    instruction:
      "Please indicate how you felt while playing the game for each of the items.",
    items: [
      "I was interested in the game's story",
      "I felt successful",
      "I felt bored",
      "I found it impressive",
      "I forgot everything around me",
      "I felt frustrated",
      "I found it tiresome",
      "I felt irritable",
      "I felt skilful",
      "I felt completely absorbed",
      "I felt content",
      "I felt challenged",
      "I had to put a lot of effort into it",
      "I felt good"
    ],
    components: {
      "Competence": [2, 9],
      "Sensory and Imaginative Immersion": [1, 4],
      "Flow": [5, 10],
      "Tension": [6, 8],
      "Challenge": [12, 13],
      "Negative Affect": [3, 7],
      "Positive Affect": [11, 14]
    }
  },

  social: {
    id: "social",
    name: "Social Presence Module",
    instruction:
      "Please indicate how you felt while playing the game for each of the items. " +
      "\u201cThe other(s)\u201d refers to in-game characters, online co-players, or people playing with you.",
    items: [
      "I empathized with the other(s)",
      "My actions depended on the other(s) actions",
      "The other's actions were dependent on my actions",
      "I felt connected to the other(s)",
      "The other(s) paid close attention to me",
      "I paid close attention to the other(s)",
      "I felt jealous about the other(s)",
      "I found it enjoyable to be with the other(s)",
      "When I was happy, the other(s) was(were) happy",
      "When the other(s) was(were) happy, I was happy",
      "I influenced the mood of the other(s)",
      "I was influenced by the other(s) moods",
      "I admired the other(s)",
      "What the other(s) did affected what I did",
      "What I did affected what the other(s) did",
      "I felt revengeful",
      "I felt schadenfreude (malicious delight)"
    ],
    components: {
      "Psychological Involvement \u2013 Empathy": [1, 4, 8, 9, 10, 13],
      "Psychological Involvement \u2013 Negative Feelings": [7, 11, 12, 16, 17],
      "Behavioural Involvement": [2, 3, 5, 6, 14, 15]
    }
  },

  postgame: {
    id: "postgame",
    name: "Post-game Module",
    instruction:
      "Please indicate how you felt after you finished playing the game for each of the items.",
    items: [
      "I felt revived",
      "I felt bad",
      "I found it hard to get back to reality",
      "I felt guilty",
      "It felt like a victory",
      "I found it a waste of time",
      "I felt energised",
      "I felt satisfied",
      "I felt disoriented",
      "I felt exhausted",
      "I felt that I could have done more useful things",
      "I felt powerful",
      "I felt weary",
      "I felt regret",
      "I felt ashamed",
      "I felt proud",
      "I had a sense that I had returned from a journey"
    ],
    components: {
      "Positive Experience": [1, 5, 7, 8, 12, 16],
      "Negative Experience": [2, 4, 6, 11, 14, 15],
      "Tiredness": [10, 13],
      "Returning to Reality": [3, 9, 17]
    }
  }
};

/* Component score = mean of its items (per the published scoring guidelines). */
function scoreModule(moduleId, answers) {
  const mod = GEQ_MODULES[moduleId];
  const scores = {};
  for (const [component, itemNums] of Object.entries(mod.components)) {
    const vals = itemNums.map((n) => answers[n - 1]);
    scores[component] =
      Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100) / 100;
  }
  return scores;
}
