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
  ClipPath,
} from 'react-native-svg';

interface ArtProps {
  size?: number;
}

export const HeroHubArt: React.FC<ArtProps> = ({ size = 220 }) => (
  <Svg width={size} height={size * 0.8} viewBox="0 0 280 220" fill="none">
    <Defs>
      <LinearGradient id="hubGrad" x1="0" y1="0" x2="280" y2="220" gradientUnits="userSpaceOnUse">
        <Stop offset="0%" stopColor="#1677FF" stopOpacity="0.15" />
        <Stop offset="100%" stopColor="#0A6FE8" stopOpacity="0.04" />
      </LinearGradient>
      <LinearGradient id="cardGrad" x1="40" y1="30" x2="240" y2="190" gradientUnits="userSpaceOnUse">
        <Stop offset="0%" stopColor="#FFFFFF" />
        <Stop offset="100%" stopColor="#FAF8F5" />
      </LinearGradient>
      <LinearGradient id="accentLine" x1="0" y1="0" x2="1" y2="0">
        <Stop offset="0%" stopColor="#1677FF" />
        <Stop offset="100%" stopColor="#00D9FF" />
      </LinearGradient>
    </Defs>

    {/* Background Soft Glow */}
    <Circle cx="140" cy="110" r="95" fill="url(#hubGrad)" />

    {/* Central Floating Master Academic Board */}
    <Rect
      x="35"
      y="30"
      width="210"
      height="150"
      rx="16"
      fill="url(#cardGrad)"
      stroke="#E3DFD9"
      strokeWidth="1.5"
    />

    {/* Top Header Bar inside Board */}
    <Rect x="55" y="50" width="70" height="8" rx="4" fill="#1C1917" />
    <Circle cx="215" cy="54" r="5" fill="#10B981" />
    <Circle cx="200" cy="54" r="5" fill="#F59E0B" />
    <Circle cx="185" cy="54" r="5" fill="#1677FF" />

    {/* Inner Stat Cards */}
    <Rect x="55" y="72" width="78" height="52" rx="10" fill="#F3EFE9" stroke="#DDD8D2" strokeWidth="1" />
    <Path d="M68 108 L84 94 L96 102 L116 84" stroke="url(#accentLine)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    <Circle cx="116" cy="84" r="3.5" fill="#1677FF" />

    <Rect x="147" y="72" width="78" height="52" rx="10" fill="#EFF6FF" stroke="#BFDBFE" strokeWidth="1" />
    <Circle cx="186" cy="98" r="16" stroke="#BFDBFE" strokeWidth="4" />
    <Path d="M186 82 A16 16 0 0 1 202 98" stroke="#1677FF" strokeWidth="4" strokeLinecap="round" />

    {/* Bottom Progress Tracker */}
    <Rect x="55" y="142" width="170" height="18" rx="6" fill="#F8F7F4" stroke="#E3DFD9" strokeWidth="1" />
    <Rect x="59" y="146" width="105" height="10" rx="4" fill="#1677FF" />

    {/* Dynamic Flying Paper Plane Accent */}
    <G transform="translate(200, 15) rotate(12)">
      <Path
        d="M10 22 L38 10 L28 36 L21 27 Z"
        fill="#1677FF"
        stroke="#FFFFFF"
        strokeWidth="1.5"
      />
      <Path d="M21 27 L38 10" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" />
    </G>
  </Svg>
);

export const RosterBatchArt: React.FC<ArtProps> = ({ size = 220 }) => (
  <Svg width={size} height={size * 0.8} viewBox="0 0 280 220" fill="none">
    <Defs>
      <LinearGradient id="rosterGlow" x1="0" y1="0" x2="280" y2="220" gradientUnits="userSpaceOnUse">
        <Stop offset="0%" stopColor="#10B981" stopOpacity="0.16" />
        <Stop offset="100%" stopColor="#1677FF" stopOpacity="0.04" />
      </LinearGradient>
      <LinearGradient id="studentCard" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0%" stopColor="#FFFFFF" />
        <Stop offset="100%" stopColor="#FAF8F5" />
      </LinearGradient>
    </Defs>

    {/* Ambient Glow */}
    <Circle cx="140" cy="110" r="95" fill="url(#rosterGlow)" />

    {/* Stacked Sheet 1 (Back angle) */}
    <Rect
      x="38"
      y="48"
      width="204"
      height="134"
      rx="14"
      fill="#F3EFE9"
      stroke="#DDD8D2"
      strokeWidth="1.5"
      transform="rotate(-4 140 115)"
    />

    {/* Main Roster Card */}
    <Rect
      x="40"
      y="38"
      width="200"
      height="144"
      rx="16"
      fill="url(#studentCard)"
      stroke="#E3DFD9"
      strokeWidth="1.5"
    />

    {/* Batch Badge */}
    <Rect x="58" y="54" width="86" height="20" rx="10" fill="#DAF5E4" stroke="#B2E6C4" strokeWidth="1" />
    <Circle cx="68" cy="64" r="3.5" fill="#0E4A28" />
    <Rect x="78" y="61" width="52" height="6" rx="3" fill="#0E4A28" />

    {/* Student Row 1 */}
    <Circle cx="72" cy="96" r="12" fill="#E1EDFF" />
    <Path d="M68 94 A4 4 0 0 1 76 94" stroke="#1677FF" strokeWidth="2" strokeLinecap="round" />
    <Rect x="94" y="90" width="80" height="7" rx="3.5" fill="#1C1917" />
    <Rect x="94" y="101" width="46" height="5" rx="2.5" fill="#78716C" />
    <Rect x="195" y="91" width="30" height="14" rx="7" fill="#DAF5E4" />

    {/* Student Row 2 */}
    <Circle cx="72" cy="128" r="12" fill="#FFF3C4" />
    <Path d="M68 126 A4 4 0 0 1 76 126" stroke="#5C3D00" strokeWidth="2" strokeLinecap="round" />
    <Rect x="94" y="122" width="70" height="7" rx="3.5" fill="#1C1917" />
    <Rect x="94" y="133" width="54" height="5" rx="2.5" fill="#78716C" />
    <Rect x="195" y="123" width="30" height="14" rx="7" fill="#DAF5E4" />

    {/* Student Row 3 */}
    <Circle cx="72" cy="160" r="12" fill="#FDE2E4" />
    <Rect x="94" y="154" width="76" height="7" rx="3.5" fill="#1C1917" />
    <Rect x="94" y="165" width="40" height="5" rx="2.5" fill="#78716C" />
    <Rect x="195" y="155" width="30" height="14" rx="7" fill="#E1EDFF" />
  </Svg>
);

export const FinanceLedgerArt: React.FC<ArtProps> = ({ size = 220 }) => (
  <Svg width={size} height={size * 0.8} viewBox="0 0 280 220" fill="none">
    <Defs>
      <LinearGradient id="finGrad" x1="0" y1="0" x2="280" y2="220" gradientUnits="userSpaceOnUse">
        <Stop offset="0%" stopColor="#1677FF" stopOpacity="0.14" />
        <Stop offset="100%" stopColor="#00D9FF" stopOpacity="0.05" />
      </LinearGradient>
      <LinearGradient id="receiptGrad" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0%" stopColor="#FFFFFF" />
        <Stop offset="100%" stopColor="#FAF8F5" />
      </LinearGradient>
    </Defs>

    {/* Glow */}
    <Circle cx="140" cy="110" r="95" fill="url(#finGrad)" />

    {/* Master Floating Receipt Card */}
    <Rect
      x="50"
      y="32"
      width="180"
      height="156"
      rx="16"
      fill="url(#receiptGrad)"
      stroke="#E3DFD9"
      strokeWidth="1.5"
    />

    {/* Receipt Header Icon */}
    <Circle cx="140" cy="62" r="18" fill="#1677FF" />
    <Path d="M134 62 L138 66 L147 57" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

    {/* Amount Tag */}
    <Rect x="85" y="90" width="110" height="24" rx="8" fill="#F8F7F4" stroke="#DDD8D2" strokeWidth="1" />
    <Rect x="100" y="98" width="80" height="8" rx="4" fill="#1C1917" />

    {/* Breakdown Lines */}
    <Path d="M72 130 H208" stroke="#E3DFD9" strokeWidth="1" strokeDasharray="4 4" />
    <Rect x="72" y="142" width="60" height="6" rx="3" fill="#78716C" />
    <Rect x="180" y="142" width="28" height="6" rx="3" fill="#10B981" />

    <Rect x="72" y="156" width="75" height="6" rx="3" fill="#78716C" />
    <Rect x="175" y="156" width="33" height="6" rx="3" fill="#1677FF" />

    {/* Verified Stamp Badge */}
    <G transform="translate(182, 126) rotate(-10)">
      <Rect x="0" y="0" width="56" height="22" rx="6" fill="#DAF5E4" stroke="#10B981" strokeWidth="1.2" />
      <Path d="M12 11 L18 15 L26 8" stroke="#0E4A28" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </G>
  </Svg>
);

