"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TopPostsTable } from "@/components/TopPostsTable";
import { ThemeCards } from "@/components/ThemeCards";

export default function SubredditPage({
  params,
}: {
  params: { subreddit: string };
}) {
  return (
    <main className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold">r/{params.subreddit}</h1>
        <a
          href={`https://reddit.com/r/${params.subreddit}`}
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
          <TopPostsTable subreddit={params.subreddit} />
        </TabsContent>
        
        <TabsContent value="themes" className="space-y-4">
          <ThemeCards subreddit={params.subreddit} />
        </TabsContent>
      </Tabs>
    </main>
  );
} 