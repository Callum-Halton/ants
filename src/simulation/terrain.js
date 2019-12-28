import { MyMath, colorString, Point } from './utils.js';
import Colony from './colony.js';
import { Cell, CellWithLocation, CellLoc } from './cell.js';

//var hideDebug = true;
//var MORERESOURCE = false;
//var testMode = false;

/*
function keydown(event) {
  if (event.key === "a") {
    hideDebug = false;
  } else if (event.key === "r") {
    MORERESOURCE = true;
  } else if (event.key === "t") {
    testMode = true;
  }
}

function keyup(event) {
  if (event.key === "a") {
    hideDebug = true;
  } else if (event.key === "r") {
    MORERESOURCE = false;
  }
}
*/

const GRID_SIZE = 20;
const MAX_AGENTS = 200;

// Intended for implementing barriers. Lines can be passed into terrian,
// which can then find which cells they pass through. See
// Terrain::addBarrier()
class Line {
  constructor(point_a, point_b) {
    this.point_a = point_a;
    this.point_b = point_b;
  }
}

class CogHelper {
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

export default class Terrain {
  // Constructs a terrain of size width and height, consisting of square
  // cells which are of size cellSize on a side.
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.minimumMarkerIntensities = {
      resourceMarker: 0.01,
      homeMarker: 0.01
    };
    this.reset();
  }

  reset() {
    this._cellSize = GRID_SIZE;
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
class Test {
  constructor() {
    this._assertionFailCount = 0;
    this._assertionPassCount = 0;
  }

  _assertEqual(a, b) {
    if (a !== b) {
      this._assertionFailCount += 1;
    } else {
      this._assertionPassCount += 1;
    }
  }

  _testPoint() {
    let p = new Point(25, 300);
    this._assertEqual(p.x, 25);
    this._assertEqual(p.y, 300);
  }

  _testCellLoc() {
    let c = new CellLoc(60, 22);
    this._assertEqual(c.row, 60);
    this._assertEqual(c.col, 22);
  }

  _testPointToCellLoc() {
    let p = new Point(150, 223);
    let c = terrain.pointToCellLoc(p, 26);
    this._assertEqual(c.row, 8);
    this._assertEqual(c.col, 5);
    p = new Point(30, 20);
    c = terrain.pointToCellLoc(p, 10);
    this._assertEqual(c.row, 2);
    this._assertEqual(c.col, 3);
    p = new Point(29, 19);
    c = terrain.pointToCellLoc(p, 10);
    this._assertEqual(c.row, 1);
    this._assertEqual(c.col, 2);
  }

  _testLine() {
  }

  runAll() {
    console.log("Runing all tests");
    this._testPoint();
    this._testCellLoc();
    this._testPointToCellLoc();
    this._testLine();
    let totalAssertions = this._assertionFailCount + this._assertionPassCount;
    console.log("Total assertions: " + totalAssertions);
    console.log("Total failed assertions: " + this._assertionFailCount);
    console.log("Total passed assertions: " + this._assertionPassCount);
  }
}
*/

/*
function refreshLoop() {
  if (testMode) {
    const test = new Test();
    test.runAll();
  } else {
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
}

refreshLoop();
*/
