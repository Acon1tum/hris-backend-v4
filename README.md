# HRIS Backend - Express TypeScript Prisma PostgreSQL

A comprehensive Human Resource Information System (HRIS) backend built with Express.js, TypeScript, Prisma ORM, and PostgreSQL. This modular system supports 12 different HR modules and can be easily extended or modified.

## 🏗️ Architecture

The application follows a modular architecture with the following structure:

```
src/
├── index.ts                          # Main application entry point
├── types/                            # Shared TypeScript types
├── utils/                            # Utility functions
├── shared/                           # Shared middleware and services
│   └── middleware/                   # Authentication, error handling, etc.
└── modules/                          # Feature modules
    ├── auth/                         # Authentication & Authorization
    ├── personnel-information-management/  # Employee management
    ├── timekeeping-attendance/       # Time tracking
    ├── leave-management/             # Leave requests
    ├── payroll-management/           # Payroll processing
    ├── recruitment/                  # Hiring process
    ├── online-job-application-portal/ # Public job applications
    ├── performance-management/       # Performance reviews
    ├── report-generation/            # Reports and analytics
    ├── learning-development/         # Training and development
    ├── system-administration/        # System configuration
    ├── employee-self-service/        # Employee portal
    └── health-wellness/              # Health and wellness
```

## 🚀 Features

### Core Features
- **Modular Architecture**: Each HR module is independent and can be enabled/disabled
- **Role-Based Access Control**: Granular permissions for different user roles
- **JWT Authentication**: Secure token-based authentication
- **Database Management**: Prisma ORM with PostgreSQL
- **API Documentation**: RESTful API endpoints
- **Error Handling**: Comprehensive error handling and logging
- **Validation**: Input validation and sanitization
- **Pagination**: Built-in pagination for large datasets

### HR Modules
1. **Personnel Information Management** - Employee records, profiles, history
2. **Timekeeping & Attendance** - Time tracking, schedules, DTR
3. **Leave Management** - Leave requests, balances, approvals
4. **Payroll Management** - Salary processing, deductions, loans
5. **Recruitment** - Job postings, applications, interviews
6. **Online Job Application Portal** - Public job applications
7. **Performance Management** - Reviews, KPIs, assessments
8. **Report Generation** - Analytics, reports, exports
9. **Learning & Development** - Training programs, courses
10. **System Administration** - Users, roles, permissions
11. **Employee Self Service** - Employee portal features
12. **Health & Wellness** - Health programs, wellness tracking

## 📋 Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v12 or higher)
- pnpm (recommended) or npm

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd hris-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env .env.local
   ```
   
   Edit `.env` with your database and configuration details:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/hris_db"
   JWT_SECRET="your-super-secret-jwt-key-here"
   JWT_REFRESH_SECRET="your-super-secret-refresh-key-here"
   PORT=3000
   NODE_ENV=development
   ```

4. **Set up the database**
   ```bash
   # Generate Prisma client
   npm run db:generate
   
   # Push schema to database
   npm run db:push
   
   # Seed the database with initial data
   npm run db:seed
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

## 🚀 Deployment

### Deploy to Render (Recommended)

This application is configured for easy deployment to Render with automatic database setup.

#### Quick Deploy (Using Blueprint)

1. **Push your code to GitHub** with the included `render.yaml` file
2. **Go to [Render.com](https://render.com)** and sign up/login
3. **Click "New +" → "Blueprint"**
4. **Connect your GitHub repository**
5. **Render will automatically**:
   - Create a PostgreSQL database
   - Deploy your web service
   - Configure all environment variables
   - Run database migrations

#### Manual Deploy

For detailed manual deployment instructions, see [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md)

#### Deployment Scripts

```bash
# Prepare for deployment
npm run deploy:prepare

# Run deployment helper script
npm run deploy:render
```

### Deploy to Other Platforms

The application includes a `Dockerfile` for containerized deployment on any platform that supports Docker.

## 🗄️ Database Setup

### Using PostgreSQL with pgAdmin4

1. **Install PostgreSQL** and **pgAdmin4**
2. **Create a new database** named `hris_db`
3. **Update the DATABASE_URL** in your `.env` file
4. **Run the database commands**:
   ```bash
   pnpm db:generate
   pnpm db:push
   pnpm db:seed
   ```

### Database Schema

The application uses Prisma with a comprehensive schema that includes:
- User management and authentication
- Personnel information and employment history
- Department and organizational structure
- Timekeeping and attendance tracking
- Leave management and balances
- Payroll processing and deductions
- Recruitment and job applications
- Performance reviews and assessments
- Training programs and learning management
- System administration and audit logs

## 🔐 Authentication

The system uses JWT tokens for authentication. Default users are created during seeding:

- **Admin**: `admin` / `Admin123!`
- **HR Manager**: `hr_manager` / `HR123!`
- **Employee**: `employee` / `Employee123!`

### API Authentication

Include the JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh-token` - Refresh JWT token
- `POST /api/auth/change-password` - Change password (protected)
- `POST /api/auth/logout` - User logout (protected)

### Personnel Management
- `GET /api/personnel` - Get all personnel (paginated)
- `GET /api/personnel/:id` - Get personnel by ID
- `POST /api/personnel` - Create new personnel
- `PUT /api/personnel/:id` - Update personnel
- `DELETE /api/personnel/:id` - Delete personnel
- `GET /api/personnel/stats` - Get personnel statistics

### Other Modules
Each module has its own set of endpoints following RESTful conventions.

## 📑 Available APIs by Module

### System Administration

#### User Management
| Method | Endpoint                                 | Description                                 |
|--------|------------------------------------------|---------------------------------------------|
| GET    | `/api/system/users`                      | List all users                              |
| GET    | `/api/system/users/:id`                  | Get user details by ID                      |
| POST   | `/api/system/users`                      | Create a new user                           |
| PUT    | `/api/system/users/:id`                  | Update user details                         |
| DELETE | `/api/system/users/:id`                  | Disable (soft delete) a user                |
| PATCH  | `/api/system/users/:id/password`         | Change a user's password                    |
| PATCH  | `/api/system/users/:id/roles`            | Assign roles to a user (replace all roles)  |

#### Role Management
| Method | Endpoint                                 | Description                                 |
|--------|------------------------------------------|---------------------------------------------|
| GET    | `/api/system/roles`                      | List all roles                              |
| GET    | `/api/system/roles/:id`                  | Get role details by ID                      |
| POST   | `/api/system/roles`                      | Create a new role                           |
| PUT    | `/api/system/roles/:id`                  | Update role details                         |
| DELETE | `/api/system/roles/:id`                  | Delete a role                               |
| PATCH  | `/api/system/roles/:id/permissions`      | Assign permissions to a role (replace all)  |

#### Permission Management
| Method | Endpoint                                 | Description                                 |
|--------|------------------------------------------|---------------------------------------------|
| GET    | `/api/system/permissions`                | List all possible permissions (from enum)   |

#### Audit Trail
| Method | Endpoint                                 | Description                                 |
|--------|------------------------------------------|---------------------------------------------|
| GET    | `/api/system/audit-logs`                 | List audit logs (supports filters)          |
| GET    | `/api/system/audit-logs/:id`             | Get details of a specific audit log         |

### Personnel Information Management Administration

#### Dashboard
| Method | Endpoint                                 | Description                                 |
|--------|------------------------------------------|---------------------------------------------|
| GET    | `/api/personnel/dashboard`               | Get dashboard statistics and summaries       |

#### Personnel 201 File
| Method | Endpoint                                 | Description                                 |
|--------|------------------------------------------|---------------------------------------------|
| GET    | `/api/personnel`                         | List all personnel records                   |
| POST   | `/api/personnel`                         | Create a new personnel record                |
| GET    | `/api/personnel/:id`                     | Get personnel details by ID                   |
| PUT    | `/api/personnel/:id`                     | Update personnel details                      |
| DELETE | `/api/personnel/:id`                     | Archive/remove a personnel record             |

##### Subsections (General Info, Employment, Membership, etc.)
| Method | Endpoint                                                    | Description                                 |
|--------|-------------------------------------------------------------|---------------------------------------------|
| GET    | `/api/personnel/:id/employment-records`                     | Get employment records for personnel        |
| POST   | `/api/personnel/:id/employment-records`                     | Add employment record                       |
| GET    | `/api/personnel/:id/membership-data`                        | Get membership data (GSIS, Pag-Ibig, etc)   |
| POST   | `/api/personnel/:id/membership-data`                        | Add membership data                         |
| GET    | `/api/personnel/:id/merits-violations`                      | Get merits & violations                     |
| POST   | `/api/personnel/:id/merits-violations`                      | Add merit or violation                      |
| GET    | `/api/personnel/:id/admin-cases`                            | Get administrative cases                    |
| POST   | `/api/personnel/:id/admin-cases`                            | Add administrative case                     |

#### Requests Management
| Method | Endpoint                                                    | Description                                 |
|--------|-------------------------------------------------------------|---------------------------------------------|
| GET    | `/api/personnel/requests`                                   | List all requests                           |
| GET    | `/api/personnel/requests/:id`                               | Get request details                         |
| POST   | `/api/personnel/requests`                                   | Create a new request                        |
| PUT    | `/api/personnel/requests/:id`                               | Update a request                            |
| DELETE | `/api/personnel/requests/:id`                               | Delete/cancel a request                     |

##### Request Types (examples)
| Method | Endpoint                                                    | Description                                 |
|--------|-------------------------------------------------------------|---------------------------------------------|
| GET    | `/api/personnel/requests/:id/leaves`                        | Get leave requests for personnel            |
| GET    | `/api/personnel/requests/:id/dtr-adjustments`               | Get DTR adjustment requests                 |
| GET    | `/api/personnel/requests/:id/certifications`                | Get certification requests                  |
| GET    | `/api/personnel/requests/:id/membership-forms`              | Get membership form requests                |
| GET    | `/api/personnel/requests/:id/monetizations`                 | Get monetization requests                   |
| GET    | `/api/personnel/requests/:id/documents`                     | Get document requests                       |

#### Personnel Movement
| Method | Endpoint                                                    | Description                                 |
|--------|-------------------------------------------------------------|---------------------------------------------|
| GET    | `/api/personnel/:id/movements`                              | List all movements for personnel            |
| POST   | `/api/personnel/:id/movements`                              | Add a new personnel movement                |
| GET    | `/api/personnel/:id/movements/:movementId`                  | Get details of a specific movement          |
| PUT    | `/api/personnel/:id/movements/:movementId`                  | Update a personnel movement                 |
| DELETE | `/api/personnel/:id/movements/:movementId`                  | Delete a personnel movement                 |

*Note: Endpoints and features may be expanded as development progresses.*

## 🧪 Testing Personnel 201 File Frontend Connection

The Personnel 201 File component in the frontend has been updated to connect to the backend API. Here's how to test the connection:

### Prerequisites
1. **Backend Setup**: Ensure the backend is running on `http://localhost:3000`
2. **Database Setup**: Run `pnpm db:seed` to populate test data
3. **Frontend Setup**: Ensure the frontend is running on `http://localhost:4200`

### Test Data Available
After seeding, you'll have these test users:
- **System Administrator**: `admin` / `Admin123!`
- **HR Manager**: `hr_manager` / `HR123!`  
- **Employee**: `employee` / `Employee123!`

### Testing Steps

1. **Start the backend:**
   ```bash
   cd hris-backend-v2
   pnpm dev
   ```

2. **Start the frontend:**
   ```bash
   cd hris-frontend
   ng serve
   ```

3. **Test the Personnel 201 File page:**
   - Navigate to: Personnel Information Management → Personnel 201 File
   - You should see the existing personnel records loaded from the database
   - Test pagination, search functionality
   - Test creating new personnel records
   - Test editing existing records
   - Test deleting records

### API Endpoints Used by Frontend

The Personnel 201 File component uses these endpoints:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/personnel?page=1&limit=10&search=term` | Get paginated personnel list |
| GET | `/api/personnel/:id` | Get specific personnel details |
| POST | `/api/personnel` | Create new personnel record |
| PUT | `/api/personnel/:id` | Update personnel record |
| DELETE | `/api/personnel/:id` | Delete personnel record |

### Expected Response Format

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-string",
      "first_name": "John",
      "last_name": "Doe",
      "middle_name": "Smith",
      "email": "john.doe@company.com",
      "contact_number": "+1234567890",
      "address": "123 Main St",
      "designation": "Software Engineer",
      "employment_type": "Regular",
      "date_hired": "2024-01-15T00:00:00.000Z",
      "salary": 50000,
      "gsis_number": "123456789",
      "pagibig_number": "987654321",
      "philhealth_number": "1122334455",
      "sss_number": "5566778899",
      "tin_number": "9988776655",
      "user": {
        "id": "user-uuid",
        "username": "john.doe",
        "email": "john.doe@company.com",
        "status": "Active"
      },
      "department": {
        "id": "dept-uuid",
        "department_name": "Information Technology"
      },
      "created_at": "2024-01-15T08:00:00.000Z",
      "updated_at": "2024-01-15T08:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 3,
    "pages": 1
  }
}
```

### Troubleshooting

**Common Issues:**

1. **CORS Error**: Verify `FRONTEND_URL=http://localhost:4200` in backend `.env`
2. **404 Not Found**: Ensure backend is running on port 3000
3. **Empty Data**: Run `pnpm db:seed` to populate test data
4. **Authentication Error**: The Personnel endpoints require authentication - ensure user is logged in

**Debug Steps:**
1. Check browser console for errors
2. Check backend console logs
3. Verify API calls in browser Network tab
4. Test API endpoints directly with Postman/curl

### Frontend Features Implemented

- ✅ **Data Loading**: Fetches personnel data from backend API
- ✅ **Pagination**: Server-side pagination with page controls
- ✅ **Search**: Server-side search by name or department
- ✅ **CRUD Operations**: Create, Read, Update, Delete personnel records
- ✅ **Loading States**: Shows loading indicators during API calls
- ✅ **Error Handling**: Displays error messages for failed requests
- ✅ **Data Transformation**: Maps backend data to frontend format

## 🔧 Development

### Available Scripts

```
```

### Online Job Application Portal Backend API Checklist

All endpoints below are implemented and available:

#### Applicant Authentication & Profile
| Method | Endpoint                                    | Description                                  |
|--------|---------------------------------------------|----------------------------------------------|
| POST   | `/api/job-portal/register`                  | Register a new external applicant            |
| POST   | `/api/job-portal/login`                     | Applicant login (returns JWT)                |
| GET    | `/api/job-portal/profile`                   | Get applicant profile (protected)            |
| PUT    | `/api/job-portal/profile`                   | Update applicant profile (protected)         |
| GET    | `/api/job-portal/profile/completion-status` | Check if profile is complete                 |

#### Job Listings
| Method | Endpoint                                    | Description                                  |
|--------|---------------------------------------------|----------------------------------------------|
| GET    | `/api/job-portal/jobs`                      | List all published job openings              |
| GET    | `/api/job-portal/jobs/:id`                  | Get details of a specific job                |

#### Job Application Process
| Method | Endpoint                                    | Description                                  |
|--------|---------------------------------------------|----------------------------------------------|
| POST   | `/api/job-portal/applications`              | Start a new job application                  |
| POST   | `/api/job-portal/applications/:id/upload`   | Upload required documents (resume, CSC, etc) |
| PUT    | `/api/job-portal/applications/:id/answers`  | Submit answers to application questions      |
| POST   | `/api/job-portal/applications/:id/submit`   | Submit the completed application             |

#### Application Summary & Status
| Method | Endpoint                                    | Description                                  |
|--------|---------------------------------------------|----------------------------------------------|
| GET    | `/api/job-portal/applications`              | List all applications by applicant           |
| GET    | `/api/job-portal/applications/:id`          | Get summary/status of a specific application |

#### Edit/Cancel Application
| Method | Endpoint                                    | Description                                  |
|--------|---------------------------------------------|----------------------------------------------|
| PUT    | `/api/job-portal/applications/:id`          | Edit application (before deadline)           |
| DELETE | `/api/job-portal/applications/:id`          | Cancel application (before deadline)         |

#### Notifications
| Method | Endpoint                                    | Description                                  |
|--------|---------------------------------------------|----------------------------------------------|
| POST   | `/api/job-portal/notifications`             | Notify applicant of submission status        |

---
**Notes:**
- All `/profile` and `/applications` endpoints require applicant authentication (JWT).
- File uploads are currently handled via base64 or file path in the request body (see endpoint docs below).
- Add pagination, filtering, and validation as needed.

---