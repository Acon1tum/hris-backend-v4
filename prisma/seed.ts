import { PrismaClient, Status, Gender, CivilStatus, EmploymentType, PostingStatus, ApprovalStatus, RoleType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Helper function to pick only allowed fields
function pickJobPostingFields(job) {
  return {
    position_title: job.position_title,
    department_id: job.department_id,
    job_description: job.job_description,
    qualifications: job.qualifications,
    technical_competencies: job.technical_competencies,
    salary_range: job.salary_range,
    employment_type: job.employment_type,
    num_vacancies: job.num_vacancies,
    application_deadline: job.application_deadline,
    posting_status: job.posting_status,
    created_by: job.created_by
  };
}

function pickJobApplicantFields(applicant) {
  return {
    first_name: applicant.first_name,
    last_name: applicant.last_name,
    middle_name: applicant.middle_name,
    email: applicant.email,
    phone: applicant.phone,
    current_employer: applicant.current_employer,
    highest_education: applicant.highest_education,
    resume_path: applicant.resume_path,
    is_existing_employee: applicant.is_existing_employee,
    application_date: applicant.application_date
  };
}

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create default departments
  const departments = [
    { name: 'Engineering', description: 'Engineering Department' },
    { name: 'Human Resources', description: 'HR Department' },
    { name: 'Marketing', description: 'Marketing Department' },
    { name: 'Sales', description: 'Sales Department' },
    { name: 'Finance', description: 'Finance Department' },
    { name: 'Operations', description: 'Operations Department' },
    { name: 'Other', description: 'Other Department' }
  ];

  const createdDepartments: { [key: string]: string } = {};
  for (const dept of departments) {
    const department = await prisma.department.upsert({
      where: { department_name: dept.name },
      update: {},
      create: {
        department_name: dept.name,
        description: dept.description
      }
    });
    createdDepartments[dept.name] = department.id;
  }

  console.log('✅ Departments created');

  // Create default admin user with detailed personnel information
  const hashedPassword = await bcrypt.hash('Admin123!', 12);
  
  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@company.com',
      password_hash: hashedPassword,
      status: Status.Active,
      role: RoleType.Admin, // <-- assign role directly
      personnel: {
        create: {
          first_name: 'System',
          last_name: 'Administrator',
          middle_name: 'Admin',
          date_of_birth: new Date('1985-01-15'),
          gender: Gender.Male,
          civil_status: CivilStatus.Single,
          contact_number: '+63-917-123-4567',
          address: '123 Admin Street, Business District, Metro Manila, Philippines',
          department_id: createdDepartments['Engineering'],
          designation: 'System Administrator',
          employment_type: EmploymentType.Full_Time,
          date_hired: new Date('2020-01-01'),
          salary: 80000,
          gsis_number: 'GSIS-001122334455',
          pagibig_number: 'HDMF-112233445566',
          philhealth_number: 'PH-123456789012',
          sss_number: 'SSS-001122334455',
          tin_number: 'TIN-123456789'
        }
      }
    }
  });

  // Create sample HR user with detailed personnel information
  const hrPassword = await bcrypt.hash('HR123!', 12);
  
  const hrUser = await prisma.user.upsert({
    where: { username: 'hr_manager' },
    update: {},
    create: {
      username: 'hr_manager',
      email: 'hr@company.com',
      password_hash: hrPassword,
      status: Status.Active,
      role: RoleType.HR, // <-- assign role directly
      personnel: {
        create: {
          first_name: 'Maria',
          last_name: 'Santos',
          middle_name: 'Reyes',
          date_of_birth: new Date('1988-03-22'),
          gender: Gender.Female,
          civil_status: CivilStatus.Married,
          contact_number: '+63-928-234-5678',
          address: '456 HR Avenue, Makati City, Metro Manila, Philippines',
          department_id: createdDepartments['Human Resources'],
          designation: 'HR Manager',
          employment_type: EmploymentType.Full_Time,
          date_hired: new Date('2019-06-15'),
          salary: 65000,
          gsis_number: 'GSIS-223344556677',
          pagibig_number: 'HDMF-223344556677',
          philhealth_number: 'PH-234567890123',
          sss_number: 'SSS-223344556677',
          tin_number: 'TIN-234567890'
        }
      }
    }
  });

  // Create sample employee user with detailed personnel information
  const employeePassword = await bcrypt.hash('Employee123!', 12);
  
  const employeeUser = await prisma.user.upsert({
    where: { username: 'employee' },
    update: {},
    create: {
      username: 'employee',
      email: 'employee@company.com',
      password_hash: employeePassword,
      status: Status.Active,
      role: RoleType.Employee, // <-- assign role directly
      personnel: {
        create: {
          first_name: 'Juan',
          last_name: 'Cruz',
          middle_name: 'dela',
          date_of_birth: new Date('1992-07-08'),
          gender: Gender.Male,
          civil_status: CivilStatus.Single,
          contact_number: '+63-939-345-6789',
          address: '789 Employee Road, Quezon City, Metro Manila, Philippines',
          department_id: createdDepartments['Engineering'],
          designation: 'Software Developer',
          employment_type: EmploymentType.Full_Time,
          date_hired: new Date('2021-03-01'),
          salary: 45000,
          gsis_number: 'GSIS-334455667788',
          pagibig_number: 'HDMF-334455667788',
          philhealth_number: 'PH-345678901234',
          sss_number: 'SSS-334455667788',
          tin_number: 'TIN-345678901'
        }
      }
    }
  });

  // Create additional sample employees with varied profiles
  const additionalEmployees = [
    {
      username: 'finance_head',
      email: 'finance@company.com',
      password: 'Finance123!',
      personnel: {
        first_name: 'Ana',
        last_name: 'Garcia',
        middle_name: 'Lopez',
        date_of_birth: new Date('1986-11-12'),
        gender: Gender.Female,
        civil_status: CivilStatus.Married,
        contact_number: '+63-917-456-7890',
        address: '321 Finance Street, BGC, Taguig City, Metro Manila, Philippines',
        department_id: createdDepartments['Finance'],
        designation: 'Finance Manager',
        employment_type: EmploymentType.Full_Time,
        date_hired: new Date('2018-09-01'),
        salary: 70000,
        gsis_number: 'GSIS-445566778899',
        pagibig_number: 'HDMF-445566778899',
        philhealth_number: 'PH-456789012345',
        sss_number: 'SSS-445566778899',
        tin_number: 'TIN-456789012'
      }
    },
    {
      username: 'marketing_lead',
      email: 'marketing@company.com',
      password: 'Marketing123!',
      personnel: {
        first_name: 'Carlos',
        last_name: 'Rodriguez',
        middle_name: 'Miguel',
        date_of_birth: new Date('1990-04-25'),
        gender: Gender.Male,
        civil_status: CivilStatus.Single,
        contact_number: '+63-928-567-8901',
        address: '654 Marketing Plaza, Ortigas Center, Pasig City, Metro Manila, Philippines',
        department_id: createdDepartments['Marketing'],
        designation: 'Marketing Specialist',
        employment_type: EmploymentType.Full_Time,
        date_hired: new Date('2020-11-15'),
        salary: 50000,
        gsis_number: 'GSIS-556677889900',
        pagibig_number: 'HDMF-556677889900',
        philhealth_number: 'PH-567890123456',
        sss_number: 'SSS-556677889900',
        tin_number: 'TIN-567890123'
      }
    },
    {
      username: 'operations_mgr',
      email: 'operations@company.com',
      password: 'Operations123!',
      personnel: {
        first_name: 'Elena',
        last_name: 'Fernandez',
        middle_name: 'Santos',
        date_of_birth: new Date('1987-09-30'),
        gender: Gender.Female,
        civil_status: CivilStatus.Divorced,
        contact_number: '+63-939-678-9012',
        address: '987 Operations Center, Alabang, Muntinlupa City, Metro Manila, Philippines',
        department_id: createdDepartments['Operations'],
        designation: 'Operations Manager',
        employment_type: EmploymentType.Full_Time,
        date_hired: new Date('2019-02-01'),
        salary: 60000,
        gsis_number: 'GSIS-667788990011',
        pagibig_number: 'HDMF-667788990011',
        philhealth_number: 'PH-678901234567',
        sss_number: 'SSS-667788990011',
        tin_number: 'TIN-678901234'
      }
    }
  ];

  for (const emp of additionalEmployees) {
    const hashedEmpPassword = await bcrypt.hash(emp.password, 12);
    
    const newUser = await prisma.user.upsert({
      where: { username: emp.username },
      update: {},
      create: {
        username: emp.username,
        email: emp.email,
        password_hash: hashedEmpPassword,
        status: Status.Active,
        role: RoleType.Employee, // <-- assign role directly
        personnel: {
          create: emp.personnel
        }
      }
    });
  }

  console.log('✅ Additional employees created');

  // Create default leave types
  const leaveTypes = [
    { name: 'Vacation Leave', description: 'Annual vacation leave', max_days: 15 },
    { name: 'Sick Leave', description: 'Medical leave', max_days: 15 },
    { name: 'Maternity Leave', description: 'Maternity leave', max_days: 105 },
    { name: 'Paternity Leave', description: 'Paternity leave', max_days: 7 },
    { name: 'Personal Leave', description: 'Personal leave', max_days: 3 }
  ];

  for (const leaveType of leaveTypes) {
    // Find existing leave type by name
    const existing = await prisma.leaveType.findFirst({ where: { leave_type_name: leaveType.name } });
    if (existing) {
      await prisma.leaveType.update({
        where: { id: existing.id },
        data: {
          description: leaveType.description,
          max_days: leaveType.max_days,
          is_active: true
        }
      });
    } else {
      await prisma.leaveType.create({
        data: {
          leave_type_name: leaveType.name,
          description: leaveType.description,
          max_days: leaveType.max_days,
          is_active: true
        }
      });
    }
  }

  console.log('✅ Leave types created');

  // --- Sample Job Postings ---
  const sampleJobs = [
    {
      position_title: 'Software Engineer',
      department_id: createdDepartments['Engineering'],
      job_description: 'Develop and maintain web applications.',
      qualifications: 'BS Computer Science or related, 2+ years experience.',
      technical_competencies: 'Node.js, Angular, PostgreSQL',
      salary_range: '45000-70000',
      employment_type: EmploymentType.Full_Time,
      num_vacancies: 2,
      application_deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      posting_status: PostingStatus.Published,
      created_by: adminUser.id
    },
    {
      position_title: 'HR Assistant',
      department_id: createdDepartments['Human Resources'],
      job_description: 'Assist with HR operations and recruitment.',
      qualifications: 'BS Psychology or HRDM, 1+ year experience.',
      technical_competencies: 'MS Office, Communication',
      salary_range: '25000-35000',
      employment_type: EmploymentType.Contractual,
      num_vacancies: 1,
      application_deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
      posting_status: PostingStatus.Published,
      created_by: hrUser.id
    },
    {
      position_title: 'Finance Analyst',
      department_id: createdDepartments['Finance'],
      job_description: 'Analyze financial data and prepare reports.',
      qualifications: 'BS Accountancy, CPA preferred.',
      technical_competencies: 'Excel, SAP',
      salary_range: '30000-50000',
      employment_type: EmploymentType.Full_Time,
      num_vacancies: 1,
      application_deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      posting_status: PostingStatus.Draft,
      created_by: adminUser.id
    },
    // --- Additional diverse job postings ---
    {
      position_title: 'IT Support Specialist',
      department_id: createdDepartments['Engineering'],
      job_description: 'Provide technical support and troubleshoot IT issues.',
      qualifications: 'BS IT or related, 1+ year experience.',
      technical_competencies: 'Windows, Networking, Helpdesk',
      salary_range: '25000-35000',
      employment_type: EmploymentType.Contractual,
      num_vacancies: 2,
      application_deadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
      posting_status: PostingStatus.Published,
      created_by: adminUser.id
    },
    {
      position_title: 'Payroll Officer',
      department_id: createdDepartments['Finance'],
      job_description: 'Manage payroll processing and employee compensation.',
      qualifications: 'BS Accountancy or Finance, 2+ years experience.',
      technical_competencies: 'Payroll systems, Excel',
      salary_range: '35000-45000',
      employment_type: EmploymentType.Full_Time,
      num_vacancies: 1,
      application_deadline: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000),
      posting_status: PostingStatus.Published,
      created_by: adminUser.id
    },
    {
      position_title: 'Marketing Coordinator',
      department_id: createdDepartments['Marketing'],
      job_description: 'Coordinate marketing campaigns and events.',
      qualifications: 'BS Marketing, 1+ year experience.',
      technical_competencies: 'Event planning, Social media',
      salary_range: '28000-38000',
      employment_type: EmploymentType.Full_Time,
      num_vacancies: 1,
      application_deadline: new Date(Date.now() + 22 * 24 * 60 * 60 * 1000),
      posting_status: PostingStatus.Published,
      created_by: hrUser.id
    },
    {
      position_title: 'Operations Supervisor',
      department_id: createdDepartments['Operations'],
      job_description: 'Supervise daily operations and ensure process efficiency.',
      qualifications: 'BS Business Administration, 3+ years experience.',
      technical_competencies: 'Process improvement, Leadership',
      salary_range: '40000-55000',
      employment_type: EmploymentType.Full_Time,
      num_vacancies: 1,
      application_deadline: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
      posting_status: PostingStatus.Published,
      created_by: adminUser.id
    },
    {
      position_title: 'Junior Accountant',
      department_id: createdDepartments['Finance'],
      job_description: 'Assist in financial reporting and bookkeeping.',
      qualifications: 'BS Accountancy, fresh graduates welcome.',
      technical_competencies: 'Bookkeeping, QuickBooks',
      salary_range: '22000-30000',
      employment_type: EmploymentType.Probationary,
      num_vacancies: 2,
      application_deadline: new Date(Date.now() + 17 * 24 * 60 * 60 * 1000),
      posting_status: PostingStatus.Published,
      created_by: hrUser.id
    },
    {
      position_title: 'Content Writer',
      department_id: createdDepartments['Marketing'],
      job_description: 'Write and edit content for marketing materials.',
      qualifications: 'BA English, Journalism, or related.',
      technical_competencies: 'Writing, Editing, SEO',
      salary_range: '20000-28000',
      employment_type: EmploymentType.Part_time,
      num_vacancies: 1,
      application_deadline: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
      posting_status: PostingStatus.Draft,
      created_by: hrUser.id
    },
    {
      position_title: 'Business Analyst',
      department_id: createdDepartments['Operations'],
      job_description: 'Analyze business processes and recommend improvements.',
      qualifications: 'BS Business, 2+ years experience.',
      technical_competencies: 'Data analysis, Reporting',
      salary_range: '35000-50000',
      employment_type: EmploymentType.Full_Time,
      num_vacancies: 1,
      application_deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
      posting_status: PostingStatus.Published,
      created_by: adminUser.id
    },
    {
      position_title: 'Recruitment Specialist',
      department_id: createdDepartments['Human Resources'],
      job_description: 'Handle end-to-end recruitment process.',
      qualifications: 'BS Psychology or HRDM, 2+ years experience.',
      technical_competencies: 'Interviewing, Sourcing',
      salary_range: '30000-40000',
      employment_type: EmploymentType.Full_Time,
      num_vacancies: 1,
      application_deadline: new Date(Date.now() + 19 * 24 * 60 * 60 * 1000),
      posting_status: PostingStatus.Published,
      created_by: hrUser.id
    },
    {
      position_title: 'Network Administrator',
      department_id: createdDepartments['Engineering'],
      job_description: 'Maintain and secure company network infrastructure.',
      qualifications: 'BS IT, 3+ years experience.',
      technical_competencies: 'Networking, Security, Cisco',
      salary_range: '40000-60000',
      employment_type: EmploymentType.Full_Time,
      num_vacancies: 1,
      application_deadline: new Date(Date.now() + 27 * 24 * 60 * 60 * 1000),
      posting_status: PostingStatus.Published,
      created_by: adminUser.id
    },
    {
      position_title: 'Executive Assistant',
      department_id: createdDepartments['Operations'],
      job_description: 'Provide administrative support to executives.',
      qualifications: 'BS Office Administration, 2+ years experience.',
      technical_competencies: 'Scheduling, Communication',
      salary_range: '30000-40000',
      employment_type: EmploymentType.Contractual,
      num_vacancies: 1,
      application_deadline: new Date(Date.now() + 16 * 24 * 60 * 60 * 1000),
      posting_status: PostingStatus.Published,
      created_by: hrUser.id
    },
    {
      position_title: 'Graphic Designer',
      department_id: createdDepartments['Marketing'],
      job_description: 'Design graphics for digital and print media.',
      qualifications: 'BS Multimedia Arts, 1+ year experience.',
      technical_competencies: 'Photoshop, Illustrator',
      salary_range: '25000-35000',
      employment_type: EmploymentType.Full_Time,
      num_vacancies: 1,
      application_deadline: new Date(Date.now() + 23 * 24 * 60 * 60 * 1000),
      posting_status: PostingStatus.Published,
      created_by: adminUser.id
    }
  ];

  const createdJobs: { id: string }[] = [];
  for (const job of sampleJobs) {
    const created = await prisma.jobPosting.create({
      data: pickJobPostingFields(job)
    });
    createdJobs.push(created);
  }
  console.log('✅ Sample job postings created');

  // --- Sample Job Applicants ---
  const sampleApplicants = [
    {
      first_name: 'Alice',
      last_name: 'Garcia',
      middle_name: 'Lopez',
      email: 'alice.garcia@email.com',
      phone: '+639171234567',
      current_employer: 'ABC Corp',
      highest_education: 'BS Computer Science',
      resume_path: null,
      is_existing_employee: false,
      application_date: new Date()
    },
    {
      first_name: 'Bob',
      last_name: 'Reyes',
      middle_name: 'Santos',
      email: 'bob.reyes@email.com',
      phone: '+639182345678',
      current_employer: 'XYZ Inc',
      highest_education: 'BS Psychology',
      resume_path: null,
      is_existing_employee: false,
      application_date: new Date()
    }
  ];

  const createdApplicants: { id: string }[] = [];
  for (const applicant of sampleApplicants) {
    const user = await prisma.user.create({
      data: {
        username: applicant.email.split('@')[0], // or any unique username logic
        email: applicant.email,
        password_hash: await bcrypt.hash('Applicant123!', 12),
        status: Status.Active,
        role: RoleType.Applicant,
        // ...other user fields as needed
      }
    });

    const created = await prisma.jobApplicant.create({
      data: {
        ...pickJobApplicantFields(applicant),
        user: { connect: { id: user.id } }
      }
    });
    createdApplicants.push(created);
  }
  console.log('✅ Sample job applicants created');

  // --- Sample Job Applications ---
  if (createdJobs.length > 0 && createdApplicants.length > 0) {
    await prisma.jobApplication.create({
      data: {
        position_id: createdJobs[0].id,
        applicant_id: createdApplicants[0].id,
        cover_letter: 'I am excited to apply for the Software Engineer position.'
      }
    });
    await prisma.jobApplication.create({
      data: {
        position_id: createdJobs[1].id,
        applicant_id: createdApplicants[1].id,
        cover_letter: 'Looking forward to joining your HR team.'
      }
    });
    console.log('✅ Sample job applications created');
  }

  // Get all personnel and leave types for creating balances and applications
  const allPersonnel = await prisma.personnel.findMany();
  const allLeaveTypes = await prisma.leaveType.findMany();
  const currentYear = new Date().getFullYear().toString();

  // Create leave balances for all personnel
  console.log('🌱 Creating leave balances...');
  for (const personnel of allPersonnel) {
    for (const leaveType of allLeaveTypes) {
      let totalCredits = 15; // Default credits
      
      // Assign different credits based on leave type
      if (leaveType.leave_type_name === 'Vacation Leave') totalCredits = 15;
      else if (leaveType.leave_type_name === 'Sick Leave') totalCredits = 15;
      else if (leaveType.leave_type_name === 'Maternity Leave') totalCredits = 105;
      else if (leaveType.leave_type_name === 'Paternity Leave') totalCredits = 7;
      else if (leaveType.leave_type_name === 'Personal Leave') totalCredits = 3;

      await prisma.leaveBalance.upsert({
        where: {
          personnel_id_leave_type_id_year: {
            personnel_id: personnel.id,
            leave_type_id: leaveType.id,
            year: currentYear
          }
        },
        update: {},
        create: {
          personnel_id: personnel.id,
          leave_type_id: leaveType.id,
          year: currentYear,
          total_credits: totalCredits,
          used_credits: 0,
          earned_credits: totalCredits
        }
      });
    }
  }

  console.log('✅ Leave balances created');

  // Create sample leave applications
  console.log('🌱 Creating sample leave applications...');
  
  if (allPersonnel.length > 0 && allLeaveTypes.length > 0) {
    const vacationLeave = allLeaveTypes.find(lt => lt.leave_type_name === 'Vacation Leave');
    const sickLeave = allLeaveTypes.find(lt => lt.leave_type_name === 'Sick Leave');
    const personalLeave = allLeaveTypes.find(lt => lt.leave_type_name === 'Personal Leave');

    const sampleApplications = [
      // Recent and future applications
      {
        personnel_id: allPersonnel[0].id, // Admin
        leave_type_id: vacationLeave?.id || allLeaveTypes[0].id,
        start_date: new Date('2024-12-15'),
        end_date: new Date('2024-12-20'),
        total_days: 6,
        status: ApprovalStatus.Approved,
        reason: 'Year-end vacation with family'
      },
      {
        personnel_id: allPersonnel[1].id, // HR Manager
        leave_type_id: sickLeave?.id || allLeaveTypes[1].id,
        start_date: new Date('2024-11-25'),
        end_date: new Date('2024-11-26'),
        total_days: 2,
        status: ApprovalStatus.Approved,
        reason: 'Medical checkup and recovery',
        supporting_document: 'medical_certificate_nov2024.pdf'
      },
      {
        personnel_id: allPersonnel[2].id, // Employee
        leave_type_id: personalLeave?.id || allLeaveTypes[4].id,
        start_date: new Date('2024-12-02'),
        end_date: new Date('2024-12-02'),
        total_days: 1,
        status: ApprovalStatus.Pending,
        reason: 'Personal appointment'
      },
      {
        personnel_id: allPersonnel.length > 3 ? allPersonnel[3].id : allPersonnel[0].id, // Finance Head or fallback
        leave_type_id: vacationLeave?.id || allLeaveTypes[0].id,
        start_date: new Date('2024-12-23'),
        end_date: new Date('2024-12-30'),
        total_days: 8,
        status: ApprovalStatus.Pending,
        reason: 'Christmas and New Year holiday'
      },
      {
        personnel_id: allPersonnel.length > 4 ? allPersonnel[4].id : allPersonnel[1].id, // Marketing Lead or fallback
        leave_type_id: sickLeave?.id || allLeaveTypes[1].id,
        start_date: new Date('2024-10-15'),
        end_date: new Date('2024-10-16'),
        total_days: 2,
        status: ApprovalStatus.Rejected,
        reason: 'Flu symptoms'
      },
      {
        personnel_id: allPersonnel.length > 5 ? allPersonnel[5].id : allPersonnel[2].id, // Operations Manager or fallback
        leave_type_id: vacationLeave?.id || allLeaveTypes[0].id,
        start_date: new Date('2024-11-18'),
        end_date: new Date('2024-11-22'),
        total_days: 5,
        status: ApprovalStatus.Approved,
        reason: 'Wedding anniversary celebration'
      },
      // Additional diverse applications
      {
        personnel_id: allPersonnel[0].id, // Admin
        leave_type_id: sickLeave?.id || allLeaveTypes[1].id,
        start_date: new Date('2024-09-10'),
        end_date: new Date('2024-09-12'),
        total_days: 3,
        status: ApprovalStatus.Approved,
        reason: 'Recovery from minor surgery',
        supporting_document: 'medical_certificate_sep2024.pdf'
      },
      {
        personnel_id: allPersonnel[1].id, // HR Manager
        leave_type_id: personalLeave?.id || allLeaveTypes[4].id,
        start_date: new Date('2024-08-20'),
        end_date: new Date('2024-08-20'),
        total_days: 1,
        status: ApprovalStatus.Approved,
        reason: 'Attend child\'s school event'
      },
      {
        personnel_id: allPersonnel[2].id, // Employee
        leave_type_id: vacationLeave?.id || allLeaveTypes[0].id,
        start_date: new Date('2024-07-15'),
        end_date: new Date('2024-07-19'),
        total_days: 5,
        status: ApprovalStatus.Approved,
        reason: 'Summer vacation with family'
      },
      {
        personnel_id: allPersonnel.length > 3 ? allPersonnel[3].id : allPersonnel[0].id, // Finance Head or fallback
        leave_type_id: sickLeave?.id || allLeaveTypes[1].id,
        start_date: new Date('2024-06-25'),
        end_date: new Date('2024-06-26'),
        total_days: 2,
        status: ApprovalStatus.Approved,
        reason: 'Migraine and rest',
        supporting_document: 'medical_certificate_june2024.pdf'
      },
      // Future applications (pending approval)
      {
        personnel_id: allPersonnel.length > 4 ? allPersonnel[4].id : allPersonnel[1].id, // Marketing Lead or fallback
        leave_type_id: vacationLeave?.id || allLeaveTypes[0].id,
        start_date: new Date('2025-01-15'),
        end_date: new Date('2025-01-17'),
        total_days: 3,
        status: ApprovalStatus.Pending,
        reason: 'Extended weekend trip'
      },
      {
        personnel_id: allPersonnel.length > 5 ? allPersonnel[5].id : allPersonnel[2].id, // Operations Manager or fallback
        leave_type_id: personalLeave?.id || allLeaveTypes[4].id,
        start_date: new Date('2025-02-10'),
        end_date: new Date('2025-02-10'),
        total_days: 1,
        status: ApprovalStatus.Pending,
        reason: 'Legal appointment'
      },
      // Some rejected applications for variety
      {
        personnel_id: allPersonnel[0].id, // Admin
        leave_type_id: vacationLeave?.id || allLeaveTypes[0].id,
        start_date: new Date('2024-05-20'),
        end_date: new Date('2024-05-24'),
        total_days: 5,
        status: ApprovalStatus.Rejected,
        reason: 'Vacation during peak season'
      },
      {
        personnel_id: allPersonnel[1].id, // HR Manager
        leave_type_id: personalLeave?.id || allLeaveTypes[4].id,
        start_date: new Date('2024-04-15'),
        end_date: new Date('2024-04-17'),
        total_days: 3,
        status: ApprovalStatus.Rejected,
        reason: 'Personal matters - conflicting schedule'
      },
      // Emergency leave applications
      {
        personnel_id: allPersonnel[2].id, // Employee
        leave_type_id: sickLeave?.id || allLeaveTypes[1].id,
        start_date: new Date('2024-03-05'),
        end_date: new Date('2024-03-07'),
        total_days: 3,
        status: ApprovalStatus.Approved,
        reason: 'Family emergency - hospitalization',
        supporting_document: 'hospital_admission_mar2024.pdf'
      }
    ];

    for (const app of sampleApplications) {
      const existingApp = await prisma.leaveApplication.findFirst({
        where: {
          personnel_id: app.personnel_id,
          leave_type_id: app.leave_type_id,
          start_date: app.start_date
        }
      });

      if (!existingApp) {
        const leaveApp = await prisma.leaveApplication.create({
          data: {
            personnel_id: app.personnel_id,
            leave_type_id: app.leave_type_id,
            start_date: app.start_date,
            end_date: app.end_date,
            total_days: app.total_days,
            status: app.status as any,
            reason: app.reason,
            supporting_document: app.supporting_document
          }
        });

        // Update leave balance if approved
        if (app.status === ApprovalStatus.Approved) {
          await prisma.leaveBalance.updateMany({
            where: {
              personnel_id: app.personnel_id,
              leave_type_id: app.leave_type_id,
              year: currentYear
            },
            data: {
              used_credits: {
                increment: app.total_days
              }
            }
          });
        }
      }
    }
  }

  console.log('✅ Sample leave applications created');

  // Create sample leave monetization requests
  console.log('🌱 Creating sample leave monetization requests...');
  
  if (allPersonnel.length > 0 && allLeaveTypes.length > 0) {
    const vacationLeave = allLeaveTypes.find(lt => lt.leave_type_name === 'Vacation Leave');
    
    const sampleMonetization = [
      {
        personnel_id: allPersonnel[0].id, // Admin
        leave_type_id: vacationLeave?.id || allLeaveTypes[0].id,
        days_to_monetize: 5,
        status: 'Approved',
        amount: 15000 // Assuming daily rate calculation
      },
      {
        personnel_id: allPersonnel[1].id, // HR Manager
        leave_type_id: vacationLeave?.id || allLeaveTypes[0].id,
        days_to_monetize: 3,
        status: 'Pending',
        amount: null
      },
      {
        personnel_id: allPersonnel.length > 3 ? allPersonnel[3].id : allPersonnel[2].id, // Finance Head or fallback
        leave_type_id: vacationLeave?.id || allLeaveTypes[0].id,
        days_to_monetize: 7,
        status: 'Rejected',
        amount: null
      }
    ];

    for (const monetization of sampleMonetization) {
      const existing = await prisma.leaveMonetization.findFirst({
        where: {
          personnel_id: monetization.personnel_id,
          leave_type_id: monetization.leave_type_id,
          days_to_monetize: monetization.days_to_monetize
        }
      });

      if (!existing) {
        await prisma.leaveMonetization.create({
          data: {
            personnel_id: monetization.personnel_id,
            leave_type_id: monetization.leave_type_id,
            days_to_monetize: monetization.days_to_monetize,
            status: monetization.status as any,
            amount: monetization.amount,
            approved_by: monetization.status === 'Approved' ? allPersonnel[0].user_id : null,
            approval_date: monetization.status === 'Approved' ? new Date() : null
          }
        });
      }
    }
  }

  console.log('✅ Sample leave monetization requests created');

  console.log('🎉 Database seeding completed successfully!');
  console.log('\n📋 Default users created:');
  console.log('👤 Admin: admin / Admin123!');
  console.log('👤 HR Manager: hr_manager / HR123!');
  console.log('👤 Employee: employee / Employee123!');
  console.log('👤 Finance Manager: finance_head / Finance123!');
  console.log('👤 Marketing Specialist: marketing_lead / Marketing123!');
  console.log('👤 Operations Manager: operations_mgr / Operations123!');
  console.log('\n📊 Leave data created:');
  console.log(`✅ ${allLeaveTypes.length} leave types`);
  console.log(`✅ ${allPersonnel.length * allLeaveTypes.length} leave balances for ${currentYear}`);
  console.log('✅ 15 sample leave applications (Approved, Pending, Rejected)');
  console.log('✅ 3 sample leave monetization requests');
  console.log('\n🔍 Sample leave data includes:');
  console.log('• 9 Approved applications across all employees');
  console.log('• 4 Pending applications for future dates');
  console.log('• 2 Rejected applications for reference');
  console.log('• Applications spanning from March 2024 to February 2025');
  console.log('• Supporting documents for medical/emergency leaves');
  console.log('• Diverse leave types: Vacation, Sick, Personal');
  console.log('• Realistic leave scenarios: vacations, medical, emergencies, personal events');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    // @ts-ignore
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

// ---
// How to verify your data after seeding:
// 1. Run: npx prisma db seed
// 2. Use Prisma Studio: npx prisma studio
//    - Check JobPosting, JobApplicant, and JobApplication tables for sample data
// 3. Or use your Postman/HTTP client to hit your backend endpoints
// --- 
  