import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { trpc } from "@/lib/trpc";
import { Users, Plus, Loader2, Home, Bot, MessageSquare } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

export default function GroupChats() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [topic, setTopic] = useState("");
  const [selectedCharacters, setSelectedCharacters] = useState<number[]>([]);

  const utils = trpc.useUtils();
  const { data: groupChats, isLoading } = trpc.groupChats.list.useQuery();
  const { data: characters } = trpc.characters.list.useQuery();

  const createMutation = trpc.groupChats.create.useMutation({
    onSuccess: (data) => {
      utils.groupChats.list.invalidate();
      setOpen(false);
      resetForm();
      toast.success("Group chat created successfully!");
      navigate(`/group-chats/${data.id}`);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create group chat");
    },
  });

  const resetForm = () => {
    setName("");
    setDescription("");
    setTopic("");
    setSelectedCharacters([]);
  };

  const handleCreate = () => {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }

    if (selectedCharacters.length < 2) {
      toast.error("Select at least 2 characters");
      return;
    }

    createMutation.mutate({
      name: name.trim(),
      description: description.trim() || undefined,
      topic: topic.trim() || undefined,
      characterIds: selectedCharacters,
    });
  };

  const toggleCharacter = (id: number) => {
    setSelectedCharacters((prev) =>
      prev.includes(id) ? prev.filter((cid) => cid !== id) : [...prev, id]
    );
  };

  if (!isAuthenticated) {
    navigate("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 backdrop-blur-sm bg-card/50 sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <Home className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Group Chats</h1>
          </div>
          <div className="flex gap-3">
            <Link href="/characters">
              <Button variant="outline" className="gap-2">
                <Bot className="w-4 h-4" />
                Characters
              </Button>
            </Link>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  New Group Chat
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create Group Chat</DialogTitle>
                  <DialogDescription>
                    Set up a discussion with multiple AI characters
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., Physics Seminar"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Brief description"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="topic">Discussion Topic</Label>
                    <Textarea
                      id="topic"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="What should the characters discuss?"
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Select Characters (minimum 2) *</Label>
                    <div className="border border-border rounded-lg p-4 space-y-3 max-h-60 overflow-y-auto">
                      {characters && characters.length > 0 ? (
                        characters.map((character) => (
                          <div key={character.id} className="flex items-center space-x-3">
                            <Checkbox
                              id={`char-${character.id}`}
                              checked={selectedCharacters.includes(character.id)}
                              onCheckedChange={() => toggleCharacter(character.id)}
                            />
                            <label
                              htmlFor={`char-${character.id}`}
                              className="flex items-center gap-2 flex-1 cursor-pointer"
                            >
                              {character.avatarUrl ? (
                                <img
                                  src={character.avatarUrl}
                                  alt={character.name}
                                  className="w-8 h-8 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                  <Bot className="w-4 h-4 text-primary" />
                                </div>
                              )}
                              <span className="font-medium">{character.name}</span>
                            </label>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No characters available. Create characters first.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreate} disabled={createMutation.isPending}>
                    {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Create
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-6 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : groupChats && groupChats.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groupChats.map((chat) => (
              <Card
                key={chat.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/group-chats/${chat.id}`)}
              >
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                      <Users className="w-6 h-6 text-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="truncate">{chat.name}</CardTitle>
                      {chat.description && (
                        <CardDescription className="line-clamp-2 mt-1">
                          {chat.description}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full gap-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/group-chats/${chat.id}`);
                    }}
                  >
                    <MessageSquare className="w-4 h-4" />
                    Open Discussion
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Users className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No group chats yet</h3>
            <p className="text-muted-foreground mb-6">Create a group chat to start discussions</p>
            <Button onClick={() => setOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Create Group Chat
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}

