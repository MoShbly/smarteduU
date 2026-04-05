import bcrypt from 'bcryptjs';

import prisma from '../src/lib/prisma.js';

const teacherEmail = 'teacher@smartclassroom.edu';
const studentEmail = 'student@smartclassroom.edu';
const defaultPassword = 'SmartClass123!';

async function main() {
  const passwordHash = await bcrypt.hash(defaultPassword, 10);

  const teacher = await prisma.user.upsert({
    where: {
      email: teacherEmail
    },
    update: {
      name: 'Demo Teacher',
      role: 'teacher',
      passwordHash,
      isActive: true
    },
    create: {
      name: 'Demo Teacher',
      email: teacherEmail,
      role: 'teacher',
      passwordHash,
      isActive: true
    }
  });

  const student = await prisma.user.upsert({
    where: {
      email: studentEmail
    },
    update: {
      name: 'Demo Student',
      role: 'student',
      passwordHash,
      isActive: true
    },
    create: {
      name: 'Demo Student',
      email: studentEmail,
      role: 'student',
      passwordHash,
      isActive: true
    }
  });

  const course = await prisma.course.upsert({
    where: {
      code: 'SC-DEMO-101'
    },
    update: {
      title: 'Smart Classroom Demo Course',
      description: 'A seeded demo course for teacher and student dashboard testing.',
      subject: 'Software Engineering',
      teacherId: teacher.id,
      isArchived: false
    },
    create: {
      title: 'Smart Classroom Demo Course',
      description: 'A seeded demo course for teacher and student dashboard testing.',
      subject: 'Software Engineering',
      code: 'SC-DEMO-101',
      teacherId: teacher.id
    }
  });

  const enrollment = await prisma.enrollment.upsert({
    where: {
      courseId_studentId: {
        courseId: course.id,
        studentId: student.id
      }
    },
    update: {
      status: 'active'
    },
    create: {
      courseId: course.id,
      studentId: student.id,
      status: 'active'
    }
  });

  const assignment = await prisma.assignment.create({
    data: {
      courseId: course.id,
      title: 'Initial Platform Reflection',
      description: 'Write a short reflection about how digital classrooms improve course organization.',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      maxScore: 100,
      createdById: teacher.id,
      status: 'published'
    }
  });

  await prisma.activityLog.createMany({
    data: [
      {
        actorId: teacher.id,
        action: 'user.seeded',
        entityType: 'User',
        entityId: teacher.id,
        details: {
          email: teacher.email
        }
      },
      {
        actorId: student.id,
        action: 'user.seeded',
        entityType: 'User',
        entityId: student.id,
        details: {
          email: student.email
        }
      },
      {
        actorId: teacher.id,
        action: 'course.seeded',
        entityType: 'Course',
        entityId: course.id,
        details: {
          code: course.code
        }
      },
      {
        actorId: student.id,
        action: 'enrollment.seeded',
        entityType: 'Enrollment',
        entityId: enrollment.id,
        details: {
          courseId: course.id
        }
      },
      {
        actorId: teacher.id,
        action: 'assignment.seeded',
        entityType: 'Assignment',
        entityId: assignment.id,
        details: {
          courseId: course.id
        }
      }
    ],
    skipDuplicates: false
  });

  console.log('Seed completed successfully');
  console.log(`Teacher: ${teacherEmail}`);
  console.log(`Student: ${studentEmail}`);
  console.log(`Password: ${defaultPassword}`);
}

main()
  .catch(async (error) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
