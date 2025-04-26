// canvas と初期設定
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// スクロール防止
document.body.addEventListener("touchmove", e => e.preventDefault(), { passive: false });

// 画像読み込み
const gintoImg = new Image();
gintoImg.src = "path_to_ginto_image.jpg";  // 実際のパスを設定
gintoImg.onload = function() { console.log("ぎんとの画像が読み込まれました"); };
const redImg = new Image();
redImg.src = "path_to_kyoukasho_image.jpg";  // 実際のパスを設定
redImg.onload = function() { console.log("教科書の画像が読み込まれました"); };
const blueImg = new Image();
blueImg.src = "path_to_matsunaga_image.jpg";  // 実際のパスを設定
blueImg.onload = function() { console.log("松永の画像が読み込まれました"); };
const greenImg = new Image();
greenImg.src = "path_to_x_icon.PNG";  // 実際のパスを設定
greenImg.onload = function() { console.log("Xアイコンの画像が読み込まれました"); };
const kchanImg = new Image();
kchanImg.src = "path_to_kchan.jpg";  // 実際のパスを設定
kchanImg.onload = function() { console.log("Kちゃんの画像が読み込まれました"); };
const ychanImg = new Image();
ychanImg.src = "path_to_ychan.jpg";  // 実際のパスを設定
ychanImg.onload = function() { console.log("Yちゃんの画像が読み込まれました"); };

const gameoverImg = document.getElementById("gameoverImage");

let gameState = "title";  // 初期状態はタイトル画面
let player = { x: canvas.width/2 - 25, y: canvas.height - 100, width: 50, height: 50 };
let score = 0, lives = 3;
let enemies = [], recoveryItems = [], bullets = [];
let playerSpeed = 10, enemySpeed = 2, enemySpawnRate = 0.02;
let lastShotTime = 0, startTime = null;
let backgroundOffset = 0, lastSpeedUpScore = 0;
let boss = null, bossHP = 100, bossAppeared = false, bossImage = null;

// 共通関数
function drawText(text, x, y, size = 24, color = "white", align = "center") {
  ctx.font = `${size}px Arial`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.fillText(text, x, y);
}

function drawLives() {
  for (let i = 0; i < 3; i++) {
    drawText(i < lives ? "♥" : "♡", canvas.width - 80 + i * 20, 30, 24, "pink", "left");
  }
}

function isColliding(a, b) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

// スポーン系
function spawnEnemy() {
  if (bossAppeared) return;
  if (Math.random() < enemySpawnRate) {
    const isMatsunaga = Math.random() < 1/3;
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

function spawnRecoveryItem() {
  if (Math.random() < 0.0001) {
    recoveryItems.push({
      x: Math.random() * (canvas.width - 20),
      y: -20,
      width: 20, height: 20,
      speed: 2
    });
  }
}

function spawnBoss() {
  bossAppeared = true;
  bossImage = Math.random() < 0.5 ? kchanImg : ychanImg;
  boss = {
    x: canvas.width/2 - 60, y: 50,
    width: 120, height: 80,
    dx: 3
  };
  bossHP = 100;
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
    let hit = false;

    // ボスに当たったら
    if (boss && isColliding(bullet, boss)) {
      bossHP -= 5;
      hit = true;
    }

    // 松永に当たったら
    enemies = enemies.filter(enemy => {
      if (enemy.type === "blue" && isColliding(bullet, enemy)) {
        hit = true;
        return false; // 松永削除
      }
      return true;
    });

    return !hit && bullet.y > 0; // 当たった弾も削除
  });
}

// メインループ
function update() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (gameState === "title") {
    drawText("学力爆上げ↑↑", canvas.width/2, 250, 36);
    drawText("モテ期よ、今すぐ来い！", canvas.width/2, 300, 24);
    drawText("ぎんとの青春改造計画", canvas.width/2, 350, 24, "yellow");
    drawText("タップでスタート", canvas.width/2, 400, 20, "gray");
    return;
  }

  if (gameState === "gameover") {
    drawText("GAME OVER", canvas.width/2, 280, 40, "red");
    drawText(`偏差値: ${score}`, canvas.width/2, 330, 20);
    return;
  }

  const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
  if (elapsedTime >= 60 && !bossAppeared) spawnBoss();

  // 背景線
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
      playerSpeed++;
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
        x: boss.x + boss.width/2 - 20,
        y: boss.y + boss.height,
        width: 40, height: 40,
        type: "blue", dx: 0, dy: 3
      });
    }

    if (bossHP <= 0) {
      bossAppeared = false;
      boss = null;
      score += 10;
    }

    drawText(bossImage === kchanImg ? "Kちゃん" : "Yちゃん", canvas.width/2, 20, 24);
  }

  checkCollisions();

  // 描画
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
    ctx.fillRect(canvas.width/2 - 100, 10, 200, 10);
    ctx.fillStyle = "lime";
    ctx.fillRect(canvas.width/2 - 100, 10, 200 * (bossHP / 100), 10);
  }

  drawText(`偏差値: ${score}`, 50, 30);
  drawLives();

  requestAnimationFrame(update);
}

// 初期化
canvas.addEventListener("click", () => {
  if (gameState === "title") {
    gameState = "playing";
    startTime = Date.now();
    requestAnimationFrame(update);
  }
});

// プレイヤー移動
canvas.addEventListener("mousemove", (e) => {
  player.x = e.clientX - player.width / 2;
  player.y = e.clientY - player.height / 2;
});

// 弾発射
canvas.addEventListener("click", () => {
  if (Date.now() - lastShotTime > 200) {
    lastShotTime = Date.now();
    bullets.push({ x: player.x + player.width / 2 - 2.5, y: player.y, width: 5, height: 10 });
  }
});
