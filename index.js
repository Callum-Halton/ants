
window.onload = () => {
	const WIDTH = 500;//window.innerWidth;
	const HEIGHT = 500;//window.innerHeight;
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

	class Agent {
		constructor(pos_x, pos_y, radius, direction, color, speed) {
			this.pos_x = pos_x;
			this.pos_y = pos_y;
			this.radius = radius;
			this.direction = direction;
			this.color = color;
			this.cRender = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
			this.speed = speed;
			this.vision = 100;
			this.agitated = 0.01
			this.full = false;
		}

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
			Currently, this method is very primitive at the moment. Below is a
			pseudo-code plan, or vision, for it:

			if can see resource and not full then
				turn towards resource
			else if can smell marker then
				find vector of maximum marker gradient
				if full
					turn down gradient
				else
					turn up gradient
			else if can can see that we're headed towards a barrier
				turn to reduce chance of reaching a barrier
			else
				change direction probabilistically based on time since last
				  change plus other factors.

			To make behavior more natural, it might make sense to change
			direction by no more than a fixed amount on each step.
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
			Periodically drop a marker object at the current location based on
			the size of the resource seen and how long ago it was seen
			(resource_memory). So when a resource is located, the agent's
			resource_memory jumps up to reflect the resource size, and then that
			memory decays over time. The agent drops a marker with an intensity
			proportional to its current resource_memory. If there is already a
			marker object very near to the current location, then that can be
			re-used by increasing its marker intensity by the agent's
			resource_memory.

			The marker intensity stored in all the marker objects also
			gradually decays over time.
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


	//let dot = new Agent(450, 22, 20, Math.random() * 90, [0, 100, 100], 2);
	let dot = new Agent((Math.random() * 400 + 50), (Math.random() * 400 + 50), 20, 0, [0, 100, 100], 3);
	let blob = new Food(250, 250);

	function draw() {
		ctx.fillStyle = 'white';
		ctx.fillRect(0, 0, WIDTH, HEIGHT);
		blob.render();
		dot.render();
		window.requestAnimationFrame(draw);
	}
	draw();

}