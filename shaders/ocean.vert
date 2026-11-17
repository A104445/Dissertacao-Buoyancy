#version 330 core

in vec4 position;

uniform mat4 m_pvm;
uniform float time;

uniform int sea_state; 
uniform float wave_dirX;
uniform float wave_dirZ;
uniform float wave_steep;
uniform float wave_amp;
uniform float wave_length;
uniform float wave_speed;

out vec3 vNormal;
out vec3 vWorldPos;

const float G = 9.81; 
const int NUM_WAVES = 12; 

void main() {
    float w_amp;
    float w_length;
    float w_steep;
    float w_speed;

    if (sea_state < 0.5) {
        // Calmo
        w_amp = 0.4;
        w_length = 25.0;
        w_steep = 0.25;
        w_speed = 0.8;
    } 
    else if (sea_state < 1.5) {
        // Agitado
        w_amp = 2.5;
        w_length = 80.0;
        w_steep = 0.65;
        w_speed = 1.15;
    } 
    else if (sea_state < 2.5) {
        // Tempestade
        w_amp = 7.5;
        w_length = 210.0;
        w_steep = 0.9;
        w_speed = 1.6;
    } 
    else { 
        // Manual
        w_amp = wave_amp;
        w_length = wave_length;
        w_steep = wave_steep;
        w_speed = wave_speed;
    }

    float t = time * 0.001 * w_speed; 
    
    vec3 p = position.xyz;
    vec2 posXZ = position.xz; 

    float dx = 0.0;
    float dy = 0.0;
    float dz = 0.0;

    float baseW = 2.0 * 3.14159 / (w_length > 0.1 ? w_length : 10.0);
    vec2 baseDir = normalize(vec2(wave_dirX, wave_dirZ));
    float baseAngle = atan(baseDir.y, baseDir.x);

    vec4 waveData[12] = vec4[](
        vec4( 0.00, 1.000, 1.000,  0.0),
        vec4( 0.65, 1.250, 0.750,  1.1),
        vec4(-0.75, 1.550, 0.550,  2.3),
        vec4( 2.10, 1.950, 0.450,  3.7),
        vec4(-0.45, 2.450, 0.350,  4.8), 
        vec4( 1.15, 3.100, 0.250,  6.2),
        vec4(-1.85, 3.900, 0.180,  7.5),
        vec4( 0.45, 4.850, 0.130,  8.9),
        vec4(-1.05, 6.050, 0.090, 10.1),
        vec4( 2.45, 7.550, 0.060, 11.4),
        vec4(-2.15, 9.250, 0.040, 12.8),
        vec4( 0.85, 11.45, 0.025, 14.1)
    );

    for (int i = 0; i < NUM_WAVES; i++) {
        float angleOffset = waveData[i].x;
        float freqMult    = waveData[i].y;
        float ampMult     = waveData[i].z;
        float phaseShift  = waveData[i].w;

        float a = baseAngle + angleOffset;
        vec2 d = vec2(cos(a), sin(a));

        float w = baseW * freqMult;
        float amp = w_amp * ampMult;
        
        float phase = sqrt(G * w) * t;
        float theta = dot(d, posXZ) * w - phase + phaseShift;
        
        float max_q = 1.0 / (w * amp * float(NUM_WAVES) * 0.7);
        float q = min(w_steep, max_q);
        float qa = q * amp;

        p.x += d.x * qa * cos(theta);
        p.z += d.y * qa * cos(theta);
        p.y += amp * sin(theta);

        float wa = w * amp;
        dx += d.x * wa * cos(theta);
        dz += d.y * wa * cos(theta);
        dy += q * wa * sin(theta);
    }

    vec3 finalNormal = vec3(-dx, 1.0 - dy, -dz);
    vNormal = normalize(finalNormal);
    vWorldPos = p;

    gl_Position = m_pvm * vec4(p, 1.0);
}