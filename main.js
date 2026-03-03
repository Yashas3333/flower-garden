const canvasEl = document.querySelector('#canvas');
const cleanBtn = document.querySelector('#cleanBtn'), autoBtn = document.querySelector('#autoBtn');
const nameBox = document.querySelector('#nameBox'), header = document.querySelector('#header');

let isClean = true, isAuto = false, autoInterval;
const pointer = { x: 0.5, y: 0.5, clicked: false, clean: 1.0 };

const renderer = new THREE.WebGLRenderer({ canvas: canvasEl, antialias: true, preserveDrawingBuffer: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

const sceneShader = new THREE.Scene(), sceneBasic = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), clock = new THREE.Clock();

let targets = [
    new THREE.WebGLRenderTarget(window.innerWidth * renderer.getPixelRatio(), window.innerHeight * renderer.getPixelRatio()),
    new THREE.WebGLRenderTarget(window.innerWidth * renderer.getPixelRatio(), window.innerHeight * renderer.getPixelRatio())
];

const shaderMat = new THREE.ShaderMaterial({
    uniforms: { 
        u_ratio: { value: window.innerWidth / window.innerHeight }, 
        u_cursor: { value: new THREE.Vector2(0.5, 0.5) }, 
        u_stop_time: { value: 0 }, 
        u_clean: { value: 1.0 }, 
        u_stop_randomizer: { value: new THREE.Vector2(0.5, 0.5) }, 
        u_texture: { value: null } 
    },
    vertexShader: document.getElementById('vertexShader').textContent,
    fragmentShader: document.getElementById('fragmentShader').textContent
});

sceneShader.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), shaderMat));
const basicMat = new THREE.MeshBasicMaterial();
sceneBasic.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), basicMat));

function handleInput(x, y) {
    if (isClean) { nameBox.classList.add('fade-out'); header.classList.add('fade-out'); isClean = false; }
    pointer.x = x / window.innerWidth; 
    pointer.y = 1 - (y / window.innerHeight); 
    pointer.clicked = true;
}

window.addEventListener('pointerdown', e => { 
    if(!e.target.closest('button')) handleInput(e.clientX, e.clientY); 
});

cleanBtn.onclick = () => { 
    pointer.clean = 0.0; 
    setTimeout(() => { 
        pointer.clean = 1.0; isClean = true; 
        nameBox.classList.remove('fade-out'); header.classList.remove('fade-out'); 
    }, 100); 
};

autoBtn.onclick = () => {
    isAuto = !isAuto; autoBtn.classList.toggle('active');
    if (isAuto) autoInterval = setInterval(() => handleInput(Math.random()*window.innerWidth, Math.random()*window.innerHeight), 600);
    else clearInterval(autoInterval);
};

function animate() {
    shaderMat.uniforms.u_clean.value = pointer.clean;
    shaderMat.uniforms.u_texture.value = targets[0].texture;
    if (pointer.clicked) {
        shaderMat.uniforms.u_cursor.value.set(pointer.x, pointer.y);
        shaderMat.uniforms.u_stop_randomizer.value.set(Math.random(), Math.random());
        shaderMat.uniforms.u_stop_time.value = 0;
        pointer.clicked = false;
    }
    shaderMat.uniforms.u_stop_time.value += clock.getDelta();
    renderer.setRenderTarget(targets[1]);
    renderer.render(sceneShader, camera);
    basicMat.map = targets[1].texture;
    renderer.setRenderTarget(null);
    renderer.render(sceneBasic, camera);
    let tmp = targets[0]; targets[0] = targets[1]; targets[1] = tmp;
    requestAnimationFrame(animate);
}
animate();

window.addEventListener('resize', () => {
    const w = window.innerWidth, h = window.innerHeight;
    const dpr = renderer.getPixelRatio();
    renderer.setSize(w, h);
    shaderMat.uniforms.u_ratio.value = w / h;
    targets[0].setSize(w * dpr, h * dpr); 
    targets[1].setSize(w * dpr, h * dpr);
});
