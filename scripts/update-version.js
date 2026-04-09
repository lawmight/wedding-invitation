const fs = require('fs');
const path = require('path');

const now = new Date();
const version = now.getTime().toString();
const buildTime = now.toISOString();
const hash = Math.random().toString(36).substring(2, 15);

const publicVersionPath = path.join(__dirname, '../public/build-version.json');
const publicPayload = JSON.stringify(
  { version, buildTime, hash },
  null,
  2
);

try {
  fs.writeFileSync(publicVersionPath, `${publicPayload}\n`, 'utf8');
  console.log('✅ build-version.json updated successfully!');
  console.log(`📦 Version: ${version}`);
  console.log(`🕒 Build Time: ${buildTime}`);
  console.log(`🔑 Hash: ${hash}`);
} catch (error) {
  console.error('❌ Failed to update version files:', error);
  process.exit(1);
}
