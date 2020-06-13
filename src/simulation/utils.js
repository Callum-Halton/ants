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

export function colorStringRGBA(color, alpha) {
    return `rgb(${color[0]}, ${color[1]}, ${color[2]}, ${alpha})`;
}


export class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}

export function capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

export class DropContext {
  constructor(loc, origin) {
    this.loc = loc;
    this.origin = origin;
  }
}

export function FeatureObjectCounts() {
  this.colony = 0;
  this.agent = 0;
}

export class NumericAttributeInfo {
  constructor(min, step, max, val, flipVal) {
    this.min = min;
    this.step = step;
    this.max = max;
  }
}

// Intended for implementing barriers. Lines can be passed into terrian,
// which can then find which cells they pass through. See
// Terrain::addBarrier() 
/*
export class Line {
  constructor(point_a, point_b) {
    this.point_a = point_a;
    this.point_b = point_b;
  }
}
*/

/*
export class FeatureProfile {
  constructor(name, color, paletteFeatureAmount) {
    this.name = name;
    this.color = color;
    this.paletteFeatureAmount = paletteFeatureAmount;
    //this.expandedInEditor = false;
  }
}

export class MarkerProfile extends FeatureProfile {
  constructor(name, color, paletteFeatureAmount, minimumIntensity, fadeRate) {
    super(name, color, paletteFeatureAmount);
    this.minimumIntensity = minimumIntensity;
    this.fadeRate = fadeRate;
  }
}
*/