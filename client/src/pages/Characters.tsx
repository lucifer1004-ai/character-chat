import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { Bot, Plus, Loader2, MessageSquare, Users, Home } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

export default function Characters() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isPublic, setIsPublic] = useState(false);

  const utils = trpc.useUtils();
  const { data: characters, isLoading } = trpc.characters.list.useQuery();
  const createMutation = trpc.characters.create.useMutation({
    onSuccess: () => {
      utils.characters.list.invalidate();
      setOpen(false);
      resetForm();
      toast.success("Character created successfully!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create character");
    },
  });

  const resetForm = () => {
    setName("");
    setDescription("");
    setSystemPrompt("");
    setAvatarUrl("");
    setIsPublic(false);
  };

  const handleCreate = () => {
    if (!name.trim() || !systemPrompt.trim()) {
      toast.error("Name and system prompt are required");
      return;
    }

    createMutation.mutate({
      name: name.trim(),
      description: description.trim() || undefined,
      systemPrompt: systemPrompt.trim(),
      avatarUrl: avatarUrl.trim() || undefined,
      isPublic,
    });
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
            <h1 className="text-2xl font-bold">My Characters</h1>
          </div>
          <div className="flex gap-3">
            <Link href="/group-chats">
              <Button variant="outline" className="gap-2">
                <Users className="w-4 h-4" />
                Group Chats
              </Button>
            </Link>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  New Character
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Character</DialogTitle>
                  <DialogDescription>
                    Define your AI character's personality and knowledge base
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., Dr. Einstein"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Brief description of the character"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="systemPrompt">System Prompt *</Label>
                    <Textarea
                      id="systemPrompt"
                      value={systemPrompt}
                      onChange={(e) => setSystemPrompt(e.target.value)}
                      placeholder="You are a theoretical physicist specializing in relativity..."
                      rows={6}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="avatarUrl">Avatar URL</Label>
                    <Input
                      id="avatarUrl"
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                      placeholder="https://..."
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isPublic"
                      checked={isPublic}
                      onCheckedChange={setIsPublic}
                    />
                    <Label htmlFor="isPublic">Make this character public</Label>
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
        ) : characters && characters.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {characters.map((character) => (
              <Card key={character.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(`/characters/${character.id}`)}>
                <CardHeader>
                  <div className="flex items-start gap-4">
                    {character.avatarUrl ? (
                      <img src={character.avatarUrl} alt={character.name} className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Bot className="w-6 h-6 text-primary" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <CardTitle className="truncate">{character.name}</CardTitle>
                      {character.description && (
                        <CardDescription className="line-clamp-2 mt-1">
                          {character.description}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 gap-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/characters/${character.id}`);
                      }}
                    >
                      <MessageSquare className="w-4 h-4" />
                      Chat
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Bot className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No characters yet</h3>
            <p className="text-muted-foreground mb-6">Create your first AI character to get started</p>
            <Button onClick={() => setOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Create Character
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}

