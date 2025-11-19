import { NextFunction, Response } from 'express'
import jwt from 'jsonwebtoken'

export const auth = (req: any, res: Response, next: NextFunction) => {
  const token = req.header('Authorization')?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Access denied' })

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET || 'secret')
    req.user = verified
    next()
  } catch {
    res.status(400).json({ error: 'Invalid Token' })
  }
}

export const requireAdmin = (req: any, res: Response, next: NextFunction) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' })
  }
  next()
}
