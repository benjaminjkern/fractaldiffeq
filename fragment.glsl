precision highp float;

const int NUM_SPHERES = 100;

uniform vec2 screenSize;
uniform vec3 spheres[NUM_SPHERES];
uniform float radii[NUM_SPHERES];
uniform vec3 colors[NUM_SPHERES];
uniform vec3 camPos;
uniform vec3 camZ;

float rand(vec3 co){
    return fract(sin(dot(co, vec3(12.9898, 78.233, -1.25851))) * 43758.5453) * 2. - 1.;
}


void getColor(in vec3 pos, in vec3 dir, in int bounceNum, out vec3 color, out vec3 newPos, out vec3 newDir, out bool hitVoid, out float match) {
    float dist = 1e20;
    vec3 hitColor = vec3(1., 1., 1.);

    float a = dot(dir, dir);
    float sqa = sqrt(a);

    float scatterAmount = 0.;

    vec3 scatter = vec3(rand(pos + dir * float(bounceNum + 1)), rand(pos + dir * 2. * float(bounceNum + 1)), rand(pos + dir * 3. * float(bounceNum + 1)));
    scatter = scatter / sqrt(dot(scatter, scatter));

    vec3 norm;
    hitVoid = true;

    vec3 planeDiff = vec3(0.,0.,0.) - pos;
    float tPlane = dot(planeDiff, vec3(0., 0., 1.)) / dot(dir, vec3(0., 0., 1.)) * sqa;
    if (tPlane >= 0. && tPlane < dist) {
        hitVoid = false;
        dist = tPlane;
        norm = vec3(0., 0., 1.);
        hitColor = vec3(0., 0., 0.);
        scatterAmount = 0.1;
    }

    for (int s = 0; s < NUM_SPHERES; s++) {
        if (s == 0 && bounceNum == 0) continue;
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
            scatterAmount = 0.00;
        }
    }
    match = -dot(dir, norm) / sqa;
    if (hitVoid) match = 1.;
    color = hitColor;
    newPos = pos + dir * (dist / sqa - 0.01);
    newDir = dir + 2. * match * sqa * norm + scatter * scatterAmount;
}

vec3 getSample(vec3 pos, vec3 dir, int sample) {
    vec3 color;
    vec3 newColor;

    float sum = 0.;
    float match;
    bool hitVoid = false;

    vec3 scatter = vec3(rand(pos + dir * float(sample)), rand(pos + dir * float(sample) * 2.), rand(pos + dir * float(sample) * 3.));
    scatter = scatter / sqrt(dot(scatter, scatter)) * 0.001;

    vec3 samplePos = pos;
    vec3 sampleDir = dir + scatter;

    for (int rays = 0; rays < 10; rays++) {
        getColor(samplePos, sampleDir, rays, newColor, samplePos, sampleDir, hitVoid, match);
        color = (color * float(rays) + newColor) / float(rays + 1);
        if (hitVoid) break;
        sum += match;
    }

    return color;
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

    const int SAMPLES = 1;

    vec3 color;
    for (int sample = 0; sample < SAMPLES; sample++) {
        color += getSample(pos, dir, sample);
    }

    gl_FragColor = vec4(color / float(SAMPLES), 1.0);
}