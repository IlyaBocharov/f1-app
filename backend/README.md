# F1 Reader Backend

A Node.js backend server that provides article content extraction using Mozilla Readability.

## Features

- **GET /reader** - Extract readable content from web articles
- **AMP Support** - Automatically prefers AMP versions when available
- **Content Sanitization** - Clean, safe HTML output
- **Caching** - 7-minute in-memory cache with 5-minute HTTP cache headers
- **Timeout Handling** - 15-second fetch timeout with proper error responses
- **Metadata Extraction** - Title, byline, lead image, source, published date

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the server:**
   ```bash
   # Production
   npm start
   
   # Development (with auto-restart)
   npm run dev
   ```

3. **Server will run on port 3001 by default**
   - Set `PORT` environment variable to change port
   - Reader endpoint: `http://localhost:3001/reader`

## API Usage

### GET /reader

**Query Parameters:**
- `url` (required): The article URL to extract content from

**Example Request:**
```bash
curl "http://localhost:3001/reader?url=https://example.com/article"
```

**Success Response (200):**
```json
{
  "ok": true,
  "title": "Article Title",
  "byline": "Author Name",
  "leadImageUrl": "https://example.com/image.jpg",
  "contentHtml": "<p>Article content...</p>",
  "textContent": "Article content...",
  "source": "example.com",
  "publishedAt": "2024-01-01T00:00:00Z",
  "url": "https://example.com/article"
}
```

**Error Responses:**

**400 Bad Request:**
```json
{
  "ok": false,
  "reason": "missing_url",
  "message": "URL parameter is required"
}
```

**502 Bad Gateway:**
```json
{
  "ok": false,
  "reason": "extraction_failed",
  "message": "Failed to extract readable content"
}
```

**504 Gateway Timeout:**
```json
{
  "ok": false,
  "reason": "timeout",
  "message": "Request timed out"
}
```

## Health Check

**GET /health**
```json
{
  "ok": true,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Caching

- **In-Memory Cache**: 7 minutes TTL
- **HTTP Cache**: `Cache-Control: public, max-age=300` (5 minutes)
- **Cache Key**: Normalized URL (protocol + host + path + query)

## Error Handling

- **Timeout**: 15-second fetch timeout
- **Invalid URLs**: Only HTTP/HTTPS schemes allowed
- **Extraction Failures**: Content must be at least 100 characters
- **Network Errors**: Proper HTTP status codes and error messages

## Dependencies

- **express**: Web framework
- **cors**: Cross-origin resource sharing
- **node-fetch**: HTTP client
- **jsdom**: DOM implementation for Node.js
- **@mozilla/readability**: Article content extraction
- **dompurify**: HTML sanitization

## Environment Variables

- `PORT`: Server port (default: 3001)

## Deployment

The server is ready for deployment to platforms like:
- Heroku
- Vercel
- Railway
- DigitalOcean App Platform
- AWS Lambda (with modifications)

## Security

- CORS enabled for cross-origin requests
- HTML sanitization to prevent XSS
- URL scheme validation (HTTP/HTTPS only)
- User-Agent spoofing for better compatibility
