import React from 'react';

interface PageHeaderProps {
    title: string;
    subtitle?: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle }) => {
  return (
    <div className="mb-8 hidden md:block">
      <h1 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight">{title}</h1>
      {subtitle && <p className="text-slate-500 dark:text-slate-400 mt-2">{subtitle}</p>}
    </div>
  );
};

export default PageHeader;