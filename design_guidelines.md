# Design Guidelines: UTECH Student Athlete Scholarship Application

## Design Approach: Material Design System
**Rationale**: This is a utility-focused, information-dense application requiring efficient data entry. Material Design provides excellent form components, clear visual hierarchy, and proven usability patterns for data collection interfaces.

## Core Design Principles
1. **Clarity First**: Every form field must be immediately understandable
2. **Progressive Disclosure**: Break complex form into digestible sections
3. **Professional Authority**: University institutional feel with modern polish
4. **Efficient Data Entry**: Minimize cognitive load and input errors

---

## Typography System

**Font Family**: Roboto (via Google Fonts CDN)
- Primary: Roboto (400, 500, 700 weights)

**Hierarchy**:
- Page Title: text-3xl/text-4xl, font-bold
- Section Headers: text-xl/text-2xl, font-semibold  
- Form Labels: text-sm, font-medium
- Input Text: text-base, font-normal
- Helper Text: text-sm, font-normal
- Table Headers: text-sm, font-semibold, uppercase tracking

---

## Layout System

**Spacing Primitives**: Use Tailwind units of **2, 4, 6, 8, 12, 16**
- Form field spacing: gap-6
- Section padding: p-8
- Card padding: p-6
- Button padding: px-6 py-3
- Page margins: max-w-4xl mx-auto for forms, max-w-7xl for tables

**Grid Structure**:
- Single column form on mobile (grid-cols-1)
- Two columns for related fields on desktop (md:grid-cols-2)
- Full width for textareas and complex inputs

---

## Component Library

### A. Form Components

**Form Container**:
- Single-page form with clear section divisions
- Sticky header showing "UTECH Scholarship Application"
- Sections organized with visual cards/panels
- Progress indicator optional but helpful

**Input Fields**:
- Material-style floating labels OR top-aligned labels with helper text below
- Text inputs: border-2, rounded-lg, px-4 py-3
- Focus state: prominent border treatment
- Error state: border treatment with error message below
- Disabled state: reduced opacity

**Field Groups**:
- Personal Information (Name fields in 3-column grid, other fields 2-column)
- Contact Details (2-column: phone, email, address full-width)
- Academic Information (2-column for most, dropdowns for programme type/mode/year)
- Athletic Information (Sport, event full-width; accomplishments textarea)
- Scholarship Details (Semester amounts 2-column, checkboxes for types)
- Parent/Guardian (Name fields 3-column, contact 2-column)

**Selection Controls**:
- Radio buttons for Gender (M/F), Programme Type, Programme Mode
- Checkboxes for Scholarship types (Tuition, Accommodation, Books), Year in School
- Dropdowns for Faculty/School selection
- Date picker for Date of Birth

**Buttons**:
- Primary: "Submit Application" - px-8 py-4, rounded-lg, font-semibold
- Secondary: "Save Draft" - outlined style
- Text: "Clear Form" - minimal style
- Button group right-aligned at form bottom

### B. Data Display Components

**Applications Table/List**:
- Clean table layout with sortable columns
- Columns: Student Name, ID, Sport, Faculty, Scholarship Amount, Date Submitted
- Row hover states for interactivity
- Search bar above table (full-width, mb-6)
- Filter dropdowns (Sport, Faculty, Year) in flex row above table
- Pagination at bottom if needed

**Detail View** (when clicking a record):
- Modal or side drawer showing full application details
- Organized in same sections as form
- Read-only display with clear labels and values
- Print/Export options

### C. Navigation

**Top Navigation**:
- UTECH logo/branding left
- "New Application" and "View Applications" navigation tabs/links
- Simple horizontal navigation, sticky on scroll

**No Images Required**: This is a functional application - no hero images needed. Focus on clean, efficient form design.

---

## Form UX Patterns

**Validation**:
- Real-time validation on blur
- Required field indicators (asterisk)
- Inline error messages below fields
- Summary of errors at top if submission fails

**Data Entry Optimization**:
- Tab order follows logical flow
- Auto-format phone numbers and dates
- Smart defaults where applicable
- "Yes/No" toggles reveal conditional fields (e.g., "Did you transfer" reveals programme name field)

**Responsive Behavior**:
- Mobile: Single column, full-width inputs, larger touch targets (min-h-12)
- Tablet: Two columns where appropriate
- Desktop: Optimal column layout as described

---

## Application States

**Empty State** (View Applications page):
- Centered message: "No applications submitted yet"
- Illustration or icon
- "Submit First Application" CTA button

**Loading States**:
- Skeleton loaders for table rows
- Spinner for form submission

**Success State**:
- Success message/modal after submission
- Confirmation number displayed
- Option to submit another or view all applications

---

## Accessibility

- All form inputs with proper labels and ARIA attributes
- Keyboard navigation fully supported
- Focus indicators visible and prominent
- Error messages announced to screen readers
- Sufficient contrast ratios maintained
- Touch targets minimum 44x44px

---

## Key Implementation Notes

- Use semantic HTML5 form elements
- Implement proper form validation (client and server-side)
- Ensure all required fields are clearly marked
- Group related fields with fieldset/legend where appropriate
- Maintain consistent input heights and spacing throughout
- Table must be responsive (card stack on mobile or horizontal scroll)

This design prioritizes **usability and efficiency** for both applicants filling out the form and administrators reviewing submissions, while maintaining the professional standards expected of a university system.