export class MyMath {
  static sin(angle) {
    return Math.sin(angle * 2 * Math.PI / 360);
  }

  static cos(angle) {
    return Math.cos(angle * 2 * Math.PI / 360);
  }

  static atan(ratio) {
    return Math.atan(ratio) * 360 / (2 * Math.PI);
  }
}

export function colorString(color) {
    return `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
}

export class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}

// Intended for implementing barriers. Lines can be passed into terrian,
// which can then find which cells they pass through. See
// Terrain::addBarrier()
export class Line {
  constructor(point_a, point_b) {
    this.point_a = point_a;
    this.point_b = point_b;
  }
}
