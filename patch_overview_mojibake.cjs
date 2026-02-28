const fs = require('fs');

function fixFile(path) {
  let content = fs.readFileSync(path, 'utf8');

  content = content.replace(/Ø§Ù„Ù…Ù‡Ù…Ø© ÙˆØ§Ø¶Ø­Ø©: Ù†Ø´Ø± Ø§Ù„ØªÙˆØ³Ø¹/g, 'Mission clear: Deploy expansion');
  content = content.replace(/ØªØ­Ø³ÙŠÙ† Ø§Ù„Ù…Ø³Ø§Ø±: Ù…Ø·Ù„ÙˆØ¨ ØªØ­Ø³ÙŠÙ†/g, 'Improve path: Improvement required');
  content = content.replace(/ÙØ´Ù„ Ø§Ù„ÙØ±Ø¶ÙŠØ©: Ù…Ø­ÙˆØ±ÙŠ Ø­Ø±Ø¬/g, 'Hypothesis failed: Critical pivot');
  content = content.replace(/Ù‚ÙŠØ§Ø³ ØºÙŠØ± ÙƒØ§ÙÙ/g, 'Insufficient measurement');
  content = content.replace(/ØªÙ… Ø­ÙØ¸ Ø§Ù„‚Ø±Ø§Ø± Ø§Ù„Ø§Ø³ØªØ±Ø§ØªÙŠØ¬ÙŠ ÙÙŠ Ø§Ù„Ù†ÙˆØ§Ø© Ø§Ù„Ø¹ØµØ¨ÙŠØ©./g, 'Strategic decision saved in the neural core.');
  content = content.replace(/ÙØ´Ù„ Ø§Ù„Ø­ÙØ¸./g, 'Failed to save.');
  content = content.replace(/Ø¬Ø§Ø±ÙŠ Ù…Ø²Ø§Ù…Ù†Ø© Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª/g, 'Syncing data...');
  content = content.replace(/Ø§Ù„Ø§ØªØµØ§Ù„ Ø¨Ù‚Ø§Ø¹Ø¯Ø© Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª.../g, 'Connecting to database...');
  content = content.replace(/Ù…Ø±ÙƒØ² Ø§Ù„Ù‚ÙŠØ§Ø¯Ø©/g, 'Command Center');
  content = content.replace(/Ù…ØªØµÙ„ Ù…Ø¨Ø§Ø´Ø±/g, 'Connected live');
  content = content.replace(/Ø¨Ø« Ù†Ø¨Ø¶ Ø§Ù„Ø±Ø­Ù„Ø©: Ù†Ø´Ø·/g, 'Journey pulse broadcast: Active');
  content = content.replace(/Ø­Ø§Ù„Ø© Ø§Ù„Ù†Ø¸Ø§Ù…/g, 'System Status');
  content = content.replace(/ØªØ´ØºÙŠÙ„ÙŠ/g, 'Operational');
  content = content.replace(/Ø§Ù„Ø¥ØµØ¯Ø§Ø±/g, 'Version');
  content = content.replace(/v2.1-Ù…Ø¯Ø§Ø±ÙŠ/g, 'v2.1-Orbital');
  content = content.replace(/Ø¥Ø¬Ù…Ø§Ù„ÙŠ Ø§Ù„Ù…Ø³Ø§ÙØ±ÙŠÙ†/g, 'Total Travelers');
  content = content.replace(/Ù…Ø²Ø§Ù…Ù†Ø© Ù…ÙˆØ«Ù‚Ø©/g, 'Verified Sync');
  content = content.replace(/Ø¥Ø³Ù‚Ø§Ø· Ù…Ø­Ù„ÙŠ/g, 'Local Drop');
  content = content.replace(/Ù†Ø´Ø· Ø§Ù„Ø¢Ù†/g, 'Active Now');
  content = content.replace(/Ø­Ø¶ÙˆØ± Ù…Ø¯Ø§Ø±ÙŠ/g, 'Orbital Presence');
  content = content.replace(/Ù…ØªÙˆØ³Ø· Ø§Ù„Ø·Ø§Ù‚Ø©/g, 'Average Energy');
  content = content.replace(/ØªØ¯ÙÙ‚ Ø§Ù„Ù…Ø²Ø§Ø¬/g, 'Mood Flow');
  content = content.replace(/Ø¹Ù…Ù„ÙŠØ§Øª Ø§Ù„Ø°ÙƒØ§Ø¡/g, 'AI Operations');
  content = content.replace(/Ø£Ø­Ù…Ø§Ù„ Ø§Ù„Ù…Ù‡Ø§Ù… Ø§Ù„Ø¹ØµØ¨ÙŠØ©/g, 'Neural Tasks Loads');
  content = content.replace(/Ù†Ù‡Ø§ÙŠØ© Ø¨Ø« Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù…Ø¨Ø§Ø´Ø±/g, 'End of Live Data Broadcast');

  // fallback replacement to remove any leftover SUSPICIOUS chars
  content = content.replace(/(Ø|Ù|â€|â€™|ï¿½)/g, '');

  fs.writeFileSync(path, content, 'utf8');
}

fixFile('src/components/admin/dashboard/Overview/OverviewPanel.tsx');
