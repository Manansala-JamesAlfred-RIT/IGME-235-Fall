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
// Distance between bullets in spread
const spreadDistance = 20;
// Angle spread in degrees
const angleSpread = 10;

// Background for Game
const backgroundTexture = PIXI.Texture.from('images/backgroundSpace.png');
const background = new PIXI.Sprite(backgroundTexture);
background.width = app.view.width;
background.height = app.view.height;

// Stage that will hold the scenes
let stage;

// game variables
let startScene;
let gameScene, ship, scoreLabel, lifeLabel, shootSound, hitSound,
	fireballSound, backgroundMusic, backgroundAmbience, gameOverScoreLabel, tutorialLabel, gameOverScene, tutorialScene, chooseUpgradeScene;

let circles = [];
let bullets = [];
let explosions = [];
let explosionTextures;
let score = 0;
let life = 100;
let numBullets = 3;
let levelNum = 1;
let paused = true;
let mouseX;
let mouseY;
let isSpacePressed = false;
let isShiftPressed = false;
let enemySpeed = 0.3;
let timesUpgraded = 1;
let shipSpeed = 1;
let shipSpeedMultiplier = 1;

// Tracking state of keys
const keyState = {};

function setup() {
	stage = app.stage;

	
	// #1 - Create the `start` scene
	startScene = new PIXI.Container();
	stage.addChild(startScene);

	// #2 - Create the main `game` scene and make it invisible
	gameScene = new PIXI.Container();
	gameScene.visible = false;
	stage.addChild(gameScene);

	// Adding Background to gamescene
	gameScene.addChildAt(background, 0);

	// #3 - Create the `gameOver` scene and make it invisible
	gameOverScene = new PIXI.Container();
	gameOverScene.visible = false;
	stage.addChild(gameOverScene);

	// Creating tutorial page and setting visibility to false
	tutorialScene = new PIXI.Container();
	tutorialScene.visible = false;
	stage.addChild(tutorialScene);

	// Creating Upgrade page for in game upgrades
	chooseUpgradeScene = new PIXI.Container();
	chooseUpgradeScene.visible = false;
	stage.addChild(chooseUpgradeScene);

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

	backgroundMusic = new Howl({
		src: ['sounds/Rezoner-Pirates-Theme.mp3'],
		// Allowing it to loop
		loop: true
	});

	backgroundAmbience = new Howl({
		src: ['sounds/background_ambience.mp3']
	});

	exitToMainMenu();

	// #7 - Load sprite sheet
	explosionTextures = loadSpriteSheet();

	// #8 - Start update loop
	app.ticker.add(gameLoop);

	// #9 - Start listening for click events on the canvas
	app.view.onclick = fireBullet;
	// Now our `startScene` is visible
	// Clicking the button calls startGame()

		// ADDED:

	// Listening to Key Events
	window.addEventListener("keydown", (e) => {
		keyState[e.code] = true;
		
	});
	window.addEventListener("keyup", (e) => {
		keyState[e.code] = false;
	});

	// Updating mouse position and applying it on a vector
	app.view.onmousemove = (e) => {
		const rect = app.view.getBoundingClientRect();
		mouseX = e.clientX - rect.left;
		mouseY = e.clientY - rect.top;
	};
}

function createLabelsAndButtons() {
	let buttonStyle = new PIXI.TextStyle({
		fill: 0xFFFFFF,
		fontSize: 25,
		stroke: 0x0D2C54,
		strokeThickness: 10,
		fontFamily: "Space Mono"
	});

	// Setting up Start scene

	// Commenting out Pixi Title text

	// 1A - Make top start label
	/*
	let startLabel1 = new PIXI.Text("The Last Fighter");
	startLabel1.style = new PIXI.TextStyle({
		fill: 0xFFFFFF,
		fontSize: 30,
		fontFamily: "Space Mono",
		stroke: 0xFF0000,
		strokeThickness: 6
	});
	startLabel1.x = 50;
	startLabel1.y = 120;
	startScene.addChild(startLabel1);
	*/

	// 1B - Making middle start label
	let startLabel2 = new PIXI.Text("As intergalactic forces wipe out your planet, \n\nonly you remain...\n\nThe forces are closing in on you.\n\nThe end is near, you can feel it...\n\nBut you're not going down without a fight.\n\nYou are the Last Fighter.");
	startLabel2.style = new PIXI.TextStyle({
		fill: 0x57467B,
		fontSize: 15,
		fontFamily: "Space Mono",
		fontStyle: "italic",
		stroke: 0xFDF0D5,
		strokeThickness: 3
	});
	startLabel2.x = 100;
	startLabel2.y = 100;
	startScene.addChild(startLabel2);

	// 1C - Making start game button
	let startButton = new PIXI.Text("Begin your last dance...");
	startButton.style = buttonStyle;
	startButton.x = 100;
	startButton.y = sceneHeight - 200;
	startButton.interactive = true;
	startButton.buttonMode = true;
	startButton.on("pointerup", startGame);
	startButton.on('pointerover', e => e.target.alpha = 0.7);
	startButton.on('pointerout', e => e.currentTarget.alpha = 1.0);
	startScene.addChild(startButton);

	// 2 - Set up gameScene
	let textStyle = new PIXI.TextStyle({
		fill: 0xFFFFFF,
		fontSize: 15,
		fontFamily: "Space Mono",
		stroke: 0x57467B,
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
		fontFamily: "Space Mono",
		stroke: 0xFF0000,
		strokeThickness: 4
	});
	gameOverText.style = textStyle;
	gameOverText.x = 175;
	gameOverText.y = sceneHeight / 2 - 160;
	gameOverScene.addChild(gameOverText);

	// 3B - make "play again?" button
	let playAgainButton = new PIXI.Text("Play Again?");
	playAgainButton.style = buttonStyle;
	playAgainButton.x = 195;
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
		strokeThickness: 4,
		fontSize: 20,
		fontFamily: "Space Mono",
		fontStyle: 'italic'
	});
	gameOverScoreLabel.style = gameOverScoreStyle;
	gameOverScoreLabel.x = 150;
	gameOverScoreLabel.y = sceneHeight - 300;
	gameOverScene.addChild(gameOverScoreLabel);

	// Creating Tutorial Scene labels and buttons
	let tutorialButton = new PIXI.Text("Controls");
	tutorialButton.style = new PIXI.TextStyle({
		fill: 0xFFFFFF,
		fontSize: 20,
		fontFamily: "Space Mono",
		stroke: 0xFF0000,
		strokeThickness: 2
	});
	tutorialButton.x = 0;
	tutorialButton.y = 550;
	tutorialButton.interactive = true;
	tutorialButton.buttonMode = true;
	tutorialButton.on("pointerup", openTutorial);
	tutorialButton.on('pointerover', e => e.target.alpha = 0.7);
	tutorialButton.on('pointerout', e => e.currentTarget.alpha = 1.0);
	startScene.addChild(tutorialButton);

	// Button that exits from tutorial scene and goes back to main menu scene
	let exitToMainMenuButton = new PIXI.Text("Exit to Main Menu");
	exitToMainMenuButton.style = buttonStyle;
	exitToMainMenuButton.x = 150;
	exitToMainMenuButton.y = sceneHeight - 100;
	exitToMainMenuButton.interactive = true;
	exitToMainMenuButton.buttonMode = true;

	// Function reference to main menu
	exitToMainMenuButton.on("pointerup", exitToMainMenu);
	exitToMainMenuButton.on('pointerover', e => e.target.alpha = 0.7);
	exitToMainMenuButton.on('pointerout', e => e.currentTarget.alpha = 1.0);
	tutorialScene.addChild(exitToMainMenuButton);

	// Telling player they are in the tutorial page
	let tutorialTitle = new PIXI.Text("Tutorial");
	tutorialTitle.style = textStyle;
	tutorialTitle.x = 200;
	tutorialTitle.y = 50;
	tutorialScene.addChild(tutorialTitle);

	// Tutorial text on how to play the game
	let tutorialText = new PIXI.Text("Use the WASD Keys to move the ship.\n\nPress spacebar to shoot bullets.\n\nPress shfit to accelerate.\n\nChoose powerups for health and more bullets.\n\nDestroy all you can.\n\nGet the highest score possible!");
	let tutorialStyle = new PIXI.TextStyle({
		fill: 0xFFFFFF,
		fontSize: 20,
		fontFamily: "Space Mono",
		stroke: 0xFF0000,
		strokeThickness: 2
	});
	tutorialText.style = tutorialStyle;
	tutorialText.x = sceneWidth/12;
	tutorialText.y = sceneHeight/4;

	tutorialScene.addChild(tutorialText);

		// UPGRADE SCENE

	// Creating style css for button
	let upgradeButtonStyle = new PIXI.TextStyle({
		fill: 0xFFFFFF,
		fontSize: 15,
		fontFamily: "Space Mono",
		stroke: 0xFF0000,
		strokeThickness: 1
	});

	// Choosing the health upgrade
	let healthUpgradeButton = new PIXI.Text("Replenish life");
	healthUpgradeButton.style = upgradeButtonStyle;
	healthUpgradeButton.x = 35;
	healthUpgradeButton.y = 50;
	healthUpgradeButton.interactive = true;
	healthUpgradeButton.buttonMode = true;
	healthUpgradeButton.on("pointerup", healthRegen);
	healthUpgradeButton.on('pointerover', e => e.target.alpha = 0.7);
	healthUpgradeButton.on('pointerout', e => e.currentTarget.alpha = 1.0);
	chooseUpgradeScene.addChild(healthUpgradeButton);

	// Choosing Speed upgrade
	let speedUpgradeButton = new PIXI.Text("Increase speed");
	speedUpgradeButton.style = upgradeButtonStyle;
	speedUpgradeButton.x = 235;
	speedUpgradeButton.y = 50;
	speedUpgradeButton.interactive = true;
	speedUpgradeButton.buttonMode = true;
	speedUpgradeButton.on("pointerup", speedIncrease);
	speedUpgradeButton.on('pointerover', e => e.target.alpha = 0.7);
	speedUpgradeButton.on('pointerout', e => e.currentTarget.alpha = 1.0);
	chooseUpgradeScene.addChild(speedUpgradeButton);

	// Choosing extra bullet upgrade
	let bulletUpgradeButton = new PIXI.Text("Increase bullets");
	bulletUpgradeButton.style = upgradeButtonStyle;
	bulletUpgradeButton.x = 435;
	bulletUpgradeButton.y = 50;
	bulletUpgradeButton.interactive = true;
	bulletUpgradeButton.buttonMode = true;
	bulletUpgradeButton.on("pointerup", increaseBullets);
	bulletUpgradeButton.on('pointerover', e => e.target.alpha = 0.7);
	bulletUpgradeButton.on('pointerout', e => e.currentTarget.alpha = 1.0);
	chooseUpgradeScene.addChild(bulletUpgradeButton);
}

// Function that increases score based on value inputted
function increaseScoreBy(value) {
	score += value;
	scoreLabel.text = `Score  ${score}`;
}

// Function that decreases life based on given input (can also increase life if negative input)
function decreaseLifeBy(value) {
	life -= value;
	life = parseInt(life);
	lifeLabel.text = `Life  ${life}%`;
}

// Function that starts the game, resetting all the changed variables.
function startGame() {
	startScene.visible = false;
	gameOverScene.visible = false;
	gameScene.visible = true;
	tutorialScene.visible = false;
	// More resetting
	numBullets = 1;
	shipSpeed = 1;
	levelNum = 1;
	score = 0;
	life = 100;
	shipSpeedMultiplier = 1;
	timesUpgraded = 1;
	increaseScoreBy(0);
	decreaseLifeBy(0);
	ship.x = 300;
	ship.y = 300;
	loadLevel();

	// If the background ambience is playing
	if (backgroundAmbience.playing()) {
		// Then stop playing it.
		backgroundAmbience.stop();
	}
}

// Function that turns visibility of all scenes false except the main menu
function exitToMainMenu() {
	startScene.visible = true;
	gameOverScene.visible = false;
	gameScene.visible = false;
	tutorialScene.visible = false;
	chooseUpgradeScene.visible = false;

	// If the background ambience music is not playing
	if (!backgroundAmbience.playing()) {
		// Then play it.
		backgroundAmbience.play();
	}
}

// Function that opens the tutorial screen.
function openTutorial() {
	startScene.visible = false;
	gameOverScene.visible = false;
	gameScene.visible = false;
	tutorialScene.visible = true;
	chooseUpgradeScene.visible = false;
}

function gameLoop() {
	// Uncommented after Part 2 IV-C when circles are moving
	if (paused) return;

	// #1 - Calculate "delta time"
	let dt = 1 / app.ticker.FPS;
	if (dt > 1 / 12) dt = 1 / 12;

	// If background music is not playing,
	if (!backgroundMusic.playing()) {
		// Then play background music.
		backgroundMusic.play();
	}

	// #2 - Move Ship

	// Commented out moving the ship using the mouse 
	// let mousePosition = app.renderer.plugins.interaction.mouse.global;
	// ship.position = mousePosition;

	// Adjusting ship's rotation based on angle to mouse and applying it 
	let angleToMouse = calculateAngleToMouse(ship.x, ship.y, mouseX, mouseY);
	ship.rotation = angleToMouse;

	// If shift key is pressed, speed up!
	if (keyState["ShiftLeft"] == true && isShiftPressed == false) {
		shipSpeed = shipSpeed + 2 + (0.3 * shipSpeedMultiplier);
		// console.log("Shift key pressed");
		isShiftPressed = true;
	}
	else {
		shipSpeed = 1 + (0.3 * shipSpeedMultiplier);
		isShiftPressed = false;
	}
	// Adjust ship position based on keys
	if (keyState["KeyW"]) ship.y -= (1 * shipSpeed); // Move up
	if (keyState["KeyS"]) ship.y += (1 * shipSpeed); // Move down
	if (keyState["KeyA"]) ship.x -= (1 * shipSpeed); // Move left
	if (keyState["KeyD"]) ship.x += (1 * shipSpeed); // Move right

	// fire bullet if the space bar is pressed
	if (keyState["Space"] == true && isSpacePressed == false) {
		fireBullet();
		isSpacePressed = true;
	}
	else if (keyState["Space"] == false && isSpacePressed == true) {
		isSpacePressed = false;
	}

	// Keep the ship on the screen with clamp()
	let w2 = ship.width / 2;
	let h2 = ship.height / 2;
	ship.x = clamp(ship.x, 0 + w2, sceneWidth - w2);
	ship.y = clamp(ship.y, 0 + h2, sceneHeight - h2);

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
			decreaseLifeBy(10);
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

	// Creating upgrade screen for when user defeats # of enemies
	if (score > 5 * (timesUpgraded * timesUpgraded * timesUpgraded)) {
		paused = true;
		// Make the upgrade page visible
		chooseUpgradeScene.visible = true;
		// Increase upgrade count
		timesUpgraded = timesUpgraded + 1;
	}
}

function createCircles(numCircles) {

	enemySpeed = 10 + (0.5 * levelNum);

	// Standard bouncing circles
	for (let i = 0; i < numCircles / 4; i++) {
		let c = new Circle(10, 0xFFFF00, 0);
		c.speed = enemySpeed;
		c.x = Math.random() * (sceneWidth - 50) + 25;
		c.y = Math.random() * (sceneHeight - 400) + 25;
		circles.push(c);
		gameScene.addChild(c);
	}

	
	// Orthogonal circles
	for (let i = 0; i < numCircles / 4; i++) {
		let c = new Circle(10, 0x00FFFF, 1);
		c.speed = (Math.random() * 100 + 100) + enemySpeed;
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

	/*
	// Commented out the Wrapping enemies 
	// Wrapping circles
	for (let i = 0; i < numCircles / 4; i++) {
		let c = new WrappingCircle(10, 0xFF00FF);
		c.x = Math.random() * (sceneWidth - 50) + 25;
		c.y = Math.random() * (sceneHeight - 400) + 25;
		c.speed = 60 * enemySpeed;
		circles.push(c);
		gameScene.addChild(c);
	}
	*/

	// Seeking circles coming from outside the screen
	for (let i = 0; i < numCircles / 3; i++) {
		let c = new SeekingCircle(5, 0xFF0000, 2);

		// Randomly spawn off-screen in one of the four directions
		let spawnDirection = Math.floor(Math.random() * 4);

		// Spawn off-screen (top, bottom, left, or right)
		switch (spawnDirection) {
			// Spawn from the top
			case 0: 
				// Random x position
				c.x = Math.random() * sceneWidth; 
				c.y = -c.radius; 
				break;
			// Spawn from the bottom
			case 1: 
				c.x = Math.random() * sceneWidth; 
				c.y = sceneHeight + c.radius; 
				break;
			// Spawn from the left
			case 2: 
				c.x = -c.radius;
				c.y = Math.random() * sceneHeight; 
				break;
			// Spawn from the right
			case 3: 
				c.x = sceneWidth + c.radius; 
				c.y = Math.random() * sceneHeight;
				break;
		}

		c.speed = 200 + enemySpeed;
		c.activate(ship);
		circles.push(c);
		gameScene.addChild(c);
	}

	// Orthogonal wrapping circles (commented out)
	/*
	for (let i = 0; i < numCircles / 4; i++) {
		let c = new WrappingCircle(10, 0x00FF00);
		c.speed = (Math.random() * 100 + 100) * enemySpeed;
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
	*/
	// console.log("Speed is ", enemySpeed);
	
}

window.addEventListener("keydown", (e) => {
	keyState[e.code] = true;
	if (e.code === "Escape") {
		paused = !paused;  // Toggle pause on Escape key press
	}
});
window.addEventListener("keyup", (e) => {
	keyState[e.code] = false;
});
function loadLevel() {
	createCircles(levelNum * 3);
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

	// Go to Game Over screen.
	gameOverScene.visible = true;
	gameScene.visible = false;
	chooseUpgradeScene.visible = false;
	
	// Adding Final Score text
	gameOverScoreLabel.text = `Before sucumbing to your fate,\n\nyou've destroyed ${score} \n\nintergalactic fighters.`;

	// If background music is still playing,
	if (backgroundMusic.playing()) {
		// Then stop background music.
		backgroundMusic.stop();
	}

	// If the background ambience music is not playing
	if (!backgroundAmbience.playing()) {
		// Then play it.
		backgroundAmbience.play();
	}
}

function fireBullet(e) {
	if (paused) return;

	for (let i = -Math.floor((numBullets - 1) / 2); i <= Math.floor(numBullets / 2); i++) {
		// Calculating offset of bullets;
		// Converting angle from degrees to radians
		let angleOffset = (i * angleSpread) * (Math.PI / 180);

		// Create a new bullet based on the rotation with offset
		let b = new Bullet(ship.rotation + angleOffset, 0xFFFFFF, ship.x, ship.y);

		// Apply offset for spread effect (position)
		b.x += Math.cos(ship.rotation + angleOffset) * spreadDistance;
		b.y += Math.sin(ship.rotation + angleOffset) * spreadDistance;

		// Adding bullets to game scene
		bullets.push(b);
		gameScene.addChild(b);
		// console.log("Creating bullet at position", b.x, b.y);
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
	// https://pixijs.download/release/docs/PIXI.AnimatedSprite.html 
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

// Getting angle of ship towards mouse position
function calculateAngleToMouse(shipX, shipY, mouseX, mouseY) {
	return Math.atan2(mouseY - shipY, mouseX - shipX);
}

// Increases player speed when selected
function speedIncrease() {
	shipSpeedMultiplier++;
	// Goes back to playing game
	chooseUpgradeScene.visible = false;
	gameScene.visible = true;
	paused = false;
}

// Adds 100 life
function healthRegen() {
	decreaseLifeBy(-100);
	// Goes back to playing game
	chooseUpgradeScene.visible = false;
	paused = false;
	gameScene.visible = true;

}

// Increases shot count by 1
function increaseBullets() {
	numBullets++;
	// Goes back to playing game
	chooseUpgradeScene.visible = false;
	paused = false;
	gameScene.visible = true;

}