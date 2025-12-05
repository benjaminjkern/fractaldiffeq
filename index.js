import WebGLShaderRenderer from "./webgl.js";

const _root = {};

window.onload = async () => {
    const canvas = document.getElementById("canvas");

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
    _root.camPos = [1, 0, 0];
    _root.camZ = [-1, 0, 0];
};

const update = () => {};

const randomSphere = () => ({
    pos: Array(3)
        .fill()
        .map(() => Math.random() * 2 - 1),
    radius: Math.random() + 1,
    color: randomColor(),
});

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
