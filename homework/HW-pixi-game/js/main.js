// We will use `strict mode`, which helps us by having the browser catch many common JS mistakes
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode
"use strict";
const app = new PIXI.Application({
	width: 600,
	height: 600
});
document.body.appendChild(app.view);

// constants
const sceneWidth = app.view.width;
const sceneHeight = app.view.height;

// pre-load the images (this code works with PIXI v6)
/*app.loader.
	add([
		'images/spaceship.png',
		'images/explosions.png'
	]);
app.loader.onProgress.add(e => { console.log(`progress=${e.progress}`) });
app.loader.onComplete.add(setup);
app.loader.load(); */

// pre-load the images (this code works with PIXI v7)
// let assets;
// loadImages();
// async function loadImages(){
// https://github.com/pixijs/pixijs/wiki/v7-Migration-Guide#-replaces-loader-with-assets
// https://pixijs.io/guides/basics/assets.html
// PIXI.Assets.addBundle('sprites', {
//  spaceship: 'images/spaceship.png',
//  explosions: 'images/explosions.png',
//  move: 'images/move.png'
//});
//
// assets = await PIXI.Assets.loadBundle('sprites');
// setup();
//}

// aliases
let stage;

// game variables
let startScene;
let gameScene, ship, scoreLabel, lifeLabel, shootSound, hitSound,
	fireballSound, gameOverScoreLabel;
let gameOverScene;

let circles = [];
let bullets = [];
let aliens = [];
let explosions = [];
let explosionTextures;
let score = 0;
let life = 100;
let levelNum = 1;
let paused = true;

function setup() {
	stage = app.stage;
	// #1 - Create the `start` scene
	startScene = new PIXI.Container();
	stage.addChild(startScene);

	// #2 - Create the main `game` scene and make it invisible
	gameScene = new PIXI.Container();
	gameScene.visible = false;
	stage.addChild(gameScene);

	// #3 - Create the `gameOver` scene and make it invisible
	gameOverScene = new PIXI.Container();
	gameOverScene.visible = false;
	stage.addChild(gameOverScene);

	// #4 - Create labels for all 3 scenes
	createLabelsAndButtons();

	// #5 - Create ship
	ship = new Ship();
	gameScene.addChild(ship);

	// #6 - Load Sounds
	shootSound = new Howl({
		src: ['sounds/shoot.wav']
	});

	hitSound = new Howl({
		src: ['sounds/hit.mp3']
	});

	fireballSound = new Howl({
		src: ['sounds/fireball.mp3']
	});

	// #7 - Load sprite sheet
	explosionTextures = loadSpriteSheet();

	// #8 - Start update loop
	app.ticker.add(gameLoop);

	// #9 - Start listening for click events on the canvas
	app.view.onclick = fireBullet;

	// Now our `startScene` is visible
	// Clicking the button calls startGame()
}

function createLabelsAndButtons() {
	let buttonStyle = new PIXI.TextStyle({
		fill: 0xFF0000,
		fontSize: 20,
		fontFamily: "Press Start 2P"
	});

	// Setting up Start scene
	// 1A - Make top start label
	let startLabel1 = new PIXI.Text("Circle Blast!");
	startLabel1.style = new PIXI.TextStyle({
		fill: 0xFFFFFF,
		fontSize: 40,
		fontFamily: "Press Start 2P",
		stroke: 0xFF0000,
		strokeThickness: 6
	});
	startLabel1.x = 50;
	startLabel1.y = 120;
	startScene.addChild(startLabel1);

	// 1B - Making middle start label
	let startLabel2 = new PIXI.Text("R U worthy...?");
	startLabel2.style = new PIXI.TextStyle({
		fill: 0xFFFFFF,
		fontSize: 15,
		fontFamily: "Press Start 2P",
		fontStyle: "italic",
		stroke: 0xFF0000,
		strokeThickness: 6
	});
	startLabel2.x = 185;
	startLabel2.y = 300;
	startScene.addChild(startLabel2);

	// 1C - Making start game button
	let startButton = new PIXI.Text("Enter, ... if you dare!");
	startButton.style = buttonStyle;
	startButton.x = 80;
	startButton.y = sceneHeight - 100;
	startButton.interactive = true;
	startButton.buttonMode = true;
	startButton.on("pointerup", startGame);
	startButton.on('pointerover', e => e.target.alpha = 0.7);
	startButton.on('pointerout', e => e.currentTarget.alpha = 1.0);
	startScene.addChild(startButton);

	// 2 - Set up gameScene
	let textStyle = new PIXI.TextStyle({
		fill: 0xFFFFFF,
		fontSize: 9,
		fontFamily: "Press Start 2P",
		stroke: 0xFF0000,
		strokeThickness: 4
	});

	// 2A - Make score label
	scoreLabel = new PIXI.Text();
	scoreLabel.style = textStyle;
	scoreLabel.x = 5;
	scoreLabel.y = 5;
	gameScene.addChild(scoreLabel);
	increaseScoreBy(0);

	// 2B - Make life label
	lifeLabel = new PIXI.Text();
	lifeLabel.style = textStyle;
	lifeLabel.x = 5;
	lifeLabel.y = 26;
	gameScene.addChild(lifeLabel);
	decreaseLifeBy(0);

	// 3 - set up `gameOverScene`
	// 3A - make game over text
	let gameOverText = new PIXI.Text("Game Over!");
	textStyle = new PIXI.TextStyle({
		fill: 0xFFFFFF,
		fontSize: 40,
		fontFamily: "Press Start 2P",
		stroke: 0xFF0000,
		strokeThickness: 6
	});
	gameOverText.style = textStyle;
	gameOverText.x = 100;
	gameOverText.y = sceneHeight / 2 - 160;
	gameOverScene.addChild(gameOverText);

	// 3B - make "play again?" button
	let playAgainButton = new PIXI.Text("Play Again?");
	playAgainButton.style = buttonStyle;
	playAgainButton.x = 150;
	playAgainButton.y = sceneHeight - 100;
	playAgainButton.interactive = true;
	playAgainButton.buttonMode = true;
	// startGame is a function reference
	playAgainButton.on("pointerup", startGame); 
	// concise arrow function with no brackets
	playAgainButton.on('pointerover', e => e.target.alpha = 0.7);
	playAgainButton.on('pointerout', e => e.currentTarget.alpha = 1.0); // ditto
	gameOverScene.addChild(playAgainButton);

	// Creating Game Over Score Label
	gameOverScoreLabel = new PIXI.Text();
	let gameOverScoreStyle = new PIXI.TextStyle({
		fill: 0xFFFFFF,
		stroke: 0xFF0000,
		strokeThickness: 6,
		fontSize: 20,
		fontFamily: "Press Start 2P",
		fontStyle: 'italic'
	});
	gameOverScoreLabel.style = gameOverScoreStyle;
	gameOverScoreLabel.x = 150;
	gameOverScoreLabel.y = sceneHeight - 225;
	gameOverScene.addChild(gameOverScoreLabel);
}

function increaseScoreBy(value) {
	score += value;
	scoreLabel.text = `Score  ${score}`;
}

function decreaseLifeBy(value) {
	life -= value;
	life = parseInt(life);
	lifeLabel.text = `Life  ${life}%`;
}

function startGame() {
	startScene.visible = false;
	gameOverScene.visible = false;
	gameScene.visible = true;
	// More
	levelNum = 1;
	score = 0;
	life = 100;
	increaseScoreBy(0);
	decreaseLifeBy(0);
	ship.x = 300;
	ship.y = 550;
	loadLevel();

}

function gameLoop() {
	// Uncommented after Part 2 IV-C when circles are moving
	if (paused) return;

	// #1 - Calculate "delta time"
	let dt = 1 / app.ticker.FPS;
	if (dt > 1 / 12) dt = 1 / 12;

	// #2 - Move Ship
	let mousePosition = app.renderer.plugins.interaction.mouse.global;
	//ship.position = mousePosition;

	// 60 FPS would move about 10% of distance per update
	let amt = 6 * dt;

	// lerp (linear interpolate) the X and Y values with lerp()
	let newX = lerp(ship.x, mousePosition.x, amt);
	let newY = lerp(ship.y, mousePosition.y, amt);

	// Keep the ship on the screen with clamp()
	let w2 = ship.width / 2;
	let h2 = ship.height / 2;
	ship.x = clamp(newX, 0 + w2, sceneWidth - w2);
	ship.y = clamp(newY, 0 + h2, sceneHeight - h2);

	// #3 - Move Circles
	for (let c of circles) {
		c.move(dt);
		if (c.x <= c.radius || c.x >= sceneWidth - c.radius) {
			c.reflectX(sceneWidth);
			//c.move(dt);
		}

		if (c.y <= c.radius || c.y >= sceneHeight - c.radius) {
			c.reflectY(sceneHeight);
			//c.move(dt);
        }
    }

	// #4 - Move Bullets
	for (let b of bullets) {
		b.move(dt);
    }

	// #5 - Check for Collisions
	for (let c of circles) {

		for (let b of bullets) {
		// #5A - Circles and Bullets
			if (rectsIntersect(c, b)) {
				fireballSound.play();
				createExplosion(c.x, c.y, 64, 64);
				gameScene.removeChild(c);
				c.isAlive = false;
				gameScene.removeChild(b);
				b.isAlive = false;
				increaseScoreBy(1);
            }
			if (b.y < -10) b.isAlive = false;
        }

		// #5B - Circles and Ship
		if (c.isAlive && rectsIntersect(c, ship)) {
			hitSound.play();
			gameScene.removeChild(c);
			c.isAlive = false;
			decreaseLifeBy(20);
        }
    }

	// #6 - Now do some clean up

	// Get rid of dead bullets
	bullets = bullets.filter(b => b.isAlive);

	// Get rid of dead circles
	circles = circles.filter(c => c.isAlive);

	// Get rid of explosions
	explosions = explosions.filter(e => e.playing);

	// #7 - Is game over?
	if (life <= 0) {
		end();
		return; // return here so we skip #8 below
	}

	// #8 - Load next level
	if (circles.length == 0) {
		levelNum++;
		loadLevel();
	}
}

function createCircles(numCircles) {
	// Standard bouncing circles
	for (let i = 0; i < numCircles/4; i++) {
		let c = new Circle(10, 0xFFFF00);
		c.x = Math.random() * (sceneWidth - 50) + 25;
		c.y = Math.random() * (sceneHeight - 400) + 25;
		circles.push(c);
		gameScene.addChild(c);
	}

	// Orthogonal circles
	for (let i = 0; i < numCircles / 4; i++) {
		let c = new Circle(10, 0x00FFFF);
		c.speed = Math.random() * 100 + 100;
		if (Math.random() < .5) {
			c.x = Math.random() * (sceneWidth - 50) + 25;
			c.y = Math.random() * 100 + c.radius;
			c.fwd = { x: 0, y: 1 }
		}
		else {
			c.x = Math.random() * 25 + c.radius;
			c.y = Math.random() * (sceneHeight - 80) - c.radius;
			c.fwd = { x: 1, y: 0 };
		}
		circles.push(c);
		gameScene.addChild(c);
	}

	// Wrapping circles
	for (let i = 0; i < numCircles / 4; i++) {
		let c = new WrappingCircle(10, 0xFF00FF);
		c.x = Math.random() * (sceneWidth - 50) + 25;
		c.y = Math.random() * (sceneHeight - 400) + 25;
		c.speed = 60;
		circles.push(c);
		gameScene.addChild(c);
	}

	// Seeking circles
	for (let i = 0; i < numCircles / 3; i++) {
		let c = new SeekingCircle(5, 0xFF0000);
		c.x = Math.random() * (sceneWidth - 50) + 25;
		c.y = Math.random() * (sceneHeight - 400) + 25;
		c.speed = 60;
		c.activate(ship);
		circles.push(c);
		gameScene.addChild(c);
	}

	// Orthogonal wrapping circles
	for (let i = 0; i < numCircles / 4; i++) {
		let c = new WrappingCircle(10, 0x00FF00);
		c.speed = Math.random() * 100 + 100;
		if (Math.random() < .5) {
			c.x = Math.random() * (sceneWidth - 50) + 25;
			c.y = Math.random() * 100 + c.radius * 2;
			c.fwd = { x: 0, y: 1 }
		} else {
			c.x = Math.random() * 25 + c.radius * 2;
			c.y = Math.random() * (sceneHeight - 80) - c.radius * 2;
			c.fwd = { x: 1, y: 0 };
		}
		circles.push(c);
		gameScene.addChild(c);
	}
}

function loadLevel() {
	createCircles(levelNum * 5);
	paused = false;
}

function end() {
	paused = true;

	// Clear out level
	circles.forEach(c => gameScene.removeChild(c));
	circles = [];

	bullets.forEach(b => gameScene.removeChild(b));
	bullets = [];

	explosions.forEach(e => gameScene.removeChild(e));
	explosions = [];

	gameOverScene.visible = true;
	gameScene.visible = false;

	// Adding Final Score text
	gameOverScoreLabel.text = `Final score: ${score}`;
}

function fireBullet(e) {
	// let rect = app.view.getBoundingClientRect();
	// let mouseX = e.clientX - rect.x;
	// let mouseY = e.clientY - rect.y;
	// console.log(`${mouseX},${mouseY}`);
	if (paused) return;

	if (score >= 5) {
		// Creating 3 bullets
		let b1 = new Bullet(0xFFFFFF, ship.x, ship.y);
		let b2 = new Bullet(0xFFFFFF, ship.x - 20, ship.y);
		let b3 = new Bullet(0xFFFFFF, ship.x + 20, ship.y);

		// Adding bullets to game scene
		bullets.push(b1, b2, b3);
		gameScene.addChild(b1, b2, b3);
	}

	// If under 5 points...
	else {
		// Fire only a single bullet
		let b = new Bullet(0xFFFFFF, ship.x, ship.y);
		bullets.push(b);
		gameScene.addChild(b);

    }
	// Sound played no matter what.
	shootSound.play();
}

function loadSpriteSheet() {
	// The 16 animation frames in each row are 64x64 pixels
	// We're using the 2nd row
	// https://pixijs.download/release/docs/PIXI.BaseTexture.html
	let spriteSheet = PIXI.BaseTexture.from('images/explosions.png');
	let width = 64;
	let height = 64;
	let numFrames = 16;
	let textures = [];
	for (let i = 0; i < numFrames; i++) {
		/* https://pixijs.download/release/docs/PIXI.Texture.html */
		let frame = new PIXI.Texture(spriteSheet, new PIXI.Rectangle(i * width, 64, width, height));
		textures.push(frame);
	}
	return textures;
}

function createExplosion(x, y, frameWidth, frameHeight) {
	/* https://pixijs.download/release/docs/PIXI.AnimatedSprite.html */
	// The animation frames are 64x64 pixels
	let w2 = frameWidth / 2;
	let h2 = frameHeight / 2;
	let expl = new PIXI.AnimatedSprite(explosionTextures);
	expl.x = x - w2;
	expl.y = y - h2;
	expl.animationSpeed = 1 / 7;
	expl.loop = false;
	expl.onComplete = e => gameScene.removeChild(expl);
	explosions.push(expl);
	gameScene.addChild(expl);
	expl.play();

}