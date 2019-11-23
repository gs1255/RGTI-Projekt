const radians = Math.PI/180;

const xPoints = [
  0.0,
  Math.sin(22.5*radians),
  Math.sin(45*radians),
  Math.sin(67.5*radians),
  Math.sin(90*radians),
  Math.sin(112.5*radians),
  Math.sin(135*radians),
  Math.sin(157.5*radians),
  Math.sin(180*radians),
  Math.sin(202.5*radians),
  Math.sin(225*radians),
  Math.sin(247.5*radians),
  Math.sin(270*radians),
  Math.sin(292.5*radians),
  Math.sin(315*radians),
  Math.sin(337.5*radians),
];

const yPoints = [
  1.0,
  Math.cos(22.5*radians),
  Math.cos(45*radians),
  Math.cos(67.5*radians),
  Math.cos(90*radians),
  Math.cos(112.5*radians),
  Math.cos(135*radians),
  Math.cos(157.5*radians),
  Math.cos(180*radians),
  Math.cos(202.5*radians),
  Math.cos(225*radians),
  Math.cos(247.5*radians),
  Math.cos(270*radians),
  Math.cos(292.5*radians),
  Math.cos(315*radians),
  Math.cos(337.5*radians),
];

const obstacleVertexShader = `
    attribute vec4 aVertexPosition;
    attribute vec4 aVertexColor;
    
    uniform highp float u_locationZ;
    uniform lowp float u_view_distance;
    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;

    varying lowp vec4 vColor;
    varying float v_fogAmount;

    void main(void) {
      gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
      vColor = aVertexColor;
      vec4 vertexLocation = (uModelViewMatrix * aVertexPosition);
      v_fogAmount = -vertexLocation.z/(2.0*u_view_distance);
    }
  `;

const obstacleFragmentShader = `
    varying lowp vec4 vColor;
    varying lowp float v_fogAmount;

    uniform lowp vec4 u_fogColor;    

    void main(void) {
      gl_FragColor = vColor - (vColor * v_fogAmount);
      gl_FragColor.w = 1.0;
    }
  `;


// Vertex shader program
const vsSource =
`
attribute vec4 aVertexPosition;
attribute vec2 aTextureCoord;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

varying highp vec2 vTextureCoord;

void main(void) {
  gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
  vTextureCoord = aTextureCoord;
}
`;


// Fragment shader program
const fsSource = 
`
varying highp vec2 vTextureCoord;

uniform sampler2D uSampler;

void main(void) {
  gl_FragColor = texture2D(uSampler, vTextureCoord);
}
`;


// creates a shader of the given type, uploads the source and
// compiles it.
function loadShader(gl, type, source) {
  const shader = gl.createShader(type);

  // Send the source to the shader object
  gl.shaderSource(shader, source);

  // Compile the shader program
  gl.compileShader(shader);

  // See if it compiled successfully
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}


// Initialize a shader program, so WebGL knows how to draw our data
function initShaderProgram(gl, vsSource, fsSource) {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

  // Create the shader program
  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  // If creating the shader program failed, alert
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
    return null;
  }

  return shaderProgram;
}


// Function for limiting the rotation of the camera
function adjustRotation(change, prev) {
  var newRotation = prev + (change*mouseSensitivity)/5000;
  if (newRotation >= Math.PI/2) {
    newRotation = Math.PI/2;
  }
  if (newRotation <= -Math.PI/2) {
    newRotation = -Math.PI/2;
  }

  return newRotation;
}


// Initialize a texture and load an image.
// When the image finishes loading copy it into the texture.
function loadTexture(gl, url) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Because images have to be download over the internet
  // they might take a moment until they are ready.
  // Until then put a single pixel in the texture so we can
  // use it immediately. When the image has finished downloading
  // we'll update the texture with the contents of the image.
  const level = 0;
  const internalFormat = gl.RGBA;
  const width = 1;
  const height = 1;
  const border = 0;
  const srcFormat = gl.RGBA;
  const srcType = gl.UNSIGNED_BYTE;
  const pixel = new Uint8Array([255, 255, 255, 255]);  // opaque blue
  gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                width, height, border, srcFormat, srcType,
                pixel);

  const image = new Image();
  image.onload = function() {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                  srcFormat, srcType, image);

    // WebGL1 has different requirements for power of 2 images
    // vs non power of 2 images so check if the image is a
    // power of 2 in both dimensions.
    if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
       // Yes, it's a power of 2. Generate mips.
       gl.generateMipmap(gl.TEXTURE_2D);
    } else {
       // No, it's not a power of 2. Turn off mips and set
       // wrapping to clamp to edge
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }
  };
  image.src = url;
  image.crossOrigin = "";

  return texture;
}


function isPowerOf2(value) {
  return (value & (value - 1)) == 0;
}


function generateTunnelSegments(n) {
  const size = Math.sqrt(Math.pow(xPoints[1] - xPoints[0], 2) + Math.pow(yPoints[1] - yPoints[0], 2));
  const distance = 32.0*size;

  var segments = [];

  for (var i = 0; i < n; i++) {
    for (var j = 0; j < 15; j++) {
      segments.push(
        xPoints[j],
        yPoints[j],
        -i*distance,
        xPoints[j],
        yPoints[j],
        -(i+1)*distance,
        xPoints[j+1],
        yPoints[j+1],
        -i*distance,
        xPoints[j+1],
        yPoints[j+1],
        -(i+1)*distance
      );
      
    }
    segments.push(
        xPoints[15],
        yPoints[15],
        -i*distance,
        xPoints[15],
        yPoints[15],
        -(i+1)*distance,
        xPoints[0],
        yPoints[0],
        -i*distance,
        xPoints[0],
        yPoints[0],
        -(i+1)*distance
      );
  }

  return segments;
}


function generateSquareIndices(n) {
  var indices = [];
  for (var i = 0; i < n; i++) {
    const first = i*4;
    indices.push(
      first,
      first+1,
      first+2,
      first+1,
      first+2,
      first+3
    );
  }

  return indices;
}


function generateObstacleIndices(n) {
  var indices = [];
  for (var i = 0; i < n; i++) {
    const first = i*4;
    indices.push(
      first,
      first+1,
      first+2,
      first,
      first+2,
      first+3
    );
  }

  return indices;
}


function generateTextureCoordinates(n) {
  var coords = [];
  for (var i = 0; i < n; i++) {
    for (var j = 0; j < 16; j++) {
      coords.push(
        0.0,  0.0,
        0.0,  1.0,
        1.0,  0.0,
        1.0,  1.0         
      );
    }
  }

  return coords;
}


// Function for translating mouse movement to in-game movement
function updatePosition(e) {
  xRotation = adjustRotation(e.movementX, xRotation);
  yRotation = adjustRotation(e.movementY, yRotation);
}