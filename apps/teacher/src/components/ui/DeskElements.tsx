'use client';

import React from 'react';

// Framed Corkboard Container matching the portfolio reference pinboard
export function Corkboard({
  children,
  className = '',
  title = 'Noticeboard',
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <div
      className={`relative rounded-2xl p-5 sm:p-6 border-[8px] border-[#BD8B5E] bg-[#DEB078] shadow-[0_4px_6px_rgba(60,52,40,0.08),0_18px_36px_-6px_rgba(60,52,40,0.18)] ${className}`}
      style={{
        backgroundImage: `
          radial-gradient(#AA672D 1px, transparent 1px),
          radial-gradient(#97571E 0.8px, #D49E5F 0.8px)
        `,
        backgroundSize: '16px 16px',
        backgroundPosition: '0 0, 8px 8px',
      }}
    >
      {/* Wooden Bevel Inner Shadow */}
      <div className="absolute inset-0 rounded-[8px] shadow-[inset_0_3px_10px_rgba(50,30,10,0.3),inset_0_0_15px_rgba(50,30,10,0.15)] pointer-events-none" />

      {/* Brass Corner Fasteners */}
      <div className="absolute top-1 left-1 w-2.5 h-2.5 rounded-full bg-[#B45309] border border-[#78350F] shadow-sm pointer-events-none" />
      <div className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-[#B45309] border border-[#78350F] shadow-sm pointer-events-none" />
      <div className="absolute bottom-1 left-1 w-2.5 h-2.5 rounded-full bg-[#B45309] border border-[#78350F] shadow-sm pointer-events-none" />
      <div className="absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full bg-[#B45309] border border-[#78350F] shadow-sm pointer-events-none" />

      {/* Header Label Tape */}
      {title && (
        <div className="relative -mt-2 mb-4 inline-flex items-center gap-2 px-3 py-1 rounded-sm bg-white/90 backdrop-blur-sm border border-[#E3DFD9] text-[#1C1917] text-[11px] font-['Raleway'] font-bold tracking-wider shadow-sm uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-[#1677FF] animate-pulse" />
          {title}
        </div>
      )}

      {/* Pinboard Canvas */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

// Ceramic Coffee Cup with Latte Art
export function CoffeeCup({ className = '' }: { className?: string }) {
  return (
    <div
      className={`relative select-none pointer-events-none inline-flex items-center justify-center ${className}`}
      title="Freshly brewed coffee"
    >
      {/* Saucer */}
      <div className="w-18 h-18 rounded-full bg-[#FAF8F5] border border-[#E3DFD9] shadow-[0_6px_16px_rgba(60,52,40,0.12)] flex items-center justify-center">
        {/* Inner Saucer Rim */}
        <div className="w-14 h-14 rounded-full bg-white border border-[#E3DFD9] flex items-center justify-center shadow-inner">
          {/* Ceramic Cup Rim */}
          <div className="w-11 h-11 rounded-full bg-[#FAF8F5] border-[2.5px] border-[#DDD8D2] shadow-sm flex items-center justify-center overflow-hidden">
            {/* Coffee Liquid */}
            <div className="w-full h-full rounded-full bg-[#3D2517] flex items-center justify-center relative shadow-inner">
              {/* Crema / Foam swirl */}
              <div className="w-6 h-6 rounded-full border border-amber-200/40 border-t-amber-100/90 rotate-45 flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-100/70 blur-[0.5px]" />
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Saucer Handle */}
      <div className="absolute -right-1 top-6 w-2.5 h-5 rounded-r-full border-2 border-l-0 border-[#DDD8D2] bg-[#FAF8F5]" />
    </div>
  );
}

// Yellow Drafting Pencil matching portfolio
export function YellowPencil({ className = '', rotation = -20 }: { className?: string; rotation?: number }) {
  return (
    <div
      className={`relative select-none pointer-events-none inline-flex items-center drop-shadow-[0_4px_8px_rgba(60,52,40,0.16)] ${className}`}
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      {/* Pink Eraser */}
      <div className="w-4 h-2.5 bg-[#F8BCC2] rounded-l-sm border-y border-l border-[#F472B6]" />
      {/* Brass Band */}
      <div className="w-3 h-2.5 bg-gradient-to-r from-amber-300 via-amber-100 to-amber-400 border-y border-amber-500" />
      {/* Hexagonal Yellow Wood */}
      <div className="w-20 h-2.5 bg-[#FACC15] border-y border-amber-500 flex flex-col justify-between py-[0.5px]">
        <div className="w-full h-[0.5px] bg-amber-300" />
        <div className="w-full h-[0.5px] bg-amber-600/30" />
      </div>
      {/* Sharpened Wood Point */}
      <div
        className="w-0 h-0 border-y-[5px] border-y-transparent border-l-[10px] border-l-[#FDE68A]"
        style={{ filter: 'drop-shadow(1px 0 0 #D97706)' }}
      />
      {/* Graphite Lead Point */}
      <div className="-ml-[2.5px] w-0 h-0 border-y-[1.5px] border-y-transparent border-l-[3.5px] border-l-stone-800" />
    </div>
  );
}

// Polaroid Card with frosted scotch tape
export function PolaroidCard({
  caption,
  subCaption,
  className = '',
  rotation = 2,
  children,
}: {
  caption: string;
  subCaption?: string;
  className?: string;
  rotation?: number;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={`relative bg-white p-3 pb-3.5 rounded-sm border border-[#E3DFD9] shadow-[0_1px_2px_rgba(60,52,40,0.06),0_6px_16px_-4px_rgba(60,52,40,0.1)] transition-transform duration-300 hover:rotate-0 hover:scale-105 z-10 ${className}`}
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      {/* Frosted Tape at top */}
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-5 tape-strip rotate-[-1deg] rounded-[1px] pointer-events-none z-20" />

      {/* Picture Frame */}
      <div className="w-full aspect-[4/3] rounded-[2px] bg-[#FAF8F5] border border-[#E3DFD9] overflow-hidden flex items-center justify-center">
        {children || (
          <div className="w-full h-full bg-gradient-to-tr from-amber-50 via-stone-50 to-orange-50 flex items-center justify-center text-stone-500 font-['Raleway'] text-xs font-semibold">
            Kota Campus Alpha
          </div>
        )}
      </div>

      {/* Handwritten Caption */}
      <div className="mt-2 text-center">
        <p className="font-['Raleway'] font-bold text-stone-800 text-xs tracking-tight">
          {caption}
        </p>
        {subCaption && (
          <p className="font-['Inter'] text-[10px] text-stone-500 font-medium">
            {subCaption}
          </p>
        )}
      </div>
    </div>
  );
}

// Desk Pet / Status Pill at bottom right matching the portfolio
export function DeskPetPill({ className = '' }: { className?: string }) {
  return (
    <div
      className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/95 backdrop-blur-md border border-[#E3DFD9] shadow-[0_2px_8px_rgba(60,52,40,0.08)] select-none text-xs font-['Raleway'] font-semibold text-stone-700 transition-all hover:shadow-md ${className}`}
    >
      <span className="w-2 h-2 rounded-full bg-[#1677FF] animate-pulse" />
      <span className="font-['Inter'] font-semibold text-stone-800">PadhaiPilot</span>
      <span className="text-stone-300 font-normal">·</span>
      <span className="text-stone-500 text-[11px]">Online</span>
    </div>
  );
}
