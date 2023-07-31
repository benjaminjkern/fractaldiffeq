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
