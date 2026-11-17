#version 330 core

in vec3 vNormal;
in vec3 vWorldPos;
out vec4 FragColor;

uniform vec3 camPos; 
uniform float time; // Usado para animar a espuma

const vec3 sunDir = normalize(vec3(0.6, 0.7, 0.4)); 

// Função de Hash
float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

// Interpolação cúbica suave para não ficar pixelizado
float smoothNoise(vec2 p) {
    vec2 i = floor(p); 
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

// Fractal Brownian Motion (FBM) - Gera detalhe fino e orgânico (filamentos)
float fbm(vec2 p) {
    float f = 0.0;
    float amp = 0.5;
    for(int i = 0; i < 4; i++) { // 4 Oitavas de detalhe
        f += amp * smoothNoise(p);
        p *= 2.0;
        amp *= 0.5;
    }
    return f;
}

void main() {
    vec3 n = normalize(vNormal);
    vec3 viewDir = normalize(camPos - vWorldPos);
    
    // Iluminação Base
    float NdotV = max(dot(n, viewDir), 0.0);
    float fresnel = 0.02 + 0.98 * pow(1.0 - NdotV, 5.0);
    float subsurface = max(0.0, dot(viewDir, -sunDir)) * smoothstep(0.6, 1.0, 1.0 - n.y);
    vec3 scatterColor = vec3(0.0, 0.25, 0.2) * subsurface; 
    
    vec3 deepWater = vec3(0.01, 0.03, 0.08);
    vec3 shallowWater = vec3(0.02, 0.15, 0.25);
    float mixFactor = clamp((vWorldPos.y + 2.0) / 8.0, 0.0, 1.0);
    vec3 waterColor = mix(deepWater, shallowWater, mixFactor) + scatterColor;
    
    vec3 R = reflect(-viewDir, n);
    float skyBlend = clamp(R.y, 0.0, 1.0);
    vec3 skyReflect = mix(vec3(0.4, 0.55, 0.65), vec3(0.05, 0.1, 0.2), skyBlend); 
    vec3 albedo = mix(waterColor, skyReflect, fresnel);
    
    float diff = max(dot(n, sunDir), 0.0);
    vec3 halfDir = normalize(sunDir + viewDir);
    float spec = pow(max(dot(n, halfDir), 0.0), 300.0) * 2.5; 
    
    // --- ESPUMA FRACTAL AVANÇADA ---
    vec3 foamColor = vec3(0.85, 0.9, 0.95); 
    
    // Disparadores da Espuma
    float tilt = 1.0 - n.y; 
    float crest = smoothstep(0.05, 0.2, tilt); // Menos restrito para espalhar melhor
    float heightFoam = smoothstep(0.5, 3.5, vWorldPos.y); 
    float foamIntensity = max(crest, heightFoam * 0.8);
    
    // Geração de duas camadas de ruído em movimento para fluidez
    float t = time * 0.0005;
    float n1 = fbm(vWorldPos.xz * 0.6 - vec2(t * 1.2, t * 0.5));
    float n2 = fbm(vWorldPos.xz * 2.0 + vec2(t * 0.8, -t * 1.1));
    float foamPattern = (n1 * 0.7) + (n2 * 0.3); // Mistura detalhe grande com filamentos pequenos
    
    // Transição muito mais suave (smoothstep largo) para evitar arestas duras
    float foam = smoothstep(0.3, 0.8, foamIntensity * foamPattern * 1.8);
    
    // A espuma absorve a cor do mar nas zonas mais finas
    foamColor = mix(albedo, foamColor, foam);
    
    vec3 ambient = albedo * 0.15;
    vec3 finalColor = ambient + (albedo * diff * 0.4) + (vec3(1.0, 0.95, 0.8) * spec);
    
    // Aplicação da espuma com opacidade variável
    finalColor = mix(finalColor, foamColor, foam * 0.9);
    
    finalColor = pow(finalColor, vec3(1.0/2.2));
    FragColor = vec4(finalColor, 1.0);
}