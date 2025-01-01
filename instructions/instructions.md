# Product Requirements Document (PRD)

## Project Overview
The goal is to create a Reddit analytics platform where users can analyze different subreddits, view top content, and explore categorized themes of posts. The platform will use the following technologies:

- **Frontend**: Next.js 14, TailwindCSS, shadcn, Lucid Icons
- **Backend**: Snoowrap for Reddit API integration, OpenAI for categorization
- **Core Libraries**: Snoowrap for fetching Reddit data, OpenAI API for text analysis

---

## Core Functionality

### 1. Subreddit Management
#### User Story:
Users can view a list of available subreddits and add new ones.

#### Features:
- Display a list of subreddit cards for common subreddits (e.g., `ollama`, `openai`).
- Add Subreddit:
  - Clicking a button opens a modal for the user to paste a subreddit URL.
  - After submission, a new card is dynamically created and displayed.

### 2. Subreddit Page
#### User Story:
Users can view detailed analytics for a selected subreddit.

#### Features:
- Each subreddit has a dedicated page with two tabs:
  1. **Top Posts**: Displays a table of the top posts from the past 24 hours.
  2. **Themes**: Categorizes posts into pre-defined themes using OpenAI.

### 3. Fetch Reddit Posts Data ("Top Posts")
#### User Story:
Users can view a sorted table of Reddit posts based on scores from the past 24 hours.

#### Features:
- Fetch posts using Snoowrap:
  - Include `title`, `score`, `content`, `url`, `created_utc`, and `num_comments`.
- Display posts in a sortable table component.
- Default sorting: `num_comments`.

### 4. Analyze Reddit Posts Data ("Themes")
#### User Story:
Users can explore categorized themes of posts.

#### Features:
- Analyze posts with OpenAI into categories:
  1. **Solution Requests**
  2. **Pain & Anger**
  3. **Advice Requests**
  4. **Money Talk**
- Display counts for each category.
- Clicking a category card opens a side panel to view all posts within that category.

#### Processing:
- Send data to OpenAI for concurrent analysis.

### 5. Dynamic Card Addition
#### User Story:
Users can dynamically add new subreddit cards and trigger re-analysis.

the goal of @Codebase is to go into reddit communities of high finance people in private equity, hedge funds and investment banking and then find out their problems and then suggest AI agent startup ideas that will solve these problems for them so i can build and sell to the people of the subreddit

---

## File Structure
### Root Directory
```
reddit-analytics-platform
├── README.md
├── app
│   ├── [subreddit]
│   │   └── page.tsx
│   ├── api
│   │   └── posts
│   ├── favicon.ico
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components
│   ├── AddSubredditModal.tsx
│   ├── SubredditCard.tsx
│   ├── ThemeCards.tsx
│   ├── TopPostsTable.tsx
│   └── ui
│       ├── badge.tsx
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── sheet.tsx
│       ├── table.tsx
│       └── tabs.tsx
├── components.json
├── eslint.config.mjs
├── instructions
│   └── instructions.md
├── lib
│   ├── openaiClient.ts
│   ├── redditClient.ts
│   ├── subredditStore.ts
│   └── utils.ts
├── next-env.d.ts
├── next.config.ts
├── package-lock.json
├── package.json
├── postcss.config.mjs
├── public
│   ├── file.svg
│   ├── globe.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
├── tailwind.config.ts
└── tsconfig.json
```
---

## Documentation
### Snoowrap: Fetching Reddit Posts
#### Example Code
```javascript
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
    const now = Math.floor(Date.now() / 1000);
    const yesterday = now - (24 * 60 * 60);

    const posts = await reddit.getSubreddit(subreddit).getNew({ limit: 100 });

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

main();
```
---

### OpenAI: Analyzing Reddit Posts
#### Example Code
```javascript
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

const openai = new OpenAI({
  apiKey: "sk-...",
});

const PostCategorySchema = z.object({
  solutionRequest: z.boolean().describe("Seeking solutions for problems."),
  painAndAnger: z.boolean().describe("Expressing frustration or anger."),
  adviceRequest: z.boolean().describe("Seeking advice or recommendations."),
  moneyTalk: z.boolean().describe("Discussing financial topics."),
  explanation: z.string().describe("Why the post fits the categories."),
});

type PostCategoryAnalysis = z.infer<typeof PostCategorySchema>;

export async function analyzePost(title: string, content: string): Promise<PostCategoryAnalysis> {
  try {
    const completion = await openai.beta.chat.completions.parse({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Categorize the given post." },
        { role: "user", content: `Title: ${title}\nContent: ${content}` },
      ],
      response_format: zodResponseFormat(PostCategorySchema, "post_category_analysis"),
    });

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
```

