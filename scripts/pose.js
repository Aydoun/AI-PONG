const canvas = document.getElementById("output");
const ctx = canvas.getContext("2d");

const videoWidth = 1200;
const videoHeight = 800;

const color = "aqua";
const boundingBoxColor = "red";
const lineWidth = 2;

function toTuple({ y, x }) {
  return [y, x];
}

/**
 * Draws a line on a canvas, i.e. a joint
 */
function drawSegment([ay, ax], [by, bx], color, scale, ctx) {
  ctx.beginPath();
  ctx.moveTo(ax * scale, ay * scale);
  ctx.lineTo(bx * scale, by * scale);
  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = color;
  ctx.stroke();
}

/**
 * Draws a pose skeleton by looking up all adjacent keypoints/joints
 */
function drawSkeleton(keypoints, minConfidence, ctx, scale = 1) {
  const adjacentKeyPoints = posenet.getAdjacentKeyPoints(
    keypoints,
    minConfidence
  );

  adjacentKeyPoints.forEach(keypoints => {
    drawSegment(
      toTuple(keypoints[0].position),
      toTuple(keypoints[1].position),
      color,
      scale,
      ctx
    );
  });
}

/**
 * Draw pose keypoints onto a canvas
 */
function drawKeypoints(keypoints, minConfidence, ctx, scale = 1) {
  for (let i = 0; i < keypoints.length; i++) {
    const keypoint = keypoints[i];

    if (keypoint.score < minConfidence) {
      continue;
    }

    if (keypoint.part === "leftWrist" || keypoint.part === "rightWrist") {
      console.log(keypoint.position);
    }

    const { y, x } = keypoint.position;
    drawPoint(ctx, y * scale, x * scale, 3, color);
  }
}

function drawPoint(ctx, y, x, r, color) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.fill();
}

/**
 * Draw the bounding box of a pose. For example, for a whole person standing
 * in an image, the bounding box will begin at the nose and extend to one of
 * ankles
 */
function drawBoundingBox(keypoints, ctx) {
  const boundingBox = posenet.getBoundingBox(keypoints);

  ctx.rect(
    boundingBox.minX,
    boundingBox.minY,
    boundingBox.maxX - boundingBox.minX,
    boundingBox.maxY - boundingBox.minY
  );

  ctx.strokeStyle = boundingBoxColor;
  ctx.stroke();
}

/**
 * Loads a the camera to be used in the demo
 *
 */
async function setupCamera() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error(
      "Browser API navigator.mediaDevices.getUserMedia not available"
    );
  }

  const video = document.getElementById("video");
  video.width = videoWidth;
  video.height = videoHeight;

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: {
      facingMode: "user",
      width: videoWidth,
      height: videoHeight
    }
  });
  video.srcObject = stream;

  return new Promise(resolve => {
    video.onloadedmetadata = () => {
      resolve(video);
    };
  });
}

async function loadVideo() {
  const video = await setupCamera();
  video.play();

  return video;
}

function detectPoseInRealTime(video, net) {
  canvas.width = videoWidth;
  canvas.height = videoHeight;

  async function poseDetectionFrame() {
    let poses = [];
    let minPoseConfidence;
    let minPartConfidence;

    const pose = await net.estimatePoses(video, {
      // flipHorizontal: false,
      decodingMethod: "single-person"
    });
    poses = poses.concat(pose);
    minPoseConfidence = 0.7;
    minPartConfidence = 0.5;

    ctx.clearRect(0, 0, videoWidth, videoHeight);

    ctx.save();
    ctx.scale(-1, 1);
    ctx.translate(-videoWidth, 0);

    ctx.restore();

    drawMidline();

    poses.forEach(({ score, keypoints }) => {
      drawKeypoints(keypoints, minPartConfidence, ctx);
      drawSkeleton(keypoints, minPartConfidence, ctx);
      drawBoundingBox(keypoints, ctx);
    });

    requestAnimationFrame(poseDetectionFrame);
  }

  poseDetectionFrame();
}

function drawMidline() {
  ctx.beginPath();
  ctx.strokeStyle = "#fff";
  ctx.moveTo(canvas.width / 2, 0);
  ctx.lineTo(canvas.width / 2, canvas.height);
  ctx.stroke();
}

async function start() {
  drawMidline();
  const net = await posenet.load({
    // architecture: "ResNet50",
    // outputStride: 32,
    // inputResolution: 257,
    // quantBytes: 2
    architecture: "MobileNetV1",
    outputStride: 16,
    inputResolution: 513,
    multiplier: 0.75
  });

  let video;

  try {
    video = await loadVideo();
  } catch (e) {
    alert(
      "this browser does not support video capture, or this device does not have a camera"
    );
  }

  $("#loader").removeClass("active");

  detectPoseInRealTime(video, net);
}

navigator.getUserMedia =
  navigator.getUserMedia ||
  navigator.webkitGetUserMedia ||
  navigator.mozGetUserMedia;

start();

// HERE WE GO
const PADDLE_SIZE = 100;

let x = Math.random() * canvas.width;
let y = Math.random() * canvas.height;
let dx = 1;
let dy = 1;

const speed = 0.5;

const paddle1 = {
  x: 40,
  y: 20
};

const paddle2 = {
  x: canvas.width - 40,
  y: 20
};

setInterval(() => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillRect(x, y, 5, 5);
  drawMidline();
  drawPaddle(paddle1);
  drawPaddle(paddle2);
}, 16);

setInterval(() => {
  moveBall();
}, speed);

function drawPaddle({ x, y }) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y + PADDLE_SIZE);
  ctx.stroke();
}

function moveBall() {
  if (x >= canvas.width) {
    restart();
  }

  if (x <= 0) {
    restart();
  }
  if (y >= canvas.height || y <= 0) {
    dy = -dy;
  }

  if (checkCollision({ x, y }, paddle1) || checkCollision({ x, y }, paddle2)) {
    dx = -dx;
  }

  x = x + speed * dx;
  y = y + speed * dy;
}

function restart() {
  x = canvas.width / 2;
  y = canvas.height / 2;
}

function checkCollision(ball, paddle) {
  return (
    ball.y >= paddle.y &&
    ball.y <= paddle.y + PADDLE_SIZE &&
    ball.x >= paddle.x &&
    ball.x <= paddle.x
  );
}
