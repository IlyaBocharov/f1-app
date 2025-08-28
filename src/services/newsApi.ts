import { z } from "zod";

export const NewsItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  source: z.string(),
  publishedAt: z.string(),
  link: z.string(),
  summary: z.string().optional(),
  image: z.string().optional(),
});
export const NewsListSchema = z.array(NewsItemSchema);

// ← фиксированный URL на твой Vercel
const API_URL = "https://f1-api-ten.vercel.app/api/news";

export type NewsMode = "balanced" | "recent";

export async function fetchNews(params?: { mode?: NewsMode; q?: string }) {
  const url = new URL(API_URL);
  if (params?.mode) url.searchParams.set("mode", params.mode);
  if (params?.q) url.searchParams.set("q", params.q);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("Failed to load news");
  const json = await res.json();
  
  // Parse the response and extract image URLs from RSS items
  const parsedData = NewsListSchema.parse(json);
  
  // Note: The actual image extraction from RSS enclosures/media:content 
  // would happen on the backend API. This schema update ensures the frontend
  // can handle image URLs when they are provided by the API.
  
  return parsedData;
}
