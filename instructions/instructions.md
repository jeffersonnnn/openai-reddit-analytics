# Project Overview
You are build a Reddit analytics platform, where users can get analytics of different subreddits, where they can see top contents & see category of posts; 

You will be using Nextjs 14, shadcn, tailwin, lucid icon

# Core Functionality

1. See list of available sub reddits & add new sub reddits
    - Users can see list of available sub reddits that already created display in cards, common ones like "ollama", "openai"
    - Users can clickin and add reddit button, which should open a modal for users to paste in reddit url and add
    - After users adding a new reddit, a new card should be added
2. Subreddit page
    - Clicking on each subreddit, should goes to a reddit page
    - With 2 tabs: "Top posts", "Themes"
3. Fetch reddit posts data in "Top posts"
    - Under "Top posts" page, we want to display fetched reddit posts from past 24 hrs
    - We will use snoowrap as library to fetch reddit data
    - Each post including title, score, content, url, created_utc, num_comments
    - Display the reddits in a table component, Sort based on num of score
4. Analyse reddit posts data in "Themes"
    - For each post, we should send post data to OpenAl using structured output to categorise "Solution requests", "Pain & anger", "Advice requests", "Money talk";
        - "Solution requests": Posts where people are seeking solutions for problems
        - "Pain & anger": Posts where people are expressing frustration or anger
        - "Advice requests": Posts where people are seeking advice or recommendations
        - "Money talk": Posts where people are discussing financial topics or asking for financial advice
    - This process needs to be ran concurrently for posts, so it will be faster
    - In "Themes" page, we want to display the count of each category, with title, description, and num of counts
    - Clicking on the card will open side panel to display all posts under this category
5. Ability to add new cards
    - Users should be able to add a new card
    - After a new card is added, it should trigger the analysis again

# Doc
## Documentation of how to use snoowrap to fetch reddit posts data

CODE EXAMPLE:
```
process.removeAllListeners('warning');
process.on('warning', (warning) => {
  if (warning.name === 'DeprecationWarning' && warning.message.includes('punycode')) {
    return;
  }
  console.warn(warning);
});

import snoowrap from 'snoowrap';

// Define types for Reddit post data
interface RedditPost {
  title: string;
  content: string;
  score: number;
  numComments: number;
  createdAt: Date;
  url: string;
}

// Initialize the Reddit client
const reddit = new snoowrap({
  userAgent: 'jeffersonighalo',
  clientId: 'oE8e7U5yqOAM8owRG0yGfg',
  clientSecret: 'CHzStMOwDTNcYx9SvKjvYvfai8tRYg',
  username: 'jeffersonighalo',
  password: 'Composed100$'
});

export async function getRecentPosts(subreddit: string): Promise<RedditPost[]> {
  try {
    // Get current time and 24 hours ago in seconds
    const now = Math.floor(Date.now() / 1000);
    const yesterday = now - (24 * 60 * 60);

    // Fetch posts from the subreddit
    const posts = await reddit
      .getSubreddit(subreddit)
      .getNew({ limit: 100 }); // Get up to 100 newest posts

    // Filter and map the posts
    const recentPosts = posts
      .filter((post: any) => post.created_utc >= yesterday)
      .map((post: any) => ({
        title: post.title,
        content: post.selftext,
        score: post.score,
        numComments: post.num_comments,
        createdAt: new Date(post.created_utc * 1000),
        url: post.url
      }));

    return recentPosts;

  } catch (error) {
    console.error('Error fetching Reddit posts:', error);
    throw error;
  }
} 

async function main() {
  try {
    const posts = await getRecentPosts('ollama');
    console.log('Found', posts.length, 'posts from the last 24 hours:');
    posts.forEach(post => {
      console.log('\n-------------------');
      console.log('Title:', post.title);
      console.log('Score:', post.score);
      console.log('Comments:', post.numComments);
      console.log('Created:', post.createdAt);
      console.log('URL:', post.url);
    });
  } catch (error) {
    console.error('Error in main:', error);
  }
}

// Execute the main function
main(); 

```

## Documentation of how to use OpenAI to analyse reddit posts

CODE EXAMPLE:
```
process.removeAllListeners('warning');
process.on('warning', (warning) => {
  if (warning.name === 'DeprecationWarning' && warning.message.includes('punycode')) {
    return;
  }
  console.warn(warning);
});

import OpenAI from "openai";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: "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",
});

// Define the Zod schema for post analysis with detailed descriptions
const PostCategorySchema = z.object({
  solutionRequest: z.boolean().describe(
    "Posts where people are seeking solutions for problems. Look for phrases indicating technical issues, bugs, or specific problems that need solving."
  ),
  painAndAnger: z.boolean().describe(
    "Posts expressing frustration, pain, or anger. Look for emotional language, complaints, or expressions of dissatisfaction."
  ),
  adviceRequest: z.boolean().describe(
    "Posts seeking advice or recommendations. Look for questions about best practices, opinions, or guidance on decisions."
  ),
  moneyTalk: z.boolean().describe(
    "Posts discussing financial topics or spending. Look for mentions of costs, prices, investments, or any money-related discussions."
  ),
  explanation: z.string().describe(
    "Provide a brief explanation of why the post fits into the selected categories."
  )
});

// Type inference from the schema
type PostCategoryAnalysis = z.infer<typeof PostCategorySchema>;

export async function analyzePost(title: string, content: string): Promise<PostCategoryAnalysis> {
  try {
    const completion = await openai.beta.chat.completions.parse({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a post categorization system. Analyze the given post and categorize it according to the defined schema. Provide detailed reasoning in the explanation field."
        },
        {
          role: "user",
          content: `Title: ${title}\nContent: ${content}`
        }
      ],
      response_format: zodResponseFormat(PostCategorySchema, "post_category_analysis"),
    });

    // Handle the case where parsing returns null
    const analysis = completion.choices[0].message.parsed;
    if (!analysis) {
      throw new Error('Failed to parse OpenAI response');
    }

    return analysis;

  } catch (error) {
    console.error('Error analyzing post:', error);
    throw error;
  }
}

// Example usage:
async function testAnalysis() {
  const testPost = {
    title: "Having issues with Ollama installation - Need help!",
    content: "I'm really frustrated with the installation process. I've tried everything but keep getting errors. I spent $50 on a course that recommended this. Can someone please help me figure out what's wrong?"
  };

  try {
    const analysis = await analyzePost(testPost.title, testPost.content);
    console.log('Post Analysis:', analysis);
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Uncomment to test
testAnalysis();
```

# Current File Structure