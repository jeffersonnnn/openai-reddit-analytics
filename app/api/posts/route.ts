import { NextResponse } from 'next/server';
import { getRecentPosts } from '@/lib/redditClient';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const subreddit = searchParams.get('subreddit');

  if (!subreddit) {
    return NextResponse.json({ error: 'Subreddit parameter is required' }, { status: 400 });
  }

  try {
    console.log('Fetching posts for subreddit:', subreddit);
    const posts = await getRecentPosts(subreddit);
    console.log('Fetched posts:', { 
      subreddit, 
      count: posts.length,
      sample: posts.slice(0, 2).map(p => ({ title: p.title, hasContent: !!p.content }))
    });
    return NextResponse.json({ posts });
  } catch (error) {
    console.error('Error fetching posts:', { subreddit, error });
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
} 