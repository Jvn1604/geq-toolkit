/* ============================================================
 * Escape the Debt — Debt Management Awareness Questionnaire
 * Item bank & scoring definitions.
 * Instrument: "Escape the Debt – Debt Management Awareness"
 * (custom instrument, UTeM Final Year Project, Jeeventhiran).
 * Scale: 1 Strongly Disagree .. 5 Strongly Agree.
 * Do not edit item wording — keep it identical to the paper form
 * so paper and digital responses stay comparable.
 * ============================================================ */

const GEQ_SCALE = [
  { value: 1, label: "strongly disagree" },
  { value: 2, label: "disagree" },
  { value: 3, label: "neutral" },
  { value: 4, label: "agree" },
  { value: 5, label: "strongly agree" }
];

const GEQ_MODULES = {
  learning_engagement: {
    id: "learning_engagement",
    name: "Section A: Learning Engagement",
    instruction:
      "Please indicate how much you agree with each statement about your experience playing Escape the Debt.",
    items: [
      "The game helped me understand how debt affects financial decisions.",
      "I found debt management puzzles helpful for learning financial concepts.",
      "The game made me more aware of the consequences of poor financial choices.",
      "I was motivated to complete the puzzles to learn about debt management.",
      "The game's feedback systems helped me understand the outcomes of financial decisions."
    ],
    components: {
      "Learning Engagement": [1, 2, 3, 4, 5]
    }
  },

  financial_knowledge: {
    id: "financial_knowledge",
    name: "Section B: Financial Knowledge and Concepts",
    instruction:
      "Please indicate how much you agree with each statement about your financial knowledge.",
    items: [
      "I understand that paying only the minimum payment on a credit card allows the debt to grow through compound interest.",
      "I understand that PTPTN loans in Malaysia are government-funded education loans with repayment obligations after graduation.",
      "Using BNPL repeatedly on different platforms can put me at risk of financial difficulties.",
      "I understand that the amount of credit I use compared to my available credit can affect my financial health.",
      "I understand that using BNPL from several platforms can make it difficult to keep track of my total payments.",
      "I know that unpaid debt can grow quickly when interest continues to accumulate, especially when the interest rate is high.",
      "When I have several debts, I believe it is better to pay the debt with the highest interest rate first.",
      "I understand that paying off high-interest debt first can help me save money in the long term.",
      "I understand that financial stress can affect my ability to make good financial decisions.",
      "I can distinguish between things I need and things I want when deciding how to spend my money.",
      "BNPL may seem affordable because I can pay later, but it can encourage me to spend more than I can afford.",
      "I understand that managing debt effectively requires me to keep track of my income, expenses, and debt payments.",
      "I understand that having an emergency fund can help me avoid taking on new debt when unexpected expenses occur."
    ],
    components: {
      "Financial Knowledge and Concepts": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]
    }
  },

  financial_decision_making: {
    id: "financial_decision_making",
    name: "Section C: Financial Decision Making",
    instruction:
      "Please indicate how much you agree with each statement about your financial decision-making.",
    items: [
      "I feel confident making decisions about which debts to prioritize based on interest rates and risk.",
      "I can recognize when a financial opportunity (like BNPL) is a potential trap rather than a genuine solution.",
      "I feel confident explaining the consequences of credit card debt to someone unfamiliar with financial concepts.",
      "I understand how to create and follow a budget that allows me to repay debt responsibly.",
      "I feel prepared to make financially responsible decisions in real-life situations similar to those in the game."
    ],
    components: {
      "Financial Decision Making": [1, 2, 3, 4, 5]
    }
  },

  learning_outcomes: {
    id: "learning_outcomes",
    name: "Section D: Learning Outcomes and Behavioral Awareness",
    instruction:
      "Please indicate how much you agree with each statement about what you took away from the game.",
    items: [
      "After playing the game, I understand the real consequences of not repaying PTPTN loans on time.",
      "The game taught me how compound interest on credit card debt can trap users in long-term repayment cycles.",
      "I now recognize BNPL services as a potential financial risk if overused without planning.",
      "I feel more confident making responsible financial decisions about borrowing and spending.",
      "I intend to apply the debt management strategies I learned from the game in my real life.",
      "The game increased my awareness that financial decisions have long-term consequences on stability.",
      "I now understand the importance of prioritizing high-interest debt before accumulating new debt.",
      "I believe that stress management and financial stability are directly connected.",
      "The game helped me realize how easy it is to become trapped by multiple debts if decisions are not carefully managed."
    ],
    components: {
      "Learning Outcomes and Behavioral Awareness": [1, 2, 3, 4, 5, 6, 7, 8, 9]
    }
  }
};

/* Component score = mean of its items (1-5 scale). */
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
