import { useForm } from "react-hook-form";
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
import { GraduationCap, User, Phone, BookOpen, Trophy, Users, DollarSign, Loader2 } from "lucide-react";

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
      affiliation: "",
      scholarshipTuition: false,
      scholarshipAccommodation: false,
      scholarshipBooks: false,
      semester1Amount: undefined,
      semester2Amount: undefined,
      parentSurname: "",
      parentFirstName: "",
      parentMiddleInitial: "",
      parentRelation: "",
      parentTelephone: "",
      parentAddress: "",
    },
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

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <GraduationCap className="h-10 w-10 text-primary" />
            <h1 className="text-3xl font-bold text-foreground" data-testid="text-page-title">
              UNIVERSITY OF TECHNOLOGY, JAMAICA
            </h1>
          </div>
          <p className="text-lg text-muted-foreground">Department of Sport - "Home of World Class Athletes"</p>
          <h2 className="text-xl font-semibold mt-4 text-foreground">Student Athlete Scholarship Information Form</h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-2xl mx-auto">
            This form will provide detailed information on student athlete scholarship recipients. 
            All information provided will be kept in confidence and used for letters of recommendation, 
            contact purposes, and historical records.
          </p>
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
                          <FormLabel className="text-sm font-normal cursor-pointer">Tuition</FormLabel>
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
                          <FormLabel className="text-sm font-normal cursor-pointer">Accommodation</FormLabel>
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
                          <FormLabel className="text-sm font-normal cursor-pointer">Books</FormLabel>
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
                          <Input placeholder="Enter middle name" data-testid="input-middlename" {...field} />
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
                        <FormLabel>Student ID Number *</FormLabel>
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
                          <Input placeholder="e.g., 2027" data-testid="input-graduation-year" {...field} />
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
                        <FormLabel>Telephone Number(s) *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 876-555-1234" data-testid="input-telephone" {...field} />
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
                          <Input type="email" placeholder="your@email.com" data-testid="input-email" {...field} />
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
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-faculty">
                              <SelectValue placeholder="Select faculty/school" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Faculty of Engineering and Computing">Faculty of Engineering and Computing</SelectItem>
                            <SelectItem value="Faculty of Science and Sport">Faculty of Science and Sport</SelectItem>
                            <SelectItem value="Faculty of Education and Liberal Studies">Faculty of Education and Liberal Studies</SelectItem>
                            <SelectItem value="Faculty of The Built Environment">Faculty of The Built Environment</SelectItem>
                            <SelectItem value="Faculty of Law">Faculty of Law</SelectItem>
                            <SelectItem value="Faculty of Health Sciences">Faculty of Health Sciences</SelectItem>
                            <SelectItem value="College of Business and Management">College of Business and Management</SelectItem>
                            <SelectItem value="College of Oral Health Sciences">College of Oral Health Sciences</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="courseOfStudy"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Course of Study (Major) *</FormLabel>
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
                        <FormLabel>Year Started UTECH *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 2023" data-testid="input-year-started" {...field} />
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="programmeType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type of Programme *</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="grid grid-cols-2 gap-3"
                          >
                            <div className="flex items-center gap-2">
                              <RadioGroupItem value="Undergraduate" id="undergraduate" data-testid="radio-undergraduate" />
                              <Label htmlFor="undergraduate" className="font-normal cursor-pointer">Undergraduate</Label>
                            </div>
                            <div className="flex items-center gap-2">
                              <RadioGroupItem value="Graduate" id="graduate" data-testid="radio-graduate" />
                              <Label htmlFor="graduate" className="font-normal cursor-pointer">Graduate</Label>
                            </div>
                            <div className="flex items-center gap-2">
                              <RadioGroupItem value="Diploma" id="diploma" data-testid="radio-diploma" />
                              <Label htmlFor="diploma" className="font-normal cursor-pointer">Diploma</Label>
                            </div>
                            <div className="flex items-center gap-2">
                              <RadioGroupItem value="Certificate" id="certificate" data-testid="radio-certificate" />
                              <Label htmlFor="certificate" className="font-normal cursor-pointer">Certificate</Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
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
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex gap-6"
                          >
                            <div className="flex items-center gap-2">
                              <RadioGroupItem value="Part-time" id="parttime" data-testid="radio-parttime" />
                              <Label htmlFor="parttime" className="font-normal cursor-pointer">Part-time</Label>
                            </div>
                            <div className="flex items-center gap-2">
                              <RadioGroupItem value="Full-time" id="fulltime" data-testid="radio-fulltime" />
                              <Label htmlFor="fulltime" className="font-normal cursor-pointer">Full-time</Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="yearInSchool"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Year in School *</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-wrap gap-4"
                        >
                          {["1st", "2nd", "3rd", "4th", "5th"].map((year) => (
                            <div key={year} className="flex items-center gap-2">
                              <RadioGroupItem value={year} id={`year-${year}`} data-testid={`radio-year-${year}`} />
                              <Label htmlFor={`year-${year}`} className="font-normal cursor-pointer">{year}</Label>
                            </div>
                          ))}
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                            <Input placeholder="Enter programme name" data-testid="input-transfer-programme" {...field} />
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
                            <Input placeholder="e.g., 2023 - Senior Team" data-testid="input-national-details" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
                <FormField
                  control={form.control}
                  name="affiliation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Affiliation (Clubs, etc.)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., MVP Track Club" data-testid="input-affiliation" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center gap-3 pb-4">
                <Users className="h-5 w-5 text-primary" />
                <CardTitle className="text-xl">Parent/Guardian/Contact Person</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="parentSurname"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Surname *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter surname" data-testid="input-parent-surname" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="parentFirstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter first name" data-testid="input-parent-firstname" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="parentMiddleInitial"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Middle Initial</FormLabel>
                        <FormControl>
                          <Input placeholder="M" maxLength={1} data-testid="input-parent-middle" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="parentRelation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Relation *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Mother, Father, Guardian" data-testid="input-parent-relation" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="parentTelephone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telephone Number *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 876-555-1234" data-testid="input-parent-phone" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="parentAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter parent/guardian address"
                          className="resize-none"
                          data-testid="input-parent-address"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
