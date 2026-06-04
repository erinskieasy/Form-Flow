import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { insertScholarshipApplicationSchema, type InsertScholarshipApplication, type FormQuestion } from "@shared/schema";
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
import { User, Phone, BookOpen, Trophy, Users, DollarSign, Loader2, Plus, Trash2, FileText, CheckCircle2 } from "lucide-react";
import utechGateImage from "@assets/utech-gate_1766011067612.jpg";

function FileUploadField({
  label,
  onChange,
  value,
  accept,
  testId
}: {
  label: string;
  onChange: (path: string) => void;
  value?: string;
  accept?: string;
  testId?: string;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to upload file");
      }

      const data = await res.json();
      onChange(data.filePath);
    } catch (err: any) {
      setUploadError(err.message || "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <FormItem className="space-y-2">
      <FormLabel>{label}</FormLabel>
      <FormControl>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <Input 
              type="file" 
              accept={accept}
              onChange={handleFileChange} 
              disabled={isUploading}
              data-testid={testId}
              className="cursor-pointer file:text-primary file:hover:text-primary-hover file:font-semibold"
            />
            {isUploading && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
          </div>
          {value && (
            <div className="text-xs text-green-600 bg-green-50/50 p-2 rounded border border-green-200 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
              <span className="font-semibold">Uploaded:</span>
              <span className="truncate flex-1 font-mono">{value.split('/').pop()}</span>
            </div>
          )}
          {uploadError && (
            <div className="text-xs text-destructive bg-destructive/10 p-2 rounded border border-destructive/20">
              {uploadError}
            </div>
          )}
        </div>
      </FormControl>
      <FormMessage />
    </FormItem>
  );
}

export default function ScholarshipForm() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

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

  // Query to get form configuration questions
  const { data: questions, isLoading: isLoadingQuestions } = useQuery<FormQuestion[]>({
    queryKey: ["/api/form-questions"],
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

  // Get active questions and sort them by sortOrder
  const activeQuestions = questions
    ?.filter((q) => q.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder) || [];

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

        {isLoadingQuestions ? (
          <div className="space-y-6">
            <Card>
              <CardContent className="h-40 flex items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Loading form configuration...</p>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              
              <Card>
                <CardHeader className="flex flex-row items-center gap-3 pb-4 border-b">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <CardTitle className="text-xl">Application Fields</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  {activeQuestions.map((q) => {
                    switch (q.fieldKey) {
                      case "semester1Amount":
                        return (
                          <FormField
                            key={q.fieldKey}
                            control={form.control}
                            name="semester1Amount"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{q.wording}</FormLabel>
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
                        );
                      case "semester2Amount":
                        return (
                          <FormField
                            key={q.fieldKey}
                            control={form.control}
                            name="semester2Amount"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{q.wording}</FormLabel>
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
                        );
                      case "scholarshipTuition":
                        return (
                          <FormField
                            key={q.fieldKey}
                            control={form.control}
                            name="scholarshipTuition"
                            render={({ field }) => (
                              <FormItem className="flex items-center gap-2 space-y-0 py-2">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    data-testid="checkbox-tuition"
                                  />
                                </FormControl>
                                <FormLabel className="font-normal cursor-pointer">{q.wording}</FormLabel>
                              </FormItem>
                            )}
                          />
                        );
                      case "scholarshipAccommodation":
                        return (
                          <FormField
                            key={q.fieldKey}
                            control={form.control}
                            name="scholarshipAccommodation"
                            render={({ field }) => (
                              <FormItem className="flex items-center gap-2 space-y-0 py-2">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    data-testid="checkbox-accommodation"
                                  />
                                </FormControl>
                                <FormLabel className="font-normal cursor-pointer">{q.wording}</FormLabel>
                              </FormItem>
                            )}
                          />
                        );
                      case "scholarshipBooks":
                        return (
                          <FormField
                            key={q.fieldKey}
                            control={form.control}
                            name="scholarshipBooks"
                            render={({ field }) => (
                              <FormItem className="flex items-center gap-2 space-y-0 py-2">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    data-testid="checkbox-books"
                                  />
                                </FormControl>
                                <FormLabel className="font-normal cursor-pointer">{q.wording}</FormLabel>
                              </FormItem>
                            )}
                          />
                        );
                      case "surname":
                        return (
                          <FormField
                            key={q.fieldKey}
                            control={form.control}
                            name="surname"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{q.wording} *</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter surname" data-testid="input-surname" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        );
                      case "firstName":
                        return (
                          <FormField
                            key={q.fieldKey}
                            control={form.control}
                            name="firstName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{q.wording} *</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter first name" data-testid="input-firstname" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        );
                      case "middleName":
                        return (
                          <FormField
                            key={q.fieldKey}
                            control={form.control}
                            name="middleName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{q.wording}</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter middle name" data-testid="input-middlename" {...field} value={field.value || ""} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        );
                      case "gender":
                        return (
                          <FormField
                            key={q.fieldKey}
                            control={form.control}
                            name="gender"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{q.wording} *</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value} data-testid="select-gender">
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select gender" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="M">Male</SelectItem>
                                    <SelectItem value="F">Female</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        );
                      case "nationality":
                        return (
                          <FormField
                            key={q.fieldKey}
                            control={form.control}
                            name="nationality"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{q.wording} *</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter nationality" data-testid="input-nationality" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        );
                      case "dateOfBirth":
                        return (
                          <FormField
                            key={q.fieldKey}
                            control={form.control}
                            name="dateOfBirth"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{q.wording} *</FormLabel>
                                <FormControl>
                                  <Input placeholder="yyyy-mm-dd" data-testid="input-dob" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        );
                      case "age":
                        return (
                          <FormField
                            key={q.fieldKey}
                            control={form.control}
                            name="age"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{q.wording} *</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    placeholder="Enter age"
                                    data-testid="input-age"
                                    {...field}
                                    onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                                    value={field.value || ""}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        );
                      case "studentId":
                        return (
                          <FormField
                            key={q.fieldKey}
                            control={form.control}
                            name="studentId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{q.wording} *</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter student ID" data-testid="input-studentid" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        );
                      case "projectedGraduationYear":
                        return (
                          <FormField
                            key={q.fieldKey}
                            control={form.control}
                            name="projectedGraduationYear"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{q.wording} *</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., 2026" data-testid="input-grad-year" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        );
                      case "telephone":
                        return (
                          <FormField
                            key={q.fieldKey}
                            control={form.control}
                            name="telephone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{q.wording} *</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., 876-555-1234" data-testid="input-phone" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        );
                      case "email":
                        return (
                          <FormField
                            key={q.fieldKey}
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{q.wording} *</FormLabel>
                                <FormControl>
                                  <Input type="email" placeholder="e.g., student@utech.edu.jm" data-testid="input-email" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        );
                      case "homeAddress":
                        return (
                          <FormField
                            key={q.fieldKey}
                            control={form.control}
                            name="homeAddress"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{q.wording} *</FormLabel>
                                <FormControl>
                                  <Textarea placeholder="Enter home address" className="resize-none" data-testid="input-address" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        );
                      case "facultySchool":
                        return (
                          <FormField
                            key={q.fieldKey}
                            control={form.control}
                            name="facultySchool"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{q.wording} *</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., FENC" data-testid="input-faculty" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        );
                      case "courseOfStudy":
                        return (
                          <FormField
                            key={q.fieldKey}
                            control={form.control}
                            name="courseOfStudy"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{q.wording} *</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., B.Sc. in Computing" data-testid="input-course" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        );
                      case "yearStartedUtech":
                        return (
                          <FormField
                            key={q.fieldKey}
                            control={form.control}
                            name="yearStartedUtech"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{q.wording} *</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., 2022" data-testid="input-start-year" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        );
                      case "gpa":
                        return (
                          <FormField
                            key={q.fieldKey}
                            control={form.control}
                            name="gpa"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{q.wording} *</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., 3.45" data-testid="input-gpa" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        );
                      case "programmeType":
                        return (
                          <FormField
                            key={q.fieldKey}
                            control={form.control}
                            name="programmeType"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{q.wording} *</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value} data-testid="select-prog-type">
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select programme type" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="Undergraduate">Undergraduate</SelectItem>
                                    <SelectItem value="Postgraduate">Postgraduate</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        );
                      case "programmeMode":
                        return (
                          <FormField
                            key={q.fieldKey}
                            control={form.control}
                            name="programmeMode"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{q.wording} *</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value} data-testid="select-prog-mode">
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select programme mode" />
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
                        );
                      case "yearInSchool":
                        return (
                          <FormField
                            key={q.fieldKey}
                            control={form.control}
                            name="yearInSchool"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{q.wording} *</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value} data-testid="select-year-in-school">
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select year in school" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="1st">1st Year</SelectItem>
                                    <SelectItem value="2nd">2nd Year</SelectItem>
                                    <SelectItem value="3rd">3rd Year</SelectItem>
                                    <SelectItem value="4th">4th Year</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        );
                      case "didTransfer":
                        return (
                          <FormField
                            key={q.fieldKey}
                            control={form.control}
                            name="didTransfer"
                            render={({ field }) => (
                              <FormItem className="flex items-center gap-3 space-y-0 py-2">
                                <FormLabel className="mb-0">{q.wording}</FormLabel>
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
                        );
                      case "transferProgrammeName":
                        return didTransfer ? (
                          <FormField
                            key={q.fieldKey}
                            control={form.control}
                            name="transferProgrammeName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{q.wording}</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter programme name" data-testid="input-transfer-programme" {...field} value={field.value || ""} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        ) : null;
                      case "sport":
                        return (
                          <FormField
                            key={q.fieldKey}
                            control={form.control}
                            name="sport"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{q.wording} *</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., Track & Field" data-testid="input-sport" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        );
                      case "eventPosition":
                        return (
                          <FormField
                            key={q.fieldKey}
                            control={form.control}
                            name="eventPosition"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{q.wording} *</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., 100m Sprint, Goalkeeper" data-testid="input-event" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        );
                      case "majorAccomplishments":
                        return (
                          <FormField
                            key={q.fieldKey}
                            control={form.control}
                            name="majorAccomplishments"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{q.wording}</FormLabel>
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
                        );
                      case "nationalRepresentative":
                        return (
                          <FormField
                            key={q.fieldKey}
                            control={form.control}
                            name="nationalRepresentative"
                            render={({ field }) => (
                              <FormItem className="flex items-center gap-3 space-y-0 py-2">
                                <FormLabel className="mb-0">{q.wording}</FormLabel>
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
                        );
                      case "nationalRepDetails":
                        return isNationalRep ? (
                          <FormField
                            key={q.fieldKey}
                            control={form.control}
                            name="nationalRepDetails"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{q.wording}</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., 2023 - Senior Team" data-testid="input-national-details" {...field} value={field.value || ""} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        ) : null;
                      case "photoIdPath":
                        return (
                          <FormField
                            key={q.fieldKey}
                            control={form.control}
                            name="photoIdPath"
                            render={({ field }) => (
                              <FileUploadField
                                label={q.wording}
                                onChange={field.onChange}
                                value={field.value || undefined}
                                accept="image/*"
                                testId="input-photoid-file"
                              />
                            )}
                          />
                        );
                      case "progressReportPath":
                        return (
                          <FormField
                            key={q.fieldKey}
                            control={form.control}
                            name="progressReportPath"
                            render={({ field }) => (
                              <FileUploadField
                                label={q.wording}
                                onChange={field.onChange}
                                value={field.value || undefined}
                                accept=".pdf,.doc,.docx,.xls,.xlsx"
                                testId="input-progress-file"
                              />
                            )}
                          />
                        );
                      default:
                        return null;
                    }
                  })}
                </CardContent>
              </Card>

              {/* Affiliations Card */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-3 pb-4">
                  <div className="flex items-center gap-3">
                    <Trophy className="h-5 w-5 text-primary" />
                    <CardTitle className="text-xl">Affiliations (Clubs, Organizations, etc.)</CardTitle>
                  </div>
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
                </CardHeader>
                <CardContent className="space-y-6">
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
                </CardContent>
              </Card>

              {/* Parent/Guardian Card */}
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
        )}
      </div>
    </div>
  );
}
