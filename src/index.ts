import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import helmet from 'helmet'
import swaggerJsdoc from 'swagger-jsdoc'
import swaggerUi from 'swagger-ui-express'
import authRoutes from './routes/auth.routes'
import taskRoutes from './routes/task.routes'

const app = express()
const PORT = process.env.PORT || 3000
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/primetrade'

mongoose
  .connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err))

app.use(helmet())
app.use(cors({ origin: '*' }))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'PrimeTrade API',
      version: '1.0.0',
      description: 'API for task management with user authentication',
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            username: {
              type: 'string',
              description: 'Unique username',
            },
            password: {
              type: 'string',
              description: 'Hashed password',
            },
            role: {
              type: 'string',
              enum: ['user', 'admin'],
              default: 'user',
            },
          },
          required: ['username', 'password'],
        },
        Task: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'Task ID',
            },
            title: {
              type: 'string',
              description: 'Task title',
            },
            status: {
              type: 'string',
              enum: ['pending', 'completed'],
              default: 'pending',
            },
            userId: {
              type: 'string',
              description: 'User ID who owns the task',
            },
          },
          required: ['title', 'userId'],
        },
        RegisterRequest: {
          type: 'object',
          properties: {
            username: {
              type: 'string',
              minLength: 3,
              description: 'Username (min 3 characters)',
            },
            password: {
              type: 'string',
              minLength: 8,
              description: 'Password (min 8 chars, must contain uppercase, lowercase, and number)',
            },
            role: {
              type: 'string',
              enum: ['user', 'admin'],
              description: 'User role (optional, defaults to user)',
            },
          },
          required: ['username', 'password'],
        },
        LoginRequest: {
          type: 'object',
          properties: {
            username: {
              type: 'string',
              minLength: 3,
            },
            password: {
              type: 'string',
              minLength: 8,
            },
          },
          required: ['username', 'password'],
        },
        LoginResponse: {
          type: 'object',
          properties: {
            token: {
              type: 'string',
              description: 'JWT token',
            },
            role: {
              type: 'string',
              enum: ['user', 'admin'],
            },
          },
        },
        CreateTaskRequest: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: 'Task title',
            },
            status: {
              type: 'string',
              enum: ['pending', 'completed'],
              description: 'Task status (optional, defaults to pending)',
            },
          },
          required: ['title'],
        },
        UpdateTaskRequest: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: 'Task title',
            },
            status: {
              type: 'string',
              enum: ['pending', 'completed'],
            },
          },
        },
        TasksResponse: {
          type: 'object',
          properties: {
            tasks: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Task',
              },
            },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'number' },
                limit: { type: 'number' },
                total: { type: 'number' },
                pages: { type: 'number' },
              },
            },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.ts'], // Paths to files containing OpenAPI definitions
}

const swaggerSpec = swaggerJsdoc(swaggerOptions)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/tasks', taskRoutes)

app.get('/', (req, res) => {
  res.send('PrimeTrade Server is running')
})

/* Starting the backend server.... :) */
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
