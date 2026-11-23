'use client';

import React from 'react';

export function UniversityLogo({ className = 'h-10 sm:h-12' }: { className?: string }) {
  return (
    <div className="flex items-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/gku-logo.png"
        alt="Guru Kashi University - NAAC Grade A++ Accredited University"
        className={`object-contain w-auto max-w-[280px] sm:max-w-[340px] md:max-w-[400px] ${className}`}
      />
    </div>
  );
}
