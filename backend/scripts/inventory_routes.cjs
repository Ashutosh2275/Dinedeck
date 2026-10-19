const fs = require('fs');
const path = require('path');

const modulesDir = path.join(__dirname, '..', 'src', 'modules');
const controllers = [
  { file: 'auth/auth.controller.ts', prefix: '/api/auth' },
  { file: 'restaurants/restaurants.controller.ts', prefix: '/api/restaurants' },
  { file: 'tables/tables.controller.ts', prefix: '/api/tables' },
  { file: 'orders/orders.controller.ts', prefix: '/api/orders' },
  { file: 'payments/payments.controller.ts', prefix: '/api/payments' },
  { file: 'service-requests/service-requests.controller.ts', prefix: '/api/service-requests' },
  { file: 'staff/staff.controller.ts', prefix: '/api/staff' },
  { file: 'admin/admin.controller.ts', prefix: '/api/admin' },
  { file: 'iam/iam.controller.ts', prefix: '/api/iam' },
  { file: 'kds/kds.controller.ts', prefix: '/api/kds' },
  { file: 'billing/billing.controller.ts', prefix: '/api/billing' },
  { file: 'banners/banners.controller.ts', prefix: '/api/banners' },
  { file: 'recommendations/recommendations.controller.ts', prefix: '/api/recommendations' },
  { file: 'support/support.controller.ts', prefix: '/api/support' },
];

const routes = [];

for (const c of controllers) {
  const filePath = path.join(modulesDir, c.file);
  if (!fs.existsSync(filePath)) {
    console.error('Missing controller:', filePath);
    continue;
  }
  const content = fs.readFileSync(filePath, 'utf8');

  // Match fastify.get/post/put/patch/delete or server.get/post/put/patch/delete
  const regex = /(?:fastify|server)\.(get|post|put|patch|delete)\s*(?:<[^>]+>)?\s*\(\s*['"`]([^'"`]+)['"`]/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const method = match[1].toUpperCase();
    const routePath = match[2];
    const fullPath = (c.prefix + (routePath === '/' ? '' : routePath)).replace(/\/+/g, '/');
    
    // Look ahead to check if preHandler or authenticate is used
    const postSnippet = content.substring(match.index, match.index + 250);
    const hasAuth = postSnippet.includes('authenticate') || postSnippet.includes('jwtVerify');

    routes.push({
      controller: c.file,
      method,
      subPath: routePath,
      fullPath,
      hasAuth
    });
  }
}

// Add system routes from index.ts
routes.unshift({
  controller: 'src/index.ts',
  method: 'GET',
  subPath: '/health',
  fullPath: '/health',
  hasAuth: false
});
routes.unshift({
  controller: 'src/index.ts',
  method: 'GET',
  subPath: '/ws',
  fullPath: '/ws',
  hasAuth: false
});
routes.unshift({
  controller: 'src/index.ts',
  method: 'GET',
  subPath: '/',
  fullPath: '/',
  hasAuth: false
});

console.log('TOTAL REGISTERED ROUTES DISCOVERED:', routes.length);
console.log(JSON.stringify(routes, null, 2));
