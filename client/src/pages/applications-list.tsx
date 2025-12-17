import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { type ScholarshipApplication } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
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
  User
} from "lucide-react";
import { format } from "date-fns";

export default function ApplicationsList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedApplication, setSelectedApplication] = useState<ScholarshipApplication | null>(null);

  const { data: applications, isLoading, error } = useQuery<ScholarshipApplication[]>({
    queryKey: ["/api/applications"],
  });

  const filteredApplications = applications?.filter((app) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      app.firstName.toLowerCase().includes(searchLower) ||
      app.surname.toLowerCase().includes(searchLower) ||
      app.studentId.toLowerCase().includes(searchLower) ||
      app.sport.toLowerCase().includes(searchLower) ||
      app.facultySchool.toLowerCase().includes(searchLower)
    );
  });

  const getTotalScholarship = (app: ScholarshipApplication) => {
    const sem1 = app.semester1Amount || 0;
    const sem2 = app.semester2Amount || 0;
    return sem1 + sem2;
  };

  const getScholarshipTypes = (app: ScholarshipApplication) => {
    const types = [];
    if (app.scholarshipTuition) types.push("Tuition");
    if (app.scholarshipAccommodation) types.push("Accommodation");
    if (app.scholarshipBooks) types.push("Books");
    return types;
  };

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
          <Link href="/">
            <Button data-testid="button-new-application">
              <Plus className="mr-2 h-4 w-4" />
              New Application
            </Button>
          </Link>
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
                  <div className="space-y-4">
                    <h4 className="font-semibold flex items-center gap-2">
                      <User className="h-4 w-4 text-primary" />
                      Personal Information
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Gender</span>
                        <span>{selectedApplication.gender === "M" ? "Male" : "Female"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Nationality</span>
                        <span>{selectedApplication.nationality}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Date of Birth</span>
                        <span>{selectedApplication.dateOfBirth ? format(new Date(selectedApplication.dateOfBirth), "MMM d, yyyy") : "N/A"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Age</span>
                        <span>{selectedApplication.age}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Phone className="h-4 w-4 text-primary" />
                      Contact Information
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-start gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <span>{selectedApplication.email}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <span>{selectedApplication.telephone}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <span>{selectedApplication.homeAddress}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-primary" />
                      Academic Information
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Faculty</span>
                        <span className="text-right max-w-[200px]">{selectedApplication.facultySchool}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Course</span>
                        <span>{selectedApplication.courseOfStudy}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">GPA</span>
                        <span>{selectedApplication.gpa}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Programme</span>
                        <span>{selectedApplication.programmeType} ({selectedApplication.programmeMode})</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Year</span>
                        <span>{selectedApplication.yearInSchool} Year</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Started UTECH</span>
                        <span>{selectedApplication.yearStartedUtech}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Expected Graduation</span>
                        <span>{selectedApplication.projectedGraduationYear}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-primary" />
                      Athletic Information
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Sport</span>
                        <span>{selectedApplication.sport}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Event/Position</span>
                        <span>{selectedApplication.eventPosition}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">National Rep</span>
                        <span>{selectedApplication.nationalRepresentative ? "Yes" : "No"}</span>
                      </div>
                      {selectedApplication.nationalRepDetails && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Rep Details</span>
                          <span>{selectedApplication.nationalRepDetails}</span>
                        </div>
                      )}
                      {selectedApplication.affiliation && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Affiliation</span>
                          <span>{selectedApplication.affiliation}</span>
                        </div>
                      )}
                    </div>
                    {selectedApplication.majorAccomplishments && (
                      <div className="mt-3">
                        <span className="text-muted-foreground text-sm">Major Accomplishments:</span>
                        <p className="text-sm mt-1">{selectedApplication.majorAccomplishments}</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4 md:col-span-2">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      Parent/Guardian Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Name</span>
                          <span>{selectedApplication.parentFirstName} {selectedApplication.parentMiddleInitial} {selectedApplication.parentSurname}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Relation</span>
                          <span>{selectedApplication.parentRelation}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <span>{selectedApplication.parentTelephone}</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <span>{selectedApplication.parentAddress}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 md:col-span-2">
                    <h4 className="font-semibold flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-primary" />
                      Scholarship Details
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Semester 1</span>
                        <span className="font-medium">${(selectedApplication.semester1Amount || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Semester 2</span>
                        <span className="font-medium">${(selectedApplication.semester2Amount || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total</span>
                        <span className="font-bold">${getTotalScholarship(selectedApplication).toLocaleString()}</span>
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
