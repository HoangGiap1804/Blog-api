# Blog API Documentation

This is the API documentation for the Blog-api project, built using Node.js, Express, MongoDB, and Cloudinary.

## Project Overview

The project provides a complete backend system for a blog, including:

- User authentication (JWT & Refresh Token).
- User management and role-based access control (Admin/User).
- Blog post management (CRUD) with Cloudinary image upload and automatic slug generation.
- Comment and Like systems.

---

## Installation and Setup

### Prerequisites

- Node.js (v18+)
- MongoDB (Local or Atlas)
- Cloudinary account (for image storage)

### Setup Steps

1. Install dependencies:

   ```bash
   npm install
   ```

2. Configure environment variables:
   Create a `.env` file from the template and fill in the required information:

   ```env
   NODE_ENV=development
   PORT=3000
   MONGODB_URI=your_mongodb_uri
   JWT_ACCESS_SECRET=your_access_secret
   JWT_REFRESH_SECRET=your_refresh_secret
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   WHITELIST_ADMINS_MAIL=admin@example.com
   ```

3. Run the project in development mode:
   ```bash
   npm run dev
   ```

---

## Authentication

The system uses **JSON Web Token (JWT)** for authentication:

- `AccessToken`: Sent in the `Authorization: Bearer <token>` header. Short-lived.
- `RefreshToken`: Stored in an HttpOnly Cookie. Used to obtain a new AccessToken.

---

## API Reference (v1)

All endpoints are prefixed with `/api/v1`.

### 1. Auth API (`/auth`)

| Method | Endpoint         | Security        | Description                  |
| :----- | :--------------- | :-------------- | :--------------------------- |
| POST   | `/register`      | Public          | Register a new account       |
| POST   | `/login`         | Public          | Login and receive tokens     |
| POST   | `/refresh-token` | Public (Cookie) | Get a new AccessToken        |
| POST   | `/logout`        | Private         | Logout and invalidate tokens |

### 2. User API (`/users`)

| Method | Endpoint   | Permissions | Description                |
| :----- | :--------- | :---------- | :------------------------- |
| GET    | `/current` | User/Admin  | Get current user profile   |
| PUT    | `/current` | User/Admin  | Update profile information |
| DELETE | `/current` | User/Admin  | Delete current account     |
| GET    | `/`        | Admin       | List all users             |
| GET    | `/:userId` | Admin       | Get user details by ID     |
| DELETE | `/:userId` | Admin       | Delete user by ID          |

### 3. Blog API (`/blogs`)

| Method | Endpoint        | Permissions  | Description                                             |
| :----- | :-------------- | :----------- | :------------------------------------------------------ |
| GET    | `/`             | Public/User  | List blog posts (Users only see 'published' posts)      |
| POST   | `/`             | User/Admin   | Create a new blog post (Supports `banner_image` upload) |
| GET    | `/slug/:slug`   | User/Admin   | Get blog post by slug                                   |
| GET    | `/user/:userId` | User/Admin   | List blog posts by a specific user                      |
| PUT    | `/:blogId`      | Author/Admin | Update a blog post                                      |
| DELETE | `/:blogId`      | Author/Admin | Delete a blog post                                      |

### 4. Comment API (`/comments`)

| Method | Endpoint        | Permissions     | Description                       |
| :----- | :-------------- | :-------------- | :-------------------------------- |
| GET    | `/blog/:blogId` | User/Admin      | List comments for a specific blog |
| POST   | `/blog/:blogId` | User/Admin      | Add a new comment                 |
| DELETE | `/:commentId`   | Commenter/Admin | Delete a comment                  |

### 5. Like API (`/likes`)

| Method | Endpoint        | Permissions | Description        |
| :----- | :-------------- | :---------- | :----------------- |
| POST   | `/blog/:blogId` | User/Admin  | Like a blog post   |
| DELETE | `/blog/:blogId` | User/Admin  | Unlike a blog post |

---

## Error Response Structure

In case of an error, the API returns a response in the following format:

```json
{
  "code": "ErrorCode",
  "message": "Error details",
  "error": {}
}
```

Common error codes:

- `401 Unauthorized`: Invalid or expired token.
- `403 Forbidden`: Insufficient permissions.
- `404 Not Found`: Resource not found.
- `500 ServerError`: Internal server error.
