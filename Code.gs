const SPREADSHEET_ID = 'PASTE_YOUR_GOOGLE_SHEET_ID_HERE';
const SHEET_NAME = 'Orders';
const HEADERS = [
  'Request ID', 'Submitted at', 'Status', 'Customer name', 'Contact method',
  'Contact detail', 'Service', 'Selected options', 'Estimate', 'Preferred date',
  'Preferred time', 'Timezone', 'Additional details'
];
const WEBHOOK_PROPERTY_BY_SERVICE = {
  'BoL (Battle For The Light)': 'WEBHOOK_ALFHEIM',
  'Jotunheim Attacking/Spying': 'WEBHOOK_JOTUNHEIM_SPY',
  'Main Asgard Attacking/Spying': 'WEBHOOK_ASGARD_SPY',
  'Mini Asgard Attacking/Spying': 'WEBHOOK_MINI_ASGARD_SPY',
  'Mini Asgard Towers': 'WEBHOOK_MINI_ASGARD_TOWERS',
  'Main Asgard Towers': 'WEBHOOK_BIG_ASGARD_TOWERS',
  'Holding the Throne': 'WEBHOOK_HOLDING_THE_THRONE',
  'Personal Discord Bot': 'WEBHOOK_CUSTOM_BOT'
};

function setupSheet() {
  const spreadsheet = getSpreadsheet_();
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = spreadsheet.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.setFrozenRows(1);
  }
}

function doPost(e) {
  const data = e && e.parameter ? e.parameter : {};
  if (data.website) return result_(false);
  if (data.requestOnly !== 'on') return result_(false);

  const contactMethods = ['Telegram', 'LINE', 'Email'];
  const customerName = required_(data.customerName, 100);
  const contact = required_(data.contact, 200);
  const service = required_(data.service, 160);
  const selection = required_(data.selection, 300);
  const estimate = required_(data.estimate, 160);
  const contactMethod = required_(data.contactMethod, 20);
  if (!customerName || !contact || !service || !selection || !estimate ||
      contactMethods.indexOf(contactMethod) === -1) return result_(false);
  if (contactMethod === 'Email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)) return result_(false);

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  let notification;
  try {
    const spreadsheet = getSpreadsheet_();
    const sheet = spreadsheet.getSheetByName(SHEET_NAME);
    if (!sheet || sheet.getLastRow() === 0) throw new Error('Run setupSheet before accepting orders.');

    const requestId = Utilities.getUuid();
    const preferredDate = optional_(data.preferredDate, 20);
    const preferredTime = optional_(data.preferredTime, 20);
    const timezone = optional_(data.timezone, 80);
    const values = [
      requestId,
      new Date().toISOString(),
      'Pending',
      customerName,
      contactMethod,
      contact,
      service,
      selection,
      estimate,
      preferredDate,
      preferredTime,
      timezone,
      optional_(data.notes, 1000)
    ].map(value => typeof value === 'string' ? safeCell_(value) : value);
    const row = sheet.getLastRow() + 1;
    sheet.getRange(row, 1, 1, values.length).setNumberFormat('@');
    sheet.getRange(row, 1, 1, values.length).setValues([values]);
    notification = {
      requestId: requestId,
      service: service,
      selection: selection,
      estimate: estimate,
      preferredDate: preferredDate,
      preferredTime: preferredTime,
      timezone: timezone
    };
  } finally {
    lock.releaseLock();
  }
  notifyDiscord_(
    notification.requestId,
    notification.service,
    notification.selection,
    notification.estimate,
    notification.preferredDate,
    notification.preferredTime,
    notification.timezone
  );
  return result_(true);
}

function getSpreadsheet_() {
  if (!SPREADSHEET_ID || SPREADSHEET_ID === 'PASTE_YOUR_GOOGLE_SHEET_ID_HERE') {
    throw new Error('Set SPREADSHEET_ID in Code.gs before deployment.');
  }
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function required_(value, maxLength) {
  const text = optional_(value, maxLength);
  return text;
}

function optional_(value, maxLength) {
  return String(value || '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, maxLength);
}

function safeCell_(value) {
  return /^[=+\-@]/.test(value) ? "'" + value : value;
}

function notifyDiscord_(requestId, service, selection, estimate, preferredDate, preferredTime, timezone) {
  const propertyName = WEBHOOK_PROPERTY_BY_SERVICE[service];
  if (!propertyName) {
    console.error('No Discord webhook mapping configured for service: ' + service);
    return;
  }

  const webhookUrl = PropertiesService.getScriptProperties().getProperty(propertyName);
  if (!webhookUrl) {
    console.warn('Discord notification skipped: Script Property ' + propertyName + ' is not set.');
    return;
  }

  const preferredSlot = [preferredDate, preferredTime, timezone].filter(Boolean).join(' ');
  const content = [
    'New service request',
    'Request: ' + requestId,
    'Service: ' + service,
    'Options: ' + selection,
    'Estimate: ' + estimate,
    preferredSlot ? 'Preferred time: ' + preferredSlot : ''
  ].filter(Boolean).join('\n');

  try {
    const response = UrlFetchApp.fetch(webhookUrl, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({content: content, allowed_mentions: {parse: []}}),
      muteHttpExceptions: true
    });
    const status = response.getResponseCode();
    if (status < 200 || status >= 300) {
      console.error('Discord notification failed for ' + service + ' with HTTP ' + status + '.');
    }
  } catch (error) {
    console.error('Discord notification failed for ' + service + ': ' + error.message);
  }
}

function testAllWebhooks() {
  const properties = PropertiesService.getScriptProperties();
  Object.keys(WEBHOOK_PROPERTY_BY_SERVICE).forEach(function(service) {
    const propertyName = WEBHOOK_PROPERTY_BY_SERVICE[service];
    const webhookUrl = properties.getProperty(propertyName);
    if (!webhookUrl) {
      console.warn('Webhook test skipped: Script Property ' + propertyName + ' is not set.');
      return;
    }

    try {
      const response = UrlFetchApp.fetch(webhookUrl, {
        method: 'post',
        contentType: 'application/json',
        payload: JSON.stringify({
          content: 'CeleX Services webhook test: ' + service + ' notifications are connected.',
          allowed_mentions: {parse: []}
        }),
        muteHttpExceptions: true
      });
      const status = response.getResponseCode();
      if (status >= 200 && status < 300) {
        console.log('Webhook test succeeded for ' + service + '.');
      } else {
        console.error('Webhook test failed for ' + service + ' with HTTP ' + status + '.');
      }
    } catch (error) {
      console.error('Webhook test failed for ' + service + ': ' + error.message);
    }
  });
}

function result_(success) {
  const payload = JSON.stringify({type: 'celex-order-result', success: success});
  const html = '<!doctype html><meta charset="utf-8"><script>window.parent.postMessage(' +
    payload + ', "*");</script>';
  return HtmlService.createHtmlOutput(html)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
