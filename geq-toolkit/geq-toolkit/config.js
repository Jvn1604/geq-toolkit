/* ============================================================
 * GEQ Toolkit — Study Configuration
 * This is the ONLY file you need to edit to use this for your game.
 * ============================================================ */

const STUDY_CONFIG = {
  // Shown to participants on the welcome screen.
  gameName: "Escape The Debt",
  studyTitle: "Game Experience Study",
  researcher: "Jeeventhiran — Universiti Teknikal Malaysia Melaka (UTeM)",
  contactEmail: "jeeven1604@gmail.com",

  // Which GEQ modules to run, in order.
  // Available: "core", "ingame", "social", "postgame"
  // Note: "social" should only be enabled if the game involves
  // co-players or meaningful in-game characters.
  // Note: "ingame" is a short version of "core" meant for repeated
  // measurement during play — most studies use core + postgame.
  modules: ["core", "postgame"],

  // Participant ID: "auto" generates one (P-xxxx), "ask" shows an input
  // so you can assign IDs yourself (recommended for controlled studies).
  participantId: "ask",

  // Optional demographic questions shown before the questionnaire.
  // Set to [] to skip. type: "text" | "number" | "select"
  demographics: [
    { id: "age", label: "Age", type: "number" },
    {
      id: "gaming_freq",
      label: "How often do you play video games?",
      type: "select",
      options: ["Daily", "A few times a week", "A few times a month", "Rarely", "Never"]
    }
  ],

  // Optional: paste a Google Apps Script Web App URL here to send
  // each completed response to a Google Sheet automatically.
  // Leave as "" to rely on the CSV/JSON download only.
  // Setup guide: see README.md → "Collecting responses remotely".
  webhookUrl: "",

  // Show participants their component scores at the end?
  // Turn off if you don't want to influence discussion afterwards.
  showResultsToParticipant: true
};
