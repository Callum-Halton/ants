import { colorString } from './utils.js'

export class Cell {
  constructor(terrain) {
    this._terrain = terrain;
    this.barrier = false;
    this.resource = 0;
    this.home = 0;
    this.resourceMarker = 0;
    this.homeMarker = 0;
    this.debug = false;
  }

  _forget() {
    // these forget rates MUST BE SLOWER THAT THE AGENTS FORGET RATE
    this.resourceMarker *= 0.997;
    if (this.resourceMarker < this._terrain.minimumMarkerIntensities.resourceMarker) {
      this.resourceMarker = 0;
    }
    this.homeMarker *= 0.997;
    if (this.homeMarker < this._terrain.minimumMarkerIntensities.homeMarker) {
      this.homeMarker = 0;
    }
  }

  draw(ctx, location, cellSize) {
    let end_x = location.x + cellSize;
    let end_y = location.y + cellSize;
    let circle = false;
    if (this.home) {
      ctx.fillStyle = "#FFFF00";
      circle = true;
    } else if (this.resource) {
      ctx.fillStyle = colorString([(1 - this.resource) * 255,
                                   255,
                                   255]);
      circle = true;
    } else {
      // The following calculation slows down rendering!
      ctx.fillStyle = colorString([(1 - this.resourceMarker) * 255,
                                   255,
                                   (1 - this.homeMarker) * 255]);
    }

    // debugging to show any trace marker amounts
    if (this.homeMarker) {
      // ctx.fillStyle = "#000000";
    }

    ctx.fillRect(location.x, location.y, end_x, end_y);
    if (circle) {
      ctx.fillStyle = "#000000";
      ctx.beginPath();
      ctx.arc(location.x + cellSize/2, location.y + cellSize / 2, 5, 0, 2 * Math.PI);
      ctx.fill();
    }

    this._forget();
  }
}

// A cell with the location of its center
export class CellWithLocation {
  constructor(/* Cell */ cell, /* Point */ location) {
    this.cell = cell;
    this.loc = location;
  }
}

export class CellLoc {
  constructor(row, col) {
    this.row = row;
    this.col = col;
  }
}
