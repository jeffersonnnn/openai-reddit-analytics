import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Lightbulb, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { type AnalyzedPost } from "@/lib/openaiClient";
import { generateStartupIdeas } from "@/lib/openaiClient";

interface StartupIdeasSheetProps {
  analyzedPosts: AnalyzedPost[];
}

interface IdeaWithPosts {
  idea: string;
  relatedPosts: AnalyzedPost[];
}

// Add a helper function to generate unique keys
function generatePostKey(post: AnalyzedPost, index: number): string {
  // Handle both Date objects and string timestamps
  const timestamp = post.createdAt instanceof Date 
    ? post.createdAt.getTime() 
    : new Date(post.createdAt).getTime();
  
  // Combine multiple properties to create a unique key
  return `${post.url}-${timestamp}-${index}`;
}

export function StartupIdeasSheet({ analyzedPosts }: StartupIdeasSheetProps) {
  const [ideas, setIdeas] = useState<IdeaWithPosts[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedIdeas, setExpandedIdeas] = useState<Set<number>>(new Set());

  const handleGenerateIdeas = async () => {
    try {
      setLoading(true);
      setError(null);
      const generatedIdeas = await generateStartupIdeas(analyzedPosts);
      setIdeas(generatedIdeas);
      // Expand the first idea by default
      setExpandedIdeas(new Set([0]));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate ideas');
      console.error('Error generating ideas:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleIdea = (index: number) => {
    const newExpanded = new Set(expandedIdeas);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedIdeas(newExpanded);
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button 
          variant="outline" 
          className="gap-2"
          onClick={handleGenerateIdeas}
        >
          <Lightbulb className="h-4 w-4" />
          Generate Startup Ideas
        </Button>
      </SheetTrigger>
      
      <SheetContent className="w-full sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>AI Agent Startup Ideas</SheetTitle>
        </SheetHeader>
        
        <div className="mt-6 space-y-6 h-[calc(100vh-8rem)] overflow-y-auto pr-6">
          {loading ? (
            <div className="flex items-center justify-center text-muted-foreground gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Generating ideas...</span>
            </div>
          ) : error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-red-800">{error}</p>
            </div>
          ) : (
            <div className="space-y-8">
              {ideas.map((ideaWithPosts, ideaIndex) => (
                <div key={ideaIndex} className="space-y-2 border rounded-lg p-4">
                  <div className="space-y-4">
                    <div className="prose prose-sm max-w-none">
                      {ideaWithPosts.idea.split('\n').map((line, lineIndex) => {
                        // Handle different line types
                        if (line.startsWith('1. Startup Name:')) {
                          return <h3 key={`${ideaIndex}-line-${lineIndex}`} className="text-lg font-bold mt-0">{line.replace('1. Startup Name:', '').trim()}</h3>;
                        }
                        if (line.match(/^\d\./)) {
                          // Main sections (Problem, Solution, etc.)
                          const [number, ...rest] = line.split('.');
                          const title = rest.join('.').split(':')[0].trim();
                          const content = rest.join('.').split(':').slice(1).join(':').trim();
                          return (
                            <div key={`${ideaIndex}-line-${lineIndex}`} className="mt-3">
                              <h4 className="font-semibold text-sm text-muted-foreground mb-1">{title}</h4>
                              {content && <p className="mt-1">{content}</p>}
                            </div>
                          );
                        }
                        if (line.trim().startsWith('-')) {
                          // Feature bullets
                          return <li key={`${ideaIndex}-line-${lineIndex}`} className="ml-4">{line.replace('-', '').trim()}</li>;
                        }
                        return <p key={`${ideaIndex}-line-${lineIndex}`} className="my-1">{line}</p>;
                      })}
                    </div>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full mt-4"
                      onClick={() => toggleIdea(ideaIndex)}
                    >
                      <span className="mr-2">Inspiring Posts</span>
                      {expandedIdeas.has(ideaIndex) ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  
                  {expandedIdeas.has(ideaIndex) && (
                    <div className="mt-4 space-y-4 border-t pt-4">
                      <h4 className="font-medium text-sm text-muted-foreground">Posts that inspired this idea:</h4>
                      {ideaWithPosts.relatedPosts.map((post, postIndex) => (
                        <div key={generatePostKey(post, postIndex)} className="space-y-2 bg-muted p-3 rounded-md">
                          <a
                            href={post.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline font-medium text-sm"
                          >
                            {post.title}
                          </a>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {post.content}
                          </p>
                          <div className="text-xs text-muted-foreground">
                            Categories: {Object.entries(post.categories)
                              .filter(([key, value]) => key !== 'explanation' && value)
                              .map(([key]) => key)
                              .join(', ')}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {ideas.length === 0 && (
                <p className="text-muted-foreground text-center">
                  Click the button to generate startup ideas based on the analyzed posts.
                </p>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
} 