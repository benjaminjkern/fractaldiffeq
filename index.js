import WebGLShaderRenderer from "./webgl.js";

const _root = {
    keysdown: {},
    speed: 0.1,
};

window.onload = async () => {
    const canvas = document.getElementById("canvas");
    canvas.addEventListener("click", () => {
        canvas.requestPointerLock();
    });

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";

    _root.renderer = new WebGLShaderRenderer("canvas", [
        window.innerWidth,
        window.innerHeight,
    ]);
    _root.renderer.programInfo.uniforms = [
        "screenSize",
        "spheres",
        "radii",
        "colors",
        "camPos",
        "camZ",
    ];
    await _root.renderer.setShader("./vertex.glsl", "./fragment.glsl");

    _root.renderer.callback = (gl, shaderProgram) => {
        update();
        sendUniforms(gl, shaderProgram);
    };
    init();
    _root.renderer.start();
};

const sendUniforms = (gl, shaderProgram) => {
    gl.uniform2fv(shaderProgram.uniforms.screenSize, _root.renderer.resolution);
    gl.uniform3fv(
        shaderProgram.uniforms.spheres,
        _root.spheres.flatMap((sphere) => sphere.pos)
    );
    gl.uniform1fv(
        shaderProgram.uniforms.radii,
        _root.spheres.flatMap((sphere) => sphere.radius)
    );
    gl.uniform3fv(
        shaderProgram.uniforms.colors,
        _root.spheres.flatMap((sphere) => sphere.color)
    );
    gl.uniform3f(shaderProgram.uniforms.camPos, ..._root.camPos);
    gl.uniform3f(shaderProgram.uniforms.camZ, ..._root.camZ);
};

const init = () => {
    _root.spheres = Array(100).fill().map(randomSphere);
    _root.spheres;
    _root.camPos = [20, 0, 20];
    _root.camZ = normalizeVec([-1, 0, -0.5]);
};

const checkAllSpheresCollisions = () => {
    for (const sphere of _root.spheres) {
        sphere.t = 0;
        sphere.checked = false;
    }

    const potentialCollisions = [];

    let loops = 500;

    while (loops > 0) {
        loops--;
        for (const sphere of _root.spheres) {
            if (sphere.checked) continue;

            // Check plane
            const t =
                (sphere.radius - sphere.pos[2] - sphere.t * sphere.v[2]) /
                sphere.v[2];
            if (t >= 0 && t < 1) {
                potentialCollisions.push({
                    t,
                    spheres: [sphere],
                    impulses: [[0, 0, -2 * sphere.v[2] * sphere.mass]],
                });
            }
        }
        for (let s = 0; s < _root.spheres.length; s++) {
            const sphere1 = _root.spheres[s];

            for (let p = s + 1; p < _root.spheres.length; p++) {
                const sphere2 = _root.spheres[p];
                if (sphere2.checked && sphere1.checked) continue;

                const dv = subVec(sphere1.v, sphere2.v);
                const dx = subVec(
                    addVec(sphere1.pos, constMultVec(-sphere1.t, sphere1.v)),
                    addVec(sphere2.pos, constMultVec(-sphere2.t, sphere2.v))
                );

                const a = dotVec(dv, dv);
                const b = 2 * dotVec(dv, dx);
                const c =
                    dotVec(dx, dx) - (sphere1.radius + sphere2.radius) ** 2;
                const disc = b * b - 4 * a * c;

                if (disc < 0) continue;
                const t = (-b - Math.sqrt(disc)) / 2 / a;
                if (t < 0 || t >= 1) continue;

                const norm = normalizeVec(
                    subVec(
                        addVec(
                            sphere1.pos,
                            constMultVec(t - sphere1.t, sphere1.v)
                        ),
                        addVec(
                            sphere2.pos,
                            constMultVec(t - sphere2.t, sphere2.v)
                        )
                    )
                );

                const v1Norm = dotVec(sphere1.v, norm);
                const v2Norm = dotVec(sphere2.v, norm);
                const impulse =
                    ((2 * sphere1.mass * sphere2.mass) /
                        (sphere1.mass + sphere2.mass)) *
                    (v1Norm - v2Norm);

                potentialCollisions.push({
                    t,
                    spheres: [sphere1, sphere2],
                    impulses: [
                        constMultVec(-impulse, norm),
                        constMultVec(impulse, norm),
                    ],
                });
            }
        }
        for (const sphere of _root.spheres) {
            sphere.checked = true;
        }
        if (!potentialCollisions.length) break;

        potentialCollisions.sort((a, b) => b.t - a.t);
        const firstPotentialCollision = potentialCollisions.pop();
        for (const [i, sphere] of firstPotentialCollision.spheres.entries()) {
            if (i > 0) console.log("Ball collision!");

            sphere.pos = addVec(
                sphere.pos,
                constMultVec(firstPotentialCollision.t, sphere.v)
            );
            sphere.v = addVec(
                sphere.v,
                constMultVec(
                    1 / sphere.mass,
                    firstPotentialCollision.impulses[i]
                )
            );
            sphere.t = firstPotentialCollision.t;
            sphere.checked = false;
        }
    }

    for (const sphere of _root.spheres) {
        sphere.pos = addVec(sphere.pos, constMultVec(1 - sphere.t, sphere.v));
    }
};

const update = () => {
    for (const sphere of _root.spheres) {
        // gravity
        sphere.v = addVec(sphere.v, [0, 0, -0.001]);
    }
    checkAllSpheresCollisions();

    const camX = normalizeVec(crossVec(_root.camZ, [0, 0, 1]));
    const camLateral = crossVec([0, 0, 1], camX);
    if (_root.keysdown.w)
        _root.camPos = addVec(
            _root.camPos,
            constMultVec(_root.speed, camLateral)
        );
    if (_root.keysdown.s)
        _root.camPos = addVec(
            _root.camPos,
            constMultVec(-_root.speed, camLateral)
        );
    if (_root.keysdown.a)
        _root.camPos = addVec(_root.camPos, constMultVec(-_root.speed, camX));
    if (_root.keysdown.d)
        _root.camPos = addVec(_root.camPos, constMultVec(_root.speed, camX));

    if (_root.keysdown[" "])
        _root.camPos = addVec(
            _root.camPos,
            constMultVec(_root.speed, [0, 0, 1])
        );
    if (_root.keysdown.shift)
        _root.camPos = addVec(
            _root.camPos,
            constMultVec(-_root.speed, [0, 0, 1])
        );
};
const updatePosition = (event) => {
    const movementX =
        event.movementX || event.mozMovementX || event.webkitMovementX || 0;
    const movementY =
        event.movementY || event.mozMovementY || event.webkitMovementY || 0;

    const camX = normalizeVec(crossVec(_root.camZ, [0, 0, 1]));
    const camY = crossVec(camX, _root.camZ);
    _root.camZ = normalizeVec(
        addVec(
            _root.camZ,
            constMultVec(movementX / 1000, camX),
            constMultVec(-movementY / 1000, camY)
        )
    );
};

const lockChangeAlert = () => {
    if (document.pointerLockElement === canvas) {
        document.addEventListener("mousemove", updatePosition, false);
    } else {
        document.removeEventListener("mousemove", updatePosition, false);
    }
};

document.addEventListener("pointerlockchange", lockChangeAlert, false);

const randomSphere = () => {
    const radius = Math.random() * 1 + 0.5;
    return {
        pos: addVec(
            Array(3)
                .fill()
                .map(() => (Math.random() * 2 - 1) * 10),
            [0, 0, 15]
        ),
        v: Array(3)
            .fill()
            .map(() => (Math.random() * 2 - 1) * 0.01),
        radius,
        mass: 0.1 * radius ** 3,
        color: randomColor(),
    };
};

window.onkeydown = (e) => {
    if (["a", "s", "d", "w", " ", "shift"].includes(e.key.toLowerCase()))
        _root.keysdown[e.key.toLowerCase()] = true;
};
window.onkeyup = (e) => {
    if (["a", "s", "d", "w", " ", "shift"].includes(e.key.toLowerCase()))
        _root.keysdown[e.key.toLowerCase()] = false;
};

/****
 * MATH
 */

/**
 *
 * COMPLEX
 */

const randomColor = () => {
    // return multVec(256, hsv2rgb(Math.random() * 360, 1, 1));
    return Array(3)
        .fill()
        .map(() => Math.random());
};

const dotVec = (x, y) => {
    return x.reduce((p, c, i) => p + c * y[i], 0);
};

const crossVec = (x, y) => {
    return [
        x[1] * y[2] - x[2] * y[1],
        x[2] * y[0] - x[0] * y[2],
        x[0] * y[1] - x[1] * y[0],
    ];
};

const normalizeVec = (x) => {
    return constMultVec(1 / Math.sqrt(dotVec(x, x)), x);
};

const constMultVec = (a, v) => {
    return v.map((x, i) => x * a);
};

const elemMultVec = (a, ...rest) => {
    if (rest.length === 0) return a;
    const restSum = elemMultVec(...rest);
    return a.map((x, i) => x * restSum[i]);
};
const addVec = (a, ...rest) => {
    if (rest.length === 0) return a;
    const restSum = addVec(...rest);
    return a.map((x, i) => x + restSum[i]);
};

const subVec = (a, b) => {
    return a.map((x, i) => x - b[i]);
};

const randVec = (length) =>
    Array(length)
        .fill()
        .map(() => Math.random());
