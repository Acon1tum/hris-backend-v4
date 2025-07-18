# How to Create New API Connections (Frontend ↔ Backend)

This guide shows you how to create new API endpoints in your backend and connect them to your Angular frontend.

## 🎯 Example: Creating an Employee Management API

We'll create a complete CRUD (Create, Read, Update, Delete) API for employees as an example.

---

## Step 1: Create Backend API Endpoint

### 1.1 Create the Controller

Create `hris-backend-v2/src/modules/employees/employees.controller.ts`:

```typescript
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const employeesController = {
  // GET /api/employees - Get all employees
  async getAll(req: Request, res: Response) {
    try {
      const employees = await prisma.employee.findMany({
        include: {
          department: true,
          position: true
        }
      });
      
      res.json({
        success: true,
        data: employees,
        message: 'Employees retrieved successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve employees',
        error: error.message
      });
    }
  },

  // GET /api/employees/:id - Get single employee
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const employee = await prisma.employee.findUnique({
        where: { id: parseInt(id) },
        include: {
          department: true,
          position: true
        }
      });

      if (!employee) {
        return res.status(404).json({
          success: false,
          message: 'Employee not found'
        });
      }

      res.json({
        success: true,
        data: employee,
        message: 'Employee retrieved successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve employee',
        error: error.message
      });
    }
  },

  // POST /api/employees - Create new employee
  async create(req: Request, res: Response) {
    try {
      const employeeData = req.body;
      
      const newEmployee = await prisma.employee.create({
        data: employeeData,
        include: {
          department: true,
          position: true
        }
      });

      res.status(201).json({
        success: true,
        data: newEmployee,
        message: 'Employee created successfully'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Failed to create employee',
        error: error.message
      });
    }
  },

  // PUT /api/employees/:id - Update employee
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const updatedEmployee = await prisma.employee.update({
        where: { id: parseInt(id) },
        data: updateData,
        include: {
          department: true,
          position: true
        }
      });

      res.json({
        success: true,
        data: updatedEmployee,
        message: 'Employee updated successfully'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Failed to update employee',
        error: error.message
      });
    }
  },

  // DELETE /api/employees/:id - Delete employee
  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await prisma.employee.delete({
        where: { id: parseInt(id) }
      });

      res.json({
        success: true,
        message: 'Employee deleted successfully'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Failed to delete employee',
        error: error.message
      });
    }
  }
};
```

### 1.2 Create the Routes

Create `hris-backend-v2/src/modules/employees/employees.routes.ts`:

```typescript
import { Router } from 'express';
import { employeesController } from './employees.controller';

const router = Router();

// GET /api/employees - Get all employees
router.get('/', employeesController.getAll);

// GET /api/employees/:id - Get single employee
router.get('/:id', employeesController.getById);

// POST /api/employees - Create new employee
router.post('/', employeesController.create);

// PUT /api/employees/:id - Update employee
router.put('/:id', employeesController.update);

// DELETE /api/employees/:id - Delete employee
router.delete('/:id', employeesController.delete);

export { router as employeesRoutes };
```

### 1.3 Register Routes in Main App

Update `hris-backend-v2/src/index.ts`:

```typescript
// Import the new routes
import { employeesRoutes } from './modules/employees/employees.routes';

// Add this line with other route registrations
app.use('/api/employees', authMiddleware, employeesRoutes);
```

---

## Step 2: Create Frontend Service

### 2.1 Create Employee Interface

Create `hris-frontend/src/app/interfaces/employee.interface.ts`:

```typescript
export interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  departmentId: number;
  positionId: number;
  hireDate: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
  
  // Relations
  department?: {
    id: number;
    name: string;
  };
  position?: {
    id: number;
    title: string;
  };
}

export interface CreateEmployeeRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  departmentId: number;
  positionId: number;
  hireDate: string;
}

export interface UpdateEmployeeRequest extends Partial<CreateEmployeeRequest> {
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface EmployeeResponse {
  success: boolean;
  data: Employee;
  message: string;
}

export interface EmployeesResponse {
  success: boolean;
  data: Employee[];
  message: string;
}
```

### 2.2 Create Employee Service

Create `hris-frontend/src/app/services/employee.service.ts`:

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { 
  Employee, 
  CreateEmployeeRequest, 
  UpdateEmployeeRequest,
  EmployeeResponse,
  EmployeesResponse 
} from '../interfaces/employee.interface';

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private apiUrl = `${environment.apiUrl}/employees`;

  constructor(private http: HttpClient) {}

  // GET /api/employees - Get all employees
  getEmployees(): Observable<EmployeesResponse> {
    return this.http.get<EmployeesResponse>(this.apiUrl);
  }

  // GET /api/employees/:id - Get single employee
  getEmployee(id: number): Observable<EmployeeResponse> {
    return this.http.get<EmployeeResponse>(`${this.apiUrl}/${id}`);
  }

  // POST /api/employees - Create new employee
  createEmployee(employee: CreateEmployeeRequest): Observable<EmployeeResponse> {
    return this.http.post<EmployeeResponse>(this.apiUrl, employee);
  }

  // PUT /api/employees/:id - Update employee
  updateEmployee(id: number, employee: UpdateEmployeeRequest): Observable<EmployeeResponse> {
    return this.http.put<EmployeeResponse>(`${this.apiUrl}/${id}`, employee);
  }

  // DELETE /api/employees/:id - Delete employee
  deleteEmployee(id: number): Observable<{success: boolean; message: string}> {
    return this.http.delete<{success: boolean; message: string}>(`${this.apiUrl}/${id}`);
  }
}
```

---

## Step 3: Create Frontend Component

### 3.1 Generate Component

```bash
cd hris-frontend
ng generate component features/employees/employee-list
```

### 3.2 Create Employee List Component

Update `hris-frontend/src/app/features/employees/employee-list/employee-list.component.ts`:

```typescript
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmployeeService } from '../../../services/employee.service';
import { Employee } from '../../../interfaces/employee.interface';

@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './employee-list.component.html',
  styleUrls: ['./employee-list.component.scss']
})
export class EmployeeListComponent implements OnInit {
  employees: Employee[] = [];
  loading = false;
  error: string | null = null;

  constructor(private employeeService: EmployeeService) {}

  ngOnInit() {
    this.loadEmployees();
  }

  loadEmployees() {
    this.loading = true;
    this.error = null;

    this.employeeService.getEmployees().subscribe({
      next: (response) => {
        if (response.success) {
          this.employees = response.data;
        } else {
          this.error = 'Failed to load employees';
        }
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Error loading employees: ' + error.message;
        this.loading = false;
        console.error('Error loading employees:', error);
      }
    });
  }

  deleteEmployee(id: number) {
    if (confirm('Are you sure you want to delete this employee?')) {
      this.employeeService.deleteEmployee(id).subscribe({
        next: (response) => {
          if (response.success) {
            this.employees = this.employees.filter(emp => emp.id !== id);
          }
        },
        error: (error) => {
          this.error = 'Error deleting employee: ' + error.message;
          console.error('Error deleting employee:', error);
        }
      });
    }
  }
}
```

### 3.3 Create Component Template

Update `hris-frontend/src/app/features/employees/employee-list/employee-list.component.html`:

```html
<div class="employee-list">
  <h2>Employee Management</h2>

  <!-- Loading State -->
  <div *ngIf="loading" class="loading">
    Loading employees...
  </div>

  <!-- Error State -->
  <div *ngIf="error" class="error">
    {{ error }}
    <button (click)="loadEmployees()">Retry</button>
  </div>

  <!-- Employee List -->
  <div *ngIf="!loading && !error" class="employees">
    <div class="actions">
      <button class="btn btn-primary">Add New Employee</button>
    </div>

    <table class="employee-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Department</th>
          <th>Position</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let employee of employees">
          <td>{{ employee.firstName }} {{ employee.lastName }}</td>
          <td>{{ employee.email }}</td>
          <td>{{ employee.department?.name || 'N/A' }}</td>
          <td>{{ employee.position?.title || 'N/A' }}</td>
          <td>
            <span class="status" [class.active]="employee.status === 'ACTIVE'">
              {{ employee.status }}
            </span>
          </td>
          <td>
            <button class="btn btn-sm btn-secondary">Edit</button>
            <button class="btn btn-sm btn-danger" (click)="deleteEmployee(employee.id)">
              Delete
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <div *ngIf="employees.length === 0" class="no-data">
      No employees found.
    </div>
  </div>
</div>
```

---

## Step 4: Test the Connection

### 4.1 Add Route to Frontend

Update your routing to include the new component:

```typescript
// In your app routing
{
  path: 'employees',
  component: EmployeeListComponent
}
```

### 4.2 Test Backend Endpoint

```bash
# Test the API directly
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/employees
```

### 4.3 Test Frontend Integration

1. Start both applications:
   ```bash
   # Backend
   cd hris-backend-v2 && npm run dev
   
   # Frontend
   cd hris-frontend && npm start
   ```

2. Navigate to `http://localhost:4200/employees`
3. Check Developer Tools → Network tab for API calls
4. Verify data loads correctly

---

## Step 5: Add Error Handling & Loading States

### 5.1 Add Global Error Interceptor

Create `hris-frontend/src/app/interceptors/error.interceptor.ts`:

```typescript
import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpErrorResponse } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler) {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        let errorMessage = 'An error occurred';
        
        if (error.error instanceof ErrorEvent) {
          // Client-side error
          errorMessage = error.error.message;
        } else {
          // Server-side error
          errorMessage = error.error?.message || `Error Code: ${error.status}`;
        }
        
        console.error('API Error:', errorMessage);
        return throwError(() => new Error(errorMessage));
      })
    );
  }
}
```

### 5.2 Register Error Interceptor

In your `main.ts` or app configuration:

```typescript
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { ErrorInterceptor } from './interceptors/error.interceptor';

// Add to providers
providers: [
  {
    provide: HTTP_INTERCEPTORS,
    useClass: ErrorInterceptor,
    multi: true
  }
]
```

---

## Step 6: Add Form for Creating/Editing

### 6.1 Create Employee Form Component

```bash
ng generate component features/employees/employee-form
```

### 6.2 Implement Form Component

```typescript
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { EmployeeService } from '../../../services/employee.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-employee-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './employee-form.component.html'
})
export class EmployeeFormComponent implements OnInit {
  employeeForm: FormGroup;
  loading = false;
  error: string | null = null;

  constructor(
    private fb: FormBuilder,
    private employeeService: EmployeeService,
    private router: Router
  ) {
    this.employeeForm = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      departmentId: [null, [Validators.required]],
      positionId: [null, [Validators.required]],
      hireDate: ['', [Validators.required]]
    });
  }

  ngOnInit() {}

  onSubmit() {
    if (this.employeeForm.valid) {
      this.loading = true;
      this.error = null;

      this.employeeService.createEmployee(this.employeeForm.value).subscribe({
        next: (response) => {
          if (response.success) {
            this.router.navigate(['/employees']);
          }
          this.loading = false;
        },
        error: (error) => {
          this.error = error.message;
          this.loading = false;
        }
      });
    }
  }
}
```

---

## 🔧 Template for Creating Any New API Connection

### Quick Template

1. **Backend**: Create `controller.ts` and `routes.ts`
2. **Frontend**: Create `interface.ts` and `service.ts`
3. **Component**: Create component to use the service
4. **Test**: Verify the connection works

### File Structure Template

```
Backend:
├── src/modules/[feature-name]/
│   ├── [feature].controller.ts
│   └── [feature].routes.ts

Frontend:
├── src/app/interfaces/
│   └── [feature].interface.ts
├── src/app/services/
│   └── [feature].service.ts
└── src/app/features/[feature-name]/
    ├── [feature]-list/
    └── [feature]-form/
```

---

## ✅ Testing Checklist

When creating new API connections:

- [ ] Backend route registered in main app
- [ ] Backend controller methods handle errors
- [ ] Frontend service methods typed correctly
- [ ] Frontend components handle loading states
- [ ] Frontend components handle error states
- [ ] API calls include authentication headers
- [ ] Network tab shows correct API calls
- [ ] Data displays correctly in UI
- [ ] CRUD operations work as expected

---

## 🚀 Quick Commands

```bash
# Test new API endpoint
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3000/api/[your-endpoint]

# Generate new Angular service
ng generate service services/[feature-name]

# Generate new Angular component
ng generate component features/[feature-name]/[component-name]
```

Now you can follow this pattern to create any new API connection between your frontend and backend! 