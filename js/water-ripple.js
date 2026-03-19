/* ============================================
   Liquid Flow Distortion — WebGL Shader
   Intense organic warping like Munro Partners
   Uses simplex noise for turbulent displacement
   ============================================ */

(function () {
  'use strict';

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var heroImg = document.getElementById('heroImg');
  var heroCanvas = document.getElementById('heroCanvas');
  var heroSection = document.querySelector('.hero');

  if (!heroCanvas || !heroImg) return;

  var gl = heroCanvas.getContext('webgl') || heroCanvas.getContext('experimental-webgl');
  if (!gl) return;

  var isVisible = true;
  var startTime = Date.now();

  var vertexSource = [
    'attribute vec2 a_position;',
    'attribute vec2 a_texCoord;',
    'varying vec2 v_texCoord;',
    'void main() {',
    '  gl_Position = vec4(a_position, 0.0, 1.0);',
    '  v_texCoord = a_texCoord;',
    '}'
  ].join('\n');

  // Fragment shader with simplex noise and heavy displacement
  var fragmentSource = [
    'precision highp float;',
    'uniform sampler2D u_image;',
    'uniform float u_time;',
    'uniform vec2 u_mouse;',
    'varying vec2 v_texCoord;',
    '',
    '// --- Simplex 2D noise ---',
    'vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }',
    'vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }',
    'vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }',
    '',
    'float snoise(vec2 v) {',
    '  const vec4 C = vec4(0.211324865405187, 0.366025403784439,',
    '                     -0.577350269189626, 0.024390243902439);',
    '  vec2 i  = floor(v + dot(v, C.yy));',
    '  vec2 x0 = v -   i + dot(i, C.xx);',
    '  vec2 i1;',
    '  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);',
    '  vec4 x12 = x0.xyxy + C.xxzz;',
    '  x12.xy -= i1;',
    '  i = mod289(i);',
    '  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));',
    '  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);',
    '  m = m*m;',
    '  m = m*m;',
    '  vec3 x = 2.0 * fract(p * C.www) - 1.0;',
    '  vec3 h = abs(x) - 0.5;',
    '  vec3 ox = floor(x + 0.5);',
    '  vec3 a0 = x - ox;',
    '  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);',
    '  vec3 g;',
    '  g.x  = a0.x  * x0.x  + h.x  * x0.y;',
    '  g.yz = a0.yz * x12.xz + h.yz * x12.yw;',
    '  return 130.0 * dot(m, g);',
    '}',
    '',
    '// Fractal Brownian Motion — layered noise for turbulence',
    'float fbm(vec2 p) {',
    '  float value = 0.0;',
    '  float amplitude = 0.5;',
    '  float frequency = 1.0;',
    '  for (int i = 0; i < 5; i++) {',
    '    value += amplitude * snoise(p * frequency);',
    '    frequency *= 2.0;',
    '    amplitude *= 0.5;',
    '  }',
    '  return value;',
    '}',
    '',
    'void main() {',
    '  vec2 uv = v_texCoord;',
    '  float t = u_time * 0.045;',
    '',
    '  // Directional drift: top-left to bottom-right',
    '  vec2 drift = vec2(-t * 0.3, -t * 0.3);',
    '',
    '  // Domain warping — feed noise into itself for organic swirl',
    '  vec2 q = vec2(',
    '    fbm(uv * 3.0 + vec2(0.0, 0.0) + drift + t * 0.2),',
    '    fbm(uv * 3.0 + vec2(5.2, 1.3) + drift + t * 0.15)',
    '  );',
    '',
    '  vec2 r = vec2(',
    '    fbm(uv * 3.0 + 4.0 * q + vec2(1.7, 9.2) + drift + t * 0.12),',
    '    fbm(uv * 3.0 + 4.0 * q + vec2(8.3, 2.8) + drift + t * 0.18)',
    '  );',
    '',
    '  // Subtle mouse influence — gentle pull toward cursor',
    '  vec2 mouseDir = u_mouse - uv;',
    '  float mouseDist = length(mouseDir);',
    '  float mouseInfluence = smoothstep(0.5, 0.0, mouseDist) * 0.012;',
    '  vec2 mousePush = normalize(mouseDir) * mouseInfluence;',
    '',
    '  // Displacement strength — this is what makes it dramatic',
    '  float strength = 0.055;',
    '',
    '  vec2 distorted = uv + strength * r + mousePush;',
    '',
    '  // Keep within bounds',
    '  distorted = clamp(distorted, 0.002, 0.998);',
    '',
    '  vec4 color = texture2D(u_image, distorted);',
    '',
    '  // Liquid sheen — light variation from the displacement',
    '  float sheen = (r.x + r.y) * 0.04;',
    '  color.rgb += sheen;',
    '',
    '  // Very subtle darkening at distortion peaks for depth',
    '  float depth = length(r) * 0.03;',
    '  color.rgb -= depth * 0.3;',
    '',
    '  gl_FragColor = color;',
    '}'
  ].join('\n');

  function createShader(type, source) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  var vertShader = createShader(gl.VERTEX_SHADER, vertexSource);
  var fragShader = createShader(gl.FRAGMENT_SHADER, fragmentSource);
  if (!vertShader || !fragShader) return;

  var program = gl.createProgram();
  gl.attachShader(program, vertShader);
  gl.attachShader(program, fragShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;

  gl.useProgram(program);

  // Full-screen quad
  var posBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1, -1,  1, -1,  -1, 1,
    -1,  1,  1, -1,   1, 1
  ]), gl.STATIC_DRAW);

  var posLoc = gl.getAttribLocation(program, 'a_position');
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

  var texBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, texBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    0, 1,  1, 1,  0, 0,
    0, 0,  1, 1,  1, 0
  ]), gl.STATIC_DRAW);

  var texLoc = gl.getAttribLocation(program, 'a_texCoord');
  gl.enableVertexAttribArray(texLoc);
  gl.vertexAttribPointer(texLoc, 2, gl.FLOAT, false, 0, 0);

  var uTime = gl.getUniformLocation(program, 'u_time');
  var uMouse = gl.getUniformLocation(program, 'u_mouse');
  var mouseX = 0.5, mouseY = 0.5;
  var targetX = 0.5, targetY = 0.5;

  var texture = gl.createTexture();

  function loadTexture() {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, heroImg);
    heroSection.classList.add('canvas-active');
  }

  function resize() {
    var rect = heroSection.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    heroCanvas.width = Math.floor(rect.width * dpr);
    heroCanvas.height = Math.floor(rect.height * dpr);
    gl.viewport(0, 0, heroCanvas.width, heroCanvas.height);
  }

  function render() {
    if (!isVisible) {
      requestAnimationFrame(render);
      return;
    }

    // Smooth mouse lerp
    mouseX += (targetX - mouseX) * 0.08;
    mouseY += (targetY - mouseY) * 0.08;

    var elapsed = (Date.now() - startTime) / 1000;
    gl.uniform1f(uTime, elapsed);
    gl.uniform2f(uMouse, mouseX, mouseY);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    requestAnimationFrame(render);
  }

  function init() {
    loadTexture();
    resize();

    window.addEventListener('resize', debounce(function () {
      loadTexture();
      resize();
    }, 200));

    heroSection.addEventListener('mousemove', function (e) {
      var rect = heroSection.getBoundingClientRect();
      targetX = (e.clientX - rect.left) / rect.width;
      targetY = (e.clientY - rect.top) / rect.height;
    });

    heroSection.addEventListener('mouseleave', function () {
      targetX = 0.5;
      targetY = 0.5;
    });

    var observer = new IntersectionObserver(function (entries) {
      isVisible = entries[0].isIntersecting;
    }, { threshold: 0.1 });
    observer.observe(heroSection);

    render();
  }

  function debounce(fn, ms) {
    var timer;
    return function () {
      clearTimeout(timer);
      timer = setTimeout(fn, ms);
    };
  }

  if (heroImg.complete && heroImg.naturalWidth > 0) {
    init();
  } else {
    heroImg.addEventListener('load', init);
  }
})();
