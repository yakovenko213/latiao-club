#!/usr/bin/env node

/**
 * AUTOMATIC VERSION UPDATER
 * Updates ?v= parameters in all HTML files to force cache busting
 * 
 * Usage: node update-versions.js
 */

const fs = require('fs');
const path = require('path');

// Generate version string (timestamp)
const version = Date.now();
const versionString = version.toString();

console.log('🔄 Starting cache-busting version update...');
console.log(`📦 New version: ${versionString}`);

// Files to update
const filesToUpdate = [
  'public-site/index.html',
  'public-site/checkout.html',
  'admin-site/index.html',
  'admin-site/crm-dashboard.html'
];

// Regex patterns to match
const patterns = [
  // Match: src="./js/file.js?v=12345"
  /(<script[^>]+src=["']\.\/[^"']+\.js)\?v=\d+/g,
  // Match: src="js/file.js?v=12345"
  /(<script[^>]+src=["'][^"']+\.js)\?v=\d+/g,
  // Match: href="./css/file.css?v=12345"
  /(<link[^>]+href=["']\.\/[^"']+\.css)\?v=\d+/g,
  // Match: href="css/file.css?v=12345"
  /(<link[^>]+href=["'][^"']+\.css)\?v=\d+/g,
];

let totalUpdates = 0;
let filesProcessed = 0;

filesToUpdate.forEach(filePath => {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  Skipping ${filePath} (not found)`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let fileUpdates = 0;
  const originalContent = content;

  // Apply all patterns
  patterns.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) {
      content = content.replace(pattern, `$1?v=${versionString}`);
      fileUpdates += matches.length;
    }
  });

  // Also handle cases WITHOUT version parameter - ADD it
  // Match: src="./js/file.js" (no ?v=)
  content = content.replace(
    /(<script[^>]+src=["']\.?\/[^"'?]+\.js)(["'])/g,
    `$1?v=${versionString}$2`
  );
  
  // Match: href="./css/file.css" (no ?v=)
  content = content.replace(
    /(<link[^>]+href=["']\.?\/[^"'?]+\.css)(["'])/g,
    `$1?v=${versionString}$2`
  );

  // Count new additions
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    filesProcessed++;
    console.log(`✅ Updated ${filePath} (${fileUpdates} changes)`);
    totalUpdates += fileUpdates;
  } else {
    console.log(`ℹ️  No changes needed in ${filePath}`);
  }
});

// Update version.json
const versionData = {
  version: "2.1.0",
  timestamp: version,
  buildDate: new Date().toISOString(),
  description: "Auto-updated cache-busting version"
};

fs.writeFileSync(
  'public-site/version.json',
  JSON.stringify(versionData, null, 2),
  'utf8'
);

console.log('');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('✅ VERSION UPDATE COMPLETE');
console.log(`   Files processed: ${filesProcessed}`);
console.log(`   Total updates: ${totalUpdates}`);
console.log(`   New version: ${versionString}`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('');
console.log('💡 Run "firebase deploy" to publish changes');
