import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import habitRoutes from './routes/habits.js'
import gameRoutes from './routes/games.js'

const app = express()
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://iteration2.ta31brainboost.me'
  ]
}))
app.use(express.json())
app.use('/api/habits', habitRoutes)
app.use('/api/games', gameRoutes)
app.get('/api/health', (req, res) => res.json({ status: 'ok' }))

const PORT = 3001
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`))
