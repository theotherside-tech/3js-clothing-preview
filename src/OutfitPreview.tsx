import React from 'react';
import './OutfitPreview.css';
import * as THREE from 'three';
import {OBJLoader} from 'three/examples/jsm/loaders/OBJLoader';
import {TrackballControls} from "three/examples/jsm/controls/TrackballControls";
import { TextureLoader } from 'three';
import {PerOutfitItemFabrics} from './Fabrics';
import {OutfitItem} from './OutfitItem';
import { endpointUrl } from './Consts';

abstract class BaseOutfitPreview extends React.Component<{}, {loading: boolean}> {
  constructor(clothesObjFileName, props, state) {
    super(props, state);

    this.clothesObjFileName = clothesObjFileName;
    this.render = this.render.bind(this);
    this.recenterCamera = this.recenterCamera.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.onInterval = this.onInterval.bind(this);
    this.state = {
      loading: false
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
            var bodyMat = new THREE.MeshPhysicalMaterial({color: new THREE.Color("white"), metalness: 0.3});
            obj.traverse(child => {
              if (child instanceof THREE.Mesh)
                child.material = bodyMat;
            });

            BaseOutfitPreview._bodyObj = obj;
            resolve(obj.clone(true));
          });
      } catch(ex) {
        reject(ex);
      }
    });
  }

  render() {
    return (
      <div className="OutfitPreview">
        <div className="ThreeJsViewPort" ref={ref => this.viewPort = ref} style={this.state.loading ? {display: "none"} : {}}>
          <canvas className="ViewPort" ref={ref => this.viewPortCanvas = ref}></canvas>
        </div>
        <div style={this.state.loading ? {} : {display: "none"}} className="lds-circle"><div></div></div>
      </div>
    );
  }

  async promisifyLoadTexture(path: string): Promise<THREE.Texture> {
    var loader = new TextureLoader();
      return new Promise<THREE.Texture>((resolve, reject) => {
        loader
          .load(path, (texture) => {
            try {
              resolve(texture);
            } catch (ex) {
              reject(ex);
            }
          })
      }
    );
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
        } catch(ex) {
          reject(ex);
        }
      }));
    }
    return BaseOutfitPreview.clothesObjs.get(this.clothesObjFileName).clone(true);
  }

  async componentDidMount() {
    // Set up the camera
    this.camera = new THREE.PerspectiveCamera(50, 1, 1, 10000);
    var scaleFactor = 1000/500;
    this.camera.position.set(300 / scaleFactor, 300 / scaleFactor, 500 / scaleFactor);
    this.camera.zoom = 1.8;

    // Set up the scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x909090);

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
    var width = 800;
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
    this.controls.keys = [ 65, 83, 68 ];
    this.controls.addEventListener('change', () => this.renderer.render(this.scene, this.camera));
    this.controls.enabled = true;
    this.controls.update();

    this.recenterCamera();

    // Setup resize handling
    window.addEventListener("resize", this.handleResize, false)
    this.handleResize();

    // Render the final scene
    setInterval(this.onInterval, 10);
  }

  takePicture(): string {
    return this.viewPortCanvas.toDataURL();
  }

  onInterval() { 
    this.controls.update();
    this.camera.updateProjectionMatrix();
    this.renderer.render(this.scene, this.camera);
  }

  handleResize() {
    this.camera.aspect = this.viewPort.clientWidth / this.viewPort.clientHeight;
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(this.viewPort.clientWidth, this.viewPort.clientHeight)
  }

  recenterCamera() {
    var bb = new THREE.Box3();
    bb.setFromObject(this.clothesObj);
    bb.getCenter(this.controls.target);
  }

  async updateFabrics(fabrics: PerOutfitItemFabrics) {
    this.setState({loading: true});
    var texture = await this.promisifyLoadTexture(endpointUrl 
      + "/fabric"
      + "/" + fabrics.get(OutfitItem.Jacket).id
      + "/" + fabrics.get(OutfitItem.Shirt).id
      + "/" + fabrics.get(OutfitItem.Pants).id
      + "/"  + fabrics.get(OutfitItem.Shoes).id);
    var mat = new THREE.MeshLambertMaterial({map: texture});
    this.clothesObj.traverse(child => {
      if (child instanceof THREE.Mesh && child.name !== "man_body")
          child.material = mat;
    });
    this.recenterCamera();
    this.setState({loading: false});
  }
}

class FullScaleOutfitPreview extends BaseOutfitPreview {
  constructor(props, state) {
    super("clothes_smoothed.obj", props, state);
  }
}

class MiniOutfitPreview extends BaseOutfitPreview {
  constructor(props, state) {
    super("clothes.obj", props, state);
  }
}

export {FullScaleOutfitPreview, MiniOutfitPreview};
