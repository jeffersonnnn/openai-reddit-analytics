"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { getRecentPosts, type RedditPost } from "@/lib/redditClient";
import { analyzePostThemes } from "@/lib/openaiClient";

interface Theme {
  name: string;
  count: number;
  posts: RedditPost[];
}

interface ThemeCardsProps {
  subreddit: string;
}

const THEMES = [
  "Solution Requests",
  "Pain & Anger",
  "Advice Requests",
  "Money Talk"
] as const;

export function ThemeCards({ subreddit }: ThemeCardsProps) {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);

  useEffect(() => {
    async function fetchAndAnalyzePosts() {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch posts from API
        const response = await fetch(`/api/posts?subreddit=${subreddit}`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch posts');
        }
        
        // Analyze posts with OpenAI
        const analyzedPosts = await analyzePostThemes(data.posts);
        
        // Group posts by theme
        const themeMap = new Map<string, RedditPost[]>();
        THEMES.forEach(theme => themeMap.set(theme, []));
        
        analyzedPosts.forEach(post => {
          const theme = post.theme as typeof THEMES[number];
          if (themeMap.has(theme)) {
            themeMap.get(theme)!.push(post);
          }
        });
        
        // Convert to array of Theme objects
        const themeArray: Theme[] = Array.from(themeMap.entries()).map(([name, posts]) => ({
          name,
          count: posts.length,
          posts
        }));
        
        setThemes(themeArray);
      } catch (err) {
        setError("Failed to analyze posts. Please try again later.");
        console.error("Error analyzing posts:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchAndAnalyzePosts();
  }, [subreddit]);

  if (loading) {
    return <div>Analyzing posts...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {themes.map((theme) => (
        <Sheet key={theme.name}>
          <SheetTrigger asChild>
            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setSelectedTheme(theme)}
            >
              <CardHeader>
                <CardTitle>{theme.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{theme.count}</div>
                <div className="text-sm text-muted-foreground">posts</div>
              </CardContent>
            </Card>
          </SheetTrigger>
          
          <SheetContent>
            <SheetHeader>
              <SheetTitle>{theme.name}</SheetTitle>
            </SheetHeader>
            <div className="mt-6 space-y-6">
              {theme.posts.map((post) => (
                <div key={post.url} className="space-y-2">
                  <a
                    href={post.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline font-medium"
                  >
                    {post.title}
                  </a>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {post.content}
                  </p>
                </div>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      ))}
    </div>
  );
} 