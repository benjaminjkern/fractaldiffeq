import WebGLShaderRenderer from "./webgl.js";

const _root = {
    numDots: 10,
};

window.onload = async () => {
    _root.canvas = document.getElementById("canvas");

    _root.canvas.width = window.innerWidth;
    _root.canvas.height = window.innerHeight;
    _root.screenSize = [_root.canvas.width, _root.canvas.height];

    _root.dots = Array(_root.numDots)
        .fill()
        .map(() => randomDot());

    // restart();
    let renderer = new WebGLShaderRenderer("canvas", _root.screenSize);
    renderer.programInfo.uniforms = ["screenSize", "dots", "colors", "numDots"];
    await renderer.setShader("./vertex.glsl", "./fragment.glsl");

    console.log(_root.dots.map((dot) => dot.color)[0]);

    // let fps = document.getElementById("fps");
    renderer.callback = (gl, shaderProgram) => {
        gl.uniform2fv(shaderProgram.uniforms.screenSize, _root.screenSize);
        gl.uniform2fv(
            shaderProgram.uniforms.dots,
            _root.dots.flatMap((dot) => dot.pos)
        );
        gl.uniform4fv(
            shaderProgram.uniforms.colors,
            _root.dots.flatMap((dot) => dot.color)
        );
        gl.uniform1f(shaderProgram.uniforms.screenSize, _root.numDots);
        // fps.innerHTML = `dt: ${Math.round(renderer.dt)}ms fps: ${Math.round(
        //     1000 / renderer.dt
        // )}`;
    };
    renderer.start();
};

const restart = () => {
    constants();
    init();

    draw();
    const loop = () => {
        calc();
        window.requestAnimationFrame(loop);
    };
    loop();
};

const randomColor = () => {
    // return multVec(256, hsv2rgb(Math.random() * 360, 1, 1));
    return Array(3)
        .fill()
        .map(() => Math.random());
};

const randomDot = () => ({
    color: [...randomColor(), 1],
    pos: elemMultVec(_root.screenSize, randVec(2)),
});

const constants = () => {
    // _root.dots = [
    //     {
    //         color: [255, 0, 0],
    //         pos: elemMultVec(_root.screenSize, [0.5, 0.25]),
    //     },

    //     {
    //         color: [0, 255, 0],
    //         pos: elemMultVec(_root.screenSize, [0.25, 0.5]),
    //     },

    //     {
    //         color: [0, 0, 255],
    //         pos: elemMultVec(_root.screenSize, [0.5, 0.75]),
    //     },

    //     {
    //         color: [255, 255, 0],
    //         pos: elemMultVec(_root.screenSize, [0.75, 0.5]),
    //     },
    // ];
    _root.dots = [
        randomDot(),
        randomDot(),
        randomDot(),
        randomDot(),
        randomDot(),
        randomDot(),
        randomDot(),
        randomDot(),
        randomDot(),
        randomDot(),
    ];
    _root.resolution = [1, 1];
    _root.gridSize = [
        Math.floor(_root.screenSize[0] / _root.resolution[0]),
        Math.floor(_root.screenSize[1] / _root.resolution[1]),
    ];

    _root.dt = 1;
    _root.particleMass = 1;
    _root.dotMass = 1;
    _root.dotRadius = 0;
    _root.savedColors = [];
    _root.particles = [];
    _root.grid = Array(_root.gridSize[1])
        .fill()
        .map((_, j) =>
            Array(_root.gridSize[0])
                .fill()
                .map((_, i) => {
                    _root.particles.push({
                        g: [i, j],
                        p: [i * _root.resolution[0], j * _root.resolution[1]],
                        sp: [i * _root.resolution[0], j * _root.resolution[1]],
                        v: [0, 0],
                        steps: 0,
                    });
                })
        );
    scramble(_root.particles);
    _root.maxSteps = 1;
    _root.nextParticles = [];
};

const scramble = (list) => {
    for (let i = 0; i < list.length; i++) {
        const r = Math.floor(Math.random() * list.length);
        [list[i], list[r]] = [list[r], list[i]];
    }
};

const init = () => {};

const a = [0, 0];
const diff = [0, 0];
const aVec = [0, 0];
const p = [0, 0];

const calc = () => {
    const imageData = _root.ctx.getImageData(
        0,
        0,
        _root.canvas.width,
        _root.canvas.height
    );
    for (let i = 0; i < 1000000; i++) {
        if (!_root.particle) {
            if (!_root.particles.length) {
                if (!_root.nextParticles.length) {
                    console.log("DONE");
                    return;
                }
                _root.particles = _root.nextParticles;
                _root.nextParticles = [];
                _root.maxSteps++;
            }
            _root.particle = _root.particles.pop();
        }

        const particle = _root.particle;

        if (particle.steps >= _root.maxSteps) {
            _root.nextParticles.push(particle);
            _root.particle = undefined;
            continue;
        }

        particle.steps++;

        p[0] = particle.p[0];
        p[1] = particle.p[1];
        addVecInPlace(particle.p, particle.v);

        let [closestColor, closestDist] = [undefined, Number.MAX_VALUE];

        for (let d = 0; d < _root.dots.length; d++) {
            const dot = _root.dots[d];

            setSubVec(diff, dot.pos, p);
            const distSquared = lengthSquared(diff);
            if (distSquared < closestDist) {
                closestColor = dot.color;
                closestDist = distSquared;
            }
            if (distSquared <= _root.dotRadius ** 2) {
                _root.particle = undefined;
                break;
            }
            // const dist = Math.sqrt(distSquared);
            setMultVec(aVec, _root.dotMass / distSquared, diff);
            addVecInPlace(particle.v, aVec);
        }

        const k = 4 * (particle.g[0] + _root.canvas.width * particle.g[1]);
        for (let z = 0; z < 3; z++) {
            imageData.data[k + z] =
                closestColor[z] *
                // Math.exp((-1 * Math.log2(particle.steps)) / 8);
                1;
        }
        imageData.data[k + 3] = 255;
    }

    _root.ctx.putImageData(imageData, 0, 0);
};

const draw = () => {
    _root.ctx.fillStyle = "black";
    _root.ctx.fillRect(0, 0, ..._root.screenSize);
    // for (const dot of _root.dots) {
    // }
};

/****
 * MATH
 */

/**
 *
 * COMPLEX
 */

const setSubVec = (target, a, b) => {
    for (let i = 0; i < target.length; i++) {
        target[i] = a[i] - b[i];
    }
};
const setMultVec = (target, a, b) => {
    for (let i = 0; i < target.length; i++) {
        target[i] = a * b[i];
    }
};

const compMult = ([a, b], [c, d]) => [a * c - b * d, a * d + b * c];

const compAdd = (...a) => addVec(...a);

const dot = (a, b) => fastReduce(a, (p, x, i) => p + x * b[i], 0);

const lengthSquared = (v) => dot(v, v);
const length = (v) => Math.sqrt(dot(v, v));

const cross = ([ax, ay, az], [bx, by, bz]) => [
    ay * bz - az * by,
    az * bx - ax * bz,
    ax * by - ay * bx,
];

const fastMap = (list, func) => {
    const returnList = [];
    for (let i = 0; i < list.length; i++) {
        returnList.push(func(list[i], i));
    }
    return returnList;
};
const fastReduce = (list, func, startValue = list[0]) => {
    let value = startValue;

    for (let i = 0; i < list.length; i++) {
        value = func(value, list[i], i);
    }
    return value;
};

const elemMultVec = (a, ...rest) => {
    if (rest.length === 0) return a;
    const restSum = elemMultVec(...rest);
    return a.map((x, i) => x * restSum[i]);
};
const multVec = (a, v) => fastMap(v, (x) => x * a);
const subVec = (a, b) => fastMap(a, (x, i) => x - b[i]);
const addVec = (a, ...rest) => {
    if (rest.length === 0) return a;
    const restSum = addVec(...rest);
    return a.map((x, i) => x + restSum[i]);
};

const addVecInPlace = (a, b) => {
    for (let i = 0; i < a.length; i++) {
        a[i] = a[i] + b[i];
    }
};

const randVec = (length) =>
    Array(length)
        .fill()
        .map(() => Math.random());

const matMult = (matrix, vector) => {
    return matrix.map((row) => dot(row, vector));
};

const makeUnitVec = (vector) => {
    const length = Math.sqrt(dot(vector, vector));
    return vector.map((a) => a / length);
};

const makeRotationMatrix = (u, theta) => {
    const sin = Math.sin(theta);
    const cos = Math.cos(theta);
    return [
        [
            cos + u[0] * u[0] * (1 - cos),
            u[0] * u[1] * (1 - cos) - u[2] * sin,
            u[0] * u[2] * (1 - cos) + u[1] * sin,
        ],
        [
            u[0] * u[1] * (1 - cos) + u[2] * sin,
            cos + u[1] * u[1] * (1 - cos),
            u[1] * u[2] * (1 - cos) - u[0] * sin,
        ],
        [
            u[0] * u[2] * (1 - cos) - u[1] * sin,
            u[1] * u[2] * (1 - cos) + u[0] * sin,
            cos + u[2] * u[2] * (1 - cos),
        ],
    ];
};

// From stack overflow https://stackoverflow.com/questions/17242144/javascript-convert-hsb-hsv-color-to-rgb-accurately
function hsv2rgb(h, s, v) {
    let f = (n, k = (n + h / 60) % 6) =>
        v - v * s * Math.max(Math.min(k, 4 - k, 1), 0);
    return [f(5), f(3), f(1)];
}
