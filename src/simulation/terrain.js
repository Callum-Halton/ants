import { Point, capitalize} from './utils.js';
import Colony from './colony.js';
import Agent from './agent.js';
import { Cell, CellWithLocation, CellLoc } from './cell.js';
import CogHelper from './cogHelper.js';

export default class Terrain {
  // Constructs a terrain of size width and height, consisting of square
  // cells which are of size cellSize on a side.
  constructor(width, height, cellSize, featureProfiles) {
    this.width = width;
    this.height = height;
    this._cellSize = cellSize;
    this.featureProfiles = featureProfiles;
    this.reset();
  }

  reset() {
    this._widthInCells = Math.ceil(this.width/this._cellSize);
    this._heightInCells = Math.ceil(this.height/this._cellSize);
    this._grid = new Array(this._heightInCells);
    for (let row = 0; row < this._heightInCells; row++) {
      this._grid[row] = new Array(this._widthInCells);
      for (let col = 0; col < this._widthInCells; col++) {
        this._grid[row][col] = new Cell(this);
      }
    }

    this.featureObjects = {
      colony: [],
      agent: [],
    };

  }

  _pointToCellLoc(location) {
    let col = Math.floor(location.x / this._cellSize);
    let row = Math.floor(location.y / this._cellSize);
    return new CellLoc(row, col);
  }

  preCalcLocalBounds(radius) {
    let bounds = [];
    let cellRad = Math.round(radius / this._cellSize);
    for (let row = 0; row <= cellRad; row++) {
      for (let col = 0; col <= cellRad; col++) {
        if (Math.hypot((this._cellSize * col), (this._cellSize * row)) > radius) {
          bounds.push(col);
          break;
        }
      }
      if (bounds.length !== row + 1) {
          bounds.push(cellRad + 1);
      }
    }
    return bounds;
  }
  
  addFeatureObject(featureType, featureID, spawnContext) {
    let classUsed = featureType === 'agent' ? Agent : Colony;
    this.featureObjects[featureType].push(
      new classUsed(
        this, 
        this.featureProfiles[featureType][featureID],
        spawnContext,
      )
    );
  }

  getAgentsCount() {
    return this.featureObjects.agent.length;
  }

  getFeature(location, featureType, featureID) {
    let cellLoc = this._pointToCellLoc(location);
    return this._grid[cellLoc.row][cellLoc.col].getFeature(featureType, featureID);
  }

  addFeature(location, featureType, featureID, amount) {
    let cellLoc = this._pointToCellLoc(location);
    this._grid[cellLoc.row][cellLoc.col].addFeature(featureType, featureID, amount);
  }

  takeFeature(location, featureType, featureID, targetAmount) {
    let cellLoc = this._pointToCellLoc(location);
    return this._grid[cellLoc.row][cellLoc.col].takeFeature(featureType, featureID, targetAmount);
  }
  
  moveAgent(agentID, startLoc, endLoc) {
    let { row: startRow, col: startCol } = this._pointToCellLoc(startLoc);
    let { row: endRow, col: endCol } = this._pointToCellLoc(endLoc);
    let { _grid } = this; 
    
    if (startRow !== endRow || startCol !== endCol) {
      _grid[startRow][startCol].takeFeature('agent', agentID, 1);
      _grid[endRow][endCol].addFeature('agent', agentID, 1);
    }
  }
  
  resetCell(location) {
    let { row, col } = this._pointToCellLoc(location);
    this._grid[row][col].reset();
  }

  // Add a barrier the occupies all the cells that line passes through
  addBarrier(line) {
  }


  * _localCellIteratorGenerator(location, localBounds) {
    let cellLoc = this._pointToCellLoc(location);
    for (let row = -localBounds.length; row < localBounds.length; row++) {
      let endCol = localBounds[Math.abs(row)];
      let adjRow = row + cellLoc.row;
      let y = adjRow * this._cellSize + this._cellSize / 2;
      for (let col = -endCol + 1 + cellLoc.col; col < endCol + cellLoc.col; col++) {
        if (adjRow >= 0 && col >= 0 &&
            adjRow < this._heightInCells &&
            col < this._widthInCells) {
          let x = col * this._cellSize + this._cellSize / 2;
          let cell = this._grid[adjRow][col];
          //cell.debug = true;
          let loc = new Point(x, y);
          yield new CellWithLocation(cell, loc);
        }
      }
    }
  }

  /*
  Returns angle in degrees of optimal direction for a given signal in bounds.
  Returns null if an optimal direction cannot be determined from the signal.
  For Callum: possibly implement a more efficient version of the COG
             algorithm by factoring out some of the repeated
             multiplications.
  */
  // features is an object with a property for each feature that is being searched for e.g.
  // { resource: { food : [] }, colony : { C0 : [] }, marker : { H0 : null} }
  getLocalFeatures(/* Point */ location, /* features object */ features, localBounds) {
    let cogHelpers = {};

    if (typeof(features.marker) !== "undefined") {
      for (let markerID in features.marker) {
          cogHelpers[markerID] =  new CogHelper(location, markerID);
      }
    }

    let cellWithLocationIterator = this._localCellIteratorGenerator(location, localBounds);
    for(let cellWithLocation of cellWithLocationIterator) {
      for (let featureType in features) {
        if (featureType === "marker") {
          for (let cogHelperKey in cogHelpers) {
            cogHelpers[cogHelperKey].update(cellWithLocation);
          }
        } else {
          for (let desitinationID in features[featureType]) {
            let destinationValue = cellWithLocation.cell.getFeature(featureType, desitinationID);
            if (destinationValue > 0) {
              features[featureType][desitinationID].push(cellWithLocation.loc);
            }
          }
        }
      }
    }

    for (let cogHelperKey in cogHelpers) {
      features.marker[cogHelperKey] = cogHelpers[cogHelperKey].getNormalizedCog();
    }
  }


  // Returns "left", "straight", or "right" depending on whether there is
  // a barrier within range in the direction of travel and whether turning
  // left or right (a little) will increase the freedom of movement.
  leastBlockedTurn(location, direction, range) {
  }

  _update() {
    let agentProfiles = this.featureProfiles.agent;
    for (let featureID in agentProfiles) {
      let featureProfile = agentProfiles[featureID];
      featureProfile.localBounds = this.preCalcLocalBounds(featureProfile.vision);
    }
  }

  draw(ctx, agentsFrozen) {
    this._update();

    // Background
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, this.width, this.height);

    // Cells
    let y = 0;
    for (let row = 0; row < this._heightInCells; row++) {
      let x = 0;
      for (let col = 0; col < this._widthInCells; col++) {
        let location = new Point(x, y);
        let cell = this._grid[row][col];
        cell.draw(ctx, location, this._cellSize, agentsFrozen);
        x = x + this._cellSize;
      }
      y = y + this._cellSize;
    }

    // Grid
    ctx.strokeStyle = "#F8F8F8";
    for (let lineX = this._cellSize; lineX < this.width; lineX += this._cellSize) {
      ctx.beginPath();
      ctx.moveTo(lineX, 0);
      ctx.lineTo(lineX, this.height);
      ctx.stroke();
    }
    for (let lineY = this._cellSize; lineY < this.height; lineY += this._cellSize) {
      ctx.beginPath();
      ctx.moveTo(0, lineY);
      ctx.lineTo(this.width, lineY);
      ctx.stroke();
    }

    let { featureObjects } = this;
    for (let featureType in featureObjects) {
      for (let featureObject of featureObjects[featureType]) {
        featureObject.draw(ctx, agentsFrozen);
      }
    }
    
  }
}
