import { clerkClient, verifyToken } from '@clerk/clerk-sdk-node'
import dotenv from 'dotenv'
dotenv.config({ path: '../.env' })

export async function requireAuth(req, res, next) {
  try {
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
