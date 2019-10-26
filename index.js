var keypressed = null;
function keydown(event) {
	keypressed = event.key;
}
function keyup(event) {
	keypressed = null;
}

window.onload = () => {
  const WIDTH = 500; //window.innerWidth;
  const HEIGHT = 500; //window.innerHeight;
  const canvas = document.getElementById('canva');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d');

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

  class Food {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.r = 20;
      this.c = colorString([Math.random() * 255, Math.random() * 255, Math.random() * 255]);
    }

    render() {
      ctx.fillStyle = this.c;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
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
      this.resource_marker = 0;
      this.home_marker = 0;
    }

    render(location, cellSize) {
      ctx.strokeStyle = "#F8F8F8";
      ctx.beginPath();
      let end_x = location.x + cellSize;
      let end_y = location.y + cellSize;
      ctx.fillStyle = colorString([(1 - this.resource_marker) * 255, 255, 255]);
      ctx.beginPath()
      ctx.rect(location.x, location.y, end_x, end_y);
      ctx.fill();
      ctx.stroke();
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
    constructor(width, height, home_location, cellSize) {
      this.width = width;
      this.height = height;
      this.home_location = home_location;
      this.cellSize = cellSize;
      this.width_in_cells = Math.ceil(this.width/this.cellSize);
      this.height_in_cells = Math.ceil(this.height/this.cellSize);
      // console.log(this.height_in_cells);
      this.grid = new Array(this.height_in_cells);
      for (let row = 0; row < this.height_in_cells; row++) {
        this.grid[row] = new Array(this.width_in_cells);
        for (let col = 0; col < this.width_in_cells; col++) {
          this.grid[row][col] = new Cell();
        }
      }
    }

    pointToCellLoc(location) {
      let col = Math.floor(location.x / this.cellSize);
      let row = Math.floor(location.y / this.cellSize);
      return new CellLoc(row, col);
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
    removeResource(location, target_amount) {
    }

    // Drops the specified amount of resource marker in the cell that
    // location falls into.
    addResourceMarker(location, amount) {
      let cellLoc = this.pointToCellLoc(location);
      this.grid[cellLoc.row][cellLoc.col].resource_marker += amount;
    }

    // Drops the specified amount of home marker in the cell that location
    // falls into.
    addHomeMarker(location, amount) {
    }

    // Returns angle in degrees to resource within range; null if no
    // resource in range.
    visibleResourceDirection(location, range) {
    }

    cellCircleBounds(radius) {
      let bounds = [];
      let cellRad = Math.round(radius / this.cellSize);
      for (let row = 0; row <= cellRad; row++) {
        for (let col = 0; col <= cellRad; col++) {
          if (Math.hypot((this.cellSize * col), (this.cellSize * row)) > radius) {
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

    operateInGridBounds(location, bounds, f) {
      let cellLoc = terrain.pointToCellLoc(location);
      for (let yInvert = 0; yInvert < 2; yInvert++) {
        for (let xInvert = 0; xInvert < 2; xInvert++) {
          for (let row = 0; row < bounds.length; row++) {
            for (let col = 0; col < bounds[row]; col++) {
              let adjRow = (2 * yInvert - 1) * row + cellLoc.row;
              let adjCol = (2 * xInvert - 1) * col + cellLoc.col;
              f(this, adjRow, adjCol);
            }
          }

        }
      }
    }

    // Returns angle in degrees of steepest upward slope of resource marker
    // gradient in range. Returns null if the terrain is flat.
    localResourceMarkerGradient(location, range) {
      let cellLoc = this.pointToCellLoc(location);

      /*
        Thinking through a possible approach to this algorithm ...

        a) Find center-of-gravity (COG) of local cells
        b) Return the angle of vector from location to COG

        For (a):
          1. Find all the cells that are fully inside the circle with center at
             location and with radius equal to range.
             See https://stackoverflow.com/a/24170973/1841553
          2. Calculate the horizontal COG for each row of cells inside the
             circle.
          3. Calculate the horizontal COG for all the cells in the circle by
             finding the COG of the row COGs calculated in step (2).
          4. Calculate the vertical COG for each column of cells inside the
             cicle.
          5. Calculate the vertical COG for all the cells in the cirlce by
             finding the COG of the column COGs calculated in step (4).

        Handle cases where circle goes off the edge of the grid.
      */
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

    spawnAgentAtHome() {
    }

    spawnColony() {
    }

    decayMarkers() {
    }

    update(){
      this.decayMarkers();
    }

    render() {
      this.update();
      var y = 0;
      for (let row = 0; row < this.height_in_cells; row++) {
        var x = 0;
        for (let col = 0; col < this.width_in_cells; col++) {
          let location = new Point(x, y);
          let cell = this.grid[row][col];
          cell.render(location, this.cellSize);
          x = x + this.cellSize;
        }
        y = y + this.cellSize;
      }
    }
  }

  class Agent {
    // TODO: radius, color, direction, and speed can be fixed properties
    // of the Agent class, rather then set via the constructor.
    constructor(terrain, loc, radius, direction, color, speed) {
      // The agent can interact with the terrain via the following object
      // reference.
      this.terrain = terrain;
      this.loc = loc;
      this.radius = radius;
      this.direction = direction;
      this.color = color;
      this.cRender = colorString(this.color);
      this.speed = speed;
      this.vision = 100;
      this.visionBounds = terrain.cellCircleBounds(this.vision);
      this.agitated = 0.01;
      this.resource_memory = 0;
      this.full = false;
      this.headBack = false;
    }

    brighten(n) {
      for (var i = 0; i < 3; i++) {
        this.color[i] += n;
      }
      this.cRender = colorString(color);
    }

    move(step) {
      this.loc.x += step * MyMath.cos(this.direction);
      this.loc.y += step * MyMath.sin(this.direction);
    }

    canSee(target) {
      if (Math.hypot(this.loc.x - target.x, this.loc.y - target.y) <=
          (this.vision + this.radius + target.r)) {
        return true;
      } else {
        return false;
      }
    }

    // Ideally, this would be a private method
    angleTo(target) {
      /*
      Remember that the x-axis increases left-to-right, but the y-axis
      increases top-to-bottom. So angle increases clockwise.
      */
      let dx = target.x - this.loc.x; // x-component of vector pointing at target
      let dy = target.y - this.loc.y; // y-component of vector pointing at target
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

    reached(target) {
      let threshold = this.speed / 2;
      if (Math.hypot(this.loc.x - target.x, this.loc.y - target.y) <=
          threshold) {
        return true;
      } else {
        return false;
      }
    }

    changeDirection() {
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

      if (this.canSee(blob) && !this.full) {
        if (this.reached(blob)) {
          this.full = true;
          this.resource_memory = 1;
          this.brighten(50);
          console.log('Grabbed some food');
        } else {
          this.direction = this.angleTo(blob);
        }
      } else {
        if (Math.random() < this.agitated) {
          this.direction = Math.random() * 360;
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
      if (this.loc.x > (WIDTH - this.radius) ||
          this.loc.x < this.radius) {
        this.direction = (180 - this.direction) % 360;
      }
      if (this.loc.y > (HEIGHT - this.radius) ||
          this.loc.y < this.radius) {
        this.direction = -this.direction % 360;
      }
    }

    dropMarker() {
      terrain.addResourceMarker(this.loc, this.resource_memory);
      this.resource_memory *= 0.99;
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

    update() {
      this.changeDirection();
      //this.move(this.speed);
      //this.dropMarker();
      if (this.headBack) {
        terrain.operateInGridBounds(this.loc, this.visionBounds,
          (terrainCtx, adjRow, adjCol) => {
            if ((adjRow + adjCol) % 2 == 0) {
              terrainCtx.grid[adjRow][adjCol].resource_marker = 1;
            } else {
              terrainCtx.grid[adjRow][adjCol].resource_marker = 0.5;
            }
          });
      }
    }

    render() {
      this.update();
      ctx.fillStyle = this.cRender;
      ctx.beginPath();
      ctx.arc(this.loc.x, this.loc.y, this.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.save();
      ctx.translate(this.loc.x, this.loc.y);
      ctx.rotate((this.direction - 45) * 2 * Math.PI / 360);
      ctx.fillRect(0, 0, this.radius, this.radius);
      ctx.restore();

      ctx.strokeStyle = this.cRender;
      ctx.beginPath();
      ctx.arc(this.loc.x, this.loc.y, this.vision, 0,
              Math.PI * 2);
      ctx.stroke();
    }
  }

  const home_location = new Point(25, 25);
  const grid_size = 10;
  const terrain = new Terrain(WIDTH, HEIGHT, home_location, grid_size);
  const location = new Point(205, 205);
  const radius = 10; let direction = 0; let color = [0, 100, 100];
  const speed = 3;
  var dot = new Agent(terrain, location, radius, direction, color,
                      speed);
  let blob = new Food(250, 250);

  function draw() {
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    terrain.render();
    blob.render();
    dot.render();
    if (keypressed) {
			dot.headBack = true;
    }
    window.requestAnimationFrame(draw);
  }
  draw();

}