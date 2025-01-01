import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Subreddit {
  name: string;
  url: string;
  addedAt: Date;
}

interface SubredditStore {
  subreddits: Subreddit[];
  addSubreddit: (name: string) => Promise<boolean>;
  removeSubreddit: (name: string) => void;
}

async function validateSubredditAPI(name: string): Promise<boolean> {
  const response = await fetch(`/api/validate-subreddit?name=${encodeURIComponent(name)}`);
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Failed to validate subreddit');
  }
  
  return data.isValid;
}

export const useSubredditStore = create<SubredditStore>()(
  persist(
    (set) => ({
      subreddits: [
        { name: "ollama", url: "https://reddit.com/r/ollama", addedAt: new Date() },
        { name: "openai", url: "https://reddit.com/r/openai", addedAt: new Date() },
      ],
      addSubreddit: async (name: string) => {
        try {
          const isValid = await validateSubredditAPI(name);
          if (!isValid) {
            console.error(`Subreddit '${name}' validation failed`);
            return false;
          }

          const cleanName = name.replace(/^r\//, '');
          set((state) => ({
            subreddits: [
              ...state.subreddits,
              {
                name: cleanName,
                url: `https://reddit.com/r/${cleanName}`,
                addedAt: new Date(),
              },
            ],
          }));
          return true;
        } catch (error) {
          console.error('Failed to add subreddit:', {
            name,
            error: error instanceof Error ? error.message : String(error)
          });
          throw error;
        }
      },
      removeSubreddit: (name: string) =>
        set((state) => ({
          subreddits: state.subreddits.filter((s) => s.name !== name),
        })),
    }),
    {
      name: 'subreddit-storage',
    }
  )
); 