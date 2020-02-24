import React from 'react';
import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { TrackballControls } from "three/examples/jsm/controls/TrackballControls";
import { PerOutfitItemFabrics } from './modules/Fabrics';
import { OutfitItem } from './modules/OutfitItem';
import '../assets/css/OutfitPreview.css';

abstract class BaseOutfitPreview extends React.Component<{type:string}, { loading: boolean, texture: any, recommendation: PerOutfitItemFabrics; }> {
  constructor(clothesObjFileName, props, state) {
    super(props, state);

    this.clothesObjFileName = clothesObjFileName;
    this.render = this.render.bind(this);
    this.recenterCamera = this.recenterCamera.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.onInterval = this.onInterval.bind(this);
    this.state = {
      loading: false,
      texture: '',
      recommendation: null
    }
  }

  viewPortCanvas: HTMLCanvasElement;
  viewPort: HTMLDivElement;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  clothesObjFileName: string;
  clothesObj: THREE.Object3D;
  controls: TrackballControls;

  static clothesObjs: Map<string, THREE.Object3D> = new Map<string, THREE.Object3D>();
  static _bodyObj: THREE.Object3D = null;
  static get bodyObj(): Promise<THREE.Object3D> {
    return new Promise<THREE.Object3D>(async (resolve, reject) => {
      if (BaseOutfitPreview._bodyObj != null)
        resolve(BaseOutfitPreview._bodyObj.clone(true));
      try {
        new OBJLoader()
          .load("smoothed_headless_man_no_low_half.obj", (obj) => {
            // Load the body mat onto the body
            var bodyMat = new THREE.MeshPhysicalMaterial({ color: new THREE.Color("white"), metalness: 0.3 });
            obj.traverse(child => {
              if (child instanceof THREE.Mesh)
                child.material = bodyMat;
            });

            BaseOutfitPreview._bodyObj = obj;
            resolve(obj.clone(true));
          });
      } catch (ex) {
        reject(ex);
      }
    });
  }

  // Load the body object (if necessary)
  async getClothesObj(): Promise<THREE.Object3D> {
    if (!BaseOutfitPreview.clothesObjs.has(this.clothesObjFileName)) {
      // Load the body object itself
      BaseOutfitPreview.clothesObjs.set(this.clothesObjFileName, await new Promise<THREE.Object3D>(async (resolve, reject) => {
        try {
          new OBJLoader()
            .load(this.clothesObjFileName, (obj) => {
              resolve(obj);
            });
        } catch (ex) {
          reject(ex);
        }
      }));
    }
    return BaseOutfitPreview.clothesObjs.get(this.clothesObjFileName).clone(true);
  }

  async componentDidMount() {
    // Set up the camera
    this.camera = new THREE.PerspectiveCamera(50, 1, 1, 10000);
    var scaleFactor = 1000 / 500;
    this.camera.position.set(300 / scaleFactor, 300 / scaleFactor, 500 / scaleFactor);
    if(this.props.type === "Recommendation")
      this.camera.zoom = 1.0;
    else
      this.camera.zoom = 1.8;

    // Set up the scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xC0C0C0);

    // Add the body into the scene
    this.scene.add(await BaseOutfitPreview.bodyObj);

    // Load the clothes object
    this.clothesObj = await this.getClothesObj();

    // Load a material onto the body
    this.scene.add(this.clothesObj);

    // Set up the lighting of the scene
    this.scene.add(new THREE.AmbientLight(0x9b9b9b));
    var light = new THREE.SpotLight(0x9b9b9b)
    light.position.set(300, 300, 300);
    this.scene.add(light);

    // Set up the render
    var width = 400;
    var height = 800;
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.viewPortCanvas,
      antialias: true,
      precision: "lowp",
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(width, height, true);
    // Set up the controls to center the camera on the target object
    this.controls = new TrackballControls(this.camera, this.renderer.domElement);
    this.controls.rotateSpeed = 5.0;
    this.controls.zoomSpeed = 4;
    this.controls.panSpeed = 0.8;
    this.controls.staticMoving = true;
    this.controls.dynamicDampingFactor = 0.3;
    this.controls.keys = [65, 83, 68];
    this.controls.addEventListener('change', () => this.renderer.render(this.scene, this.camera));
    this.controls.enabled = true;
    this.controls.update();

    this.resetCamera();

    setInterval(this.onInterval, 10);
  }

  resetRecommendations() {
    this.setState({ texture:'' });
    this.setState({recommendation: null});
  }

  resetCamera() {
    if (!this.state.texture && this.props.type === "Recommendation") {
      this.renderer.setSize(0, 0, true);
      return;
    }
    else if(this.props.type === "Recommendation") {
      this.renderer.setSize(400, 800, true);
    }

    // Set up the camera

    this.camera = new THREE.PerspectiveCamera(50, 1, 1, 10000);
    var scaleFactor = 1000 / 500;
    this.camera.position.set(300 / scaleFactor, 300 / scaleFactor, 500 / scaleFactor);
    if(this.props.type === "Recommendation")
      this.camera.zoom = 1.0;
    else
      this.camera.zoom = 1.8;
      
    // Set up the controls to center the camera on the target object

    this.controls = new TrackballControls(this.camera, this.renderer.domElement);
    this.controls.rotateSpeed = 5.0;
    this.controls.zoomSpeed = 4;
    this.controls.panSpeed = 0.8;
    this.controls.staticMoving = true;
    this.controls.dynamicDampingFactor = 0.3;
    this.controls.keys = [65, 83, 68];
    this.controls.addEventListener('change', () => this.renderer.render(this.scene, this.camera));
    this.controls.enabled = true;
    this.controls.update();
    this.recenterCamera();
    this.handleResize();
  }

  onInterval() {
    this.controls.update();
    this.camera.updateProjectionMatrix();
    this.renderer.render(this.scene, this.camera);
    if (!this.state.texture && this.props.type === "Recommendation") {
      this.renderer.setSize(0, 0, true);
      return;
    }
    this.handleResize();
  }

  handleResize() {
    if (!this.viewPort)
      return;
    try {
      this.camera.aspect = this.viewPort.clientWidth / this.viewPort.clientHeight;
      this.camera.updateProjectionMatrix()
      this.renderer.setSize(this.viewPort.clientWidth, this.viewPort.clientHeight)
    }
    catch (err) {
      console.warn(err);
    }
  }

  recenterCamera() {
    var bb = new THREE.Box3();
    bb.setFromObject(this.clothesObj);
    bb.getCenter(this.controls.target);
  }

  async setTexture(texture) {
    this.setState({ texture });
  }

  async setRecommendation(recommendation) {
    if (!this.state.texture)
      return;
    this.setState({ recommendation });
  }

  updateFabrics() {
    if (!this.state.texture)
      return;
    if (!this.clothesObj)
      return;
    this.setState({ loading: true });
    var mat = new THREE.MeshLambertMaterial({ map: this.state.texture });
    this.clothesObj.traverse(child => {
      if (child instanceof THREE.Mesh && child.name !== "man_body")
        child.material = mat;
    });
    this.setState({ loading: false });
  }

  render() {
    return (
      <div className="col p-0 OutfitPreview">
        <div className="ThreeJsViewPort" ref={ref => this.viewPort = ref} style={this.state.loading ? { display: "none" } : {}}>
          <canvas className="ViewPort" ref={ref => this.viewPortCanvas = ref}></canvas>
          {this.state.recommendation ?
            <div className="mannequinInfo">
              <div className="row mx-0 mannequinInfoItem">
                <h6 className="mannequinInfoItemText">Jacket : {this.state.recommendation.get(OutfitItem.Jacket).name}</h6>
              </div>
              <div className="row mx-0 mannequinInfoItem">
                <h6 className="mannequinInfoItemText">Shirt : {this.state.recommendation.get(OutfitItem.Shirt).name}</h6>
              </div>
              <div className="row mx-0 mannequinInfoItem">
                <h6 className="mannequinInfoItemText">Pants : {this.state.recommendation.get(OutfitItem.Pants).name}</h6>
              </div>
            </div>
            : null
          }
        </div>
        <div style={this.state.loading ? {} : { display: "none" }} className="lds-circle"><div></div></div>
      </div>
    );
  }
}

class OutfitPreview extends BaseOutfitPreview {
  constructor(props, state) {
    super("clothes_smoothed.obj", props, state);
  }
}

export { OutfitPreview };