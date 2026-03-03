const canvasEl = document.querySelector('#canvas');
const cleanBtn = document.querySelector('#cleanBtn');
const autoBtn = document.querySelector('#autoBtn');
const nameEl = document.querySelector('.name');
const headerEl = document.querySelector('.header');

let isClean = true, isAutoBloom = false, autoBloomInterval = null;
const pointer = { x: 0.66, y: 0.3, clicked: true, vanishCanvas: false };

let renderer = new THREE.WebGLRenderer({ canvas: canvasEl, alpha: true, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

let sceneShader = new THREE.Scene(), sceneBasic = new THREE.Scene();
let camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 10), clock = new THREE.Clock();

let renderTargets = [
    new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight),
    new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight),
];

let shaderMaterial, basicMaterial;
createPlane();
updateSize();

window.addEventListener('resize', updateSize);

function updateSize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    renderer.setSize(width, height);
    // CRITICAL FIX: Resize render targets so drawing isn't cut off
    renderTargets[0].setSize(width * renderer.getPixelRatio(), height * renderer.getPixelRatio());
    renderTargets[1].setSize(width * renderer.getPixelRatio(), height * renderer.getPixelRatio());
    
    if (shaderMaterial) shaderMaterial.uniforms.u_ratio.value = width / height;
}

function handleInteraction() {
    if (isClean) {
        nameEl.classList.add('fade-out');
        headerEl.classList.add('fade-out');
        isClean = false;
    }
}

window.addEventListener('click', e => {
    if (e.target.closest('button')) return;
    handleInteraction();
    pointer.x = e.pageX / window.innerWidth;
    pointer.y = e.pageY / window.innerHeight;
    pointer.clicked = true;
});

window.addEventListener('touchstart', e => {
    if (e.target.closest('button')) return;
    handleInteraction();
    pointer.x = e.targetTouches[0].pageX / window.innerWidth;
    pointer.y = e.targetTouches[0].pageY / window.innerHeight;
    pointer.clicked = true;
});

cleanBtn.addEventListener('click', () => {
    pointer.vanishCanvas = true;
    setTimeout(() => { pointer.vanishCanvas = false; isClean = true; nameEl.classList.remove('fade-out'); headerEl.classList.remove('fade-out'); }, 50);
});

autoBtn.addEventListener('click', () => {
    isAutoBloom = !isAutoBloom;
    autoBtn.classList.toggle('active');
    if (isAutoBloom) {
        handleInteraction();
        autoBloomInterval = setInterval(() => {
            pointer.x = Math.random(); pointer.y = Math.random(); pointer.clicked = true;
        }, 400);
    } else {
        clearInterval(autoBloomInterval);
    }
});

function createPlane() {
    shaderMaterial = new THREE.ShaderMaterial({
        uniforms: {
            u_stop_time: { value: 0 },
            u_stop_randomizer: { value: new THREE.Vector2(Math.random(), Math.random()) },
            u_cursor: { value: new THREE.Vector2(pointer.x, pointer.y) },
            u_ratio: { value: window.innerWidth / window.innerHeight },
            u_texture: { value: null },
            u_clean: { value: 1 },
            u_theme: { value: 0.0 }
        },
        vertexShader: document.getElementById('vertexShader').textContent,
        fragmentShader: document.getElementById('fragmentShader').textContent,
        transparent: true
    });
    basicMaterial = new THREE.MeshBasicMaterial();
    const planeGeometry = new THREE.PlaneGeometry(2, 2);
    sceneBasic.add(new THREE.Mesh(planeGeometry, basicMaterial));
    sceneShader.add(new THREE.Mesh(planeGeometry, shaderMaterial));
}

function render() {
    shaderMaterial.uniforms.u_clean.value = pointer.vanishCanvas ? 0 : 1;
    shaderMaterial.uniforms.u_texture.value = renderTargets[0].texture;

    if (pointer.clicked) {
        shaderMaterial.uniforms.u_cursor.value.set(pointer.x, 1 - pointer.y);
        shaderMaterial.uniforms.u_stop_randomizer.value.set(Math.random(), Math.random());
        shaderMaterial.uniforms.u_stop_time.value = 0;
        pointer.clicked = false;
    }
    shaderMaterial.uniforms.u_stop_time.value += clock.getDelta();

    renderer.setRenderTarget(renderTargets[1]);
    renderer.render(sceneShader, camera);
    basicMaterial.map = renderTargets[1].texture;
    renderer.setRenderTarget(null);
    renderer.render(sceneBasic, camera);

    let tmp = renderTargets[0];
    renderTargets[0] = renderTargets[1];
    renderTargets[1] = tmp;

    requestAnimationFrame(render);
}
render();
