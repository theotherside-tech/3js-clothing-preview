import React from 'react';
import { TextureLoader } from 'three';
import { OutfitPreview } from './OutfitPreview';
import { AdjectiveTag } from './modules/Adjectives';
import { Fabric } from './modules/Fabrics';
import { Button } from "reactstrap";
const https = require('https');
const imageType = require('image-type');
class AddFabricState {
  fabricUrl: string;
  fabricName: string;
  fabricAppliesTo: string;
  fabricScale: number;
  isValidFabricUrl: boolean;
  isValidFabricAppliesTo: boolean;
  isValidFabricScale: boolean;
  soldOut: boolean;
  viewLoading: boolean;
  primaryColor: string;
  primaryPattern: string;
  secondaryColor: string;
  secondaryPattern: string;
  material: string;
  fabricLine: string;
}
  
class AddFabricProps {
  adjectives: AdjectiveTag[];
  fabrics: Fabric[];
  toggleAlertModal: (msg: string, type?: string) => void;
  refreshFabrics: () => void;
}
class AddFabric extends React.Component<AddFabricProps, AddFabricState> {
  constructor(props: AddFabricProps, state: AddFabricState) {
    super(props, state);
    this.handleSoldOut = this.handleSoldOut.bind(this);
    this.onChangeValueHandler = this.onChangeValueHandler.bind(this);
    this.onChangeAppliesToHandler = this.onChangeAppliesToHandler.bind(this);
    this.onScaleSliderMouseUp = this.onScaleSliderMouseUp.bind(this);
    this.onChangePrimaryColor = this.onChangePrimaryColor.bind(this);
    this.onChangePrimaryPattern = this.onChangePrimaryPattern.bind(this);
    this.onChangeSecondaryColor = this.onChangeSecondaryColor.bind(this);
    this.onChangeSecondaryPattern = this.onChangeSecondaryPattern.bind(this);
    this.onChangeMaterial = this.onChangeMaterial.bind(this);
    this.onChangeFabricLine = this.onChangeFabricLine.bind(this);
    this.onBlurImageUrl = this.onBlurImageUrl.bind(this);
    this.state = {
      fabricUrl: "",
      fabricName: "",
      fabricAppliesTo: '0',
      fabricScale: 0.3,
      soldOut: false,
      isValidFabricUrl: true,
      isValidFabricAppliesTo: true,
      isValidFabricScale: true,
      viewLoading: false,
      primaryColor: '0',
      primaryPattern: '0',
      secondaryColor: '0',
      secondaryPattern: '0',
      material: '0',
      fabricLine: '0',
    };
  }
  modalMannequin: OutfitPreview;
  handleSoldOut(e) {
    //Update Sold out Flag on Add / Edit Dialog
    const target = e.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    if (target.name === "soldout")
      this.setState({ soldOut: value });
  }
  onBlurImageUrl(e) {
    const { name } = e.target;
    if (name === "fabricUrl")
      this.refreshPreview();
  }
  onChangeValueHandler(e) {
    const { name, value } = e.target;
    if (name === "fabricUrl")
      this.setState({ fabricUrl: value });
    else if (name === "fabricName")
      this.setState({ fabricName: value });
    else if (name === "fabricScale")
      this.setState({ fabricScale: value });
    else if (name === "fabricScaleSlider")
      this.setState({ fabricScale: value });
  }
  onChangeAppliesToHandler(e) {
    const { value } = e.target;
    if (e.target.name === "outfitType")
      this.setState({ fabricAppliesTo: value });
  }
  onScaleSliderMouseUp(e) {
    this.refreshPreview();
  }
  async refreshPreview() {
    let fabricUrl = "";
    let fabricAppliesTo = 0;
    let fabricScale = 0;
    let isValidFabricUrl = false;
    let isValidFabricAppliesTo = false;
    let isValidFabricScale = false;
    if (parseInt(this.state.fabricAppliesTo) !== 0) {
      fabricAppliesTo = parseInt(this.state.fabricAppliesTo);
      isValidFabricAppliesTo = true;
    }
    this.setState({ isValidFabricAppliesTo });
    if (this.state.fabricScale > 0.001 && this.state.fabricScale <= 5) {
      fabricScale = this.state.fabricScale;
      isValidFabricScale = true;
    }
    this.setState({ isValidFabricScale });
    fabricUrl = this.state.fabricUrl;
    const proxyurl = "https://cors-anywhere.herokuapp.com/";
    try {
      await https.get(proxyurl + fabricUrl, response => {
        response.on('readable', () => {
          const chunk = response.read(imageType.minimumBytes);
          response.destroy();
          if (imageType(chunk)) {
            isValidFabricUrl = true;
            if (isValidFabricAppliesTo && isValidFabricScale) {
              this.updateModalOutfit(fabricUrl, fabricAppliesTo, fabricScale);
            }
          }
          this.setState({ isValidFabricUrl });
        });
      });
    } catch (err) {
      console.log(err.toString());
    }
  }
  async updateModalOutfit(fabricUrl, fabricAppliesTo, fabricScale) {
    let tempFabricID = -1;
    let different = false;
    this.props.fabrics.forEach(element => {
      if (element.name === "TEMP") {
        tempFabricID = element.id;
        if (element.url !== fabricUrl)
          different = true;
        if (element.appliesTo !== parseInt(fabricAppliesTo))
          different = true;
        if (element.scale !== fabricScale)
          different = true;
      }
    });
    if (!different && tempFabricID !== -1)
      return;
    if (tempFabricID === -1) {
      var temp = {
        "id": 0,
        "soldOut": false,
        "url": fabricUrl,
        "name": "TEMP",
        "appliesTo": fabricAppliesTo,
        "scale": fabricScale
      }
      var responseTemp = await fetch(`${process.env.REACT_APP_END_POINT_URL}/fabrics`,
        {
          method: "POST",
          body: JSON.stringify(temp),
          headers: [["accept", "text/plain"], ["Content-Type", "application/json"]]
        });
      let fabricID = await responseTemp.json();
      if (responseTemp.ok) {
        this.modalMannequin.setTexture('');
        this.showMannequin(fabricID, fabricAppliesTo);
      }
      else {
        this.props.toggleAlertModal("Check Again.");
      }
    }
    else {
      var updateTemp = {
        "id": 0,
        "soldOut": false,
        "url": fabricUrl,
        "name": "TEMP",
        "appliesTo": fabricAppliesTo,
        "scale": fabricScale
      }
      var responseUpdateTemp = await fetch(`${process.env.REACT_APP_END_POINT_URL}/fabrics/${tempFabricID}`,
        {
          method: "PATCH",
          body: JSON.stringify(updateTemp),
          headers: [["accept", "text/plain"], ["Content-Type", "application/json"]]
        });
      if (responseUpdateTemp.ok) {
        this.modalMannequin.setTexture('');
        this.showMannequin(tempFabricID, fabricAppliesTo);
      }
      else
        this.props.toggleAlertModal("error! Insert data again!");
    }
  }
  async showMannequin(fabricID, fabricAppliesTo) {
    this.setState({ viewLoading: true });
    try {
      var path = `${process.env.REACT_APP_END_POINT_URL}`
        + "/fabrics"
        + "/" + (fabricAppliesTo === 1 || fabricAppliesTo === 3 ? fabricID : -1)
        + "/" + (fabricAppliesTo === 4 ? fabricID : -1)
        + "/" + (fabricAppliesTo === 2 || fabricAppliesTo === 3 ? fabricID : -1)
        + "/" + (fabricAppliesTo === 8 ? fabricID : -1) + "?t=" + Math.random();
      var texture = await this.promisifyLoadTexture(path);
      this.modalMannequin.setTexture(texture);
      this.modalMannequin.updateFabrics();
    } catch (err) {
      console.warn(err);
    }
    this.setState({ viewLoading: false });
  }
  async promisifyLoadTexture(path: string): Promise<THREE.Texture> {
    var loader = new TextureLoader();
    return new Promise<THREE.Texture>((resolve, reject) => {
      loader.load(path, (texture) => {
        try {
          resolve(texture);
        } catch (ex) {
          reject(ex);
        }
      })
    });
  }
  onChangePrimaryColor(e) {
    const { value } = e.target;
    if (e.target.name === "primaryColor")
      this.setState({ primaryColor: value });
  }

  onChangePrimaryPattern(e) {
    const { value } = e.target;
    if (e.target.name === "primaryPattern")
      this.setState({ primaryPattern: value });
  }

  onChangeSecondaryColor(e) {
    const { value } = e.target;
    if (e.target.name === "secondaryColor")
      this.setState({ secondaryColor: value });
  }

  onChangeSecondaryPattern(e) {
    const { value } = e.target;
    if (e.target.name === "secondaryPattern")
      this.setState({ secondaryPattern: value });
  }

  onChangeMaterial(e) {
    const { value } = e.target;
    if (e.target.name === "material")
      this.setState({ material: value });
  }

  onChangeFabricLine(e) {
    const { value } = e.target;
    if (e.target.name === "fabricLine")
      this.setState({ fabricLine: value });
  }
  async addData() {
    if (this.state.fabricUrl === "") {
      this.props.toggleAlertModal("Insert Image URL!");
      return;
    }
    if (this.state.fabricName === "") {
      this.props.toggleAlertModal("Insert Fabric Number!");
      return;
    }
    if (parseInt(this.state.fabricAppliesTo) === 0) {
      this.props.toggleAlertModal("Select what fabric can apply to.");
      return;
    }
    if (parseInt(this.state.primaryPattern) === 0 && parseInt(this.state.fabricAppliesTo) !== 8) {
      this.props.toggleAlertModal("Select Primary Pattern.");
      return;
    }
    if (parseInt(this.state.fabricLine) === 0 && parseInt(this.state.fabricAppliesTo) !== 8) {
      this.props.toggleAlertModal("Select Fabric Line.");
      return;
    }
    if (parseInt(this.state.material) === 0 && parseInt(this.state.fabricAppliesTo) !== 8) {
      this.props.toggleAlertModal("Select Material.");
      return;
    }
    let fancyID = 0;
    this.props.adjectives.forEach(attribute => {
      if (attribute.type === "PrimaryPattern" && attribute.name === "Fancy") {
        fancyID = attribute.id;
      }
    });
    if (fancyID === parseInt(this.state.primaryPattern) && parseInt(this.state.primaryColor) === 0) {
      this.props.toggleAlertModal("Select Primary Color.");
      return;
    }
    this.props.toggleAlertModal("Adding", "loader");
    var fabric = {
      "id": 0,
      "soldOut": this.state.soldOut,
      "url": this.state.fabricUrl,
      "name": this.state.fabricName,
      "appliesTo": this.state.fabricAppliesTo,
      "scale": this.state.fabricScale
    }
    var responseFabric = await fetch(`${process.env.REACT_APP_END_POINT_URL}/fabrics`,
      {
        method: "POST",
        body: JSON.stringify(fabric),
        headers: [["accept", "text/plain"], ["Content-Type", "application/json"]]
      });
    var fabricID = await responseFabric.json();
    if (responseFabric.ok) {
      if (this.state.fabricAppliesTo === "8") {
        this.props.refreshFabrics();
        this.props.toggleAlertModal("Success");
        return;
      }
      const promises = [];
      promises.push(fetch(`${process.env.REACT_APP_END_POINT_URL}/attributes/${this.state.primaryPattern}/${fabricID}`, { method: "PATCH" }));
      promises.push(fetch(`${process.env.REACT_APP_END_POINT_URL}/attributes/${this.state.fabricLine}/${fabricID}`, { method: "PATCH" }));
      promises.push(fetch(`${process.env.REACT_APP_END_POINT_URL}/attributes/${this.state.material}/${fabricID}`, { method: "PATCH" }));
      if (parseInt(this.state.primaryColor) === 0)
        promises.push(fetch(`${process.env.REACT_APP_END_POINT_URL}/attributes/PrimaryColor/${fabricID}`, { method: "DELETE" }));
      else
        promises.push(fetch(`${process.env.REACT_APP_END_POINT_URL}/attributes/${this.state.primaryColor}/${fabricID}`, { method: "PATCH" }));
      if (parseInt(this.state.secondaryColor) === 0)
        promises.push(fetch(`${process.env.REACT_APP_END_POINT_URL}/attributes/SecondaryColor/${fabricID}`, { method: "DELETE" }));
      else
        promises.push(fetch(`${process.env.REACT_APP_END_POINT_URL}/attributes/${this.state.secondaryColor}/${fabricID}`, { method: "PATCH" }));
      if (parseInt(this.state.secondaryPattern) === 0)
        promises.push(fetch(`${process.env.REACT_APP_END_POINT_URL}/attributes/SecondaryPattern/${fabricID}`, { method: "DELETE" }));
      else
        promises.push(fetch(`${process.env.REACT_APP_END_POINT_URL}/attributes/${this.state.secondaryPattern}/${fabricID}`, { method: "PATCH" }));
      try {
        const results = await Promise.all(promises);
        if (results[0].ok) {
          this.props.refreshFabrics();
          this.props.toggleAlertModal("Success");
        }
        else
          this.props.toggleAlertModal("failure");
      } catch (err) {
        this.props.toggleAlertModal("failure");
      }
    }
    else
      this.props.toggleAlertModal("failure");
  }
  render() {
    return (
      <div className="row m-0 col-12">
        <div className="col-6">
          <div className="col-12 pb-2">
            <input type="checkbox" name="soldout" checked={this.state.soldOut} onChange={this.handleSoldOut} /> Sold out
          </div>
          <div className="col-12 pb-2">
            Image URL
            <input
              type="text"
              name="fabricUrl"
              className={this.state.isValidFabricUrl ? "form-control" : "form-control errorValue"}
              value={this.state.fabricUrl}
              onChange={this.onChangeValueHandler}
              onBlur={this.onBlurImageUrl}
              required />
          </div>
          <div className="col-12 pb-2">
            Fabric number
            <input
              type="text"
              name="fabricName"
              className="form-control"
              value={this.state.fabricName}
              onChange={this.onChangeValueHandler}
              required />
          </div>
          <div className="col-12">
            Applies To
            <select
              name="outfitType"
              className={this.state.isValidFabricAppliesTo ? "form-control" : "form-control errorValue"}
              value={this.state.fabricAppliesTo}
              onChange={this.onChangeAppliesToHandler}
            >
              <option value="0">...</option>
              <option value="4">Shirt</option>
              <option value="8">Shoes</option>
              <option value="3">Suit</option>
            </select>
          </div>
          <div className="col-12">
            Fabric Scale
            <div className="row col">
              <input
                type="text"
                pattern="[0-9]+(\.[0-9]{1,2})?"
                name="fabricScale"
                className={this.state.isValidFabricScale ? "form-control d-inline-block w-50" : "form-control d-inline-block w-50 errorValue"}
                value={this.state.fabricScale}
                onChange={this.onChangeValueHandler}
                min={0} 
                max={3}
                required
              />
              <input 
                type="range" 
                name="fabricScaleSlider" 
                onChange={this.onChangeValueHandler} 
                onMouseUp={this.onScaleSliderMouseUp}
                className={this.state.isValidFabricScale ? "custom-range d-inline-block w-50 pl-1 pt-3" : "custom-range d-inline-block w-50 pl-1 pt-3 errorValue"} 
                value={this.state.fabricScale}
                min={0} 
                max={3} 
                step={0.5} 
              />
            </div>
          </div>
          <div className="col-12">
            Primary Color
            <select
              name="primaryColor"
              className="form-control"
              value={this.state.primaryColor}
              onChange={this.onChangePrimaryColor}
            >
              <option value="0">...</option>
              {this.props.adjectives.map((attribute, index) => (attribute.type !== "PrimaryColor" ? null : <option key={index} value={attribute.id}>{attribute.name}</option>))}
            </select>
          </div>
          <div className="col-12">
            Primary Pattern
            <select
              name="primaryPattern"
              className="form-control"
              value={this.state.primaryPattern}
              onChange={this.onChangePrimaryPattern}
            >
              <option value="0">...</option>
              {this.props.adjectives.map((attribute, index) => (attribute.type !== "PrimaryPattern" ? null : <option key={index} value={attribute.id}>{attribute.name}</option>))}
            </select>
          </div>
          <div className="col-12">
            Secondary Color
            <select
              name="secondaryColor"
              className="form-control"
              value={this.state.secondaryColor}
              onChange={this.onChangeSecondaryColor}
            >
              <option value="0">...</option>
              {this.props.adjectives.map((attribute, index) => (attribute.type !== "SecondaryColor" ? null : <option key={index} value={attribute.id}>{attribute.name}</option>))}
            </select>
          </div>
          <div className="col-12">
            Secondary Pattern
            <select
              name="secondaryPattern"
              className="form-control"
              value={this.state.secondaryPattern}
              onChange={this.onChangeSecondaryPattern}
            >
              <option value="0">...</option>
              {this.props.adjectives.map((attribute, index) => (attribute.type !== "SecondaryPattern" ? null : <option key={index} value={attribute.id}>{attribute.name}</option>))}
            </select>
          </div>
          <div className="col-12">
            Material
            <select
              name="material"
              className="form-control"
              value={this.state.material}
              onChange={this.onChangeMaterial}
            >
              <option value="0">...</option>
              {this.props.adjectives.map((attribute, index) => (attribute.type !== "Material" ? null : <option key={index} value={attribute.id}>{attribute.name}</option>))}
            </select>
          </div>
          <div className="col-12">
            Fabric Line
            <select
              name="fabricLine"
              className="form-control"
              value={this.state.fabricLine}
              onChange={this.onChangeFabricLine}
            >
              <option value="0">...</option>
              {this.props.adjectives.map((attribute, index) => (attribute.type !== "FabricLine" ? null : <option key={index} value={attribute.id}>{attribute.name}</option>))}
            </select>
          </div>
        </div>
        <div className="col-6 mt-4 pr-0">
          Material Preview
          <Button color="secondary refresh-btn ml-5" onClick={() => this.refreshPreview()}> Refresh Preview</Button>
          <div className="col-12 p-0 mt-2">
            <div className="row m-0" style={this.state.viewLoading ? { display: "none" } : { height: 600 }}>
              <OutfitPreview type={"View"} ref={ref => this.modalMannequin = ref} />
            </div>
            <div className="lds-circle" style={this.state.viewLoading ? { height: 600 } : { display: "none" }}><div></div></div>
          </div>
        </div>
      </div>
    );
  }
}

export { AddFabric }