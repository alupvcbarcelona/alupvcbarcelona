# Backend API Documentation

## Project Overview

This is a small backend API built with Node.js, Express, and MongoDB. It provides basic user registration, authentication, and review management functionality. The project uses JWT for authentication, bcrypt for password hashing, and includes a simple `isAuth` middleware to protect private routes.

## Technology Stack

- Node.js
- Express 5
- MongoDB / Mongoose
- JSON Web Tokens (`jsonwebtoken`)
- bcrypt
- dotenv
- cors
- nodemon (development)

## Architecture

The project is organized into the following folders:

- `src/config/` - environment configuration, database connection, JWT utilities, and DNS resolution helper.
- `src/controllers/` - controllers for user and review operations.
- `src/routes/` - Express routes separated into main route registration and feature-specific subroutes.
- `src/middlewares/` - reusable middleware, including authentication.
- `src/models/` - Mongoose schemas and models for users and reviews.
- `src/` root files are loaded by the application entrypoint.

## Entry Point

- `index.js` - initializes the application, loads environment variables, configures middleware, connects to MongoDB, registers routes under `/api`, and starts the server.

## Configuration

### Environment Variables

The project expects the following environment variables to be defined:

- `PORT` - the port the server listens on (defaults to `3000` if not defined).
- `MONGODB_URI` - MongoDB connection string.
- `JWT_SECRET` - secret used to sign and verify JWT tokens.

### Config Modules

- `src/config/env.config.js` - exports environment variables.
- `src/config/database.config.js` - connects to MongoDB using Mongoose.
- `src/config/jwt.config.js` - creates and verifies JWT tokens.
- `src/config/resolve.dns.js` - sets DNS servers to `8.8.8.8` and `8.8.4.4` for environments that require DNS resolution handling.

## Data Models

### User Model (`src/models/user.model.js`)

Fields:

- `name`: String, required
- `lastname`: String, required
- `email`: String, required, unique, trimmed, lowercase
- `password`: String, hashed by bcrypt with a minimum of 6 characters
- `avatar`: String, default profile image URL
- `roles`: array of strings, enum `['user', 'admin']`, default `['user']`

The model includes a pre-save hook that hashes the password when it is new or modified.

### Review Model (`src/models/review.model.js`)

Fields:

- `username`: String, required
- `title`: String, required, lowercase
- `description`: String, required, lowercase

## Authentication

### JWT

- `src/config/jwt.config.js` provides `CREATE_TOKEN(id)` to sign a JWT with a 365-day expiration.
- `VERIFY_TOKEN(token)` validates the token and returns the decoded payload.

### Middleware

- `src/middlewares/is-auth.middleware.js` verifies the `Authorization` header token, validates the JWT, and loads the authenticated user from the database.
- If the token is missing or invalid, it returns a `401 Unauthorized` response.

## API Routes

All endpoints are mounted under `/api`.

### User Routes (`/api/user`)

- `POST /api/user/create-user`
  - Registers a new user.
  - Expects user details in the request body.
  - Returns the created user.

- `POST /api/user/login`
  - Authenticates a user using email and password.
  - Returns a JWT token and user data (excluding password) on success.

- `GET /api/user/profile`
  - Protected route requiring a valid JWT token in `Authorization: Bearer <token>`.
  - Returns the authenticated user profile.

### Review Routes (`/api/reviews`)

- `POST /api/reviews/create-review`
  - Creates a new review.
  - Expects `username`, `title`, and `description` in the request body.
  - Returns the created review.

- `GET /api/reviews/`
  - Retrieves all reviews.
  - Returns an array of review documents.

## Middleware and Error Handling

- CORS is enabled globally via `cors()`.
- JSON and URL-encoded request bodies are parsed by Express.
- A 404 handler returns a `Route does not exist` error for unknown endpoints.
- A general error handler logs errors and returns a JSON response with the status code.

## Running the Application

Install dependencies:

```bash
npm install
```

Start in development mode:

```bash
npm run dev
```

Start in production mode:

```bash
npm start
```

## Notes and Recommendations

- Ensure `MONGODB_URI` and `JWT_SECRET` are defined in a `.env` file or environment variables.
- Passwords are hashed automatically before saving users to the database.
- The profile route is protected and requires an authorization token.
- Add validation and error handling improvements for production readiness.
- Consider adding tests and request validation middleware for stronger API reliability.
