
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

		pointAt() {
			
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
			let dx = target.x - this.x;
			let dy = target.y - this.y;
			let angle = MyMath.atan(dy/dx);

			if (dx == 0) {
				// Handle case where dy/dx is undefined.
				if (dy > 0) {
					// Below target
					return 90;
				} else {
					// Above target
					return 270;
				}
			} else if (dy > 0) {
				if (dx > 0) {
					// Top-right quadrant
					angle = angle;
				} else {
					// Top-left quadrant
					angle = 90 - angle;
				}
			} else {
				if (dx > 0) {
					// Bottom-right quadrant
					angle = 360 + angle;
				} else {
					// Bottom-left quadrant
					angle = 180 + angle;
				}
			}
			return angle;
		}

		update() {

			this.move(this.s);

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
	let dot = new Agent(450, 22, 20, 250, [0, 100, 100], 2);
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