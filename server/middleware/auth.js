// ─────────────────────────────────────────────────────────────────────────────
// Authentication middleware for BrainBoost API routes.
//
// Supports two identity modes:
//
//   1. Guest mode
//      The client sends a custom header: X-Guest-ID: guest_<random>
//      Guest IDs are generated on the frontend and stored in localStorage.
//      They always start with "guest_" to prevent spoofing of real Clerk user IDs.
//      No server-side session is created — the ID itself is the identity.
//
//   2. Clerk JWT mode
//      The client sends a signed Clerk access token:
//        Authorization: Bearer <clerk-jwt>
//      The token is verified against Clerk's secret key.
//      On success, payload.sub (the Clerk user ID) is used as the identity.
//
// In both cases, req.userId is populated before the route handler runs.
// If authentication fails, a 401 response is returned immediately.
// ─────────────────────────────────────────────────────────────────────────────
import 'dotenv/config'
import { verifyToken } from '@clerk/clerk-sdk-node'

// requireAuth: Express middleware function.
// Usage: router.get('/path', requireAuth, async (req, res) => { ... })
export async function requireAuth(req, res, next) {
  try {
    // ── Guest mode ────────────────────────────────────────────────────────────
    // Check for the custom guest header first. If present and valid, skip JWT verification.
    const guestId = req.headers['x-guest-id']
    if (guestId && guestId.startsWith('guest_')) {
      req.userId = guestId  // set userId so route handlers can query by it
      return next()
    }

    // ── Clerk JWT mode ────────────────────────────────────────────────────────
    // Expect the standard "Authorization: Bearer <token>" HTTP header.
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // Strip the "Bearer " prefix to get just the JWT string.
    const token = authHeader.split(' ')[1]

    // Verify the JWT signature and expiry using the Clerk secret key.
    // verifyToken throws if the token is invalid, expired, or malformed.
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY
    })

    // payload.sub is the Clerk user ID (format: "user_2abc123...").
    // Stored on req so that all subsequent route handlers have access to it.
    req.userId = payload.sub
    next()
  } catch (err) {
    // An expired, tampered, or otherwise invalid token ends up here.
    return res.status(401).json({ error: 'Invalid token' })
  }
}
