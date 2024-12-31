"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

interface SubredditCardProps {
  name: string;
  url: string;
  onSelect: () => void;
}

export function SubredditCard({ name, url, onSelect }: SubredditCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-bold">r/{name}</CardTitle>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-500 hover:text-gray-700"
        >
          <ExternalLink size={20} />
        </a>
      </CardHeader>
      <CardContent>
        <Button
          onClick={onSelect}
          variant="default"
          className="w-full"
        >
          View Analytics
        </Button>
      </CardContent>
    </Card>
  );
} 