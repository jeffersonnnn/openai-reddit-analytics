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

// Utility function to chunk array into smaller arrays
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

async function analyzePost(title: string, content: string): Promise<PostCategoryAnalysis> {
  try {
    console.log('Analyzing post:', { title });
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { 
          role: "system", 
          content: `Analyze the post and categorize it into themes. You must return a JSON object with exactly these boolean fields and a string explanation:
{
  "solutionRequest": boolean,    // True if seeking solutions for problems
  "painAndAnger": boolean,      // True if expressing frustration or anger
  "adviceRequest": boolean,     // True if seeking advice or recommendations
  "moneyTalk": boolean,         // True if discussing financial topics
  "explanation": string         // Brief explanation of why these categories were chosen
}

Guidelines for categorization:
- Solution Requests: Posts asking for help, solutions, or ways to solve specific problems
- Pain & Anger: Posts expressing frustration, complaints, or negative experiences
- Advice Requests: Posts seeking recommendations, guidance, or best practices
- Money Talk: Posts discussing finances, costs, pricing, or monetary aspects

Each boolean field must be explicitly set to true or false. Do not omit any fields.
The explanation should be a brief sentence explaining your categorization.`
        },
        { 
          role: "user", 
          content: `Title: ${title}\nContent: ${content}` 
        }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    console.log('OpenAI raw response:', response.choices[0].message.content);
    const rawResponse = JSON.parse(response.choices[0].message.content || "{}");
    console.log('Parsed response:', rawResponse);
    
    // Ensure all required fields are present with correct types
    const defaultResponse = {
      solutionRequest: false,
      painAndAnger: false,
      adviceRequest: false,
      moneyTalk: false,
      explanation: "Failed to categorize post"
    };

    const analysis = PostCategorySchema.parse({
      ...defaultResponse,
      ...rawResponse
    });
    
    console.log('Final analysis:', analysis);
    return analysis;
  } catch (error) {
    console.error('Error analyzing post:', { title, error });
    // Return a safe default if analysis fails
    return {
      solutionRequest: false,
      painAndAnger: false,
      adviceRequest: false,
      moneyTalk: false,
      explanation: "Failed to analyze post due to an error"
    };
  }
}

export async function analyzePostThemes(posts: RedditPost[]): Promise<AnalyzedPost[]> {
  console.log('Starting analysis of posts:', posts.length);
  
  // Increase concurrent processing
  const CONCURRENT_REQUESTS = 5; // Increased from 3 to 5
  const CHUNK_SIZE = 10; // Increased from 5 to 10
  const RATE_LIMIT_DELAY = 500; // Reduced from 1000ms to 500ms

  // Split posts into chunks for progress tracking
  const chunks = chunkArray(posts, CHUNK_SIZE);
  const analyzedPosts: AnalyzedPost[] = [];
  let completedPosts = 0;

  // Process all chunks concurrently with rate limiting
  await Promise.all(chunks.map(async (chunk, chunkIndex) => {
    // Add delay between chunks to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, chunkIndex * RATE_LIMIT_DELAY));
    
    // Process posts within chunk concurrently
    const chunkResults = await Promise.all(
      chunk.map(async (post, postIndex) => {
        // Add smaller delay between posts within chunk
        await new Promise(resolve => 
          setTimeout(resolve, (postIndex % CONCURRENT_REQUESTS) * (RATE_LIMIT_DELAY / 2))
        );

        try {
          const analysis = await analyzePost(post.title, post.content);
          completedPosts++;
          console.log(`Analysis progress: ${completedPosts}/${posts.length} posts completed`);
          return {
            ...post,
            categories: analysis
          };
        } catch (error) {
          console.error("Error analyzing post:", { title: post.title, error });
          completedPosts++;
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
      })
    );

    analyzedPosts.push(...chunkResults);
    console.log(`Chunk ${chunkIndex + 1}/${chunks.length} processed, total analyzed: ${analyzedPosts.length}`);
  }));

  console.log('Analysis complete, total posts:', analyzedPosts.length);
  return analyzedPosts;
}

export async function generateStartupIdeas(analyzedPosts: AnalyzedPost[]): Promise<Array<{ idea: string; relatedPosts: RedditPost[]; }>> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a startup idea generator specializing in AI agents. 
          Analyze the provided posts and identify patterns of user needs, pain points, and requests.
          Generate innovative startup ideas for AI agents that could solve these problems.
          Focus on practical, technically feasible solutions that could be built with current AI technology.

          For each idea, provide a detailed breakdown in this format:
          1. Startup Name: A catchy, memorable name
          2. Problem: Clear description of the problem being solved
          3. Solution: How the AI agent addresses this problem
          4. Key Features:
             - List 3-4 core features
             - Explain how each feature works
          5. Technical Feasibility: Why this can be built with current AI technology
          6. Business Model: How it could make money
          7. Target Users: Who would use this
          
          Return a JSON object with an "ideas" array where each item has:
          {
            "ideas": [
              {
                "idea": "The full formatted description following the structure above",
                "postIndices": [0, 1, 2] // Array of indices of posts that inspired this idea
              }
            ]
          }
          
          Make each idea detailed but concise. Focus on practical solutions that could be built today.`
        },
        {
          role: "user",
          content: `Here are categorized posts from a subreddit. Generate 3-5 startup ideas for AI agents based on the patterns and needs you observe:

${analyzedPosts.map((post, index) => `
[${index}]
Title: ${post.title}
Content: ${post.content}
Categories: ${Object.entries(post.categories)
  .filter(([key, value]) => key !== 'explanation' && value)
  .map(([key]) => key)
  .join(', ')}
---
`).join('\n')}`
        }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const parsedResponse = JSON.parse(response.choices[0].message.content || "{}");
    
    if (!parsedResponse.ideas || !Array.isArray(parsedResponse.ideas)) {
      console.error('Invalid response format:', parsedResponse);
      throw new Error('Invalid response format from OpenAI');
    }
    
    // Transform the response to include the actual posts
    return parsedResponse.ideas.map((item: { idea: string; postIndices: number[] }) => ({
      idea: item.idea,
      relatedPosts: item.postIndices.map(index => analyzedPosts[index])
    }));
  } catch (error) {
    console.error('Error generating startup ideas:', error);
    throw new Error('Failed to generate startup ideas');
  }
} 