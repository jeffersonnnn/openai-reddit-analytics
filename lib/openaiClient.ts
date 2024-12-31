import OpenAI from "openai";
import { z } from "zod";
import { type RedditPost } from "./redditClient";

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

const ThemeSchema = z.object({
  theme: z.enum([
    "Solution Requests",
    "Pain & Anger",
    "Advice Requests",
    "Money Talk"
  ]),
  confidence: z.number().min(0).max(1),
});

export interface AnalyzedPost extends RedditPost {
  theme: string;
  confidence: number;
}

export async function analyzePostThemes(posts: RedditPost[]): Promise<AnalyzedPost[]> {
  const batchSize = 5; // Process posts in batches to avoid rate limits
  const analyzedPosts: AnalyzedPost[] = [];

  for (let i = 0; i < posts.length; i += batchSize) {
    const batch = posts.slice(i, i + batchSize);
    const batchPromises = batch.map(async (post) => {
      try {
        const prompt = `Analyze the following Reddit post and categorize it into one of these themes:
- Solution Requests: Posts asking for solutions to problems
- Pain & Anger: Posts expressing frustration or negative emotions
- Advice Requests: Posts seeking guidance or recommendations
- Money Talk: Posts discussing financial aspects

Post Title: ${post.title}
Post Content: ${post.content}

Respond with a JSON object containing:
{
  "theme": "one of the themes above",
  "confidence": number between 0 and 1
}`;

        const response = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: "You are a post categorization assistant. Analyze the post and respond with the requested JSON format only."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.3,
          response_format: { type: "json_object" }
        });

        const result = ThemeSchema.parse(JSON.parse(response.choices[0].message.content || "{}"));
        
        return {
          ...post,
          theme: result.theme,
          confidence: result.confidence,
        };
      } catch (error) {
        console.error("Error analyzing post:", error);
        return {
          ...post,
          theme: "Uncategorized",
          confidence: 0,
        };
      }
    });

    const batchResults = await Promise.all(batchPromises);
    analyzedPosts.push(...batchResults);

    // Add a small delay between batches to avoid rate limits
    if (i + batchSize < posts.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return analyzedPosts;
} 