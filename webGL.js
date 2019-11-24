// Game logic variables
var xRotation = 0.0;
var yRotation = 0.0;
var mouseSensitivity = 10;
var speed = 0.1;
var locationX = 0;
var locationY = 0;
var locationZ = 0;
var konec = true;
var tunnelSegmentLength = 0;
var travelDistance = 0;
var obstacles = [Math.floor(Math.random() * 6), Math.floor(Math.random() * 6)];
var flatContext;

function main() {
  const canvas = document.querySelector("#glCanvas");
  // Initialize the GL context
  const gl = canvas.getContext("webgl");

  // Only continue if WebGL is available and working
  if (gl === null) {
    alert("Unable to initialize WebGL. Your browser or machine may not support it.");
    return;
  }

  // 2D elements
  const flatCanvas = document.querySelector("#flatCanvas");
  flatContext = flatCanvas.getContext("2d");

  // Clear the 2D canvas
  flatContext.clearRect(0, 0, flatContext.canvas.width, flatContext.canvas.height);

  // Audio


  // Load textures
  const tunnel_texture = loadTexture(gl, 'tunnel_texture3.png');
  const intro_texture = loadTexture(gl, 'start_image.png');

  // Create shaders
  const tunnelShaderProgram = initShaderProgram(gl, vsSource, fsSource);
  const obstacleShaderProgram = initShaderProgram(gl, obstacleVertexShader, obstacleFragmentShader);

  // Store program info
  const tunnelProgram = {
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

  const obstacleProgram = {
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
  const tunnel_buffers = initializeTunnelBuffers(gl, tunnel_data.verticeCoords, tunnel_data.textureCoords, tunnel_data.squareIndices);
  const obstacle_data = generateObstacleData();
  const obstacle_buffers = initializeObstacleBuffers(gl, obstacle_data.verticeCoords, obstacle_data.colorData, obstacle_data.squareIndices);
  const intro_buffers = initIntroBuffers(gl);

  //  Load intro
  renderIntro(gl, tunnelProgram, intro_buffers, intro_texture);

  // Implement mouse tracking
  flatCanvas.onclick = function() {
    // Start the game
    flatCanvas.requestPointerLock();
    document.addEventListener("mousemove", updatePosition, false);
    if (konec) {
      konec = false;
      xRotation = 0;
      yRotation = 0;
    }

    // Draw the crosshair
    flatContext.strokeStyle = 'white';
    flatContext.beginPath();
    flatContext.arc(flatContext.canvas.width/2, flatContext.canvas.height/2, 3, 0, 2 * Math.PI);
    flatContext.stroke(); 
  }


  // Animation function
  function render() {
    drawTunnel(gl, tunnelProgram, tunnel_buffers, tunnel_texture);
    drawObstacles(gl, obstacleProgram, obstacle_buffers);

    if (!konec) {
      requestAnimationFrame(render);
    } else {
      requestAnimationFrame(renderIntro);
    }
  }

  function renderIntro() {
    drawIntro(gl, tunnelProgram, intro_buffers, intro_texture)
    if (konec) {
      requestAnimationFrame(renderIntro);
    } else {
      requestAnimationFrame(render);
    }
  }

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
    -1.5, 0.33, -tunnelSegmentLength+0.25,
    -1.5, -1.5, -tunnelSegmentLength+0.25,
    1.5, -1.5, -tunnelSegmentLength+0.25,
    1.5, 0.33, -tunnelSegmentLength+0.25,
    // Top hole back face
    -1.5, 0.33, -tunnelSegmentLength,
    -1.5, -1.5, -tunnelSegmentLength,
    1.5, -1.5, -tunnelSegmentLength,
    1.5, 0.33, -tunnelSegmentLength,
    // Top hole top face
    -1.5, 0.33, -tunnelSegmentLength,
    -1.5, 0.33, -tunnelSegmentLength+0.25,
    1.5, 0.33, -tunnelSegmentLength+0.25,
    1.5, 0.33, -tunnelSegmentLength,

    // Bottom hole front face
    -1.5, 1.5, -tunnelSegmentLength+0.25,
    -1.5, -0.33, -tunnelSegmentLength+0.25,
    1.5, -0.33, -tunnelSegmentLength+0.25,
    1.5, 1.5, -tunnelSegmentLength+0.25,
    // Bottom hole back face
    -1.5, 1.5, -tunnelSegmentLength,
    -1.5, -0.33, -tunnelSegmentLength,
    1.5, -0.33, -tunnelSegmentLength,
    1.5, 1.5, -tunnelSegmentLength,
    // Bottom hole bottom face
    -1.5, -0.33, -tunnelSegmentLength,
    -1.5, -0.33, -tunnelSegmentLength+0.25,
    1.5, -0.33, -tunnelSegmentLength+0.25,
    1.5, -0.33, -tunnelSegmentLength,
    
    // Right hole front face
    -1.5, 1.5, -tunnelSegmentLength+0.25,
    -1.5, -1.5, -tunnelSegmentLength+0.25,
    0.33, -1.5, -tunnelSegmentLength+0.25,
    0.33, 1.5, -tunnelSegmentLength+0.25,
    // Right hole back face
    -1.5, 1.5, -tunnelSegmentLength,
    -1.5, -1.5, -tunnelSegmentLength,
    0.33, -1.5, -tunnelSegmentLength,
    0.33, 1.5, -tunnelSegmentLength,
    // Right hole right face
    0.33, 1.5, -tunnelSegmentLength,
    0.33, 1.5, -tunnelSegmentLength+0.25,
    0.33, -1.5, -tunnelSegmentLength+0.25,
    0.33, -1.5, -tunnelSegmentLength,
    
    // Left hole front face
    -0.33, 1.5, -tunnelSegmentLength+0.25,
    -0.33, -1.5, -tunnelSegmentLength+0.25,
    1.5, -1.5, -tunnelSegmentLength+0.25,
    1.5, 1.5, -tunnelSegmentLength+0.25,
    // Left hole front face
    -0.33, 1.5, -tunnelSegmentLength,
    -0.33, -1.5, -tunnelSegmentLength,
    1.5, -1.5, -tunnelSegmentLength,
    1.5, 1.5, -tunnelSegmentLength,
    // Left hole front face
    -0.33, -1.5, -tunnelSegmentLength,
    -0.33, -1.5, -tunnelSegmentLength+0.25,
    -0.33, 1.5, -tunnelSegmentLength+0.25,
    -0.33, 1.5, -tunnelSegmentLength,

    // Horizontal hole top front
    -1.5, 1.5, -tunnelSegmentLength+0.25,
    -1.5, 0.33, -tunnelSegmentLength+0.25,
    1.5, 0.33, -tunnelSegmentLength+0.25,
    1.5, 1.5, -tunnelSegmentLength+0.25,
    // Horizontal hole top back
    -1.5, 1.5, -tunnelSegmentLength,
    -1.5, 0.33, -tunnelSegmentLength,
    1.5, 0.33, -tunnelSegmentLength,
    1.5, 1.5, -tunnelSegmentLength,
    // Horizontal hole top cover
    -1.5, 0.33, -tunnelSegmentLength,
    -1.5, 0.33, -tunnelSegmentLength+0.25,
    1.5, 0.33, -tunnelSegmentLength+0.25,
    1.5, 0.33, -tunnelSegmentLength,
    // Horizontal hole bottom front
    -1.5, -1.5, -tunnelSegmentLength+0.25,
    -1.5, -0.33, -tunnelSegmentLength+0.25,
    1.5, -0.33, -tunnelSegmentLength+0.25,
    1.5, -1.5, -tunnelSegmentLength+0.25,
    // Horizontal hole bottom back
    -1.5, -1.5, -tunnelSegmentLength,
    -1.5, -0.33, -tunnelSegmentLength,
    1.5, -0.33, -tunnelSegmentLength,
    1.5, -1.5, -tunnelSegmentLength,
    // Horizontal hole bottom cover
    -1.5, -0.33, -tunnelSegmentLength,
    -1.5, -0.33, -tunnelSegmentLength+0.25,
    1.5, -0.33, -tunnelSegmentLength+0.25,
    1.5, -0.33, -tunnelSegmentLength,

    // Vertical hole left front
    -1.5, 1.5, -tunnelSegmentLength+0.25,
    -1.5, -1.5, -tunnelSegmentLength+0.25,
    -0.33, -1.5, -tunnelSegmentLength+0.25,
    -0.33, 1.5, -tunnelSegmentLength+0.25,
    // Vertical hole left back
    -1.5, 1.5, -tunnelSegmentLength,
    -1.5, -1.5, -tunnelSegmentLength,
    -0.33, -1.5, -tunnelSegmentLength,
    -0.33, 1.5, -tunnelSegmentLength,
    // Vertical hole left cover
    -0.33, 1.5, -tunnelSegmentLength,
    -0.33, -1.5, -tunnelSegmentLength,
    -0.33, -1.5, -tunnelSegmentLength+0.25,
    -0.33, 1.5, -tunnelSegmentLength+0.25,
    // Vertical hole right front
    0.33, 1.5, -tunnelSegmentLength+0.25,
    0.33, -1.5, -tunnelSegmentLength+0.25,
    1.5, -1.5, -tunnelSegmentLength+0.25,
    1.5, 1.5, -tunnelSegmentLength+0.25,
    // Vertical hole right back
    0.33, 1.5, -tunnelSegmentLength,
    0.33, -1.5, -tunnelSegmentLength,
    1.5, -1.5, -tunnelSegmentLength,
    1.5, 1.5, -tunnelSegmentLength,
    // Vertical hole right cover
    0.33, 1.5, -tunnelSegmentLength,
    0.33, -1.5, -tunnelSegmentLength,
    0.33, -1.5, -tunnelSegmentLength+0.25,
    0.33, 1.5, -tunnelSegmentLength+0.25

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



function initIntroBuffers(gl) {

  // Create a buffer for the cube's vertex positions.

  const positionBuffer = gl.createBuffer();

  // Select the positionBuffer as the one to apply buffer
  // operations to from here out.

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  // Now create an array of positions for the cube.

  const positions = [
    // Front face
    -4.0, -3.0,  1.0,
     4.0, -3.0,  1.0,
     4.0,  3.0,  1.0,
    -4.0,  3.0,  1.0,
  ];

  // Now pass the list of positions into WebGL to build the
  // shape. We do this by creating a Float32Array from the
  // JavaScript array, then use it to fill the current buffer.

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  // Now set up the texture coordinates for the faces.

  const textureCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);

  const textureCoordinates = [
    // Front
    0.0,  1.0,
    1.0,  1.0,
    1.0,  0.0,
    0.0, 0.0
    
  ];

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates),
                gl.STATIC_DRAW);

  // Build the element array buffer; this specifies the indices
  // into the vertex arrays for each face's vertices.

  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

  // This array defines each face as two triangles, using the
  // indices into the vertex array to specify each triangle's
  // position.

  const indices = [
    0,  1,  2,      0,  2,  3,    // front
  ];

  // Now send the element array to GL
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
      new Uint16Array(indices), gl.STATIC_DRAW);

  return {
    position: positionBuffer,
    textureCoord: textureCoordBuffer,
    indices: indexBuffer,
  };
}


// Finally draws the simple scene
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

  // Tunnel collision detection
  if (Math.sqrt(Math.pow(locationX, 2) + Math.pow(locationY, 2)) > 1) {
    // Stop the game and reset game variables
    endGame();
  }

  // Obstacle collision detection
  if (locationZ >= tunnelSegmentLength-0.25) {
    
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
  locationX = 0;
  locationY = 0;
  locationZ = 0;
  xRotation = 0;
  yRotation = 0;
  // Reset obstacles
  obstacles = [Math.floor(Math.random() * 6), Math.floor(Math.random() * 6)];
  // Clear the HUD
  flatContext.clearRect(0, 0, flatContext.canvas.width, flatContext.canvas.height);
}


function drawIntro(gl, programInfo, buffers, texture) {
  gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
  gl.clearDepth(1.0);                 // Clear everything
  gl.enable(gl.DEPTH_TEST);           // Enable depth testing
  gl.depthFunc(gl.LEQUAL);            // Near things obscure far things

  // Clear the canvas before we start drawing on it.

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Create a perspective matrix, a special matrix that is
  // used to simulate the distortion of perspective in a camera.
  // Our field of view is 45 degrees, with a width/height
  // ratio that matches the display size of the canvas
  // and we only want to see objects between 0.1 units
  // and 100 units away from the camera.

  const fieldOfView = 45 * Math.PI / 180;   // in radians
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const zNear = 0.1;
  const zFar = 3*tunnelSegmentLength;
  const projectionMatrix = glMatrix.mat4.create();

  // note: glmatrix.js always has the first argument
  // as the destination to receive the result.
  glMatrix.mat4.perspective(projectionMatrix,
                   fieldOfView,
                   aspect,
                   zNear,
                   zFar);

  // Set the drawing position to the "identity" point, which is
  // the center of the scene.
  const modelViewMatrix = glMatrix.mat4.create();

  // Now move the drawing position a bit to where we want to
  // start drawing the square.

  glMatrix.mat4.translate(modelViewMatrix,     // destination matrix
                 modelViewMatrix,     // matrix to translate
                 [-0.0, 0.0, -8.0]);  // amount to translate

  // Tell WebGL how to pull out the positions from the position
  // buffer into the vertexPosition attribute
  {
    const numComponents = 3;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
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

  // Tell WebGL how to pull out the texture coordinates from
  // the texture coordinate buffer into the textureCoord attribute.
  {
    const numComponents = 2;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.textureCoord);
    gl.vertexAttribPointer(
        programInfo.attribLocations.textureCoord,
        numComponents,
        type,
        normalize,
        stride,
        offset);
    gl.enableVertexAttribArray(
        programInfo.attribLocations.textureCoord);
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

  // Specify the texture to map onto the faces.

  // Tell WebGL we want to affect texture unit 0
  gl.activeTexture(gl.TEXTURE0);

  // Bind the texture to texture unit 0
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Tell the shader we bound the texture to texture unit 0
  gl.uniform1i(programInfo.uniformLocations.uSampler, 0);

  {
    const vertexCount = 6;
    const type = gl.UNSIGNED_SHORT;
    const offset = 0;
    gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
  }

}


window.onload = main;