// canvas と初期設定
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// スクロールを防ぐ
document.body.addEventListener("touchmove", (e) => {
  e.preventDefault();  // スクロールを防止
}, { passive: false });

const gintoImg = new Image();
gintoImg.src = "path_to_ginto_image.jpg";
const redImg = new Image();
redImg.src = "path_to_kyoukasho_image.jpg";
const blueImg = new Image();
blueImg.src = "path_to_matsunaga_image.jpg";
const greenImg = new Image();
greenImg.src = "path_to_x_icon.PNG";
const kchanImg = new Image();
kchanImg.src = "path_to_kchan.jpg";
const ychanImg = new Image();
ychanImg.src = "path_to_ychan.jpg";

let gameState = "title";
const player = { x: canvas.width / 2 - 25, y: canvas.height - 100, width: 50, height: 50 };
let score = 0, lives = 3;
let enemies = [], recoveryItems = [], bullets = [];
let lastShotTime = 0, startTime = null;
let backgroundOffset = 0, lastSpeedUpScore = 0;
let playerSpeed = 10, enemySpeed = 2, enemySpawnRate = 0.02;
let boss = null, bossHP = 100, bossAppeared = false, bossImage = null;
let gameoverImg = document.getElementById("gameoverImage");

// テキスト表示
function drawText(text, x, y, size = 24, color = "white", align = "center") {
  ctx.font = `${size}px Arial`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.fillText(text, x, y);
}

// ハート表示
function drawLives() {
  for (let i = 0; i < 3; i++) {
    drawText(i < lives ? "♥" : "♡", canvas.width - 80 + i * 20, 30, 24, "pink", "left");
  }
}

// 敵生成
function spawnEnemy() {
  if (bossAppeared) return;
  if (Math.random() < enemySpawnRate) {
    const isMatsunaga = Math.random() < 1 / 3;
    enemies.push({
      x: Math.random() * (canvas.width - 40),
      y: -40,
      width: 40, height: 40,
      type: isMatsunaga ? "blue" : "red",
      dx: (Math.random() - 0.5) * 6,
      dy: Math.random() * 1 + 1.5
    });
  }
}

// 回復アイテム
function spawnRecoveryItem() {
  if (Math.random() < 0.0001) {
    recoveryItems.push({
      x: Math.random() * (canvas.width - 20),
      y: -20, width: 20, height: 20,
      speed: 2
    });
  }
}

// 衝突判定
function isColliding(a, b) {
  return a.x < b.x + b.width &&
         a.x + a.width > b.x &&
         a.y < b.y + b.height &&
         a.y + a.height > b.y;
}

// 衝突処理
function checkCollisions() {
  enemies = enemies.filter(enemy => {
    if (isColliding(player, enemy)) {
      if (enemy.type === "red") score++;
      if (enemy.type === "blue") {
        lives--;
        if (lives <= 0) {
          gameState = "gameover";
          gameoverImg.style.display = "block";
        }
      }
      return false;
    }
    return true;
  });

  recoveryItems = recoveryItems.filter(item => {
    if (isColliding(player, item)) {
      if (lives < 3) lives++;
      return false;
    }
    return true;
  });

  bullets = bullets.filter(bullet => {
    // ボスに命中
    if (boss && isColliding(bullet, boss)) {
      bossHP -= 5;
      return false;
    }

    // 松永撃破
    enemies = enemies.filter(enemy => {
      if (enemy.type === "blue" && isColliding(bullet, enemy)) {
        return false;
      }
      return true;
    });

    return bullet.y > 0;
  });
}

// ボス生成
function spawnBoss() {
  bossAppeared = true;
  bossImage = Math.random() < 0.5 ? kchanImg : ychanImg;
  boss = {
    x: canvas.width / 2 - 60, y: 50,
    width: 120, height: 80,
    dx: 3
  };
  bossHP = 100;
}

// ゲーム更新
function update() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (gameState === "title") {
    drawText("学力爆上げ↑↑", canvas.width / 2, 250, 36, "white");
    drawText("モテ期よ、今すぐ来い！", canvas.width / 2, 300, 24, "white");
    drawText("ぎんとの青春改造計画", canvas.width / 2, 350, 24, "yellow");
    drawText("タップでスタート", canvas.width / 2, 400, 20, "gray");
    return;
  }

  if (gameState === "gameover") {
    drawText("GAME OVER", canvas.width / 2, 280, 40, "red");
    drawText(`偏差値: ${score}`, canvas.width / 2, 330, 20);
    gameoverImg.style.display = "block";
    return;
  }

  const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
  if (elapsedTime >= 60 && !bossAppeared) spawnBoss();

  backgroundOffset += 2;
  for (let i = 0; i < canvas.height / 40; i++) {
    let y = (i * 40 + backgroundOffset) % canvas.height;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.strokeStyle = "#333";
    ctx.stroke();
  }

  if (!bossAppeared) {
    if (score - lastSpeedUpScore >= 10) {
      playerSpeed += 1;
      enemySpeed = Math.min(enemySpeed + 0.5, 10);
      enemySpawnRate = Math.min(enemySpawnRate + 0.005, 0.08);
      lastSpeedUpScore = score;
    }
    spawnEnemy();
    spawnRecoveryItem();
  }

  enemies.forEach(e => {
    e.x += e.dx;
    e.y += e.dy;
    if (e.x < 0 || e.x > canvas.width - e.width) e.dx *= -1;
  });
  enemies = enemies.filter(e => e.y < canvas.height);

  recoveryItems.forEach(item => item.y += item.speed);

  bullets.forEach(b => b.y -= 10);

  if (bossAppeared) {
    boss.x += boss.dx;
    if (boss.x <= 0 || boss.x + boss.width >= canvas.width) boss.dx *= -1;

    if (Math.random() < 0.05) {
      enemies.push({
        x: boss.x + boss.width / 2 - 20,
        y: boss.y + boss.height,
        width: 40, height: 40,
        type: "blue", dx: 0, dy: 3
      });
    }

    if (bossHP <= 0) {
      bossAppeared = false;
      boss = null;
      score += 10; // ボーナススコア
    }

    // ボス名の表示
    drawText(bossImage === kchanImg ? "Kちゃん" : "Yちゃん", canvas.width / 2, 20, 24, "white", "center");
  }

  checkCollisions();

  ctx.drawImage(gintoImg, player.x, player.y, player.width, player.height);
  enemies.forEach(e => ctx.drawImage(e.type === "red" ? redImg : blueImg, e.x, e.y, e.width, e.height));
  recoveryItems.forEach(item => ctx.drawImage(greenImg, item.x, item.y, item.width, item.height));
  bullets.forEach(b => {
    ctx.fillStyle = "yellow";
    ctx.fillRect(b.x, b.y, 5, 10);
  });

  if (boss) {
    ctx.drawImage(bossImage, boss.x, boss.y, boss.width, boss.height);
    ctx.fillStyle = "red";
    ctx.fillRect(canvas.width / 2 - 100, 10, 200, 10);
    ctx.fillStyle = "lime";
    ctx.fillRect(canvas.width / 2 - 100, 10, 200 * (bossHP / 100), 10);
  }

  drawText(`偏差値: ${score}`, 10, 30, 20, "white", "left");
  drawText(`TIME: ${elapsedTime}s`, 10, 60, 20, "white", "left");
  drawLives();
}


  const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
  if (elapsedTime >= 60 && !bossAppeared) spawnBoss();

  backgroundOffset += 2;
  for (let i = 0; i < canvas.height / 40; i++) {
    let y = (i * 40 + backgroundOffset) % canvas.height;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.strokeStyle = "#333";
    ctx.stroke();
  }

  if (!bossAppeared) {
    if (score - lastSpeedUpScore >= 10) {
      playerSpeed += 1;
      enemySpeed = Math.min(enemySpeed + 0.5, 10);
      enemySpawnRate = Math.min(enemySpawnRate + 0.005, 0.08);
      lastSpeedUpScore = score;
    }
    spawnEnemy();
    spawnRecoveryItem();
  }

  enemies.forEach(e => {
    e.x += e.dx;
    e.y += e.dy;
    if (e.x < 0 || e.x > canvas.width - e.width) e.dx *= -1;
  });
  enemies = enemies.filter(e => e.y < canvas.height);

  recoveryItems.forEach(item => item.y += item.speed);

  bullets.forEach(b => b.y -= 10);

  if (bossAppeared) {
    boss.x += boss.dx;
    if (boss.x <= 0 || boss.x + boss.width >= canvas.width) boss.dx *= -1;

    if (Math.random() < 0.05) {
      enemies.push({
        x: boss.x + boss.width / 2 - 20,
        y: boss.y + boss.height,
        width: 40, height: 40,
        type: "blue", dx: 0, dy: 3
      });
    }

    if (bossHP <= 0) {
      bossAppeared = false;
      boss = null;
      score += 10; // ボーナススコア
    }
  }

  checkCollisions();

  ctx.drawImage(gintoImg, player.x, player.y, player.width, player.height);
  enemies.forEach(e => ctx.drawImage(e.type === "red" ? redImg : blueImg, e.x, e.y, e.width, e.height));
  recoveryItems.forEach(item => ctx.drawImage(greenImg, item.x, item.y, item.width, item.height));
  bullets.forEach(b => {
    ctx.fillStyle = "yellow";
    ctx.fillRect(b.x, b.y, 5, 10);
  });

  if (boss) {
    ctx.drawImage(bossImage, boss.x, boss.y, boss.width, boss.height);
    ctx.fillStyle = "red";
    ctx.fillRect(canvas.width / 2 - 100, 10, 200, 10);
    ctx.fillStyle = "lime";
    ctx.fillRect(canvas.width / 2 - 100, 10, 200 * (bossHP / 100), 10);
  }

  drawText(`偏差値: ${score}`, 10, 30, 20, "white", "left");
  drawText(`TIME: ${elapsedTime}s`, 10, 60, 20, "white", "left");
  drawLives();
}

// タッチ処理
let startX = 0, isTouching = false;

canvas.addEventListener("touchstart", (e) => {
  if (gameState === "title" || gameState === "gameover") {
    gameState = "playing";
    score = 0; lives = 3;
    enemies = []; recoveryItems = []; bullets = [];
    player.x = canvas.width / 2 - player.width / 2;
    playerSpeed = 10; enemySpeed = 2; enemySpawnRate = 0.02;
    gameoverImg.style.display = "none";
    startTime = Date.now();
    bossAppeared = false;
  }

  const touch = e.touches[0];
  startX = touch.clientX;
  isTouching = true;

  if (gameState === "playing") {
    bullets.push({
      x: player.x + player.width / 2 - 2.5,
      y: player.y,
      width: 5,
      height: 10
    });
  }
});

canvas.addEventListener("touchmove", (e) => {
  if (!isTouching) return;
  const touch = e.touches[0];
  const dx = touch.clientX - startX;
  player.x += dx;
  startX = touch.clientX;
  player.x = Math.max(0, Math.min(player.x, canvas.width - player.width));
});

canvas.addEventListener("touchend", () => {
  isTouching = false;
});

// ループ
function gameLoop() {
  update();
  requestAnimationFrame(gameLoop);
}
gameLoop();
