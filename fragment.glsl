precision highp float;

const int numDots = 10;

uniform vec2 screenSize;
uniform vec2 dots[numDots];
uniform vec4 colors[numDots];
uniform int frames;

const float dotMass = 1.;
const float dotRadius = 0.;

void main() {
    vec2 position = gl_FragCoord.xy; // vec2 of current pixel
    vec2 velocity = vec2(0, 0);

    vec2 pos;
    vec2 diff;
    float closestDist;
    float distSquared;

    for (int i = 0; i < 1000000; i++) {
        if (float(i) >= float(frames)) break;
        pos.x = position.x;
        pos.y = position.y;
        position = position + velocity;
        closestDist = 1000000000.;

        for (int d = 0; d < numDots; d++) {
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