const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const adminWebDir = path.join(__dirname, '..', 'admin-web');
const adminDistDir = path.join(adminWebDir, 'dist');
const localDistDir = path.join(__dirname, 'dist');

console.log('[DesktopAdmin] Building admin-web (Super Admin Control Center)...');
execSync('npm run build', { cwd: adminWebDir, stdio: 'inherit' });

console.log('[DesktopAdmin] Synchronizing fresh build to desktop-admin/dist...');
if (fs.existsSync(localDistDir)) {
  fs.rmSync(localDistDir, { recursive: true, force: true });
}
fs.cpSync(adminDistDir, localDistDir, { recursive: true, force: true });
console.log('[DesktopAdmin] Super Admin Control Center build synchronized successfully!');
