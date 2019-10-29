var hide_debug = true;
var stopAnimation = false;

function keydown(event) {
  if (event.key == "a") {
    hide_debug = false;
  } else if (event.key == "s") {
    stopAnimation = true;
  }
}

function keyup(event) {
  if (event.key == "a") {
    hide_debug = true;
  }
}

window.onload = () => {
  const WIDTH = 1000; //window.innerWidth;
  const HEIGHT = 1000; //window.innerHeight;
  const GRID_SIZE = 20;
  const MAX_AGENTS = 1000;
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
    terrain.increaseResourceMarker(location, 0.1);
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

  // This class is deprecated and will be removed.
  class Resource {
    constructor(location) {
      console.log("Warning: The Resource class has been deprecated and will be removed");
      this.loc = location;
      this.radius = 20;
      this._color = colorString([0, 0, 255]);
    }

    draw() {
      ctx.fillStyle = this._color;
      ctx.beginPath();
      ctx.arc(this.loc.x, this.loc.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
    }
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

  // may be redundant
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
      this.home = false;
      this.resourceMarker = 0;
      this.homeMarker = 0;
      this.debug = false;
    }

    _forget() {
      this.resourceMarker *= 0.999;
    }

    draw(location, cellSize) {
      this._forget();

      let end_x = location.x + cellSize;
      let end_y = location.y + cellSize;
      if (this.home) {
        ctx.fillStyle = "#FFFF00";
      } else if (!hide_debug && this.debug) {
        ctx.fillStyle = "#00FF00";
      } else if (this.resource) {
          ctx.fillStyle = colorString([(1 - this.resource) * 255, (1 - this.resource) * 255, 255]);
        console.log('boo ya');
      } else {
        // The following calculation slows down rendering!
        ctx.fillStyle = colorString([(1 - this.resourceMarker) * 255, 255, 255]);
      }
      ctx.fillRect(location.x, location.y, end_x, end_y);
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
      this._grid[homeCellLoc.row][homeCellLoc.col].home = true;
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

    _angleTo(location, target) {
      /*
      Remember that the x-axis increases left-to-right, but the y-axis
      increases top-to-bottom. So angle increases clockwise.
      */
      let dx = target.x - location.x; // x-component of vector pointing at target
      let dy = target.y - location.y; // y-component of vector pointing at target
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

    increaseResourceMarker(location, value) {
      let cellLoc = pointToCellLoc(location, this._cellSize);
      this._grid[cellLoc.row][cellLoc.col].resourceMarker += value;
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
    }

    // Drops the specified amount of resource marker in the cell that
    // location falls into.
    addResourceMarker(location, amount) {
      let cellLoc = pointToCellLoc(location, this._cellSize);
      this._grid[cellLoc.row][cellLoc.col].resourceMarker += amount;
    }

    // Drops the specified amount of home marker in the cell that location
    // falls into.
    addHomeMarker(location, amount) {
    }

    // Returns angle in degrees to resource within range; null if no
    // resource in range.
    visibleResourceDirection(location, range) {
    }

    // Returns angle in degrees of steepest upward slope of resource marker
    // gradient in range. Returns null if the terrain is flat.
    // For Callum: possibly implement a more efficient version of the COG
    //             algorithm by factoring out some of the repeated
    //             multiplications.
    identifyPathAngle(location) {
      let cellLoc = pointToCellLoc(location, this._cellSize);
      // let totalResource = 0;
      let total = 0;
      let nonNormalizedWeightedX = 0;
      let nonNormalizedWeightedY = 0;
      for (let row = -this._localBounds.length; row < this._localBounds.length; row++) {
        let endCol = this._localBounds[Math.abs(row)];
        let adjRow = row + cellLoc.row;
        let y = adjRow * this._cellSize + this._cellSize / 2;
        for (let col = -endCol + 1 + cellLoc.col; col < endCol + cellLoc.col; col++) {
          if (adjRow >= 0 && col >= 0 &&
              adjRow < this._heightInCells &&
              col < this._widthInCells) {
            let x = col * this._cellSize + this._cellSize / 2;
            if (this._grid[adjRow][col].resource > 0) {
              return this._angleTo(location, new Point(x, y));
            }
            let cell = this._grid[adjRow][col];
            nonNormalizedWeightedX += x * cell.resourceMarker;
            nonNormalizedWeightedY += y * cell.resourceMarker;
            total += cell.resourceMarker;
            //cell.debug = true;
          }
        }

      }

      let normalizedWeightedX = location.x;
      let normalizedWeightedY = location.y;
      if (total > 0) {
        normalizedWeightedX = nonNormalizedWeightedX / total;
        normalizedWeightedY = nonNormalizedWeightedY / total;
      }
      let centerOfGravity = new Point(normalizedWeightedX, normalizedWeightedY);
      // Draw a dot where the COG is, just for debug
      ctx.fillStyle = "#FF0000";
      ctx.beginPath();
      ctx.arc(centerOfGravity.x, centerOfGravity.y, 5, 0, 2 * Math.PI);
      ctx.fill();

      const threshold = 5;
      if (Math.hypot(location.x - centerOfGravity.x,
                     location.y - centerOfGravity.y) > threshold) {
        return this._angleTo(location, centerOfGravity);
      } else {
        return null;
      }
    }

    // Returns angle in degrees of steepest upward slope of home marger
    // gradient in range. Returns null if the terrain is flat.
    localHomeMarkerGradient(location, range) {
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
      var y = 0;
      for (let row = 0; row < this._heightInCells; row++) {
        var x = 0;
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
      this._resource_memory = 0;
      this._full = false;
      // this.headBack = false;
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

    _canSee(target) {
      if (Math.hypot(this._loc.x - target.loc.x, this._loc.y - target.loc.y) <=
          (this._vision + this._radius + target.radius)) {
        return true;
      } else {
        return false;
      }
    }

    // Super-hacky, and will be deleted.
    _angleTo(target) {
      return this._terrain._angleTo(this._loc, target.loc);
    }

    _reached(target) {
      let threshold = this._speed / 2;
      if (Math.hypot(this._loc.x - target.loc.x, this._loc.y - target.loc.y) <=
          threshold) {
        return true;
      } else {
        return false;
      }
    }

    _changeDirection() {
      /*
      Currently, this method is very primitive. Below is a pseudo-code
      plan, or vision, for it:

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

      To make behavior more natural, it might make sense to change
      direction by no more than a fixed amount on each step.

      It may be interesting to see how well the system works without the
      agents even being able to see resources or home, but get steered
      only by the markers.
      */

      /*
      Note that is it's really dodgy that resource is being referenced directly
      by this agent. Luckily, this is only temporary as we move to using the
      Terrain class to store the resource information.
      */

      if (!this._full) {
        /*if (this._canSee(resource)) {
          if (this._reached(resource)) {
            this._full = true;
            this._resource_memory = 0.02;
            this._color = [0, 255, 0];
            this._cRender = colorString(this._color);
            console.log('Grabbed some food');
          } else {
            this._direction = this._angleTo(resource);
          }
        } else {*/
          let pathAngle = this._terrain.identifyPathAngle(this._loc);
          if (pathAngle) {
            this._direction = pathAngle;
          } else if (Math.random() < this._agitated) {
            this._direction = Math.random() * 360;
          }
        //}
      } else {
        if (Math.random() < this._agitated) {
            this._direction = Math.random() * 360;
        }
      }

      /*
      if (followGradient) {
        this._direction = this._terrain.localResourceMarkerGradient(this._loc);
      }
      if (this._canSee(resource) && !this._full) {
        if (this._reached(resource)) {
          this._full = true;
          this._resource_memory = 0.02;
          this._brighten(50);
          console.log('Grabbed some food');
        } else {
          this._direction = this._angleTo(resource);
        }
      } else {
        if (Math.random() < this._agitated) {
          this._direction = Math.random() * 360;
        }
      }
      */

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

    _dropMarker() {
      this._terrain.addResourceMarker(this._loc, this._resource_memory);
      this._resource_memory *= 0.995;
      /*
      Periodically drop some marker at the current location based on
      the size of the resource seen and how long ago it was seen
      (resource_memory). So when a resource is located, the agent's
      resource_memory jumps up to reflect the resource size, and then that
      memory decays over time. The agent drops a marker with an intensity
      proportional to its current resource_memory.

      Also drop home_marker in a similar way.
      */
    }

    _update() {
      this._changeDirection();
      if (!FREEZE) {
        this._move();
        this._dropMarker();
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
    {loc: new CellLoc(20, 20), amount: 1}
  ];
  const terrain = new Terrain(WIDTH, HEIGHT, homeLocation, GRID_SIZE, resourcesForTerrain);
  // This gets referenced directly by the agent object, which is really dodgy.
  let resource = new Resource(new Point(250, 250));

  var times = [];
  var fps;

  function showFps() {
    ctx.fillStyle = "#000000"
    ctx.font = "30px Courier";
    const xPos = WIDTH-240;
    ctx.fillText(terrain.getAgentsCount() + " AGENTS", xPos, HEIGHT-50);
    ctx.fillText(fps + " FPS", xPos, HEIGHT-20);
  }

  function refreshLoop() {
    window.requestAnimationFrame(function() {
      // ctx.fillStyle = 'white';
      // ctx.fillRect(0, 0, WIDTH, HEIGHT);
      terrain.draw();
      resource.draw();
      showFps();
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

  refreshLoop();

}
