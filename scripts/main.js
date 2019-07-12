const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

let x = 0;
let y = 0;
let dx = 1;
let dy = 1;

const speed = 0.5;

setInterval(() => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillRect(x, y, 5, 5);
  drawMidline();
}, 16);

setInterval(() => {
  moveBall();
}, speed);

function moveBall() {
  if (x >= canvas.width) {
    dx = -1;
  }

  if (x <= 0) {
    dx = 1;
  }
  if (y >= canvas.height) {
    dy = -1;
  }
  if (y <= 0) {
    dy = 1;
  }

  x = x + speed * dx;
  y = y + speed * dy;
  console.log(x, y);
}

function drawMidline() {
  ctx.beginPath();
  ctx.strokeStyle = "#fff";
  ctx.moveTo(canvas.width / 2, 0);
  ctx.lineTo(canvas.width / 2, canvas.height);
  ctx.stroke();
}
ctx.fillStyle = "#fff";
ctx.fillRect(100, 100, 150, 75);
