# Backend Setup Guide

## Environment Configuration

Create a `.env` file in your project root with:

```bash
# Reader Backend Configuration
EXPO_PUBLIC_READER_BASE=http://localhost:3001

# For production, change to your deployed backend URL
# EXPO_PUBLIC_READER_BASE=https://your-backend-domain.com
```

## Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the server:**
   ```bash
   # Development (with auto-restart)
   npm run dev
   
   # Production
   npm start
   ```

4. **Server will run on port 3001**
   - Reader endpoint: `http://localhost:3001/reader`
   - Health check: `http://localhost:3001/health`

## Testing the Backend

Test with a real article URL:

```bash
curl "http://localhost:3001/reader?url=https://www.formula1.com/en/latest/article/lewis-hamilton-announces-ferrari-move-for-2025.1234567890"
```

Expected response:
```json
{
  "ok": true,
  "title": "Lewis Hamilton announces Ferrari move for 2025",
  "byline": "Formula 1",
  "leadImageUrl": "https://...",
  "contentHtml": "<p>Article content...</p>",
  "textContent": "Article content...",
  "source": "formula1.com",
  "publishedAt": "2024-01-01T00:00:00Z",
  "url": "https://www.formula1.com/..."
}
```

## App Configuration

The app will automatically use the backend URL from your `.env` file.

- **Local development**: `http://localhost:3001`
- **Production**: Your deployed backend URL

## Troubleshooting

1. **Port already in use**: Change `PORT` in backend/server.js
2. **CORS issues**: Backend has CORS enabled for all origins
3. **Timeout errors**: Backend has 15-second timeout, app has 15-second timeout
4. **Content validation**: App requires contentHtml >= 300 characters

## Deployment

The backend is ready for deployment to:
- Heroku
- Vercel
- Railway
- DigitalOcean App Platform
- AWS Lambda (with modifications)

Update your `.env` file with the production URL after deployment.
