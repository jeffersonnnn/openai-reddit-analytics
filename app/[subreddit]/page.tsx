"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TopPostsTable } from "@/components/TopPostsTable";
import { ThemeCards } from "@/components/ThemeCards";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface PageProps {
  params: Promise<{ subreddit: string }>;
}

export default function SubredditPage({ params }: PageProps) {
  const { subreddit } = use(params);
  const router = useRouter();

  return (
    <main className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => router.push('/')}
            className="hover:bg-muted"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-4xl font-bold">r/{subreddit}</h1>
        </div>
        <a
          href={`https://reddit.com/r/${subreddit}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:underline"
        >
          View on Reddit
        </a>
      </div>

      <Tabs defaultValue="top-posts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="top-posts">Top Posts</TabsTrigger>
          <TabsTrigger value="themes">Themes</TabsTrigger>
        </TabsList>
        
        <TabsContent value="top-posts" className="space-y-4">
          <TopPostsTable subreddit={subreddit} />
        </TabsContent>
        
        <TabsContent value="themes" className="space-y-4">
          <ThemeCards subreddit={subreddit} />
        </TabsContent>
      </Tabs>
    </main>
  );
} 