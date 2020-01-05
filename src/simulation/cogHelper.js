import { Point } from './utils.js';

export default class CogHelper {
  constructor(defaultPosition, markerID) {
    this.markerID = markerID; // this is a string.
    this._defaultPosition = defaultPosition;
    this._total = 0;
    this._nonNormalizedCog = new Point(0, 0);
  }

  update(/* CellWithLocation */ cellWithLocation) {
    let markerValue = cellWithLocation.cell.getFeature(this.markerID);
    this._nonNormalizedCog.x += cellWithLocation.loc.x * markerValue;
    this._nonNormalizedCog.y += cellWithLocation.loc.y * markerValue;
    this._total += markerValue;
  }

  getNormalizedCog() {
    if (this._total > 0) {
      let normalizedCog = new Point(this._nonNormalizedCog.x / this._total,
                                    this._nonNormalizedCog.y / this._total);
      /*
      this.ctx.fillStyle = "#FF0000";
      this.ctx.beginPath();
      this.ctx.arc(normalizedCog.x, normalizedCog.y, 5, 0, 2 * Math.PI);
      this.ctx.fill();
      */
      return normalizedCog;
    } else {
      return this._defaultPosition;
    }
  }
}
