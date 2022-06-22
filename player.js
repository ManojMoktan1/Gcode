import {
  Sitting,
  Running,
  Jumping,
  Falling,
  Rolling,
  Diving,
  Hit,
} from "./playerState.js";

import { CollisionAnimation } from "./collisionAnimation.js";
import { FloatingMessage } from "./floatingMessages.js";
import Bullet from "./Bullet.js";

const ATTACK = new Audio();
ATTACK.src = "assests/attack.wav";

export class Player {
  constructor(game) {
    this.game = game;
    this.width = 70;
    this.height = 80;
    this.x = 0;
    this.y = this.game.height - this.height - this.game.groundMargin; // on player at bottom.
    this.vy = 0;
    this.weight = 1;
    this.image = document.getElementById("player");
    this.frameX = 0;
    this.frameY = 0;
    this.maxFrame;
    this.fps = 20;
    this.frameInterval = 1000 / this.fps;
    this.frameTimer = 0;
    this.speed = 0;
    this.maxSpeed = 10;
    this.states = [
      new Sitting(this.game),
      new Running(this.game),
      new Jumping(this.game),
      new Falling(this.game),
      new Rolling(this.game),
      new Diving(this.game),
      new Hit(this.game),
    ];
    this.currentState = null;
    this.cooldown = false;
  }
  update(input, deltaTime) {
    this.checkCollison();
    this.currentState.handleInput(input);
    //horizontal movement
    this.x += this.speed;
    if (input.includes("ArrowRight") && this.currentState !== this.states[6])
      this.speed = this.maxSpeed;
    else if (
      input.includes("ArrowLeft") &&
      this.currentState !== this.states[6]
    )
      this.speed = -this.maxSpeed;
    else this.speed = 0;
    // horizontal boundaries
    if (this.x < 0) this.x = 0;
    if (this.x > this.game.width - this.width)
      this.x = this.game.width - this.width;
    //vertical movement
    this.y += this.vy;
    if (!this.onGround()) this.vy += this.weight;
    else this.vy = 0;
    //vertical boundaries
    if (this.y > this.game.height - this.height - this.game.groundMargin)
      this.y = this.game.height - this.height - this.game.groundMargin; //sprite animation
    if (this.frameTimer > this.frameInterval) {
      this.frameTimer = 0;
      if (this.frameX < this.maxFrame) this.frameX++;
      else this.frameX = 0;
    } else {
      this.frameTimer += deltaTime;
    }
    // extra
    this.game.bullets.forEach((bullet, idx) => {
      bullet.update();
      this.game.enemies.forEach((enemy, enemyIdx) => {
        if (
          enemy.x < bullet.x + bullet.width &&
          enemy.x + enemy.width > bullet.x &&
          enemy.y < bullet.y + bullet.height &&
          enemy.y + enemy.height > bullet.y
        ) {
          enemy.markedForDeletion = true;
          this.game.collisions.push(
            new CollisionAnimation(
              this.game,
              enemy.x + enemy.width * 0.5,
              enemy.y + enemy.height * 0.5
            )
          );
          this.game.enemies.splice(enemyIdx, 1);
          this.game.bullets.splice(idx, 1);
          this.game.score++;
          this.game.floatingMessages.push(
            new FloatingMessage("+1", enemy.x, enemy.y, 0, 0)
          );
        }
      });
    });
    if (input.includes("r") && !this.cooldown) {
      this.game.bullets.push(
        new Bullet(this.x, this.y, this.weight, this.height)
      );
      this.cooldown = true;
      setTimeout(() => {
        this.cooldown = false;
      }, 500);
    }
  }

  draw(context) {
    // context.fillStyle = "red";
    // context.fillRect(this.x, this.y, this.width, this.height);
    if (this.game.debug)
      context.strokeRect(this.x, this.y, this.width, this.height);
    context.drawImage(
      this.image,
      this.frameX * this.width,
      this.frameY * this.height,
      this.width,
      this.height,
      this.x,
      this.y,
      this.width,
      this.height
    );
    // console.log(this.game.bullets);
    this.game.bullets.forEach((bullet) => {
      // console.log("testi");
      bullet.draw(context);
    });
    // if (this.game.frames % 200 === 0) {
    //   this.game.bullets.push(
    //     new Bullet(this.x, this.y, this.weight, this.height)
    //   );
    // }
  }
  onGround() {
    return this.y >= this.game.height - this.height - this.game.groundMargin;
  }

  setState(state, speed) {
    this.currentState = this.states[state];
    this.game.speed = this.game.maxSpeed * speed;
    this.currentState.enter();
  }
  checkCollison() {
    this.game.enemies.forEach((enemy) => {
      if (
        enemy.x < this.x + this.width &&
        enemy.x + enemy.width > this.x &&
        enemy.y < this.y + this.height &&
        enemy.y + enemy.height > this.y
      ) {
        //collision detected
        enemy.markedForDeletion = true;
        this.game.collisions.push(
          new CollisionAnimation(
            this.game,
            enemy.x + enemy.width * 0.5,
            enemy.y + enemy.height * 0.5
          )
        );
        if (
          this.currentState === this.states[4] ||
          this.currentState === this.states[5]
        ) {
          this.game.score++;
          this.game.floatingMessages.push(
            new FloatingMessage("+1", enemy.x, enemy.y, 0, 0)
          );
          ATTACK.play();
        } else {
          this.setState(6, 0);
          this.game.score -= 5;
          this.game.lives--;
          if (this.game.lives <= 0) this.game.gameOver = true;
        }
      }
    });
  }
}