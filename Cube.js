class Cube {
    constructor(baseColor = [1, 1, 1, 1], textureIndex = -2) {
      this.type = "cube";
  
      this.matrix = new Matrix4();
  
      this.baseColor = baseColor.slice(); // make a copy
      this.textureNum = textureIndex;
  
      Cube._initCubeGeometry();
    }
  
    drawCube() {
      worldGL.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
      worldGL.uniform1i(u_whichTexture, this.textureNum);
  
      worldGL.bindBuffer(worldGL.ARRAY_BUFFER, Cube.positionBuffer);
      worldGL.vertexAttribPointer(a_Position, 3, worldGL.FLOAT, false, 0, 0);
      worldGL.enableVertexAttribArray(a_Position);
  
      worldGL.bindBuffer(worldGL.ARRAY_BUFFER, Cube.uvBuffer);
      worldGL.vertexAttribPointer(a_UV, 2, worldGL.FLOAT, false, 0, 0);
      worldGL.enableVertexAttribArray(a_UV);
  
      const rgba = this.baseColor;
      worldGL.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
  
      worldGL.drawArrays(worldGL.TRIANGLES, 0, 36);
    }
  
    static _initCubeGeometry() {
      if (Cube.positionBuffer && Cube.uvBuffer && Cube.colorBuffer) {
        return;
      }
  
      let positions = new Float32Array([
        // Front face
        0,0,0,  1,1,0,  1,0,0,
        0,0,0,  0,1,0,  1,1,0,
        // Back face
        0,0,1,  1,0,1,  1,1,1,
        0,0,1,  1,1,1,  0,1,1,
        // Left face
        0,0,0,  0,0,1,  0,1,1,
        0,0,0,  0,1,1,  0,1,0,
        // Right face
        1,0,0,  1,1,0,  1,1,1,
        1,0,0,  1,1,1,  1,0,1,
        // Top face
        0,1,0,  0,1,1,  1,1,1,
        0,1,0,  1,1,1,  1,1,0,
        // Bottom face
        0,0,0,  1,0,0,  1,0,1,
        0,0,0,  1,0,1,  0,0,1
      ]);
  
      let uvcoords = new Float32Array([
        // Front
        0,0, 1,1, 1,0,
        0,0, 0,1, 1,1,
        // Back
        0,0, 1,0, 1,1,
        0,0, 1,1, 0,1,
        // Left
        0,0, 0,1, 1,1,
        0,0, 1,1, 1,0,
        // Right
        0,0, 1,0, 1,1,
        0,0, 1,1, 0,1,
        // Top
        0,0, 0,1, 1,1,
        0,0, 1,1, 1,0,
        // Bottom
        0,0, 1,0, 1,1,
        0,0, 1,1, 0,1
      ]);
  
      Cube.positionBuffer = worldGL.createBuffer();
      worldGL.bindBuffer(worldGL.ARRAY_BUFFER, Cube.positionBuffer);
      worldGL.bufferData(worldGL.ARRAY_BUFFER, positions, worldGL.STATIC_DRAW);
  
      Cube.uvBuffer = worldGL.createBuffer();
      worldGL.bindBuffer(worldGL.ARRAY_BUFFER, Cube.uvBuffer);
      worldGL.bufferData(worldGL.ARRAY_BUFFER, uvcoords, worldGL.STATIC_DRAW);
  
      Cube.colorBuffer = worldGL.createBuffer();
      let emptyColor = new Float32Array(36 * 4);
      worldGL.bindBuffer(worldGL.ARRAY_BUFFER, Cube.colorBuffer);
      worldGL.bufferData(worldGL.ARRAY_BUFFER, emptyColor, worldGL.DYNAMIC_DRAW);
    }
  }