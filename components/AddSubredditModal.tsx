"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";

interface AddSubredditModalProps {
  onAdd: (subreddit: string) => void;
}

export function AddSubredditModal({ onAdd }: AddSubredditModalProps) {
  const [input, setInput] = useState("");
  const [open, setOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const subredditName = input.replace(/^(https?:\/\/)?(www\.)?reddit\.com\/r\//, "").replace(/\/$/, "");
    if (subredditName) {
      onAdd(subredditName);
      setInput("");
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full h-[200px] border-dashed">
          <Plus className="mr-2" />
          Add Subreddit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Subreddit</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            placeholder="Enter subreddit URL or name (e.g., r/ollama)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <Button type="submit" className="w-full">
            Add Subreddit
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
} 