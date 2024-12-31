import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { validateSubreddit } from './redditClient';

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

export const useSubredditStore = create<SubredditStore>()(
  persist(
    (set) => ({
      subreddits: [
        { name: "ollama", url: "https://reddit.com/r/ollama", addedAt: new Date() },
        { name: "openai", url: "https://reddit.com/r/openai", addedAt: new Date() },
      ],
      addSubreddit: async (name: string) => {
        const isValid = await validateSubreddit(name);
        if (!isValid) return false;

        set((state) => ({
          subreddits: [
            ...state.subreddits,
            {
              name,
              url: `https://reddit.com/r/${name}`,
              addedAt: new Date(),
            },
          ],
        }));
        return true;
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