import { Injectable } from '@angular/core';
import { Node } from '../../../../../core/models/chatbot.model';

export interface ConnectionPath {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  controlPoints?: { x: number; y: number }[];
  type: 'straight' | 'bezier' | 'orthogonal';
}

@Injectable({
  providedIn: 'root'
})
export class ConnectionRoutingService {
  private routingType: 'straight' | 'bezier' | 'orthogonal' = 'bezier';

  setRoutingType(type: 'straight' | 'bezier' | 'orthogonal'): void {
    this.routingType = type;
  }

  calculatePath(
    from: { x: number; y: number },
    to: { x: number; y: number },
    fromNode?: Node,
    toNode?: Node
  ): ConnectionPath {
    switch (this.routingType) {
      case 'bezier':
        return this.calculateBezierPath(from, to, fromNode, toNode);
      case 'orthogonal':
        return this.calculateOrthogonalPath(from, to);
      default:
        return {
          x1: from.x,
          y1: from.y,
          x2: to.x,
          y2: to.y,
          type: 'straight'
        };
    }
  }

  private calculateBezierPath(
    from: { x: number; y: number },
    to: { x: number; y: number },
    fromNode?: Node,
    toNode?: Node
  ): ConnectionPath {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    
    // Control points for smooth curve
    const controlPoint1X = from.x + dx * 0.5;
    const controlPoint1Y = from.y;
    const controlPoint2X = to.x - dx * 0.5;
    const controlPoint2Y = to.y;

    return {
      x1: from.x,
      y1: from.y,
      x2: to.x,
      y2: to.y,
      controlPoints: [
        { x: controlPoint1X, y: controlPoint1Y },
        { x: controlPoint2X, y: controlPoint2Y }
      ],
      type: 'bezier'
    };
  }

  private calculateOrthogonalPath(
    from: { x: number; y: number },
    to: { x: number; y: number }
  ): ConnectionPath {
    const midX = (from.x + to.x) / 2;
    
    return {
      x1: from.x,
      y1: from.y,
      x2: to.x,
      y2: to.y,
      controlPoints: [
        { x: midX, y: from.y },
        { x: midX, y: to.y }
      ],
      type: 'orthogonal'
    };
  }

  getPathD(path: ConnectionPath): string {
    if (path.type === 'straight') {
      return `M ${path.x1} ${path.y1} L ${path.x2} ${path.y2}`;
    }

    if (path.type === 'bezier' && path.controlPoints && path.controlPoints.length >= 2) {
      const cp1 = path.controlPoints[0];
      const cp2 = path.controlPoints[1];
      return `M ${path.x1} ${path.y1} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${path.x2} ${path.y2}`;
    }

    if (path.type === 'orthogonal' && path.controlPoints && path.controlPoints.length >= 2) {
      const cp1 = path.controlPoints[0];
      const cp2 = path.controlPoints[1];
      return `M ${path.x1} ${path.y1} L ${cp1.x} ${cp1.y} L ${cp2.x} ${cp2.y} L ${path.x2} ${path.y2}`;
    }

    return `M ${path.x1} ${path.y1} L ${path.x2} ${path.y2}`;
  }
}

