import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const VIEWPORT_WIDTH = width;
export const VIEWPORT_HEIGHT = height / 100;

export function calculateTabPosition(index: number, total: number): number {
  const tabWidth = VIEWPORT_WIDTH / total;
  return -(tabWidth * index + tabWidth / 2 - VIEWPORT_WIDTH / 2);
}

export function processGradient<T>(gradient: string | string[]): T {
  if (Array.isArray(gradient)) return gradient as T;
  return [gradient, gradient] as T;
}