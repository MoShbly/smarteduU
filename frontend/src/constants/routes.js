export const ROUTES = {
  home: '/',
  login: '/login',
  register: '/register',
  teacher: '/teacher',
  student: '/student'
};

export const ROLE_DASHBOARD_ROUTES = {
  teacher: ROUTES.teacher,
  student: ROUTES.student
};

export const PROTECTED_ROUTE_ROLES = {
  teacherOnly: ['teacher'],
  studentOnly: ['student']
};
