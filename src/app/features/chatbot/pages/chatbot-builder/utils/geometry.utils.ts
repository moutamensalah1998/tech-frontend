export class GeometryUtils {
  static calculateMidpoint(
    x1: number, y1: number,
    x2: number, y2: number
  ): { x: number; y: number } {
    return {
      x: (x1 + x2) / 2,
      y: (y1 + y2) / 2
    };
  }

  static snapToGrid(value: number, gridSize: number = 20): number {
    return Math.round(value / gridSize) * gridSize;
  }

  static isPointInRect(
    pointX: number, pointY: number,
    rectX: number, rectY: number,
    rectWidth: number, rectHeight: number
  ): boolean {
    return pointX >= rectX &&
           pointX <= rectX + rectWidth &&
           pointY >= rectY &&
           pointY <= rectY + rectHeight;
  }
}
