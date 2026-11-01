'use client';

import React, { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';

export interface OnboardingSlideData {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
}

export const ONBOARDING_SLIDES: OnboardingSlideData[] = [
  {
    id: 'campus',
    badge: 'LEARN & GROW',
    title: 'Your Study Space',
    subtitle: 'Daily routine',
    description: 'Track your batches, class timings, and homework all in one place.',
    image: '/onboarding/onboarding_bg_1.jpg',
  },
  {
    id: 'golden_hour',
    badge: 'STAY CONSISTENT',
    title: 'Daily Attendance',
    subtitle: 'Never miss a class',
    description: 'Mark attendance smoothly and stay updated with teacher announcements.',
    image: '/onboarding/onboarding_bg_2.jpg',
  },
  {
    id: 'twilight_vista',
    badge: 'REACH YOUR GOAL',
    title: 'Track Your Progress',
    subtitle: 'Results & milestones',
    description: 'Check test scores, fee receipts, and overall performance anytime.',
    image: '/onboarding/onboarding_bg_3.jpg',
  },
];

interface GetStartedViewProps {
  onFinish: () => void;
  onLoginPress: () => void;
  portalSubtitle?: string;
}

export function GetStartedView({
  onFinish,
  onLoginPress,
  portalSubtitle = 'Student Portal 2026–27',
}: GetStartedViewProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const activeSlide = ONBOARDING_SLIDES[activeIndex];
  const isLast = activeIndex === ONBOARDING_SLIDES.length - 1;

  const handleNext = () => {
    if (activeIndex < ONBOARDING_SLIDES.length - 1) {
      setActiveIndex((prev) => prev + 1);
    } else {
      onFinish();
    }
  };

  // Preload background images
  useEffect(() => {
    ONBOARDING_SLIDES.forEach((slide) => {
      const img = new Image();
      img.src = slide.image;
    });
  }, []);

  return (
    <div className="relative w-full min-h-screen h-screen overflow-hidden bg-[#050608] flex flex-col justify-between select-none font-sans">
      {/* 1. Fullscreen Background Image with Fade Transition */}
      {ONBOARDING_SLIDES.map((slide, idx) => (
        <div
          key={slide.id}
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-700 ease-in-out"
          style={{
            backgroundImage: `url(${slide.image})`,
            opacity: idx === activeIndex ? 1 : 0,
            zIndex: 1,
          }}
        />
      ))}

      {/* 2. Top-to-Bottom Readability Tint */}
      <div
        className="absolute inset-0 bg-black/40 z-10"
        style={{
          background:
            'linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.25) 40%, rgba(0,0,0,0.75) 100%)',
        }}
      />

      {/* 3. Top Header Bar */}
      <header className="relative z-20 w-full max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--brand-electric)] flex items-center justify-center text-white font-['Playfair_Display'] font-black text-lg shadow-[0_2px_12px_rgba(22,119,255,0.45)]">
            P
          </div>
          <span className="font-['Playfair_Display'] font-bold text-xl text-white tracking-tight drop-shadow-md">
            PadhaiPilot
          </span>
        </div>

        <div className="px-3.5 py-1.5 rounded-full bg-black/50 border border-white/30 backdrop-blur-md shadow-sm">
          <span className="text-xs font-bold text-white tracking-wider font-['Inter']">
            {portalSubtitle}
          </span>
        </div>
      </header>

      {/* 4. Center Slide Content (Text directly over image matching mobile 1:1) */}
      <main className="relative z-20 max-w-2xl mx-auto px-6 text-center my-auto flex flex-col items-center">
        {/* Badge */}
        <div className="inline-flex items-center justify-center py-1.5 px-4 rounded-full bg-white/20 border border-white/40 backdrop-blur-md mb-4 shadow-sm">
          <span className="text-xs font-extrabold text-white tracking-widest uppercase font-['Inter']">
            {activeSlide.badge}
          </span>
        </div>

        {/* Title */}
        <h1 className="font-['Playfair_Display'] text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-tight mb-4 drop-shadow-[0_4px_12px_rgba(0,0,0,0.7)]">
          {activeSlide.title}
        </h1>

        {/* Description */}
        <p className="font-['Raleway'] text-sm sm:text-base md:text-lg text-white/90 max-w-lg leading-relaxed drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] font-medium">
          {activeSlide.description}
        </p>
      </main>

      {/* 5. Bottom Dock & Controls */}
      <footer className="relative z-20 w-full max-w-md mx-auto px-6 pb-8 flex flex-col items-center">
        {/* Pagination Dots */}
        <div className="flex items-center gap-2 mb-5">
          {ONBOARDING_SLIDES.map((_, idx) => (
            <button
              key={idx}
              type="button"
              aria-label={`Go to slide ${idx + 1}`}
              onClick={() => setActiveIndex(idx)}
              className={`h-2 rounded-full transition-all duration-300 ${
                idx === activeIndex
                  ? 'w-7 bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]'
                  : 'w-2 bg-white/40 hover:bg-white/60'
              }`}
            />
          ))}
        </div>

        {/* Primary Action Button */}
        <button
          type="button"
          onClick={handleNext}
          className="w-full h-14 bg-[var(--brand-electric)] hover:bg-[#1260d4] active:scale-[0.99] text-white rounded-2xl font-['Raleway'] font-extrabold text-base flex items-center justify-center gap-2 shadow-[0_8px_24px_rgba(22,119,255,0.55)] transition-all cursor-pointer"
        >
          <span>{isLast ? 'Get Started' : 'Next'}</span>
          <ArrowRight className="w-5 h-5 stroke-[2.5]" />
        </button>

        {/* Secondary Sign In Link */}
        <button
          type="button"
          onClick={onLoginPress}
          className="mt-4 text-xs font-['Inter'] text-white/90 hover:text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] transition cursor-pointer"
        >
          Already have an account? <span className="font-bold underline ml-1">Sign In</span>
        </button>
      </footer>
    </div>
  );
}

