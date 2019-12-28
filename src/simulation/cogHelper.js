import { Point } from './utils.js';

export default class CogHelper {
  constructor(defaultPosition, markerType) {
    this.markerType = markerType; // this is a string.
    this._defaultPosition = defaultPosition;
    this._total = 0;
    this._nonNormalizedCog = new Point(0, 0);
  }
  update(/* CellWithLocation */ cellWithLocation) {
   let markerValue = cellWithLocation.cell[this.markerType];
   this._nonNormalizedCog.x += cellWithLocation.loc.x * markerValue;
   this._nonNormalizedCog.y += cellWithLocation.loc.y * markerValue;
   this._total += markerValue;
  }
  getNormalizedCog() {
    if (this._total > 0) {
      let normalizedCog = new Point(this._nonNormalizedCog.x / this._total,
                                    this._nonNormalizedCog.y / this._total);
      // ctx.fillStyle = "#FF0000";
      // ctx.beginPath();
      // ctx.arc(normalizedCog.x, normalizedCog.y, 5, 0, 2 * Math.PI);
      // ctx.fill();
      return normalizedCog;
    } else {
      return this._defaultPosition;
    }
  }
}
