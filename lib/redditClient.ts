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

// Initialize the Reddit client
const reddit = new snoowrap({
  userAgent: process.env.REDDIT_USER_AGENT || '',
  clientId: process.env.REDDIT_CLIENT_ID || '',
  clientSecret: process.env.REDDIT_CLIENT_SECRET || '',
  username: process.env.REDDIT_USERNAME || '',
  password: process.env.REDDIT_PASSWORD || ''
});

export async function validateSubreddit(subredditName: string): Promise<boolean> {
  try {
    const subreddit = await reddit.getSubreddit(subredditName).fetch();
    return !subreddit.over18; // Only allow non-NSFW subreddits
  } catch (error) {
    return false;
  }
}

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