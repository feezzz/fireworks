const canvas = document.getElementById('fireworks');
const ctx = canvas.getContext('2d');

// 创建音频上下文
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

// 创建爆炸声音
function createExplosionSound(frequency = 150) {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.5);
}

// 设置画布尺寸为窗口大小
function setCanvasSize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
setCanvasSize();
window.addEventListener('resize', setCanvasSize);

// 创建光芒效果
function createGlow(ctx, x, y, radius, color) {
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, color);
    gradient.addColorStop(0.1, color);
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    return gradient;
}

// 烟花类型
const FIREWORK_TYPES = {
    NORMAL: 'normal',
    RING: 'ring',
    SPIRAL: 'spiral',
    HEART: 'heart',
    STAR: 'star',
    DOUBLE: 'double',
    RANDOM: 'random'
};

// 烟花粒子类
class Particle {
    constructor(x, y, color, shape = 'circle', type = FIREWORK_TYPES.NORMAL) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.shape = shape;
        this.type = type;
        this.velocity = {
            x: (Math.random() - 0.5) * 8,
            y: (Math.random() - 0.5) * 8
        };
        this.alpha = 1;
        this.decay = Math.random() * 0.006 + 0.006; // 降低衰减速度
        this.size = Math.random() * 4 + 2;
        this.trail = [];
        this.maxTrailLength = 5;
        this.angle = Math.random() * Math.PI * 2;
        this.spinSpeed = (Math.random() - 0.5) * 0.2;
        this.glowRadius = this.size * 6;
        
        // 特殊效果的额外属性
        if (type === FIREWORK_TYPES.SPIRAL) {
            this.spiralRadius = Math.random() * 50 + 20;
            this.spiralAngle = Math.random() * Math.PI * 2;
            this.spiralSpeed = Math.random() * 0.1 + 0.05;
        }
    }

    draw() {
        // 绘制光芒效果
        ctx.save();
        ctx.globalAlpha = this.alpha * 0.5;
        ctx.fillStyle = createGlow(ctx, this.x, this.y, this.glowRadius, this.color);
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.glowRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // 绘制尾迹
        for (let i = 0; i < this.trail.length; i++) {
            const pos = this.trail[i];
            ctx.save();
            ctx.globalAlpha = this.alpha * (i / this.trail.length * 0.3);
            ctx.beginPath();
            if (this.shape === 'circle') {
                ctx.arc(pos.x, pos.y, this.size, 0, Math.PI * 2);
            } else if (this.shape === 'star') {
                this.drawStar(pos.x, pos.y, this.size * 2, this.angle);
            } else if (this.shape === 'heart') {
                this.drawHeart(pos.x, pos.y, this.size * 2, this.angle);
            }
            ctx.fillStyle = this.color;
            ctx.fill();
            ctx.restore();
        }

        // 绘制当前位置
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.beginPath();
        if (this.shape === 'circle') {
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        } else if (this.shape === 'star') {
            this.drawStar(this.x, this.y, this.size * 2, this.angle);
        } else if (this.shape === 'heart') {
            this.drawHeart(this.x, this.y, this.size * 2, this.angle);
        }
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.restore();
    }

    update() {
        this.angle += this.spinSpeed;
        
        // 特殊效果的运动更新
        if (this.type === FIREWORK_TYPES.SPIRAL) {
            this.spiralAngle += this.spiralSpeed;
            this.x += Math.cos(this.spiralAngle) * this.spiralRadius * 0.1;
            this.y += Math.sin(this.spiralAngle) * this.spiralRadius * 0.1;
            this.spiralRadius *= 0.99; // 逐渐减小半径
        } else {
            this.x += this.velocity.x;
            this.y += this.velocity.y;
        }

        // 添加当前位置到尾迹
        this.trail.push({x: this.x, y: this.y});
        if (this.trail.length > this.maxTrailLength) {
            this.trail.shift();
        }

        this.velocity.y += 0.04; // 降低重力
        this.alpha -= this.decay;

        // 特殊类型的额外更新
        if (this.type === FIREWORK_TYPES.RING) {
            this.velocity.x *= 0.98;
            this.velocity.y *= 0.98;
        }
    }

    drawStar(x, y, size, angle) {
        const spikes = 5;
        const rotation = angle;
        let step = Math.PI / spikes;

        ctx.beginPath();
        for (let i = 0; i < spikes * 2; i++) {
            const radius = i % 2 === 0 ? size : size / 2;
            const currentAngle = i * step + rotation;
            if (i === 0) {
                ctx.moveTo(x + radius * Math.cos(currentAngle), y + radius * Math.sin(currentAngle));
            } else {
                ctx.lineTo(x + radius * Math.cos(currentAngle), y + radius * Math.sin(currentAngle));
            }
        }
        ctx.closePath();
    }

    drawHeart(x, y, size, angle) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.translate(-x, -y);

        ctx.beginPath();
        const topCurveHeight = size * 0.3;
        ctx.moveTo(x, y + topCurveHeight);
        ctx.bezierCurveTo(
            x, y, 
            x - size, y, 
            x - size, y + topCurveHeight
        );
        ctx.bezierCurveTo(
            x - size, y + (size + topCurveHeight) / 2, 
            x, y + size, 
            x, y + size
        );
        ctx.bezierCurveTo(
            x, y + size, 
            x + size, y + (size + topCurveHeight) / 2, 
            x + size, y + topCurveHeight
        );
        ctx.bezierCurveTo(
            x + size, y, 
            x, y, 
            x, y + topCurveHeight
        );
        ctx.closePath();
        ctx.restore();
    }
}

// 创建烟花
class Firework {
    constructor(x, y, targetX, targetY, color, type = FIREWORK_TYPES.NORMAL) {
        this.x = x;
        this.y = y;
        this.targetX = targetX;
        this.targetY = targetY;
        this.color = color;
        this.type = type;
        this.particles = [];
        this.speed = 8;
        this.angle = Math.atan2(targetY - y, targetX - x);
        this.velocity = {
            x: Math.cos(this.angle) * this.speed,
            y: Math.sin(this.angle) * this.speed
        };
        this.trail = [];
        this.maxTrailLength = 15;
        this.glowRadius = 8;
        this.hasExploded = false;
    }

    draw() {
        // 绘制光芒效果
        ctx.save();
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = createGlow(ctx, this.x, this.y, this.glowRadius, this.color);
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.glowRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // 绘制尾迹
        for (let i = 0; i < this.trail.length; i++) {
            const pos = this.trail[i];
            ctx.save();
            ctx.globalAlpha = i / this.trail.length * 0.4;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, 2, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
            ctx.restore();
        }

        ctx.beginPath();
        ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
    }

    update() {
        // 添加当前位置到尾迹
        this.trail.push({x: this.x, y: this.y});
        if (this.trail.length > this.maxTrailLength) {
            this.trail.shift();
        }

        this.x += this.velocity.x;
        this.y += this.velocity.y;
    }

    explode() {
        createExplosionSound(this.type === FIREWORK_TYPES.DOUBLE ? 200 : 150);
        
        const shapes = ['circle', 'star', 'heart'];
        const shape = shapes[Math.floor(Math.random() * shapes.length)];
        let particleCount = Math.floor(Math.random() * 50) + 100;

        // 创建爆炸闪光
        ctx.save();
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = createGlow(ctx, this.x, this.y, 80, '#ffffff');
        ctx.beginPath();
        ctx.arc(this.x, this.y, 80, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // 根据烟花类型创建不同的爆炸效果
        switch(this.type) {
            case FIREWORK_TYPES.RING:
                this.createRingExplosion(shape);
                break;
            case FIREWORK_TYPES.SPIRAL:
                this.createSpiralExplosion();
                break;
            case FIREWORK_TYPES.DOUBLE:
                this.createDoubleExplosion(shape);
                break;
            case FIREWORK_TYPES.RANDOM:
                const types = Object.values(FIREWORK_TYPES);
                const randomType = types[Math.floor(Math.random() * types.length)];
                this.type = randomType;
                this.explode();
                break;
            default:
                for (let i = 0; i < particleCount; i++) {
                    particles.push(new Particle(this.x, this.y, this.color, shape, this.type));
                }
        }
    }

    createRingExplosion(shape) {
        const particleCount = 180;
        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2;
            const particle = new Particle(this.x, this.y, this.color, shape, FIREWORK_TYPES.RING);
            particle.velocity.x = Math.cos(angle) * 8;
            particle.velocity.y = Math.sin(angle) * 8;
            particles.push(particle);
        }
    }

    createSpiralExplosion() {
        const particleCount = 100;
        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle(this.x, this.y, this.color, 'circle', FIREWORK_TYPES.SPIRAL));
        }
    }

    createDoubleExplosion(shape) {
        // 内圈
        for (let i = 0; i < 50; i++) {
            const particle = new Particle(this.x, this.y, this.color, shape, FIREWORK_TYPES.NORMAL);
            particle.velocity.x *= 0.5;
            particle.velocity.y *= 0.5;
            particles.push(particle);
        }
        // 外圈
        for (let i = 0; i < 100; i++) {
            particles.push(new Particle(this.x, this.y, this.color, shape, FIREWORK_TYPES.NORMAL));
        }
    }
}

// 管理所有烟花
const fireworks = [];
const particles = [];
const colors = [
    '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff',
    '#ff8800', '#ff0088', '#88ff00', '#00ff88', '#0088ff', '#8800ff',
    '#ffffff', '#ffd700', '#ff1493', '#00fa9a', '#ff69b4', '#4169e1'
];

// 随机创建烟花
function createFirework() {
    const x = Math.random() * canvas.width;
    const y = canvas.height;
    const targetX = Math.random() * canvas.width;
    const targetY = canvas.height * 0.2 + Math.random() * (canvas.height * 0.5);
    const color = colors[Math.floor(Math.random() * colors.length)];
    const types = Object.values(FIREWORK_TYPES);
    const type = types[Math.floor(Math.random() * types.length)];
    fireworks.push(new Firework(x, y, targetX, targetY, color, type));
}

// 点击创建烟花
canvas.addEventListener('click', (e) => {
    const x = Math.random() * canvas.width;
    const y = canvas.height;
    const color = colors[Math.floor(Math.random() * colors.length)];
    const types = Object.values(FIREWORK_TYPES);
    const type = types[Math.floor(Math.random() * types.length)];
    fireworks.push(new Firework(x, y, e.clientX, e.clientY, color, type));
});

// 动画循环
function animate() {
    requestAnimationFrame(animate);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 随机创建新烟花
    if (Math.random() < 0.05) {
        createFirework();
    }

    // 更新和绘制烟花
    for (let i = fireworks.length - 1; i >= 0; i--) {
        const firework = fireworks[i];
        firework.draw();
        firework.update();

        const distance = Math.hypot(
            firework.targetX - firework.x,
            firework.targetY - firework.y
        );

        if (distance < 15 && !firework.hasExploded) {
            firework.hasExploded = true;
            firework.explode();
            fireworks.splice(i, 1);
            continue;
        }
    }

    // 更新和绘制粒子
    for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];
        particle.draw();
        particle.update();

        if (particle.alpha <= 0) {
            particles.splice(i, 1);
        }
    }
}

animate(); 