'use client';

import { motion } from 'framer-motion';
import { memo } from 'react';

import Card from '@/components/ui/Card';

const DashboardCard = memo(function DashboardCard({ label, value, helper, icon: Icon, accent = 'primary' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32 }}
      whileHover={{ y: -4 }}
    >
      <Card className={`metric-card metric-card--${accent}`}>
        <div className="metric-card-header">
          <div className="metric-card-copy">
            <span className="metric-card-label">{label}</span>
            <strong className="metric-card-value">{value}</strong>
          </div>
          {Icon ? (
            <span className="metric-card-icon">
              <Icon size={18} />
            </span>
          ) : null}
        </div>

        {helper ? <p className="metric-card-helper">{helper}</p> : null}
      </Card>
    </motion.div>
  );
});

export default DashboardCard;
