precision highp float;

uniform vec2 screenSize;
vec2 position;

void main() {
    if (position.x == -1) position = gl_FragCoord.xy; // vec2 of current pixel
    gl_FragColor = vec4(position.x / screenSize.x, position.y / screenSize.y, 0, 1);
}