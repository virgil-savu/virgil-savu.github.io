// Enemies our player must avoid
var Enemy = function() {

    this.X = [-150, 600];
    this.Y = [60, 140, 220];
    this.speedValues = [150, 600];

    this.sprite = 'images/enemy-bug.png';

    this.reset();

}


Enemy.prototype.reset = function(dt) {

    var startPosition = this.X[0];

    this.x = startPosition;
    this.y = this.getRandomY();

    this.speed = this.getRandomSpeed();

}

Enemy.prototype.update = function(dt) {
    var maxPosition = this.X[1];
    this.x += this.speed * dt;

    if (this.x > maxPosition) {
        this.reset();
    }
}

// Draw the enemy on the screen, required method for game
Enemy.prototype.render = function() {
    ctx.drawImage(Resources.get(this.sprite), this.x, this.y);
}


Enemy.prototype.getRandomSpeed = function() {
    var minSpeed = this.speedRange[0],
        maxSpeed = this.speedRange[1];

    return Math.floor(Math.random() * (maxSpeed - minSpeed)) + minSpeed;
}


var Player = function() {
    this.X = [-2, 402];
    this.Y = [-20, 380];
    this.sprite = 'images/char-boy.png';
    this.reset();
}

Player.prototype.update = function(dt) {
    this.collisionsCheck();
}

Player.prototype.checkCollisions = function() {
    if (this.y == -20) {
        // player is on water, reset
        this.reset();
    } else if (this.y >= 60 && this.y <= 220) {
        var self = this;
        // player is on road rows, check collisions
        // loop through each bug
        allEnemies.forEach(function(enemy) {
            // is the bug on the same row as the player?
            if (enemy.y == self.y) {
                // is the bug on the player?
                if (enemy.x >= player.x - 30 && enemy.x <= player.x + 30) {
                    self.reset();
                }
            }
        });
    }
}

Player.prototype.reset = function() {
    this.x = 200;
    this.y = 380;
}

Player.prototype.render = function() {
    ctx.drawImage(Resources.get(this.sprite), this.x, this.y);
}

Player.prototype.handleInput = function(key) {
    if (key === 'left') {
        this.x -= (this.x - 101 < this.X[0]) ? 0 : 101;
    } else if (key === 'right') {
        this.x += (this.x + 101 > this.X[1]) ? 0 : 101;
    } else if (key === 'up') {
        this.y -= (this.y - 80 < this.Y[0]) ? 0 : 80;
    } else if (key === 'down') {
        this.y += (this.y + 80 > this.Y[1]) ? 0 : 80;
    }
}




document.addEventListener('keyup', function(e) {
    var allowedKeys = {
        37: 'left',
        38: 'up',
        39: 'right',
        40: 'down'
    };

    player.handleInput(allowedKeys[e.keyCode]);
});

var bug1 = new Enemy();
var bug2 = new Enemy();
var bug3 = new Enemy();
var allEnemies = [bug1, bug2, bug3];

var player = new Player();

