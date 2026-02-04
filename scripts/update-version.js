const fs = require('fs');
const path = require('path');

const VERSION = Date.now();

console.log(`🔄 Updating version to: ${VERSION}\n`);

function updateVersionInFile(filePath, fileDescription) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  ${fileDescription} not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let updateCount = 0;

  // Update <script src="..."> tags
  content = content.replace(
    /src="([^"]+\.(js|mjs))(\?v=\d+)?"/g,
    (match, p1) => {
      updateCount++;
      const cleanPath = p1.split('?')[0];
      return `src="${cleanPath}?v=${VERSION}"`;
    }
  );

  // Update ES6 imports: from '...'
  content = content.replace(
    /from '([^']+\.(js|mjs))(\?v=\d+)?'/g,
    (match, p1) => {
      updateCount++;
      const cleanPath = p1.split('?')[0];
      return `from '${cleanPath}?v=${VERSION}'`;
    }
  );

  // Update ES6 imports: from "..."
  content = content.replace(
    /from "([^"]+\.(js|mjs))(\?v=\d+)?"/g,
    (match, p1) => {
      updateCount++;
      const cleanPath = p1.split('?')[0];
      return `from "${cleanPath}?v=${VERSION}"`;
    }
  );

  // Update CSS <link> tags
  content = content.replace(
    /href="([^"]+\.css)(\?v=\d+)?"/g,
    (match, p1) => {
      updateCount++;
      const cleanPath = p1.split('?')[0];
      return `href="${cleanPath}?v=${VERSION}"`;
    }
  );

  // Update image sources (optional - for critical images)
  content = content.replace(
    /src="(\/images\/[^"]+\.(jpg|jpeg|png|gif|svg|webp))(\?v=\d+)?"/g,
    (match, p1) => {
      const cleanPath = p1.split('?')[0];
      return `src="${cleanPath}?v=${VERSION}"`;
    }
  );

  fs.writeFileSync(filePath, content, 'utf8');
  
  if (updateCount > 0) {
    console.log(`✅ ${fileDescription}: Updated ${updateCount} references`);
  } else {
    console.log(`⚠️  ${fileDescription}: No references found to update`);
  }
}

// Update version.json files
function createVersionFile(directory, siteDescription) {
  const versionFilePath = path.join(directory, 'version.json');
  const versionData = {
    version: VERSION.toString(),
    updated: new Date().toISOString(),
    site: siteDescription
  };

  fs.writeFileSync(versionFilePath, JSON.stringify(versionData, null, 2));
  console.log(`✅ ${siteDescription}: Created version.json`);
}

// Main execution
console.log('📝 Updating HTML files with new version...\n');

// Update main site
const mainSitePath = path.join(__dirname, '../public-site/index.html');
updateVersionInFile(mainSitePath, 'Main Site (public-site/index.html)');
createVersionFile(path.join(__dirname, '../public-site'), 'Main Site');

// Update admin panel (Office Connect)
const adminPanelPath = path.join(__dirname, '../functions/private/index.html');
updateVersionInFile(adminPanelPath, 'Admin Panel (functions/private/index.html)');
createVersionFile(path.join(__dirname, '../functions/private'), 'Admin Panel');

// Update admin store
const adminStorePath = path.join(__dirname, '../admin-site/index.html');
updateVersionInFile(adminStorePath, 'Admin Store (admin-site/index.html)');
createVersionFile(path.join(__dirname, '../admin-site'), 'Admin Store');

console.log('\n✅ Version update complete!');
console.log(`📌 New version: ${VERSION}`);
console.log('🚀 Ready to deploy with: firebase deploy --only hosting\n');
