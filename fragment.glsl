precision highp float;

uniform vec2 screenSize;
uniform vec2 dots[100];
uniform vec4 colors[100];
uniform int numDots;
uniform float radii[100];
uniform float power;
uniform vec4 backgroundColor;
uniform float maximum;
uniform float minimum;


void main() {
    vec2 position = gl_FragCoord.xy; // vec2 of current pixel

    vec2 diff;
    float distToSurface;
    float dist;

    vec4 currentColor = vec4(0,0,0,0);
    float sum = 0.;
    float colorSum = 0.;
    float weight;

    for (int d = 0; d < 100; d++) {
        diff = dots[d] - position;
        dist = sqrt(dot(diff, diff));
        distToSurface = dist - radii[d];
        sum += distToSurface > 0. ? 1. / distToSurface : 100.;

        weight = pow(1. / dist, power);

        currentColor *= colorSum;
        currentColor += colors[d] * weight;
        colorSum += weight;
        currentColor /= colorSum;
    }
    float inverseSum = 1. / sum;
    if (inverseSum > maximum) {
        gl_FragColor = backgroundColor;
    } else if (inverseSum <= maximum && inverseSum >= minimum) {
        gl_FragColor = currentColor;
    } else {
        gl_FragColor = backgroundColor;
    }
}