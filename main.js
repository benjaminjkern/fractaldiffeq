// Vertex shader (usually simple and not relevant for this example)
const vertexShaderSource = `
  attribute vec2 a_position;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

// Fragment shader
const fragmentShaderSource = `
    precision mediump float;

    // Input texture where we store the persistent state per pixel
    uniform sampler2D u_persistentState;

    // The resolution of the input texture
    uniform vec2 u_resolution;

    // Flag to determine whether to read or write to the texture
    uniform bool u_writeToTexture;

    void main() {
        // Get the current pixel position
        vec2 pixelPos = gl_FragCoord.xy / u_resolution;

        if (u_writeToTexture) {
            // Write to the texture (example: increase red channel by 0.1)
            gl_FragColor = texture2D(u_persistentState, pixelPos);
            gl_FragColor.r += 0.1;
        } else {
            // Read from the texture
            gl_FragColor = texture2D(u_persistentState, pixelPos);
        }
    }
`;

// WebGL setup and rendering
function main() {
    const canvas = document.getElementById("canvas");
    const gl = canvas.getContext("webgl");

    // Create the shader program
    const program = createProgram(gl, vertexShaderSource, fragmentShaderSource);

    // Get the uniform locations
    const u_persistentStateLoc = gl.getUniformLocation(
        program,
        "u_persistentState"
    );
    const u_resolutionLoc = gl.getUniformLocation(program, "u_resolution");

    // Create a texture to store the persistent state (size should match the canvas resolution)

    // Create a texture for the persistent state (size should match the canvas resolution)
    const persistentStateTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, persistentStateTexture);
    gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        canvas.width,
        canvas.height,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        null
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    // Create and bind a framebuffer to link the texture and the rendering
    const framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D,
        persistentStateTexture,
        0
    );

    // Check if the framebuffer is complete and valid
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
        console.error("Framebuffer is incomplete.");
        return;
    }

    // Set up vertex data and attributes (not relevant for this example)
    const vertices = [
        /* ... */
    ];
    const positionAttributeLocation = gl.getAttribLocation(
        program,
        "a_position"
    );
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

    // Set the current persistent state texture to the fragment shader uniform
    gl.useProgram(program);
    gl.uniform1i(u_persistentStateLoc, 0);

    // Get the uniform location for the flag that determines whether to read or write to the texture
    const u_writeToTextureLoc = gl.getUniformLocation(
        program,
        "u_writeToTexture"
    );

    // Set up a variable to toggle between read and write states
    let writeToTexture = true;

    // Render loop
    function render() {
        // Set the resolution uniform for the fragment shader
        gl.uniform2f(u_resolutionLoc, canvas.width, canvas.height);

        // Render to the framebuffer
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

        // Perform the actual rendering using the fragment shader
        gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 2);

        // Rebind the default framebuffer to display the result on the canvas
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        // Render the result from the framebuffer to the canvas (optional)
        // gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 2);

        // Toggle the flag between read and write states
        writeToTexture = !writeToTexture;
        gl.uniform1i(u_writeToTextureLoc, writeToTexture);

        // Request the next frame
        requestAnimationFrame(render);
    }

    // Start the render loop
    render();
}

// Helper function to create and compile a shader program
function createProgram(gl, vertexShaderSource, fragmentShaderSource) {
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(
        gl,
        gl.FRAGMENT_SHADER,
        fragmentShaderSource
    );

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error(
            "Shader program failed to link: ",
            gl.getProgramInfoLog(program)
        );
        gl.deleteProgram(program);
        return null;
    }

    return program;
}

// Helper function to create and compile a shader
function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(
            "Shader compilation error: ",
            gl.getShaderInfoLog(shader)
        );
        gl.deleteShader(shader);
        return null;
    }

    return shader;
}

// Call the main function when the page is loaded
window.onload = main;
