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

// Initialize the Reddit client with request timeout - only on server side
let reddit: snoowrap;

// Ensure this code only runs on the server side
if (typeof window === 'undefined') {
  reddit = new snoowrap({
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
}

async function withRetry<T>(operation: () => Promise<T>, maxAttempts = 3): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, {
        error: error instanceof Error ? error.message : error,
        name: error instanceof Error ? error.name : 'Unknown',
        stack: error instanceof Error ? error.stack : undefined
      });
      
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
    // Remove 'r/' prefix if present
    const cleanSubredditName = subredditName.replace(/^r\//, '');
    console.log(`Attempting to validate subreddit: ${cleanSubredditName}`);
    
    const subreddit = await withRetry(() => reddit.getSubreddit(cleanSubredditName).fetch());
    
    if (!subreddit) {
      console.error('Subreddit validation failed: No subreddit data returned');
      return false;
    }
    
    if (subreddit.over18) {
      console.log('Subreddit validation failed: NSFW content');
      return false;
    }
    
    return true;
  } catch (error) {
    const errorDetails = {
      subreddit: subredditName,
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    };
    
    console.error('Error validating subreddit:', errorDetails);
    
    // Throw a more informative error
    throw new Error(`Failed to validate subreddit '${subredditName}': ${errorDetails.message}`);
  }
}

export async function getRecentPosts(subreddit: string): Promise<RedditPost[]> {
  try {
    const now = Math.floor(Date.now() / 1000);
    const yesterday = now - (24 * 60 * 60);

    console.log('Fetching posts with params:', { subreddit, since: new Date(yesterday * 1000) });
    
    // Fetch more posts and include hot posts for better content
    const [newPosts, hotPosts] = await Promise.all([
      withRetry(() => reddit.getSubreddit(subreddit).getNew({ limit: 50 })),
      withRetry(() => reddit.getSubreddit(subreddit).getHot({ limit: 50 }))
    ]);

    // Combine and deduplicate posts
    const allPosts = [...newPosts, ...hotPosts];
    const uniquePosts = Array.from(
      new Map(allPosts.map(post => [post.id, post])).values()
    );

    const recentPosts = uniquePosts
      .filter((post: any) => post.created_utc >= yesterday && post.selftext)  // Only include posts with content
      .map((post: any) => ({
        title: post.title,
        content: post.selftext,
        score: post.score,
        numComments: post.num_comments,
        createdAt: new Date(post.created_utc * 1000),
        url: post.url
      }));

    console.log('Post stats:', {
      total: uniquePosts.length,
      recent: recentPosts.length,
      withContent: recentPosts.filter(p => p.content).length
    });

    if (recentPosts.length === 0) {
      console.log('No recent posts found in the last 24 hours');
    }

    return recentPosts;
  } catch (error) {
    console.error('Error fetching Reddit posts:', error);
    throw new Error('Failed to fetch Reddit posts. Please try again later.');
  }
} 