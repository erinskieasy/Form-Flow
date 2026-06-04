import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { type FormQuestion } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  Lock, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  Loader2, 
  GripVertical, 
  Save, 
  ArrowLeft,
  Search,
  CheckCircle2
} from "lucide-react";

export default function AdminConfig() {
  const { toast } = useToast();
  const [isVerified, setIsVerified] = useState(() => !!sessionStorage.getItem("admin_password"));
  const [showPassword, setShowPassword] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [questions, setQuestions] = useState<FormQuestion[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Fetch questions
  const { data: fetchedQuestions, isLoading, error, refetch } = useQuery<FormQuestion[]>({
    queryKey: ["/api/form-questions"],
    enabled: isVerified,
  });

  useEffect(() => {
    if (fetchedQuestions) {
      // Sort by sortOrder initially
      const sorted = [...fetchedQuestions].sort((a, b) => a.sortOrder - b.sortOrder);
      setQuestions(sorted);
    }
  }, [fetchedQuestions]);

  useEffect(() => {
    if (error && error.message.includes("401")) {
      sessionStorage.removeItem("admin_password");
      setIsVerified(false);
    }
  }, [error]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (payload: FormQuestion[]) => {
      const res = await apiRequest("POST", "/api/form-questions", payload);
      return res.json() as Promise<FormQuestion[]>;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/form-questions"], data);
      toast({
        title: "Configuration Saved",
        description: "Form questions configuration has been updated successfully.",
      });
    },
    onError: (err: any) => {
      toast({
        title: "Save Failed",
        description: err.message || "Failed to save configuration.",
        variant: "destructive",
      });
    }
  });

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordInput) return;

    setIsVerifying(true);
    setVerifyError(null);
    try {
      await apiRequest("POST", "/api/admin/verify-password", { password: passwordInput });
      sessionStorage.setItem("admin_password", passwordInput);
      setIsVerified(true);
      refetch();
    } catch (err: any) {
      setVerifyError(err.message || "Incorrect password");
    } finally {
      setIsVerifying(false);
    }
  };

  // Drag and drop sorting
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newList = [...questions];
    const draggedItem = newList[draggedIndex];
    newList.splice(draggedIndex, 1);
    newList.splice(index, 0, draggedItem);

    // Update sortOrder based on index
    const updatedList = newList.map((item, idx) => ({
      ...item,
      sortOrder: idx + 1
    }));

    setDraggedIndex(index);
    setQuestions(updatedList);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleWordingChange = (index: number, newWording: string) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], wording: newWording };
    setQuestions(updated);
  };

  const handleActiveToggle = (index: number, isActive: boolean) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], isActive };
    setQuestions(updated);
  };

  const handleSave = () => {
    saveMutation.mutate(questions);
  };

  // Filtered list for search
  const filteredQuestions = questions.filter(q => 
    q.wording.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.fieldKey.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const showLockScreen = !isVerified || (error && error.message.includes("401"));

  if (showLockScreen) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-background flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl -z-10 animate-pulse duration-[6000ms]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10 animate-pulse duration-[8000ms]" />

        <Card className="max-w-md w-full border-primary/20 bg-card/60 backdrop-blur-md shadow-2xl relative animate-in fade-in-50 zoom-in-95 duration-300">
          <CardHeader className="pt-8 pb-4 text-center">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 border border-primary/20 animate-bounce duration-[3000ms]">
              <Lock className="h-7 w-7 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/85 bg-clip-text text-transparent">
              Admin Configuration Lock
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-2 max-w-[280px] mx-auto">
              Please enter the administrator password to access form configuration.
            </p>
          </CardHeader>
          <CardContent className="pb-8">
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="pr-10 border-primary/20 focus-visible:ring-primary focus-visible:ring-offset-0 bg-background/50"
                    autoFocus
                    disabled={isVerifying}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {verifyError && (
                <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md border border-destructive/20 animate-shake">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span className="font-medium">
                    {verifyError.includes("401") ? "Incorrect password. Please try again." : verifyError}
                  </span>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Link href="/applications" className="flex-1">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    disabled={isVerifying}
                  >
                    Cancel
                  </Button>
                </Link>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={isVerifying || !passwordInput}
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Unlock Config"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-primary font-medium text-sm">
              <CheckCircle2 className="h-4 w-4" />
              <span>Admin Console</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight mt-1">Form Questions Configuration</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Drag questions to change their display order, update their wording, or activate/deactivate them.
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/applications">
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to View
              </Button>
            </Link>
            <Button 
              className="gap-2 shadow-lg" 
              onClick={handleSave}
              disabled={saveMutation.isPending || isLoading}
            >
              {saveMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save Configuration
            </Button>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search questions by field key or wording..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-background/50 border-muted focus-visible:ring-primary focus-visible:ring-offset-0"
          />
        </div>

        {/* Questions list container */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Card key={i} className="border border-muted">
                <CardContent className="h-20 flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-6 h-6 bg-muted animate-pulse rounded" />
                    <div className="w-1/3 h-5 bg-muted animate-pulse rounded" />
                  </div>
                  <div className="w-12 h-6 bg-muted animate-pulse rounded-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredQuestions.length === 0 ? (
              <Card className="border border-dashed border-muted p-12 text-center">
                <CardContent className="space-y-2">
                  <Search className="h-10 w-10 text-muted-foreground mx-auto" />
                  <p className="font-semibold text-muted-foreground">No questions found</p>
                  <p className="text-xs text-muted-foreground">Try clearing search terms to view all questions.</p>
                </CardContent>
              </Card>
            ) : (
              filteredQuestions.map((q, idx) => {
                const originalIndex = questions.findIndex(original => original.fieldKey === q.fieldKey);
                return (
                  <div 
                    key={q.fieldKey}
                    draggable={!searchTerm} // Only allow dragging if not filtering/searching
                    onDragStart={(e) => handleDragStart(e, originalIndex)}
                    onDragOver={(e) => handleDragOver(e, originalIndex)}
                    onDragEnd={handleDragEnd}
                    className={`flex items-center gap-3 p-4 rounded-xl border bg-card/75 backdrop-blur-sm transition-all duration-200 ${
                      draggedIndex === originalIndex 
                        ? "opacity-40 border-primary shadow-inner scale-[0.98]" 
                        : "border-muted/60 hover:border-primary/40 hover:shadow-md hover:scale-[1.005]"
                    }`}
                  >
                    {/* Drag Handle */}
                    {!searchTerm ? (
                      <div className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground/60 hover:text-foreground transition-colors">
                        <GripVertical className="h-5 w-5" />
                      </div>
                    ) : (
                      <div className="p-1 text-muted-foreground/20">
                        <GripVertical className="h-5 w-5" />
                      </div>
                    )}

                    {/* Form Field Info & Editor */}
                    <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                      <div className="md:col-span-3">
                        <div className="text-xs font-mono font-semibold text-primary/80 truncate">
                          {q.fieldKey}
                        </div>
                        <div className="text-[10px] text-muted-foreground uppercase font-semibold mt-0.5">
                          Order: {q.sortOrder}
                        </div>
                      </div>
                      
                      <div className="md:col-span-9">
                        <Input 
                          value={q.wording}
                          onChange={(e) => handleWordingChange(originalIndex, e.target.value)}
                          className="bg-background/40 focus-visible:ring-primary/50 focus-visible:ring-offset-0 border-muted-foreground/20 text-sm h-9"
                          placeholder="Enter display label wording"
                        />
                      </div>
                    </div>

                    {/* Active State Toggle */}
                    <div className="flex items-center gap-2 pl-2 border-l border-muted">
                      <Switch 
                        checked={q.isActive}
                        onCheckedChange={(checked) => handleActiveToggle(originalIndex, checked)}
                        aria-label={`Toggle active state for ${q.fieldKey}`}
                      />
                      <span className={`text-xs font-semibold w-12 text-center ${q.isActive ? "text-green-500" : "text-muted-foreground"}`}>
                        {q.isActive ? "Active" : "Disabled"}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
