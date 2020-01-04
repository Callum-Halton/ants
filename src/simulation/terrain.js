import { Point } from './utils.js';
import Colony from './colony.js';
import { Cell, CellWithLocation, CellLoc } from './cell.js';
import CogHelper from './cogHelper.js';

export default class Terrain {
  // Constructs a terrain of size width and height, consisting of square
  // cells which are of size cellSize on a side.
  constructor(width, height, cellSize) {
    this.width = width;
    this.height = height;
    this._cellSize = cellSize;

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

    /*this._homeLocation = new Point(Math.random() * (this.width - 100) + 50,
                                   Math.random() * (this.height - 100) + 50);*/

    this.markerProfiles = {};
    // use 0.01
    this.colonies = [];

    let colonySpec = {
      loc                        : new Point(50, 50),
      baseID                     : '0',
      color                      : [255, 255, 0],
      maxAgents                  : 1000,
      meanStepsBetweenSpawns     : 100,
      agent: {
        color                    : [0, 200, 200],
        vision                   : this._cellSize * 10,
        radius                   : 6,
        speed                    : 3,
        agitated                 : 0.01,
        resourceCarryingCapacity : 0.02,
        markerColors             : {
                                    resource : [0, 255, 255],
                                    home     : [255, 255, 0],
                                   },
      },
    };
    let colony = new Colony(this, colonySpec);
    this.colonies.push(colony);

    colonySpec = {
      loc                        : new Point(900, 900),
      baseID                     : '1',
      color                      : [255, 0, 0],
      maxAgents                  : 1000,
      meanStepsBetweenSpawns     : 100,
      agent: {
        color                    : [200, 0, 200],
        vision                   : this._cellSize * 10,
        radius                   : 6,
        speed                    : 3,
        agitated                 : 0.01,
        resourceCarryingCapacity : 0.02,
        markerColors             : {
                                    resource : [0, 0, 255],
                                    home     : [255, 0, 0],
                                   },
      },
    };
    colony = new Colony(this, colonySpec);
    this.colonies.push(colony);

    // Resources for debugging
    const resources = [{loc: this._pointToCellLoc(new Point(500, 500)), amount: 1.0}];
    for (let resource = 0; resource < resources.length; resource++) {
      this._grid[resources[resource].loc.row][resources[resource].loc.col].things.resource = resources[resource].amount;
    }
    //
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

  addMarkerProfile(markerID, markerProfile) {
    this.markerProfiles[markerID] = markerProfile;
  }

  getAgentsCount() {
    let agentsCount = 0;
    for (const colony of this.colonies) {
      agentsCount += colony.agentsCount();
    }
    return agentsCount;
  }

  addThing(location, thingID, amount, thingDefault) {
    let cellLoc = this._pointToCellLoc(location);
    let things = this._grid[cellLoc.row][cellLoc.col].things;
    if (typeof(things[thingID]) === "undefined") {
      things[thingID] = thingDefault;
    } else {
      things[thingID].amount += amount;
    }
  }

  addMarker(location, markerID, amount) {
    let cellLoc = this._pointToCellLoc(location);
    let markers = this._grid[cellLoc.row][cellLoc.col].markers;
    if (typeof(markers[markerID]) === "undefined") {
      markers[markerID] = amount;
    } else {
      markers[markerID] += amount;
    }
  }

  // Add a barrier the occupies all the cells that line passes through
  addBarrier(line) {
  }

  // Adds the specific amount of resource to the cell that the location
  // falls into. Returns the amount of resource that was added.
  addResource(location, amount) {
  }

  // Remove up to the target_amount of resource from the cell that
  // location falls into. Once the cell is empty of resource, no more can
  // be removed. Returns the amount of resource removed.
  removeResource(location, targetAmount) {
    let cellLoc = this._pointToCellLoc(location);
    let cellThings = this._grid[cellLoc.row][cellLoc.col].things;
    let amountRemoved;
    if (cellThings.resource <= targetAmount) {
      amountRemoved = cellThings.resource;
    } else {
      amountRemoved = targetAmount;
    }
    cellThings.resource -= amountRemoved;
    return amountRemoved;
  }

  isMyColonyHereHere(location, colonyID) {
    let cellLoc = this._pointToCellLoc(location);
    return (colonyID in this._grid[cellLoc.row][cellLoc.col]['things']);
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
  // { things: {C0 : []}, markers: {H0 : null} }
  getLocalFeatures(/* Point */ location, /* features object */ features, localBounds) {
    let cogHelpers = {};
    for (let marker in features.markers) {
      cogHelpers[marker] =  new CogHelper(location, marker);
    }

    let cellWithLocationIterator = this._localCellIteratorGenerator(location, localBounds);
    for(let cellWithLocation of cellWithLocationIterator) {
      for (let cogHelperKey in cogHelpers) {
        cogHelpers[cogHelperKey].update(cellWithLocation);
      }
      for (let thing in features.things) {
        let thingVal = cellWithLocation.cell.things[thing];
        if (typeof(thingVal) !== "undefined") {
          if (thingVal > 0) {
            features.things[thing].push(cellWithLocation.loc);
          }
        }
      }
    }

    for (let marker in features.markers) {
      features.markers[marker] = cogHelpers[marker].getNormalizedCog();
    }
  }


  // Returns "left", "straight", or "right" depending on whether there is
  // a barrier within range in the direction of travel and whether turning
  // left or right (a little) will increase the freedom of movement.
  leastBlockedTurn(location, direction, range) {
  }

  _update() {

  }

  draw(ctx, agentsFrozen) {
    this._update();

    // Cells
    let y = 0;
    for (let row = 0; row < this._heightInCells; row++) {
      let x = 0;
      for (let col = 0; col < this._widthInCells; col++) {
        let location = new Point(x, y);
        let cell = this._grid[row][col];
        cell.draw(ctx, location, this._cellSize);
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

    for (let colony of this.colonies) {
      colony.draw(ctx, agentsFrozen);
    }

  }
}
