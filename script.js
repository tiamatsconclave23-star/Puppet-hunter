// Simple Pong
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const W = canvas.width;
const H = canvas.height;

// Paddle
const PADDLE_W = 12;
const PADDLE_H = 90;
const PADDLE_SPEED = 6;

// Ball
const BALL_R = 8;
const BALL_SPEED = 5;
const BALL_SPEED_INC = 1.03; // speed up on paddle hit

let leftY = (H - PADDLE_H) / 2;
let rightY = (H - PADDLE_H) / 2;

let leftScore = 0;
let rightScore = 0;

let ball = { x: W/2, y: H/2, vx: BALL_SPEED, vy: 0, r: BALL_R };

let running = false;

// Controls
let moveUp = false;
let moveDown = false;

// Mouse control
canvas.addEventListener('mousemove', (e)=>{
  const rect = canvas.getBoundingClientRect();
  const y = e.clientY - rect.top;
  leftY = Math.max(0, Math.min(H - PADDLE_H, y - PADDLE_H/2));
});

// Keyboard
window.addEventListener('keydown', (e)=>{
  if (e.key === 'ArrowUp') moveUp = true;
  if (e.key === 'ArrowDown') moveDown = true;
  if (e.key === ' '){ // Space to toggle/start
    e.preventDefault();
    if (!running) startRound();
  }
});
window.addEventListener('keyup', (e)=>{
  if (e.key === 'ArrowUp') moveUp = false;
  if (e.key === 'ArrowDown') moveDown = false;
});

// Start/restart by clicking canvas
canvas.addEventListener('click', ()=>{
  if (!running) startRound();
});

function resetBall(direction = null){
  ball.x = W/2;
  ball.y = H/2;
  const angle = (Math.random() * Math.PI/4) - (Math.PI/8); // small random angle
  const dir = direction === 'left' ? -1 : (direction === 'right' ? 1 : (Math.random() < 0.5 ? -1 : 1));
  ball.vx = dir * BALL_SPEED;
  ball.vy = Math.sin(angle) * BALL_SPEED * (Math.random() > 0.5 ? 1 : -1);
}

function startRound(){
  running = true;
  resetBall();
  loop(); // start loop
}

function drawNet(){
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 12]);
  ctx.beginPath();
  ctx.moveTo(W/2, 0);
  ctx.lineTo(W/2, H);
  ctx.stroke();
  ctx.setLineDash([]);
}

function draw(){
  // clear
  ctx.clearRect(0,0,W,H);

  // background subtle
  ctx.fillStyle = 'rgba(0,0,0,0.02)';
  ctx.fillRect(0,0,W,H);

  // net
  drawNet();

  // paddles
  ctx.fillStyle = '#e6f7ff';
  // left
  ctx.fillRect(6, leftY, PADDLE_W, PADDLE_H);
  // right
  ctx.fillRect(W - 6 - PADDLE_W, rightY, PADDLE_W, PADDLE_H);

  // ball
  ctx.beginPath();
  ctx.fillStyle = '#33d1ff';
  ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI*2);
  ctx.fill();

  // scores
  ctx.fillStyle = 'rgba(230,247,255,0.9)';
  ctx.font = '48px system-ui, -apple-system, "Segoe UI", Roboto';
  ctx.textAlign = 'center';
  ctx.fillText(leftScore, W * 0.25, 60);
  ctx.fillText(rightScore, W * 0.75, 60);

  // top-left small label
  ctx.fillStyle = 'rgba(230,247,255,0.5)';
  ctx.font = '12px system-ui';
  ctx.textAlign = 'left';
  ctx.fillText('Pong — Left: You  •  Right: Computer', 10, H - 10);

  if (!running){
    // overlay message
    ctx.fillStyle = 'rgba(2,8,15,0.6)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#e6f7ff';
    ctx.font = '28px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('Click or press Space to start', W/2, H/2 - 10);
    ctx.font = '16px system-ui';
    ctx.fillText('Use mouse or ↑ / ↓ to move left paddle', W/2, H/2 + 24);
  }
}

function clampPaddles(){
  leftY = Math.max(0, Math.min(H - PADDLE_H, leftY));
  rightY = Math.max(0, Math.min(H - PADDLE_H, rightY));
}

function update(){
  // player keyboard control
  if (moveUp) leftY -= PADDLE_SPEED;
  if (moveDown) leftY += PADDLE_SPEED;
  clampPaddles();

  // computer AI: follow the ball with max speed
  const rightCenter = rightY + PADDLE_H/2;
  const target = ball.y;
  const diff = target - rightCenter;
  const aiSpeed = 4.2; // tune difficulty by changing
  if (Math.abs(diff) > aiSpeed){
    rightY += Math.sign(diff) * aiSpeed;
  } else {
    rightY += diff;
  }
  clampPaddles();

  // move ball
  ball.x += ball.vx;
  ball.y += ball.vy;

  // wall collisions (top/bottom)
  if (ball.y - ball.r <= 0){
    ball.y = ball.r;
    ball.vy *= -1;
  } else if (ball.y + ball.r >= H){
    ball.y = H - ball.r;
    ball.vy *= -1;
  }

  // left paddle collision
  const leftPaddleX = 6 + PADDLE_W; // ball.x compares to left edge beyond paddle's right edge
  if (ball.x - ball.r <= 6 + PADDLE_W){
    // check overlap in y
    if (ball.y >= leftY && ball.y <= leftY + PADDLE_H){
      // collision: reflect
      ball.x = 6 + PADDLE_W + ball.r; // prevent sticking
      ball.vx = -ball.vx * BALL_SPEED_INC;
      // add spin depending on where it hits
      const rel = (ball.y - (leftY + PADDLE_H/2)) / (PADDLE_H/2);
      ball.vy = rel * Math.abs(ball.vx) * 0.9;
    } else if (ball.x - ball.r < 0){
      // missed - computer scores
      rightScore += 1;
      running = false;
      // reset positions
      leftY = (H - PADDLE_H)/2;
      rightY = (H - PADDLE_H)/2;
      resetBall('right');
    }
  }

  // right paddle collision
  const rightPaddleX = W - 6 - PADDLE_W;
  if (ball.x + ball.r >= rightPaddleX){
    if (ball.y >= rightY && ball.y <= rightY + PADDLE_H){
      ball.x = rightPaddleX - ball.r;
      ball.vx = -ball.vx * BALL_SPEED_INC;
      const rel = (ball.y - (rightY + PADDLE_H/2)) / (PADDLE_H/2);
      ball.vy = rel * Math.abs(ball.vx) * 0.9;
    } else if (ball.x + ball.r > W){
      // missed - player scores
      leftScore += 1;
      running = false;
      leftY = (H - PADDLE_H)/2;
      rightY = (H - PADDLE_H)/2;
      resetBall('left');
    }
  }

  // cap ball speed if it grows too fast
  const maxSpeed = 18;
  if (Math.abs(ball.vx) > maxSpeed){
    ball.vx = Math.sign(ball.vx) * maxSpeed;
  }
  if (Math.abs(ball.vy) > maxSpeed){
    ball.vy = Math.sign(ball.vy) * maxSpeed;
  }
}

let rafId = null;
function loop(){
  draw();
  if (running){
    update();
    rafId = requestAnimationFrame(loop);
  } else {
    // show final draw state (overlay)
    draw();
    if (rafId) cancelAnimationFrame(rafId);
  }
}

// initial draw
draw();

// expose reset for debugging in console (optional)
window.__pong = { resetBall, startRound: startRound, getScores: ()=>({left:leftScore,right:rightScore}) };