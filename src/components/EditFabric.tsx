import React from 'react';
import { TextureLoader } from 'three';
import { OutfitPreview } from './OutfitPreview';
import { AdjectiveTag } from './modules/Adjectives';
import { Fabric } from './modules/Fabrics';
import { Button } from "reactstrap";
import { deserialize } from 'serialize-ts';
import ReactTags from 'react-tag-autocomplete'
import { SwatchItem } from './SwatchItem'
const https = require('https');
const imageType = require('image-type');
class EditFabricState {
  isValidFabricUrl: boolean;
  isValidFabricAppliesTo: boolean;
  isValidFabricScale: boolean;
  viewLoading: boolean;
  primaryColor: string;
  primaryPattern: string;
  secondaryColor: string;
  secondaryPattern: string;
  material: string;
  fabricLine: string;
  filterType: string;
  tags: any[];
  adjectives: AdjectiveTag[];
  fabrics: Fabric[];
  attributeTypes: string[];
  adjectiveType: string;
  adjectiveName: string;
  selection: Fabric;
}
  
class EditFabricProps {
  adjectives: AdjectiveTag[];
  fabrics: Fabric[];
  removeSelectedFabric: (id: number) => void;
  toggleAlertModal: (msg: string, type?: string) => void;
  refreshFabrics: () => void;
}
class EditFabric extends React.Component<EditFabricProps, EditFabricState> {
  constructor(props: EditFabricProps, state: EditFabricState) {
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
    this.onChangeFilterTypeHandler = this.onChangeFilterTypeHandler.bind(this);
    this.onChangeValueHandler = this.onChangeValueHandler.bind(this);
    this.onBlurImageUrl = this.onBlurImageUrl.bind(this);
    this.state = {
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
      filterType: "Attribute",
      tags: [],
      attributeTypes: [],
      adjectiveType: "",
      adjectiveName: "",
      adjectives: this.props.adjectives,
      fabrics: this.props.fabrics,
      selection: null,
    };
  }
  modalMannequin: OutfitPreview;

  componentDidUpdate(prebProps) {
    if (prebProps.adjectives !== this.props.adjectives) {
      const adjectives = this.props.adjectives;
      this.setState({ adjectives });
    }
    if (prebProps.fabrics !== this.props.fabrics) {
      const fabrics = this.props.fabrics;
      this.setState({ fabrics });
    }
  }

  handleSoldOut(e) {
    //Update Sold out Flag on Add / Edit Dialog
    const target = e.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    const selection = this.state.selection;
    if (target.name === "updateSoldout")
    {
      selection.soldOut = value;
      this.setState({ selection });
    }
  }
  onChangeValueHandler(e) {
    const { name, value } = e.target;
    const selection = this.state.selection;
    if (name === "adjectiveType")
      this.setState({ adjectiveType: value });
    else if (name === "adjectiveName")
      this.setState({ adjectiveName: value });
    else if (name === "updateFabricUrl") {
      if (!selection) {
        this.props.toggleAlertModal("Select fabric.");
        return;
      }
      selection.url = value;
      this.setState({ selection });
    }
    else if (name === "updateFabricName") {
      if (!selection) {
        this.props.toggleAlertModal("Select fabric.");
        return;
      }
      selection.name = value;
      this.setState({ selection });
    }
    else if (name === "updateFabricScale") {
      if (!selection) {
        this.props.toggleAlertModal("Select fabric.");
        return;
      }
      selection.scale = value;
      this.setState({ selection });
    }
    else if (name === "updateFabricScaleSlider") {
      if (!selection) {
        this.props.toggleAlertModal("Select fabric.");
        return;
      }
      selection.scale = value;
      this.setState({ selection });
    }
  }
  onChangeAppliesToHandler(e) {
    const { value } = e.target;
    if (e.target.name === "updateOutfitType") {
      const selection = this.state.selection;
      if (!selection) {
        this.props.toggleAlertModal("Select fabric.");
        return;
      }
      selection.appliesTo = parseInt(value);
      this.setState({ selection });
    }
  }
  onScaleSliderMouseUp(e) {
    const { name } = e.target;
    const selection = this.state.selection;
    if (name === "updateFabricScaleSlider") {
      if (!selection) {
        return;
      }
    }
    this.refreshPreview();
  }
  async refreshPreview() {
    let fabricUrl = "";
    let fabricAppliesTo = 0;
    let fabricScale = 0;
    let isValidFabricUrl = false;
    let isValidFabricAppliesTo = false;
    let isValidFabricScale = false;
    if (!this.state.selection) {
      this.props.toggleAlertModal("error! Select Fabric!");
      return;
    }
    if (this.state.selection.appliesTo !== 0) {
      fabricAppliesTo = this.state.selection.appliesTo;
      isValidFabricAppliesTo = true
    }
    this.setState({ isValidFabricAppliesTo });
    if (this.state.selection.scale > 0.001 && this.state.selection.scale <= 5) {
      fabricScale = this.state.selection.scale;
      isValidFabricScale = true;
    }
    this.setState({ isValidFabricScale });
    try {
      fabricUrl = this.state.selection.url;
      const proxyurl = "https://cors-anywhere.herokuapp.com/";
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
    if (e.target.name === "updatePrimaryColor") {
      const selection = this.state.selection;
      if (!selection) {
        this.props.toggleAlertModal("Select fabric.");
        return;
      }
      selection.primaryColor = value;
      this.setState({ selection });
    }
  }

  onChangePrimaryPattern(e) {
    const { value } = e.target;
    if (e.target.name === "updatePrimaryPattern") {
      const selection = this.state.selection;
      if (!selection) {
        this.props.toggleAlertModal("Select fabric.");
        return;
      }
      selection.primaryPattern = value;
      this.setState({ selection });
    }
  }

  onChangeSecondaryColor(e) {
    const { value } = e.target;
    if (e.target.name === "updateSecondaryColor") {
      const selection = this.state.selection;
      if (!selection) {
        this.props.toggleAlertModal("Select fabric.");
        return;
      }
      selection.secondaryColor = value;
      this.setState({ selection });
    }
  }

  onChangeSecondaryPattern(e) {
    const { value } = e.target;
    if (e.target.name === "updateSecondaryPattern") {
      const selection = this.state.selection;
      if (!selection) {
        this.props.toggleAlertModal("Select fabric.");
        return;
      }
      selection.secondaryPattern = value;
      this.setState({ selection });
    }
  }

  onChangeMaterial(e) {
    const { value } = e.target;
    if (e.target.name === "updateMaterial") {
      const selection = this.state.selection;
      if (!selection) {
        this.props.toggleAlertModal("Select fabric.");
        return;
      }
      selection.material = value;
      this.setState({ selection });
    }
  }

  onChangeFabricLine(e) {
    const { value } = e.target;
    if (e.target.name === "updateFabricLine") {
      const selection = this.state.selection;
      if (!selection) {
        this.props.toggleAlertModal("Select fabric.");
        return;
      }
      selection.fabricLine = value;
      this.setState({ selection });
    }
  }


  onChangeFilterTypeHandler(e) {
    const { value } = e.target;
    this.setState({ filterType: value });
    const tags = [];
    this.setState({ tags });
    if (value === "Fabric") {
      const adjectives = this.props.adjectives;
      this.setState({ adjectives: adjectives });
      this.getFabrics(tags);
    }
    else if (value === "Attribute") {
      this.getFabrics(tags);
    }
  }

  handleDelete(i: number) {
    if (i === -1) return false;
    const tags = this.state.tags.slice(0)
    tags.splice(i, 1);
    const removedTag = this.state.tags[i];
    removedTag.name = removedTag.name.replace(removedTag.type + " : ", "");
    this.setState({ tags });
    if (this.state.filterType === "Attribute") {
      const suggestions = [].concat(this.state.adjectives, removedTag);
      this.setState({ adjectives: suggestions });
      this.getFabrics(tags);
    }
    else if (this.state.filterType === "Fabric") {
      const suggestions = [].concat(this.state.fabrics, removedTag);
      this.setState({ fabrics: suggestions });
    }
  }

  handleAddition(tag) {
    for (var existingTag of this.state.tags)
      if (existingTag.id === tag.id)
        return;
    const tags = [].concat(this.state.tags, tag);
    this.setState({ tags });
    if (this.state.filterType === "Attribute") {
      const suggestions = this.state.adjectives.filter(x => x.id !== tag.id);
      this.setState({ adjectives: suggestions });
      this.getFabrics(tags);
    }
    else if (this.state.filterType === "Fabric") {
      const suggestions = this.state.fabrics.filter(x => x.id !== tag.id);
      this.setState({ fabrics: suggestions });
    }
  }

  async deleteFabrics() {
    if (!this.state.selection) {
      this.props.toggleAlertModal("Select fabric");
      return;
    }
    this.props.toggleAlertModal("Deleting", "loader");
    try {
      var response = await fetch(`${process.env.REACT_APP_END_POINT_URL}/fabrics/${this.state.selection.id}`, {
        method: "DELETE"
      });
      if (response.ok) {
        this.props.removeSelectedFabric(this.state.selection.id);
        this.props.toggleAlertModal("Success");
      }
      else this.props.toggleAlertModal("failure");
    }
    catch (err) {
      this.props.toggleAlertModal("failure");
    }
  }

  async updateFabrics() {
    if (!this.state.selection) {
      this.props.toggleAlertModal("Select fabric");
      return;
    }
    if (this.state.selection.url === "") {
      this.props.toggleAlertModal("Insert Image URL!");
      return;
    }
    if (this.state.selection.name === "") {
      this.props.toggleAlertModal("Insert Fabric Name!");
      return;
    }
    if (this.state.selection.appliesTo === 0) {
      this.props.toggleAlertModal("Select what fabric can apply to.");
      return;
    }
    if (parseInt(this.state.selection.primaryPattern) === 0 && this.state.selection.appliesTo !== 8) {
      this.props.toggleAlertModal("Select Primary Pattern.");
      return;
    }
    if (parseInt(this.state.selection.fabricLine) === 0 && this.state.selection.appliesTo !== 8) {
      this.props.toggleAlertModal("Select Fabric Line.");
      return;
    }
    if (parseInt(this.state.selection.material) === 0 && this.state.selection.appliesTo !== 8) {
      this.props.toggleAlertModal("Select Material.");
      return;
    }
    let fancyID = 0;
    this.state.adjectives.forEach(attribute => {
      if (attribute.type === "PrimaryPattern" && attribute.name === "Fancy") {
        fancyID = attribute.id;
      }
    });
    if (fancyID === parseInt(this.state.selection.primaryPattern) && parseInt(this.state.selection.primaryColor) === 0) {
      this.props.toggleAlertModal("Select Primary Color.");
      return;
    }
    this.props.toggleAlertModal("Updating", "loader");
    var fabric = {
      "id": 0,
      "soldOut": this.state.selection.soldOut,
      "url": this.state.selection.url,
      "name": this.state.selection.name,
      "appliesTo": this.state.selection.appliesTo,
      "scale": this.state.selection.scale
    }
    var responseFabric = await fetch(`${process.env.REACT_APP_END_POINT_URL}/fabrics/${this.state.selection.id}`,
      {
        method: "PATCH",
        body: JSON.stringify(fabric),
        headers: [["accept", "text/plain"], ["Content-Type", "application/json"]]
      });
    if (responseFabric.ok) {
      if (this.state.selection.appliesTo === 8) {
        this.props.refreshFabrics();
        this.props.toggleAlertModal("Success");
        return;
      }
      const promises = [];
      promises.push(fetch(`${process.env.REACT_APP_END_POINT_URL}/attributes/${this.state.selection.primaryPattern}/${this.state.selection.id}`, { method: "PATCH" }));
      promises.push(fetch(`${process.env.REACT_APP_END_POINT_URL}/attributes/${this.state.selection.fabricLine}/${this.state.selection.id}`, { method: "PATCH" }));
      promises.push(fetch(`${process.env.REACT_APP_END_POINT_URL}/attributes/${this.state.selection.material}/${this.state.selection.id}`, { method: "PATCH" }));
      if (parseInt(this.state.selection.primaryColor) === 0)
        promises.push(fetch(`${process.env.REACT_APP_END_POINT_URL}/attributes/PrimaryColor/${this.state.selection.id}`, { method: "DELETE" }));
      else
        promises.push(fetch(`${process.env.REACT_APP_END_POINT_URL}/attributes/${this.state.selection.primaryColor}/${this.state.selection.id}`, { method: "PATCH" }));
      if (parseInt(this.state.selection.secondaryColor) === 0)
        promises.push(fetch(`${process.env.REACT_APP_END_POINT_URL}/attributes/SecondaryColor/${this.state.selection.id}`, { method: "DELETE" }));
      else
        promises.push(fetch(`${process.env.REACT_APP_END_POINT_URL}/attributes/${this.state.selection.secondaryColor}/${this.state.selection.id}`, { method: "PATCH" }));
      if (parseInt(this.state.selection.secondaryPattern) === 0)
        promises.push(fetch(`${process.env.REACT_APP_END_POINT_URL}/attributes/SecondaryPattern/${this.state.selection.id}`, { method: "DELETE" }));
      else
        promises.push(fetch(`${process.env.REACT_APP_END_POINT_URL}/attributes/${this.state.selection.secondaryPattern}/${this.state.selection.id}`, { method: "PATCH" }));
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
  
  async getFabrics(tags, includeSoldOutState = false) {
    // Get all Fabric tags
    var aTagList = [];
    for (let attr of tags)
      aTagList.push(attr.id);
    var fabricAttrs: Fabric[] = [];
    const aList = [...aTagList];
    try {
      const fabrics = await fetch(`${process.env.REACT_APP_END_POINT_URL}/fabrics?appliesTo=All`, {
        method: "PUT",
        body: JSON.stringify(aList),
        headers: [["accept", "text/plain"], ["Content-Type", "application/json"]]
      });
      const jsonFabric = await fabrics.json();
      const promises = [];
      for (var jsonFabricObj of jsonFabric) {
        var same = false;
        for (var fabricAttr of fabricAttrs) {
          if (fabricAttr.name === deserialize(jsonFabricObj, Fabric).name)
            same = true;
        }
        if (!same) {
          var fabric = deserialize(jsonFabricObj, Fabric);
          fabricAttrs.push(fabric);
          promises.push(fetch(`${process.env.REACT_APP_END_POINT_URL}/fabrics/${fabric.id}/attributes`, { method: "GET" }));
        }
      }
      try {
        const results = await Promise.all(promises);
        const jsonPromises = [];
        results.forEach((result, index) => jsonPromises.push(result.json()));
        const jsonList = await Promise.all(jsonPromises);
        for (let i = 0; i < jsonList.length; i++) {
          const attributes = jsonList[i];
          for (let j = 0; j < attributes.length; j++) {
            const attribute = attributes[j];
            if (attribute.type === "FabricLine") {
              fabricAttrs[i].fabricLine = attribute.id;
            }
            else if (attribute.type === "Material") {
              fabricAttrs[i].material = attribute.id;
            }
            else if (attribute.type === "PrimaryColor") {
              fabricAttrs[i].primaryColor = attribute.id;
            }
            else if (attribute.type === "PrimaryPattern") {
              fabricAttrs[i].primaryPattern = attribute.id;
            }
            else if (attribute.type === "SecondaryColor") {
              fabricAttrs[i].secondaryColor = attribute.id;
            }
            else if (attribute.type === "SecondaryPattern") {
              fabricAttrs[i].secondaryPattern = attribute.id;
            }
          }
        }
      } catch (err) {
        this.props.toggleAlertModal(err.toString());
      }
      this.setState({ fabrics: fabricAttrs });
    }
    catch (err) {
      console.log(err);
      return;
    }
  }

  setSelection(fabric: Fabric) {
    if (this.state.selection && this.state.selection.equals(fabric)) {
      this.setState({ selection: null });
    }
    else {
      this.setState({ selection : fabric }, this.refreshPreview);
    }
  }
  onBlurImageUrl(e) {
    const { name } = e.target;
    if (!this.state.selection) {
      return;
    }
    if (name === "updateFabricUrl")
      this.refreshPreview();
  }

  getViewTags(tags: AdjectiveTag[]) {
    var viewTags: AdjectiveTag[] = []
    tags.forEach(e => {
      viewTags.push({ ...e, name: `${e.type} : ${e.name}` });
    })
    return viewTags;
  }
  render() {
    return (
      <div className="row m-0 col-12">
        <div className="w-100">
          <div className="row pb-2 pl-3 pr-3">
            <select
              name="filterType"
              className="form-control"
              value={this.state.filterType}
              onChange={this.onChangeFilterTypeHandler}
            >
              <option value="Attribute">Filter by Attributes</option>
              <option value="Fabric">Filter by Fabric Number</option>
            </select>
          </div>
          {this.state.filterType === "Attribute" ?
            <div className="row pl-3 pr-3">
              <div className="w-100" >
                <ReactTags
                  tags={this.state.tags}
                  suggestions={this.getViewTags(this.state.adjectives)}
                  handleDelete={this.handleDelete.bind(this)}
                  handleAddition={this.handleAddition.bind(this)}
                  placeholder={`Attributes`}
                  allowNew={false}
                  autoresize={false} /><br />
              </div>
            </div>
            : null
          }
          {this.state.filterType === "Attribute" ?
            <div className="row swatchBox ml-1 mr-1">
              {
                this.state.fabrics.map(fabric => (
                  <SwatchItem
                    id={fabric.id}
                    soldOut={fabric.soldOut}
                    name={fabric.name}
                    url={fabric.url}
                    appliesTo={fabric.appliesTo}
                    scale={fabric.scale}
                    key={fabric.name}
                    selected={this.state.selection != null && this.state.selection.equals(fabric)}
                    onClick={() => {
                      this.setSelection(fabric);
                    }} />
                ))
              }
            </div>
            : null
          }
          {this.state.filterType === "Fabric" ?
            <div className="row">
              <div className="w-100" >
                <ReactTags
                  tags={this.state.tags}
                  suggestions={this.state.fabrics}
                  handleDelete={this.handleDelete.bind(this)}
                  handleAddition={this.handleAddition.bind(this)}
                  placeholder={`Fabric number`}
                  allowNew={false}
                  autoresize={false} /><br />
              </div>
            </div>
            : null
          }
          {this.state.filterType === "Fabric" ?
            <div className="row swatchBox ml-1 mr-1">
              {
                this.state.tags.length === 0 ?
                  this.state.fabrics.map(fabric => (
                    <SwatchItem
                      id={fabric.id}
                      soldOut={fabric.soldOut}
                      name={fabric.name}
                      url={fabric.url}
                      appliesTo={fabric.appliesTo}
                      scale={fabric.scale}
                      key={fabric.name}
                      selected={this.state.selection != null && this.state.selection.equals(fabric)}
                      onClick={() => {
                        this.setSelection(fabric);
                      }} />
                  ))
                  :
                  this.state.tags.map(fabric => (
                    <SwatchItem
                      id={fabric.id}
                      soldOut={fabric.soldOut}
                      name={fabric.name}
                      url={fabric.url}
                      appliesTo={fabric.appliesTo}
                      scale={fabric.scale}
                      key={fabric.name}
                      selected={this.state.selection != null && this.state.selection.equals(fabric)}
                      onClick={() => {
                        this.setSelection(fabric);
                      }} />
                  ))
              }
            </div>
            : null
          }
        </div>
        <div className="col-6 ">
          <div className="col-12 pb-2">
            <input 
              type="checkbox" 
              name="updateSoldout" 
              checked={this.state.selection && this.state.selection.soldOut ? this.state.selection.soldOut : false} 
              onChange={this.handleSoldOut} 
            /> 
            Sold out
          </div>
          <div className="col-12 pb-2">
            Image URL
            <input
              type="text"
              name="updateFabricUrl"
              className={this.state.isValidFabricUrl ? "form-control" : "form-control errorValue"}
              value={this.state.selection ? this.state.selection.url : ''}
              onChange={this.onChangeValueHandler}
              onBlur={this.onBlurImageUrl}
              required
            />
          </div>
          <div className="col-12 pb-2">
            Fabric number
            <input
              type="text"
              name="updateFabricName"
              className="form-control"
              value={this.state.selection ? this.state.selection.name : ''}
              onChange={this.onChangeValueHandler}
              required
            />
          </div>
          <div className="col-12">
            Applies To
            <select
              name="updateOutfitType"
              className={this.state.isValidFabricAppliesTo ? "form-control" : "form-control errorValue"}
              value={this.state.selection ? this.state.selection.appliesTo : 0}
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
                type="number"
                name="updateFabricScale"
                className={this.state.isValidFabricScale ? "form-control d-inline-block w-50" : "form-control d-inline-block w-50 errorValue"}
                value={this.state.selection ? this.state.selection.scale : 0.3}
                onChange={this.onChangeValueHandler}
                min={0} 
                max={3} 
                required
              />
              <input 
                type="range" 
                name="updateFabricScaleSlider" 
                onChange={this.onChangeValueHandler} 
                onMouseUp={this.onScaleSliderMouseUp}
                className={this.state.isValidFabricScale ? "custom-range d-inline-block w-50 pl-1 pt-3" : "custom-range d-inline-block w-50 pl-1 pt-3 errorValue"} 
                value={this.state.selection ? this.state.selection.scale : 0.3} 
                min={0} 
                max={3} 
                step={0.5} 
              />
            </div>
            <div className="row col-6">
              
            </div>                  
          </div>
          <div className="col-12">
            Primary Color
            <select
              name="updatePrimaryColor"
              className="form-control"
              value={this.state.selection ? this.state.selection.primaryColor : 0}
              onChange={this.onChangePrimaryColor}
            >
              <option value="0">...</option>
              {this.state.adjectives.map((attribute, index) => (attribute.type !== "PrimaryColor" ? null : <option key={index} value={attribute.id}>{attribute.name}</option>))}
            </select>
          </div>
          <div className="col-12">
            Primary Pattern
            <select
              name="updatePrimaryPattern"
              className="form-control"
              value={this.state.selection ? this.state.selection.primaryPattern : 0}
              onChange={this.onChangePrimaryPattern}
            >
              <option value="0">...</option>
              {this.state.adjectives.map((attribute, index) => (attribute.type !== "PrimaryPattern" ? null : <option key={index} value={attribute.id}>{attribute.name}</option>))}
            </select>
          </div>
          <div className="col-12">
            Secondary Color
            <select
              name="updateSecondaryColor"
              className="form-control"
              value={this.state.selection ? this.state.selection.secondaryColor : 0}
              onChange={this.onChangeSecondaryColor}
            >
              <option value="0">...</option>
              {this.state.adjectives.map((attribute, index) => (attribute.type !== "SecondaryColor" ? null : <option key={index} value={attribute.id}>{attribute.name}</option>))}
            </select>
          </div>
          <div className="col-12">
            Secondary Pattern
            <select
              name="updateSecondaryPattern"
              className="form-control"
              value={this.state.selection ? this.state.selection.secondaryPattern : 0}
              onChange={this.onChangeSecondaryPattern}
            >
              <option value="0">...</option>
              {this.state.adjectives.map((attribute, index) => (attribute.type !== "SecondaryPattern" ? null : <option key={index} value={attribute.id}>{attribute.name}</option>))}
            </select>
          </div>
          <div className="col-12">
            Material
            <select
              name="updateMaterial"
              className="form-control"
              value={this.state.selection ? this.state.selection.material : 0}
              onChange={this.onChangeMaterial}
            >
              <option value="0">...</option>
              {this.state.adjectives.map((attribute, index) => (attribute.type !== "Material" ? null : <option key={index} value={attribute.id}>{attribute.name}</option>))}
            </select>
          </div>
          <div className="col-12">
            Fabric Line
            <select
              name="updateFabricLine"
              className="form-control"
              value={this.state.selection ? this.state.selection.fabricLine : 0}
              onChange={this.onChangeFabricLine}
            >
              <option value="0">...</option>
              {this.state.adjectives.map((attribute, index) => (attribute.type !== "FabricLine" ? null : <option key={index} value={attribute.id}>{attribute.name}</option>))}
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

export { EditFabric }