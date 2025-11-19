import { Request, Response } from 'express'
import mongoose from 'mongoose'
import { Task } from '../models/task'

interface AuthenticatedUser {
  _id: mongoose.Types.ObjectId
  role: 'user' | 'admin'
}

interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser
}

interface CreateTaskRequest extends AuthenticatedRequest {
  body: {
    title: string
    status?: 'pending' | 'completed'
  }
}

interface UpdateTaskRequest extends AuthenticatedRequest {
  body: Partial<{
    title: string
    status: 'pending' | 'completed'
  }>
  params: {
    id: string
  }
}

interface TaskParams {
  id: string
}

/**
 * Get tasks with pagination. Admins see all tasks, users see their own.
 * Query params: page (default 1), limit (default 10)
 */
export const getTasks = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 10
    const skip = (page - 1) * limit

    const query = req.user.role === 'admin' ? {} : { userId: req.user._id }
    const tasks = await Task.find(query).skip(skip).limit(limit).lean()
    const total = await Task.countDocuments(query)

    res.json({
      tasks,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching tasks:', error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
}

/**
 * Get a single task by ID. Users can only view their own tasks, admins can view any.
 */
export const getTask = async (
  req: AuthenticatedRequest & { params: TaskParams },
  res: Response,
) => {
  try {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid task ID' })
    }

    const task = await Task.findById(id)
    if (!task) {
      return res.status(404).json({ error: 'Task not found' })
    }

    if (req.user.role !== 'admin' && !task.userId.equals(req.user._id)) {
      return res.status(403).json({ error: 'Forbidden: You can only view your own tasks' })
    }

    res.json(task)
  } catch (error: any) {
    console.error('Error fetching task:', error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
}

/**
 * Create a new task for the authenticated user.
 */
export const createTask = async (req: CreateTaskRequest, res: Response) => {
  try {
    const { title, status = 'pending' } = req.body

    // Basic validation
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({ error: 'Title is required and must be a non-empty string' })
    }

    const task = new Task({ title: title.trim(), status, userId: req.user._id })
    await task.save()
    res.status(201).json(task)
  } catch (error: any) {
    console.error('Error creating task:', error)
    if (error.name === 'ValidationError') {
      res.status(400).json({ error: 'Validation Error', details: error.message })
    } else {
      res.status(500).json({ error: 'Internal Server Error' })
    }
  }
}

/**
 * @params id The ID of the task to update
 * Update a task. Users can only update their own tasks, admins can update any.
 */
export const updateTask = async (req: UpdateTaskRequest, res: Response) => {
  try {
    const { id } = req.params
    const updates = req.body

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid task ID' })
    }

    const task = await Task.findById(id)
    if (!task) {
      return res.status(404).json({ error: 'Task not found' })
    }

    if (req.user.role !== 'admin' && !task.userId.equals(req.user._id)) {
      return res.status(403).json({ error: 'Forbidden: You can only update your own tasks' })
    }

    if (
      updates.title !== undefined &&
      (typeof updates.title !== 'string' || updates.title.trim().length === 0)
    ) {
      return res.status(400).json({ error: 'Title must be a non-empty string' })
    }
    if (updates.status !== undefined && !['pending', 'completed'].includes(updates.status)) {
      return res.status(400).json({ error: 'Status must be either pending or completed' })
    }

    // Apply updates
    Object.assign(task, updates)
    await task.save()

    res.json(task)
  } catch (error: any) {
    console.error('Error updating task:', error)
    if (error.name === 'ValidationError') {
      res.status(400).json({ error: 'Validation Error', details: error.message })
    } else {
      res.status(500).json({ error: 'Internal Server Error' })
    }
  }
}

/**
 * Delete a task. Users can only delete their own tasks, admins can delete any.
 */
export const deleteTask = async (
  req: AuthenticatedRequest & { params: TaskParams },
  res: Response,
) => {
  try {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid task ID' })
    }

    const task = await Task.findById(id)
    if (!task) {
      return res.status(404).json({ error: 'Task not found' })
    }

    if (req.user.role !== 'admin' && !task.userId.equals(req.user._id)) {
      return res.status(403).json({ error: 'Forbidden: You can only delete your own tasks' })
    }

    await Task.deleteOne({ _id: id })
    res.json({ message: 'Task deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting task:', error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
}
