import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Bot, Loader2, ArrowLeft, Send, User } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useParams } from "wouter";
import { toast } from "sonner";

export default function Conversation() {
  const { id } = useParams<{ id: string }>();
  const conversationId = parseInt(id || "0");
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const utils = trpc.useUtils();
  const { data: conversation, isLoading: conversationLoading } = trpc.conversations.get.useQuery({ id: conversationId });
  const { data: messages, isLoading: messagesLoading } = trpc.messages.list.useQuery({ conversationId });
  const { data: character } = trpc.characters.get.useQuery(
    { id: conversation?.characterId || 0 },
    { enabled: !!conversation?.characterId }
  );

  const sendMutation = trpc.messages.send.useMutation({
    onSuccess: () => {
      utils.messages.list.invalidate();
      setMessage("");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to send message");
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
      conversationId,
      content: message.trim(),
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isAuthenticated) {
    navigate("/");
    return null;
  }

  if (conversationLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Conversation not found</h2>
          <Link href="/characters">
            <Button>Back to Characters</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border/40 backdrop-blur-sm bg-card/50 sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4 flex items-center gap-4">
          <Link href={`/characters/${conversation.characterId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            {character?.avatarUrl ? (
              <img src={character.avatarUrl} alt={character.name} className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="w-5 h-5 text-primary" />
              </div>
            )}
            <div>
              <h1 className="text-lg font-bold">{character?.name || "Character"}</h1>
              <p className="text-xs text-muted-foreground">{conversation.title}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-6 py-6 max-w-4xl">
          {messagesLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : messages && messages.length > 0 ? (
            <div className="space-y-6">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                  )}
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                  </div>
                  {msg.role === "user" && (
                    <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-accent" />
                    </div>
                  )}
                </div>
              ))}
              {sendMutation.isPending && (
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
              <h3 className="text-xl font-semibold mb-2">Start the conversation</h3>
              <p className="text-muted-foreground">Send a message to {character?.name}</p>
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
  );
}

