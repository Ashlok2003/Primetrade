import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { User } from '../models/user'
import { z } from 'zod'

const registerSchema = z.object({
  username: z.string().min(3),
  password: z
    .string()
    .min(8)
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one lowercase letter, one uppercase letter, and one number',
    ),
  role: z.enum(['user', 'admin']).optional(),
})

const loginSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(8),
})

export const register = async (req: Request, res: Response) => {
  try {
    const { username, password, role } = registerSchema.parse(req.body)

    const existingUser = await User.findOne({ username })
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' })
    }

    /*  Hashing password :) */
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    const user = new User({ username, password: hashedPassword, role })
    await user.save()

    res.status(201).json({ message: 'User registered successfully' })
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Error registering user' })
  }
}

export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = loginSchema.parse(req.body)
    const user = await User.findOne({ username })

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ error: 'Invalid credentials' })
    }

    const token = jwt.sign({ _id: user._id, role: user.role }, process.env.JWT_SECRET || 'secret', {
      expiresIn: '1h',
    })

    res.json({ token, user: { id: user._id, username: user.username, role: user.role } })
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Login failed' })
  }
}
