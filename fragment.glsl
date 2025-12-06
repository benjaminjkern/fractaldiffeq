precision highp float;

const int NUM_SPHERES = 100;

uniform vec2 screenSize;
uniform vec3 spheres[NUM_SPHERES];
uniform float radii[NUM_SPHERES];
uniform vec3 colors[NUM_SPHERES];
uniform vec3 camPos;
uniform vec3 camZ;


void getColor(in vec3 pos, in vec3 dir, out vec3 color, out vec3 newPos, out vec3 newDir, out bool hitVoid) {
    float dist = 1e20;
    vec3 hitColor = vec3(0., 0., 0.);

    hitVoid = true;

    vec3 norm;

    for (int s = 0; s < NUM_SPHERES; s++) {
        vec3 diff = pos - spheres[s];
        float a = dot(dir, dir);
        float b =  dot(dir, diff);
        float c = dot(diff, diff) - radii[s] * radii[s];
        float disc = b * b - a * c;
        if (disc < 0.) continue;
        float sqdisc = sqrt(disc);
        float sqa = sqrt(a);
        float tp = -b + sqdisc;
        if (tp < 0.) continue;
        float tm = -b - sqdisc;
        float t = (tm < 0. ? tp : tm) / a;
        if (t * sqa < dist) {
            hitVoid = false;
            dist = t * sqa;
            newPos = pos + dir * (t - 0.01);
            norm = (newPos - spheres[s]) / radii[s];
            newDir = dir - 2. * dot(dir, norm) * norm;
            hitColor = colors[s];
        }
    }
    color = hitColor;
}

void main() {
    vec2 screenPos = gl_FragCoord.xy;

    vec3 _camX = cross(camZ, vec3(0., 0., 1.));
    vec3 camX = _camX / sqrt(dot(_camX, _camX));
    vec3 camY = cross(camX, camZ);

    float overallSize = min(screenSize[0], screenSize[1]);

    vec2 adjustedScreenPos = (screenPos - screenSize / 2.) / overallSize;

    vec3 pos = camPos;
    vec3 dir = adjustedScreenPos.x * camX + adjustedScreenPos.y * camY + camZ;
    vec3 newColor;
    vec3 color;
    int runs = 0;

    bool hitVoid = false;
    for (int runs = 0; runs < 20; runs++) {
        getColor(pos, dir, newColor, pos, dir, hitVoid);
        color = (color * float(runs) + newColor) / float(runs + 1);
        if (hitVoid) break;
    }

    gl_FragColor = vec4(color, 1.0);
}