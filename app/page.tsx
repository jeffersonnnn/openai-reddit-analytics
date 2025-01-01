"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SubredditCard } from "@/components/SubredditCard";
import { AddSubredditModal } from "@/components/AddSubredditModal";
import { useSubredditStore } from "@/lib/subredditStore";
import { toast } from "sonner";

export default function Home() {
  const router = useRouter();
  const [isAdding, setIsAdding] = useState(false);
  const { subreddits, addSubreddit } = useSubredditStore();

  const handleAddSubreddit = async (name: string) => {
    setIsAdding(true);
    try {
      const success = await addSubreddit(name);
      if (success) {
        toast.success(`Added r/${name} successfully!`);
      } else {
        toast.error(`Failed to add r/${name}. Please check if the subreddit exists and is not NSFW.`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      toast.error(errorMessage);
      console.error('Error adding subreddit:', {
        name,
        error: errorMessage
      });
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <main className="container mx-auto py-8">
      <h1 className="text-4xl font-bold mb-8">Reddit Analytics Platform</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {subreddits.map((subreddit) => (
          <SubredditCard
            key={subreddit.name}
            name={subreddit.name}
            url={subreddit.url}
            onSelect={() => router.push(`/${subreddit.name}`)}
          />
        ))}
        <AddSubredditModal onAdd={handleAddSubreddit} />
      </div>
    </main>
  );
}
