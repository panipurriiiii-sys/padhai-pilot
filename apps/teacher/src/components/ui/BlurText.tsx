'use client';

import React from 'react';

interface BlurTextProps {
  text: string;
  className?: string;
  delay?: number;
}

export function BlurText({ text, className = '', delay = 50 }: BlurTextProps) {
  const words = text.split(' ');

  return (
    <span className={`inline-flex flex-wrap gap-x-1.5 ${className}`}>
      {words.map((word, idx) => (
        <span
          key={idx}
          className="inline-block animate-blur-fade opacity-0"
          style={{
            animationDelay: `${idx * delay}ms`,
            animationFillMode: 'forwards',
          }}
        >
          {word}
        </span>
      ))}
    </span>
  );
}

