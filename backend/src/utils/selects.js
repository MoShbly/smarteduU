export const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  avatarUrl: true,
  isActive: true,
  createdAt: true,
  updatedAt: true
};

export const userSummarySelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  avatarUrl: true
};

export const courseInclude = {
  teacher: {
    select: userSummarySelect
  },
  _count: {
    select: {
      enrollments: true,
      assignments: true
    }
  }
};

export const assignmentInclude = {
  course: {
    select: {
      id: true,
      title: true,
      code: true,
      subject: true
    }
  },
  createdBy: {
    select: userSummarySelect
  },
  _count: {
    select: {
      submissions: true
    }
  }
};

export const submissionInclude = {
  student: {
    select: userSummarySelect
  },
  assignment: {
    select: {
      id: true,
      title: true,
      dueDate: true,
      course: {
        select: {
          id: true,
          title: true,
          code: true
        }
      }
    }
  }
};

export const activityLogInclude = {
  actor: {
    select: userSummarySelect
  }
};

