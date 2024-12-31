"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { type RedditPost } from "@/lib/redditClient";
import { analyzePostThemes, type AnalyzedPost } from "@/lib/openaiClient";
import { Loader2 } from "lucide-react";

interface Theme {
  name: string;
  count: number;
  posts: AnalyzedPost[];
}

interface ThemeCardsProps {
  subreddit: string;
}

const THEMES = {
  solutionRequest: "Solution Requests",
  painAndAnger: "Pain & Anger",
  adviceRequest: "Advice Requests",
  moneyTalk: "Money Talk"
} as const;

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
        
        // Initialize empty theme map
        const themeMap = new Map<string, AnalyzedPost[]>();
        Object.values(THEMES).forEach(name => themeMap.set(name, []));
        
        // Show initial state while analyzing
        const initialThemes = Array.from(themeMap.entries()).map(([name, posts]) => ({
          name,
          count: 0,
          posts: []
        }));
        setThemes(initialThemes);
        
        // Analyze posts with OpenAI
        const analyzedPosts = await analyzePostThemes(data.posts);
        
        // Group posts by theme
        analyzedPosts.forEach(post => {
          Object.entries(post.categories).forEach(([category, belongs]) => {
            if (category !== 'explanation' && belongs && THEMES[category as keyof typeof THEMES]) {
              const themeName = THEMES[category as keyof typeof THEMES];
              themeMap.get(themeName)?.push(post);
            }
          });
        });
        
        // Convert to array of Theme objects
        const themeArray: Theme[] = Array.from(themeMap.entries()).map(([name, posts]) => ({
          name,
          count: posts.length,
          posts
        }));
        
        setThemes(themeArray);
      } catch (err) {
        console.error("Error analyzing posts:", err);
        setError(err instanceof Error ? err.message : "Failed to analyze posts. Please try again later.");
      } finally {
        setLoading(false);
      }
    }

    fetchAndAnalyzePosts();
  }, [subreddit]);

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {loading && (
        <div className="flex items-center justify-center text-muted-foreground gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Analyzing posts...</span>
        </div>
      )}
      
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
                    <p className="text-xs text-muted-foreground italic">
                      {post.categories.explanation}
                    </p>
                  </div>
                ))}
                {theme.posts.length === 0 && (
                  <p className="text-muted-foreground">No posts in this category yet.</p>
                )}
              </div>
            </SheetContent>
          </Sheet>
        ))}
      </div>
    </div>
  );
} 