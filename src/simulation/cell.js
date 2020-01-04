import { colorString, colorStringRGBA } from './utils.js';

/*
class thing(type) {
  this.type = type;
  this.amount = amount;
}
*/

export class Cell {
  constructor(terrain) {
    this._terrain = terrain;
    this.debug = false;
    this.markers = {};
    this.things = {
      //barrier : false,
      food : {type : "resource", amount : 0},
    };
  }

  _forget() {
    // these forget rates MUST BE SLOWER THAT THE AGENTS FORGET RATE
    for (let markerID in this.markers) {
      this.markers[markerID] *= 0.997;
      if (this.markers[markerID] < this._terrain.markerProfiles[markerID].minimumIntensity) {
        this.markers[markerID] = 0;
      }
    }
  }

  draw(ctx, location, cellSize) {
    let end_x = location.x + cellSize;
    let end_y = location.y + cellSize;
    let circle = false;
    if (this.things.resource > 0) {
      ctx.fillStyle = colorString([(1 - this.things.resource) * 255,
                                      255,
                                      255]);
      ctx.fillRect(location.x, location.y, end_x, end_y);
      circle = true

    } else if (this.things.length > 0) {

      for (let thing in this.things) {
        if (this.things[thing].charAt(0) === "C") {
          ctx.fillStyle = this._terrain.colonies[parseInt(this.things[thing].slice(1), 10)].color;
          ctx.fillRect(location.x, location.y, end_x, end_y);
          circle = true;
        }
      }
    } else {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(location.x, location.y, end_x, end_y);
      for (let markerID in this.markers) {
        ctx.fillStyle = colorStringRGBA(this._terrain.markerProfiles[markerID].color, this.markers[markerID]);
        ctx.fillRect(location.x, location.y, end_x, end_y);
      }
    }

    if (circle) {
      ctx.fillStyle = "#000000";
      ctx.beginPath();
      ctx.arc(location.x + cellSize/2, location.y + cellSize / 2, 5, 0, 2 * Math.PI);
      ctx.fill();
    }

    // debugging
    if (this.debug) {
      ctx.fillStyle = "#000000";
      ctx.fillRect(location.x, location.y, end_x, end_y);
      this.debug = false;
    }
    //

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

/*
Architecture scratch-pad

markers_indexes = ["r0", "..."]
home_indexes = ["c0", "c1"]

markers: {
  "r0" : 3,
  "r1" : 2,
  "h2" : 4,
  "t3" : 2,
}
contents: {
  "r0" : {
          type: "marker",
          amount: 1.0
         }
  "c0" : {
          type : "home",
          amount : 1,
         }
  "c1" : {
          type : "home",
          amount : 1,
         }
  "food": {
           type : "resource",
           amount : 1.5,
          }
}
*/
