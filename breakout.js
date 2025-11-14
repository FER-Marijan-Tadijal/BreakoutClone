// Magical numbers used through code
const WIDTH = 800
const HEIGHT = 600
const BRICKHEIGHT = 20
const BRICKLENGTH = 40
const BRICKNUMBER = 10

const STARTBALLSPEED = 10
const PADDLESPEED = 10
const BALLACCELERATION = 0.15

// Used to control ball angle by positioning the paddle
function getAngleBetweenTwoPoints(myX, myY, otherX, otherY) {
    let dx = otherX - myX;
    let dy = otherY - myY;
    let angle = Math.atan2(dy, dx) * (180 / Math.PI);
    if (angle < 0) angle += 360;
    return angle
}

// Subtracts 5 from each number in the colour's hex code
function getDarkerColor(color) {
    let splits = color.slice(1).split("");
    let processed = splits.map(digit => {
        let asInt = parseInt(digit, 16);
        return Math.max(asInt-5, 0).toString(16);
    });

    return "#" + processed.join("");
}

class Brick {
    constructor(xPos, yPos, color) {
        this.xPos = xPos;
        this.yPos = yPos;
        this.color = color;
        this.width = BRICKLENGTH;
        this.height = BRICKHEIGHT;
        this.markForDelete = false;
    }

    update() {
        // Do nothing, I guess
    }
    draw() {
        // Draws two squares, one darker as a "3D Shadow"
        ctx.fillStyle = getDarkerColor(this.color);
        ctx.fillRect(this.xPos, this.yPos, this.width, this.height);

        ctx.fillStyle = this.color;
        ctx.fillRect(this.xPos-2, this.yPos-2, this.width, this.height);
    }
}

class Paddle {
    constructor(xPos, yPos) {
        this.xPos = xPos;
        this.yPos = yPos;
        this.width = 140;
        this.height = 30
    }

    update() {
        if (controls.right && (this.xPos + this.width) < WIDTH) {
            this.xPos += PADDLESPEED;
        } else if (controls.left && this.xPos > 0) {
            this.xPos -= PADDLESPEED;
        }
    }
    draw() {
        ctx.fillStyle = "grey";
        ctx.shadowBlur = 0;
        ctx.shadowColor = "white";
        ctx.fillRect(this.xPos, this.yPos, this.width, this.height);

        ctx.fillStyle = "white";
        ctx.shadowBlur = 0;
        ctx.shadowColor = "white";
        ctx.fillRect(this.xPos-2, this.yPos-2, this.width, this.height);
    }
}

class Ball {
    constructor(xPos, yPos, direction, speed) {
        this.xPos = xPos;
        this.yPos = yPos;
        this.direction = direction;
        this.speed = speed;
        
        this.width = 30;
        this.height = 30;
    }

    // Change directions if hitting any walls. Die if hitting bottom wall.
    update() {
        if (this.xPos <= 0 || (this.xPos + this.width) >= WIDTH) { // sides
            this.direction = (180 - this.direction) % 360;
            new Audio("Bounce" + (Math.floor(Math.random() * 2) + 1) + ".wav").play()
        }
        if (this.yPos <= 0) { // Vertical
            this.direction = (-this.direction) % 360;
            new Audio("Bounce" + (Math.floor(Math.random() * 2) + 1) + ".wav").play()
        }
        if ((this.yPos + this.height) >= HEIGHT) {
            gameState = "over"
            lossClip.play()
        }

        // Move according to direction and speed.
        let yElement = Math.sin(this.direction * Math.PI / 180)
        let xElement = Math.cos(this.direction * Math.PI / 180)

        this.xPos += xElement * this.speed
        this.yPos -= yElement * this.speed
    }
    draw() {
        ctx.fillStyle = "grey";
        ctx.fillRect(this.xPos, this.yPos, this.width, this.height);

        ctx.fillStyle = "white";
        ctx.fillRect(this.xPos-2, this.yPos-2, this.width, this.height);
    }

    checkCollision(other) {
        // Cannot collide with self
        if (other instanceof Ball) {            
            return
        }
        if (this.xPos <= other.xPos + other.width && this.xPos + this.width >= other.xPos &&
            this.yPos <= other.yPos + other.height && this.yPos + this.height >= other.yPos) {
            if (other instanceof Brick) {
                other.markForDelete = true
                currentScore += 1
                this.speed += BALLACCELERATION
                new Audio("Boom0.wav").play();

                // Bounce by simply mirroring the ball, same as with hitting a wall
                let overlapLeft = this.xPos + this.width - other.xPos;
                let overlapRight = other.xPos + other.width - this.xPos;
                let overlapTop = this.yPos + this.height - other.yPos;
                let overlapBottom = other.yPos + other.height - this.yPos;

                let minOverlapX = Math.min(overlapLeft, overlapRight);
                let minOverlapY = Math.min(overlapTop, overlapBottom);

                if (minOverlapX < minOverlapY) {
                    // If hit from side, flip horizontally
                    this.direction = (180 - this.direction) % 360;
                } else {
                    // Else flip vertically
                    this.direction = (-this.direction) % 360;
                }
            }

            if (other instanceof Paddle) {
                new Audio("Bounce" + (Math.floor(Math.random() * 2) + 1) + ".wav").play()

                // Bounce depending on angle to paddle. This allows the player to control the ball with more precision.
                let brickCenterX = other.xPos + other.width / 2;
                let brickCenterY = other.yPos + other.height / 2;
                let selfCenterX = this.xPos + this.width / 2;
                let selfCenterY = this.yPos + this.height / 2;

                this.direction = getAngleBetweenTwoPoints(selfCenterX, selfCenterY, brickCenterX, brickCenterY);
                this.direction = (180 - this.direction) % 360;
            }

            if (this.direction < 0) this.direction += 360;
            
        }
        return false
    }
}

// This is used as a layer between keydown events and game movement to eg. map both A and left arrow to the same "left" control.
var controls = {
    left: false,
    right: false,
    space: false,
}

function trackKeys(e, pressed) {
    switch (e.code) {
        case "KeyA":
        case "ArrowLeft":
            controls.left = pressed;
            break;
        case "KeyD":
        case "ArrowRight":
            controls.right = pressed;
            break;
        case "Space":
            controls.space = pressed;
            break;
    }
}

// Fetch canvas and canvas context
const myCanvas = document.getElementById("myCanvas")
var ctx = myCanvas.getContext("2d");

myCanvas.width = WIDTH;
myCanvas.height = HEIGHT;

// Track controls
window.addEventListener("keydown", e => trackKeys(e, true));
window.addEventListener("keyup", e => trackKeys(e, false));

// Import Audio
var introClip = new Audio("Intro.wav");
introClip.play();
var startClip = new Audio("Start.wav");
var lossClip = new Audio("Loss.wav");
var winClip = new Audio("Win.wav")

var gameObjects = [];
var myBall;
var currentScore = 0;
var maxScore = 0;
var gameState = "unstarted"

// Check if MaxScore is in storage.
if (typeof (Storage) !== "undefined") {
    if (localStorage.getItem("maxScore")) {
        maxScore = parseInt(localStorage.getItem("maxScore"));
    }
}

// Creates game objects including bricks, ball, and paddle
function createGameobjects() {
    for (let i=1; i<=BRICKNUMBER; i++) gameObjects.push(new Brick(i*(BRICKLENGTH + 30), 50, "#993300"));
    for (let i=1; i<=BRICKNUMBER; i++) gameObjects.push(new Brick(i*(BRICKLENGTH + 30), 50 + 1 * (BRICKHEIGHT + 15), "#ff0000"));
    for (let i=1; i<=BRICKNUMBER; i++) gameObjects.push(new Brick(i*(BRICKLENGTH + 30), 50 + 2 * (BRICKHEIGHT + 15), "#ff99cc"));
    for (let i=1; i<=BRICKNUMBER; i++) gameObjects.push(new Brick(i*(BRICKLENGTH + 30), 50 + 3 * (BRICKHEIGHT + 15), "#00ff00"));
    for (let i=1; i<=BRICKNUMBER; i++) gameObjects.push(new Brick(i*(BRICKLENGTH + 30), 50 + 4 * (BRICKHEIGHT + 15), "#ffff99"));

    gameObjects.push(new Paddle((WIDTH / 2) - 60, HEIGHT - 50));

    let ballDirection = Math.random() < 0.5 ? 45 : 135;
    myBall = new Ball((WIDTH / 2) - 15, HEIGHT - 100, ballDirection, STARTBALLSPEED)
    gameObjects.push(myBall);
}

// Main game loop that *should* loop 50 times a second.
interval = setInterval(() => {
    // Reset Canvas
    ctx.clearRect(0, 0, WIDTH, HEIGHT)

    if (gameState == "unstarted") {
        // Print out title screen + "press SPACE to start"
        ctx.font = "bold 36px Helvetica";
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.textBaseline = "center";
        ctx.fillText("BREAKOUT", WIDTH/2, HEIGHT/2);

        ctx.font = "bold italic 18px Helvetica";
        ctx.textBaseline = "center" // This may be wrong, but 10px is absolutely not enough space.
        ctx.fillText("Press SPACE to begin", WIDTH/2, HEIGHT/2 + 30)

        // Start game if pressed space
        if (controls.space == true) {
            gameState = "play";
            createGameobjects()
            startClip.play();
        }

    } else if (gameState == "play") {
        // Update points text
        ctx.font = "bold 18px Helvetica";
        ctx.textBaseline = "top"
        ctx.textAlign = "left"
        ctx.fillText("Current score: " + currentScore.toString(), 20, 20)

        ctx.font = "bold 18px Helvetica";
        ctx.textBaseline = "top"
        ctx.textAlign = "right"
        ctx.fillText("High score: " + maxScore.toString(), WIDTH-100, 20)

        // Loop through game objects. Each object is updated, then drawn as defined in the rules of its own class.
        for (let gameObject of gameObjects) {
            gameObject.update()
            gameObject.draw()
            myBall.checkCollision(gameObject)
        }
        // Delete objects if they are marked for deletion because JS deletes only when the last reference is removed.
        gameObjects = gameObjects.filter(object => !object.markForDelete)
        // End game (and play win sound) if all bricks are broken
        if (currentScore >= 50) {
            gameState = "over"
            winClip.play();
        } 

    } else if (gameState == "over") {
        // Print game over. I assume you cannot restart by pressing space and must instead refresh the page. The score will be kept nonetheless.
        ctx.font = "bold 40px Helvetica";
        ctx.fillStyle = "yellow";
        ctx.textAlign = "center";
        ctx.textBaseline = "center";
        ctx.fillText("GAME OVER", WIDTH/2, HEIGHT/2 - 40);

        // Save if score is new max score
        if (typeof (Storage) !== "undefined" && currentScore > maxScore) {
            localStorage.setItem("maxScore", currentScore.toString())
        }
    }

}, 20)
