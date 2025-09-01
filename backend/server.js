import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import createDOMPurify from 'dompurify';
import { marked } from 'marked';

const app = express();
const PORT = process.env.PORT || 3001;
app.use(cors());

// --- cache 7 min ---
const TTL = 7 * 60 * 1000;
const cache = new Map();
const get = k => { const v = cache.get(k); if (!v) return null; if (Date.now() > v.t) { cache.delete(k); return null; } return v.d; };
const set = (k, d) => cache.set(k, { t: Date.now() + TTL, d });

// --- helpers ---
const isHttp = u => { try { const x = new URL(u); return x.protocol === 'http:' || x.protocol === 'https:'; } catch { return false; } };
const keyOf = u => { try { const x = new URL(u); ['utm_source','utm_medium','utm_campaign','utm_term','utm_content'].forEach(p=>x.searchParams.delete(p)); return x.toString(); } catch { return String(u); } };

async function fetchHtml(url, ms = 15000) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), ms);
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': new URL(url).origin
  };
  try {
    const r = await fetch(url, { redirect: 'follow', signal: controller.signal, headers });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const html = await r.text();
    return { ok: true, html, finalUrl: r.url };
  } catch (e) {
    return { ok: false, error: String(e.message || e) };
  } finally {
    clearTimeout(t);
  }
}

function absolutize(doc, baseHref) {
  const base = new URL(baseHref);
  doc.querySelectorAll('img').forEach(img => {
    const s = img.getAttribute('src') || img.getAttribute('data-src');
    if (s) { try { img.setAttribute('src', new URL(s, base).toString()); } catch {} }
    img.removeAttribute('srcset'); img.removeAttribute('data-srcset');
  });
  doc.querySelectorAll('a[href]').forEach(a => {
    const h = a.getAttribute('href'); if (!h) return;
    try { a.setAttribute('href', new URL(h, base).toString()); } catch {}
  });
}

// --- main endpoint ---
app.get('/reader', async (req, res) => {
  const url = req.query.url;
  if (!url || !isHttp(url)) return res.status(400).json({ ok: false, reason: 'invalid_url' });

  const ck = keyOf(url);
  const hit = get(ck);
  if (hit) { res.set('Cache-Control','public, max-age=300'); return res.json(hit); }

  // 1) primary fetch
  const prim = await fetchHtml(url);
  if (!prim.ok) {
    // 1b) hard fallback via Jina if blocked (403/timeout/etc.)
    const fb = await fetch(`https://r.jina.ai/http://${encodeURIComponent(url)}`).then(r=>r.ok?r.text():Promise.reject(new Error('HTTP '+r.status))).catch(e=>null);
    if (fb) {
      const html = marked.parse(fb);
      const out = { ok:true, title: new URL(url).hostname, byline: null, leadImageUrl: null, contentHtml: html, textContent: fb, source: new URL(url).hostname, publishedAt: null, url };
      set(ck, out); res.set('Cache-Control','public, max-age=300'); return res.json(out);
    }
    return res.status(504).json({ ok:false, reason:'timeout_or_network', message: prim.error });
  }

  // 2) try AMP
  let html = prim.html, finalUrl = prim.finalUrl || url;
  try {
    const probe = new JSDOM(html).window.document;
    const amp = probe.querySelector('link[rel="amphtml"]')?.getAttribute('href');
    if (amp) {
      const ampUrl = new URL(amp, finalUrl).toString();
      const r = await fetchHtml(ampUrl);
      if (r.ok) { html = r.html; finalUrl = r.finalUrl || ampUrl; }
    }
  } catch {}

  // 3) readability
  const dom = new JSDOM(html, { url: finalUrl });
  const doc = dom.window.document;
  doc.querySelectorAll('script,style,noscript,iframe').forEach(n => n.remove());
  const reader = new Readability(doc);
  const art = reader.parse();

  // 4) if extraction weak -> hard fallback via Jina
  if (!art || !art.content || (art.textContent || '').trim().length < 300) {
    try {
      const md = await fetch(`https://r.jina.ai/http://${encodeURIComponent(url)}`).then(r=>r.ok?r.text():Promise.reject(new Error('HTTP '+r.status)));
      const htmlFromMd = marked.parse(md);
      const out = { ok:true, title: art?.title || doc.title || new URL(url).hostname, byline: art?.byline || null, leadImageUrl: null, contentHtml: htmlFromMd, textContent: md, source: new URL(finalUrl).hostname, publishedAt: null, url: finalUrl };
      set(ck, out); res.set('Cache-Control','public, max-age=300'); return res.json(out);
    } catch (e) {
      return res.status(502).json({ ok:false, reason:'extraction_failed', message: String(e.message||e) });
    }
  }

  // 5) sanitize & absolutize
  const artDom = new JSDOM(art.content);
  absolutize(artDom.window.document, finalUrl);
  const DOMPurify = createDOMPurify(artDom.window);
  const clean = DOMPurify.sanitize(artDom.serialize(), {
    ALLOWED_TAGS:['p','h1','h2','h3','h4','h5','h6','ul','ol','li','blockquote','strong','em','a','img','br','hr','figure','figcaption','div','span'],
    ALLOWED_ATTR:['href','src','alt','title','width','height']
  });

  const out = {
    ok: true,
    title: art.title || doc.title || '',
    byline: art.byline || null,
    leadImageUrl: doc.querySelector('meta[property="og:image"]')?.content || null,
    contentHtml: clean,
    textContent: art.textContent,
    source: (new URL(finalUrl)).hostname,
    publishedAt: doc.querySelector('meta[property="article:published_time"]')?.content || null,
    url: finalUrl
  };

  set(ck, out);
  res.set('Cache-Control','public, max-age=300');
  res.json(out);
});

app.listen(PORT, () => console.log(`Reader API listening on http://localhost:${PORT}`));
