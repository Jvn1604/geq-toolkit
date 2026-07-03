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

  // Hero background and logo shown on the welcome screen.
  // Swap these out for your own game. Set to "" to fall back to plain text.
  heroImage: "assets/hero-bg.png",
  logoImage: "assets/game-logo.png",
  tagline: "Learn today, live debt-free tomorrow.",

  // Which GEQ modules to run, in order.
  // Available: "core", "ingame", "social", "postgame"
  modules: ["core", "postgame"],

  // Participant ID: "auto" generates one (P-xxxx), "ask" shows an input
  // so you can assign IDs yourself (recommended for controlled studies).
  participantId: "ask",

  // Ask gender before the questionnaire. Options are fixed to Male / Female
  // per the instrument sheet used at UTeM. Set to false to hide the field.
  askGender: true,

  // Additional optional demographics beyond ID + gender.
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
  // Setup guide: see README.md → "Collecting responses remotely".
  webhookUrl: " https://script.google.com/macros/s/AKfycbybbI-Mjo4yYqMFVHL0xuKqcok59CIKvKB2uKhIPYAgB0mrtElzZy2XPtnN3rBHWkColA/exec ",

  // Show participants their component scores at the end?
  showResultsToParticipant: true,

  // Save each completed response to the browser's localStorage so the
  // researcher dashboard (dashboard.html) can visualise it. Recommended.
  saveToDashboard: true,

  // Passphrase to open dashboard.html. Set to "" for no passphrase.
  dashboardPasscode: "utem2026"
};
