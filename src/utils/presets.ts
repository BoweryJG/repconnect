import { PipeConfig, Point, NodeConfig } from '../types/pipes';
import { generateOrganicPath, interpolatePoints } from './pathGenerator';

export const createNeuralNetwork = (
  nodes: Point[],
  connections: [number, number][],
  baseConfig?: Partial<PipeConfig>
): PipeConfig[] => {
  return connections.map(([from, to], index) => {
    const start = nodes[from];
    const end = nodes[to];
    const { controlPoint1, controlPoint2 } = generateOrganicPath(start, end, 0.4);
    
    return {
      id: `neural-${from}-${to}`,
      segments: [{
        id: `segment-${index}`,
        start,
        end,
        controlPoint1,
        controlPoint2,
        width: 2 + Math.random() * 2,
      }],
      gradientStart: `hsl(${from * 60}, 100%, 50%)`,
      gradientEnd: `hsl(${to * 60}, 100%, 50%)`,
      animationDuration: 3 + Math.random() * 2,
      animationDelay: index * 0.1,
      glowIntensity: 2,
      flowSpeed: 0.8 + Math.random() * 0.4,
      interactive: true,
      ...baseConfig,
    };
  });
};

export const createPortalRings = (
  center: Point,
  ringCount: number = 3,
  baseRadius: number = 100
): PipeConfig[] => {
  return Array.from({ length: ringCount }, (_, i) => {
    const radius = baseRadius + i * 30;
    
    return {
      id: `portal-ring-${i}`,
      segments: [{
        id: `ring-${i}`,
        start: { x: center.x + radius, y: center.y },
        end: { x: center.x + radius, y: center.y },
        controlPoint1: { x: center.x + radius, y: center.y - radius },
        controlPoint2: { x: center.x - radius, y: center.y + radius },
        width: 4 - i * 0.5,
      }],
      color: ['#00ffff', '#ff00ff', '#ffff00'][i % 3],
      animationDuration: 4 + i,
      glowIntensity: 5 - i,
      flowSpeed: 1.5 - i * 0.3,
      interactive: true,
    };
  });
};

export const createDataFlow = (
  waypoints: Point[],
  branchPoints: { at: number; to: Point }[] = []
): PipeConfig[] => {
  const mainPipe: PipeConfig = {
    id: 'main-flow',
    segments: waypoints.slice(0, -1).map((point, i) => {
      const next = waypoints[i + 1];
      const { controlPoint1, controlPoint2 } = generateOrganicPath(point, next, 0.2);
      
      return {
        id: `flow-segment-${i}`,
        start: point,
        end: next,
        controlPoint1,
        controlPoint2,
        width: 5,
      };
    }),
    gradientStart: '#0088ff',
    gradientEnd: '#00ff88',
    animationDuration: 6,
    glowIntensity: 3,
    flowSpeed: 1,
    interactive: true,
  };
  
  const branches = branchPoints.map((branch, i) => {
    const startPoint = interpolatePoints(
      waypoints[Math.floor(branch.at)],
      waypoints[Math.ceil(branch.at)],
      branch.at % 1
    );
    const { controlPoint1, controlPoint2 } = generateOrganicPath(startPoint, branch.to, 0.3);
    
    return {
      id: `branch-${i}`,
      segments: [{
        id: `branch-segment-${i}`,
        start: startPoint,
        end: branch.to,
        controlPoint1,
        controlPoint2,
        width: 3,
      }],
      color: ['#ffaa00', '#ff00aa', '#aaff00'][i % 3],
      animationDuration: 4,
      animationDelay: 0.5 + i * 0.5,
      glowIntensity: 2,
      flowSpeed: 0.8,
      interactive: true,
    };
  });
  
  return [mainPipe, ...branches];
};

export const createOrganicWeb = (
  center: Point,
  nodeCount: number = 8,
  radius: number = 200,
  interconnectedness: number = 0.3
): { pipes: PipeConfig[]; nodes: NodeConfig[] } => {
  const nodes: NodeConfig[] = Array.from({ length: nodeCount }, (_, i) => {
    const angle = (i / nodeCount) * Math.PI * 2;
    const r = radius * (0.8 + Math.random() * 0.4);
    
    return {
      id: `web-node-${i}`,
      position: {
        x: center.x + Math.cos(angle) * r,
        y: center.y + Math.sin(angle) * r,
      },
      type: Math.random() > 0.5 ? 'source' : 'sink',
      color: `hsl(${i * (360 / nodeCount)}, 100%, 50%)`,
      radius: 6 + Math.random() * 4,
    };
  });
  
  const pipes: PipeConfig[] = [];
  
  for (let i = 0; i < nodeCount; i++) {
    for (let j = i + 1; j < nodeCount; j++) {
      if (Math.random() < interconnectedness) {
        const start = nodes[i].position;
        const end = nodes[j].position;
        const { controlPoint1, controlPoint2 } = generateOrganicPath(start, end, 0.5);
        
        pipes.push({
          id: `web-pipe-${i}-${j}`,
          segments: [{
            id: `web-segment-${i}-${j}`,
            start,
            end,
            controlPoint1,
            controlPoint2,
            width: 1 + Math.random() * 3,
          }],
          gradientStart: nodes[i].color || '#ffffff',
          gradientEnd: nodes[j].color || '#ffffff',
          animationDuration: 3 + Math.random() * 4,
          animationDelay: Math.random() * 2,
          glowIntensity: 1 + Math.random() * 2,
          flowSpeed: 0.5 + Math.random(),
          opacity: 0.6 + Math.random() * 0.4,
          interactive: true,
        });
      }
    }
  }
  
  return { pipes, nodes };
};