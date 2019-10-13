
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
		constructor(x, y, r, d, c, s) {
			this.x = x;
			this.y = y;
			this.r = r;
			this.d = d;
			this.c = `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
			this.s = s;
			this.vision = 100;
			this.agitated = 0.01
			this.focused = false;
		}

		move(step) {
			this.x += step * MyMath.cos(this.d);
			this.y += step * MyMath.sin(this.d);
		}

		can_see(target) {
			if (Math.hypot(this.x - target.x, this.y - target.y) <= (this.vision + this.r + target.r)) {
				return true;
			} else {
				return false;
			}
		}

		// Ideally, this would be a private method
		// I also know that you started working on a similar method called
		// aim_at, which would set the direction of this object. I like that too.
		angle_to(target) {
			// Remember that x increases left-to-right, but y increases
			// top-to-bottom. So angle increases clockwise.
			// Since it's so hard to think about angles going clockwize, it might
			// make sense to operate in an x,y space where y increases from
			// bottom to top, and then flip y during the rendering step.
			let dx = target.x - this.x; // x-component of vector pointing at target
			let dy = target.y - this.y; // y-component of vector pointing at target
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
			let threshold = this.s * 1.5;
			if (Math.hypot(this.x - target.x, this.y - target.y) <= threshold) {
				return true;
			}
			return false;
		}

		update() {

			if (!this.reached(blob)) {
				this.move(this.s);
			}

			if (this.can_see(blob)) {
				this.d = this.angle_to(blob);
				// console.log(this.d);
			} else {
				let p = 0;
				/* 
				if (Math.random() < this.agitated) {
					this.d = Math.random() * 360;
				}*/
			}

			if (this.x > WIDTH - this.r || this.x < this.r) {
				this.d = 180 - this.d;
			}
			if (this.y > HEIGHT - this.r || this.y < this.r) {
				this.d = -this.d;
			}
		}

		render() {
			this.update();
			ctx.fillStyle = this.c;
			ctx.beginPath();
			ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
			ctx.fill();

			ctx.strokeStyle = this.c;
			ctx.beginPath();
			ctx.arc(this.x, this.y, this.r + this.vision, 0, Math.PI * 2);
			ctx.stroke();
		}
	}


	// let dot = new Agent(450, 22, 20, Math.random() * 90, [0, 100, 100], 2);
	let dot1 = new Agent(50, 50, 20, 40, [0, 100, 100], 2);
	let dot2 = new Agent(450, 50, 20, 120, [100, 0, 100], 2);
	let dot3 = new Agent(450, 450, 20, 35, [100, 100, 0], 2);
	let dot4 = new Agent(50, 450, 20, 360-20, [0, 0, 0], 2);
	let dot5 = new Agent(250, 50, 20, 90, [50, 100, 150], 2);
	let dot6 = new Agent(250, 450, 20, 270, [255, 100, 150], 2);
	let blob = new Food(250, 250);

	function draw() {
		ctx.fillStyle = 'white';
		ctx.fillRect(0, 0, WIDTH, HEIGHT);
		blob.render();
		dot1.render();
		dot2.render();
		dot3.render();
		dot4.render();
		dot5.render();
		dot6.render();
		window.requestAnimationFrame(draw);
	}
	draw();

}