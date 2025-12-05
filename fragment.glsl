precision highp float;

const int NUM_SPHERES = 100;

vec3 camPos = vec3(1., 0., 0.);
vec3 camZ = vec3(-1., 0., 0.);

uniform vec2 screenSize;
uniform vec3 spheres[NUM_SPHERES];
uniform float radii[NUM_SPHERES];
uniform vec3 colors[NUM_SPHERES];

void main() {
    vec2 screenPos = gl_FragCoord.xy;

    vec3 _camX = cross(camZ, vec3(0., 0., 1.));
    vec3 camX = _camX / sqrt(dot(_camX, _camX));
    vec3 camY = cross(camX, camZ);

    float overallSize = min(screenSize[0], screenSize[1]);

    vec2 adjustedScreenPos = (screenPos - screenSize / 2.) / overallSize;

    vec3 ray = adjustedScreenPos[0] * camX + adjustedScreenPos[1] * camY + camZ;

    float dist = 1e20;
    vec3 color = vec3(0., 0., 0.);

    for (int s = 0; s < NUM_SPHERES; s++) {
        vec3 diff = camPos - spheres[s];
        float a = dot(ray, ray);
        float b = dot(ray, diff);
        float c = a * dot(diff, diff) - radii[s] * radii[s];
        float disc = b * b - 4. * a * c;
        if (disc < 0.) continue;
        float sqdisc = sqrt(disc);
        float sqa = sqrt(a);
        float tm = -b - sqdisc;
        float tp = -b + sqdisc;
        float t = (tm < 0. ? tp : tm) / sqa;
        if (t < dist) {
            dist = t;
            color = colors[s];
        }
    }

    gl_FragColor = vec4(color, 1.0);
}