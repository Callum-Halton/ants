import Agent from './agent.js';
import { MyMath, colorString, Point } from './utils.js';

var hideDebug = true;
var stopAnimation = false;
var MORERESOURCE = false;
var testMode = false;

function keydown(event) {
  if (event.key === "a") {
    hideDebug = false;
  } else if (event.key === "s") {
    stopAnimation = true;
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

// const WIDTH = 1000; //window.innerWidth;
// const HEIGHT = 1000; //window.innerHeight;
const GRID_SIZE = 20;
const MAX_AGENTS = 200;
// const FREEZE = false;
// const canvas = document.getElementById('canva');
// canvas.addEventListener('click', (event) => {canvasClick(event)}, false);
// canvas.width = WIDTH;
// canvas.height = HEIGHT;
// const ctx = canvas.getContext('2d');

class CellLoc {
  constructor(row, col) {
    this.row = row;
    this.col = col;
  }
}

// Intended for implementing barriers. Lines can be passed into terrian,
// which can then find which cells they pass through. See
// Terrain::addBarrier()
class Line {
  constructor(point_a, point_b) {
    this.point_a = point_a;
    this.point_b = point_b;
  }
}

class Cell {
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
class CellWithLocation {
  constructor(/* Cell */ cell, /* Point */ location) {
    this.cell = cell;
    this.loc = location;
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
  /*
  If we store the pheromone markers using independent objects then we
  would need to have each agent compare its location with every marker
  object on every step. This would quickly cause the program to grind to
  a halt because it requires n^2 computation complexity.

  A solution is to have this terrain object that stores the information
  that the agents interact with. It can store the information, such as the
  locations of barriers, resources, and markers, in a spatially localized
  way, which enables the agents to efficiently interact with the terrain.
  */

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
    let homeLocation = new Point(Math.random() * (this.width - 100) + 50,
                                 Math.random() * (this.height - 100) + 50);
    this._homeLocation = homeLocation;
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
    let homeCellLoc = this.pointToCellLoc(this._homeLocation, this._cellSize);
    this._grid[homeCellLoc.row][homeCellLoc.col].home = 1;
    this._agents = [];
    this._agentsVision = this._cellSize * 10;
    this._localBounds = this._preCalcLocalBounds(this._agentsVision);
    this._meanStepsBetweenSpawns = 10;
    this._spawnCountdown = 0;
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

  _spawnAgentAtHome() {
    this._agents.push(new Agent(this, this._homeLocation, this._agentsVision));
  }

  /*
  _spawnColony() {
    let numberOfAgents;
    if (FREEZE) {
      numberOfAgents = 1;
    } else {
      numberOfAgents = 100;
    }
    for (let i=0; i<numberOfAgents; i++) {
      this._spawnAgentAtHome(i);
    }
  }
  */

  _update(agentsFrozen) {
    if (agentsFrozen) {
      if (this._agents.length < 1) {
        this._spawnAgentAtHome();
      }
    } else if (this._agents.length < MAX_AGENTS) {
      if (this._spawnCountdown === 0) {
        this._spawnAgentAtHome();
        this._spawnCountdown = Math.floor(
            Math.random() * this._meanStepsBetweenSpawns * 2);
      } else {
        this._spawnCountdown -= 1;
      }
    }
  }

  draw(ctx, agentsFrozen) {
    this._update(agentsFrozen);

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

    // Agents
    for (let i=0; i < this._agents.length; i++) {
      this._agents[i].draw(ctx, agentsFrozen);
    }
  }
}

/*
let homeLocation;
if (FREEZE) {
  homeLocation = new Point(510, 510);
} else {
  homeLocation = new Point(Math.random() * (WIDTH - 100) + 50, Math.random() * (HEIGHT - 100) + 50);
}
const resourcesForTerrain = [
  {loc: new CellLoc(5, 5), amount: 1.0}
];
const terrain = new Terrain(WIDTH, HEIGHT, homeLocation, GRID_SIZE, resourcesForTerrain);
*/
// This gets referenced directly by the agent object, which is really dodgy.
// let resource = new Resource(new Point(250, 250));

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
      if (!stopAnimation) {
        refreshLoop();
      }
    });
  }
}

refreshLoop();
*/
