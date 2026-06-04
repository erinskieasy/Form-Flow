import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { type ScholarshipApplicationWithRelations } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  GraduationCap, 
  Search, 
  Plus, 
  Eye, 
  Users, 
  Trophy,
  FileText,
  Calendar,
  Mail,
  Phone,
  MapPin,
  BookOpen,
  DollarSign,
  User,
  Lock,
  EyeOff,
  AlertCircle,
  Loader2,
  Pencil,
  Check,
  X,
  Settings,
  Download,
  LogOut
} from "lucide-react";
import { format } from "date-fns";

function EditableField({ 
  label, 
  value, 
  onSave, 
  type = "text",
  options
}: { 
  label: string; 
  value: any; 
  onSave: (val: any) => void; 
  type?: "text" | "textarea" | "select" | "checkbox" | "number";
  options?: { label: string; value: any }[];
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  const handleSave = () => {
    onSave(type === "number" ? Number(editValue) : editValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="flex flex-col gap-1 w-full bg-accent/20 p-2 rounded-lg border border-accent/40 animate-in fade-in duration-200">
        <span className="text-[10px] uppercase font-bold text-muted-foreground">{label}</span>
        <div className="flex items-center gap-1.5 w-full">
          {type === "textarea" ? (
            <textarea
              className="flex min-h-[60px] w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={editValue ?? ""}
              onChange={(e) => setEditValue(e.target.value)}
              autoFocus
            />
          ) : type === "select" ? (
            <select
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={editValue ?? ""}
              onChange={(e) => setEditValue(e.target.value)}
              autoFocus
            >
              {options?.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ) : type === "checkbox" ? (
            <div className="flex items-center gap-2 py-1">
              <input
                type="checkbox"
                checked={!!editValue}
                onChange={(e) => setEditValue(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                autoFocus
              />
              <span className="text-sm font-medium">{!!editValue ? "Yes" : "No"}</span>
            </div>
          ) : (
            <Input
              type={type}
              value={editValue ?? ""}
              onChange={(e) => setEditValue(e.target.value)}
              className="h-8 py-1 bg-background/50 focus-visible:ring-primary"
              autoFocus
            />
          )}
          <div className="flex gap-1">
            <Button size="icon" variant="ghost" className="h-8 w-8 text-green-500 hover:text-green-600 hover:bg-green-50" onClick={handleSave}>
              <Check className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-red-50" onClick={handleCancel}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const displayValue = () => {
    if (type === "checkbox") return value ? "Yes" : "No";
    if (type === "select" && options) {
      const match = options.find(o => String(o.value) === String(value));
      return match ? match.label : String(value ?? "");
    }
    return String(value ?? "N/A");
  };

  return (
    <div className="group flex items-center justify-between w-full py-1 hover:bg-muted/30 px-2 rounded-md transition-colors gap-2 min-h-[32px]">
      <div className="flex flex-col min-w-0 flex-1">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-sm font-medium text-foreground break-words">{displayValue()}</span>
      </div>
      <Button 
        size="icon" 
        variant="ghost" 
        className="h-6 w-6 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity text-muted-foreground hover:text-primary"
        onClick={() => setIsEditing(true)}
      >
        <Pencil className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

export default function ApplicationsList() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedApplication, setSelectedApplication] = useState<ScholarshipApplicationWithRelations | null>(null);
  
  const [isVerified, setIsVerified] = useState(() => !!sessionStorage.getItem("admin_password"));
  const [showPassword, setShowPassword] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const patchMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const res = await apiRequest("PATCH", `/api/applications/${id}`, updates);
      return res.json() as Promise<ScholarshipApplicationWithRelations>;
    },
    onSuccess: (data) => {
      setSelectedApplication(data);
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      toast({
        title: "Field Updated",
        description: "Application details have been successfully updated.",
      });
    },
    onError: (err: any) => {
      toast({
        title: "Update Failed",
        description: err.message || "Failed to update application field.",
        variant: "destructive",
      });
    }
  });

  const handleSaveField = (fieldKey: string, newValue: any) => {
    if (!selectedApplication) return;
    patchMutation.mutate({
      id: selectedApplication.id,
      updates: { [fieldKey]: newValue }
    });
  };

  const handleSaveGuardian = (guardianId: number, fieldKey: string, newValue: any) => {
    if (!selectedApplication) return;
    const updatedGuardians = selectedApplication.guardians.map(g => 
      g.id === guardianId ? { ...g, [fieldKey]: newValue } : g
    );
    patchMutation.mutate({
      id: selectedApplication.id,
      updates: { guardians: updatedGuardians }
    });
  };

  const handleSaveAffiliation = (affiliationId: number, name: string) => {
    if (!selectedApplication) return;
    const updatedAffiliations = selectedApplication.affiliations.map(a => 
      a.id === affiliationId ? { ...a, name } : a
    );
    patchMutation.mutate({
      id: selectedApplication.id,
      updates: { affiliations: updatedAffiliations }
    });
  };

  const { data: applications, isLoading, error, refetch } = useQuery<ScholarshipApplicationWithRelations[]>({
    queryKey: ["/api/applications"],
    enabled: isVerified,
  });

  useEffect(() => {
    if (error && error.message.includes("401")) {
      sessionStorage.removeItem("admin_password");
      setIsVerified(false);
    }
  }, [error]);

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

  const handleLogout = () => {
    sessionStorage.removeItem("admin_password");
    setIsVerified(false);
    setPasswordInput("");
    toast({
      title: "Logged Out",
      description: "You have been logged out of the admin panel.",
    });
  };

  const showLockScreen = !isVerified || (error && error.message.includes("401"));

  const filteredApplications = applications?.filter((app) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (app.firstName ?? "").toLowerCase().includes(searchLower) ||
      (app.surname ?? "").toLowerCase().includes(searchLower) ||
      (app.studentId ?? "").toLowerCase().includes(searchLower) ||
      (app.sport ?? "").toLowerCase().includes(searchLower) ||
      (app.facultySchool ?? "").toLowerCase().includes(searchLower)
    );
  });

  const getTotalScholarship = (app: ScholarshipApplicationWithRelations) => {
    const sem1 = app.semester1Amount || 0;
    const sem2 = app.semester2Amount || 0;
    return sem1 + sem2;
  };

  const getScholarshipTypes = (app: ScholarshipApplicationWithRelations) => {
    const types = [];
    if (app.scholarshipTuition) types.push("Tuition");
    if (app.scholarshipAccommodation) types.push("Accommodation");
    if (app.scholarshipBooks) types.push("Books");
    return types;
  };

  if (showLockScreen) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-background flex items-center justify-center p-4 relative overflow-hidden">
        {/* Decorative background gradients */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl -z-10 animate-pulse duration-[6000ms]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10 animate-pulse duration-[8000ms]" />

        <Card className="max-w-md w-full border-primary/20 bg-card/60 backdrop-blur-md shadow-2xl relative animate-in fade-in-50 zoom-in-95 duration-300">
          <CardHeader className="pt-8 pb-4 text-center">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 border border-primary/20 animate-bounce duration-[3000ms]">
              <Lock className="h-7 w-7 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/85 bg-clip-text text-transparent">
              Admin Access Required
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-2 max-w-[280px] mx-auto">
              Please enter the administrator password to view the scholarship applications list.
            </p>
          </CardHeader>
          <CardContent className="pb-8">
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="password">
                  Password
                </label>
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
                    data-testid="input-admin-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                    data-testid="button-toggle-password"
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
                <Link href="/" className="flex-1">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    disabled={isVerifying}
                    data-testid="button-cancel-auth"
                  >
                    Cancel
                  </Button>
                </Link>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={isVerifying || !passwordInput}
                  data-testid="button-submit-auth"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Access Applications"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <div className="text-destructive mb-4">
              <FileText className="h-12 w-12 mx-auto opacity-50" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Failed to Load Applications</h3>
            <p className="text-muted-foreground">There was an error loading the applications. Please try again.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <GraduationCap className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold text-foreground" data-testid="text-page-title">
                Scholarship Applications
              </h1>
            </div>
            <p className="text-muted-foreground">
              View and manage all student athlete scholarship applications
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/config">
              <Button variant="outline" className="gap-2" data-testid="button-admin-config">
                <Settings className="h-4 w-4" />
                Form Config
              </Button>
            </Link>
            <Link href="/">
              <Button data-testid="button-new-application">
                <Plus className="mr-2 h-4 w-4" />
                New Application
              </Button>
            </Link>
            <Button 
              variant="ghost" 
              className="gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive" 
              onClick={handleLogout} 
              data-testid="button-logout"
            >
              <LogOut className="h-4 w-4" />
              Log Out
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5" />
                All Applications
                {applications && (
                  <Badge variant="secondary" className="ml-2">
                    {applications.length}
                  </Badge>
                )}
              </CardTitle>
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, ID, sport, or faculty..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                    <Skeleton className="h-8 w-20" />
                  </div>
                ))}
              </div>
            ) : filteredApplications && filteredApplications.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Student ID</TableHead>
                      <TableHead>Sport</TableHead>
                      <TableHead>Faculty</TableHead>
                      <TableHead>Total Amount</TableHead>
                      <TableHead>Date Submitted</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredApplications.map((app) => (
                      <TableRow key={app.id} data-testid={`row-application-${app.id}`}>
                        <TableCell className="font-medium">
                          {app.firstName} {app.surname}
                        </TableCell>
                        <TableCell>{app.studentId}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{app.sport}</Badge>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {app.facultySchool}
                        </TableCell>
                        <TableCell className="font-medium">
                          ${getTotalScholarship(app).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {app.submissionDate ? format(new Date(app.submissionDate), "MMM d, yyyy") : "N/A"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedApplication(app)}
                            data-testid={`button-view-${app.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2" data-testid="text-empty-state">
                  {searchTerm ? "No matching applications" : "No applications submitted yet"}
                </h3>
                <p className="text-muted-foreground mb-6">
                  {searchTerm 
                    ? "Try adjusting your search terms"
                    : "Submit your first scholarship application to get started"
                  }
                </p>
                {!searchTerm && (
                  <Link href="/">
                    <Button data-testid="button-submit-first">
                      <Plus className="mr-2 h-4 w-4" />
                      Submit First Application
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!selectedApplication} onOpenChange={() => setSelectedApplication(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Application Details
            </DialogTitle>
          </DialogHeader>
          {selectedApplication && (
            <ScrollArea className="max-h-[70vh] pr-4">
              <div className="space-y-6">
                {/* Summary Card */}
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold" data-testid="text-detail-name">
                        {selectedApplication.firstName} {selectedApplication.middleName} {selectedApplication.surname}
                      </h3>
                      <p className="text-muted-foreground">Student ID: {selectedApplication.studentId}</p>
                    </div>
                    <Badge variant="secondary" className="text-lg px-4 py-1">
                      ${getTotalScholarship(selectedApplication).toLocaleString()}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {getScholarshipTypes(selectedApplication).map((type) => (
                      <Badge key={type} variant="outline">{type}</Badge>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Personal Information */}
                  <div className="space-y-4">
                    <h4 className="font-semibold flex items-center gap-2 border-b pb-1">
                      <User className="h-4 w-4 text-primary" />
                      Personal Information
                    </h4>
                    <div className="space-y-2">
                      <EditableField 
                        label="First Name" 
                        value={selectedApplication.firstName} 
                        onSave={(val) => handleSaveField("firstName", val)} 
                      />
                      <EditableField 
                        label="Middle Name" 
                        value={selectedApplication.middleName} 
                        onSave={(val) => handleSaveField("middleName", val)} 
                      />
                      <EditableField 
                        label="Surname" 
                        value={selectedApplication.surname} 
                        onSave={(val) => handleSaveField("surname", val)} 
                      />
                      <EditableField 
                        label="Student ID" 
                        value={selectedApplication.studentId} 
                        onSave={(val) => handleSaveField("studentId", val)} 
                      />
                      <EditableField 
                        label="Gender" 
                        value={selectedApplication.gender} 
                        onSave={(val) => handleSaveField("gender", val)} 
                        type="select"
                        options={[{ label: "Male", value: "M" }, { label: "Female", value: "F" }]}
                      />
                      <EditableField 
                        label="Nationality" 
                        value={selectedApplication.nationality} 
                        onSave={(val) => handleSaveField("nationality", val)} 
                      />
                      <EditableField 
                        label="Date of Birth" 
                        value={selectedApplication.dateOfBirth} 
                        onSave={(val) => handleSaveField("dateOfBirth", val)} 
                      />
                      <EditableField 
                        label="Age" 
                        value={selectedApplication.age} 
                        onSave={(val) => handleSaveField("age", val)} 
                        type="number"
                      />
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="space-y-4">
                    <h4 className="font-semibold flex items-center gap-2 border-b pb-1">
                      <Phone className="h-4 w-4 text-primary" />
                      Contact Information
                    </h4>
                    <div className="space-y-2">
                      <EditableField 
                        label="Email Address" 
                        value={selectedApplication.email} 
                        onSave={(val) => handleSaveField("email", val)} 
                      />
                      <EditableField 
                        label="Telephone Number" 
                        value={selectedApplication.telephone} 
                        onSave={(val) => handleSaveField("telephone", val)} 
                      />
                      <EditableField 
                        label="Home Address" 
                        value={selectedApplication.homeAddress} 
                        onSave={(val) => handleSaveField("homeAddress", val)} 
                        type="textarea"
                      />
                    </div>
                  </div>

                  {/* Academic Information */}
                  <div className="space-y-4">
                    <h4 className="font-semibold flex items-center gap-2 border-b pb-1">
                      <BookOpen className="h-4 w-4 text-primary" />
                      Academic Information
                    </h4>
                    <div className="space-y-2">
                      <EditableField 
                        label="Faculty/School" 
                        value={selectedApplication.facultySchool} 
                        onSave={(val) => handleSaveField("facultySchool", val)} 
                      />
                      <EditableField 
                        label="Course of Study" 
                        value={selectedApplication.courseOfStudy} 
                        onSave={(val) => handleSaveField("courseOfStudy", val)} 
                      />
                      <EditableField 
                        label="GPA" 
                        value={selectedApplication.gpa} 
                        onSave={(val) => handleSaveField("gpa", val)} 
                      />
                      <EditableField 
                        label="Programme Type" 
                        value={selectedApplication.programmeType} 
                        onSave={(val) => handleSaveField("programmeType", val)} 
                      />
                      <EditableField 
                        label="Programme Mode" 
                        value={selectedApplication.programmeMode} 
                        onSave={(val) => handleSaveField("programmeMode", val)} 
                      />
                      <EditableField 
                        label="Year in School" 
                        value={selectedApplication.yearInSchool} 
                        onSave={(val) => handleSaveField("yearInSchool", val)} 
                        type="number"
                      />
                      <EditableField 
                        label="Year Started UTECH" 
                        value={selectedApplication.yearStartedUtech} 
                        onSave={(val) => handleSaveField("yearStartedUtech", val)} 
                        type="number"
                      />
                      <EditableField 
                        label="Expected Graduation" 
                        value={selectedApplication.projectedGraduationYear} 
                        onSave={(val) => handleSaveField("projectedGraduationYear", val)} 
                        type="number"
                      />
                      <EditableField 
                        label="Did Transfer?" 
                        value={selectedApplication.didTransfer} 
                        onSave={(val) => handleSaveField("didTransfer", val)} 
                        type="checkbox"
                      />
                      {selectedApplication.didTransfer && (
                        <EditableField 
                          label="Name of Previous Programme" 
                          value={selectedApplication.transferProgrammeName} 
                          onSave={(val) => handleSaveField("transferProgrammeName", val)} 
                        />
                      )}
                    </div>
                  </div>

                  {/* Athletic Information */}
                  <div className="space-y-4">
                    <h4 className="font-semibold flex items-center gap-2 border-b pb-1">
                      <Trophy className="h-4 w-4 text-primary" />
                      Athletic Information
                    </h4>
                    <div className="space-y-2">
                      <EditableField 
                        label="Sport" 
                        value={selectedApplication.sport} 
                        onSave={(val) => handleSaveField("sport", val)} 
                      />
                      <EditableField 
                        label="Event/Position" 
                        value={selectedApplication.eventPosition} 
                        onSave={(val) => handleSaveField("eventPosition", val)} 
                      />
                      <EditableField 
                        label="National Representative?" 
                        value={selectedApplication.nationalRepresentative} 
                        onSave={(val) => handleSaveField("nationalRepresentative", val)} 
                        type="checkbox"
                      />
                      {selectedApplication.nationalRepresentative && (
                        <EditableField 
                          label="Year and Category (National Representative)" 
                          value={selectedApplication.nationalRepDetails} 
                          onSave={(val) => handleSaveField("nationalRepDetails", val)} 
                          type="textarea"
                        />
                      )}
                      
                      <EditableField 
                        label="Major Accomplishments (Academic & Sport)" 
                        value={selectedApplication.majorAccomplishments} 
                        onSave={(val) => handleSaveField("majorAccomplishments", val)} 
                        type="textarea"
                      />

                      {selectedApplication.affiliations && selectedApplication.affiliations.length > 0 && (
                        <div className="pt-2 border-t mt-2">
                          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Affiliations</span>
                          <div className="space-y-2">
                            {selectedApplication.affiliations.map((aff) => (
                              <EditableField 
                                key={aff.id}
                                label="Affiliation Name"
                                value={aff.name}
                                onSave={(val) => handleSaveAffiliation(aff.id, val)}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Parent / Guardian Information */}
                  <div className="space-y-4 md:col-span-2">
                    <h4 className="font-semibold flex items-center gap-2 border-b pb-1">
                      <Users className="h-4 w-4 text-primary" />
                      Parent/Guardian Information
                      {selectedApplication.guardians && selectedApplication.guardians.length > 1 && (
                        <Badge variant="secondary" className="ml-2">{selectedApplication.guardians.length}</Badge>
                      )}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedApplication.guardians && selectedApplication.guardians.map((guardian, index) => (
                        <div key={guardian.id} className="border rounded-lg p-4 space-y-2 bg-card/30">
                          <div className="flex justify-between items-center border-b pb-1">
                            <span className="text-xs text-primary font-bold">Contact Person {index + 1}</span>
                          </div>
                          <div className="space-y-2">
                            <EditableField 
                              label="First Name" 
                              value={guardian.firstName} 
                              onSave={(val) => handleSaveGuardian(guardian.id, "firstName", val)} 
                            />
                            <EditableField 
                              label="Middle Initial" 
                              value={guardian.middleInitial} 
                              onSave={(val) => handleSaveGuardian(guardian.id, "middleInitial", val)} 
                            />
                            <EditableField 
                              label="Surname" 
                              value={guardian.surname} 
                              onSave={(val) => handleSaveGuardian(guardian.id, "surname", val)} 
                            />
                            <EditableField 
                              label="Relation" 
                              value={guardian.relation} 
                              onSave={(val) => handleSaveGuardian(guardian.id, "relation", val)} 
                            />
                            <EditableField 
                              label="Telephone" 
                              value={guardian.telephone} 
                              onSave={(val) => handleSaveGuardian(guardian.id, "telephone", val)} 
                            />
                            <EditableField 
                              label="Address" 
                              value={guardian.address} 
                              onSave={(val) => handleSaveGuardian(guardian.id, "address", val)} 
                              type="textarea"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Scholarship Details */}
                  <div className="space-y-4 md:col-span-2">
                    <h4 className="font-semibold flex items-center gap-2 border-b pb-1">
                      <DollarSign className="h-4 w-4 text-primary" />
                      Scholarship Details
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <EditableField 
                        label="Semester 1 Amount" 
                        value={selectedApplication.semester1Amount} 
                        onSave={(val) => handleSaveField("semester1Amount", val)} 
                        type="number"
                      />
                      <EditableField 
                        label="Semester 2 Amount" 
                        value={selectedApplication.semester2Amount} 
                        onSave={(val) => handleSaveField("semester2Amount", val)} 
                        type="number"
                      />
                      <div className="flex flex-col justify-center px-3 py-1 bg-muted/40 rounded-md">
                        <span className="text-xs text-muted-foreground">Total Scholarship</span>
                        <span className="text-sm font-bold text-primary">${getTotalScholarship(selectedApplication).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Attached Documents */}
                  <div className="space-y-4 md:col-span-2">
                    <h4 className="font-semibold flex items-center gap-2 border-b pb-1">
                      <FileText className="h-4 w-4 text-primary" />
                      Attached Documents
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Photo ID */}
                      <div className="border rounded-lg p-4 space-y-3 bg-card/40">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Photo ID</span>
                        {selectedApplication.photoIdPath ? (
                          <div className="space-y-3">
                            <div className="h-40 rounded-lg border bg-muted flex items-center justify-center overflow-hidden relative group">
                              <img 
                                src={selectedApplication.photoIdPath} 
                                alt="Photo ID" 
                                className="max-h-full max-w-full object-contain transition-transform duration-200 group-hover:scale-105"
                              />
                            </div>
                            <div className="flex gap-2">
                              <a 
                                href={selectedApplication.photoIdPath} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="flex-1"
                              >
                                <Button size="sm" variant="outline" className="w-full gap-2">
                                  <Eye className="h-3.5 w-3.5" />
                                  View Original
                                </Button>
                              </a>
                              <a 
                                href={selectedApplication.photoIdPath} 
                                download 
                                className="flex-1"
                              >
                                <Button size="sm" variant="outline" className="w-full gap-2">
                                  <Download className="h-3.5 w-3.5" />
                                  Download
                                </Button>
                              </a>
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground py-6 text-center">No Photo ID uploaded</div>
                        )}
                      </div>

                      {/* Progress Report */}
                      <div className="border rounded-lg p-4 space-y-3 bg-card/40 flex flex-col justify-between">
                        <div>
                          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Progress Report</span>
                          {selectedApplication.progressReportPath ? (
                            <div className="mt-3 flex items-center gap-3 bg-muted/40 p-3 rounded-lg border">
                              <FileText className="h-8 w-8 text-primary" />
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-semibold truncate">Progress Report Document</p>
                                <p className="text-[10px] text-muted-foreground">Document format</p>
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm text-muted-foreground py-6 text-center">No Progress Report uploaded</div>
                          )}
                        </div>
                        {selectedApplication.progressReportPath && (
                          <div className="flex gap-2 mt-4">
                            <a 
                              href={selectedApplication.progressReportPath} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="flex-1"
                            >
                              <Button size="sm" variant="outline" className="w-full gap-2">
                                <Eye className="h-3.5 w-3.5" />
                                View Document
                              </Button>
                            </a>
                            <a 
                              href={selectedApplication.progressReportPath} 
                              download 
                              className="flex-1"
                            >
                              <Button size="sm" variant="outline" className="w-full gap-2">
                                <Download className="h-3.5 w-3.5" />
                                Download
                              </Button>
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-2 pt-4 border-t">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      Submitted on {selectedApplication.submissionDate ? format(new Date(selectedApplication.submissionDate), "MMMM d, yyyy") : "N/A"}
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
