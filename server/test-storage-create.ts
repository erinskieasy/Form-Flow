import { storage } from "./storage";

async function run() {
  const sample = {
    surname: "StorageTest",
    firstName: "Dana",
    middleName: "L",
    gender: "Female",
    nationality: "Jamaica",
    dateOfBirth: "2000-05-05",
    age: 25,
    studentId: "STOR123",
    projectedGraduationYear: "2026",
    telephone: "8765554444",
    email: "dana@example.com",
    homeAddress: "101 Test St",
    facultySchool: "Business",
    courseOfStudy: "Marketing",
    yearStartedUtech: "2017",
    gpa: "3.60",
    programmeType: "Undergraduate",
    programmeMode: "Full-time",
    yearInSchool: "4",
    didTransfer: false,
    sport: "Basketball",
    eventPosition: "Guard",
    nationalRepresentative: false,
    scholarshipTuition: false,
    scholarshipAccommodation: false,
    scholarshipBooks: false,
    guardians: [
      { surname: "Tester", firstName: "Tom", middleInitial: "", relation: "Father", telephone: "8765553333", address: "101 Test St" }
    ],
    affiliations: [],
  };

  const created = await storage.createApplication(sample as any);
  console.log("Created via storage:", created.id);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
