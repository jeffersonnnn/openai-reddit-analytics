import OpenAI from "openai";
import { z } from "zod";
import { type RedditPost } from "./redditClient";

// Debug: log the first few characters of the API key
console.log("API Key prefix:", process.env.NEXT_PUBLIC_OPENAI_API_KEY?.substring(0, 7));

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

const PostCategorySchema = z.object({
  solutionRequest: z.boolean(),
  painAndAnger: z.boolean(),
  adviceRequest: z.boolean(),
  moneyTalk: z.boolean(),
  explanation: z.string()
});

type PostCategoryAnalysis = z.infer<typeof PostCategorySchema>;

export interface AnalyzedPost extends RedditPost {
  categories: PostCategoryAnalysis;
}

async function analyzePost(title: string, content: string): Promise<PostCategoryAnalysis> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { 
          role: "system", 
          content: `Analyze the post and categorize it into themes. Respond with a JSON object containing:
{
  "solutionRequest": boolean (true if seeking solutions),
  "painAndAnger": boolean (true if expressing frustration),
  "adviceRequest": boolean (true if seeking advice),
  "moneyTalk": boolean (true if discussing finances),
  "explanation": string (brief explanation of categorization)
}`
        },
        { 
          role: "user", 
          content: `Title: ${title}\nContent: ${content}` 
        }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    const rawResponse = JSON.parse(response.choices[0].message.content || "{}");
    const analysis = PostCategorySchema.parse(rawResponse);
    return analysis;
  } catch (error) {
    console.error('Error analyzing post:', error);
    throw error;
  }
}

export async function analyzePostThemes(posts: RedditPost[]): Promise<AnalyzedPost[]> {
  const batchSize = 5; // Process posts in batches to avoid rate limits
  const analyzedPosts: AnalyzedPost[] = [];

  for (let i = 0; i < posts.length; i += batchSize) {
    const batch = posts.slice(i, i + batchSize);
    const batchPromises = batch.map(async (post) => {
      try {
        const analysis = await analyzePost(post.title, post.content);
        return {
          ...post,
          categories: analysis
        };
      } catch (error) {
        console.error("Error analyzing post:", error);
        return {
          ...post,
          categories: {
            solutionRequest: false,
            painAndAnger: false,
            adviceRequest: false,
            moneyTalk: false,
            explanation: "Failed to analyze post"
          }
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