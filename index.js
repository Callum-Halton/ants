
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
			this.c = c;
			this.cRender = `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
			this.s = s;
			this.vision = 100;
			this.agitated = 0.01
			this.full = false;
		}

		brighten(n) {
			for (var i = 0; i < 3; i++) {
				this.c[i] += n;
			}
			this.cRender = `rgb(${this.c[0]}, ${this.c[1]}, ${this.c[2]})`;
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
		angle_to(target) {
			/*
			Remember that x increases left-to-right, but y increases
			top-to-bottom. So angle increases clockwise.
			*/
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
			let threshold = this.s / 2;
			if (Math.hypot(this.x - target.x, this.y - target.y) <= threshold) {
				return true;
			} else {
				return false;
			}
		}

		update() {

			this.move(this.s);

			if (this.can_see(blob) && !this.full) {
				if (this.reached(blob)) {
					this.full = true;
					this.brighten(50);
					console.log('a');
				} else {
					this.d = this.angle_to(blob);
				}
			} else {
				if (Math.random() < this.agitated) {
					this.d = Math.random() * 360;
				}
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
			ctx.fillStyle = this.cRender;
			ctx.beginPath();
			ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
			ctx.fill();

			ctx.strokeStyle = this.cRender;
			ctx.beginPath();
			ctx.arc(this.x, this.y, this.r + this.vision, 0, Math.PI * 2);
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