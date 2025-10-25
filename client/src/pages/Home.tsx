import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_TITLE, getLoginUrl } from "@/const";
import { MessageSquare, Users, Bot } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-accent/10">
      {/* Header */}
      <header className="border-b border-border/40 backdrop-blur-sm bg-background/80 sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bot className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {APP_TITLE}
            </h1>
          </div>
          <div>
            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">Welcome, {user?.name}</span>
                <Link href="/characters">
                  <Button>Dashboard</Button>
                </Link>
              </div>
            ) : (
              <Button asChild>
                <a href={getLoginUrl()}>Sign In</a>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-5xl md:text-6xl font-bold tracking-tight">
              Create AI Characters with{" "}
              <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                Knowledge
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Build intelligent AI characters with custom knowledge bases. Chat one-on-one or create group discussions for academic seminars and collaborative research.
            </p>
          </div>

          <div className="flex gap-4 justify-center">
            {isAuthenticated ? (
              <>
                <Link href="/characters">
                  <Button size="lg" className="gap-2">
                    <Bot className="w-5 h-5" />
                    My Characters
                  </Button>
                </Link>
                <Link href="/group-chats">
                  <Button size="lg" variant="outline" className="gap-2">
                    <Users className="w-5 h-5" />
                    Group Chats
                  </Button>
                </Link>
              </>
            ) : (
              <Button size="lg" asChild>
                <a href={getLoginUrl()}>Get Started</a>
              </Button>
            )}
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 mt-16">
            <Card className="border-border/50 bg-card/50 backdrop-blur">
              <CardHeader>
                <Bot className="w-10 h-10 text-primary mb-2" />
                <CardTitle>Custom Characters</CardTitle>
                <CardDescription>
                  Create AI characters with unique personalities and system prompts
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border/50 bg-card/50 backdrop-blur">
              <CardHeader>
                <MessageSquare className="w-10 h-10 text-primary mb-2" />
                <CardTitle>RAG Knowledge Base</CardTitle>
                <CardDescription>
                  Equip characters with custom knowledge for context-aware responses
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border/50 bg-card/50 backdrop-blur">
              <CardHeader>
                <Users className="w-10 h-10 text-primary mb-2" />
                <CardTitle>Group Discussions</CardTitle>
                <CardDescription>
                  Create multi-character seminars for academic debates and research
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 py-6">
        <div className="container mx-auto px-6 text-center text-sm text-muted-foreground">
          <p>Powered by AI • Built for Knowledge Sharing</p>
        </div>
      </footer>
    </div>
  );
}

