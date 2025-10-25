import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Characters from "./pages/Characters";
import CharacterDetail from "./pages/CharacterDetail";
import Conversation from "./pages/Conversation";
import GroupChats from "./pages/GroupChats";
import GroupChatDetail from "./pages/GroupChatDetail";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/characters"} component={Characters} />
      <Route path={"/characters/:id"} component={CharacterDetail} />
      <Route path={"/conversations/:id"} component={Conversation} />
      <Route path={"/group-chats"} component={GroupChats} />
      <Route path={"/group-chats/:id"} component={GroupChatDetail} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

