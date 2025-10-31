import express from 'express';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import { verifyMessage, getAddress } from 'viem';

// Lazy import to avoid requiring ESM at load time
async function verifyTurnkeyJwt(token) {
  const { verifySessionJwtSignature } = await import('@turnkey/crypto');
  return verifySessionJwtSignature(token);
}

function decodeJwt(token) {
  const [h, p] = token.split('.');
  if (!p) throw new Error('Invalid JWT');
  const payload = JSON.parse(Buffer.from(p, 'base64url').toString('utf8'));
  return payload;
}

const app = express();
app.use(cors());
app.use(express.json());

// Health
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// Exchange Turnkey session for app JWT
app.post('/api/auth/exchange', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    const tkJwt = auth.startsWith('Bearer ') ? auth.slice(7) : req.body.turnkeyJwt;
    if (!tkJwt) return res.status(400).json({ error: 'Missing Turnkey JWT' });

    const valid = await verifyTurnkeyJwt(tkJwt);
    if (!valid) return res.status(401).json({ error: 'Invalid Turnkey JWT' });
    console.log('valid', valid);
    const claims = decodeJwt(tkJwt);
    const { user_id: tkUserId, organization_id: tkOrgId, exp } = claims || {};
    if (!tkUserId || !tkOrgId) return res.status(400).json({ error: 'Turnkey JWT missing claims' });
    if (exp && exp * 1000 < Date.now()) return res.status(401).json({ error: 'Expired Turnkey JWT' });

    // TODO: upsert user and provision wallets server-side with Turnkey API.
    // Return placeholder wallets for now (your backend should create and persist real addresses).
    const wallets = [
      { chain: 'evm', address: '', status: 'pending' },
      { chain: 'solana', address: '', status: 'pending' },
      { chain: 'aptos', address: '', status: 'pending' },
    ];

    const appJwt = jwt.sign(
      { sub: `${tkOrgId}:${tkUserId}`, tkUserId, tkOrgId },
      process.env.APP_JWT_SECRET || 'dev-secret',
      { expiresIn: '30m', issuer: 'dope-backend' }
    );

    res.json({ appJwt, user: { tkUserId, tkOrgId }, wallets });
  } catch (e) {
    console.error('exchange error', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// EVM signature exchange: verify a signed message and issue app JWT with EVM address as sub
app.post('/api/auth/evm-exchange', async (req, res) => {
  try {
    const { address, message, signature } = req.body || {};
    if (!address || !message || !signature) return res.status(400).json({ error: 'Missing fields' });
    const checksummed = getAddress(address);
    const valid = await verifyMessage({ address: checksummed, message, signature });
    if (!valid) return res.status(401).json({ error: 'Invalid signature' });
    const appJwt = jwt.sign({ sub: checksummed, kind: 'evm' }, process.env.APP_JWT_SECRET || 'dev-secret', {
      expiresIn: '30m', issuer: 'dope-backend'
    });
    res.json({ appJwt, user: { evmAddress: checksummed } });
  } catch (e) {
    console.error('evm-exchange error', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// Protected export endpoint (stub)
app.post('/api/wallets/export', (req, res) => {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token) return res.status(401).json({ error: 'Missing app JWT' });
  try {
    jwt.verify(token, process.env.APP_JWT_SECRET || 'dev-secret');
  } catch {
    return res.status(401).json({ error: 'Invalid app JWT' });
  }
  // Never return seeds/keys in plaintext from a demo endpoint. Implement server-side export
  // with strict policy and user re-auth if you truly need export.
  return res.status(501).json({ error: 'Export not enabled in demo' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`API server listening on http://localhost:${PORT}`);
});


