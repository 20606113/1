
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('startScreen');
const playerSelectionDiv = document.getElementById('playerSelection');
const startGameButton = document.getElementById('startGameButton');
const playerOptionButtons = document.querySelectorAll('.player-option');

canvas.width = 1024;
canvas.height = 768;

const gameState = {
    score: 0,
    level: 1,
    gameOver: false,
    gameStarted: false, // 新增遊戲開始狀態
    selectedPlayerType: 'default', // 預設選擇
    lastShotTime: 0, // 新增上次射擊時間
    currentLevelIndex: 0, // 當前關卡索引
    levelScoreThreshold: 0, // 當前關卡升級所需分數
    keys: {},
    mouse: { x: canvas.width / 2, y: canvas.height / 2 },
    enemySpawnInterval: null,
};

function getDistance(x1, y1, x2, y2) {
    const xDist = x2 - x1;
    const yDist = y2 - y1;
    return Math.sqrt(Math.pow(xDist, 2) + Math.pow(yDist, 2));
}

const playerTypes = {
    'default': {
        color: 'cyan',
        draw: function(ctx, radius) {
            // --- Interceptor MK. II ---
            const primary = '#B0BEC5'; // Blue Grey
            const secondary = '#78909C'; // Darker Blue Grey
            const accent = '#80DEEA'; // Cyan accent

            ctx.lineWidth = 1.5;

            // Engines
            ctx.fillStyle = accent;
            ctx.beginPath();
            ctx.rect(-radius * 1.2, -radius * 0.4, radius * 0.5, radius * 0.8);
            ctx.fill();

            // Main Hull (bottom layer)
            ctx.fillStyle = secondary;
            ctx.beginPath();
            ctx.moveTo(radius * 1.5, 0); // Nose
            ctx.lineTo(-radius * 0.5, -radius); // Wing root
            ctx.lineTo(-radius * 1.1, -radius * 0.8); // Winglet
            ctx.lineTo(-radius * 1.1, radius * 0.8);
            ctx.lineTo(-radius * 0.5, radius);
            ctx.closePath();
            ctx.fill();

            // Top Plating
            ctx.fillStyle = primary;
            ctx.strokeStyle = 'white';
            ctx.beginPath();
            ctx.moveTo(radius * 1.5, 0); // Nose
            ctx.lineTo(0, -radius * 0.6);
            ctx.lineTo(-radius * 0.8, -radius * 0.5);
            ctx.lineTo(-radius * 0.8, radius * 0.5);
            ctx.lineTo(0, radius * 0.6);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            
            // Cockpit
            ctx.fillStyle = '#263238'; // Dark panel
            ctx.beginPath();
            ctx.arc(radius * 0.7, 0, radius * 0.35, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = accent; // Cockpit glass
            ctx.beginPath();
            ctx.arc(radius * 0.75, 0, radius * 0.25, 0, Math.PI * 2);
            ctx.fill();
        },
        attack: {
            bulletCount: 1,
            bulletSpread: 0,
            bulletDamage: 20,
            bulletSpeed: 7,
            fireRate: 200 // ms
        }
    },
    'fighter': {
        color: '#00ff00', // Green fighter
        draw: function(ctx, radius) {
            // --- Striker MK. II ---
            const primary = '#66BB6A'; // Green
            const secondary = '#388E3C'; // Dark Green
            const accent = '#FF8A65'; // Orange accent

            ctx.lineWidth = 1.5;
            ctx.strokeStyle = 'white';

            // Main Hull
            ctx.fillStyle = secondary;
            ctx.beginPath();
            ctx.moveTo(radius * 1.7, 0); // Nose
            ctx.lineTo(radius * 0.2, -radius * 1.3); // Wing tip
            ctx.lineTo(-radius * 1.2, -radius * 0.4); // Aft
            ctx.lineTo(-radius * 1.2, radius * 0.4);
            ctx.lineTo(radius * 0.2, radius * 1.3);
            ctx.closePath();
            ctx.fill();

            // Top Plating & Engine housing
            ctx.fillStyle = primary;
            ctx.beginPath();
            ctx.moveTo(radius * 1.2, 0);
            ctx.lineTo(0, -radius * 0.8);
            ctx.lineTo(-radius * 1, -radius * 0.3);
            ctx.lineTo(-radius * 1, radius * 0.3);
            ctx.lineTo(0, radius * 0.8);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Weapon Pods
            ctx.fillStyle = '#424242'; // Dark grey
            ctx.beginPath();
            ctx.rect(0, -radius * 1.1, radius * 0.8, radius * 0.4);
            ctx.rect(0, radius * 0.7, radius * 0.8, radius * 0.4);
            ctx.fill();

            // Cockpit
            ctx.fillStyle = accent;
            ctx.beginPath();
            ctx.arc(radius, 0, radius * 0.25, 0, Math.PI * 2);
            ctx.fill();
        },
        attack: {
            bulletCount: 3,
            bulletSpread: 0.2, // radians
            bulletDamage: 15,
            bulletSpeed: 8,
            fireRate: 150 // ms (faster)
        }
    },
    'cruiser': {
        color: '#ff00ff', // Magenta cruiser
        draw: function(ctx, radius) {
            // --- Dreadnought MK. II ---
            const primary = '#AB47BC'; // Purple
            const secondary = '#6A1B9A'; // Dark Purple
            const accent = '#18FFFF'; // Cyan accent/windows

            ctx.lineWidth = 1.5;
            ctx.strokeStyle = 'white';

            // Rear Hull / Engines
            ctx.fillStyle = '#424242'; // Dark Grey
            ctx.beginPath();
            ctx.rect(-radius * 1.8, -radius * 0.6, radius, radius * 1.2);
            ctx.fill();
            ctx.fillStyle = accent;
            ctx.beginPath();
            ctx.ellipse(-radius * 1.7, 0, radius * 0.1, radius * 0.4, 0, 0, Math.PI * 2);
            ctx.fill();

            // Main Hull (layered)
            ctx.fillStyle = secondary;
            ctx.beginPath();
            ctx.moveTo(radius * 1.3, 0); // Front
            ctx.lineTo(radius * 0.5, -radius * 1.4); // Shoulder
            ctx.lineTo(-radius, -radius * 1.1);
            ctx.lineTo(-radius, radius * 1.1);
            ctx.lineTo(radius * 0.5, radius * 1.4);
            ctx.closePath();
            ctx.fill();
            
            // Top Armor Plating
            ctx.fillStyle = primary;
            ctx.beginPath();
            ctx.moveTo(radius * 1.3, 0); // Front
            ctx.lineTo(radius * 0.6, -radius * 0.9);
            ctx.lineTo(-radius * 0.2, -radius * 0.8);
            ctx.lineTo(-radius * 0.2, radius * 0.8);
            ctx.lineTo(radius * 0.6, radius * 0.9);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Bridge
            ctx.fillStyle = secondary;
            ctx.beginPath();
            ctx.rect(0, -radius * 0.3, radius * 0.5, radius * 0.6);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = accent; // Bridge window
            ctx.fillRect(radius * 0.1, -radius * 0.1, radius * 0.3, radius * 0.2);
        },
        attack: {
            bulletCount: 8,
            bulletSpread: 0.4,    // In a 0.4 radian cone
            bulletDamage: 8,     // Each projectile does less damage
            bulletSpeed: 7,       // Faster than before
            fireRate: 800,         // Slower fire rate to compensate for the burst
            bulletLifetime: 45 // 45 frames lifetime for shorter range
        }
    }
};

const levels = [
    {
        level: 1,
        scoreToAdvance: 500,
        enemySpawnDelay: 1000, // ms
        enemyTypes: [
            { type: 'Grunt', weight: 0.7 },
            { type: 'Runner', weight: 0.3 }
        ]
    },
    {
        level: 2,
        scoreToAdvance: 1500,
        enemySpawnDelay: 800,
        enemyTypes: [
            { type: 'Grunt', weight: 0.6 },
            { type: 'Runner', weight: 0.4 }
        ]
    },
    {
        level: 3,
        scoreToAdvance: 3000,
        enemySpawnDelay: 600,
        enemyTypes: [
            { type: 'Grunt', weight: 0.5 },
            { type: 'Runner', weight: 0.4 },
            { type: 'Charger', weight: 0.1 } // New enemy type for later
        ]
    }
    // Add more levels as needed
];

class Player {
    constructor(x, y, radius, type = 'default') { // Add type parameter
        this.x = x; this.y = y; this.radius = radius;
        this.type = type; // Store player type
        this.color = playerTypes[this.type].color; // Get color from type
        this.speed = 5; this.angle = 0;

        // Player-specific attack properties and power-up state
        this.attack = { ...playerTypes[this.type].attack };
        this.activePowerUp = null;
        this.powerUpTimeout = null;
    }
    update() {
        if (gameState.keys['w'] || gameState.keys['W']) this.y -= this.speed;
        if (gameState.keys['s'] || gameState.keys['S']) this.y += this.speed;
        if (gameState.keys['a'] || gameState.keys['A']) this.x -= this.speed;
        if (gameState.keys['d'] || gameState.keys['D']) this.x += this.speed;
        this.x = Math.max(this.radius, Math.min(canvas.width - this.radius, this.x));
        this.y = Math.max(this.radius, Math.min(canvas.height - this.radius, this.y));
        const dx = gameState.mouse.x - this.x;
        const dy = gameState.mouse.y - this.y;
        this.angle = Math.atan2(dy, dx);
    }
    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.fillStyle = this.color; // Set player's color
        playerTypes[this.type].draw(ctx, this.radius); // Call specific draw function
        ctx.restore();
    }
}

const bulletTypes = {
    'default': {
        color: '#00FFFF', // Cyan
        radius: 5,
        draw: function(ctx, radius) {
            ctx.fillStyle = this.color;
            ctx.shadowBlur = 10;
            ctx.shadowColor = this.color;
            ctx.beginPath();
            ctx.moveTo(radius * 2, 0);
            ctx.lineTo(-radius, -radius / 2);
            ctx.lineTo(-radius, radius / 2);
            ctx.closePath();
            ctx.fill();
        }
    },
    'fighter': {
        color: '#ADFF2F', // Green-Yellow
        radius: 4,
        draw: function(ctx, radius) {
            ctx.fillStyle = this.color;
            ctx.shadowBlur = 12;
            ctx.shadowColor = this.color;
            ctx.lineWidth = 3;
            ctx.strokeStyle = this.color;
            ctx.beginPath();
            ctx.moveTo(-radius * 2, 0);
            ctx.lineTo(radius * 2, 0);
            ctx.stroke();
        }
    },
    'cruiser': {
        color: '#FF00FF', // Magenta
        radius: 8,
        draw: function(ctx, radius) {
            const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
            grad.addColorStop(0, 'white');
            grad.addColorStop(0.4, this.color);
            grad.addColorStop(1, 'rgba(255, 0, 255, 0)');
            ctx.fillStyle = grad;
            ctx.shadowBlur = 20;
            ctx.shadowColor = this.color;
            ctx.beginPath();
            ctx.arc(0, 0, radius, 0, Math.PI * 2);
            ctx.fill();
        }
    }
};

class Bullet {
    constructor(x, y, velocity, damage, type, lifetime = 120) { // Default lifetime 120 frames
        this.x = x;
        this.y = y;
        this.velocity = velocity;
        this.damage = damage;
        this.type = type;
        this.radius = bulletTypes[type].radius;
        this.color = bulletTypes[type].color;
        this.lifetime = lifetime;
    }
    update() { 
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.lifetime--;
    }
    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        const angle = Math.atan2(this.velocity.y, this.velocity.x);
        ctx.rotate(angle);
        // Reset shadow properties before drawing
        ctx.shadowBlur = 0;
        ctx.shadowColor = 'rgba(0,0,0,0)';
        bulletTypes[this.type].draw(ctx, this.radius);
        ctx.restore();
    }
}

// --- Enemy System Refactor ---
class Enemy {
    constructor(x, y, radius, color, hp, baseSpeed) {
        this.x = x; this.y = y; this.radius = radius; this.color = color;
        this.hp = hp; this.baseSpeed = baseSpeed;
        this.velocity = { x: 0, y: 0 };
        // Variable speed mechanism
        this.tick = Math.random() * 100; // Random initial timer for desynchronized speed changes
        this.speedVariance = 0.5; // Speed variation range
    }

    update() {
        const angle = Math.atan2(player.y - this.y, player.x - this.x);
        // Use sine function for smooth speed changes
        const currentSpeed = this.baseSpeed + Math.sin(this.tick) * this.speedVariance;
        this.tick += 0.05; // Control speed change frequency

        this.velocity.x = Math.cos(angle) * currentSpeed;
        this.velocity.y = Math.sin(angle) * currentSpeed;
        this.x += this.velocity.x;
        this.y += this.velocity.y;
    }

    // The draw method will be implemented by subclasses
    draw() {
        // Placeholder or abstract method
        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

class Grunt extends Enemy {
    constructor(x, y) {
        // HP: 30, Speed: Medium
        super(x, y, 20, '#ff4d4d', 30, 1.2);
        // Generate a random asteroid shape
        this.shape = [];
        const points = 8 + Math.floor(Math.random() * 5); // 8 to 12 points
        for (let i = 0; i < points; i++) {
            const angle = (i / points) * Math.PI * 2;
            const radius = this.radius * (0.7 + Math.random() * 0.3); // Irregular radius
            this.shape.push({ x: Math.cos(angle) * radius, y: Math.sin(angle) * radius });
        }
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.tick * 0.02); // Slow rotation

        const grad = ctx.createRadialGradient(0, 0, this.radius * 0.5, 0, 0, this.radius);
        grad.addColorStop(0, this.color);
        grad.addColorStop(1, '#8B0000'); // Darker red

        ctx.fillStyle = grad;
        ctx.strokeStyle = '#FFA07A'; // Light Salmon outline
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.moveTo(this.shape[0].x, this.shape[0].y);
        for (let i = 1; i < this.shape.length; i++) {
            ctx.lineTo(this.shape[i].x, this.shape[i].y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.restore();
    }
}

class Runner extends Enemy {
    constructor(x, y) {
        // HP: 15, Speed: Fast
        super(x, y, 12, '#ff944d', 15, 2.0);
        this.speedVariance = 1.0; // Runner's speed changes more dramatically
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        const angle = Math.atan2(this.velocity.y, this.velocity.x);
        ctx.rotate(angle);

        // Glowing Core
        const coreGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius);
        coreGrad.addColorStop(0, 'white');
        coreGrad.addColorStop(0.4, this.color);
        coreGrad.addColorStop(1, 'rgba(255, 148, 77, 0)');

        ctx.fillStyle = coreGrad;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Comet-like body
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(this.radius, 0);
        ctx.lineTo(-this.radius * 2, -this.radius * 0.8);
        ctx.lineTo(-this.radius * 1.5, 0);
        ctx.lineTo(-this.radius * 2, this.radius * 0.8);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }
}

class PowerUp {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.radius = 15; // Larger radius for more detailed drawing
        this.rotation = 0;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.shadowBlur = 20;

        if (this.type === 'rapidFire') {
            const color = '#FFFF00'; // Yellow
            ctx.shadowColor = color;
            
            // Inner gradient
            const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius * 0.8);
            grad.addColorStop(0, '#FFFFFF');
            grad.addColorStop(0.6, color);
            grad.addColorStop(1, color);
            ctx.fillStyle = grad;

            // Draw a stylized lightning bolt shape
            ctx.beginPath();
            ctx.moveTo(-this.radius * 0.3, -this.radius);
            ctx.lineTo(this.radius * 0.6, -this.radius * 0.2);
            ctx.lineTo(this.radius * 0.2, -this.radius * 0.2);
            ctx.lineTo(this.radius * 0.8, this.radius * 0.3);
            ctx.lineTo(-this.radius * 0.6, this.radius * 1);
            ctx.lineTo(-this.radius * 0.2, this.radius * 0.2);
            ctx.lineTo(-this.radius * 0.8, -this.radius * 0.3);
            ctx.closePath();
            ctx.fill();

        } else if (this.type === 'spreadShot') {
            const color = '#00FFFF'; // Cyan
            ctx.shadowColor = color;
            
            // Draw three small projectiles in a fan
            for (let i = -1; i <= 1; i++) {
                ctx.save();
                const angle = i * 0.5; // radians spread
                ctx.rotate(angle);
                
                const grad = ctx.createLinearGradient(0, 0, this.radius, 0);
                grad.addColorStop(0, 'white');
                grad.addColorStop(1, color);
                ctx.fillStyle = grad;

                ctx.beginPath();
                ctx.moveTo(this.radius * 0.2, 0);
                ctx.lineTo(this.radius, -4);
                ctx.lineTo(this.radius, 4);
                ctx.closePath();
                ctx.fill();
                ctx.restore();
            }
        }
        
        ctx.restore();
    }

    update() {
        this.rotation += 0.02; // Add slow rotation
    }
}

let player;
let bullets = [];
let enemies = [];
let particles = []; // For hit and explosion effects
let powerUps = [];
let stars = []; // 新增星星陣列

class Particle {
    constructor(x, y, radius, color, velocity) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
        this.alpha = 1;
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.restore();
    }

    update() {
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.alpha -= 0.03; // Faster fade
    }
}

// 音效
let shootSound;
let hitSound;
let destroySound;
let gameOverSound;

document.addEventListener('keydown', (e) => { gameState.keys[e.key] = true; });
document.addEventListener('keyup', (e) => { gameState.keys[e.key] = false; });
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    gameState.mouse.x = e.clientX - rect.left;
    gameState.mouse.y = e.clientY - rect.top;
});

function activatePowerUp(type) {
    // Clear any existing power-up timeout to reset it
    if (player.powerUpTimeout) {
        clearTimeout(player.powerUpTimeout);
        // Revert to base stats before applying new power-up
        player.attack = { ...playerTypes[player.type].attack };
    }

    player.activePowerUp = type;

    if (type === 'rapidFire') {
        player.attack.fireRate /= 2;
    } else if (type === 'spreadShot') {
        player.attack.bulletCount += 2;
        player.attack.bulletSpread = 0.3;
    }

    // Set a timer to revert the effect
    const POWER_UP_DURATION = 5000; // 5 seconds
    gameState.powerUpTimer = POWER_UP_DURATION;
    player.powerUpTimeout = setTimeout(() => {
        player.attack = { ...playerTypes[player.type].attack }; // Revert
        player.activePowerUp = null;
        player.powerUpTimeout = null;
        gameState.powerUpTimer = 0;
    }, POWER_UP_DURATION);
}

function handlePlayerShoot(targetX, targetY) {
        const playerAttack = player.attack; // Use player's current attack stats
        const bulletType = gameState.selectedPlayerType;
        const currentTime = Date.now();

        if (currentTime - gameState.lastShotTime < playerAttack.fireRate) {
            return; // Still on cooldown
        }

        gameState.lastShotTime = currentTime; // Update last shot time

        const baseAngle = Math.atan2(targetY - player.y, targetX - player.x);

        for (let i = 0; i < playerAttack.bulletCount; i++) {
            let currentAngle = baseAngle;
            if (playerAttack.bulletCount > 1) {
                // Calculate spread for multiple bullets
                const spreadOffset = (i - (playerAttack.bulletCount - 1) / 2) * playerAttack.bulletSpread;
                currentAngle += spreadOffset;
            }

            const velocity = {
                x: Math.cos(currentAngle) * playerAttack.bulletSpeed,
                y: Math.sin(currentAngle) * playerAttack.bulletSpeed
            };
            const lifetime = playerAttack.bulletLifetime; // Get lifetime from attack stats
            bullets.push(new Bullet(player.x, player.y, velocity, playerAttack.bulletDamage, bulletType, lifetime));
        }
        shootSound.currentTime = 0;
        shootSound.play();
    }

    canvas.addEventListener('click', (e) => {
        if (!gameState.gameStarted) return; // Only allow shooting if game has started
        handlePlayerShoot(e.offsetX, e.offsetY);
    });

    // Player selection logic
    playerOptionButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove 'selected' class from all buttons
            playerOptionButtons.forEach(btn => btn.classList.remove('selected'));
            // Add 'selected' class to the clicked button
            button.classList.add('selected');
            gameState.selectedPlayerType = button.dataset.playerType;
            // Redraw preview
            drawPlayerPreview(button.querySelector('canvas'), gameState.selectedPlayerType);
        });
    });

    // Start game button logic
    startGameButton.addEventListener('click', () => {
        startScreen.style.display = 'none'; // Hide start screen
        canvas.style.display = 'block'; // Show game canvas
        gameState.gameStarted = true; // Set game started flag
        init(); // Initialize game with selected player
        gameLoop(); // Start game loop
    });
function spawnEnemies() {
    const currentLevel = levels[gameState.currentLevelIndex];
    if (gameState.enemySpawnInterval) clearInterval(gameState.enemySpawnInterval); // Clear previous interval

    gameState.enemySpawnInterval = setInterval(() => {
        let x, y;
        if (Math.random() < 0.5) {
            x = Math.random() < 0.5 ? 0 - 30 : canvas.width + 30;
            y = Math.random() * canvas.height;
        } else {
            x = Math.random() * canvas.width;
            y = Math.random() < 0.5 ? 0 - 30 : canvas.height + 30;
        }

        // 根據當前關卡配置生成敵人
        let totalWeight = 0;
        currentLevel.enemyTypes.forEach(type => totalWeight += type.weight);
        let randomWeight = Math.random() * totalWeight;

        for (const enemyTypeConfig of currentLevel.enemyTypes) {
            randomWeight -= enemyTypeConfig.weight;
            if (randomWeight <= 0) {
                // Dynamically create enemy based on type string
                switch (enemyTypeConfig.type) {
                    case 'Grunt':
                        enemies.push(new Grunt(x, y));
                        break;
                    case 'Runner':
                        enemies.push(new Runner(x, y));
                        break;
                    // Add more enemy types here if needed
                    // case 'Charger':
                    //     enemies.push(new Charger(x, y));
                    //     break;
                }
                break;
            }
        }
    }, currentLevel.enemySpawnDelay);
}

function applyLevelSettings(levelConfig) {
    gameState.level = levelConfig.level;
    gameState.levelScoreThreshold = levelConfig.scoreToAdvance;
    // Other level-specific settings can be applied here (e.g., enemy stats)
    // For now, enemy stats are fixed in their classes, but could be overridden here.
}

function checkLevelUp() {
    if (gameState.score >= gameState.levelScoreThreshold) {
        if (gameState.currentLevelIndex < levels.length - 1) {
            gameState.currentLevelIndex++;
            applyLevelSettings(levels[gameState.currentLevelIndex]);
            // Clear existing enemies for a fresh start on new level
            enemies = [];
            // Restart enemy spawning with new delay
            spawnEnemies();
            console.log(`等級提升！歡迎來到第 ${gameState.level} 級`);
        } else {
            // Game completed all levels
            console.log("已通關所有級別！你贏了！");
            // Potentially trigger a win screen or endless mode
        }
    }
}

function init() {
    player = new Player(canvas.width / 2, canvas.height / 2, 15, gameState.selectedPlayerType); // Use selected player type
    gameState.score = 0;
    gameState.level = 1;
    gameState.gameOver = false;
    gameState.keys = {};
    bullets = [];
    enemies = [];
    particles = [];
    powerUps = [];
    gameState.powerUpTimer = 0;
    stars = []; // 清空星星陣列
    for (let i = 0; i < 200; i++) { // 創建200顆星星
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            radius: Math.random() * 1.5 + 0.5, // 0.5 到 2 之間
            speed: Math.random() * 0.5 + 0.1 // 0.1 到 0.6 之間
        });
    }

    // 初始化音效
    shootSound = new Audio('./sounds/shoot.wav');
    hitSound = new Audio('./sounds/hit.wav');
    destroySound = new Audio('./sounds/destroy.wav');
    gameOverSound = new Audio('./sounds/gameover.wav');

    // 關卡初始化
    gameState.currentLevelIndex = 0;
    applyLevelSettings(levels[gameState.currentLevelIndex]);

    if (gameState.enemySpawnInterval) clearInterval(gameState.enemySpawnInterval);
    spawnEnemies();
}

function gameLoop() {
    if (!gameState.gameStarted) { // Don't run game loop if game hasn't started
        requestAnimationFrame(gameLoop);
        return;
    }

    if (gameState.gameOver) {
        clearInterval(gameState.enemySpawnInterval);
        if(player.powerUpTimeout) clearTimeout(player.powerUpTimeout);
        gameOverSound.currentTime = 0;
        gameOverSound.play(); // 播放遊戲結束音效
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.font = '60px Arial'; ctx.fillStyle = 'red'; ctx.textAlign = 'center';
        ctx.fillText('遊戲結束', canvas.width / 2, canvas.height / 2);
        ctx.font = '30px Arial';
        ctx.fillText(`最終得分: ${gameState.score}`, canvas.width / 2, canvas.height/2 + 50);
        return;
    }

    // 繪製半透明背景，創造拖尾效果
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'; // 稍微調高透明度，讓星星更明顯
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 更新並繪製星星
    stars.forEach(star => {
        star.y += star.speed;
        if (star.y > canvas.height) {
            star.y = 0; // 星星超出底部後回到頂部
            star.x = Math.random() * canvas.width; // 隨機X位置
        }
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'white';
        ctx.fill();
    });

    player.update();
    player.draw();

    // Update and draw particles
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.update();
        p.draw();
        if (p.alpha <= 0) {
            particles.splice(i, 1);
        }
    }

    // Update and draw powerups
    for (let i = powerUps.length - 1; i >= 0; i--) {
        const powerUp = powerUps[i];
        powerUp.update();
        powerUp.draw();

        if (getDistance(player.x, player.y, powerUp.x, powerUp.y) - player.radius - powerUp.radius < 1) {
            activatePowerUp(powerUp.type);
            powerUps.splice(i, 1);
        }
    }

    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        enemy.update();
        enemy.draw();

        if (getDistance(player.x, player.y, enemy.x, enemy.y) - enemy.radius - player.radius < 1) {
            gameState.gameOver = true;
        }

        for (let j = bullets.length - 1; j >= 0; j--) {
            const bullet = bullets[j];
            if (getDistance(bullet.x, bullet.y, enemy.x, enemy.y) - enemy.radius - bullet.radius < 1) {
                
                // Create hit particles
                for (let k = 0; k < 5; k++) {
                    const angle = Math.random() * Math.PI * 2;
                    const speed = Math.random() * 2;
                    particles.push(new Particle(
                        bullet.x, bullet.y, Math.random() * 2, bullet.color,
                        { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed }
                    ));
                }
                
                enemy.hp -= bullet.damage;
                hitSound.currentTime = 0;
                hitSound.play(); // 播放擊中音效
                bullets.splice(j, 1); // 子彈擊中後消失

                if (enemy.hp <= 0) {
                    // Create bigger explosion on death
                    for (let k = 0; k < 20; k++) {
                        const angle = Math.random() * Math.PI * 2;
                        const speed = Math.random() * 5;
                        particles.push(new Particle(
                            enemy.x, enemy.y, Math.random() * 3 + 1, enemy.color,
                            { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed }
                        ));
                    }

                    destroySound.currentTime = 0;
                    destroySound.play(); // 播放敵人摧毀音效
                    enemies.splice(i, 1);
                    gameState.score += 10; // 基礎得分

                    // Chance to drop a power-up
                    if (Math.random() < 0.2) { // 20% chance
                        const powerUpType = Math.random() < 0.5 ? 'rapidFire' : 'spreadShot';
                        powerUps.push(new PowerUp(enemy.x, enemy.y, powerUpType));
                    }
                }
                break; // 一顆子彈只對一個敵人生效
            }
        }
    }

    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        bullet.update();
        bullet.draw();
        if (bullet.x < 0 || bullet.x > canvas.width || bullet.y < 0 || bullet.y > canvas.height || bullet.lifetime <= 0) {
            bullets.splice(i, 1);
        }
    }

    checkLevelUp(); // Check for level up

    // Draw UI
    ctx.fillStyle = 'white'; ctx.font = '24px Arial'; ctx.textAlign = 'left';
    ctx.fillText(`得分: ${gameState.score}`, 10, 30);
    ctx.fillText(`等級: ${gameState.level}`, 10, 60);

    // Draw Power-up status
    if (player && player.activePowerUp) {
        gameState.powerUpTimer -= 1000/60; // roughly 16.6ms per frame
        const powerUpName = player.activePowerUp === 'rapidFire' ? '快速射擊' : '擴散射擊';
        const secondsLeft = (gameState.powerUpTimer / 1000).toFixed(1);
        if (secondsLeft > 0) {
            ctx.fillStyle = player.activePowerUp === 'rapidFire' ? '#FFFF00' : '#00FFFF';
            ctx.fillText(`${powerUpName}: ${secondsLeft}s`, canvas.width / 2 - 100, 30);
        }
    }

    requestAnimationFrame(gameLoop);
}

function drawPlayerPreview(previewCanvas, type) {
    const previewCtx = previewCanvas.getContext('2d');
    previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
    previewCtx.save();
    previewCtx.translate(previewCanvas.width / 2, previewCanvas.height / 2);
    previewCtx.fillStyle = playerTypes[type].color;
    playerTypes[type].draw(previewCtx, 15); // Use a fixed radius for preview
    previewCtx.restore();
}

// Initial setup
startScreen.style.display = 'flex'; // Show start screen
canvas.style.display = 'none'; // Hide game canvas
playerOptionButtons[0].classList.add('selected'); // Select default player initially
drawPlayerPreview(document.getElementById('playerDefaultPreview'), 'default');
drawPlayerPreview(document.getElementById('playerFighterPreview'), 'fighter');
drawPlayerPreview(document.getElementById('playerCruiserPreview'), 'cruiser');

// Start the game loop, but it will pause until gameStarted is true
gameLoop();
