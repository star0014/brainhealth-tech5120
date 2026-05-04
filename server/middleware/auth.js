import 'dotenv/config'
import { verifyToken } from '@clerk/clerk-sdk-node'

export async function requireAuth(req, res, next) {
  try {
    const guestId = req.headers['x-guest-id']
    if (guestId && guestId.startsWith('guest_')) {
      req.userId = guestId
      return next()
    }
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    const token = authHeader.split(' ')[1]
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY
    })
    req.userId = payload.sub
    next()
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' })
  }
}
