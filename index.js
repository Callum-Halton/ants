var hideDebug = true;
var stopAnimation = false;
var MORERESOURCE = false;
var testMode = false;

function keydown(event) {
  if (event.key == "a") {
    hideDebug = false;
  } else if (event.key == "s") {
    stopAnimation = true;
  } else if (event.key == "r") {
    MORERESOURCE = true;
  } else if (event.key == "t") {
    testMode = true;
  }
}

function keyup(event) {
  if (event.key == "a") {
    hideDebug = true;
  } else if (event.key == "r") {
    MORERESOURCE = false;
  }
}

window.onload = () => {
  const WIDTH = 1000; //window.innerWidth;
  const HEIGHT = 1000; //window.innerHeight;
  const GRID_SIZE = 20;
  const MAX_AGENTS = 200;
  const FREEZE = false;
  const canvas = document.getElementById('canva');
  canvas.addEventListener('click', (event) => {canvasClick(event)}, false);
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d');

  function canvasClick(event) {
    let x = event.pageX - canvas.offsetLeft;
    let y = event.pageY - canvas.offsetTop;
    let location = new Point(x, y);
    // terrain.increaseResourceMarker(location, 0.1);
    if (MORERESOURCE) {
      terrain.increaseResource(location, 0.1);
    } else {
      terrain.increaseMarker(location, 0.1, "resourceMarker");
    }
  }

  class MyMath {
    static sin(angle) {
      return Math.sin(angle * 2 * Math.PI / 360);
    }

    static cos(angle) {
      return Math.cos(angle * 2 * Math.PI / 360);
    }

    static atan(ratio) {
      return Math.atan(ratio) * 360 / (2 * Math.PI);
    }
  }

  function colorString(color) {
      return `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
  }

  class Point {
    constructor(x, y) {
      this.x = x;
      this.y = y;
    }
  }

  class CellLoc {
    constructor(row, col) {
      this.row = row;
      this.col = col;
    }
  }

  function pointToCellLoc(location, cellSize) {
    let col = Math.floor(location.x / cellSize);
    let row = Math.floor(location.y / cellSize);
    return new CellLoc(row, col);
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
    constructor() {
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
      if (this.resourceMarker < terrain.minimumMarkerIntensities.resourceMarker) {
        this.resourceMarker = 0;
      }
      this.homeMarker *= 0.997;
      if (this.homeMarker < terrain.minimumMarkerIntensities.homeMarker) {
        this.homeMarker = 0;
      }
    }

    draw(location, cellSize) {
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
        //ctx.fillStyle = "#000000";
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
        ctx.fillStyle = "#FF0000";
        ctx.beginPath();
        ctx.arc(normalizedCog.x, normalizedCog.y, 5, 0, 2 * Math.PI);
        ctx.fill();
        return normalizedCog;
      } else {
        return this._defaultPosition;
      }
    }
  }

  class Terrain {
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
    constructor(width, height, homeLocation, cellSize, resources) {

      this.minimumMarkerIntensities = {
        resourceMarker: 0.01,
        homeMarker: 0.01
      }; 

      this._width = width;
      this._height = height;
      this._homeLocation = homeLocation;
      this._cellSize = cellSize;
      this._widthInCells = Math.ceil(this._width/this._cellSize);
      this._heightInCells = Math.ceil(this._height/this._cellSize);
      this._grid = new Array(this._heightInCells);
      for (let row = 0; row < this._heightInCells; row++) {
        this._grid[row] = new Array(this._widthInCells);
        for (let col = 0; col < this._widthInCells; col++) {
          this._grid[row][col] = new Cell();
        }
      }
      let homeCellLoc = pointToCellLoc(this._homeLocation, this._cellSize);
      this._grid[homeCellLoc.row][homeCellLoc.col].home = 1;
      this._agents = [];
      this._agentsVision = this._cellSize * 10;
      this._localBounds = this._preCalcLocalBounds(this._agentsVision);
      this._meanStepsBetweenSpawns = 10;
      this._spawnCountdown = 0;
      // Evolves resource implementation
      for (let resource = 0; resource < resources.length; resource++) {
        this._grid[resources[resource].loc.row][resources[resource].loc.col].resource = resources[resource].amount;
      }
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
        if (bounds.length != row + 1) {
            bounds.push(cellRad + 1);
        }
      }
      return bounds;
    }

    getAgentsCount() {
      return this._agents.length;
    }

    increaseMarker(location, amount, markerType) {
      let cellLoc = pointToCellLoc(location, this._cellSize);
      // if (this._grid[cellLoc.row][cellLoc.col][markerType] <= this._maximumMarkerIntensities[markerType]) {
      this._grid[cellLoc.row][cellLoc.col][markerType] += amount;
      // }
    }

    increaseResource(location, value) {
      let cellLoc = pointToCellLoc(location, this._cellSize);
      this._grid[cellLoc.row][cellLoc.col].resource += value;
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
      let cellLoc = pointToCellLoc(location, this._cellSize);
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
      let cellLoc = pointToCellLoc(location, this._cellSize);
      return this._grid[cellLoc.row][cellLoc.col][feature];
    }

    * _localCellIteratorGenerator(/* Point */ location) {
      let cellLoc = pointToCellLoc(location, this._cellSize);
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
      let cellLoc = pointToCellLoc(location, this._cellSize);
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

    _update() {
      if (FREEZE) {
        if (this._agents.length < 1) {
          this._spawnAgentAtHome();
        }
      } else if (this._agents.length < MAX_AGENTS) {
        if (this._spawnCountdown == 0) {
          this._spawnAgentAtHome();
          this._spawnCountdown = Math.floor(
              Math.random() * this._meanStepsBetweenSpawns * 2);
        } else {
          this._spawnCountdown -= 1;
        }
      }
    }

    draw() {
      this._update();

      // Cells
      let y = 0;
      for (let row = 0; row < this._heightInCells; row++) {
        let x = 0;
        for (let col = 0; col < this._widthInCells; col++) {
          let location = new Point(x, y);
          let cell = this._grid[row][col];
          cell.draw(location, this._cellSize);
          x = x + this._cellSize;
        }
        y = y + this._cellSize;
      }
      // Grid
      ctx.strokeStyle = "#F8F8F8";
      for (let lineX = this._cellSize; lineX < this._width; lineX += this._cellSize) {
        ctx.beginPath();
        ctx.moveTo(lineX, 0);
        ctx.lineTo(lineX, this._height);
        ctx.stroke();
      }
      for (let lineY = this._cellSize; lineY < this._height; lineY += this._cellSize) {
        ctx.beginPath();
        ctx.moveTo(0, lineY);
        ctx.lineTo(this._width, lineY);
        ctx.stroke();
      }

      // Agents
      for (let i=0; i < this._agents.length; i++) {
        this._agents[i].draw();
      }
    }
  }

  class Agent {
    constructor(terrain, loc, vision) {
      // The agent can interact with the terrain via the following object
      // reference.
      this._terrain = terrain;
      this._loc = new Point(loc.x, loc.y);
      this._radius = 6;
      this._direction = Math.random() * 360;
      this._color = [0, 100, 100];
      this._cRender = colorString(this._color);
      this._speed = 3;
      this._vision = vision;
      this._agitated = 0.01;
      this._resourceMemory = 0;
      this._carriedResource = 0;
      this._resourceCarryingCapacity = 0.02;
      this._homeMemory = 0.2;
    }

    _angleTo(target) {
      /*
      Remember that the x-axis increases left-to-right, but the y-axis
      increases top-to-bottom. So angle increases clockwise.
      */

      let dx = target.x - this._loc.x; // x-component of vector pointing at target
      let dy = target.y - this._loc.y; // y-component of vector pointing at target
      let angle = MyMath.atan(dy/dx);

      if (dx == 0) {
        // Handle case where dy/dx is undefined.
        if (dy > 0) {
          // Target is below
          return 90;
        } else {
          // Target is above
          return 270;
        }
      } else if (dy > 0) {
        if (dx > 0) {
          // Bottom-right quadrant
          angle = angle;
        } else {
          // Bottom-left quadrant
          angle = 180 + angle;
        }
      } else {
        if (dx > 0) {
          // Top-right quadrant
          angle = 360 + angle;
        } else {
          // top-left quadrant
          angle = 180 + angle;
        }
      }
      return angle;
    }

    _brighten(n) {
      for (var i = 0; i < 3; i++) {
        this._color[i] += n;
      }
      this._cRender = colorString(this._color);
    }

    _move() {
      this._loc.x += this._speed * MyMath.cos(this._direction);
      this._loc.y += this._speed * MyMath.sin(this._direction);
      // Callum, I added the following checks because sometimes the agents were
      // going off the edge of the canvas, leading to indexing out of bounds
      // in the cell array in terrain.
      if (this._loc.x < 0) { this._loc.x = 0; }
      if (this._loc.y < 0) { this._loc.y = 0; }
      if (this._loc.x >= WIDTH) { this._loc.x = WIDTH-1; }
      if (this._loc.y >= HEIGHT) { this._loc.y = HEIGHT-1; }
    }

    /*
    _reached(target) {
      let threshold = this._speed / 2;
      if (Math.hypot(this._loc.x - target.loc.x, this._loc.y - target.loc.y) <=
          threshold) {
        return true;
      } else {
        return false;
      }
    }
    */

    _upGradientDirection(centerOfGravity) {
      const threshold = this._terrain._cellSize; // hack for now
      if (Math.hypot(this._loc.x - centerOfGravity.x,
                     this._loc.y - centerOfGravity.y) > threshold) {
        let direction = this._angleTo(centerOfGravity);
        return direction;
      } else {
        return null;
      }
    }

    _wanderAimlessly() {
      if (Math.random() < this._agitated) {
        this._direction = Math.random() * 360;
      } // else just keep on truckin' in the same direction
    }

    _changeDirection() {
      /*
      Below is a pseudo-code plan for the method:

      if not full
        if can see resource then
          turn towards resource
        else if there is a resource marker gradient then
          turn up gradient
        else if headed toward a barrier then
          avoid barrier
        else
          change direction probabilistically based on time since last
          change plus other factors.
      if full
        if can see home then
          turn towards home
        else if there is a home marker gradient then
          turn up gradient
        else if headed toward a barrier then
          avoid barrier
        else
          change direction probabilistically based on time since last
          change plus other factors.

      * To make behavior more natural, it might make sense to change
      direction by no more than a fixed amount on each step.
      */

      let remainingCapacity = this._resourceCarryingCapacity - this._carriedResource;
      if (remainingCapacity) { // head for resource
        // First, try to consume resource
        // TODO: limit rate that agents can remove resource
        let removedResource = this._terrain.removeResource(this._loc,
                                                           remainingCapacity);
        this._carriedResource += removedResource;
        if (this._carriedResource === this._resourceCarryingCapacity) {
          // Just got full
          this._resourceMemory = this._carriedResource;
          this._cRender = "rgb(0, 255, 0)";
        } else if (removedResource == 0) {
          // There ain't no resource here, so let's look for some ...
          let features = {
            resource: null,
            resourceMarker: null
          };
          this._terrain.getLocalFeatures(this._loc, features);
          if (features.resource.length > 0) {
            // Can see resource, so move towards it
            let closestResource = {loc: null, dist: this._vision + 10};
            features.resource.forEach(resourceLoc => {
              let distanceToResource = Math.hypot(resourceLoc.x - this._loc.x,
                                                  resourceLoc.y - this._loc.y);
              if (distanceToResource < closestResource.dist) {
                closestResource = {loc: resourceLoc, dist: distanceToResource};
              }
            });
            if (closestResource.loc === null) {
              closestResource.loc = features.resource[0];
            }
            this._direction = this._angleTo(closestResource.loc);
          } else {
            // Cannot see resource, so let's try smelling for some ...
            let directionUpResourceMarkerGradient =
                this._upGradientDirection(features.resourceMarker);
            if (directionUpResourceMarkerGradient) {
              this._direction = directionUpResourceMarkerGradient;
            } else {
              // Cannot smell resource, so let's just wander around aimlessly
              this._wanderAimlessly();
            }
          }
        }
      } else { // head for home
        // Is this home? ...
        if (this._terrain.getFeatureValueHere(this._loc,"home")) {
          this._carriedResource = 0;
          this._cRender = "rgb(0, 100, 100)";
          console.log(this._cRender);
          this._homeMemory = 0.2;
        } else {
          //Let's look for home ...
          let features = {
            home: null,
            homeMarker: null
          };
          this._terrain.getLocalFeatures(this._loc, features);
          if (features.home.length > 0) {
            // Can see home, so move towards it
            this._direction = this._angleTo(features.home[0]);
          } else {
            // Cannot see home, so let's try smelling for it ...
            let directionUpHomeMarkerGradient =
                this._upGradientDirection(features.homeMarker);
            if (directionUpHomeMarkerGradient) {
              this._direction = directionUpHomeMarkerGradient;
            } else {
              // Cannot smell home, so let's just wander around aimlessly
              this._wanderAimlessly();
            }
          }
        }
      }
      /*
      Note that the following bounce mechanism can get caught in a high
      frequency oscillation at the edges of the screen. This is because
      when the incident angle is very small, it's possible that changing
      direction does not move the agent, in one step, far enough from the
      wall such that it's outside of the bounce region. So then it bounces
      back at the wall again. If we intended to keep using this bounce
      mechanism, which I believe we don't, then we could add some temporal
      hysteresis to cause the bounce check to be suppressed for a given
      number of cycles after a bounce occurs.

      The following mod operation is not absolutely necessary, if
      negative angles are allowed, but it we decide that angles are
      to always be in the range [0..360), then the mod is necessary.
      */
      if (this._loc.x > (WIDTH - this._radius) ||
          this._loc.x < this._radius) {
        this._direction = (180 - this._direction) % 360;
      }
      if (this._loc.y > (HEIGHT - this._radius) ||
          this._loc.y < this._radius) {
        this._direction = -this._direction % 360;
      }
    }

    _dropMarkers() {
      if (this._resourceMemory) {
        this._terrain.increaseMarker(this._loc, this._resourceMemory, "resourceMarker");
        this._resourceMemory *= 0.995;
        if (this._resourceMemory < this._terrain.minimumMarkerIntensities.resourceMarker) {
          this._resourceMemory = 0;
        }
      }
      if (this._homeMemory) {
        this._terrain.increaseMarker(this._loc, this._homeMemory, "homeMarker");
        this._homeMemory *= 0.995;
        if (this._homeMemory < this._terrain.minimumMarkerIntensities.homeMarker) {
          this._homeMemory = 0;
        }
      }
      /*
      Periodically drop some marker at the current location based on
      the size of the resource seen and how long ago it was seen
      (resourceMemory). So when a resource is located, the agent's
      resourceMemory jumps up to reflect the resource size, and then that
      memory decays over time. The agent drops a marker with an intensity
      proportional to its current resourceMemory.

      Also drop home_marker in a similar way.
      */
    }

    _update() {
      this._changeDirection();
      if (!FREEZE) {
        this._move();
        this._dropMarkers();
      }
    }

    draw() {
      this._update();

      ctx.fillStyle = this._cRender;
      ctx.beginPath();
      ctx.arc(this._loc.x, this._loc.y, this._radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.save();
      ctx.translate(this._loc.x, this._loc.y);
      ctx.rotate((this._direction - 45) * 2 * Math.PI / 360);
      ctx.fillRect(0, 0, this._radius, this._radius);
      ctx.restore();

      if (FREEZE) {
        ctx.strokeStyle = this._cRender;
        ctx.beginPath();
        ctx.arc(this._loc.x, this._loc.y, this._vision, 0,
                Math.PI * 2);
        ctx.stroke();
      }
    }
  }

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
  // This gets referenced directly by the agent object, which is really dodgy.
  // let resource = new Resource(new Point(250, 250));

  var times = [];
  var fps;

  function showFps() {
    ctx.fillStyle = "#000000";
    ctx.font = "30px Courier";
    const xPos = WIDTH-240;
    ctx.fillText(terrain.getAgentsCount() + " AGENTS", xPos, HEIGHT-50);
    ctx.fillText(fps + " FPS", xPos, HEIGHT-20);
  }

  var framesLeftToShowNotice = 3 * 30;

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

  function refreshLoop() {
    if (testMode) {
      test = new Test();
      test.runAll();
    } else {
      window.requestAnimationFrame(function() {
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

  class Test {
    constructor() {
      this._assertionFailCount = 0;
      this._assertionPassCount = 0;
    }

    _assertEqual(a, b) {
      if (a != b) {
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
      let c = pointToCellLoc(p, 26);
      this._assertEqual(c.row, 8);
      this._assertEqual(c.col, 5);
      p = new Point(30, 20);
      c = pointToCellLoc(p, 10);
      this._assertEqual(c.row, 2);
      this._assertEqual(c.col, 3);
      p = new Point(29, 19);
      c = pointToCellLoc(p, 10);
      this._assertEqual(c.row, 1);
      this._assertEqual(c.col, 2);
    }

    runAll() {
      console.log("Runing all tests");
      this._testPoint();
      this._testCellLoc();
      this._testPointToCellLoc();
      let totalAssertions = this._assertionFailCount + this._assertionPassCount;
      console.log("Total assertions: " + totalAssertions);
      console.log("Total failed assertions: " + this._assertionFailCount);
      console.log("Total passed assertions: " + this._assertionPassCount);
    }
  }

};
