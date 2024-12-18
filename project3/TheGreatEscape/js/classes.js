class Ship extends PIXI.Sprite {
    constructor(x = 0, y = 0) {
        super(app.loader.resources['images/spaceship.png'].texture);
        // Position, scaling, rotating etc are now from center of sprite.
        this.anchor.set(0.5, 0.5);
        this.scale.set(0.1);
        this.x = x;
        this.y = y;
    }
}

class Circle extends PIXI.Sprite {
	constructor(radius, color = 0xFF0000, enemyType = 0, x = 0, y = 0) {

		if (enemyType == 0) {
			super(app.loader.resources['images/ufodark.png'].texture);
			this.scale.set(0.1);
		}
		else if (enemyType == 1) {
			super(app.loader.resources['images/starshipdark.png'].texture);
			this.scale.set(0.1);
		}
		else {
			super(app.loader.resources['images/space_shuttle.png'].texture);
		}
		
		//this.beginFill(color);
		//this.drawCircle(0, 0, radius);
		//this.endFill();
		this.anchor.set(0.5, 0.5);
		this.x = x;
		this.y = y;
		this.radius = radius;
		// variables
		this.fwd = getRandomUnitVector();
		this.speed = 50;
		this.isAlive = true;
	}

	// abstract method - declared, but no implementation
	activate() {

	}

	// public methods to be called from main.js
	move(dt = 1 / 60) {
		this.x += this.fwd.x * this.speed * dt;
		this.y += this.fwd.y * this.speed * dt;

		let angle = Math.atan2(this.fwd.y, this.fwd.x);
		this.rotation = angle;
	}

	reflectX(sceneWidth) {
		this.fwd.x *= -1;
	}

	reflectY(sceneHeight) {
		this.fwd.y *= -1;
	}

	// protected methods
	_wrapX(sceneWidth) {
		if (this.fwd.x < 0 && this.x < 0 - this.radius) {
			this.x = sceneWidth + this.radius;
		}
		if (this.fwd.x > 0 && this.x > sceneWidth + this.radius) {
			this.x = 0 - this.radius;
		}
	}

	_wrapY(sceneHeight) {
		if (this.fwd.y < 0 && this.y < 0 - this.radius) {
			this.y = sceneHeight + this.radius;
		}
		if (this.fwd.y > 0 && this.y > sceneHeight + this.radius) {
			this.y = 0 - this.radius;
		}
	}

	_chase(dt) {
		let t = this.target;
		let amt = 10.0 * dt;
		let newX = cosineInterpolate(this.x, t.x, amt);
		let newY = cosineInterpolate(this.y, t.y, amt);
		this.x = newX;
		this.y = newY;
	}

}

class Bullet extends PIXI.Graphics {
	// Changing constructor to account for rotation
    constructor(rotation, color = 0xFFFFFF, x = 0, y = 0) {
        super();
        this.beginFill(color);
        this.drawRect(-2, -3, 4, 6);
		this.endFill();
		this.speed = 400;
        this.x = x;
        this.y = y;
        // Changing fwd based on ship's rotation
		this.fwd = {
			x: Math.cos(rotation),  // Bullet moves in the direction of the rotation
			y: Math.sin(rotation)   // Use sin for Y axis to shoot in angle direction
		};
        this.isAlive = true;
        Object.seal(this);
    }

    move(dt = 1 / 60) {
        this.x += this.fwd.x * this.speed * dt;
        this.y += this.fwd.y * this.speed * dt;
    }
}

class WrappingCircle extends Circle {
	reflectX(sceneWidth) {
		this._wrapX(sceneWidth);
	}
	reflectY(sceneHeight) {
		this._wrapY(sceneHeight);
	}
}

class SeekingCircle extends Circle {
	activate(target) {
		this.target = target
	}

	move(dt) {
		if (this.target) {
			// Calculate direction vector to the target
			let direction = {
				x: this.target.x - this.x,
				y: this.target.y - this.y
			};

			// Normalize the direction vector
			let magnitude = Math.sqrt(direction.x ** 2 + direction.y ** 2);
			if (magnitude > 0) { // Avoid division by zero
				direction.x /= magnitude;
				direction.y /= magnitude;
			}

			// Update the forward direction based on target position
			this.fwd = direction;

			// Move at a constant speed
			this.x += direction.x * this.speed * dt;
			this.y += direction.y * this.speed * dt;

			// Calculate the angle of rotation based on movement direction
			let targetAngle = Math.atan2(this.fwd.y, this.fwd.x);  // Use Math.atan2 for correct angle calculation

			// Calculate the difference in rotation
			let deltaRotation = targetAngle - this.rotation;

			// Normalize the deltaRotation to avoid jumping between angles
			if (deltaRotation > Math.PI) deltaRotation -= Math.PI * 2;
			if (deltaRotation < -Math.PI) deltaRotation += Math.PI * 2;

			// Adjust rotation incrementally for smoother transitions
			this.rotation += Math.min(Math.max(deltaRotation, -0.1), 0.1);  // Rotate with a smooth speed

		}
	}
}
