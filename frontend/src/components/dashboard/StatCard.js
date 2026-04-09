'use client';

import { motion } from 'framer-motion';

import Card from '@/components/ui/Card';

export default function StatCard({ label, value, helper, icon: Icon, accent = 'primary' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24 }}
      whileHover={{ y: -2 }}
    >
      <Card className={`stat-card stat-card--${accent}`} tone="soft">
        <div className="stat-card-head">
          <div className="stat-card-copy">
            <span className="stat-card-label">{label}</span>
            <strong className="stat-card-value">{value}</strong>
          </div>
          {Icon ? (
            <span className="stat-card-icon" aria-hidden="true">
              <Icon size={18} />
            </span>
          ) : null}
        </div>
        {helper ? <p className="stat-card-helper">{helper}</p> : null}
      </Card>
    </motion.div>
  );
}
