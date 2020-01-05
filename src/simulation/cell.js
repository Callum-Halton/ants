import { colorString, colorStringRGBA, Point } from './utils.js'

class Square  {
  constructor(topLeft, sideLength) {
    this.tl = new Point(topLeft.x, topLeft.y);
    this.rb = new Point(topleft.x + sideLength, topLeft.y + sideLength);
    this.sideLength = sideLength;
  }
  
  getMiddle() {
    let halfSideLength = this.sideLength / 2;
    var middle = new Point(topLeft.x + halfSideLength,
                           topLeft.y + halfSideLength);
    return middle;
  }
}

// type currently: "resource", "colony", "marker" (and others can be used)
export class Feature {
  constructor(type, amount) {
    this.type = type;
    this.amount = amount;
  }
}

export class Cell {
  constructor(terrain) {
    this._terrain = terrain;
    this.debug = false;
    this.contents = {};
  }
  
  getFeature(featureID) {
    let feature = this.contents[featureID];
    if (typeof(feature) === "undefined") {
      return 0;
    } else {
      return feature.amount;
    }
  }
  
  addFeature(featureType, featureID, amount) {
    let feature = this.contents[featureID];
    if (typeof(feature) === "undefined") {
      this.contents[featureID] = new Feature(featureType, amount);
    } else {
      feature.amount += amount;
    }
  }
  
  // Returns the amount that was taken
  takeFeature(featureID, targetAmount) {
    let feature = this.contents[featureID];
    if (typeof(feature) === "undefined") {
      return 0;
    } else {
      if (feature.amount < targetAmount) {
        let returnAmount = feature.amount;
        feature.amount = 0;
        return returnAmount;
      } else {
        feature.amount -= targetAmount;
        return targetAmount;
      }
    }
  }
  
  _forget() {
    for (let featureID in this.contents) {
      let feature = this.contents[featureID];
      if (feature.type === "marker") {
        let markerProfile = this._terrain.markerProfiles[featureID];
        // this forget rate MUST BE SLOWER THAT THE AGENTS FORGET RATE
        feature.amount *= markerProfile.fadeRate;
        if (feature.amount < markerProfile.minimumIntensity) {
          feature.amount = 0;
        }
      }
    }
  }
  
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
  
  draw(ctx, location, cellSize) {
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
    
    if (this.debug) {
      ctx.fillStyle = "#000000";
      ctx.fillRect(cellSquare.tl.x, cellSquare.tl.y cellSquare.br.x, cellSquare.br.y);
      this.debug = false;
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
