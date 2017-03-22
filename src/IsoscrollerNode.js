(function(global) {
  class IsoscrollerNode extends NIN.Node {
    constructor(id, options) {
      super(id, {
        inputs: {
          percolator: new NIN.Input()
        },
        outputs: {
          render: new NIN.TextureOutput()
        }
      });

      this.leadAnalysis = new audioAnalysisSanitizer('stem_kick.wav', 'spectral_energy', 1);
      this.circleThrob = 0;
      this.noteNumbers = 0;
      this.boxBoomScale = 1;

      this.renderTarget = new THREE.WebGLRenderTarget(640, 360, {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBFormat
      });
      //this.camera = new THREE.OrthographicCamera(-16 / 2, 16 / 2, 9 / 2, - 9 / 2, 1, 1000);
      this.camera = new THREE.PerspectiveCamera(45, 16 / 9, 1, 1000);
      this.camera.position.set(5, 10, 10);
      this.camera.lookAt(new THREE.Vector3(0, 0, 0));
      this.resize();

      this.scene = new THREE.Scene();

      this.background = new THREE.Mesh(
        new THREE.BoxGeometry(1000, 1000, 1000),
        new THREE.MeshBasicMaterial({
          color: 0xbeeb9f,
          side: THREE.BackSide
        }));
      this.scene.add(this.background);
      this.cube = new THREE.Mesh(
        new THREE.BoxGeometry(5, 0.5, 1000),
        new THREE.MeshStandardMaterial({
          color: 0x79bd8f
      }));
      this.scene.add(this.cube);

      var light = new THREE.PointLight( 0xffffff, 1, 100 );
      light.position.set( -50, -50, -50 );
      this.scene.add(light);

      var pointLight = new THREE.PointLight(0xFFFFFF);
      pointLight.position.x = 10;
      pointLight.position.y = 50;
      pointLight.position.z = 130;
      this.scene.add(pointLight);

      this.scene.add(new THREE.AmbientLight(0xffffff));

      this.boxes = [];
      this.boxShadows = [];
      for(let i = 0; i < 20; i++) {
        const box = new THREE.Mesh(
          new THREE.BoxGeometry(1, 1, 1),
          new THREE.MeshStandardMaterial({
            color: 0xffeead,
            roughness: 1,
            shading: THREE.SmoothShading
          }));
        box.position.y = 2;
        this.boxes.push(box);
        this.scene.add(box);
        const boxShadow = new THREE.Mesh(
          new THREE.BoxGeometry(1, 0.1, 1),
          new THREE.MeshStandardMaterial({
            color: 0x3c5e47,
            roughness: 1,
            shading: THREE.SmoothShading
          }));
        boxShadow.position.y = 0.21;
        this.boxShadows.push(boxShadow);
        this.scene.add(boxShadow);
      }
    }

    resize() {
      this.renderTarget.setSize(16 * GU, 9 * GU);
    }

    update(frame) {
      this.cube.scale.x = 1 + 0.02 * this.leadAnalysis.getValue(frame);

      if(BEAT && BEAN == 433) {
        this.noteNumbers = 0;
        for(let i = 0; i < this.boxes.length; i++) {
          this.boxes[i].position.z = -i * 2;
        }
        for(let i = 0; i < this.boxShadows.length; i++) {
          this.boxShadows[i].position.z = -i * 2;
        }
      }

      for(let i = 0; i < this.boxes.length; i++) {
        const box = this.boxes[i];
        this.scene.remove(box);
        box.position.z += 0.035;
        if(i <= this.noteNumbers) {
          this.scene.add(box);
        }
        const boxShadow = this.boxShadows[i];
        this.scene.remove(boxShadow);
        boxShadow.position.z += 0.035;
        if(i <= this.noteNumbers) {
          this.scene.add(boxShadow);
        }

        box.rotation.y = smoothstep(0, Math.PI / 2, (frame - 1529 + 40 - i * 3) / 10);
        if(frame == 1527) {
          this.boxBoomScale = 2;
        }
        this.boxBoomScale *= 0.999;
        if(this.boxBoomScale < 1) {
          this.boxBoomScale = 1;
        }
        box.scale.x = 1 / this.boxBoomScale;
        box.scale.y = this.boxBoomScale;
        box.scale.z = 1 / this.boxBoomScale;
      }

      this.circleThrob *= 0.93;
      if(this.circleThrob < 0.5) {
        this.circleThrob = 0.5;
      }
      if(this.inputs.percolator.getValue()) {
        this.circleThrob = 1;
        this.noteNumbers++;
      }

      const frameOffset = 1637;
      const frameOffset2 = 1882;
      const transitionTime = 60 * 60 / 130;
      const transitionTime2 = 60 * 60 / 130 / 2;
      const t = (frame - frameOffset + transitionTime) / transitionTime;
      this.camera.position.x = smoothstep(5, 0, t);
      this.camera.position.y = 10;
      this.camera.position.z = smoothstep(10, 5, t);
      if(frame > frameOffset2 - transitionTime2) {
        this.camera.position.y = smoothstep(10, 5, (frame - frameOffset2 + transitionTime2) / transitionTime2);
        this.camera.position.z = smoothstep(5, 0, (frame - frameOffset2 + transitionTime2) / transitionTime2);
      }
      this.camera.lookAt(new THREE.Vector3(0, smoothstep(0, 4, t), 0));
      this.cube.position.z = frame / 10;
    }

    render(renderer) {
      renderer.render(this.scene, this.camera, this.renderTarget, true);
      this.outputs.render.setValue(this.renderTarget.texture);
    }
  }

  global.IsoscrollerNode = IsoscrollerNode;
})(this);