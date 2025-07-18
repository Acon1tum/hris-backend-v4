# Online Job Application Portal API Documentation

This document describes the REST API endpoints for the Online Job Application Portal. These endpoints allow applicants to register, log in, manage their profiles, view job listings, apply for jobs, track their application status, and receive notifications.

---

## Authentication & Profile

### Register Applicant
- **POST** `/register`
- **Description:** Register a new job applicant. Creates a User (role: 'applicant') and a linked JobApplicant profile.
- **Request Body:**
  ```json
  {
    "first_name": "John",
    "last_name": "Doe",
    "middle_name": "M.",
    "email": "john@example.com",
    "phone": "09171234567",
    "current_employer": "ABC Corp",
    "highest_education": "Bachelor's Degree",
    "password": "yourPassword123"
  }
  ```
- **Response:**
  ```json
  { "success": true, "data": { /* applicant object */ } }
  ```

### Login Applicant
- **POST** `/login`
- **Description:** Log in as a job applicant using email and password. Returns a JWT token and applicant profile.
- **Request Body:**
  ```json
  { "email": "john@example.com", "password": "yourPassword123" }
  ```
- **Response:**
  ```json
  { "success": true, "token": "<jwt>", "data": { /* applicant object */ } }
  ```

### Get Applicant Profile
- **GET** `/profile?applicantId=...`
- **Headers:** `Authorization: Bearer <token>`
- **Description:** Get the profile of the logged-in applicant.
- **Response:**
  ```json
  { "success": true, "data": { /* applicant object */ } }
  ```

### Update Applicant Profile
- **PUT** `/profile?applicantId=...`
- **Headers:** `Authorization: Bearer <token>`
- **Description:** Update the profile of the logged-in applicant.
- **Request Body:**
  ```json
  { /* fields to update */ }
  ```
- **Response:**
  ```json
  { "success": true, "data": { /* updated applicant object */ } }
  ```

### Check Profile Completion
- **GET** `/profile/completion-status?applicantId=...`
- **Headers:** `Authorization: Bearer <token>`
- **Description:** Check if the applicant's profile is complete.
- **Response:**
  ```json
  { "success": true, "complete": true }
  ```

---

## Job Listings

### List All Jobs
- **GET** `/jobs`
- **Description:** Get all published job postings.
- **Response:**
  ```json
  { "success": true, "data": [ /* job postings */ ] }
  ```

### Get Job Details
- **GET** `/jobs/:id`
- **Description:** Get details of a specific job posting.
- **Response:**
  ```json
  { "success": true, "data": { /* job posting */ } }
  ```

---

## Job Application Process

### Start Application
- **POST** `/applications`
- **Headers:** `Authorization: Bearer <token>`
- **Description:** Start a new job application.
- **Request Body:**
  ```json
  {
    "position_id": "<job_posting_id>",
    "applicant_id": "<applicant_id>",
    "cover_letter": "I am interested in this position."
  }
  ```
- **Response:**
  ```json
  { "success": true, "data": { /* application object */ } }
  ```

### Upload Application Documents
- **POST** `/applications/:id/upload`
- **Headers:** `Authorization: Bearer <token>`
- **Description:** Upload documents for a job application.
- **Request Body:**
  ```json
  {
    "document_type": "Resume",
    "document_path": "/uploads/resume.pdf"
  }
  ```
- **Response:**
  ```json
  { "success": true, "data": { /* document object */ } }
  ```

### Answer Application Questions
- **PUT** `/applications/:id/answers`
- **Headers:** `Authorization: Bearer <token>`
- **Description:** Submit answers to application questions.
- **Request Body:**
  ```json
  { "answers": ["Answer 1", "Answer 2"] }
  ```
- **Response:**
  ```json
  { "success": true, "data": { /* application object */ } }
  ```

### Submit Application
- **POST** `/applications/:id/submit`
- **Headers:** `Authorization: Bearer <token>`
- **Description:** Submit the job application for review.
- **Response:**
  ```json
  { "success": true, "data": { /* application object */ } }
  ```

---

## Application Tracking

### List Applicant's Applications
- **GET** `/applications?applicantId=...`
- **Headers:** `Authorization: Bearer <token>`
- **Description:** List all job applications for the logged-in applicant.
- **Response:**
  ```json
  { "success": true, "data": [ /* applications */ ] }
  ```

### Get Application Details
- **GET** `/applications/:id`
- **Headers:** `Authorization: Bearer <token>`
- **Description:** Get details of a specific job application.
- **Response:**
  ```json
  { "success": true, "data": { /* application object */ } }
  ```

### Edit Application
- **PUT** `/applications/:id`
- **Headers:** `Authorization: Bearer <token>`
- **Description:** Edit an existing job application.
- **Request Body:**
  ```json
  { /* fields to update */ }
  ```
- **Response:**
  ```json
  { "success": true, "data": { /* updated application object */ } }
  ```

### Cancel Application
- **DELETE** `/applications/:id`
- **Headers:** `Authorization: Bearer <token>`
- **Description:** Cancel (withdraw) a job application.
- **Response:**
  ```json
  { "success": true, "data": { /* application object */ } }
  ```

---

## Notifications

### Notify Applicant
- **POST** `/notifications`
- **Description:** Send a notification to an applicant (internal use).
- **Request Body:**
  ```json
  {
    "applicant_id": "<applicant_id>",
    "message": "Your application has been received.",
    "notification_type": "Job Application"
  }
  ```
- **Response:**
  ```json
  { "success": true, "data": { /* notification object */ } }
  ```

---

## Notes
- All endpoints requiring authentication expect a valid JWT token in the `Authorization` header.
- Use the `applicantId` query parameter to specify the applicant for profile and application endpoints.
- The API is designed for use by the online job portal frontend for applicant self-service.
- Registration and login are now handled via the User table, and a JWT is returned on successful login. 