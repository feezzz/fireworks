const canvas = document.getElementById('fireworks');
const ctx = canvas.getContext('2d');

// 创建音频上下文
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

// 创建爆炸声音
function createExplosionSound() {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(150, audioContext.currentTime);
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

// 烟花粒子类
class Particle {
    constructor(x, y, color, shape = 'circle') {
        this.x = x;
        this.y = y;
        this.color = color;
        this.shape = shape;
        this.velocity = {
            x: (Math.random() - 0.5) * 8,
            y: (Math.random() - 0.5) * 8
        };
        this.alpha = 1;
        this.decay = Math.random() * 0.008 + 0.008; // 降低衰减速度
        this.size = Math.random() * 4 + 2;
        this.trail = [];
        this.maxTrailLength = 5;
        this.angle = Math.random() * Math.PI * 2;
        this.spinSpeed = (Math.random() - 0.5) * 0.2;
        this.glowRadius = this.size * 6;
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
        // 左曲线
        ctx.bezierCurveTo(
            x, y, 
            x - size, y, 
            x - size, y + topCurveHeight
        );
        // 左底部
        ctx.bezierCurveTo(
            x - size, y + (size + topCurveHeight) / 2, 
            x, y + size, 
            x, y + size
        );
        // 右底部
        ctx.bezierCurveTo(
            x, y + size, 
            x + size, y + (size + topCurveHeight) / 2, 
            x + size, y + topCurveHeight
        );
        // 右曲线
        ctx.bezierCurveTo(
            x + size, y, 
            x, y, 
            x, y + topCurveHeight
        );
        ctx.closePath();
        ctx.restore();
    }

    update() {
        this.angle += this.spinSpeed;
        
        // 添加当前位置到尾迹
        this.trail.push({x: this.x, y: this.y});
        if (this.trail.length > this.maxTrailLength) {
            this.trail.shift();
        }

        this.velocity.y += 0.05; // 降低重力
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.alpha -= this.decay;
    }
}

// 创建烟花
class Firework {
    constructor(x, y, targetX, targetY, color) {
        this.x = x;
        this.y = y;
        this.targetX = targetX;
        this.targetY = targetY;
        this.color = color;
        this.particles = [];
        this.speed = 8; // 降低发射速度
        this.angle = Math.atan2(targetY - y, targetX - x);
        this.velocity = {
            x: Math.cos(this.angle) * this.speed,
            y: Math.sin(this.angle) * this.speed
        };
        this.trail = [];
        this.maxTrailLength = 15; // 增加尾迹长度
        this.glowRadius = 8;
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
        createExplosionSound();
        
        const shapes = ['circle', 'star', 'heart'];
        const shape = shapes[Math.floor(Math.random() * shapes.length)];
        const particleCount = Math.floor(Math.random() * 50) + 100;

        // 创建爆炸闪光
        ctx.save();
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = createGlow(ctx, this.x, this.y, 80, '#ffffff');
        ctx.beginPath();
        ctx.arc(this.x, this.y, 80, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle(this.x, this.y, this.color, shape));
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
    const targetY = canvas.height * 0.2 + Math.random() * (canvas.height * 0.5); // 调整爆炸高度范围
    const color = colors[Math.floor(Math.random() * colors.length)];
    fireworks.push(new Firework(x, y, targetX, targetY, color));
}

// 点击创建烟花
canvas.addEventListener('click', (e) => {
    const x = Math.random() * canvas.width;
    const y = canvas.height;
    const color = colors[Math.floor(Math.random() * colors.length)];
    fireworks.push(new Firework(x, y, e.clientX, e.clientY, color));
});

// 动画循环
function animate() {
    requestAnimationFrame(animate);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)'; // 增加拖尾效果
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 随机创建新烟花
    if (Math.random() < 0.05) { // 降低发射频率
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

        if (distance < 15) {
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