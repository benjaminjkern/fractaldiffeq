precision highp float;

const int NUM_SPHERES = 100;

uniform vec2 screenSize;
uniform vec3 spheres[NUM_SPHERES];
uniform float radii[NUM_SPHERES];
uniform vec3 colors[NUM_SPHERES];
uniform vec3 camPos;
uniform vec3 camZ;

void main() {
    vec2 screenPos = gl_FragCoord.xy;

    vec3 camX = cross(camZ, vec3(0., 0., 1.));
    vec3 camY = cross(camX, camZ);

    float overallSize = min(screenSize[0], screenSize[1]);

    vec2 adjustedScreenPos = (screenPos - screenSize / 2.) / overallSize;

    vec3 ray = adjustedScreenPos.x * camX + adjustedScreenPos.y * camY + camZ;

    float dist = 1e20;
    vec3 color = vec3(0., 0., 0.);

    for (int s = 0; s < NUM_SPHERES; s++) {
        vec3 diff = camPos - spheres[s];
        float a = dot(ray, ray);
        float b =  dot(ray, diff);
        float c = dot(diff, diff) - radii[s] * radii[s];
        float disc = b * b - a * c;
        if (disc < 0.) continue;
        float sqdisc = sqrt(disc);
        float sqa = sqrt(a);
        float tp = -b + sqdisc;
        if (tp < 0.) continue;
        float tm = -b - sqdisc;
        float t = (tm < 0. ? tp : tm) / a;
        if (t < dist) {
            dist = t;
            color = colors[s];
        }
    }

    gl_FragColor = vec4(color, 1.0);
}