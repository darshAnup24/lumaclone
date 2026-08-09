# FULL IMPLEMENTATION PROMPT — LUMA CLONE + CAMPUS EMAIL EVENT INTELLIGENCE

You are working inside an **existing frontend repository that is already a Luma clone**.

Your job is to turn this existing Luma clone into a functional campus event and activity platform.

## 🚨 ABSOLUTE REQUIREMENT: DO NOT CHANGE THE EXISTING UI

This is the most important requirement in the entire task.

The repository already contains a Luma clone with an existing UI.

**The existing Luma clone UI must remain the visual source of truth.**

You must NOT:

- redesign the application
- replace the existing UI
- change the existing visual language
- replace existing components unnecessarily
- introduce another component library
- change existing colors
- change typography
- change spacing
- change border radii
- change navigation unnecessarily
- redesign existing cards
- redesign existing event pages
- redesign existing calendar pages
- replace existing buttons
- replace existing forms
- replace existing modals
- change existing responsive behavior unnecessarily

If an existing component already performs the required visual function, **reuse it**.

If a new component is required, inspect how the existing Luma clone implements visually similar components and build the new component using the SAME:

- styling
- spacing
- typography
- component patterns
- layout patterns
- interactions
- responsive behavior

The final application should look like:

> **The exact same Luma clone, but with significantly more functionality underneath it.**

It should NOT look like a new event-management application.

---

# 1. FIRST STEP — INSPECT THE EXISTING REPOSITORY

Before modifying anything, inspect the repository thoroughly.

Determine:

- framework
- language
- routing
- existing pages
- component architecture
- styling solution
- existing design system
- existing reusable components
- existing event components
- existing calendar components
- existing navigation
- existing forms
- existing modals
- existing authentication
- existing API/data layer
- existing state management
- package manager
- build configuration
- environment configuration

Run the existing application first.

Understand what is already implemented.

**Do not rewrite existing functionality simply because you would architect it differently.**

Extend the existing application.

---

# 2. PRODUCT CONCEPT

The application is a campus event/activity discovery platform built on top of the existing Luma clone.

There are two primary sources of activities:

## A. Official / Institutional Activities

These come from:

- college clubs
- departments
- placement/career cell
- student organizations
- college administration
- conferences
- hackathons
- workshops
- seminars
- competitions
- other official announcements

The important innovation is:

> **Clubs and organizations should not have to manually enter events into our application.**

Instead, they can continue their existing workflow of sending emails.

The platform receives those emails, extracts useful event/activity information, and converts them into structured records that can appear in the existing Luma calendar/event UI.

---

## B. Student-created Activities

Any authenticated student can create an activity/event manually.

Examples:

- DSA practice
- study session
- project discussion
- coding meetup
- football
- photography walk
- career discussion
- networking
- hackathon team formation
- gaming session

Other students can request to join.

The organizer can accept/reject requests.

---

# 3. CORE PRODUCT LOOP

The platform should support this:

```
College / Club / Placement Cell
            |
            | sends email
            v
      Email ingestion
            |
            v
      AI extraction
            |
            v
    Validation / Admin review
            |
            v
       Supabase events
            |
            v
      Existing Luma UI
            |
            v
       Student discovery

```

And:

```
Student
   |
   | creates activity
   v
Supabase events
   |
   v
Existing Luma UI
   |
   v
Another student requests to join
   |
   v
Organizer accepts/rejects
   |
   v
Notifications + email

```

Both flows must ultimately use the **same event/activity model and the same existing Luma UI**.

---

# 4. TECHNOLOGY STACK

Use the existing frontend framework.

Do NOT migrate the project to another framework.

Use:

### Frontend

Existing Luma clone.

### Authentication

Supabase Auth.

### Database

Supabase PostgreSQL.

### Backend/server-side logic

Use the architecture most appropriate to the existing repository:

- Vercel server/API routes where appropriate
- Supabase Edge Functions where appropriate

Do not unnecessarily duplicate backend logic between Vercel and Supabase.

### Email

Resend.

Use Resend for:

- inbound event emails
- outbound notification emails

### Hosting

Vercel.

---

# 5. AUTHENTICATION

Implement Supabase authentication.

Users should be able to log in using their email.

Use the existing Luma login UI.

Do NOT redesign the login page.

Support:

- login
- logout
- persistent sessions
- protected routes/actions
- authentication loading state
- authentication errors
- session restoration after refresh

Use Supabase Auth rather than building custom authentication.

---

# 6. UNIFIED EVENT MODEL

Do NOT create separate backend systems for official events and student events.

Use one `events` table.

For example:

```
events

```

with:

```
id
title
description
event_type
source
category
organizer_user_id
organization_id
source_email
start_time
end_time
timezone
location_type
location
meeting_url
capacity
registration_url
registration_deadline
cover_image_url
status
requires_approval
confidence_score
created_at
updated_at
published_at

```

---

# 7. EVENT TYPE

Use:

```
event_type:
    official
    solo

```

Do NOT create separate "Solo Event" infrastructure.

`solo` means a student-created activity.

`official` means an organization/institutional event.

Both must use:

- same event table
- same event detail system
- same event card
- same calendar
- same discovery UI

Only their ownership/source/approval behavior differs.

---

# 8. EVENT SOURCE

Add:

```
source:
    email
    student
    admin

```

This is important.

It allows us to understand where events came from.

Example:

```
official + email
solo + student
official + admin

```

---

# 9. EVENT CATEGORIES

Do NOT create an unnecessarily rigid category system.

Initial supported categories:

```
hackathon
conference
workshop
seminar
competition
club_activity
career_placement
social
sports
study
networking
cultural
other
unknown

```

### Important

Do NOT force the AI to incorrectly classify an email.

If the AI cannot confidently determine the category:

```
category = unknown

```

The admin can later edit it.

If a completely new kind of event appears, do NOT reject it merely because it doesn't fit the predefined categories.

Store it as:

```
unknown

```

and preserve the extracted title/description.

The admin can assign the correct category before publishing.

---

# 10. PLACEMENT / CAREER INFORMATION

Placement information is important and must be supported.

Do not discard placement emails.

Use:

```
category = career_placement

```

for:

- campus recruitment
- placement drives
- company talks
- internship opportunities
- recruitment tests
- placement deadlines
- pre-placement talks

However, don't assume every placement email is an "event".

The extraction system should determine whether it represents:

```
event
deadline
announcement
opportunity

```

If it is an important career/placement item, it should still be represented in the platform.

---

# 11. EMAIL INGESTION

Create a dedicated inbound email address.

Example:

```
events@yourdomain.com

```

Organizations can forward or CC their normal event emails to this address.

They do NOT need to manually recreate the event in the application.

Example:

```
Coding Club
       |
       +---- students@college.edu
       |
       +---- events@yourdomain.com

```

The club continues using its existing email workflow.

---

# 12. RESEND INBOUND EMAIL

Use Resend inbound email functionality.

Configure the necessary domain/DNS settings.

Incoming email should trigger a webhook.

Conceptually:

```
Email
 ↓
Resend
 ↓
email.received webhook
 ↓
Server-side handler
 ↓
Store raw email
 ↓
Extract structured information

```

Never expose Resend secrets in frontend code.

---

# 13. STORE RAW EMAIL

Create an `inbound_emails` table.

Suggested structure:

```
id
message_id
from_email
from_name
to_email
subject
text_body
html_body
received_at
processing_status
extraction_result
error_message
created_at

```

Possible:

```
processing_status:
    received
    processing
    extracted
    needs_review
    published
    rejected
    failed

```

Do not throw away the original email.

The raw email should be retained for audit/debugging.

---

# 14. ORGANIZATION MAPPING

Create:

```
organizations

```

with:

```
id
name
description
logo_url
email_patterns
is_verified
is_official
created_at
updated_at

```

Example:

```
Coding Club
email_patterns:
    codingclub@college.edu

```

When an email comes from a known organization:

```
codingclub@college.edu

```

automatically associate it with:

```
Coding Club

```

and mark:

```
is_verified = true

```

Do NOT trust arbitrary sender names.

Use verified email addresses/domains.

---

# 15. AI EVENT EXTRACTION

Use an AI model to extract structured information from the email.

The AI should NOT simply summarize the email.

It must return structured data.

Example:

```
{
  "is_relevant": true,
  "content_type": "event",
  "title": "24 Hour Hackathon",
  "description": "...",
  "organizer": "Coding Club",
  "category": "hackathon",
  "start_time": "...",
  "end_time": "...",
  "timezone": "Asia/Kolkata",
  "location_type": "physical",
  "location": "Main Auditorium",
  "meeting_url": null,
  "registration_url": "...",
  "registration_deadline": "...",
  "capacity": null,
  "confidence": 0.96
}

```

The extraction schema must be strict.

---

# 16. CONTENT TYPES

The AI should distinguish between:

```
event
deadline
announcement
opportunity
other

```

Examples:

### Event

```
DSA Workshop
Tomorrow 5 PM
Seminar Hall

```

→ `event`

### Placement opportunity

```
Microsoft hiring process
Applications close August 20

```

→ `opportunity` or `deadline`

### Normal announcement

```
Club meeting postponed to next week.

```

→ `announcement`

Do NOT automatically create a public event for every email.

---

# 17. AI CONFIDENCE

Every extraction should have:

```
confidence_score

```

Example:

```
0.98

```

High confidence:

```
is_relevant = true
confidence >= configured threshold

```

can be eligible for automatic processing.

However, during the initial deployment, **do not automatically publish everything.**

Use admin review first.

---

# 18. ADMIN REVIEW PIPELINE

Create an admin review interface using the existing Luma UI style.

Incoming extracted item:

```
--------------------------------
Coding Club

24 Hour Hackathon

Aug 25
10 AM – Aug 26
Main Auditorium

Category:
Hackathon

Confidence:
96%

Source:
codingclub@college.edu

[Edit]
[Publish]
[Reject]
--------------------------------

```

Admin must be able to edit:

- title
- description
- category
- organizer
- date
- time
- timezone
- location
- registration URL
- registration deadline
- event type
- other extracted fields

Then:

```
Publish

```

creates/updates the final event.

---

# 19. UNKNOWN CATEGORY

If AI returns:

```
category = unknown

```

the event should appear in admin review.

Admin can select:

```
Hackathon
Conference
Workshop
Seminar
Competition
Club Activity
Career/Placement
Social
Sports
Study
Networking
Cultural
Other

```

Do not force the AI to invent a category.

---

# 20. ADMIN APPROVAL

Only approved records should appear publicly.

Use:

```
status:
    draft
    pending_review
    published
    rejected
    cancelled
    completed

```

Email-extracted content initially enters:

```
pending_review

```

Admin publishes it.

---

# 21. DUPLICATE EVENT DETECTION

This is important.

The same club may send:

```
Original announcement
Reminder
Updated announcement
Final reminder

```

Do not create four events.

Implement duplicate detection using combinations such as:

- organizer
- normalized title
- date
- time
- registration URL
- source message ID
- similarity where appropriate

If a likely duplicate is detected:

```
possible_duplicate = true

```

and send it to admin review.

An update email should ideally update an existing event rather than create a duplicate.

---

# 22. EMAIL UPDATE DETECTION

Example:

First email:

> Hackathon on August 20 at 10 AM.

Second email:

> IMPORTANT: Hackathon moved to August 21 at 2 PM.

The system should attempt to identify the existing event.

Admin sees:

```
Possible update to:

Hackathon 2026

Old:
Aug 20, 10 AM

New:
Aug 21, 2 PM

[Apply Update]
[Create New]
[Reject]

```

This prevents calendar pollution.

---

# 23. EXISTING LUMA CALENDAR

Connect the event database to the existing calendar UI.

Do not redesign the calendar.

The calendar should display:

- official events
- student activities
- workshops
- conferences
- hackathons
- career/placement activities
- deadlines/opportunities where appropriate

Use existing Luma calendar components.

---

# 24. EVENT DISCOVERY

Reuse the existing Luma event discovery interface.

Allow filtering where the existing UI supports it.

Useful filters:

```
All
Official
Student
Hackathons
Conferences
Workshops
Competitions
Club Activities
Career/Placement
Social
Sports
Study
Networking

```

If the current Luma clone has a filter system, extend it rather than replacing it.

---

# 25. STUDENT-CREATED EVENTS

Authenticated students can create:

```
event_type = solo
source = student

```

Examples:

```
DSA Practice
Career Discussion
Photography Walk
Football
Study Session
Project Collaboration

```

Reuse the existing Luma event creation UI.

Do not build a completely new form design.

---

# 26. STUDENT EVENT REQUEST FLOW

Student A creates:

```
DSA Practice
6 PM – 7 PM
Capacity: 5

```

Student B opens it.

Clicks:

```
Request to Join

```

Create:

```
event_requests

```

with:

```
event_id
user_id
status
requested_at
responded_at

```

Statuses:

```
pending
accepted
rejected
cancelled

```

Unique constraint:

```
UNIQUE(event_id, user_id)

```

---

# 27. ORGANIZER APPROVAL

Organizer sees pending requests.

Can:

```
Accept
Reject

```

Before accepting:

- verify organizer owns the event
- verify event isn't cancelled/completed
- verify capacity
- verify participant isn't already accepted

Enforce authorization server-side/database-side.

Do NOT rely only on frontend checks.

---

# 28. NOTIFICATIONS

Create:

```
notifications

```

with:

```
id
user_id
event_id
type
title
message
is_read
created_at

```

Notifications include:

- new request
- request accepted
- request rejected
- event updated
- event cancelled
- event reminder

---

# 29. RESEND OUTBOUND EMAIL

Use Resend for transactional email.

Send emails for:

### Organizer

> Someone requested to join your event.

### Participant

> Your request was accepted.

### Participant

> Your request was rejected.

### Event update

> An event you're attending has changed.

### Reminder

> Your event is starting soon.

Do NOT email every student for every newly created event.

---

# 30. IMPORTANT EMAIL NOTIFICATION STRATEGY

Do NOT implement:

```
New event created
↓
Email every user

```

That will create spam.

Instead eventually support:

```
User interests
+
Followed organizations
+
Relevant categories
+
Events they are attending

```

and send targeted notifications.

For the MVP, transactional emails are sufficient.

---

# 31. USER INTERESTS

Prepare the architecture for:

```
user_interests

```

Examples:

```
coding
AI
startups
sports
photography
career
study
gaming
culture

```

Do not overbuild recommendations initially.

But design the database so personalized discovery can be added later.

---

# 32. CLUB FOLLOWING

Prepare the architecture for:

```
organization_followers

```

Students can eventually follow:

```
Coding Club
Photography Club
Robotics Club

```

Then they can receive notifications for those organizations.

This should be designed into the architecture but does not need to block MVP completion.

---

# 33. USER PROFILE

Use:

```
profiles

```

with:

```
id
email
name
avatar_url
bio
created_at
updated_at

```

Reuse existing Luma profile UI.

---

# 34. DATABASE SECURITY

Implement Supabase Row Level Security.

Users must NOT be able to:

- modify another user's event
- modify another user's request
- accept their own request
- read private organizer data
- read unrelated participant data
- change event ownership
- publish email-extracted events
- modify organization verification

Admin operations must be protected.

Do not trust client-supplied:

```
user_id
organizer_id
role
request_status
event_owner

```

---

# 35. ADMIN AUTHORIZATION

Do not simply create:

```
isAdmin = true

```

in frontend code.

Admin privileges must be enforced server-side/database-side.

Use a secure mechanism appropriate to Supabase.

---

# 36. EMAIL SECURITY

Inbound email must be validated.

Do not trust arbitrary emails as official organizations.

Maintain verified organizations and sender patterns.

Example:

```
Coding Club
approved sender:
codingclub@college.edu

```

Unknown senders:

```
unknown sender

```

should go through admin review.

Never automatically mark an unknown sender as an official organization.

---

# 37. EVENT DATA QUALITY

Normalize:

- dates
- times
- timezone
- URLs
- organizer names
- categories

Store timestamps consistently.

Use:

```
Asia/Kolkata

```

as the initial campus timezone if this application is for an Indian college.

But don't hard-code assumptions throughout the application.

---

# 38. ATTACHMENTS

If an inbound email contains:

- PDF
- image
- flyer

preserve the attachment.

Do not automatically trust extracted information from the image without validation.

If feasible, allow admin to see the original attachment during review.

If the Luma clone supports event cover images, an approved event flyer can optionally be used as the event image, but **do not alter the existing image UI.**

---

# 39. EVENT SOURCE DISPLAY

If the existing UI supports metadata, indicate source appropriately.

For example:

```
Coding Club
Official

```

or:

```
Hosted by Rahul
Student Meetup

```

Do not introduce a visually inconsistent badge system.

Reuse existing Luma metadata styles.

---

# 40. IMPORTANT: NO UI REGRESSION

After implementation compare:

### Before

Existing Luma clone.

### After

Extended Luma clone.

Existing screens should remain visually equivalent.

Especially verify:

- homepage
- navigation
- event cards
- event detail
- calendar
- login
- responsive mobile layout

If a feature can be implemented without modifying an existing component, do that.

---

# 41. ERROR HANDLING

Handle:

- malformed emails
- missing date
- missing time
- ambiguous dates
- invalid URLs
- AI extraction failure
- Supabase failure
- Resend failure
- duplicate events
- duplicate requests
- expired sessions
- invalid event data

Failed email processing should not crash the application.

Store errors in:

```
inbound_emails.error_message

```

and expose them to admin review.

---

# 42. IMPORTANT DATE PARSING RULE

Emails may say:

```
Tomorrow
Next Friday
This Saturday
20th August
August 20
20/08

```

The AI/parser must resolve these relative to the email's received timestamp and timezone.

Do not blindly assume ambiguous dates.

If uncertain:

```
needs_review = true

```

---

# 43. ADMIN REVIEW SHOULD BE THE SAFETY NET

The system should be designed as:

```
Email
 ↓
AI extraction
 ↓
Validation
 ↓
Duplicate detection
 ↓
Admin review
 ↓
Publish

```

not:

```
Email
 ↓
AI
 ↓
Public website

```

at least initially.

Once the system has proven reliable, verified senders + high confidence can potentially be auto-published.

---

# 44. VERCEL DEPLOYMENT

The final application must deploy cleanly to Vercel.

Use environment variables.

Create `.env.example`.

For example, depending on the framework:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=

```

Use the exact naming convention required by the existing framework.

Never commit secrets.

Never expose:

```
SUPABASE_SERVICE_ROLE_KEY
RESEND_API_KEY

```

to client-side code.

---

# 45. SUPABASE MIGRATIONS

Create reproducible SQL migrations for:

- profiles
- organizations
- events
- event\_requests
- notifications
- inbound\_emails
- organization\_followers if implemented
- user\_interests if implemented

Also create:

- indexes
- constraints
- foreign keys
- RLS
- policies
- necessary functions/triggers

Do not require manually creating the database through the Supabase dashboard.

---

# 46. SEED DATA

Create approximately 4–5 realistic official college events.

Examples:

```
Full Stack Web Development Workshop
Coding Club

AI/ML Career Conference
AI Club

24-Hour Hackathon
Coding Club

Photography Walk
Photography Club

Startup & Entrepreneurship Meetup
E-Cell

```

Include realistic:

- date
- time
- location
- description
- category

These should demonstrate the existing Luma UI immediately after setup.

---

# 47. TEST EMAILS

Create sample inbound email fixtures.

At minimum:

### Hackathon

```
Subject:
24 Hour Hackathon Registrations Open

```

### Workshop

```
Subject:
DSA Workshop this Friday

```

### Placement

```
Subject:
Microsoft Campus Recruitment

```

### Conference

```
Subject:
National Technology Conference

```

### Unknown

```
Subject:
Important Student Activity Update

```

The unknown example should go to:

```
category = unknown

```

and require admin review.

---

# 48. TEST UPDATE EMAIL

Create a fixture like:

```
IMPORTANT:
The hackathon originally scheduled for August 20
has been moved to August 21.

```

Verify the system identifies a potential update rather than blindly creating a duplicate.

---

# 49. END-TO-END TEST

Test this complete pipeline:

```
Club sends email
       ↓
Resend receives email
       ↓
Webhook fires
       ↓
Inbound email stored
       ↓
AI extracts event
       ↓
Category determined
       ↓
Confidence calculated
       ↓
Duplicate detection
       ↓
Admin review
       ↓
Admin edits if required
       ↓
Admin publishes
       ↓
Supabase event created
       ↓
Existing Luma calendar updates
       ↓
Student sees event

```

Then test:

```
Student creates solo event
       ↓
Another student requests to join
       ↓
Organizer accepts
       ↓
Supabase request updated
       ↓
Both users receive notification
       ↓
Both receive Resend email

```

---

# 50. PROJECT STRUCTURE

Follow the existing repository structure.

Do NOT reorganize the entire project merely for aesthetic reasons.

Add new files/modules only where appropriate.

Reuse existing:

- API utilities
- Supabase client
- authentication utilities
- components
- hooks
- styles
- layout
- routing

---

# 51. README

Update the README with:

## Project

Explain the platform.

## Architecture

Explain:

```
Inbound Email
→ Resend
→ Webhook
→ AI extraction
→ Admin validation
→ Supabase
→ Existing Luma UI

```

## Student events

Explain:

```
Student
→ Create activity
→ Other student requests
→ Organizer approves
→ Notification/email

```

## Setup

Provide exact commands.

## Supabase

Explain migrations and RLS.

## Resend

Explain inbound domain/webhook setup.

## AI

Explain extraction schema.

## Vercel

Explain environment variables and deployment.

---

# 52. IMPLEMENTATION ORDER

Follow this exact order.

## Phase 1

Audit existing Luma repository.

## Phase 2

Run existing application and verify baseline.

## Phase 3

Set up Supabase.

## Phase 4

Implement authentication.

## Phase 5

Implement unified event database.

## Phase 6

Connect existing Luma event/calendar UI to Supabase.

## Phase 7

Seed official events.

## Phase 8

Implement student-created solo activities.

## Phase 9

Implement request/approval flow.

## Phase 10

Implement notifications.

## Phase 11

Implement Resend outbound email.

## Phase 12

Implement Resend inbound email.

## Phase 13

Implement AI extraction.

## Phase 14

Implement admin review.

## Phase 15

Implement duplicate/update detection.

## Phase 16

Test complete workflows.

## Phase 17

Deploy to Vercel.

---

# 53. DO NOT OVERENGINEER

Do NOT implement unnecessarily:

- microservices
- Kafka
- Redis
- Kubernetes
- complex recommendation systems
- custom authentication
- custom design system
- custom component library
- separate backend server unless required
- real-time chat
- social media feed

The goal is a clean, deployable application.

---

# 54. FINAL PRODUCT

The final product should essentially be:

```
              CAMPUS ACTIVITY PLATFORM
                         │
          ┌──────────────┴──────────────┐
          │                             │
    INSTITUTIONAL                    STUDENT
       EVENTS                       ACTIVITIES
          │                             │
          │                             │
      Email → AI                   Create Event
          │                             │
          ▼                             ▼
       Review                       Publish
          │                             │
          └──────────────┬──────────────┘
                         ▼
                    SUPABASE
                         │
                         ▼
                  EXISTING LUMA UI
                         │
              ┌──────────┴──────────┐
              │                     │
          DISCOVER                JOIN
              │                     │
              └──────────┬──────────┘
                         ▼
                     CONNECT

```

The product's core idea is:

> **Students already receive hundreds of campus emails, but the information is fragmented, difficult to search, and easy to miss. This platform automatically converts relevant institutional emails into structured, searchable campus activities while also allowing students to create their own activities and connect with others.**

---

# 55. NON-NEGOTIABLE FINAL RULE

**DO NOT MODIFY THE EXISTING LUMA UI UNLESS ABSOLUTELY REQUIRED FOR FUNCTIONALITY.**

The existing UI is not a placeholder.

It is the final design.

Use it.

Learn from it.

Extend it.

Reuse its components.

Reuse its styles.

Reuse its interaction patterns.

If you need something new, make it look native to the existing Luma clone.

**Do not replace the Luma clone with your own interpretation of a modern event application.**

The goal is:

> **Luma clone UI + campus intelligence + email-to-event ingestion + student-created activities + participation workflow.**

Not:

> **a redesigned event platform inspired by Luma.**

Implement the complete system end-to-end.