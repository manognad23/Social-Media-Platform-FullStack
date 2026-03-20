# Deployment Checklist

## Backend (Render/Your Hosting)
- [ ] MongoDB Atlas connection string in `MONGO_URI`
- [ ] JWT_SECRET set (should be a long random string)
- [ ] ADMIN_SECRET set (for admin login verification)
- [ ] ADMIN_EMAILS set (comma-separated, optional for auto-promotion)
- [ ] CLIENT_ORIGIN set to frontend URL (for CORS)
- [ ] CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET (optional, for image uploads)
- [ ] OPENAI_API_KEY (optional, for content moderation)
- [ ] PORT=5000 (or your deployment port)

## Frontend (Vercel/Your Hosting)
- [ ] VITE_API_URL set to backend URL (e.g., https://your-backend.onrender.com)
- [ ] Build command: `npm run build`
- [ ] Install command: `npm install`

## Database (MongoDB Atlas)
- [ ] User with `role: "admin"` created
  - Either register via `/api/auth/register` then promote in DB, OR
  - Add email to ADMIN_EMAILS env variable and login normally
- [ ] Database collections created and indexed
- [ ] Connection string allows your deployment IP (Whitelist "allow all" for testing)

## Testing Endpoints

### Health Check
```
GET https://your-backend.com/api/health
Response: { ok: true }
```

### Register User
```
POST /api/auth/register
Body: { username, email, password }
Response: { token, user }
```

### Login User
```
POST /api/auth/login
Body: { email, password }
Response: { token, user }
```

### Admin Login
```
POST /api/auth/admin/login
Body: { email, password, adminSecret }
Response: { token, user } if role === "admin"
```

### Create Post (requires auth)
```
POST /api/posts
Headers: Authorization: Bearer <token>
Body: { text, imageUrl?, imagePublicId? }
Response: { post: { id, status } }
```

### Get Feed
```
GET /api/posts
Response: { posts: [...] }
```

### Get User Posts
```
GET /api/posts/user/:userId
Response: { posts: [...] }
```

### Other Core Routes
- `GET /api/me` - Get current user profile
- `PUT /api/me` - Update profile
- `POST /api/posts/:postId/comments` - Add comment
- `DELETE /api/posts/:postId` - Delete post
- `POST /api/uploads/image` - Upload image (multipart/form-data)
- `GET /api/admin/stats` - Admin stats (admin only)
- `GET /api/admin/flagged` - Flagged content (admin only)
- `GET /api/admin/logs` - Moderation logs (admin only)
- `POST /api/admin/moderate` - Moderate content (admin only)

## Common Issues & Fixes

### 404 Errors on API Calls
- **Cause**: VITE_API_URL not set in frontend, or wrong URL
- **Fix**: Set VITE_API_URL env variable in Vercel dashboard or frontend .env

### 401 Unauthorized on Protected Routes
- **Cause**: Missing or invalid JWT token
- **Fix**: Ensure login returns a token and it's stored in localStorage as "token"

### 403 Forbidden on Admin Routes
- **Cause**: User role is not "admin"
- **Fix**: Promote user to admin by either:
  1. Setting `role: "admin"` in MongoDB users collection
  2. Adding email to ADMIN_EMAILS and logging in normally
  3. Using admin login with correct adminSecret

### CORS Errors
- **Cause**: Frontend origin not in CLIENT_ORIGIN whitelist
- **Fix**: Set CLIENT_ORIGIN in backend .env to match your frontend URL

### Image Upload Fails
- **Cause**: Cloudinary credentials not configured
- **Fix**: Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET to backend .env

All routes are implemented and ready to deploy! ✅
