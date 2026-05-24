import React from 'react';
import Svg, { Circle, Ellipse, G } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
}

export default function ProfileIcon({ size = 24, color = 'currentColor' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <G fill="none" stroke={color} strokeWidth={1.5}>
        <Circle cx={12} cy={6} r={4} />
        <Ellipse cx={12} cy={17} rx={7} ry={4} />
      </G>
    </Svg>
  );
}