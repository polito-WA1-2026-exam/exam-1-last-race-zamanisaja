'use strict';

const crypto = require('crypto');

function ensureGuestId(req, res) {
  const cookies = Object.fromEntries(
    (req.headers.cookie ?? '').split(';').map(p => p.trim().split('=')).filter(([k]) => k)
      .map(([k, ...v]) => [k, decodeURIComponent(v.join('='))])
  );
  let guestId = cookies.guestId;
  if (!guestId) {
    guestId = crypto.randomUUID();
    res.setHeader('Set-Cookie', `guestId=${encodeURIComponent(guestId)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 365}`);
  }
  req.guestId = guestId;
}

function getOwner(req, res) {
  if (req.isAuthenticated?.()) return { owner_type: 'user', owner_id: req.user.id };
  ensureGuestId(req, res);
  return { owner_type: 'guest', owner_id: req.guestId };
}

module.exports = { getOwner };
