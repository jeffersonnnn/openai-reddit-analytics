import snoowrap from 'snoowrap';

// Remove deprecation warnings for punycode
process.removeAllListeners('warning');
process.on('warning', (warning) => {
  if (warning.name === 'DeprecationWarning' && warning.message.includes('punycode')) {
    return;
  }
  console.warn(warning);
});

// Define types for Reddit post data
export interface RedditPost {
  title: string;
  content: string;
  score: number;
  numComments: number;
  createdAt: Date;
  url: string;
}

// Initialize the Reddit client with request timeout
const reddit = new snoowrap({
  userAgent: process.env.REDDIT_USER_AGENT || '',
  clientId: process.env.REDDIT_CLIENT_ID || '',
  clientSecret: process.env.REDDIT_CLIENT_SECRET || '',
  username: process.env.REDDIT_USERNAME || '',
  password: process.env.REDDIT_PASSWORD || ''
});

// Configure client settings
reddit.config({
  requestTimeout: 30000, // 30 seconds timeout
  continueAfterRatelimitError: true,
  retryErrorCodes: [502, 503, 504, 522, 'ETIMEDOUT', 'ESOCKETTIMEDOUT'],
  maxRetryAttempts: 3
});

async function withRetry<T>(operation: () => Promise<T>, maxAttempts = 3): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxAttempts) throw error;
      
      // Wait before retrying (exponential backoff)
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      console.log(`Retry attempt ${attempt} of ${maxAttempts}...`);
    }
  }
  throw new Error('All retry attempts failed');
}

export async function validateSubreddit(subredditName: string): Promise<boolean> {
  try {
    const subreddit = await withRetry(() => reddit.getSubreddit(subredditName).fetch());
    return !subreddit.over18; // Only allow non-NSFW subreddits
  } catch (error) {
    console.error('Error validating subreddit:', error);
    return false;
  }
}

export async function getRecentPosts(subreddit: string): Promise<RedditPost[]> {
  try {
    const now = Math.floor(Date.now() / 1000);
    const yesterday = now - (24 * 60 * 60);

    const posts = await withRetry(() => 
      reddit.getSubreddit(subreddit).getNew({ limit: 100 })
    );

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

    if (recentPosts.length === 0) {
      console.log('No recent posts found in the last 24 hours');
    }

    return recentPosts;
  } catch (error) {
    console.error('Error fetching Reddit posts:', error);
    throw new Error('Failed to fetch Reddit posts. Please try again later.');
  }
} 