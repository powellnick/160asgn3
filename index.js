//Nicholas Powell
//asgn3

const VSHADER_SOURCE = `
    precision mediump float;
    attribute vec4 a_Position;
    attribute vec2 a_UV;
    varying vec2 v_UV;
    uniform mat4 u_ModelMatrix;
    uniform mat4 u_GlobalRotateMatrix;
    uniform mat4 u_ViewMatrix;
    uniform mat4 u_ProjectionMatrix;
    void main() {
        // Multiply all matrices to transform our vertex
        gl_Position = u_ProjectionMatrix
                      * u_ViewMatrix
                      * u_GlobalRotateMatrix
                      * u_ModelMatrix
                      * a_Position;

        // Pass the UV coordinate along to the fragment shader
        v_UV = a_UV;
    }
`;

const FSHADER_SOURCE = `
    precision mediump float;
    varying vec2 v_UV;
    uniform vec4 u_FragColor;

    uniform sampler2D u_Sampler0;  // dirt
    uniform sampler2D u_Sampler1;  // sky
    uniform sampler2D u_Sampler2;  // grass
    uniform sampler2D u_Sampler3;  // stone
    uniform sampler2D u_Sampler4;  // wood
    uniform sampler2D u_Sampler5;  // Iron
    uniform sampler2D u_Sampler6;  // Gold
    uniform sampler2D u_Sampler7;  // Diamond

    uniform int u_whichTexture;

    void main() {
        if (u_whichTexture == -2) {
            // plain color
            gl_FragColor = u_FragColor;
        }
        else if (u_whichTexture == -1) {
            // debugging: UV
            gl_FragColor = vec4(v_UV, 1.0, 1.0);
        }
        else if (u_whichTexture == 0) {
            gl_FragColor = texture2D(u_Sampler0, v_UV);  // grass
        }
        else if (u_whichTexture == 1) {
            gl_FragColor = texture2D(u_Sampler1, v_UV);  // sky
        }
        else if (u_whichTexture == 2) {
            gl_FragColor = texture2D(u_Sampler2, v_UV);  // dirt
        }
        else if (u_whichTexture == 3) {
            gl_FragColor = texture2D(u_Sampler3, v_UV);  // stone
        }
        else if (u_whichTexture == 4) {
            gl_FragColor = texture2D(u_Sampler4, v_UV);  // wood
        }
        else if (u_whichTexture == 5) {
            gl_FragColor = texture2D(u_Sampler5, v_UV);  // iron
        }
        else if (u_whichTexture == 6) {
            gl_FragColor = texture2D(u_Sampler6, v_UV);  // gold
        }
        else if (u_whichTexture == 7) {
            gl_FragColor = texture2D(u_Sampler7, v_UV);  // diamond
        }
        else {
            // fallback
            gl_FragColor = vec4(1.0, 0.2, 0.2, 1.0);
        }
    }
`;


let worldCanvas;
let worldGL;

let worldCamera;

let a_Position, a_UV;
let u_FragColor;
let u_ModelMatrix;
let u_ProjectionMatrix;
let u_ViewMatrix;
let u_GlobalRotateMatrix;
let u_whichTexture;

let u_Sampler0, u_Sampler1, u_Sampler2, u_Sampler3;

let globalRotX = 0;
let globalRotY = 0;
let globalRotZ = 0;

let initialTime = performance.now() / 1000.0;
let timeElapsed = 0.0;
let enableAnimation = false;
let useTextureSet = true;
let currentAngleX = 0, currentAngleY = 0;
let userStacks = new Array(32);
for (let z = 0; z < 32; z++) {
  userStacks[z] = new Array(32);
  for (let x = 0; x < 32; x++) {
    userStacks[z][x] = [];
  }
}

const terrainMap = generateRandomTerrain(32, 32);

console.log(terrainMap);

function main() {
    worldCanvas = document.getElementById('webgl');
    worldGL = worldCanvas.getContext('webgl', { preserveDrawingBuffer: true });
    if (!worldGL) {
        console.error('Unable to obtain WebGL context.');
        return;
    }
    worldGL.enable(worldGL.DEPTH_TEST);
    worldGL.clearColor(0.0, 0.0, 0.0, 1.0);

    if (!initShaders(worldGL, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.error('Shader program initialization failed.');
        return;
    }

    connectVariablesToGLSL();

    worldCamera = new Camera(worldCanvas);

    setupTextures();
    setupButtonEvents();
    document.getElementById('addBlockBtn').onclick = addBlockUnderCrosshair;
    document.getElementById('removeBlockBtn').onclick = removeBlockUnderCrosshair;
    

    document.onclick = handleKeyPress;
    document.onkeydown = handleKeyPress;
    initializeMouseDrag(worldCanvas);
    
    requestAnimationFrame(tick);
}

function updateStatusMessage(msg) {
  const msgElem = document.getElementById('statusMessage');
  if (msgElem) {
    msgElem.innerHTML = msg;
  }
}

function addContinuousButton(btnId, action) {
  let timer = null;
  const btn = document.getElementById(btnId);

  const startAction = (e) => {
    e.preventDefault();
    if (!timer) {
      action();
      timer = setInterval(action, 100); 
    }
  };

  const stopAction = (e) => {
    e.preventDefault();
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  };

  btn.addEventListener('mousedown', startAction);
  btn.addEventListener('mouseup', stopAction);
  btn.addEventListener('mouseleave', stopAction);

  btn.addEventListener('touchstart', startAction);
  btn.addEventListener('touchend', stopAction);
  btn.addEventListener('touchcancel', stopAction);
  btn.addEventListener('touchmove', (e) => e.preventDefault());
}

function setupDpad() {
  addContinuousButton('lookUpBtn', () => {
    worldCamera.lookUp();
    renderAllShapes();
  });

  addContinuousButton('lookDownBtn', () => {
    worldCamera.lookDown();
    renderAllShapes();
  });

  addContinuousButton('moveLeftBtn', () => {
    worldCamera.moveLeft();
    renderAllShapes();
  });

  addContinuousButton('moveRightBtn', () => {
    worldCamera.moveRight();
    renderAllShapes();
  });
  // ... Add more if needed ...
}

function setupButtonEvents() {
  addContinuousButton('moveForwardBtn', () => {
    worldCamera.moveForward();
    renderAllShapes();
  });

  addContinuousButton('moveBackwardBtn', () => {
    worldCamera.moveBackward();
    renderAllShapes();
  });

  addContinuousButton('moveLeftBtn', () => {
    worldCamera.moveLeft();
    renderAllShapes();
  });

  addContinuousButton('moveRightBtn', () => {
    worldCamera.moveRight();
    renderAllShapes();
  });

  addContinuousButton('panLeftBtn', () => {
    worldCamera.panLeft();
    renderAllShapes();
  });

  addContinuousButton('panRightBtn', () => {
    worldCamera.panRight();
    renderAllShapes();
  });

  addContinuousButton('lookUpBtn', () => {
    worldCamera.lookUp();
    renderAllShapes();
  });

  addContinuousButton('lookDownBtn', () => {
    worldCamera.lookDown();
    renderAllShapes();
  });
}


function getMapCellUnderCrosshair() {
  const eyeX = worldCamera.eye.elements[0];
  const eyeY = worldCamera.eye.elements[1];
  const eyeZ = worldCamera.eye.elements[2];

  let dirX = worldCamera.at.elements[0] - eyeX;
  let dirY = worldCamera.at.elements[1] - eyeY;
  let dirZ = worldCamera.at.elements[2] - eyeZ;

  const len = Math.sqrt(dirX*dirX + dirY*dirY + dirZ*dirZ);
  if (len > 1e-6) {
    dirX /= len;
    dirY /= len;
    dirZ /= len;
  }

  const distance = 4.0;
  const hitX = eyeX + dirX * distance;
  const hitZ = eyeZ + dirZ * distance;

  let mapX = Math.floor(hitX + 4);
  let mapZ = Math.floor(hitZ + 4);

  return { mapX, mapZ };
}

function addBlockUnderCrosshair() {
    const { mapX, mapZ } = getMapCellUnderCrosshair();
    if (mapX < 0 || mapX >= 32 || mapZ < 0 || mapZ >= 32) {
      updateStatusMessage("Cannot add block; out of bounds!");
      return;
    }
  
    let selected = document.getElementById('blockTypeSelect');
    let chosenTex = parseInt(selected.value); 
    userStacks[mapZ][mapX].push(chosenTex);
  
    updateStatusMessage("");
    renderAllShapes();
  }

  function removeBlockUnderCrosshair() {
    const { mapX, mapZ } = getMapCellUnderCrosshair();
    if (mapX < 0 || mapX >= 32 || mapZ < 0 || mapZ >= 32) {
      updateStatusMessage("Cannot remove block; out of bounds!");
      return;
    }
  
    let stack = userStacks[mapZ][mapX];
    if (stack.length > 0) {
      stack.pop();
    } else {
      if (terrainMap[mapZ][mapX] > 0) {
        terrainMap[mapZ][mapX]--;
      }
    }
    updateStatusMessage("");
    renderAllShapes();
  }


function generateRandomTerrain(rows, cols) {
    let terrain = [];

    for (let i = 0; i < rows; i++) {
        let row = [];
        for (let j = 0; j < cols; j++) {
            if (i === 0) {
                row.push(0);
            } else {
                row.push(Math.random() < 0.1 ? 2 : 0); // 10% chance of dirt
            }
        }
        terrain.push(row);
    }

    return terrain;
} 

function connectVariablesToGLSL() {
    a_Position = worldGL.getAttribLocation(worldGL.program, 'a_Position');
    a_UV       = worldGL.getAttribLocation(worldGL.program, 'a_UV');

    u_FragColor          = worldGL.getUniformLocation(worldGL.program, 'u_FragColor');
    u_ModelMatrix        = worldGL.getUniformLocation(worldGL.program, 'u_ModelMatrix');
    u_ProjectionMatrix   = worldGL.getUniformLocation(worldGL.program, 'u_ProjectionMatrix');
    u_ViewMatrix         = worldGL.getUniformLocation(worldGL.program, 'u_ViewMatrix');
    u_GlobalRotateMatrix = worldGL.getUniformLocation(worldGL.program, 'u_GlobalRotateMatrix');
    u_whichTexture       = worldGL.getUniformLocation(worldGL.program, 'u_whichTexture');

    u_Sampler0 = worldGL.getUniformLocation(worldGL.program, 'u_Sampler0');
    u_Sampler1 = worldGL.getUniformLocation(worldGL.program, 'u_Sampler1');
    u_Sampler2 = worldGL.getUniformLocation(worldGL.program, 'u_Sampler2');
    u_Sampler3 = worldGL.getUniformLocation(worldGL.program, 'u_Sampler3');
    u_Sampler4 = worldGL.getUniformLocation(worldGL.program, 'u_Sampler4');
    u_Sampler5 = worldGL.getUniformLocation(worldGL.program, 'u_Sampler5');
    u_Sampler6 = worldGL.getUniformLocation(worldGL.program, 'u_Sampler6');
    u_Sampler7 = worldGL.getUniformLocation(worldGL.program, 'u_Sampler7');

    let identityMatrix = new Matrix4();
    worldGL.uniformMatrix4fv(u_ModelMatrix, false, identityMatrix.elements);
}

function setupTextures() {
    let img0 = new Image(); // dirt
    let img1 = new Image(); // sky
    let img2 = new Image(); // grass
    let img3 = new Image(); // stone
    let img4 = new Image(); // wood
    let img5 = new Image(); // iron
    let img6 = new Image(); // gold
    let img7 = new Image(); // diamond

    img0.onload = () => pushImageToTextureUnit(img0, 0);
    img1.onload = () => pushImageToTextureUnit(img1, 1);
    img2.onload = () => pushImageToTextureUnit(img2, 2);
    img3.onload = () => pushImageToTextureUnit(img3, 3);
    img4.onload = () => pushImageToTextureUnit(img4, 4);
    img5.onload = () => pushImageToTextureUnit(img5, 5);
    img6.onload = () => pushImageToTextureUnit(img6, 6);
    img7.onload = () => pushImageToTextureUnit(img7, 7);

    img0.src = 'dirt.png';
    img1.src = 'sky.png';
    img2.src = 'grass.png';
    img3.src = 'stone.png';
    img4.src = 'wood.png';
    img5.src = 'iron.png';
    img6.src = 'gold.png';
    img7.src = 'diamond.png';
}

function pushImageToTextureUnit(img, unitIndex) {
    let texture = worldGL.createTexture();
    if (!texture) {
        console.error('Failed to create texture object for unit ' + unitIndex);
        return;
    }
    worldGL.pixelStorei(worldGL.UNPACK_FLIP_Y_WEBGL, 1);
    worldGL.activeTexture(worldGL['TEXTURE' + unitIndex]);
    worldGL.bindTexture(worldGL.TEXTURE_2D, texture);
    worldGL.texParameteri(worldGL.TEXTURE_2D, worldGL.TEXTURE_MIN_FILTER, worldGL.LINEAR);
    worldGL.texImage2D(worldGL.TEXTURE_2D, 0, worldGL.RGB, worldGL.RGB, worldGL.UNSIGNED_BYTE, img);

    switch (unitIndex) {
      case 0: worldGL.uniform1i(u_Sampler0, 0); break;
      case 1: worldGL.uniform1i(u_Sampler1, 1); break;
      case 2: worldGL.uniform1i(u_Sampler2, 2); break;
      case 3: worldGL.uniform1i(u_Sampler3, 3); break;
      case 4: worldGL.uniform1i(u_Sampler4, 4); break;
      case 5: worldGL.uniform1i(u_Sampler5, 5); break;
      case 6: worldGL.uniform1i(u_Sampler6, 6); break;
      case 7: worldGL.uniform1i(u_Sampler7, 7); break;
    }
}
function tick() {
    timeElapsed = performance.now() / 1000.0 - initialTime;
    renderAllShapes();
    requestAnimationFrame(tick);
}

function renderAllShapes() {
    worldGL.clear(worldGL.COLOR_BUFFER_BIT | worldGL.DEPTH_BUFFER_BIT);
    let projectionMatrix = new Matrix4();
    projectionMatrix.setPerspective(90, worldCanvas.width / worldCanvas.height, 0.1, 150.0);
    worldGL.uniformMatrix4fv(u_ProjectionMatrix, false, projectionMatrix.elements);

    worldGL.uniformMatrix4fv(u_ViewMatrix, false, worldCamera.viewMatrix.elements);

    let globalMatrix = new Matrix4();
    globalMatrix.rotate(globalRotX, 1, 0, 0);
    globalMatrix.rotate(globalRotY, 0, 1, 0);
    globalMatrix.rotate(globalRotZ, 0, 0, 1);
    worldGL.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalMatrix.elements);

    drawFloorAndSky();
    drawAllTerrain();

    let frameTime = Math.round(performance.now() - (timeElapsed + initialTime)*1000);
    let fps   = frameTime ? (1000 / frameTime).toFixed(1) : '...';
    updateHTMLStats(`FrameTime: ${frameTime} ms | fps: ${fps}`);
}

function handleKeyPress(ev) {
    switch(ev.keyCode) {
        case 87: // W
            worldCamera.moveForward();
            break;
        case 83: // S
            worldCamera.moveBackward();
            break;
        case 65: // A
            worldCamera.moveLeft();
            break;
        case 68: // D
            worldCamera.moveRight();
            break;
        case 81: // Q
            worldCamera.panLeft();
            break;
        case 69: // E
            worldCamera.panRight();
            break;
        case 79: // O: Look Up
            worldCamera.lookUp();
            break;
        case 80: // P: Look Down
            worldCamera.lookDown();
            break;
        default:
            break;
    }
    renderAllShapes();
}

function initializeMouseDrag(canvasElement) {
  let isDragging = false;
  let lastX = -1, lastY = -1;

  const startDrag = (x, y) => {
    let rect = canvasElement.getBoundingClientRect();
    if (rect.left <= x && x < rect.right && rect.top <= y && y < rect.bottom) {
      isDragging = true;
      lastX = x;
      lastY = y;
    }
  };

  const moveDrag = (x, y) => {
    if (isDragging) {
      let factor = 0.3;
      let dx = factor * (x - lastX);
      let dy = factor * (y - lastY);

      globalRotY -= dx;
      globalRotX -= dy;

      globalRotX = Math.max(Math.min(globalRotX, 90), -90);

      lastX = x;
      lastY = y;
    }
  };

  const endDrag = () => {
    isDragging = false;
  };

  canvasElement.onmousedown = (e) => {
    startDrag(e.clientX, e.clientY);
  };

  canvasElement.onmousemove = (e) => {
    moveDrag(e.clientX, e.clientY);
  };

  canvasElement.onmouseup = endDrag;
  canvasElement.onmouseleave = endDrag;

  canvasElement.ontouchstart = (e) => {
    e.preventDefault();  // Prevent scrolling
    if (e.touches.length > 0) {
      let touch = e.touches[0];
      startDrag(touch.clientX, touch.clientY);
    }
  };

  canvasElement.ontouchmove = (e) => {
    e.preventDefault();  // Prevent scrolling
    if (e.touches.length > 0) {
      let touch = e.touches[0];
      moveDrag(touch.clientX, touch.clientY);
    }
  };

  canvasElement.ontouchend = (e) => {
    e.preventDefault();
    endDrag();
  };

  canvasElement.ontouchcancel = (e) => {
    e.preventDefault();
    endDrag();
  };
}


function drawFloorAndSky() {
    let ground = new Cube();
    ground.textureNum = 2;
    ground.matrix.translate(-4, -0.75, -4); 
    ground.matrix.scale(32, 0.01, 32);
    ground.drawCube();

    let sky = new Cube();
    sky.textureNum = 1;
    sky.matrix.translate(-1, 0, -1);
    sky.matrix.scale(100, 100, 100);
    sky.matrix.translate(-0.5, -0.5, -0.5);
    sky.drawCube();
}

function drawAllTerrain() {
    for (let z = 0; z < 32; z++) {
      for (let x = 0; x < 32; x++) {
        let heightValue = terrainMap[z][x];
        for (let y = 0; y < heightValue; y++) {
          let block = new Cube();
          block.textureNum = 0; // 0 or 2
          block.matrix.translate(x - 4, y - 0.75, z - 4);
          block.drawCube();
        }
  
        let stack = userStacks[z][x];
        for (let i = 0; i < stack.length; i++) {
          let userTex = stack[i];
          let userCube = new Cube();
          userCube.textureNum = userTex;
          let topY = heightValue + i;
          userCube.matrix.translate(x - 4, topY - 0.75, z - 4);
          userCube.drawCube();
        }
      }
    }
  }

function updateHTMLStats(txt) {
    let fpsElement = document.getElementById('fps');
    if (fpsElement) {
        fpsElement.innerHTML = txt;
    }
}
