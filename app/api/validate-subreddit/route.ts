import { NextResponse } from 'next/server';
import { validateSubreddit } from '@/lib/redditClient';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const subreddit = searchParams.get('name');

  if (!subreddit) {
    return NextResponse.json(
      { error: 'Subreddit name is required' },
      { status: 400 }
    );
  }

  try {
    const isValid = await validateSubreddit(subreddit);
    return NextResponse.json({ isValid });
  } catch (error) {
    console.error('Error validating subreddit:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to validate subreddit' },
      { status: 500 }
    );
  }
} 