
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

	class Food {
		constructor(x, y) {
			this.x = x;
			this.y = y;
			this.r = 20;
			this.c = `rgb(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random()* 255})`;
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
		// cells which are of size cell_size on a side.
		constructor(width, height, home, cell_size) {
			this.width = width;
			this.height = height;
			this.home = home;
			this.cell_size = cell_size;
			this.width_in_cells = Math.ceil(this.width/this.cell_size);
			this.height_in_cells = Math.ceil(this.height/this.cell_size);
			// console.log(this.height_in_cells);
			this.grid = new Array(this.height_in_cells)
			var row;
			for (row=0; row < this.height_in_cells; row++) {
				this.grid[row] = new Array(this.width_in_cells);
				var col;
				for (col=0; col < this.width_in_cells; col++) {
					this.grid[row][col] = new Cell();
				}
			}
		}

		// Add a barrier the occupies all the cells that line passes through
		add_barrier(line) {
		}

		// Adds the specific amount of resource to the cell that the location
		// falls into. Returns the amount of resource that was added.
		add_resource(location, amount) {
		}

		// Remove up to the target_amount of resource from the cell that
		// location falls into. Once the cell is empty of resource, no more can
		// be removed. Returns the amount of resource removed.
		remove_resource(location, target_amount) {
		}

		// Drops the specified amount of resource marker in the cell that
		// location falls into.
		add_resource_maker(location, amount) {
		}

		// Drops the specified amount of home marker in the cell that location
		// falls into.
		add_home_marker(location, amount) {
		}

		// Returns angle in degrees to resource within range; null if no
		// resource in range.
		visible_resource_direction(location, range) {
		}

		// Returns angle in degrees of steepest upward slope of resource marker
		// gradient in range. Returns null if the terrain is flat.
		local_resource_marker_gradient(location, range) {
		}

		// Returns angle in degrees of steepest upward slope of home marger
		// gradient in range. Returns null if the terrain is flat.
		local_home_marker_gradient(location, range) {
		}

		// Returns "left", "straight", or "right" depending on whether there is
		// a barrier within range in the direction of travel and whether turning
		// left or right (a little) will increase the freedom of movement.
		least_blocked_turn(location, direction, range) {
		}

		spawn_agent_at_home() {
		}

		spawn_colony() {
		}

		decay_markers() {
		}

		update(){
			this.decay_markers();
		}

		render_cell_border(location) {
			ctx.strokeStyle = "#F0F0F0";
			ctx.beginPath();
			let end_x = location.x + this.cell_size;
			let end_y = location.y + this.cell_size;
			ctx.rect(location.x, location.y, end_x, end_y);
			ctx.stroke();
		}

		render() {
			this.update();
			var y = 0;
			for (let row = 0; row < this.height_in_cells; row++) {
				var x = 0;
				for (let col = 0; col < this.width_in_cells; col++) {
					let location = new Point(x, y);
					let cell = this.grid[row][col];
					this.render_cell_border(location);
					x = x + this.cell_size;
				}
				y = y + this.cell_size;
			}
		}
	}

	class Agent {
		// TODO: Change pos_x / pos_y to be location of type Point
		// Also, radius, color, direction, and speed can be fixed properties
		// of the Agent class, rather then set via the constructor.
		constructor(terrain, pos_x, pos_y, radius, direction, color, speed) {
			// The agent can interact with the terrain via the following object
			// reference.
			this.terrain = terrain;
			this.pos_x = pos_x;
			this.pos_y = pos_y;
			this.radius = radius;
			this.direction = direction;
			this.color = color;
			this.cRender = `rgb(${this.color[0]}, ${this.color[1]}, ${this.color[2]})`;
			//this.updateRenderColour()
			this.speed = speed;
			this.vision = 100;
			this.agitated = 0.01
			this.full = false;
		}

		/*updateRenderColour() {
			this.cRender = `rgb(${this.color[0]}, ${this.color[1]}, ${this.color[2]})`;
		}*/

		brighten(n) {
			for (var i = 0; i < 3; i++) {
				this.color[i] += n;
			}
			this.cRender =
			    `rgb(${this.color[0]}, ${this.color[1]}, ${this.color[2]})`;
		}

		move(step) {
			this.pos_x += step * MyMath.cos(this.direction);
			this.pos_y += step * MyMath.sin(this.direction);
		}

		can_see(target) {
			if (Math.hypot(this.pos_x - target.x, this.pos_y - target.y) <=
			    (this.vision + this.radius + target.r)) {
				return true;
			} else {
				return false;
			}
		}

		// Ideally, this would be a private method
		angle_to(target) {
			/*
			Remember that the x-axis increases left-to-right, but the y-axis
			increases top-to-bottom. So angle increases clockwise.
			*/
			let dx = target.x - this.pos_x; // x-component of vector pointing at target
			let dy = target.y - this.pos_y; // y-component of vector pointing at target
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
			if (Math.hypot(this.pos_x - target.x, this.pos_y - target.y) <=
			    threshold) {
				return true;
			} else {
				return false;
			}
		}

		change_direction() {
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

			if (this.can_see(blob) && !this.full) {
				if (this.reached(blob)) {
					this.full = true;
					this.brighten(50);
					console.log('Grabbed some food');
				} else {
					this.direction = this.angle_to(blob);
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
			if (this.pos_x > (WIDTH - this.radius) ||
			    this.pos_x < this.radius) {
				this.direction = (180 - this.direction) % 360;
			}
			if (this.pos_y > (HEIGHT - this.radius) ||
			    this.pos_y < this.radius) {
				this.direction = -this.direction % 360;
			}
		}

		drop_marker() {
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
			this.change_direction()
			this.move(this.speed);
			this.drop_marker();
		}

		render() {
			this.update();
			ctx.fillStyle = this.cRender;
			ctx.beginPath();
			ctx.arc(this.pos_x, this.pos_y, this.radius, 0, Math.PI * 2);
			ctx.fill();

			ctx.strokeStyle = this.cRender;
			ctx.beginPath();
			ctx.arc(this.pos_x, this.pos_y, this.radius + this.vision, 0,
			        Math.PI * 2);
			ctx.stroke();
		}
	}

	let home_location = new Point(25, 25);
	let grid_size = 10;
	let terrain = new Terrain(WIDTH, HEIGHT, home_location, grid_size);
	let start_x = (Math.random() * 400 + 50);
	let start_y = (Math.random() * 400 + 50);
	let radius = 20; let direction = 0; let color = [0, 100, 100];
	let speed = 3;
	let dot = new Agent(terrain, start_x, start_y, radius, direction, color,
	                    speed);
	let blob = new Food(250, 250);

	function draw() {
		ctx.fillStyle = 'white';
		ctx.fillRect(0, 0, WIDTH, HEIGHT);
		terrain.render();
		blob.render();
		dot.render();
		window.requestAnimationFrame(draw);
	}
	draw();

}