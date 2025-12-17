import { Switch, Route, Link, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import NotFound from "@/pages/not-found";
import ScholarshipForm from "@/pages/scholarship-form";
import ApplicationsList from "@/pages/applications-list";
import { GraduationCap, FileText, ListOrdered } from "lucide-react";

function Navigation() {
  const [location] = useLocation();

  return (
    <nav className="sticky top-0 z-50 bg-background border-b">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <GraduationCap className="h-8 w-8 text-primary" />
            <span className="font-bold text-lg hidden sm:inline" data-testid="text-nav-brand">
              UTECH Scholarships
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/">
              <Button
                variant={location === "/" ? "default" : "ghost"}
                className="gap-2"
                data-testid="nav-new-application"
              >
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">New Application</span>
              </Button>
            </Link>
            <Link href="/applications">
              <Button
                variant={location === "/applications" ? "default" : "ghost"}
                className="gap-2"
                data-testid="nav-view-applications"
              >
                <ListOrdered className="h-4 w-4" />
                <span className="hidden sm:inline">View Applications</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={ScholarshipForm} />
      <Route path="/applications" component={ApplicationsList} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background">
          <Navigation />
          <Router />
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
