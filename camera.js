// camera.js

class Camera {
    constructor(canvas) {
      if (!canvas) {
        throw new Error("Camera constructor needs a valid canvas.");
      }

      this.fov = 60.0;
      this.eye = new Vector3([0.0, 2.0, 5.0]);
      this.at  = new Vector3([0.0, 2.0, 0.0]);
      this.up  = new Vector3([0.0, 1.0, 0.0]);
  
      this.viewMatrix       = new Matrix4();
      this.projectionMatrix = new Matrix4();
  
      this.updateViewMatrix();
      this.updateProjectionMatrix(canvas.width, canvas.height);
    }
  
    updateViewMatrix() {
      this.viewMatrix.setLookAt(
        this.eye.elements[0], this.eye.elements[1], this.eye.elements[2],
        this.at.elements[0],  this.at.elements[1],  this.at.elements[2],
        this.up.elements[0],  this.up.elements[1],  this.up.elements[2]
      );
    }
  
    updateProjectionMatrix(width, height) {
      const aspect = width / height;
      this.projectionMatrix.setPerspective(this.fov, aspect, 0.1, 1000.0);
    }
  
    moveForward(speed = 0.2) {
      let f = new Vector3(this.at.elements);
      f.sub(this.eye).normalize().mul(speed);
      this.eye.add(f);
      this.at.add(f);
      this.updateViewMatrix();
    }

    moveBackward(speed = 0.2) {
      let b = new Vector3(this.eye.elements);
      b.sub(this.at).normalize().mul(speed);
      this.eye.add(b);
      this.at.add(b);
      this.updateViewMatrix();
    }

    moveLeft(speed = 0.2) {
      let f = new Vector3(this.at.elements);
      f.sub(this.eye).normalize();
      let s = Vector3.cross(this.up, f);
      s.normalize().mul(speed);
      this.eye.add(s);
      this.at.add(s);
      this.updateViewMatrix();
    }

    moveRight(speed = 0.2) {
      let f = new Vector3(this.at.elements);
      f.sub(this.eye).normalize();
      let s = Vector3.cross(f, this.up);
      s.normalize().mul(speed);
      this.eye.add(s);
      this.at.add(s);
      this.updateViewMatrix();
    }

    panLeft(alpha = 5.0) {
      let f = new Vector3(this.at.elements);
      f.sub(this.eye);
      let rot = new Matrix4();
      rot.setRotate(alpha, this.up.elements[0], this.up.elements[1], this.up.elements[2]);
      let fPrime = rot.multiplyVector3(f);
      this.at.set(this.eye);
      this.at.add(fPrime);
      this.updateViewMatrix();
    }

    panRight(alpha = 5.0) {
      this.panLeft(-alpha);
    }

    lookUp(alpha = 5.0) {
        let f = new Vector3(this.at.elements);
        f.sub(this.eye);  
        let right = Vector3.cross(f, this.up);
        right.normalize();  
        let rot = new Matrix4();
        rot.setRotate(alpha, right.elements[0], right.elements[1], right.elements[2]);  
        let fPrime = rot.multiplyVector3(f);  
        this.at.set(this.eye);
        this.at.add(fPrime);  
        this.up = rot.multiplyVector3(this.up);
          this.updateViewMatrix();
      }
  
      lookDown(alpha = 5.0) {
        this.lookUp(-alpha);
      }
}
