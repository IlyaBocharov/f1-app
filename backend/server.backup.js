import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import { JSDOM as DOMPurifyJSDOM } from 'jsdom';
import createDOMPurify from 'dompurify';

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for all routes
app.use(cors());

// In-memory cache for reader content (7 minutes)
const readerCache = new Map();
const CACHE_TTL = 7 * 60 * 1000; // 7 minutes

// Initialize DOMPurify with JSDOM
const window = new DOMPurifyJSDOM('').window;
const DOMPurify = createDOMPurify(window);

// Helper function to normalize URL for caching
function normalizeUrl(url) {
  try {
    const urlObj = new URL(url);
    return `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}${urlObj.search}`;
  } catch (error) {
    return url;
  }
}

// Helper function to extract AMP URL if available
function extractAmpUrl(html, baseUrl) {
  try {
    const dom = new JSDOM(html);
    const ampLink = dom.window.document.querySelector('link[rel="amphtml"]');
    if (ampLink && ampLink.href) {
      const ampUrl = new URL(ampLink.href, baseUrl);
      return ampUrl.href;
    }
  } catch (error) {
    console.log('Failed to extract AMP URL:', error.message);
  }
  return null;
}

// Helper function to absolutize relative URLs
function absolutizeUrls(html, baseUrl) {
  try {
    const dom = new JSDOM(html, { url: baseUrl });
    const document = dom.window.document;
    
    // Absolutize image URLs
    const images = document.querySelectorAll('img[src]');
    images.forEach(img => {
      try {
        const absoluteUrl = new URL(img.src, baseUrl);
        img.src = absoluteUrl.href;
      } catch (error) {
        // Keep original if URL is invalid
      }
    });
    
    // Absolutize anchor URLs
    const anchors = document.querySelectorAll('a[href]');
    anchors.forEach(a => {
      try {
        const absoluteUrl = new URL(a.href, baseUrl);
        a.href = absoluteUrl.href;
      } catch (error) {
        // Keep original if URL is invalid
      }
    });
    
    return document.body.innerHTML;
  } catch (error) {
    console.log('Failed to absolutize URLs:', error.message);
    return html;
  }
}

// Helper function to extract metadata
function extractMetadata(dom) {
  const document = dom.window.document;
  
  // Extract title
  let title = '';
  const titleElement = document.querySelector('title') || document.querySelector('h1');
  if (titleElement) {
    title = titleElement.textContent.trim();
  }
  
  // Extract byline
  let byline = '';
  const bylineSelectors = [
    '[class*="byline"]',
    '[class*="author"]',
    '[class*="writer"]',
    'meta[name="author"]',
    'meta[property="article:author"]'
  ];
  
  for (const selector of bylineSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      byline = element.textContent || element.content || '';
      byline = byline.trim();
      if (byline) break;
    }
  }
  
  // Extract lead image
  let leadImageUrl = '';
  const imageSelectors = [
    'meta[property="og:image"]',
    'meta[name="twitter:image"]',
    'meta[property="article:image"]',
    'img[class*="hero"]',
    'img[class*="lead"]',
    'img[class*="main"]'
  ];
  
  for (const selector of imageSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      leadImageUrl = element.content || element.src || '';
      if (leadImageUrl) break;
    }
  }
  
  // Extract source
  let source = '';
  try {
    const url = new URL(dom.window.location.href);
    source = url.hostname;
  } catch (error) {
    source = 'Unknown';
  }
  
  // Extract published date
  let publishedAt = '';
  const dateSelectors = [
    'meta[property="article:published_time"]',
    'meta[name="publish_date"]',
    'meta[name="date"]',
    'time[datetime]',
    '[class*="date"]',
    '[class*="published"]'
  ];
  
  for (const selector of dateSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      publishedAt = element.content || element.getAttribute('datetime') || element.textContent || '';
      publishedAt = publishedAt.trim();
      if (publishedAt) break;
    }
  }
  
  return { title, byline, leadImageUrl, source, publishedAt };
}

// GET /reader endpoint
app.get('/reader', async (req, res) => {
  try {
    const { url } = req.query;
    
    // Validate URL parameter
    if (!url) {
      return res.status(400).json({
        ok: false,
        reason: 'invalid_url',
        message: 'URL parameter is required'
      });
    }
    
    // Validate URL scheme
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return res.status(400).json({
        ok: false,
        reason: 'invalid_url',
        message: 'Only HTTP and HTTPS URLs are allowed'
      });
    }
    
    // Check cache first
    const normalizedUrl = normalizeUrl(url);
    const cached = readerCache.get(normalizedUrl);
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      res.set('Cache-Control', 'public, max-age=300');
      return res.json(cached.data);
    }
    
    console.log(`[READER] Fetching content from: ${url}`);
    
    // Fetch HTML content with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; F1Reader/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
      redirect: 'follow',
      follow: 5
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      return res.status(502).json({
        ok: false,
        reason: 'extraction_failed',
        message: `HTTP ${response.status}: ${response.statusText}`
      });
    }
    
    let html = await response.text();
    let finalUrl = url;
    
    // Try to extract AMP URL if available
    const ampUrl = extractAmpUrl(html, url);
    if (ampUrl) {
      console.log(`[READER] AMP version found: ${ampUrl}`);
      try {
        const ampResponse = await fetch(ampUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; F1Reader/1.0)',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          },
          redirect: 'follow',
          follow: 5
        });
        
        if (ampResponse.ok) {
          const ampHtml = await ampResponse.text();
          finalUrl = ampUrl;
          html = ampHtml;
        }
      } catch (error) {
        console.log(`[READER] Failed to fetch AMP version: ${error.message}`);
      }
    }
    
    // Parse HTML with JSDOM
    const dom = new JSDOM(html, {
      url: finalUrl,
      pretendToBeVisual: true
    });
    
    // Extract metadata
    const metadata = extractMetadata(dom);
    
    // Use Mozilla Readability to extract content
    const reader = new Readability(dom.window.document);
    const article = reader.parse();
    
    if (!article || !article.textContent || article.textContent.trim().length < 100) {
      return res.status(502).json({
        ok: false,
        reason: 'extraction_failed',
        message: 'Failed to extract readable content'
      });
    }
    
    // Sanitize HTML content
    const sanitizedHtml = DOMPurify.sanitize(article.content, {
      ALLOWED_TAGS: [
        'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'blockquote', 'strong', 'em',
        'a', 'img', 'br', 'hr', 'div', 'span'
      ],
      ALLOWED_ATTR: [
        'href', 'src', 'alt', 'title', 'class', 'id',
        'width', 'height', 'style'
      ],
      ALLOW_DATA_ATTR: false,
      KEEP_CONTENT: true
    });
    
    // Absolutize relative URLs in the sanitized HTML
    const absolutizedHtml = absolutizeUrls(sanitizedHtml, finalUrl);
    
    // Prepare response data
    const responseData = {
      ok: true,
      title: metadata.title || article.title || 'Untitled Article',
      byline: metadata.byline || article.byline || '',
      leadImageUrl: metadata.leadImageUrl || '',
      contentHtml: absolutizedHtml,
      textContent: article.textContent,
      source: metadata.source,
      publishedAt: metadata.publishedAt || '',
      url: finalUrl
    };
    
    // Cache the result
    readerCache.set(normalizedUrl, {
      data: responseData,
      timestamp: Date.now()
    });
    
    // Set cache headers
    res.set('Cache-Control', 'public, max-age=300');
    
    console.log(`[READER] Successfully extracted content from: ${finalUrl}`);
    res.json(responseData);
    
  } catch (error) {
    console.error(`[READER] Error processing request:`, error);
    
    if (error.name === 'AbortError') {
      return res.status(504).json({
        ok: false,
        reason: 'timeout_or_network',
        message: 'Request timed out'
      });
    }
    
    res.status(502).json({
      ok: false,
      reason: 'extraction_failed',
      message: error.message || 'Failed to extract content'
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`[READER] Server running on port ${PORT}`);
  console.log(`[READER] Reader endpoint: http://localhost:${PORT}/reader`);
});

// Clean up expired cache entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of readerCache.entries()) {
    if ((now - value.timestamp) > CACHE_TTL) {
      readerCache.delete(key);
    }
  }
  console.log(`[READER] Cache cleanup: ${readerCache.size} entries remaining`);
}, 10 * 60 * 1000);
