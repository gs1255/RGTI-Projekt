// Game logic variables
var xRotation = 0.0;
var yRotation = 0.0;
var mouseSensitivity = 10;
var trueScore = 0;
var score = trueScore;
var time = 1.1;
var speed = Math.log10(time)/4;
var locationX = 0;
var locationY = 0;
var locationZ = 0;
var konec = true;
var tunnelSegmentLength = 0;
var travelDistance = 0;
var obstacles = [Math.floor(Math.random() * 6), Math.floor(Math.random() * 6)];

// 2D Canvas variables
var flatContext;

// Audio variables
var audioCtx;
var audioContext;
var audioBuffer;
var audioSource;
var audioLoaded = false;
var deathSound;
var deathBuffer;

// WebGL variables
var gl;
var tunnel_texture;
var tunnelShaderProgram;
var obstacleShaderProgram;
var tunnelProgram;
var obstacleProgram;
var tunnel_buffers;
var obstacle_buffers;

function main() {
  const canvas = document.querySelector("#glCanvas");
  // Initialize the GL context
  gl = canvas.getContext("webgl");

  // Only continue if WebGL is available and working
  if (gl === null) {
    alert("Unable to initialize WebGL. Your browser or machine may not support it.");
    return;
  }

  // 2D elements
  const flatCanvas = document.querySelector("#flatCanvas");
  flatContext = flatCanvas.getContext("2d");

  // Draw the loading screen
  flatContext.clearRect(0, 0, flatContext.canvas.width, flatContext.canvas.height);
  flatContext.fillStyle = 'black';
  flatContext.fillRect(0, 0, flatContext.canvas.width, flatContext.canvas.height);
  flatContext.fillStyle = 'gray';
  flatContext.font = 'bold 40px PressStart';
  flatContext.fillText("LOADING", 160, 260);

  // Load death sound
  audioCtx = window.AudioContext || window.webkitAudioContext;
  audioContext = new AudioContext();
  
  var requestD = new XMLHttpRequest();
  requestD.open('GET', "death_sound.wav", true);
  requestD.responseType = 'arraybuffer';
  requestD.onload = function() {
    audioContext.decodeAudioData(requestD.response, function(buffer) {
      deathBuffer = buffer;
      deathSound = audioContext.createBufferSource();
      deathSound.buffer = deathBuffer;
      deathSound.connect(audioContext.destination);
    }, function () {console.log("Audio error")});
  }
  requestD.send();
  

  // Load tunnel audio
  //audioCtx = window.AudioContext || window.webkitAudioContext;
  //audioContext = new AudioContext();
  var requestT = new XMLHttpRequest();
  requestT.open('GET', "tunnel_sound.wav", true);
  requestT.responseType = 'arraybuffer';
  requestT.onload = function() {
    audioContext.decodeAudioData(requestT.response, function(buffer) {
      audioBuffer = buffer;
      loadAudio(audioBuffer);
      audioSource.loop = true;
      flatCanvas.onclick = startGame;
      // When it finishes loading, load the intro screen
      renderIntro();
    }, function () {console.log("Audio error")});
  }
  requestT.send();




  // Load textures
  tunnel_texture = loadTexture(gl, 'tunnel_texture3.png');

  // Create shaders
  tunnelShaderProgram = initShaderProgram(gl, vsSource, fsSource);
  obstacleShaderProgram = initShaderProgram(gl, obstacleVertexShader, obstacleFragmentShader);

  // Store program info
  tunnelProgram = {
    program: tunnelShaderProgram,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(tunnelShaderProgram, 'aVertexPosition'),
      textureCoord: gl.getAttribLocation(tunnelShaderProgram, 'aTextureCoord'),
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(tunnelShaderProgram, 'uProjectionMatrix'),
      modelViewMatrix: gl.getUniformLocation(tunnelShaderProgram, 'uModelViewMatrix'),
      uSampler: gl.getUniformLocation(tunnelShaderProgram, 'uSampler'),
    },
  };

  obstacleProgram = {
    program: obstacleShaderProgram,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(obstacleShaderProgram, 'aVertexPosition'),
      vertexColor: gl.getAttribLocation(obstacleShaderProgram, 'aVertexColor')
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(obstacleShaderProgram, 'uProjectionMatrix'),
      modelViewMatrix: gl.getUniformLocation(obstacleShaderProgram, 'uModelViewMatrix'),
      locationZ: gl.getUniformLocation(obstacleShaderProgram, 'u_locationZ'),
      view_distance: gl.getUniformLocation(obstacleShaderProgram, 'u_view_distance'),
      fogColor: gl.getUniformLocation(obstacleShaderProgram, 'u_fogColor')
    },
  };

  // initialize buffers
  const tunnel_data = generateTunnelData();
  tunnel_buffers = initializeTunnelBuffers(gl, tunnel_data.verticeCoords, tunnel_data.textureCoords, tunnel_data.squareIndices);
  const obstacle_data = generateObstacleData();
  obstacle_buffers = initializeObstacleBuffers(gl, obstacle_data.verticeCoords, obstacle_data.colorData, obstacle_data.squareIndices);

}


// Animation functions
function render() {
  drawTunnel(gl, tunnelProgram, tunnel_buffers, tunnel_texture);
  drawObstacles(gl, obstacleProgram, obstacle_buffers);

  if (!konec) {
    requestAnimationFrame(render);
  } else {
    requestAnimationFrame(renderEnd);
  }
}

function renderIntro() {
  drawIntro(flatContext)
  if (konec) {
    requestAnimationFrame(renderIntro);
  } else {
    requestAnimationFrame(render);
  }
}


function renderEnd() {
  drawEnd(flatContext);

  if (!konec) {
    requestAnimationFrame(render);
  } else {
    requestAnimationFrame(renderEnd);
  }
}


function loadAudio(buffer) {
  audioSource = audioContext.createBufferSource();
  audioSource.buffer = buffer;
  audioSource.connect(audioContext.destination);
}


function startGame () {
  // Resets game variables
  clearVars();
  // Start the game
  flatCanvas.requestPointerLock();
  document.addEventListener("mousemove", updatePosition, false);
  if (konec) {
    konec = false;
    xRotation = 0;
    yRotation = 0;
  }
 flatCanvas.onclick = null;
}

function generateTunnelData () {

  // Generate tunnel vertices and append them to the verticeCoords array
  const verticeCoords = generateTunnelSegments(4);
  tunnelSegmentLength = -verticeCoords[5];
  //console.log(tunnelSegmentLength);
  travelDistance = tunnelSegmentLength;

  //Generate texture data and append it to the textureCoords array
  const textureCoords = generateTextureCoordinates(4);

  //Generate connections between vertices
  const squareIndices = generateSquareIndices(16*4);

  return {
    verticeCoords: verticeCoords,
    textureCoords: textureCoords,
    squareIndices: squareIndices
  };
}


function generateObstacleData() {
  // Generate obstacle vertices and append them to the verticeCoords array
  const verticeCoords = [
    // Top hole front face
    -1.5, 0.33, -tunnelSegmentLength+0.5,
    -1.5, -1.5, -tunnelSegmentLength+0.5,
    1.5, -1.5, -tunnelSegmentLength+0.5,
    1.5, 0.33, -tunnelSegmentLength+0.5,
    // Top hole back face
    -1.5, 0.33, -tunnelSegmentLength+0.25,
    -1.5, -1.5, -tunnelSegmentLength+0.25,
    1.5, -1.5, -tunnelSegmentLength+0.25,
    1.5, 0.33, -tunnelSegmentLength+0.25,
    // Top hole top face
    -1.5, 0.33, -tunnelSegmentLength+0.25,
    -1.5, 0.33, -tunnelSegmentLength+0.5,
    1.5, 0.33, -tunnelSegmentLength+0.5,
    1.5, 0.33, -tunnelSegmentLength+0.25,

    // Bottom hole front face
    -1.5, 1.5, -tunnelSegmentLength+0.5,
    -1.5, -0.33, -tunnelSegmentLength+0.5,
    1.5, -0.33, -tunnelSegmentLength+0.5,
    1.5, 1.5, -tunnelSegmentLength+0.5,
    // Bottom hole back face
    -1.5, 1.5, -tunnelSegmentLength+0.25,
    -1.5, -0.33, -tunnelSegmentLength+0.25,
    1.5, -0.33, -tunnelSegmentLength+0.25,
    1.5, 1.5, -tunnelSegmentLength+0.25,
    // Bottom hole bottom face
    -1.5, -0.33, -tunnelSegmentLength+0.25,
    -1.5, -0.33, -tunnelSegmentLength+0.5,
    1.5, -0.33, -tunnelSegmentLength+0.5,
    1.5, -0.33, -tunnelSegmentLength+0.25,
    
    // Right hole front face
    -1.5, 1.5, -tunnelSegmentLength+0.5,
    -1.5, -1.5, -tunnelSegmentLength+0.5,
    0.33, -1.5, -tunnelSegmentLength+0.5,
    0.33, 1.5, -tunnelSegmentLength+0.5,
    // Right hole back face
    -1.5, 1.5, -tunnelSegmentLength+0.25,
    -1.5, -1.5, -tunnelSegmentLength+0.25,
    0.33, -1.5, -tunnelSegmentLength+0.25,
    0.33, 1.5, -tunnelSegmentLength+0.25,
    // Right hole right face
    0.33, 1.5, -tunnelSegmentLength+0.25,
    0.33, 1.5, -tunnelSegmentLength+0.5,
    0.33, -1.5, -tunnelSegmentLength+0.5,
    0.33, -1.5, -tunnelSegmentLength+0.25,
    
    // Left hole front face
    -0.33, 1.5, -tunnelSegmentLength+0.5,
    -0.33, -1.5, -tunnelSegmentLength+0.5,
    1.5, -1.5, -tunnelSegmentLength+0.5,
    1.5, 1.5, -tunnelSegmentLength+0.5,
    // Left hole front face
    -0.33, 1.5, -tunnelSegmentLength+0.25,
    -0.33, -1.5, -tunnelSegmentLength+0.25,
    1.5, -1.5, -tunnelSegmentLength+0.25,
    1.5, 1.5, -tunnelSegmentLength+0.25,
    // Left hole front face
    -0.33, -1.5, -tunnelSegmentLength+0.25,
    -0.33, -1.5, -tunnelSegmentLength+0.5,
    -0.33, 1.5, -tunnelSegmentLength+0.5,
    -0.33, 1.5, -tunnelSegmentLength+0.25,

    // Horizontal hole top front
    -1.5, 1.5, -tunnelSegmentLength+0.5,
    -1.5, 0.33, -tunnelSegmentLength+0.5,
    1.5, 0.33, -tunnelSegmentLength+0.5,
    1.5, 1.5, -tunnelSegmentLength+0.5,
    // Horizontal hole top back
    -1.5, 1.5, -tunnelSegmentLength+0.25,
    -1.5, 0.33, -tunnelSegmentLength+0.25,
    1.5, 0.33, -tunnelSegmentLength+0.25,
    1.5, 1.5, -tunnelSegmentLength+0.25,
    // Horizontal hole top cover
    -1.5, 0.33, -tunnelSegmentLength+0.25,
    -1.5, 0.33, -tunnelSegmentLength+0.5,
    1.5, 0.33, -tunnelSegmentLength+0.5,
    1.5, 0.33, -tunnelSegmentLength+0.25,
    // Horizontal hole bottom front
    -1.5, -1.5, -tunnelSegmentLength+0.5,
    -1.5, -0.33, -tunnelSegmentLength+0.5,
    1.5, -0.33, -tunnelSegmentLength+0.5,
    1.5, -1.5, -tunnelSegmentLength+0.5,
    // Horizontal hole bottom back
    -1.5, -1.5, -tunnelSegmentLength+0.25,
    -1.5, -0.33, -tunnelSegmentLength+0.25,
    1.5, -0.33, -tunnelSegmentLength+0.25,
    1.5, -1.5, -tunnelSegmentLength+0.25,
    // Horizontal hole bottom cover
    -1.5, -0.33, -tunnelSegmentLength+0.25,
    -1.5, -0.33, -tunnelSegmentLength+0.5,
    1.5, -0.33, -tunnelSegmentLength+0.5,
    1.5, -0.33, -tunnelSegmentLength+0.25,

    // Vertical hole left front
    -1.5, 1.5, -tunnelSegmentLength+0.5,
    -1.5, -1.5, -tunnelSegmentLength+0.5,
    -0.33, -1.5, -tunnelSegmentLength+0.5,
    -0.33, 1.5, -tunnelSegmentLength+0.5,
    // Vertical hole left back
    -1.5, 1.5, -tunnelSegmentLength+0.25,
    -1.5, -1.5, -tunnelSegmentLength+0.25,
    -0.33, -1.5, -tunnelSegmentLength+0.25,
    -0.33, 1.5, -tunnelSegmentLength+0.25,
    // Vertical hole left cover
    -0.33, 1.5, -tunnelSegmentLength+0.25,
    -0.33, -1.5, -tunnelSegmentLength+0.25,
    -0.33, -1.5, -tunnelSegmentLength+0.5,
    -0.33, 1.5, -tunnelSegmentLength+0.5,
    // Vertical hole right front
    0.33, 1.5, -tunnelSegmentLength+0.5,
    0.33, -1.5, -tunnelSegmentLength+0.5,
    1.5, -1.5, -tunnelSegmentLength+0.5,
    1.5, 1.5, -tunnelSegmentLength+0.5,
    // Vertical hole right back
    0.33, 1.5, -tunnelSegmentLength+0.25,
    0.33, -1.5, -tunnelSegmentLength+0.25,
    1.5, -1.5, -tunnelSegmentLength+0.25,
    1.5, 1.5, -tunnelSegmentLength+0.25,
    // Vertical hole right cover
    0.33, 1.5, -tunnelSegmentLength+0.25,
    0.33, -1.5, -tunnelSegmentLength+0.25,
    0.33, -1.5, -tunnelSegmentLength+0.5,
    0.33, 1.5, -tunnelSegmentLength+0.5

  ];

  //Generate color data and append it to the textureCoords array
  const colorData = [
    1.0,  0.0,  0.0,  1.0,
    1.0,  0.0,  0.0,  1.0,
    1.0,  0.0,  0.0,  1.0,
    1.0,  0.0,  0.0,  1.0,
    1.0,  0.0,  0.0,  1.0,
    1.0,  0.0,  0.0,  1.0,
    1.0,  0.0,  0.0,  1.0,
    1.0,  0.0,  0.0,  1.0,
    1.0,  0.0,  0.0,  1.0,
    1.0,  0.0,  0.0,  1.0,
    1.0,  0.0,  0.0,  1.0,
    1.0,  0.0,  0.0,  1.0,
    1.0,  0.0,  0.0,  1.0,
    1.0,  0.0,  0.0,  1.0,
    1.0,  0.0,  0.0,  1.0,
    1.0,  0.0,  0.0,  1.0,
    1.0,  0.0,  0.0,  1.0,
    1.0,  0.0,  0.0,  1.0,
    1.0,  0.0,  0.0,  1.0,
    1.0,  0.0,  0.0,  1.0,
    1.0,  0.0,  0.0,  1.0,
    1.0,  0.0,  0.0,  1.0,
    1.0,  0.0,  0.0,  1.0,
    1.0,  0.0,  0.0,  1.0,
    1.0,  0.0,  0.0,  1.0,
    1.0,  0.0,  0.0,  1.0,
    1.0,  0.0,  0.0,  1.0,
    1.0,  0.0,  0.0,  1.0,
    1.0,  0.0,  0.0,  1.0,
    1.0,  0.0,  0.0,  1.0,
    1.0,  0.0,  0.0,  1.0,
    1.0,  0.0,  0.0,  1.0,
    1.0,  0.0,  0.0,  1.0,
    1.0,  0.0,  0.0,  1.0,
    1.0,  0.0,  0.0,  1.0,
    1.0,  0.0,  0.0,  1.0,
    1.0,  0.0,  0.0,  1.0,
    1.0,  0.0,  0.0,  1.0,
    1.0,  0.0,  0.0,  1.0,
    1.0,  0.0,  0.0,  1.0,
    1.0,  0.0,  0.0,  1.0,
    1.0,  0.0,  0.0,  1.0,
    1.0,  0.0,  0.0,  1.0,
    1.0,  0.0,  0.0,  1.0,
    1.0,  0.0,  0.0,  1.0,
    1.0,  0.0,  0.0,  1.0,
    1.0,  0.0,  0.0,  1.0,
    1.0,  0.0,  0.0,  1.0
  ];

  //Generate connections between vertices
  const squareIndices = generateObstacleIndices(12);

  return {
    verticeCoords: verticeCoords,
    colorData: colorData,
    squareIndices: squareIndices
  };
}


function initializeTunnelBuffers(gl, verticeCoords, textureCoords, squareIndices) {
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER,
                new Float32Array(verticeCoords),
                gl.STATIC_DRAW);

  // Texture data
  const textureCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords),
                gl.STATIC_DRAW);
  
  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
      new Uint16Array(squareIndices), gl.STATIC_DRAW);

  return {
    position: positionBuffer,
    textureCoord: textureCoordBuffer,
    indices: indexBuffer,
  };
}


function initializeObstacleBuffers(gl, verticeCoords, colorData, squareIndices) {
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER,
                new Float32Array(verticeCoords),
                gl.STATIC_DRAW);

  // Color data
  const colorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colorData), gl.STATIC_DRAW);

  
  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
      new Uint16Array(squareIndices), gl.STATIC_DRAW);

  return {
    position: positionBuffer,
    color: colorBuffer,
    indices: indexBuffer,
  };
}


function drawObstacles(gl, programInfo, buffers) {
  //gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
  //gl.clearDepth(1.0);                 // Clear everything
  //gl.enable(gl.DEPTH_TEST);           // Enable depth testing
  //gl.depthFunc(gl.LEQUAL);            // Near things obscure far things

  // Clear the canvas before we start drawing on it.
  //gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Create the perspective matrix
  const fieldOfView = 45 * Math.PI / 180;   // in radians
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const zNear = 0.01;
  const zFar = 2.5*tunnelSegmentLength;
  const projectionMatrix = glMatrix.mat4.create();
  glMatrix.mat4.perspective(projectionMatrix,
                   fieldOfView,
                   aspect,
                   zNear,
                   zFar);

  // Set the drawing position to the "identity" point, which is
  // the center of the scene.
  const modelViewMatrix = glMatrix.mat4.create();

  // Rotate the view (before translating!!)
  // Along the X axis 
  glMatrix.mat4.rotate(modelViewMatrix,  // destination matrix
              modelViewMatrix,  // matrix to rotate
              xRotation,   // amount to rotate in radians
              [0, 1, 0]);       // axis to rotate around
  //Along the Y axis
  glMatrix.mat4.rotate(modelViewMatrix,
              modelViewMatrix,
              yRotation,
              [1, 0, 0]);

  // Movement
  glMatrix.mat4.translate(modelViewMatrix,     // destination matrix
                 modelViewMatrix,     // matrix to translate
                 [locationX, locationY, locationZ]);  // amount to translate

  // Tell WebGL how to pull out the positions from the position
  // buffer into the vertexPosition attribute.
  {
    const numComponents = 3;  // pull out 3 values per iteration
    const type = gl.FLOAT;    // the data in the buffer is 32bit floats
    const normalize = false;  // don't normalize
    const stride = 0;         // how many bytes to get from one set of values to the next
                              // 0 = use type and numComponents above
    var offset = 4 * 12 * 3 * obstacles[0];         // how many bytes inside the buffer to start from
    if (obstacles[0] == 5) {
      offset = 4 * 12 * 3 * 4 + 4 * 24 * 3;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
    gl.vertexAttribPointer(
        programInfo.attribLocations.vertexPosition,
        numComponents,
        type,
        normalize,
        stride,
        offset);
    gl.enableVertexAttribArray(
        programInfo.attribLocations.vertexPosition);
  }

  // Tell WebGL how to pull out the colors from the texture buffer
  // into the vertexColor attribute.
  {
    const num = 4; // every coordinate composed of 4 values
    const type = gl.FLOAT; // the data in the buffer is 32 bit float
    const normalize = false; // don't normalize
    const stride = 0; // how many bytes to get from one set to the next
    const offset = 0; // how many bytes inside the buffer to start from
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
    gl.vertexAttribPointer(programInfo.attribLocations.vertexColor, num, type, normalize, stride, offset);
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexColor);
  }

  // Tell WebGL which indices to use to index the vertices
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);

  // Tell WebGL to use our program when drawing
  gl.useProgram(programInfo.program);

  // Set the shader uniforms
  gl.uniformMatrix4fv(
      programInfo.uniformLocations.projectionMatrix,
      false,
      projectionMatrix);
  gl.uniformMatrix4fv(
      programInfo.uniformLocations.modelViewMatrix,
      false,
      modelViewMatrix);

  // Tell WebGL fogging info
  gl.uniform1f (programInfo.uniformLocations.view_distance, tunnelSegmentLength);

  // Draw the first obstacle
  {
    var vertexCount = 18;
    if (obstacles[0] == 4 || obstacles[0] == 5) {
      vertexCount = 36;
    }
    const type = gl.UNSIGNED_SHORT;
    const offset = 0;
    gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
  }

  // Move the camera so the second obstacle is drawn further back
  glMatrix.mat4.translate(modelViewMatrix,     // destination matrix
                 modelViewMatrix,     // matrix to translate
                 [0, 0, -tunnelSegmentLength]);  // amount to translate
  gl.uniformMatrix4fv(
      programInfo.uniformLocations.modelViewMatrix,
      false,
      modelViewMatrix);

  //Set the offset to the second obstacle
  {
    const numComponents = 3;  // pull out 3 values per iteration
    const type = gl.FLOAT;    // the data in the buffer is 32bit floats
    const normalize = false;  // don't normalize
    const stride = 0;         // how many bytes to get from one set of values to the next
                              // 0 = use type and numComponents above
    var offset = 4 * 12 * 3 * obstacles[1];         // how many bytes inside the buffer to start from
    if (obstacles[1] == 5) {
      offset = 4 * 12 * 3 * 4 + 4 * 24 * 3;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
    gl.vertexAttribPointer(
        programInfo.attribLocations.vertexPosition,
        numComponents,
        type,
        normalize,
        stride,
        offset);
    gl.enableVertexAttribArray(
        programInfo.attribLocations.vertexPosition);
  }

  // Draw the second obstacle
  {
    var vertexCount = 18;
    if (obstacles[1] == 4 || obstacles[1] == 5) {
      vertexCount = 36;
    }
    const type = gl.UNSIGNED_SHORT;
    const offset = 0;
    gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
  }
  
}


function drawTunnel(gl, programInfo, buffers, texture) {
  gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
  gl.clearDepth(1.0);                 // Clear everything
  gl.enable(gl.DEPTH_TEST);           // Enable depth testing
  gl.depthFunc(gl.LEQUAL);            // Near things obscure far things

  // Clear the canvas before we start drawing on it.
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Create the perspective matrix
  const fieldOfView = 45 * Math.PI / 180;   // in radians
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const zNear = 0.01;
  const zFar = 3*tunnelSegmentLength;
  const projectionMatrix = glMatrix.mat4.create();
  glMatrix.mat4.perspective(projectionMatrix,
                   fieldOfView,
                   aspect,
                   zNear,
                   zFar);

  // Set the drawing position to the "identity" point, which is
  // the center of the scene.
  const modelViewMatrix = glMatrix.mat4.create();

  // Rotate the view (before translating!!)
  // Along the X axis 
  glMatrix.mat4.rotate(modelViewMatrix,  // destination matrix
              modelViewMatrix,  // matrix to rotate
              xRotation,   // amount to rotate in radians
              [0, 1, 0]);       // axis to rotate around
  //Along the Y axis
  glMatrix.mat4.rotate(modelViewMatrix,
              modelViewMatrix,
              yRotation,
              [1, 0, 0]);

  // Movement
  glMatrix.mat4.translate(modelViewMatrix,     // destination matrix
                 modelViewMatrix,     // matrix to translate
                 [locationX, locationY, locationZ]);  // amount to translate

  // Tell WebGL how to pull out the positions from the position
  // buffer into the vertexPosition attribute.
  {
    const numComponents = 3;  // pull out 3 values per iteration
    const type = gl.FLOAT;    // the data in the buffer is 32bit floats
    const normalize = false;  // don't normalize
    const stride = 0;         // how many bytes to get from one set of values to the next
                              // 0 = use type and numComponents above
    const offset = 0;         // how many bytes inside the buffer to start from
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
    gl.vertexAttribPointer(
        programInfo.attribLocations.vertexPosition,
        numComponents,
        type,
        normalize,
        stride,
        offset);
    gl.enableVertexAttribArray(
        programInfo.attribLocations.vertexPosition);
  }

  // Tell WebGL how to pull out the colors from the texture buffer
  // into the vertexColor attribute.
  {
    const num = 2; // every coordinate composed of 2 values
    const type = gl.FLOAT; // the data in the buffer is 32 bit float
    const normalize = false; // don't normalize
    const stride = 0; // how many bytes to get from one set to the next
    const offset = 0; // how many bytes inside the buffer to start from
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.textureCoord);
    gl.vertexAttribPointer(programInfo.attribLocations.textureCoord, num, type, normalize, stride, offset);
    gl.enableVertexAttribArray(programInfo.attribLocations.textureCoord);
  }

  // Tell WebGL which indices to use to index the vertices
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);

  // Tell WebGL to use our program when drawing
  gl.useProgram(programInfo.program);

  // Tell WebGL we want to affect texture unit 0
  gl.activeTexture(gl.TEXTURE0);

  // Bind the texture to texture unit 0
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Tell the shader we bound the texture to texture unit 0
  gl.uniform1i(programInfo.uniformLocations.uSampler, 0);

  // Set the shader uniforms
  gl.uniformMatrix4fv(
      programInfo.uniformLocations.projectionMatrix,
      false,
      projectionMatrix);
  gl.uniformMatrix4fv(
      programInfo.uniformLocations.modelViewMatrix,
      false,
      modelViewMatrix);



  {
    const vertexCount = 96*4;
    const type = gl.UNSIGNED_SHORT;
    const offset = 0;
    gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
  }

  // Update location
  locationX -= Math.sin(xRotation)*Math.cos(yRotation)*speed;
  locationY += Math.sin(yRotation)*Math.cos(xRotation)*speed;
  locationZ += Math.abs(Math.cos(xRotation)*Math.cos(yRotation)*speed);
  if (locationZ >= travelDistance) {
    locationZ -= travelDistance;
    // Reset obstacle positions
    obstacles[0] = obstacles[1];
    obstacles[1] = Math.floor(Math.random() * 6);
    //console.log("location reset");
  }

  // Update speed and score
  time += 0.003;
  speed = Math.log10(time)/4;
  trueScore += speed;
  score = Math.floor(trueScore*10);

  //Adjust audio playback rate
  audioSource.detune.value = -1200 + speed*6000;

  // Redraw HUD
  flatContext.clearRect(0, 0, flatContext.canvas.width, flatContext.canvas.height);
  // Crosshair
  flatContext.strokeStyle = 'white';
  flatContext.beginPath();
  flatContext.arc(flatContext.canvas.width/2, flatContext.canvas.height/2, 3, 0, 2 * Math.PI);
  flatContext.stroke();
  // HUD base
  flatContext.fillStyle = 'black';
  flatContext.beginPath();
  flatContext.moveTo(0, 450);
  flatContext.lineTo(220, 450);
  flatContext.lineTo(240, 470);
  flatContext.lineTo(440, 470);
  flatContext.lineTo(460, 450);
  flatContext.lineTo(640, 450);
  flatContext.lineTo(640, 480);
  flatContext.lineTo(0, 480);
  flatContext.lineTo(0, 450);
  flatContext.fill();
  flatContext.stroke();
  // Score and speed
  flatContext.fillStyle = 'white';
  flatContext.font = 'bold 16px PressStart';
  flatContext.fillText("Score: " + score, 10, 475);
  flatContext.fillText("Speed: " + Math.floor(speed * 1000), 460, 475);

  // Tunnel collision detection
  if (Math.sqrt(Math.pow(locationX, 2) + Math.pow(locationY, 2)) > 1) {
    // Stop the game and reset game variables
    endGame();
  }

  // Obstacle collision detection
  if (locationZ >= tunnelSegmentLength-0.5) {
    switch(obstacles[0]) {
      case 0:
        if (locationY > -0.33) {
          endGame();
        }
        break;
      case 1:
        if (locationY < 0.33) {
          endGame();
        }
        break;
      case 2:
        if (locationX > -0.33) {
          endGame();
        }
        break;
      case 3:
        if (locationX < 0.33) {
          endGame();
        }
        break;
      case 4:
        if (locationY > 0.33 || locationY < -0.33) {
          endGame();
        }
        break;
      case 5:
        if (locationX > 0.33 || locationX < -0.33) {
          endGame();
        }
        break;
    }
  }

}

function endGame() {
  konec = true;
  // Stop playing audio
  audioSource.stop();
  //Play death sound
  deathSound.start();
  // Clear the HUD
  flatContext.clearRect(0, 0, flatContext.canvas.width, flatContext.canvas.height);
  // Reinstate controls
  flatCanvas.onclick = startGame;
}

function clearVars() {
  locationX = 0;
  locationY = 0;
  locationZ = 0;
  xRotation = 0;
  yRotation = 0;
  time = 1.1;
  speed = Math.log10(time)/4;
  score = 0;
  trueScore = 0;

  // Reset tunnel audio
  loadAudio(audioBuffer);
  audioSource.loop = true;
  audioSource.detune.value = -1200 + speed*6000;
  audioSource.start();

  // Reload death sound
  deathSound = audioContext.createBufferSource();
  deathSound.buffer = deathBuffer;
  deathSound.connect(audioContext.destination);
 
  // Reset obstacles
  obstacles = [Math.floor(Math.random() * 6), Math.floor(Math.random() * 6)];
}


function drawIntro(flatContext) {
  
  // Clear the canvas and turn it black
  flatContext.clearRect(0, 0, flatContext.canvas.width, flatContext.canvas.height);
  flatContext.fillStyle = 'black';
  flatContext.fillRect(0, 0, flatContext.canvas.width, flatContext.canvas.height);

  // Draw game name
  flatContext.fillStyle = 'white';
  flatContext.font = 'bold 40px PressStart';
  flatContext.fillText("TUNNEL RIDER", 60, 100);

  //Draw instructions
  flatContext.fillStyle = 'gray';
  flatContext.font = '16px PressStart';
  flatContext.fillText("Control the direction of flight", 80, 180);
  flatContext.fillText("by moving your mouse.", 80, 205);
  flatContext.fillText("Hiting the tunnel wall or an", 80, 235);
  flatContext.fillText("obstacle ends the game.", 80, 260);
  flatContext.fillText("Try to get as far as possible!", 80, 290);
  flatContext.fillText("Click the screen to begin", 120, 370);


}

function drawEnd(flatContext) {  
  // Clear the canvas and turn it black
  flatContext.clearRect(0, 0, flatContext.canvas.width, flatContext.canvas.height);
  flatContext.fillStyle = 'black';
  flatContext.fillRect(0, 0, flatContext.canvas.width, flatContext.canvas.height);

  // Draw game over
  flatContext.fillStyle = 'red';
  flatContext.font = 'bold 48px PressStart';
  flatContext.fillText("GAME OVER", 100, 140);

  //Draw score, speed...
  flatContext.fillStyle = 'white';
  flatContext.font = '24px PressStart';
  flatContext.fillText("Final score: " + score, 100, 210);
  flatContext.fillText("Final speed: " + Math.floor(speed * 1000), 100, 260);
  flatContext.fillStyle = 'gray';
  flatContext.font = '16px PressStart';
  flatContext.fillText("Click the screen to try again", 95, 350);

}


window.onload = main;