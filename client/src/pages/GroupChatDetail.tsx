import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Bot, Loader2, ArrowLeft, Send, User, Sparkles } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useParams } from "wouter";
import { toast } from "sonner";

export default function GroupChatDetail() {
  const { id } = useParams<{ id: string }>();
  const groupChatId = parseInt(id || "0");
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const utils = trpc.useUtils();
  const { data: groupChat, isLoading: groupChatLoading } = trpc.groupChats.get.useQuery({ id: groupChatId });
  const { data: messages, isLoading: messagesLoading } = trpc.groupMessages.list.useQuery({ groupChatId });

  const sendMutation = trpc.groupMessages.send.useMutation({
    onSuccess: () => {
      utils.groupMessages.list.invalidate();
      setMessage("");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to send message");
    },
  });

  const generateResponseMutation = trpc.groupMessages.generateResponse.useMutation({
    onSuccess: () => {
      utils.groupMessages.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to generate response");
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!message.trim() || sendMutation.isPending) return;

    sendMutation.mutate({
      groupChatId,
      content: message.trim(),
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleGenerateResponse = (characterId: number) => {
    generateResponseMutation.mutate({
      groupChatId,
      characterId,
    });
  };

  if (!isAuthenticated) {
    navigate("/");
    return null;
  }

  if (groupChatLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!groupChat) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Group chat not found</h2>
          <Link href="/group-chats">
            <Button>Back to Group Chats</Button>
          </Link>
        </div>
      </div>
    );
  }

  const getCharacterById = (id: number) => {
    return groupChat.characters?.find((c) => c.id === id);
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border/40 bg-card/50 flex flex-col">
        <div className="p-4 border-b border-border/40">
          <Link href="/group-chats">
            <Button variant="ghost" size="icon" className="mb-3">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h2 className="text-lg font-bold">{groupChat.name}</h2>
          {groupChat.description && (
            <p className="text-sm text-muted-foreground mt-1">{groupChat.description}</p>
          )}
        </div>

        {groupChat.topic && (
          <div className="p-4 border-b border-border/40">
            <h3 className="text-sm font-semibold mb-2">Discussion Topic</h3>
            <p className="text-sm text-muted-foreground">{groupChat.topic}</p>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4">
          <h3 className="text-sm font-semibold mb-3">Participants</h3>
          <div className="space-y-2">
            {groupChat.characters?.map((character) => (
              <Card key={character.id} className="p-3">
                <div className="flex items-center gap-2 mb-2">
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
                  <span className="text-sm font-medium">{character.name}</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => handleGenerateResponse(character.id)}
                  disabled={generateResponseMutation.isPending}
                >
                  <Sparkles className="w-3 h-3" />
                  Generate Response
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Messages */}
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-6 py-6 max-w-4xl">
            {messagesLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : messages && messages.length > 0 ? (
              <div className="space-y-6">
                {messages.map((msg) => {
                  const character = msg.characterId ? getCharacterById(msg.characterId) : null;
                  const isUser = !msg.characterId;

                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
                    >
                      {!isUser && character && (
                        <div className="flex flex-col items-center gap-1 flex-shrink-0">
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
                          <span className="text-xs text-muted-foreground">{character.name}</span>
                        </div>
                      )}
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                          isUser
                            ? "bg-accent text-accent-foreground"
                            : "bg-muted text-foreground"
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                      </div>
                      {isUser && (
                        <div className="flex flex-col items-center gap-1 flex-shrink-0">
                          <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                            <User className="w-4 h-4 text-accent" />
                          </div>
                          <span className="text-xs text-muted-foreground">You</span>
                        </div>
                      )}
                    </div>
                  );
                })}
                {(sendMutation.isPending || generateResponseMutation.isPending) && (
                  <div className="flex gap-3 justify-start">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                    <div className="bg-muted rounded-2xl px-4 py-3">
                      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Bot className="w-16 h-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">Start the discussion</h3>
                <p className="text-muted-foreground">
                  Send a message or generate responses from characters
                </p>
              </div>
            )}
          </div>
        </main>

        {/* Input */}
        <footer className="border-t border-border/40 bg-card/50 backdrop-blur-sm">
          <div className="container mx-auto px-6 py-4 max-w-4xl">
            <div className="flex gap-3">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                disabled={sendMutation.isPending}
                className="flex-1"
              />
              <Button
                onClick={handleSend}
                disabled={!message.trim() || sendMutation.isPending}
                size="icon"
              >
                {sendMutation.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

