import React from 'react';

const SkeletonCard = () => {
  return (
    <div className="bg-slate-700 rounded-lg shadow-md overflow-hidden animate-pulse">
      {/* Image Placeholder */}
      <div className="aspect-square w-full bg-slate-600"></div>
      {/* Text Placeholders */}
      <div className="p-3">
        <div className="h-4 bg-slate-600 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-slate-600 rounded w-1/2"></div>
      </div>
    </div>
  );
};

export default SkeletonCard; 