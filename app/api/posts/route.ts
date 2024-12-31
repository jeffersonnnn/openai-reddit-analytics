import { NextResponse } from 'next/server';
import { getRecentPosts } from '@/lib/redditClient';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const subreddit = searchParams.get('subreddit');

  if (!subreddit) {
    return NextResponse.json({ error: 'Subreddit parameter is required' }, { status: 400 });
  }

  try {
    const posts = await getRecentPosts(subreddit);
    return NextResponse.json({ posts });
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
} 