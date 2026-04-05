'use client';

import { BookOpenText, FileText, Users } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CourseCard({ course, subtitle }) {
  return (
    <motion.article
      className="course-card"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      whileHover={{ y: -6, scale: 1.01 }}
    >
      <div className="course-card-header">
        <div>
          <span className="course-badge">{course.code}</span>
          <h3>{course.title}</h3>
        </div>
        <span className="course-subject">{course.subject || 'General Studies'}</span>
      </div>

      <p>{course.description || subtitle || 'A well-structured course space ready for classroom activity.'}</p>

      <div className="course-meta-grid">
        <div>
          <Users size={16} />
          <span>{course._count?.enrollments ?? 0} enrollments</span>
        </div>
        <div>
          <FileText size={16} />
          <span>{course._count?.assignments ?? 0} assignments</span>
        </div>
        <div>
          <BookOpenText size={16} />
          <span>{course.teacher?.name || subtitle || 'Class workspace'}</span>
        </div>
      </div>
    </motion.article>
  );
}
