precision highp float;

uniform vec2 screenSize;
uniform vec2 dots[10];
uniform vec4 colors[10];
uniform int numDots;
uniform float t;

const float dotMass = 1.;
const float dotRadius = 20.;

void main() {
    vec2 position = gl_FragCoord.xy; // vec2 of current pixel
    vec2 adjustedVel = position / screenSize * 2. - vec2(1, 1);

    vec2 velocity = vec2(cos(t / 90.), sin(t / 90.)) * adjustedVel + vec2(cos(t / 100.), sin(t / 100.));

    vec2 pos;
    vec2 diff;
    float closestDist;
    float distSquared;

    for (int i = 0; i < 2000; i++) {
        pos.x = position.x;
        pos.y = position.y;
        position = position + velocity;
        closestDist = 1000000000.;

        for (int d = 0; d < 10; d++) {
            diff = dots[d] - pos;
            distSquared = dot(diff, diff);

            if (distSquared < closestDist) {
                gl_FragColor = colors[d];
                closestDist = distSquared;
            }
            if (distSquared <= dotRadius * dotRadius)
                return;
            velocity = velocity + (dotMass / distSquared) * diff;
        }
    }
}