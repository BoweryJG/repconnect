export interface Point {
  x: number;
  y: number;
}

export interface PipeSegment {
  id: string;
  start: Point;
  end: Point;
  controlPoint1: Point;
  controlPoint2: Point;
  width: number;
  opacity?: number;
}

export interface PipeConfig {
  id: string;
  segments: PipeSegment[];
  color?: string;
  gradientStart?: string;
  gradientEnd?: string;
  animationDuration?: number;
  animationDelay?: number;
  glowIntensity?: number;
  pulseIntensity?: number;
  flowSpeed?: number;
  opacity?: number;
  interactive?: boolean;
  onHover?: () => void;
  onClick?: () => void;
}

export interface PipeSystemConfig {
  pipes: PipeConfig[];
  backgroundColor?: string;
  enableInteractions?: boolean;
  performanceMode?: 'quality' | 'performance';
  globalGlow?: boolean;
  globalPulse?: boolean;
}

export interface AnimationState {
  isPlaying: boolean;
  currentTime: number;
  hoveredPipe?: string;
  selectedPipe?: string;
}

export type PathGenerator = (start: Point, end: Point, variance?: number) => string;

export interface NodeConfig {
  id: string;
  position: Point;
  type: 'source' | 'sink' | 'junction';
  radius?: number;
  color?: string;
  pulseIntensity?: number;
}

export interface FlowParticle {
  id: string;
  pipeId: string;
  position: number;
  speed: number;
  size: number;
  color?: string;
}