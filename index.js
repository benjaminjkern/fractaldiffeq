import WebGLShaderRenderer from "./webgl.js";

const _root = {
    numDots: 100,
    maximum: 1,
    minimum: 0,
    radiusScale: 1,
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
    renderer.programInfo.uniforms = [
        "screenSize",
        "dots",
        "colors",
        "numDots",
        "radii",
        "power",
        "backgroundColor",
        "maximum",
        "minimum",
    ];
    await renderer.setShader("./vertex.glsl", "./fragment.glsl");
    const controls = [
        attachController("minimum", 0, 1),
        attachController("maximum", 0, 1),
        attachController("radiusScale", 0, 5),
    ];

    // let fps = document.getElementById("fps");
    renderer.callback = (gl, shaderProgram) => {
        _root.dots.forEach((dot) => {
            dot.color.forEach((c, i) => {
                dot.color[i] = Math.max(0, Math.min(1, c + dot.dc[i]));
            });

            dot.pos.forEach((p, i) => {
                if (
                    p + dot.v[i] - dot.radius - _root.maximum < 0 ||
                    p + dot.v[i] + dot.radius + _root.maximum >
                        _root.screenSize[i]
                )
                    dot.v[i] = -dot.v[i];
                dot.pos[i] = p + dot.v[i];
            });
        });
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
        gl.uniform1fv(
            shaderProgram.uniforms.radii,
            _root.dots.flatMap((dot) => dot.radius * _root.radiusScale)
        );
        gl.uniform1f(shaderProgram.uniforms.power, 5);
        gl.uniform4f(shaderProgram.uniforms.backgroundColor, 0, 0, 0, 1);
        gl.uniform1f(shaderProgram.uniforms.maximum, _root.maximum);
        gl.uniform1f(shaderProgram.uniforms.minimum, _root.minimum);
        // fps.innerHTML = `dt: ${Math.round(renderer.dt)}ms fps: ${Math.round(
        //     1000 / renderer.dt
        // )}`;
    };
    renderer.start();
};

const attachController = (name, min, max) => {
    const controls = document.getElementsByClassName("controls")[0];
    const input = document.createElement("input");
    input.type = "range";
    input.min = min;
    input.max = max;
    input.step = 0.000000001;
    input.value = _root[name];
    input.oninput = (event) => (_root[name] = Number(event.target.value));
    input.onchange = (event) => (_root[name] = Number(event.target.value));
    controls.appendChild(input);
    return () => (input.value = _root[name]);
};

const randomColor = () => {
    // return multVec(256, hsv2rgb(Math.random() * 360, 1, 1));
    return Array(3)
        .fill()
        .map(() => Math.random());
};

const randomDot = () => {
    const radius = Math.random() * 10 + 10;
    return {
        color: [...randomColor(), 1],
        pos: addVec(
            elemMultVec(
                addVec(_root.screenSize, [
                    -2 * _root.maximum - 2 * radius,
                    -2 * _root.maximum - 2 * radius,
                ]),
                randVec(2)
            ),
            [_root.maximum + radius, _root.maximum + radius]
        ),
        v: randVec(2).map((x) => (2 * x - 1) * 3),
        dc: [0, 0, 0, 0],
        radius,
    };
};

/****
 * MATH
 */

/**
 *
 * COMPLEX
 */

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

const randVec = (length) =>
    Array(length)
        .fill()
        .map(() => Math.random());
