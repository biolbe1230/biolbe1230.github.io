// ==================== 雪花动画完整脚本 ====================

const fps = 120;
const mspf = Math.floor(1000 / fps);

let width = window.innerWidth || document.documentElement.clientWidth;
let height = window.innerHeight || document.documentElement.clientHeight;
let canvas;
let y_min; // Y轴上边界，将动态计算
let y_max; // Y轴下边界，将动态计算

let particles = [];
let wind = [0, 0];
let cursor = [0, 0];


// ==================== 动态边界计算逻辑 (核心部分) ====================

// 使用你找到的class来定义选择器
const permanentNavSelector = '.md-header';      // 这是滚动时不变的
const collapsibleNavSelector = '.md-tabs';      // 这是滚动时会收起的

const permanentNav = document.querySelector(permanentNavSelector);
const collapsibleNav = document.querySelector(collapsibleNavSelector);

function updateSnowBoundary() {
    // 动态获取导航栏的实际高度
    const permanentNavHeight = permanentNav ? permanentNav.offsetHeight : 0;
    const collapsibleNavHeight = collapsibleNav ? collapsibleNav.offsetHeight : 0;

    // 判断页面是否已向下滚动
    if (window.scrollY > 0) {
        // 如果页面已滚动，可收起的导航栏已消失（或正在消失）
        // 雪花从永久导航栏的下方开始
        y_max = permanentNavHeight - 5;
    } else {
        // 如果页面在最顶部，两个导航栏都在
        // 雪花从两个导航栏的总高度下方开始
        y_max = permanentNavHeight + collapsibleNavHeight;
    }

    // 更新 y_max (让雪花总是在导航栏下方100px的区域内飘动)
    // 你可以随意修改 100 这个值来调整雪花飘动的区域大小
    y_min = y_max - 100;
}


// ==================== 事件监听器 ====================

// 监听滚动事件，实时更新边界
window.addEventListener('scroll', updateSnowBoundary);

// 监听窗口大小变化事件，实时更新边界
window.addEventListener('resize', () => {
    width = window.innerWidth || document.documentElement.clientWidth;
    height = window.innerHeight || document.documentElement.clientHeight;
    
    updateSnowBoundary(); // 窗口大小变化时也更新一下边界

    if (canvas) {
        canvas.width = width;
        canvas.height = height;
    }
});

// 页面加载时立即执行一次，设置初始值
updateSnowBoundary();


// ==================== 雪花动画其余函数 (无需修改) ====================

function velocity(r) {
    return 50 / r + 25;
}

function sine_component(h, a) {
    return [2 * Math.PI / h, Math.random() * a, Math.random() * 2 * Math.PI];
}

function calc_sine(components, x) {
    let sum = 0;
    for (let i = 0; i < components.length; i++) {
        const [f, a, p] = components[i];
        sum += Math.sin(x * f + p) * a;
    }
    return sum;
}

function gen_particle() {
    let r = Math.random() * 4 + 1;
    return {
        radius: r,
        x: Math.random() * width,
        y: Math.random() * (y_max - y_min) + y_min,
        opacity: Math.random(),
        sine_components: [sine_component(height, 3), sine_component(height / 2, 2), sine_component(height / 5, 1), sine_component(height / 10, 0.5)],
    };
}

function update_pos(dt) {
    const n = particles.length;
    for (let i = 0; i < n; i++) {
        const v = velocity(particles[i].radius);
        particles[i].x += calc_sine(particles[i].sine_components, particles[i].y) * v / 5 * dt;
        particles[i].y += v * dt;

        if (particles[i].y - particles[i].radius > y_max) {
            particles[i].y = y_min - particles[i].radius;
            particles[i].x = Math.random() * width;
        }
    }
}

let context_cache;
function get_context() {
    if (context_cache)
        return context_cache;

    canvas = document.createElement('canvas');
    canvas.id = 'snow-canvas';
    canvas.width = width;
    canvas.height = height;
    canvas.style = 'position: fixed; top: 0; left: 0; overflow: hidden; pointer-events: none; z-index: 256;';
    if ((document.documentElement.dataset.darkreaderMode || "").startsWith('filter'))
        canvas.style.filter = 'invert(1)';
    document.body.appendChild(canvas);

    context_cache = canvas.getContext('2d');
    return context_cache;
}

function draw() {
    const ctx = get_context();
    ctx.clearRect(0, 0, width, height);
    const n = particles.length;
    for (let i = 0; i < n; i++) {
        const p = particles[i];
        ctx.fillStyle = `rgba(255, 250, 245, ${p.opacity})`;
        ctx.shadowColor = '#80EDF7';
        ctx.shadowBlur = 7;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, 2 * Math.PI);
        ctx.fill();
    }
}

let focused = true;
let disabled = false;
let lastTime = performance.now();
const requestFrame = () => setTimeout(loop, mspf);

function loop() {
    const dt = (performance.now() - lastTime) / 1000;

    if (particles.length < 30 && Math.random() < 0.1) {
        particles.push(gen_particle());
    }

    update_pos(dt);
    draw();

    lastTime = performance.now();
    if (focused && !disabled)
        requestFrame();
}

window.addEventListener('focus', () => {
    console.log('snow start');
    focused = true;
    lastTime = performance.now();
    requestFrame();
});

window.addEventListener('blur', () => {
    console.log('snow stop');
    focused = false;
});

window.addEventListener('keydown', e => {
    if (e.ctrlKey && e.key == 's') {
        e.preventDefault();
        disabled = !disabled;
        if (disabled) {
            canvas.style.display = 'none';
        } else {
            canvas.style.display = 'block';
            lastTime = performance.now();
            requestFrame();
        }
    }
});

requestFrame();