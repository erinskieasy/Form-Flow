import { useForm, useFieldArray } from "react-hook-form";
import { useState, useEffect, useCallback } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { insertScholarshipApplicationSchema, type InsertScholarshipApplication } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { User, Phone, BookOpen, Trophy, Users, DollarSign, Loader2, Plus, Trash2 } from "lucide-react";
import utechGateImage from "@assets/utech-gate_1766011067612.jpg";

export default function ScholarshipForm() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [sessionUser, setSessionUser] = useState<{ id: string; email?: string; name?: string } | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  const form = useForm<InsertScholarshipApplication>({
    resolver: zodResolver(insertScholarshipApplicationSchema),
    defaultValues: {
      surname: "",
      firstName: "",
      middleName: "",
      gender: "M",
      nationality: "",
      dateOfBirth: "",
      age: 18,
      studentId: "",
      projectedGraduationYear: "",
      telephone: "",
      email: "",
      homeAddress: "",
      facultySchool: "",
      courseOfStudy: "",
      yearStartedUtech: "",
      gpa: "",
      programmeType: "Undergraduate",
      programmeMode: "Full-time",
      yearInSchool: "1st",
      didTransfer: false,
      transferProgrammeName: "",
      sport: "",
      eventPosition: "",
      majorAccomplishments: "",
      nationalRepresentative: false,
      nationalRepDetails: "",
      scholarshipTuition: false,
      scholarshipAccommodation: false,
      scholarshipBooks: false,
      semester1Amount: undefined,
      semester2Amount: undefined,
      guardians: [{ surname: "", firstName: "", middleInitial: "", relation: "", telephone: "", address: "" }],
      affiliations: [],
    },
  });

  const { fields: guardianFields, append: appendGuardian, remove: removeGuardian } = useFieldArray({
    control: form.control,
    name: "guardians",
  });

  const { fields: affiliationFields, append: appendAffiliation, remove: removeAffiliation } = useFieldArray({
    control: form.control,
    name: "affiliations",
  });

  const submitMutation = useMutation({
    mutationFn: async (data: InsertScholarshipApplication) => {
      const res = await apiRequest("POST", "/api/applications", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      toast({
        title: "Application Submitted",
        description: "Your scholarship application has been submitted successfully.",
      });
      setLocation("/applications");
    },
    onError: (error: Error) => {
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit application. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertScholarshipApplication) => {
    submitMutation.mutate(data);
  };

  const didTransfer = form.watch("didTransfer");
  const isNationalRep = form.watch("nationalRepresentative");

  useEffect(() => {
    let mounted = true;
    setCheckingSession(true);
    apiRequest("GET", "/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (!mounted) return;
        setSessionUser(data?.user ? data : null);
      })
      .catch(() => {
        if (!mounted) return;
        setSessionUser(null);
      })
      .finally(() => mounted && setCheckingSession(false));

    return () => {
      mounted = false;
    };
  }, []);

  const handleSignOut = useCallback(async () => {
    try {
      await apiRequest("POST", "/auth/signout");
      setSessionUser(null);
      toast({ title: "Signed out", description: "You have been signed out." });
    } catch (err: any) {
      toast({ title: "Sign out failed", description: err?.message || "Failed to sign out", variant: "destructive" });
    }
  }, [toast]);

  return (
    <div className="min-h-screen bg-background">
      <div className="relative w-full h-64 md:h-80 overflow-hidden">
        <img 
          src={utechGateImage} 
          alt="University of Technology Jamaica Campus" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <h1 className="text-2xl md:text-4xl font-light tracking-wide text-white mb-2" data-testid="text-page-title">
            UNIVERSITY OF TECHNOLOGY, JAMAICA
          </h1>
          <div className="w-16 h-px bg-white/60 my-3" />
          <p className="text-sm md:text-base text-white/90 font-light tracking-wider">
            Department of Sport
          </p>
          <p className="text-xs md:text-sm text-white/70 italic mt-1">
            "Home of World Class Athletes"
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h2 className="text-xl md:text-2xl font-medium text-foreground">
            Student Athlete Scholarship Application
          </h2>
          <p className="text-sm text-muted-foreground mt-3 max-w-2xl mx-auto leading-relaxed">
            This form collects detailed information on student athlete scholarship recipients. 
            All information provided will be kept in confidence and used for letters of recommendation, 
            contact purposes, and historical records.
          </p>
        </div>

        <div className="flex justify-end mb-6">
          {checkingSession ? (
            <span className="text-sm text-muted-foreground">Checking sign-in status...</span>
          ) : sessionUser ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-foreground">Signed in as <strong>{sessionUser.email || sessionUser.name}</strong></span>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>Sign out</Button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Not signed in</span>
              <Button size="sm" onClick={() => setLocation("/sign-in")}>Sign in</Button>
            </div>
          )}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            
            <Card>
              <CardHeader className="flex flex-row items-center gap-3 pb-4">
                <DollarSign className="h-5 w-5 text-primary" />
                <CardTitle className="text-xl">Scholarship Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="semester1Amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Semester 1 Amount ($)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Enter amount"
                            data-testid="input-semester1-amount"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="semester2Amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Semester 2 Amount ($)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Enter amount"
                            data-testid="input-semester2-amount"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium mb-3 block">Scholarship Towards</Label>
                  <div className="flex flex-wrap gap-6">
                    <FormField
                      control={form.control}
                      name="scholarshipTuition"
                      render={({ field }) => (
                        <FormItem className="flex items-center gap-2">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-tuition"
                            />
                          </FormControl>
                          <FormLabel className="font-normal cursor-pointer mb-0">Tuition</FormLabel>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="scholarshipAccommodation"
                      render={({ field }) => (
                        <FormItem className="flex items-center gap-2">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-accommodation"
                            />
                          </FormControl>
                          <FormLabel className="font-normal cursor-pointer mb-0">Accommodation</FormLabel>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="scholarshipBooks"
                      render={({ field }) => (
                        <FormItem className="flex items-center gap-2">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-books"
                            />
                          </FormControl>
                          <FormLabel className="font-normal cursor-pointer mb-0">Books</FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center gap-3 pb-4">
                <User className="h-5 w-5 text-primary" />
                <CardTitle className="text-xl">Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="surname"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Surname *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter surname" data-testid="input-surname" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter first name" data-testid="input-firstname" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="middleName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Middle Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter middle name" data-testid="input-middlename" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gender *</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex gap-6"
                          >
                            <div className="flex items-center gap-2">
                              <RadioGroupItem value="M" id="male" data-testid="radio-male" />
                              <Label htmlFor="male" className="font-normal cursor-pointer">Male</Label>
                            </div>
                            <div className="flex items-center gap-2">
                              <RadioGroupItem value="F" id="female" data-testid="radio-female" />
                              <Label htmlFor="female" className="font-normal cursor-pointer">Female</Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="nationality"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nationality *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Jamaican" data-testid="input-nationality" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="dateOfBirth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date of Birth *</FormLabel>
                        <FormControl>
                          <Input type="date" data-testid="input-dob" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="age"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Age *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Enter age"
                            data-testid="input-age"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center gap-3 pb-4">
                <Phone className="h-5 w-5 text-primary" />
                <CardTitle className="text-xl">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="studentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Student ID *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter student ID" data-testid="input-studentid" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="projectedGraduationYear"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Projected Year of Graduation *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 2026" data-testid="input-gradyear" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="telephone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telephone Number *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 876-555-1234" data-testid="input-phone" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address *</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="student@utech.edu.jm" data-testid="input-email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="homeAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Home Address *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter your full home address"
                          className="resize-none"
                          data-testid="input-address"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center gap-3 pb-4">
                <BookOpen className="h-5 w-5 text-primary" />
                <CardTitle className="text-xl">Academic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="facultySchool"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Faculty/School *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Faculty of Engineering & Computing" data-testid="input-faculty" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="courseOfStudy"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Course of Study *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Computer Science" data-testid="input-course" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="yearStartedUtech"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Year Started at UTECH *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 2022" data-testid="input-startyear" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="gpa"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>GPA *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 3.50" data-testid="input-gpa" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="programmeType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type of Programme *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-programme-type">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Undergraduate">Undergraduate</SelectItem>
                            <SelectItem value="Graduate">Graduate</SelectItem>
                            <SelectItem value="Diploma">Diploma</SelectItem>
                            <SelectItem value="Certificate">Certificate</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="programmeMode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Programme Mode *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-programme-mode">
                              <SelectValue placeholder="Select mode" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Full-time">Full-time</SelectItem>
                            <SelectItem value="Part-time">Part-time</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="yearInSchool"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Year in School *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-year">
                              <SelectValue placeholder="Select year" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="1st">1st Year</SelectItem>
                            <SelectItem value="2nd">2nd Year</SelectItem>
                            <SelectItem value="3rd">3rd Year</SelectItem>
                            <SelectItem value="4th">4th Year</SelectItem>
                            <SelectItem value="5th">5th Year</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="didTransfer"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-3">
                        <FormLabel className="mb-0">Did you transfer from another programme?</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={(value) => field.onChange(value === "yes")}
                            value={field.value ? "yes" : "no"}
                            className="flex gap-4"
                          >
                            <div className="flex items-center gap-2">
                              <RadioGroupItem value="yes" id="transfer-yes" data-testid="radio-transfer-yes" />
                              <Label htmlFor="transfer-yes" className="font-normal cursor-pointer">Yes</Label>
                            </div>
                            <div className="flex items-center gap-2">
                              <RadioGroupItem value="no" id="transfer-no" data-testid="radio-transfer-no" />
                              <Label htmlFor="transfer-no" className="font-normal cursor-pointer">No</Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  {didTransfer && (
                    <FormField
                      control={form.control}
                      name="transferProgrammeName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name of Previous Programme</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter programme name" data-testid="input-transfer-programme" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center gap-3 pb-4">
                <Trophy className="h-5 w-5 text-primary" />
                <CardTitle className="text-xl">Athletic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="sport"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sport *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Track & Field" data-testid="input-sport" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="eventPosition"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Event/Position *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 100m Sprint, Goalkeeper" data-testid="input-event" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="majorAccomplishments"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Major Accomplishments (Academic & Sport)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="List your major achievements in academics and sports..."
                          className="resize-none min-h-[100px]"
                          data-testid="input-accomplishments"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="nationalRepresentative"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-3">
                        <FormLabel className="mb-0">National Representative?</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={(value) => field.onChange(value === "yes")}
                            value={field.value ? "yes" : "no"}
                            className="flex gap-4"
                          >
                            <div className="flex items-center gap-2">
                              <RadioGroupItem value="yes" id="national-yes" data-testid="radio-national-yes" />
                              <Label htmlFor="national-yes" className="font-normal cursor-pointer">Yes</Label>
                            </div>
                            <div className="flex items-center gap-2">
                              <RadioGroupItem value="no" id="national-no" data-testid="radio-national-no" />
                              <Label htmlFor="national-no" className="font-normal cursor-pointer">No</Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  {isNationalRep && (
                    <FormField
                      control={form.control}
                      name="nationalRepDetails"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Year and Category</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., 2023 - Senior Team" data-testid="input-national-details" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Affiliations (Clubs, Organizations, etc.)</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => appendAffiliation({ name: "" })}
                      data-testid="button-add-affiliation"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>
                  {affiliationFields.length === 0 && (
                    <p className="text-sm text-muted-foreground italic">No affiliations added yet. Click "Add" to add one.</p>
                  )}
                  <div className="space-y-3">
                    {affiliationFields.map((field, index) => (
                      <div key={field.id} className="flex items-center gap-2">
                        <FormField
                          control={form.control}
                          name={`affiliations.${index}.name`}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormControl>
                                <Input 
                                  placeholder="e.g., MVP Track Club" 
                                  data-testid={`input-affiliation-${index}`}
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeAffiliation(index)}
                          data-testid={`button-remove-affiliation-${index}`}
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-3 pb-4">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-primary" />
                  <CardTitle className="text-xl">Parent/Guardian/Contact Person</CardTitle>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => appendGuardian({ surname: "", firstName: "", middleInitial: "", relation: "", telephone: "", address: "" })}
                  data-testid="button-add-guardian"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Guardian
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                {guardianFields.map((field, index) => (
                  <Card key={field.id} className="border-dashed">
                    <CardContent className="pt-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">Guardian {index + 1}</span>
                        {guardianFields.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeGuardian(index)}
                            data-testid={`button-remove-guardian-${index}`}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Remove
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name={`guardians.${index}.surname`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Surname *</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter surname" data-testid={`input-guardian-surname-${index}`} {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`guardians.${index}.firstName`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>First Name *</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter first name" data-testid={`input-guardian-firstname-${index}`} {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`guardians.${index}.middleInitial`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Middle Initial</FormLabel>
                              <FormControl>
                                <Input placeholder="M" maxLength={1} data-testid={`input-guardian-middle-${index}`} {...field} value={field.value || ""} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name={`guardians.${index}.relation`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Relation *</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., Mother, Father, Guardian" data-testid={`input-guardian-relation-${index}`} {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`guardians.${index}.telephone`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Telephone Number *</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., 876-555-1234" data-testid={`input-guardian-phone-${index}`} {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name={`guardians.${index}.address`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Address *</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Enter guardian's address"
                                className="resize-none"
                                data-testid={`input-guardian-address-${index}`}
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                ))}
                {form.formState.errors.guardians && (
                  <p className="text-sm text-destructive">{form.formState.errors.guardians.message}</p>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-end gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => form.reset()}
                data-testid="button-clear"
              >
                Clear Form
              </Button>
              <Button
                type="submit"
                disabled={submitMutation.isPending}
                className="px-8"
                data-testid="button-submit"
              >
                {submitMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Application"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
