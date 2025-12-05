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
    float distSquared;

    vec4 currentColor = vec4(0,0,0,0);
    float sum = 0.;
    float colorSum = 0.;
    float weight;

    for (int d = 0; d < 100; d++) {
        diff = dots[d] - position;
        distSquared = dot(diff, diff);
        dist = sqrt(distSquared);
        sum += exp(-distSquared / radii[d] / radii[d]);

        // weight = pow(1. / dist, power);

        // currentColor *= colorSum;
        // currentColor += colors[d] * weight;
        // colorSum += weight;
        // currentColor /= colorSum;
    }
    if (sum > maximum) {
        gl_FragColor = backgroundColor;
    } else if (sum <= maximum && sum >= minimum) {
        gl_FragColor = colors[0] * (sum - minimum) / (maximum - minimum);
    } else {
        gl_FragColor = backgroundColor;
    }
}