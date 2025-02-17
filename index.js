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
    uniform sampler2D u_Sampler0;
    uniform sampler2D u_Sampler1;
    uniform sampler2D u_Sampler2;
    uniform sampler2D u_Sampler3;
    uniform int u_whichTexture;

    void main() {
        if(u_whichTexture == -2) {
            // Plain solid color
            gl_FragColor = u_FragColor;
        }
        else if(u_whichTexture == -1) {
            // Debug color: use UV as RG
            gl_FragColor = vec4(v_UV, 1.0, 1.0);
        }
        else if(u_whichTexture == 0) {
            // Use texture sampler0
            gl_FragColor = texture2D(u_Sampler0, v_UV);
        }
        else if(u_whichTexture == 1) {
            // Use texture sampler1
            gl_FragColor = texture2D(u_Sampler1, v_UV);
        }
        else if(u_whichTexture == 2) {
            // Use texture sampler2
            gl_FragColor = texture2D(u_Sampler2, v_UV);
        }
        else if(u_whichTexture == 3) {
            // Use texture sampler3
            gl_FragColor = texture2D(u_Sampler3, v_UV);
        }
        else {
            // Fallback color (bright red)
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
    document.getElementById('addBlockBtn').onclick = addBlockUnderCrosshair;
    document.getElementById('removeBlockBtn').onclick = removeBlockUnderCrosshair;

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


function getMapCellUnderCrosshair() {
  // Camera eye
  const eyeX = worldCamera.eye.elements[0];
  const eyeY = worldCamera.eye.elements[1];
  const eyeZ = worldCamera.eye.elements[2];

  // Forward direction = (at - eye)
  let dirX = worldCamera.at.elements[0] - eyeX;
  let dirY = worldCamera.at.elements[1] - eyeY;
  let dirZ = worldCamera.at.elements[2] - eyeZ;

  // Normalize
  const len = Math.sqrt(dirX*dirX + dirY*dirY + dirZ*dirZ);
  if (len > 1e-6) {
    dirX /= len;
    dirY /= len;
    dirZ /= len;
  }

  const distance = 4.0; // tweak as desired
  const hitX = eyeX + dirX * distance;
  const hitZ = eyeZ + dirZ * distance;

  let mapX = Math.floor(hitX + 4);
  let mapZ = Math.floor(hitZ + 4);

  return { mapX, mapZ };
}

function addBlockUnderCrosshair() {
  worldCamera.eye.elements[1] += 0.2;
  const { mapX, mapZ } = getMapCellUnderCrosshair();
  worldCamera.eye.elements[1] -= 0.2;

  if (mapX < 0 || mapX >= 32 || mapZ < 0 || mapZ >= 32) {
    updateStatusMessage("Cannot add block; please place within bounds!");
    return;
  }

  terrainMap[mapZ][mapX]++;
  updateStatusMessage("");
  renderAllShapes();
}

function removeBlockUnderCrosshair() {
  const { mapX, mapZ } = getMapCellUnderCrosshair();

  if (mapX < 0 || mapX >= 32 || mapZ < 0 || mapZ >= 32) {
    updateStatusMessage("Cannot remove block; aim within bounds!");
    return;
  }

  if (terrainMap[mapZ][mapX] > 0) {
    terrainMap[mapZ][mapX]--;
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

    let identityMatrix = new Matrix4();
    worldGL.uniformMatrix4fv(u_ModelMatrix, false, identityMatrix.elements);
}

function setupTextures() {
    let image0 = new Image();
    let image1 = new Image();
    let image2 = new Image();

    image0.onload = () => { pushImageToTextureUnit(image0, 0); };
    image1.onload = () => { pushImageToTextureUnit(image1, 1); };
    image2.onload = () => { pushImageToTextureUnit(image2, 2); };

    if (useTextureSet) {
        image0.src = 'dirt.png';   // texture #0
        image1.src = 'sky.png';   // texture #1
        image2.src = 'grass.png';   // texture #2
    }
}

function pushImageToTextureUnit(img, unitIndex) {
    let textureHandle = worldGL.createTexture();
    if (!textureHandle) {
        console.error('Failed to create texture object for unit ' + unitIndex);
        return;
    }

    worldGL.pixelStorei(worldGL.UNPACK_FLIP_Y_WEBGL, 1);
    worldGL.activeTexture(worldGL['TEXTURE' + unitIndex]);
    worldGL.bindTexture(worldGL.TEXTURE_2D, textureHandle);
    worldGL.texParameteri(worldGL.TEXTURE_2D, worldGL.TEXTURE_MIN_FILTER, worldGL.LINEAR);
    worldGL.texImage2D(worldGL.TEXTURE_2D, 0, worldGL.RGB, worldGL.RGB, worldGL.UNSIGNED_BYTE, img);

    if (unitIndex === 0) {
        worldGL.uniform1i(u_Sampler0, 0);
    } else if (unitIndex === 1) {
        worldGL.uniform1i(u_Sampler1, 1);
    } else if (unitIndex === 2) {
        worldGL.uniform1i(u_Sampler2, 2);
    } else if (unitIndex === 3) {
        worldGL.uniform1i(u_Sampler3, 3);
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
        default:
            // no-op
            break;
    }
    renderAllShapes();
}

function initializeMouseDrag(canvasElement) {
    let isDragging = false;
    let lastX = -1, lastY = -1;

    canvasElement.onmousedown = function(e) {
        let x = e.clientX, y = e.clientY;
        let rect = e.target.getBoundingClientRect();
        if (rect.left <= x && x < rect.right && rect.top <= y && y < rect.bottom) {
            isDragging = true;
            lastX = x; 
            lastY = y;
        }
    };

    canvasElement.onmouseup = function() {
        isDragging = false;
    };

    canvasElement.onmousemove = function(e) {
        if (isDragging) {
            let factor = 0.3; // Lowering sensitivity to prevent overly fast movement
            let dx = factor * (e.clientX - lastX);
            let dy = factor * (e.clientY - lastY);

            globalRotY -= dx;  // Drag left rotates right, drag right rotates left
            globalRotX -= dy;  // Drag down rotates up, drag up rotates down

            globalRotX = Math.max(Math.min(globalRotX, 90), -90);

            lastX = e.clientX;
            lastY = e.clientY;
        }
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
                if (heightValue === 0) {
                } else if (heightValue < 2) {
                    block.textureNum = 0;
                } else {
                    block.textureNum = 0;
                }
                block.matrix.translate(x - 4, y - 0.75, z - 4);
                block.drawCube();
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
