import WebGLShaderRenderer from "./webgl.js";

const _root = {
    numDots: 10,
    done: true,
};

const resetScreenSize = () => {
    if (_root.canvas) _root.canvas.id = "oldcanvas";

    const newCanvas = document.createElement("canvas");
    newCanvas.id = "canvas";
    newCanvas.style.position = "absolute";
    newCanvas.style.left = "0px";
    newCanvas.style.top = "0px";
    newCanvas.width = window.innerWidth;
    newCanvas.height = window.innerHeight;
    _root.screenSize = [newCanvas.width, newCanvas.height];
    document.body.appendChild(newCanvas);

    return newCanvas;
};

const restart = async () => {
    if (!_root.done) return;
    _root.done = false;

    const newCanvas = resetScreenSize();

    const renderer = new WebGLShaderRenderer("canvas", _root.screenSize);
    renderer.programInfo.uniforms = ["screenSize", "dots", "colors", "numDots"];
    await renderer.setShader("./vertex.glsl", "./fragment.glsl");

    // let fps = document.getElementById("fps");
    renderer.callback = (gl, shaderProgram) => {
        gl.uniform2fv(shaderProgram.uniforms.screenSize, _root.screenSize);
        gl.uniform2fv(
            shaderProgram.uniforms.dots,
            _root.dots.flatMap((dot) =>
                dot.pos.map((x, i) => x + _root.screenSize[i] / 2)
            )
        );
        gl.uniform4fv(
            shaderProgram.uniforms.colors,
            _root.dots.flatMap((dot) => dot.color)
        );
        gl.uniform1f(shaderProgram.uniforms.numDots, _root.numDots);
        // fps.innerHTML = `dt: ${Math.round(renderer.dt)}ms fps: ${Math.round(
        //     1000 / renderer.dt
        // )}`;
    };
    renderer.start();

    if (_root.canvas) _root.canvas.remove();
    _root.canvas = newCanvas;

    _root.done = true;
};

window.onload = async () => {
    _root.canvas = resetScreenSize();

    _root.dots = Array(_root.numDots)
        .fill()
        .map(() => randomDot());

    await restart();
};

window.onresize = () => {
    clearTimeout(_root.restartTimeout);
    _root.restartTimeout = setTimeout(restart, 1);
};

const randomColor = () => {
    // return multVec(256, hsv2rgb(Math.random() * 360, 1, 1));
    return randVec(3);
};

const randomDot = () => ({
    color: [...randomColor(), 1],
    pos: elemMultVec(
        _root.screenSize,
        randVec(2).map((x) => x * 2 - 1)
    ),
});

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
