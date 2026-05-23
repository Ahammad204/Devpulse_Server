# Devpulse Server

**Devpulse** is a backend API for managing developers' issue reports and user authentication. It provides secure signup and login flows, issue creation and tracking, and role-based issue management.

- GitHub Repo: https://github.com/Ahammad204/Devpulse_Server
- Live Deployment: https://devpulse-lime.vercel.app/

## Features

- User registration and login with JWT access tokens and refresh tokens
- Secure password hashing with bcrypt
- Role-based access control for protected issue actions
- CRUD operations for issues
- Issue filtering and sorting support
- PostgreSQL database initialization and schema setup

## Tech Stack

- Node.js
- TypeScript
- Express.js
- PostgreSQL
- JSON Web Tokens (`jsonwebtoken`)
- bcrypt for password hashing
- CORS
- tsup for build tooling
- tsx for development runtime

## Live URL

- https://devpulse-lime.vercel.app/

## Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/Ahammad204/Devpulse_Server.git
   cd Devpulse_Server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the project root with the required values:
   ```env
   CONNECTION_STRING=postgresql://USER:PASSWORD@HOST:PORT/DATABASE
   PORT=4000
   JWT_SECRET=your_jwt_secret
   JWT_REFRESH_SECRET=your_refresh_token_secret
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Build for production:
   ```bash
   npm run build
   ```

6. Start the production server:
   ```bash
   npm start
   ```

## Project Structure

- `src/app.ts` - Express application setup and route registration
- `src/server.ts` - application bootstrap and database initialization
- `src/Config/index.ts` - environment configuration loader
- `src/db/index.ts` - PostgreSQL connection and schema initialization
- `src/modules/auth` - authentication routes, controller, service, and interfaces
- `src/modules/issues` - issue routes, controller, service, and interfaces
- `src/middleware/auth.ts` - JWT authorization middleware
- `src/utility/sendresponse.ts` - uniform response formatting

## API Endpoints

Base path: `/api`

### Authentication

- `POST /api/auth/signup`
  - Registers a new user.
  - Body:
    - `name` (string)
    - `email` (string)
    - `password` (string)
    - `role` (optional, `contributor` or `maintainer`)

- `POST /api/auth/login`
  - Authenticates a user and returns an access token plus refresh token cookie.
  - Body:
    - `email` (string)
    - `password` (string)

- `POST /api/auth/refresh-token`
  - Issues a new access token using the refresh token cookie.

### Issues

- `POST /api/issues`
  - Creates a new issue.
  - Requires `Authorization` header with a valid JWT.
  - Body:
    - `title` (string)
    - `description` (string)
    - `type` (`bug` or `feature`)

- `GET /api/issues`
  - Retrieves all issues.
  - Query parameters:
    - `sort` (`newest` or `oldest`, default `newest`)
    - `type` (`bug` or `feature_request`)
    - `status` (`open`, `in_progress`, `resolved`)

- `GET /api/issues/:id`
  - Retrieves a single issue by ID.

- `PATCH /api/issues/:id`
  - Updates an existing issue.
  - Requires `Authorization` header with a valid JWT.
  - Body may include one or more of:
    - `title` (string)
    - `description` (string)
    - `type` (`bug` or `feature`)

- `DELETE /api/issues/:id`
  - Deletes an issue.
  - Requires `Authorization` header with a valid JWT and user role `maintainer`.

## Database Schema Summary

### `users`

- `id` - serial primary key
- `name` - varchar(20)
- `email` - varchar(30), unique, not null
- `password` - text, not null
- `role` - varchar(20), defaults to `contributor`
- `created_at` - timestamp default `NOW()`
- `updated_at` - timestamp default `NOW()`

### `issues`

- `id` - serial primary key
- `title` - varchar(255), not null
- `description` - text, not null
- `type` - varchar(20), not null
- `status` - varchar(20), default `open`
- `reporter_id` - foreign key referencing `users(id)`
- `created_at` - timestamp default `NOW()`
- `updated_at` - timestamp default `NOW()`

## Notes

- The server uses PostgreSQL and automatically creates the `users` and `issues` tables on startup if they do not exist.
- Protected issue routes use JWT authorization from the `Authorization` header.
- Cookie-based refresh token support is included for session refresh.

## Contact

For questions or integrations, please refer to the public repo and live deployment links above.
