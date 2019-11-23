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


// Function for translating mouse movement to in-game movement
function updatePosition(e) {
  xRotation = adjustRotation(e.movementX, xRotation);
  yRotation = adjustRotation(e.movementY, yRotation);
}


function main() {
  const canvas = document.querySelector("#glCanvas");
  // Initialize the GL context
  const gl = canvas.getContext("webgl");

  // Only continue if WebGL is available and working
  if (gl === null) {
    alert("Unable to initialize WebGL. Your browser or machine may not support it.");
    return;
  }

  // Load textures
  const tunnel_texture = loadTexture(gl, 'tunnel_texture3.png');
  const intro_texture = loadTexture(gl, 'start_image.png');

  // Create shaders
  const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

  // Store program info
  const programInfo = {
    program: shaderProgram,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
      textureCoord: gl.getAttribLocation(shaderProgram, 'aTextureCoord'),
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
      modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
      uSampler: gl.getUniformLocation(shaderProgram, 'uSampler'),
    },
  };

  // initialize buffers
  const buffers = initBuffers(gl);
  const intro_buffers = initIntroBuffers(gl);

  //  Load intro
  renderIntro(gl, programInfo, intro_buffers, intro_texture);

  // Implement mouse tracking
  canvas.onclick = function() {
    canvas.requestPointerLock();
    document.addEventListener("mousemove", updatePosition, false);
    if (konec) {
      konec = false;
      xRotation = 0;
      yRotation = 0;
      //render();
    }
  }


  // Animation function
  function render() {
    drawScene(gl, programInfo, buffers, tunnel_texture);

    if (!konec) {
      requestAnimationFrame(render);
    } else {
      requestAnimationFrame(renderIntro);
    }
  }

  function renderIntro() {
    drawIntro(gl, programInfo, intro_buffers, intro_texture)
    if (konec) {
      requestAnimationFrame(renderIntro);
    } else {
      requestAnimationFrame(render);
    }
  }

}


// Inititalizes the neccesary buffers
function initBuffers(gl) {

  // Create a buffer for the square's positions.
  const positionBuffer = gl.createBuffer();

  // Select the positionBuffer as the one to apply buffer
  // operations to from here out.
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  // Now create an array of positions for the square.
  // Hexadecagon points
  const positions = generateTunnelSegments(10);
  tunnelSegmentLength = -positions[5];
  travelDistance = tunnelSegmentLength;
  console.log(tunnelSegmentLength);

  /*[
  //Octagon
  // Side 1
  xPoints[0], yPoints[0], 0.0,
  xPoints[0], yPoints[0], -size*16,
  yPoints[1], yPoints[1], -size*16,
  yPoints[1], yPoints[1], 0.0,
  // Side 1
  xPoints[0], yPoints[0], 0.0,
  xPoints[0], yPoints[0], -size*16,
  yPoints[1], yPoints[1], -size*16,
  yPoints[1], yPoints[1], 0.0,
  // Side 1
  xPoints[0], yPoints[0], 0.0,
  xPoints[0], yPoints[0], -size*16,
  yPoints[1], yPoints[1], -size*16,
  yPoints[1], yPoints[1], 0.0,
  // Side 1
  xPoints[0], yPoints[0], 0.0,
  xPoints[0], yPoints[0], -size*16,
  yPoints[1], yPoints[1], -size*16,
  yPoints[1], yPoints[1], 0.0,
  // Side 1
  xPoints[0], yPoints[0], 0.0,
  xPoints[0], yPoints[0], -size*16,
  yPoints[1], yPoints[1], -size*16,
  yPoints[1], yPoints[1], 0.0,
  // Side 1
  xPoints[0], yPoints[0], 0.0,
  xPoints[0], yPoints[0], -size*16,
  yPoints[1], yPoints[1], -size*16,
  yPoints[1], yPoints[1], 0.0,
  // Side 1
  xPoints[0], yPoints[0], 0.0,
  xPoints[0], yPoints[0], -size*16,
  yPoints[1], yPoints[1], -size*16,
  yPoints[1], yPoints[1], 0.0,
  // Side 1
  xPoints[0], yPoints[0], 0.0,
  xPoints[0], yPoints[0], -size*16,
  yPoints[1], yPoints[1], -size*16,
  yPoints[1], yPoints[1], 0.0,
  // Side 1
  xPoints[0], yPoints[0], 0.0,
  xPoints[0], yPoints[0], -size*16,
  yPoints[1], yPoints[1], -size*16,
  yPoints[1], yPoints[1], 0.0,
  // Side 1
  xPoints[0], yPoints[0], 0.0,
  xPoints[0], yPoints[0], -size*16,
  yPoints[1], yPoints[1], -size*16,
  yPoints[1], yPoints[1], 0.0,
  // Side 1
  xPoints[0], yPoints[0], 0.0,
  xPoints[0], yPoints[0], -size*16,
  yPoints[1], yPoints[1], -size*16,
  yPoints[1], yPoints[1], 0.0,
  // Side 1
  xPoints[0], yPoints[0], 0.0,
  xPoints[0], yPoints[0], -size*16,
  yPoints[1], yPoints[1], -size*16,
  yPoints[1], yPoints[1], 0.0,
  // Side 1
  xPoints[0], yPoints[0], 0.0,
  xPoints[0], yPoints[0], -size*16,
  yPoints[1], yPoints[1], -size*16,
  yPoints[1], yPoints[1], 0.0,
  // Side 1
  xPoints[0], yPoints[0], 0.0,
  xPoints[0], yPoints[0], -size*16,
  yPoints[1], yPoints[1], -size*16,
  yPoints[1], yPoints[1], 0.0,
  // Side 1
  xPoints[0], yPoints[0], 0.0,
  xPoints[0], yPoints[0], -size*16,
  yPoints[1], yPoints[1], -size*16,
  yPoints[1], yPoints[1], 0.0,
  // Side 1
  xPoints[0], yPoints[0], 0.0,
  xPoints[0], yPoints[0], -size*16,
  yPoints[1], yPoints[1], -size*16,
  yPoints[1], yPoints[1], 0.0,

  //Square
  /*
  // Top side
  -1.0, 1.0, 0.0,
  1.0, 1.0, 0.0,
  1.0, 1.0, -15.0,
  -1.0, 1.0, -15.0,
  // Left side
  -1.0, 1.0, 0.0,
  -1.0, 1.0, -15.0,
  -1.0, -1.0, -15.0,
  -1.0, -1.0, 0.0,
  // Bottom side
  -1.0, -1.0, 0.0,
  -1.0, -1.0, -15.0,
  1.0, -1.0, -15.0,
  1.0, -1.0, 0.0,
  // Right side
  1.0, -1.0, 0.0,
  1.0, -1.0, -15.0,
  1.0, 1.0, -15.0,
  1.0, 1.0, 0.0,

  // Top side
  -1.0, 1.0, -30.0,
  1.0, 1.0, -30.0,
  1.0, 1.0, -30.0,
  -1.0, 1.0, -30.0,
  // Left side
  -1.0, 1.0, -15.0,
  -1.0, 1.0, -30.0,
  -1.0, -1.0, -30.0,
  -1.0, -1.0, -15.0,
  // Bottom side
  -1.0, -1.0, -15.0,
  -1.0, -1.0, -30.0,
  1.0, -1.0, -30.0,
  1.0, -1.0, -15.0,
  // Right side
  1.0, -1.0, -15.0,
  1.0, -1.0, -30.0,
  1.0, 1.0, -30.0,
  1.0, 1.0, -15.0,

  // Top side
  -1.0, 1.0, -30.0,
  1.0, 1.0, -30.0,
  1.0, 1.0, -45.0,
  -1.0, 1.0, -45.0,
  // Left side
  -1.0, 1.0, -30.0,
  -1.0, 1.0, -45.0,
  -1.0, -1.0, -45.0,
  -1.0, -1.0, -30.0,
  // Bottom side
  -1.0, -1.0, -30.0,
  -1.0, -1.0, -45.0,
  1.0, -1.0, -45.0,
  1.0, -1.0, -30.0,
  // Right side
  1.0, -1.0, -30.0,
  1.0, -1.0, -45.0,
  1.0, 1.0, -45.0,
  1.0, 1.0, -30.0,
  ];
  */

  // Now pass the list of positions into WebGL to build the
  // shape. We do this by creating a Float32Array from the
  // JavaScript array, then use it to fill the current buffer.
  gl.bufferData(gl.ARRAY_BUFFER,
                new Float32Array(positions),
                gl.STATIC_DRAW);


  // Texture data
  const textureCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);

  const textureCoordinates = generateTextureCoordinates(10);
    /*[
    // Front
    0.0,  0.0,
    0.0,  1.0,
    1.0,  0.0,
    1.0,  1.0,
    // Front
    0.0,  0.0,
    0.0,  1.0,
    1.0,  0.0,
    1.0,  1.0,
    // Front
    0.0,  0.0,
    0.0,  1.0,
    1.0,  0.0,
    1.0,  1.0,
    // Front
    0.0,  0.0,
    0.0,  1.0,
    1.0,  0.0,
    1.0,  1.0,
    // Front
    0.0,  0.0,
    0.0,  1.0,
    1.0,  0.0,
    1.0,  1.0,
    // Front
    0.0,  0.0,
    0.0,  1.0,
    1.0,  0.0,
    1.0,  1.0,
    // Front
    0.0,  0.0,
    0.0,  1.0,
    1.0,  0.0,
    1.0,  1.0,
    // Front
    0.0,  0.0,
    0.0,  1.0,
    1.0,  0.0,
    1.0,  1.0,
    // Front
    0.0,  0.0,
    0.0,  1.0,
    1.0,  0.0,
    1.0,  1.0,
    // Front
    0.0,  0.0,
    0.0,  1.0,
    1.0,  0.0,
    1.0,  1.0,
    // Front
    0.0,  0.0,
    0.0,  1.0,
    1.0,  0.0,
    1.0,  1.0,
    // Front
    0.0,  0.0,
    0.0,  1.0,
    1.0,  0.0,
    1.0,  1.0,
    // Front
    0.0,  0.0,
    0.0,  1.0,
    1.0,  0.0,
    1.0,  1.0,
    // Front
    0.0,  0.0,
    0.0,  1.0,
    1.0,  0.0,
    1.0,  1.0,
    // Front
    0.0,  0.0,
    0.0,  1.0,
    1.0,  0.0,
    1.0,  1.0,
    // Front
    0.0,  0.0,
    0.0,  1.0,
    1.0,  0.0,
    1.0,  1.0,
    
  ];
  */

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates),
                gl.STATIC_DRAW);

  // Create an array of colors
  /*
  const faceColors = [
    [1.0,  1.0,  1.0,  1.0],    // Top face: white
    [1.0,  0.0,  0.0,  1.0],    // Left face: red
    [0.0,  0.0,  1.0,  1.0],    // Bottom face: blue
    [1.0,  1.0,  0.0,  1.0],    // Right face: yellow

    [0.0,  0.0,  1.0,  1.0],    // Bottom face: blue
    [1.0,  1.0,  0.0,  1.0],    // Right face: yellow
    [1.0,  1.0,  1.0,  1.0],    // Top face: white
    [1.0,  0.0,  0.0,  1.0],    // Left face: red

    [1.0,  1.0,  1.0,  1.0],    // Top face: white
    [1.0,  0.0,  0.0,  1.0],    // Left face: red
    [0.0,  0.0,  1.0,  1.0],    // Bottom face: blue
    [1.0,  1.0,  0.0,  1.0],    // Right face: yellow
  ];

  // Convert the array of colors into a table for all the vertices.
  var colors = [];

  for (var j = 0; j < faceColors.length; ++j) {
    const c = faceColors[j];

    // Repeat each color four times for the four vertices of the face
    colors = colors.concat(c, c, c, c);
  }

  const colorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
  */
  
  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

  // This array defines each face as two triangles, using the
  // indices into the vertex array to specify each triangle's
  // position.
  const indices = generateSquareIndices(16*10);
  /*[
    0,  1,  2,      0,  2,  3,    // top
    4,  5,  6,      4,  6,  7,    // back
    8,  9,  10,     8,  10, 11,   // top
    12, 13, 14,     12, 14, 15,   // bottom

    16, 17, 18,     16, 18, 19,    // top
    20, 21, 22,     20, 22, 23,    // top
    24, 25, 26,     24, 26, 27,    // top
    28, 29, 30,     28, 30, 31,    // top

    32, 33, 34,     32, 34, 35,    // top
    36, 37, 38,     36, 38, 39,    // top
    40, 41, 42,     40, 42, 43,    // top
    44, 45, 46,     44, 46, 47,    // top
  ];
  */

  // Now send the element array to GL
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
      new Uint16Array(indices), gl.STATIC_DRAW);

  return {
    position: positionBuffer,
    textureCoord: textureCoordBuffer,
    indices: indexBuffer,
  };
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
function drawScene(gl, programInfo, buffers, texture) {
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
  const fieldOfView = 60 * Math.PI / 180;   // in radians
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const zNear = 0.01;
  const zFar = tunnelSegmentLength*4;
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
  //glMatrix.mat4.translate(modelViewMatrix,     // destination matrix
  //               modelViewMatrix,     // matrix to translate
  //               [0.0, 0.0, 0.0]);  // amount to translate

  //Rotate the cube
  glMatrix.mat4.rotate(modelViewMatrix,  // destination matrix
              modelViewMatrix,  // matrix to rotate
              xRotation,   // amount to rotate in radians
              [0, 1, 0]);       // axis to rotate around

  glMatrix.mat4.rotate(modelViewMatrix,
    modelViewMatrix,
    yRotation,
    [1, 0, 0]);

  // Premikanje po tunelu
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

  // Tell WebGL how to pull out the colors from the color buffer
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
    const vertexCount = 96*10;
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
    console.log("location reset");

  }

  // Collision detection
  if (Math.sqrt(Math.pow(locationX, 2) + Math.pow(locationY, 2)) > 1) {
    konec = true;
    locationX = 0;
    locationY = 0;
    locationZ = 0;
    xRotation = 0;
    yRotation = 0;
  }

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
  const zFar = 100.0;
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