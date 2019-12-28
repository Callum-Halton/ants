import { MyMath, colorString, Point } from './utils.js';
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
    this.minimumMarkerIntensities = {
      resourceMarker: 0.01,
      homeMarker: 0.01
    };
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

    this._homeLocation = new Point(Math.random() * (this.width - 100) + 50,
                                   Math.random() * (this.height - 100) + 50);
    this._agentsVision = this._cellSize * 10;

    this.colonies = [];
    let colonySpec = {
      loc                        : this._homeLocation,
      id                         : 0,
      color                      : [0,0,0],
      maxAgents                  : 1000,
      meanStepsBetweenSpawns     : 100,
      agent: {
        color                    : [0, 200, 200],
        vision                   : this._agentsVision,
        radius                   : 6,
        speed                    : 3,
        agitated                 : 0.01,
        resourceCarryingCapacity : 0.02,
      },
    }
    let colony = new Colony(this, colonySpec);
    this.colonies.push(colony);

    this._localBounds = this._preCalcLocalBounds(this._agentsVision);

    // Evolves resource implementation
    const resources = [{loc: new CellLoc(5, 5), amount: 1.0}];
    for (let resource = 0; resource < resources.length; resource++) {
      this._grid[resources[resource].loc.row][resources[resource].loc.col].resource = resources[resource].amount;
    }
  }

  pointToCellLoc(location, cellSize) {
    let col = Math.floor(location.x / cellSize);
    let row = Math.floor(location.y / cellSize);
    return new CellLoc(row, col);
  }

  _preCalcLocalBounds(radius) {
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

  getAgentsCount() {
    return this._agents.length;
  }

  changeFeature(location, feature, amount) {
    let cellLoc = this.pointToCellLoc(location, this._cellSize);
    // if (this._grid[cellLoc.row][cellLoc.col][markerType] <= this._maximumMarkerIntensities[markerType]) {
    this._grid[cellLoc.row][cellLoc.col][feature] += amount;
    // }
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
    let cellLoc = this.pointToCellLoc(location, this._cellSize);
    let cell = this._grid[cellLoc.row][cellLoc.col];
    let amountRemoved;
    if (cell.resource <= targetAmount) {
      amountRemoved = cell.resource;
    } else {
      amountRemoved = targetAmount;
    }
    cell.resource -= amountRemoved;
    return amountRemoved;
  }

  getFeatureValueHere(location, feature) {
    let cellLoc = this.pointToCellLoc(location, this._cellSize);
    return this._grid[cellLoc.row][cellLoc.col][feature];
  }

  * _localCellIteratorGenerator(/* Point */ location) {
    let cellLoc = this.pointToCellLoc(location, this._cellSize);
    for (let row = -this._localBounds.length; row < this._localBounds.length; row++) {
      let endCol = this._localBounds[Math.abs(row)];
      let adjRow = row + cellLoc.row;
      let y = adjRow * this._cellSize + this._cellSize / 2;
      for (let col = -endCol + 1 + cellLoc.col; col < endCol + cellLoc.col; col++) {
        if (adjRow >= 0 && col >= 0 &&
            adjRow < this._heightInCells &&
            col < this._widthInCells) {
          let x = col * this._cellSize + this._cellSize / 2;
          let cell = this._grid[adjRow][col];
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
  // { home: null, homeMarker: null }
  getLocalFeatures(/* Point */ location, /* features object */ features) {
    let cellLoc = this.pointToCellLoc(location, this._cellSize);
    let cogHelpers = {};
    if ("resourceMarker" in features) {
      cogHelpers.resourceMarker = new CogHelper(location, "resourceMarker");
    }
    if ("homeMarker" in features) {
      cogHelpers.homeMarker =  new CogHelper(location, "homeMarker");
    }
    let destinationArrays = {};
    if ("resource" in features) {
      destinationArrays.resource = [];
    }
    if ("home" in features) {
      destinationArrays.home = [];
    }
    let cellWithLocationIterator = this._localCellIteratorGenerator(location);
    for(let cellWithLocation of cellWithLocationIterator) {
      for (let cogHelperKey in cogHelpers) {
        cogHelpers[cogHelperKey].update(cellWithLocation);
      }
      for (let destinationArrayKey in destinationArrays) {
        if (cellWithLocation.cell[destinationArrayKey] > 0) {
          destinationArrays[destinationArrayKey].push(cellWithLocation.loc);
        }
      }
    }
    for (let cogHelperKey in cogHelpers) {
        features[cogHelperKey] = cogHelpers[cogHelperKey].getNormalizedCog();
    }
    for (let destinationArrayKey in destinationArrays) {
      features[destinationArrayKey] = destinationArrays[destinationArrayKey];
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

var times = [];
var fps;

/*
function showFps() {
  ctx.fillStyle = "#000000";
  ctx.font = "30px Courier";
  const xPos = WIDTH-240;
  ctx.fillText(terrain.getAgentsCount() + " AGENTS", xPos, HEIGHT-50);
  ctx.fillText(fps + " FPS", xPos, HEIGHT-20);
}
*/

var framesLeftToShowNotice = 3 * 30;

/*
function showNotice() {
  if (framesLeftToShowNotice > 0) {
    framesLeftToShowNotice -= 1;
    ctx.fillStyle = "#000000";
    ctx.font = "30px Courier";
    const xPos = WIDTH / 2 - 150;
    const yPos = HEIGHT / 2 - 20;
    ctx.fillText("CLICK TO ADD RESOURCE", xPos, yPos);
  }
}
*/

/*
function refreshLoop() {
  window.requestAnimationFrame(() => {
    terrain.draw();
    showFps();
    showNotice();
    const now = performance.now();
    while (times.length > 0 && times[0] <= now - 1000) {
      times.shift();
    }
    times.push(now);
    fps = times.length;
    refreshLoop();
  });
}

refreshLoop();
*/
