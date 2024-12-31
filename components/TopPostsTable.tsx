"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getRecentPosts, type RedditPost } from "@/lib/redditClient";
import { formatDistanceToNow } from "date-fns";

interface TopPostsTableProps {
  subreddit: string;
}

export function TopPostsTable({ subreddit }: TopPostsTableProps) {
  const [posts, setPosts] = useState<RedditPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<keyof RedditPost>("numComments");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    async function fetchPosts() {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/api/posts?subreddit=${subreddit}`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch posts');
        }
        
        setPosts(data.posts);
      } catch (err) {
        setError("Failed to fetch posts. Please try again later.");
        console.error("Error fetching posts:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchPosts();
  }, [subreddit]);

  const sortedPosts = [...posts].sort((a, b) => {
    const aValue = a[sortBy];
    const bValue = b[sortBy];
    return sortDirection === "asc" 
      ? (aValue > bValue ? 1 : -1)
      : (bValue > aValue ? 1 : -1);
  });

  const handleSort = (column: keyof RedditPost) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortDirection("desc");
    }
  };

  if (loading) {
    return <div>Loading posts...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead 
              className="cursor-pointer"
              onClick={() => handleSort("title")}
            >
              Title
            </TableHead>
            <TableHead 
              className="cursor-pointer text-right"
              onClick={() => handleSort("score")}
            >
              Score
            </TableHead>
            <TableHead 
              className="cursor-pointer text-right"
              onClick={() => handleSort("numComments")}
            >
              Comments
            </TableHead>
            <TableHead 
              className="cursor-pointer text-right"
              onClick={() => handleSort("createdAt")}
            >
              Posted
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedPosts.map((post) => (
            <TableRow key={post.url}>
              <TableCell>
                <a
                  href={post.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  {post.title}
                </a>
              </TableCell>
              <TableCell className="text-right">{post.score}</TableCell>
              <TableCell className="text-right">{post.numComments}</TableCell>
              <TableCell className="text-right">
                {formatDistanceToNow(post.createdAt, { addSuffix: true })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
} 