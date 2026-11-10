import assert from 'node:assert/strict';
import { hashSecurityToken, rateLimit } from '../middleware/securityMiddleware.js';

const token = '0123456789abcdef0123456789abcdef';
assert.equal(hashSecurityToken(token).length, 64);
assert.equal(hashSecurityToken(token), hashSecurityToken(token));
assert.notEqual(hashSecurityToken(token), hashSecurityToken(`${token}x`));

const responses = [];
const middleware = rateLimit({ scope: 'smoke', windowMs: 60_000, max: 2 });
const request = { ip: '198.51.100.20', path: '/smoke', headers: {} };
const response = {
  setHeader() {},
  status(code) { responses.push(code); return this; },
  json() { return this; },
};
let nextCount = 0;
middleware(request, response, () => { nextCount += 1; });
middleware(request, response, () => { nextCount += 1; });
middleware(request, response, () => { nextCount += 1; });
assert.equal(nextCount, 2);
assert.deepEqual(responses, [429]);
console.log('security smoke test passed');
