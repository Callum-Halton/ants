import { colorString, colorStringRGBA, Point } from './utils.js';

export class Cell {
  constructor(terrain) {
    this._terrain = terrain;
    // contents contains feature buckets, each referred to by featureType, which
    // contain features, each referred to by featuredID.
    this.hasStuff = false;
    this.contents = {
// featureType : featureBucket
      resource : {},
      marker   : {},
      colony   : {},
      barrier  : {},
    };

    this.contentsCounts = {};
    for (let featureType in this.contents) {
      this.contentsCounts[featureType] = 0;
    }
  }

  _doIhaveStuff() {
    let counts = this.contentsCounts;
    for (let featureType in counts) {
      if (counts[featureType] > 0) {
        return true;
      }
    }
    return false;
  }

  getFeature(featureType, featureID) {
    let amount = this.contents[featureType][featureID];
    if (typeof(amount) === "undefined") {
      return 0;
    } else {
      return amount;
    }
  }

  addFeature(featureType, featureID, amount) {
    let featureBucket = this.contents[featureType];
    if (typeof(featureBucket[featureID]) === "undefined") {
      if (amount > 0) {
        this.contentsCounts[featureType] += 1;
      }
      featureBucket[featureID] = amount;
    } else {
      if (featureBucket[featureID] === 0 && amount > 0) {
        this.contentsCounts[featureType] += 1;
      }
      featureBucket[featureID] += amount;
    }
    this.hasStuff = true;
  }

  // Returns the amount that was taken
  takeFeature(featureType, featureID, targetAmount) {
    let featureBucket = this.contents[featureType];
    let currentAmount = featureBucket[featureID];
    if (typeof(currentAmount) === "undefined") {
      return 0;
    } else {
      if (currentAmount <= targetAmount) {
        let returnAmount = currentAmount;
        featureBucket[featureID] = 0;
        if (this.contentsCounts[featureType] > 0) {
          this.contentsCounts[featureType] -= 1;
          this.hasStuff = this._doIhaveStuff();
        }
        return returnAmount;
      } else {
        featureBucket[featureID] -= targetAmount;
        return targetAmount;
      }
    }
  }

  _forget() {
    let markers = this.contents.marker;
    for (let markerID in markers) {
        let markerProfile = this._terrain.featureProfiles[markerID];
        // this forget rate MUST BE SLOWER THAT THE AGENTS FORGET RATE
        markers[markerID] *= markerProfile.fadeRate;
        if (markers[markerID] < markerProfile.minimumIntensity) {
          markers[markerID] = 0;
        }
    }
  }

  draw(ctx, location, cellSize, frozen) {
    let endPoint = new Point(location.x + cellSize, location.y + cellSize);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(location.x, location.y, endPoint.x, endPoint.y);

    if (this.hasStuff) {
      let drawCircle = false;
      let contents = this.contents;
      let counts = this.contentsCounts;

      if (counts["colony"] > 0) {
        drawCircle = true;
        for (let colonyID in contents.colony) {
          ctx.fillStyle = this._terrain.featureProfiles[colonyID].cRender;
        }
      } else if (counts["resource"] > 0) {
        drawCircle = true;
        for (let resourceID in contents.resource) {
          ctx.fillStyle = colorString([(1 - contents.resource[resourceID]) * 255,
                                    255,
                                    255]);
        }
      } else if (counts["barrier"] > 0) {
        for (let barrierID in contents.barrier) {
          ctx.fillStyle = colorStringRGBA([0, 0, 0], contents.barrier[barrierID]);
          ctx.fillRect(location.x, location.y, endPoint.x, endPoint.y);
        }
      } else {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(location.x, location.y, endPoint.x, endPoint.y);
        for (let markerID in contents.marker) {
          //console.log(markerID);
          ctx.fillStyle = colorStringRGBA(this._terrain.featureProfiles[markerID].color,
            contents.marker[markerID]);
          ctx.fillRect(location.x, location.y, endPoint.x, endPoint.y);
        }
      }

      if (drawCircle) {
        ctx.fillRect(location.x, location.y, endPoint.x, endPoint.y);
        ctx.fillStyle = "#000000";
        ctx.beginPath();
        ctx.arc(location.x + (cellSize / 2), location.y + (cellSize / 2), 5, 0, 2 * Math.PI);
        ctx.fill();
      }

      if (!frozen) {
        this._forget();
      }
    }
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

contents: {
  "r0" : {
          type: "resource",
          amount: 1.0
         }
  "c0" : {
          type : "colony",
          amount : 1,
         }
  "c1" : {
          type : "colony",
          amount : 1,
         }
  "food": {
           type : "resource",
           amount : 1.5,
          }
}

markers: {
  r0 : 1
}
colonies : {
  c0 : 1
}
resources : {
  food : 1
}
*/

  /*
  _drawFeature(ctx, cellSquare, featureID) {
    let feature = this.contents[featureID];
    let drawCircle = false;
    if (feature.type === "marker"){
      ctx.fillStyle = colorStringRGBA(this._terrain.markerProfiles[featureID].color, feature.amount);
    } else if (feature.type === "resource") {
      ctx.fillStyle = colorString([(1 - feature.amount) * 255,
                                255,
                                255]);
      drawCircle = true;
    } else {
      console.log(featureID);
      ctx.fillStyle = this._terrain.colonies[parseInt(featureID.slice(1), 10)].cRender;
      drawCircle = true;
    }

    ctx.fillRect(cellSquare.tl.x, cellSquare.tl.y, cellSquare.br.x, cellSquare.br.y);

    if (drawCircle) {
      ctx.fillStyle = "#000000";
      ctx.beginPath();
      let middle = cellSquare.getMiddle();
      ctx.arc(middle.x, middle.y, 5, 0, 2 * Math.PI);
      ctx.fill();
    }
  }
  */

    /*
    let cellSquare = new Square(location, cellSize);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(cellSquare.tl.x, cellSquare.tl.y cellSquare.br.x, cellSquare.br.y);

    let featuresNotDrawn = true;
    // drawOrder of feature types
    let drawOrder = ["colony", "resource", "marker"];
    let drawOrderIndex = 0;
    while (featuresNotDrawn && drawOrderIndex < drawOrder.length) {
      let featureType = drawOrder[drawOrderIndex];
      for (let featureID in this.contents) {
        let feature = this.contents[featureID];
        if (feature.type === featureType && feature.amount > 0) {
          this._drawFeature(ctx, cellSquare, featureID);
          featuresNotDrawn = false;
        }
      }
      drawOrderIndex++;
    }
    */

      /*
  _hasFeaturesOfType(featureType) {
    let featureBucket = this.contents[featureType];
    for (let featureID in featureBucket) {
      let featureVal = featureBucket[featureID];
      if (typeof(featureVal) !== "undefined") {
        if (featureVal > 0) {
          return true;
        }
      }
    }
    return false;
  }
  */
