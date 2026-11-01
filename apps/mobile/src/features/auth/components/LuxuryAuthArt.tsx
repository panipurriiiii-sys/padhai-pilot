import React from 'react';
import Svg, {
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
  Rect,
  Circle,
  Path,
  G,
  Ellipse,
} from 'react-native-svg';

interface AnimeArtProps {
  size?: number;
}

/**
 * Slide 1: Anime Study Protagonist (Makoto Shinkai / Ghibli inspired lofi study scene)
 * Features character with headphones, notebook, floating glowing sparkles & study desk aura.
 */
export const AnimeStudySceneArt: React.FC<AnimeArtProps> = ({ size = 230 }) => (
  <Svg width={size} height={size * 0.8} viewBox="0 0 280 220" fill="none">
    <Defs>
      <RadialGradient id="celestialSky" cx="50%" cy="40%" r="65%">
        <Stop offset="0%" stopColor="#1677FF" stopOpacity="0.22" />
        <Stop offset="45%" stopColor="#7CB2FF" stopOpacity="0.12" />
        <Stop offset="100%" stopColor="#FAF8F5" stopOpacity="0" />
      </RadialGradient>
      <LinearGradient id="windowGlow" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0%" stopColor="#E1EDFF" />
        <Stop offset="100%" stopColor="#FAF8F5" />
      </LinearGradient>
      <LinearGradient id="deskWood" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0%" stopColor="#F3EFE9" />
        <Stop offset="100%" stopColor="#E3DFD9" />
      </LinearGradient>
      <LinearGradient id="hoodieGrad" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0%" stopColor="#1677FF" />
        <Stop offset="100%" stopColor="#0A4FBF" />
      </LinearGradient>
    </Defs>

    {/* Ambient Anime Glow Circle */}
    <Circle cx="140" cy="105" r="95" fill="url(#celestialSky)" />

    {/* Anime Arch Window Background */}
    <Path
      d="M75 140 V70 A65 65 0 0 1 205 70 V140 Z"
      fill="url(#windowGlow)"
      stroke="#BFDBFE"
      strokeWidth="1.5"
    />
    {/* Floating Window Panes / Sky Stars */}
    <Circle cx="105" cy="55" r="1.5" fill="#1677FF" opacity="0.6" />
    <Circle cx="165" cy="45" r="2" fill="#00D9FF" opacity="0.8" />
    <Circle cx="180" cy="65" r="1.2" fill="#1677FF" opacity="0.5" />
    <Path d="M75 95 H205 M140 30 V140" stroke="#BFDBFE" strokeWidth="1" strokeDasharray="3 3" />

    {/* Study Desk Surface */}
    <Rect x="45" y="140" width="190" height="48" rx="8" fill="url(#deskWood)" stroke="#DDD8D2" strokeWidth="1.2" />

    {/* Anime Character: Boy in hoodie with headphones, reading intensely */}
    {/* Headphone Band */}
    <Path d="M124 75 C124 64 156 64 156 75" stroke="#1C1917" strokeWidth="3" strokeLinecap="round" />
    <Rect x="120" y="73" width="7" height="12" rx="3.5" fill="#1677FF" />
    <Rect x="153" y="73" width="7" height="12" rx="3.5" fill="#1677FF" />

    {/* Anime Hair (Spiky / Soft Layered) */}
    <Path
      d="M125 78 C122 70 126 62 135 60 C143 59 152 61 156 67 C159 72 158 80 156 82 C152 82 148 76 144 76 C140 76 138 82 133 82 C129 82 127 80 125 78 Z"
      fill="#1C1917"
    />
    {/* Face (Focused Profile Downwards) */}
    <Path
      d="M130 76 C130 84 135 90 142 90 C148 90 152 85 152 77"
      fill="#FEEAD8"
      stroke="#E3B397"
      strokeWidth="0.8"
    />
    {/* Anime Eyes (Focused line) & Blush */}
    <Path d="M134 81 L139 83" stroke="#1C1917" strokeWidth="1.6" strokeLinecap="round" />
    <Ellipse cx="132" cy="85" rx="2" ry="1" fill="#F8BCC2" />

    {/* Hoodie & Shoulders */}
    <Path
      d="M120 92 C110 98 100 115 98 140 H182 C180 115 170 98 160 92 C154 96 146 98 140 98 C134 98 126 96 120 92 Z"
      fill="url(#hoodieGrad)"
    />

    {/* Open Manga / Study Book on Desk */}
    <G transform="translate(112, 126)">
      <Path d="M0 12 C14 8 26 8 28 14 C30 8 42 8 56 12 L54 26 C40 22 30 22 28 26 C26 22 16 22 2 26 Z" fill="#FFFFFF" stroke="#1C1917" strokeWidth="1.2" />
      <Path d="M28 14 V26" stroke="#DDD8D2" strokeWidth="1" />
      {/* Book text lines */}
      <Path d="M6 16 H22 M6 20 H18 M34 16 H50 M34 20 H46" stroke="#929BAA" strokeWidth="1" strokeLinecap="round" />
    </G>

    {/* Lofi Desk Accessories: Matcha Cup with Steam */}
    <Rect x="70" y="132" width="12" height="14" rx="2.5" fill="#DAF5E4" stroke="#0E4A28" strokeWidth="1" />
    <Path d="M74 128 C74 125 78 124 78 121" stroke="#10B981" strokeWidth="1" strokeLinecap="round" opacity="0.6" />

    {/* Glowing Anime Sparkles (Stars / Kira-Kira) */}
    <G transform="translate(68, 62)">
      <Path d="M8 0 L10 6 L16 8 L10 10 L8 16 L6 10 L0 8 L6 6 Z" fill="#1677FF" opacity="0.8" />
    </G>
    <G transform="translate(202, 85)">
      <Path d="M6 0 L7 4 L11 5 L7 7 L6 11 L4 7 L0 5 L4 4 Z" fill="#F59E0B" opacity="0.8" />
    </G>
  </Svg>
);

/**
 * Slide 2: Anime Classroom & Team Dynamic (Teacher + Students / Goal Achievement)
 */
export const AnimeClassroomArt: React.FC<AnimeArtProps> = ({ size = 230 }) => (
  <Svg width={size} height={size * 0.8} viewBox="0 0 280 220" fill="none">
    <Defs>
      <RadialGradient id="chalkGlow" cx="50%" cy="40%" r="65%">
        <Stop offset="0%" stopColor="#10B981" stopOpacity="0.2" />
        <Stop offset="60%" stopColor="#DAF5E4" stopOpacity="0.08" />
        <Stop offset="100%" stopColor="#FAF8F5" stopOpacity="0" />
      </RadialGradient>
      <LinearGradient id="boardGrad" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0%" stopColor="#1E293B" />
        <Stop offset="100%" stopColor="#0F172A" />
      </LinearGradient>
    </Defs>

    {/* Aura */}
    <Circle cx="140" cy="110" r="95" fill="url(#chalkGlow)" />

    {/* Anime Blackboard */}
    <Rect x="45" y="35" width="190" height="110" rx="12" fill="url(#boardGrad)" stroke="#475569" strokeWidth="2" />
    {/* Blackboard Wood Frame Base */}
    <Rect x="40" y="142" width="200" height="8" rx="3" fill="#D49E5F" stroke="#AA672D" strokeWidth="1" />

    {/* Anime Formula & Magic Geometry on Board */}
    <Circle cx="130" cy="85" r="28" stroke="#38BDF8" strokeWidth="1" strokeDasharray="4 3" opacity="0.6" />
    <Path d="M110 95 L130 65 L150 95 Z" stroke="#FDE047" strokeWidth="1.2" opacity="0.7" fill="none" />
    <Path d="M70 60 H105 M70 72 H95" stroke="#F1F5F9" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
    <Circle cx="190" cy="65" r="10" stroke="#F43F5E" strokeWidth="1.5" opacity="0.8" />
    <Path d="M185 65 L190 70 L202 58" stroke="#F43F5E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />

    {/* Anime Chibi Teacher with Pointer Stick */}
    <G transform="translate(62, 95)">
      {/* Teacher Hair & Glasses */}
      <Circle cx="22" cy="16" r="11" fill="#FEEAD8" />
      <Path d="M12 14 C12 6 32 6 32 14 C28 10 24 10 20 12 Z" fill="#334155" />
      <Rect x="17" y="14" width="10" height="4" rx="1.5" stroke="#1C1917" strokeWidth="1" fill="none" />
      {/* Anime Suit */}
      <Path d="M14 26 L8 50 H36 L30 26 Z" fill="#1677FF" />
      <Path d="M22 26 V38" stroke="#FFFFFF" strokeWidth="1.5" />
      {/* Pointer wand pointing at formula */}
      <Path d="M30 34 L62 12" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
      <Circle cx="63" cy="11" r="2.5" fill="#FCD34D" />
    </G>

    {/* Cheerful Student Character Silhouette in Foreground */}
    <G transform="translate(185, 110)">
      <Circle cx="22" cy="18" r="11" fill="#FEEAD8" />
      <Path d="M10 16 C10 6 34 6 34 16 Z" fill="#1C1917" />
      {/* Anime Ribbon */}
      <Path d="M20 28 L14 50 H38 L32 28 Z" fill="#F43F5E" />
      <Path d="M20 28 L24 32 L28 28" fill="#FFFFFF" />
    </G>

    {/* Cheerful Sparkles */}
    <Path d="M224 45 L226 49 L230 51 L226 53 L224 57 L222 53 L218 51 L222 49 Z" fill="#F59E0B" />
  </Svg>
);

/**
 * Slide 3: Anime Trophy & Level-Up / Certificate Milestone
 */
export const AnimeMilestoneArt: React.FC<AnimeArtProps> = ({ size = 230 }) => (
  <Svg width={size} height={size * 0.8} viewBox="0 0 280 220" fill="none">
    <Defs>
      <RadialGradient id="powerAura" cx="50%" cy="45%" r="65%">
        <Stop offset="0%" stopColor="#F59E0B" stopOpacity="0.25" />
        <Stop offset="50%" stopColor="#FFF3C4" stopOpacity="0.12" />
        <Stop offset="100%" stopColor="#FAF8F5" stopOpacity="0" />
      </RadialGradient>
      <LinearGradient id="goldTrophy" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0%" stopColor="#FDE047" />
        <Stop offset="50%" stopColor="#F59E0B" />
        <Stop offset="100%" stopColor="#D97706" />
      </LinearGradient>
      <LinearGradient id="badgeRibbon" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0%" stopColor="#1677FF" />
        <Stop offset="100%" stopColor="#0A4FBF" />
      </LinearGradient>
    </Defs>

    {/* Radiant Anime Power Burst */}
    <Circle cx="140" cy="105" r="95" fill="url(#powerAura)" />

    {/* Burst Ray lines */}
    <Path d="M140 25 V45 M140 165 V185 M60 105 H80 M200 105 H220" stroke="#F6E09E" strokeWidth="1.5" strokeDasharray="3 3" />
    <Path d="M85 50 L100 65 M195 50 L180 65 M85 160 L100 145 M195 160 L180 145" stroke="#F6E09E" strokeWidth="1.5" strokeDasharray="3 3" />

    {/* Shonen-Style Gold Trophy */}
    <G transform="translate(100, 48)">
      {/* Cup Handles */}
      <Path d="M10 24 C-4 24 -4 52 16 52 M70 24 C84 24 84 52 64 52" stroke="#D97706" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      {/* Cup Body */}
      <Path d="M12 12 H68 L58 60 C54 72 26 72 22 60 Z" fill="url(#goldTrophy)" stroke="#B45309" strokeWidth="1.5" />
      {/* Cup Stem & Base */}
      <Rect x="35" y="68" width="10" height="18" fill="#F59E0B" stroke="#B45309" strokeWidth="1" />
      <Path d="M22 86 H58 L62 98 H18 Z" fill="#1C1917" stroke="#334155" strokeWidth="1.5" />
      {/* Star Crest on Trophy */}
      <Path d="M40 30 L42 36 L48 37 L43 41 L45 47 L40 43 L35 47 L37 41 L32 37 L38 36 Z" fill="#FFFFFF" />
    </G>

    {/* Level-Up Anime Ribbon Badge */}
    <G transform="translate(112, 160)">
      <Rect x="0" y="0" width="56" height="20" rx="10" fill="url(#badgeRibbon)" />
      {/* 5 Stars */}
      <Circle cx="16" cy="10" r="2.5" fill="#FDE047" />
      <Circle cx="28" cy="10" r="3" fill="#FDE047" />
      <Circle cx="40" cy="10" r="2.5" fill="#FDE047" />
    </G>

    {/* Big Anime Sparkles */}
    <G transform="translate(60, 75)">
      <Path d="M8 0 L10 6 L16 8 L10 10 L8 16 L6 10 L0 8 L6 6 Z" fill="#1677FF" />
    </G>
    <G transform="translate(205, 68)">
      <Path d="M10 0 L12 8 L20 10 L12 12 L10 20 L8 12 L0 10 L8 8 Z" fill="#F59E0B" />
    </G>
    <Circle cx="82" cy="132" r="3" fill="#10B981" />
    <Circle cx="198" cy="140" r="2.5" fill="#EC4899" />
  </Svg>
);
