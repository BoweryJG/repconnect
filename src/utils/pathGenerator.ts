import { Point, PipeSegment } from '../types/pipes';

export const generateOrganicPath = (
  start: Point,
  end: Point,
  variance: number = 0.3
): { controlPoint1: Point; controlPoint2: Point } => {
  const midX = (start.x + end.x) / 2;
  const midY = (start.y + end.y) / 2;

  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  const perpX = -dy / distance;
  const perpY = dx / distance;

  const offset1 = (Math.random() - 0.5) * variance * distance;
  const offset2 = (Math.random() - 0.5) * variance * distance;

  const controlPoint1: Point = {
    x: midX + perpX * offset1 + (Math.random() - 0.5) * distance * 0.2,
    y: midY + perpY * offset1 + (Math.random() - 0.5) * distance * 0.2,
  };

  const controlPoint2: Point = {
    x: midX + perpX * offset2 + (Math.random() - 0.5) * distance * 0.2,
    y: midY + perpY * offset2 + (Math.random() - 0.5) * distance * 0.2,
  };

  return { controlPoint1, controlPoint2 };
};

export const segmentToPath = (segment: PipeSegment): string => {
  const { start, end, controlPoint1, controlPoint2 } = segment;
  return `M ${start.x} ${start.y} C ${controlPoint1.x} ${controlPoint1.y}, ${controlPoint2.x} ${controlPoint2.y}, ${end.x} ${end.y}`;
};

export const generateFluidPath = (points: Point[], smoothness: number = 0.2): string => {
  if (points.length < 2) return '';

  let path = `M ${points[0].x} ${points[0].y}`;

  for (let i = 1; i < points.length; i++) {
    const xMid = (points[i - 1].x + points[i].x) / 2;
    const yMid = (points[i - 1].y + points[i].y) / 2;
    const cp1x = points[i - 1].x + (xMid - points[i - 1].x) * smoothness;
    const cp1y = points[i - 1].y + (yMid - points[i - 1].y) * smoothness;
    path += ` Q ${cp1x} ${cp1y}, ${xMid} ${yMid}`;
  }

  const lastPoint = points[points.length - 1];
  path += ` T ${lastPoint.x} ${lastPoint.y}`;

  return path;
};

export const generateLoopPath = (
  center: Point,
  radius: number,
  startAngle: number = 0,
  endAngle: number = Math.PI * 2,
  variation: number = 0.1
): string => {
  const steps = 50;
  const points: Point[] = [];

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const angle = startAngle + (endAngle - startAngle) * t;
    const r = radius * (1 + (Math.random() - 0.5) * variation);

    points.push({
      x: center.x + Math.cos(angle) * r,
      y: center.y + Math.sin(angle) * r,
    });
  }

  return generateFluidPath(points, 0.3);
};

export const generateBranchPath = (
  trunk: Point[],
  branchPoint: number,
  branchEnd: Point,
  curvature: number = 0.4
): string => {
  const branchStartIndex = Math.floor(trunk.length * branchPoint);
  const branchStart = trunk[branchStartIndex];

  const { controlPoint1, controlPoint2 } = generateOrganicPath(branchStart, branchEnd, curvature);

  return `M ${branchStart.x} ${branchStart.y} C ${controlPoint1.x} ${controlPoint1.y}, ${controlPoint2.x} ${controlPoint2.y}, ${branchEnd.x} ${branchEnd.y}`;
};

export const interpolatePoints = (start: Point, end: Point, t: number): Point => ({
  x: start.x + (end.x - start.x) * t,
  y: start.y + (end.y - start.y) * t,
});

export const getPathLength = (path: string): number => {
  const tempSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  const tempPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  tempPath.setAttribute('d', path);
  tempSvg.appendChild(tempPath);
  document.body.appendChild(tempSvg);
  const length = tempPath.getTotalLength();
  document.body.removeChild(tempSvg);
  return length;
};
