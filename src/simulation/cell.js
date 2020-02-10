import { colorString, colorStringRGBA } from './utils.js';

export class Cell {
  constructor(terrain) {
    this._terrain = terrain;
    this.reset();
  }

  reset() {
    this.hasStuff = false;
    this.contents = {
    // contents contains feature buckets, each referred to by featureType, which
    // contain features, each referred to by featureID.
    // featureType : featureBucket
      resource : {},
      marker   : {},
      colony   : {},
      barrier  : {},
      agent    : {},
    };

    this.contentsCounts = {};
    for (let featureType in this.contents) {
      this.contentsCounts[featureType] = 0;
    }
  }
  
  _updateHasStuff() {
    let counts = this.contentsCounts;
    for (let featureType in counts) {
      if (counts[featureType] > 0) {
        this.hasStuff = true;
      }
    }
    this.hasStuff = true;
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
    if (amount === null) {
      if (!featureBucket[featureID]) {
        featureBucket[featureID] = 1;
        this.contentsCounts[featureType] += 1;
        this.hasStuff = true;
      }
    } else {
      if (typeof(featureBucket[featureID]) === "undefined") {
        if (amount > 0) {
          this.contentsCounts[featureType] += 1;
          this.hasStuff = true;
        }
        featureBucket[featureID] = amount;
      } else {
        if (featureBucket[featureID] === 0 && amount > 0) {
          this.contentsCounts[featureType] += 1;
          this.hasStuff = true;
        }
        featureBucket[featureID] += amount;
      }
    }
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
          this._updateHasStuff();
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
        let markerProfile = this._terrain.featureProfiles['marker'][markerID];
        // this forget rate MUST BE SLOWER THAT THE AGENTS FORGET RATE
        markers[markerID] *= markerProfile.fadeRate;
        if (markers[markerID] < markerProfile.minimumIntensity) {
          markers[markerID] = 0;
        }
    }
  }

  draw(ctx, location, cellSize, frozen) {
    if (this.hasStuff) {
      let icon = null;
      let contents = this.contents;
      let counts = this.contentsCounts;

      /*if (counts.agent > 0) {
        icon = 'circle';
        ctx.fillStyle = '#eeeeee'
      } else */if (counts.colony > 0) {
        icon = 'circle';
        for (let colonyID in contents.colony) {
          ctx.fillStyle = colorString(this._terrain.featureProfiles.colony[colonyID].color);
        }
      } else if (counts.resource > 0) {
        icon = 'diamond';
        for (let resourceID in contents.resource) {
          ctx.fillStyle = colorString([(1 - contents.resource[resourceID]) * 255,
                                    255,
                                    255]);
        }
      } else if (counts.barrier > 0) {
        for (let barrierID in contents.barrier) {
          ctx.fillStyle = colorString(this._terrain.featureProfiles.barrier[barrierID].color);
          ctx.fillRect(location.x, location.y, cellSize, cellSize);
        }
      } else {
        for (let markerID in contents.marker) {
          // Might be able to optimize here by doing the alpha-blend ourselves
          ctx.fillStyle = colorStringRGBA(this._terrain.featureProfiles.marker[markerID].color,
            contents.marker[markerID]);
          ctx.fillRect(location.x, location.y, cellSize, cellSize);
        }
      }

      if (icon) {
        ctx.fillRect(location.x, location.y, cellSize, cellSize);
        ctx.fillStyle = "#000000";
        ctx.beginPath();
        if (icon === 'circle') {
          ctx.arc(location.x + (cellSize / 2), location.y + (cellSize / 2), 5, 0, 2 * Math.PI);
        } else {
          let sizeOfDiamond = cellSize / 2.5;
          ctx.save();
          ctx.translate(location.x + (cellSize / 2), location.y + (cellSize / 2) - (Math.sqrt(2) * sizeOfDiamond * 0.5));
          ctx.rotate(90 * Math.PI / 360);
          ctx.fillRect(0, 0, sizeOfDiamond, sizeOfDiamond);
          ctx.restore();
        }
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
