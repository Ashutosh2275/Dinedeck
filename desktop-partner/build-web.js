const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const partnerWebDir = path.join(__dirname, '..', 'partner-web');
const partnerDistDir = path.join(partnerWebDir, 'dist');
const localDistDir = path.join(__dirname, 'dist');

console.log('[DesktopPartner] Building partner-web (Partner POS & KDS)...');
execSync('npm run build', { cwd: partnerWebDir, stdio: 'inherit' });

console.log('[DesktopPartner] Synchronizing fresh build to desktop-partner/dist...');
if (fs.existsSync(localDistDir)) {
  fs.rmSync(localDistDir, { recursive: true, force: true });
}
fs.cpSync(partnerDistDir, localDistDir, { recursive: true, force: true });
console.log('[DesktopPartner] Partner POS & KDS build synchronized successfully!');
