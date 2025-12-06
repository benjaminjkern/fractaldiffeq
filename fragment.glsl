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
    vec3 hitColor = vec3(1., 1., 1.);

    float a = dot(dir, dir);
    float sqa = sqrt(a);

    vec3 norm;
    hitVoid = true;

    vec3 planeDiff = vec3(0.,0.,0.) - pos;
    float tPlane = dot(planeDiff, vec3(0., 0., 1.)) / dot(dir, vec3(0., 0., 1.)) * sqa;
    if (tPlane >= 0. && tPlane < dist) {
        hitVoid = false;
        dist = tPlane;
        norm = vec3(0., 0., 1.);
        hitColor = vec3(0., 0., 0.);
    }

    for (int s = 0; s < NUM_SPHERES; s++) {
        vec3 diff = pos - spheres[s];
        float b =  dot(dir, diff);
        float c = dot(diff, diff) - radii[s] * radii[s];
        float disc = b * b - a * c;
        if (disc < 0.) continue;
        float sqdisc = sqrt(disc);
        float tp = -b + sqdisc;
        if (tp < 0.) continue;
        float tm = -b - sqdisc;
        float t = (tm < 0. ? tp : tm) / a * sqa;
        if (t < dist) {
            hitVoid = false;
            dist = t;
            newPos = pos + dir * (dist / sqa - 0.01);
            norm = (newPos - spheres[s]) / radii[s];
            hitColor = colors[s];
        }
    }
    color = hitColor;
    newPos = pos + dir * (dist / sqa - 0.01);
    newDir = dir - 2. * dot(dir, norm) * norm;
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
    for (int runs = 0; runs < 5; runs++) {
        getColor(pos, dir, newColor, pos, dir, hitVoid);
        color = (color * float(runs) + newColor) / float(runs + 1);
        if (hitVoid) break;
    }

    gl_FragColor = vec4(color, 1.0);
}