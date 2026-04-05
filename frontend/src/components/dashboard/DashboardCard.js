'use client';

import { motion } from 'framer-motion';

export default function DashboardCard({ label, value, helper, icon: Icon, accent = 'primary' }) {
  return (
    <motion.article
      className={`stat-card ${accent}`}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32 }}
      whileHover={{ y: -4 }}
    >
      <div className="stat-card-header">
        <span>{label}</span>
        {Icon ? (
          <span className="stat-icon">
            <Icon size={18} />
          </span>
        ) : null}
      </div>

      <strong>{value}</strong>
      {helper ? <p>{helper}</p> : null}
    </motion.article>
  );
}
