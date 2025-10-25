import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { Bot, Plus, Loader2, ArrowLeft, MessageSquare, Trash2, BookOpen } from "lucide-react";
import { useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import { toast } from "sonner";

export default function CharacterDetail() {
  const { id } = useParams<{ id: string }>();
  const characterId = parseInt(id || "0");
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [knowledgeOpen, setKnowledgeOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const utils = trpc.useUtils();
  const { data: character, isLoading: characterLoading } = trpc.characters.get.useQuery({ id: characterId });
  const { data: knowledge, isLoading: knowledgeLoading } = trpc.knowledge.list.useQuery({ characterId });
  const { data: conversations } = trpc.conversations.list.useQuery();

  const addKnowledgeMutation = trpc.knowledge.add.useMutation({
    onSuccess: () => {
      utils.knowledge.list.invalidate();
      setKnowledgeOpen(false);
      setTitle("");
      setContent("");
      toast.success("Knowledge added successfully!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add knowledge");
    },
  });

  const deleteKnowledgeMutation = trpc.knowledge.delete.useMutation({
    onSuccess: () => {
      utils.knowledge.list.invalidate();
      toast.success("Knowledge deleted");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete knowledge");
    },
  });

  const createConversationMutation = trpc.conversations.create.useMutation({
    onSuccess: (data) => {
      navigate(`/conversations/${data.id}`);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create conversation");
    },
  });

  const handleAddKnowledge = () => {
    if (!title.trim() || !content.trim()) {
      toast.error("Title and content are required");
      return;
    }

    addKnowledgeMutation.mutate({
      characterId,
      title: title.trim(),
      content: content.trim(),
    });
  };

  const handleStartChat = () => {
    createConversationMutation.mutate({
      characterId,
      title: `Chat with ${character?.name}`,
    });
  };

  if (!isAuthenticated) {
    navigate("/");
    return null;
  }

  if (characterLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!character) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Character not found</h2>
          <Link href="/characters">
            <Button>Back to Characters</Button>
          </Link>
        </div>
      </div>
    );
  }

  const characterConversations = conversations?.filter(c => c.characterId === characterId) || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 backdrop-blur-sm bg-card/50 sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/characters">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              {character.avatarUrl ? (
                <img src={character.avatarUrl} alt={character.name} className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-primary" />
                </div>
              )}
              <div>
                <h1 className="text-xl font-bold">{character.name}</h1>
                {character.description && (
                  <p className="text-sm text-muted-foreground">{character.description}</p>
                )}
              </div>
            </div>
          </div>
          <Button onClick={handleStartChat} disabled={createConversationMutation.isPending} className="gap-2">
            {createConversationMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <MessageSquare className="w-4 h-4" />
            )}
            Start Chat
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-6 py-8">
        <Tabs defaultValue="knowledge" className="space-y-6">
          <TabsList>
            <TabsTrigger value="knowledge">Knowledge Base</TabsTrigger>
            <TabsTrigger value="conversations">Conversations</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="knowledge" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Knowledge Base</h2>
              <Dialog open={knowledgeOpen} onOpenChange={setKnowledgeOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add Knowledge
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Add Knowledge</DialogTitle>
                    <DialogDescription>
                      Add information to the character's knowledge base for RAG retrieval
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Title *</Label>
                      <Input
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g., Theory of Relativity"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="content">Content *</Label>
                      <Textarea
                        id="content"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Detailed information..."
                        rows={10}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setKnowledgeOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddKnowledge} disabled={addKnowledgeMutation.isPending}>
                      {addKnowledgeMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Add
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {knowledgeLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : knowledge && knowledge.length > 0 ? (
              <div className="grid gap-4">
                {knowledge.map((item) => (
                  <Card key={item.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="flex items-center gap-2">
                            <BookOpen className="w-5 h-5" />
                            {item.title}
                          </CardTitle>
                          <CardDescription className="mt-2 whitespace-pre-wrap">
                            {item.content}
                          </CardDescription>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm("Delete this knowledge entry?")) {
                              deleteKnowledgeMutation.mutate({ id: item.id, characterId });
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <BookOpen className="w-16 h-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No knowledge yet</h3>
                <p className="text-muted-foreground mb-6">Add knowledge to enable RAG-powered responses</p>
                <Button onClick={() => setKnowledgeOpen(true)} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add Knowledge
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="conversations" className="space-y-4">
            <h2 className="text-2xl font-bold">Conversations</h2>
            {characterConversations.length > 0 ? (
              <div className="grid gap-4">
                {characterConversations.map((conv) => (
                  <Card key={conv.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(`/conversations/${conv.id}`)}>
                    <CardHeader>
                      <CardTitle>{conv.title || `Conversation ${conv.id}`}</CardTitle>
                      <CardDescription>
                        Started {new Date(conv.createdAt).toLocaleDateString()}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <MessageSquare className="w-16 h-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No conversations yet</h3>
                <p className="text-muted-foreground mb-6">Start chatting with {character.name}</p>
                <Button onClick={handleStartChat} className="gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Start Chat
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <h2 className="text-2xl font-bold">Character Settings</h2>
            <Card>
              <CardHeader>
                <CardTitle>System Prompt</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{character.systemPrompt}</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

