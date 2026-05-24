import type { SharedValue } from 'react-native-reanimated';
import type { ViewStyle } from 'react-native';

export interface Tab {
  id: string;
  title: string;
  icon: React.ReactNode;
  badge?: number;
}

export interface StyleConfig {
  barHeight: number;
  textSize: number;
  fontFamily?: string;
  inactiveColor: string;
  labelColor: string;
}

export interface FloatingButtonComponentProps {
  icon: React.ReactNode;
  tintColor?: string;
  gradient: string[];
  scale: number;
  shadow: ViewStyle;
  badge?: number;
}

export interface BackgroundCurveProps {
  position: SharedValue<number>;
  gradient: string[];
  height: number;
}

export interface CurvedBottomTabsProps {
  tabs: Tab[];
  currentIndex: number;
  onPress: (index: number, tab: Tab) => void;
  gradient: string | string[];
  barHeight?: number;
  buttonScale?: number;
  activeColor?: string;
  inactiveColor?: string;
  labelColor?: string;
  textSize?: number;
  fontFamily?: string;
  hideWhenKeyboardShown?: boolean;
  animation?: {
    damping: number;
    stiffness: number;
    mass: number;
  };
  shadow?: ViewStyle;
}

export interface CurvedTabBarNavigationProps {
  gradients?: string[];
}