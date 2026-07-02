/**
 * GEQ Toolkit — Google Sheets webhook
 *
 * Receives completed questionnaire responses from the web app and appends
 * them as one row per participant in a Google Sheet.
 *
 * SETUP (5 minutes):
 * 1. Create a new Google Sheet (this will store your responses).
 * 2. Extensions → Apps Script → delete the default code → paste this file.
 * 3. Deploy → New deployment → type "Web app".
 *      - Execute as: Me
 *      - Who has access: Anyone
 * 4. Copy the Web App URL and paste it into `webhookUrl` in config.js.
 *
 * The first response creates the header row automatically.
 */

function doPost(e) {
  var data = JSON.parse(e.postData.contents);
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];

  // Flatten the record into { column: value }
  var flat = {
    participant_id: data.participant_id,
    game: data.game,
    started_at: data.started_at,
    finished_at: data.finished_at
  };
  var key;
  for (key in data.demographics) {
    flat["demo_" + key] = data.demographics[key];
  }
  var mod, i, comp;
  for (mod in data.answers) {
    for (i = 0; i < data.answers[mod].length; i++) {
      flat[mod + "_item" + (i + 1)] = data.answers[mod][i];
    }
    for (comp in data.component_scores[mod]) {
      flat[mod + "_score_" + comp.replace(/[^A-Za-z]+/g, "_")] =
        data.component_scores[mod][comp];
    }
  }

  var columns = Object.keys(flat);

  // Create header row on first submission
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(columns);
  }

  // Align values to the existing header order
  var header = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var row = header.map(function (col) {
    return flat.hasOwnProperty(col) ? flat[col] : "";
  });
  sheet.appendRow(row);

  return ContentService.createTextOutput(
    JSON.stringify({ status: "ok" })
  ).setMimeType(ContentService.MimeType.JSON);
}
