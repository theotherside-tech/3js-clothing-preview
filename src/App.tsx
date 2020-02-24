import React from 'react';
import { AdjectiveSearchBox } from './components/AdjectiveSearch';
import { RecommendationsCarousel} from './components/RecommendationPreviewer'
import { OutfitPreview } from './components/OutfitPreview';
import { Fabric, PerOutfitItemFabrics} from './components/modules/Fabrics';
import { AdjectiveTag} from './components/modules/Adjectives';
import { Rule} from './components/modules/Rules';
import { PerOutfitItemData, OutfitItem, OutfitItems, getName} from './components/modules/OutfitItem';
import { deserialize} from 'serialize-ts';
import { TextureLoader } from 'three';
import { Button } from "reactstrap";
import { AlertModalDialog } from './components/AlertModalDialog';
import { AddModalDialog } from './components/AddModalDialog';
import { ConfirmModalDialog } from './components/ConfirmModalDialog';
import WaterMark from './assets/images/watermark.png'
import 'bootstrap/dist/css/bootstrap.css'
import './assets/css/App.css';

class AppState {
  recommendations: PerOutfitItemFabrics[];
  adjectives: AdjectiveTag[];
  fabricLineAdjectives: AdjectiveTag[];
  fabricLineStatus: boolean[];
  fabricLineStatusChanged: boolean;
  fabrics: Fabric[];
  selectedFabrics: PerOutfitItemData<Fabric[]>;
  rules: Rule[];
  pantsMustMatchJacket: boolean;
  includeSoldOut: boolean;
  policyAddModal: boolean;
  policyAlertModal: boolean;
  policyConfirmModal: boolean;
  textures: any[];
  isRecommendationOpen: boolean;
  recommendationLoading: boolean;
  viewLoading: boolean;
  viewMode: string;
  viewFabrics: PerOutfitItemFabrics;
  modalText: string;
  alertModalType: string;
}

class App extends React.Component<{}, AppState> {
  constructor(props, state) {
    super(props, state);
    this.getRecommendations = this.getRecommendations.bind(this);
    this.handleSelectedTagsChange = this.handleSelectedTagsChange.bind(this);
    this.handlePantsMustMatchJacket = this.handlePantsMustMatchJacket.bind(this);
    this.handleIncludeSoldOut = this.handleIncludeSoldOut.bind(this);
    this.handlefabricLineChange = this.handlefabricLineChange.bind(this);
    this.setViewMode = this.setViewMode.bind(this);
    this.resetCamera = this.resetCamera.bind(this);
    this.state = {
      selectedFabrics: new PerOutfitItemData<Fabric[]>([]),
      adjectives: [],
      fabricLineAdjectives: [],
      fabricLineStatus: [],
      fabricLineStatusChanged: false,
      fabrics: [],
      rules: [],
      recommendations: [],
      pantsMustMatchJacket: false,
      includeSoldOut: false,
      policyAddModal: false,
      policyAlertModal: false,
      policyConfirmModal: false,
      modalText: "",
      alertModalType: "Alert",
      textures: [],
      isRecommendationOpen: true,
      recommendationLoading: false,
      viewLoading: false,
      viewMode: "Large",
      viewFabrics: new PerOutfitItemFabrics(),
    };    
  }
  pantsMustMatchJacket = false;
  addModalDialog: AddModalDialog;
  largeMannequinViewRef: OutfitPreview;
  recommendationsRef: RecommendationsCarousel;

  async getAllAttributes() {
    try{
      // Get all Adjective tags
      var responseAdjective = await fetch(`${process.env.REACT_APP_END_POINT_URL}/attributes`, {method: "GET"});
      var jsonAdjective = await responseAdjective.json();
      var adjectiveAttrs: AdjectiveTag[] = [];
      for (var jsonAdjectiveObj of jsonAdjective)
        adjectiveAttrs.push(deserialize(jsonAdjectiveObj, AdjectiveTag));
      console.log("Attributes => ", adjectiveAttrs);
      this.setState({adjectives: adjectiveAttrs});
    }
    catch (err) {
      this.toggleAlertModal(err.toString());
      return;
    }
  }

  async getAllFabrics() {
    try{
      //All fabrics for add attribute
      var emptyList = [];
      var responseFabric = await fetch(`${process.env.REACT_APP_END_POINT_URL}/fabrics`, {
        method: "PUT", 
        body: JSON.stringify(emptyList), 
        headers: [["accept", "text/plain"], ["Content-Type", "application/json"]]
      });
      var jsonFabrics = await responseFabric.json();
      var fabricAttrs: Fabric[] = [];
      const promises = [];
      for (var jsonFabricsObj of jsonFabrics)
      {
        var fabric = deserialize(jsonFabricsObj, Fabric);
        fabricAttrs.push(fabric);
        promises.push(fetch(`${process.env.REACT_APP_END_POINT_URL}/fabrics/${fabric.id}/attributes`, { method: "GET" }));
      }
      try {
        const results = await Promise.all(promises);
        const jsonPromises = [];
        results.forEach((result, index) => jsonPromises.push(result.json()));
        const jsonList = await Promise.all(jsonPromises);
        for (let i = 0; i<jsonList.length; i++) {
          const attributes = jsonList[i];
          for (let j = 0; j<attributes.length; j++) {
            const attribute = attributes[j];
            if(attribute.type === "FabricLine") {
              fabricAttrs[i].fabricLine = attribute.id;
            }
            else if(attribute.type === "Material") {
              fabricAttrs[i].material = attribute.id;
            }
            else if(attribute.type === "PrimaryColor") {
              fabricAttrs[i].primaryColor = attribute.id;
            }
            else if(attribute.type === "PrimaryPattern") {
              fabricAttrs[i].primaryPattern = attribute.id;
            }
            else if(attribute.type === "SecondaryColor") {
              fabricAttrs[i].secondaryColor = attribute.id;
            }
            else if(attribute.type === "SecondaryPattern") {
              fabricAttrs[i].secondaryPattern = attribute.id;
            }
          }
        }
      } catch (err) {
        this.toggleAlertModal(err.toString());
      }
      console.log("Fabrics => ", fabricAttrs);
      this.setState({fabrics: fabricAttrs});
    }
    catch (err) {
      this.toggleAlertModal(err.toString());
      return;
    }
  }

  async getAllFabricLines() {
    try{
      //Get all attributes which type is "Fabric Line"
      var responsefabricLineAdjective = await fetch(`${process.env.REACT_APP_END_POINT_URL}/attributetypes/FabricLine/attributes`, {method: "GET"});
      var jsonfabricLineAdjective = await responsefabricLineAdjective.json();
      var fabricLineAdjectiveAttrs: AdjectiveTag[] = [];
      var fabricLineStatus: boolean[] = [];
      for (var jsonfabricLineAdjectiveObj of jsonfabricLineAdjective) {
        fabricLineAdjectiveAttrs.push(deserialize(jsonfabricLineAdjectiveObj, AdjectiveTag));
        fabricLineStatus.push(false);
      }
      fabricLineStatus[fabricLineStatus.length-1] = true;
      this.setState({fabricLineAdjectives: fabricLineAdjectiveAttrs});
      console.log("Fabric Line =>", fabricLineAdjectiveAttrs);
      this.setState({fabricLineStatus});
    }
    catch (err) {
      this.toggleAlertModal(err.toString());
      return;
    }
  }

  async getAllRules() {
    try{
      //Get all rules
      var responseRules =  await fetch(`${process.env.REACT_APP_END_POINT_URL}/rules`, {method: "GET"});
      var jsonRules = await responseRules.json();
      var rules: Rule[] = [];
      for (var jsonRule of jsonRules)
      {
        var rule = new Rule();
        rule = deserialize(jsonRule, Rule);
        rule.conditionAttribute = deserialize(jsonRule.conditionAttribute, AdjectiveTag);
        rule.recommendedAttribute = deserialize(jsonRule.recommendedAttribute, AdjectiveTag);
        rules.push(rule);
      }
      this.setState({rules});
      console.log("Rules =>", rules);
    }
    catch (err) {
      this.toggleAlertModal(err.toString());
      return;
    }
  }

  async componentDidMount() {
    this.getAllAttributes();
    this.getAllFabrics();
    this.getAllFabricLines();
    this.getAllRules();
  }

  toggleAlertModal(msg: string, type: string = "Alert") {
    if (this.state.alertModalType !== "Alert")
      this.setState({ policyAlertModal: false });
    this.setState({modalText: msg});
    this.setState({alertModalType: type});
    this.setState(prevState => ({
      policyAlertModal: !prevState.policyAlertModal
    }));
  };

  confirmDelete() {
    this.addModalDialog.deleteRule();
    this.toggleConfirmModal();
  }

  toggleConfirmModal() {
    this.setState(prevState => ({
      policyConfirmModal: !prevState.policyConfirmModal
    }));
  };

  toggleAddModal() {
    this.addModalDialog.formatModalDatas();
    this.setState(prevState => ({
      policyAddModal: !prevState.policyAddModal
    }));
  }

  async getRecommendations() {
    this.setState({viewMode: "Recommendation"});
    this.setState({recommendationLoading: true});
    this.resetCamera();
    this.resetRecommendations();
    // Build the body for the new reccomendation request
    var attrs: any[] = [];
    for(var [FilterOutfitItem, Fabrics] of this.state.selectedFabrics) {
      if(!this.pantsMustMatchJacket || FilterOutfitItem !== OutfitItem.Pants) {
        if(this.state.viewFabrics.get(FilterOutfitItem)) {//selected fabrics exist
          var aTagList=[];
          aTagList.push(this.state.viewFabrics.get(FilterOutfitItem).id);
          attrs.push({Part: FilterOutfitItem, allowedFabricIds: aTagList});
        }
        else {//selected fabrics doesn't exist
          if(Fabrics.length !== 0) {//Fabrics exist
            var FabricsList=[];
            for (let attr of Fabrics)
              FabricsList.push(attr.id);
            attrs.push({Part: FilterOutfitItem, allowedFabricIds: FabricsList});
          }
          else {//Fabrics doesn't exit
            var emptyFabricList=[];
            attrs.push({Part: FilterOutfitItem, allowedFabricIds: emptyFabricList});
          }
        }      
      }
    }
    try {
      var response = await fetch(`${process.env.REACT_APP_END_POINT_URL}/recommendations/${process.env.REACT_APP_RECOMMENDATION_COUNT}?includeSoldOut=${this.state.includeSoldOut}&pantsMustMatchJacket=${this.pantsMustMatchJacket}`, {
        method: "POST", 
        body: JSON.stringify(attrs), 
        headers: [["accept", "text/plain"], ["Content-Type", "application/json"]]
      });
      var json = await response.json();
    } catch (err) {
      if(err === "SyntaxError: Unexpected end of JSON input")
        this.toggleAlertModal("No Content");
      else
        this.toggleAlertModal(err.toString());
      this.setState({recommendationLoading: false});
      return
    }    
    // Get all recommendation image
    try {
      const promises = [];
      for (var recJsonObj of json) {
        promises.push(this.promisifyLoadTexture(`${process.env.REACT_APP_END_POINT_URL}/fabrics/${recJsonObj.jacket.id}/${recJsonObj.shirt.id}/${recJsonObj.pants.id}/${recJsonObj.shoes.id}`));
      }
      const results = await Promise.all(promises);
      this.setState({textures: results});
      var recommendations: PerOutfitItemFabrics[] = [];
      json.forEach((element) => {          
        var rec = new PerOutfitItemFabrics();
        for (var si of rec.keys())
          rec.set(si, deserialize(element[getName(si).toLowerCase()], Fabric));
        recommendations.push(rec);
      });
      this.setState({recommendations});
    } catch (err) {
      this.toggleAlertModal("Recommendation rules did not find any outfits given the selected fabric line, and fabrics. Try selecting other fabrics if any are selected, changing the fabric lines allowed, or allowing sold out fabrics.");
      this.setState({recommendationLoading: false});
    }
    this.setState({recommendationLoading: false});
    if(this.recommendationsRef) {
      try{
        this.recommendationsRef.setRecommendations();
      } catch (err)
      {
        console.warn(err);
      }
    }
  }

  async setViewMode() {
    this.setState({viewMode: "Large"});
    this.setState({viewLoading: true});
    try {
      var pantsID : number = -1;      
      if(this.pantsMustMatchJacket){
        if(this.state.viewFabrics.get(OutfitItem.Jacket))
          pantsID = this.state.viewFabrics.get(OutfitItem.Jacket).id
      }
      else{
        if(this.state.viewFabrics.get(OutfitItem.Pants))
          pantsID = this.state.viewFabrics.get(OutfitItem.Pants).id
      }

      var texture = await this.promisifyLoadTexture(`${process.env.REACT_APP_END_POINT_URL}`
        + "/fabrics"
        + "/" + (this.state.viewFabrics.get(OutfitItem.Jacket) ? this.state.viewFabrics.get(OutfitItem.Jacket).id : -1)
        + "/" + (this.state.viewFabrics.get(OutfitItem.Shirt) ? this.state.viewFabrics.get(OutfitItem.Shirt).id : -1)
        + "/" + pantsID
        + "/" + (this.state.viewFabrics.get(OutfitItem.Shoes) ? this.state.viewFabrics.get(OutfitItem.Shoes).id : -1));
      this.largeMannequinViewRef.setTexture(texture);
      this.largeMannequinViewRef.updateFabrics();
    } catch (err) {
      console.warn(err);
    }
    this.setState({viewLoading: false});
  }
  
  resetCamera() {
    if(this.largeMannequinViewRef && this.state.viewMode === "Large")
      this.largeMannequinViewRef.resetCamera();      
    if(this.recommendationsRef && this.state.viewMode === "Recommendation") {
      try {
        this.recommendationsRef.resetCamera();
      } catch (err) {
        console.warn(err);
      }
    }
  }

  resetRecommendations() {
    try {
      this.recommendationsRef.resetRecommendations();
    } catch (err) {
      console.warn(err);
    }
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
      });
  }

  swatchChange(si, fabric) {
    const viewFabrics = this.state.viewFabrics;    
    viewFabrics.set(si,fabric);
    this.setState({viewFabrics});    
  }

  async handleSelectedTagsChange(part: OutfitItem, newTags) {
    // Update the selected Adjectives
    var newSelectedFabrics = this.state.selectedFabrics;
    newSelectedFabrics.set(part, newTags);
    this.setState({selectedFabrics: newSelectedFabrics});
  }

  handlePantsMustMatchJacket(event) {
    //Force jacket fabric to match pants fabric
    const target = event.target;
    const value = target.value;
    this.setState({pantsMustMatchJacket: (value === "true" ? true:false)});
    this.pantsMustMatchJacket = (value === "true" ? true:false);
    if(value === "true") {
      var newSelectedFabrics = this.state.selectedFabrics;
      newSelectedFabrics.set(OutfitItem.Pants, []);
      this.setState({selectedFabrics: newSelectedFabrics});
    }
  }

  handleIncludeSoldOut(event) {
    //Update Include Sold out Flag
    const target = event.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    this.setState({includeSoldOut: value});
  }

  handlefabricLineChange(event) {
    const target = event.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    this.state.fabricLineAdjectives.forEach((fabricLineAdjective, index) => {
      if(fabricLineAdjective.name === event.target.name) {
        const fabricLineACheckedStatus = this.state.fabricLineStatus;
        fabricLineACheckedStatus[index] = value;
        this.setState({fabricLineStatus:fabricLineACheckedStatus});
        const fabricLineStatusChanged = !this.state.fabricLineStatusChanged;
        this.setState({fabricLineStatusChanged});
      }
    })
  }

  refreshRules() {
    this.getAllRules();
  }

  refreshAttributes() {
    this.getAllAttributes();
  }

  refreshFabrics() {
    this.getAllFabrics();
  }

  removeSelectedFabric(id) {
    if (id === -1) return;
    const fabrics = this.state.fabrics.slice(0)
    for (var i=0; i<this.state.fabrics.length; i++) {
      if(this.state.fabrics[i].id === id)
      {
        fabrics.splice(i, 1);
        break;
      }
    }
    this.setState({fabrics});
  }

  removeSelectedRule(id) {
    if (id === -1) return false;
    const rules = this.state.rules.slice(0)
    for (var i=0; i<this.state.rules.length; i++) {
      if(this.state.rules[i].id === id)
      {
        rules.splice(i, 1);
        break;
      }
    }
    this.setState({rules});
  }

  render() {
    return (
      <div className="container-fluid h-100">
        <AddModalDialog 
          ref={ref => this.addModalDialog = ref} 
          policyAddModal = {this.state.policyAddModal}
          toggleAddModal = {() => { this.toggleAddModal() }}
          removeSelectedRule = {(id) => this.removeSelectedRule(id)}
          removeSelectedFabric = {(id) => this.removeSelectedFabric(id)}
          refreshRules = {() => this.refreshRules()}
          refreshFabrics = {() => this.refreshFabrics()}
          adjectives = {this.state.adjectives}
          fabrics = {this.state.fabrics}
          rules = {this.state.rules}
          fabricLines = {this.state.fabricLineAdjectives}
          toggleAlertModal = {(msg, type = "Alert") => {this.toggleAlertModal(msg, type)}}
          toggleConfirmModal = {() => {this.toggleConfirmModal()}} />
        <AlertModalDialog
          policyAlertModal = {this.state.policyAlertModal}
          toggleAlertModal = {(msg) => {this.toggleAlertModal(msg)}}
          modalText = {this.state.modalText}
          modalType = {this.state.alertModalType} />
        <ConfirmModalDialog
          policyConfirmModal = {this.state.policyConfirmModal}
          toggleConfirmModal = {() => {this.toggleConfirmModal()}}
          confirmDelete = {() => {this.confirmDelete()}} />
        <div className="row fullHeight">        
          <div className="col-9 fullHeight p-0" style={this.state.viewMode === "Recommendation" ? {display: "none"}: {}}>
            <div className="row fullHeight m-0" style={this.state.viewLoading ?{display: "none"}: {}}>
              <OutfitPreview type = {"View"} ref={ref => this.largeMannequinViewRef = ref}/>
              <img className="watermarkimg" src={WaterMark} alt="Smiley face"></img>
            </div>
            <div className="lds-circle" style={this.state.viewLoading ? {} : {display: "none"}}><div></div></div>
          </div>
          <div className="col-9 fullHeight p-0" style={this.state.viewMode === "Large" ? {display: "none"}: {}}>
            <div className="row fullHeight" style={this.state.recommendationLoading ?{display: "none"}: {}}>
              <RecommendationsCarousel 
                ref={ref => this.recommendationsRef = ref} 
                textures={this.state.textures} 
                recommendations={this.state.recommendations}/>
              <img className="watermarkimg" src={WaterMark} alt="Smiley face"></img>
            </div>            
            <div className="lds-circle" style={this.state.recommendationLoading ? {} : {display: "none"}}><div></div></div>
          </div>
          <div className="col-3 filter"> 
            <div className="row filterRow">
            <h5 className="page-title mx-auto">Fabric Lines</h5>      
            <div className="row checkBoxsRow buttonDiv">
            {
              this.state.fabricLineAdjectives.map((fabricLineAdjective, index) =>(
                <div className="col-12 pl-1" key={"fabricLine"+fabricLineAdjective.id}>
                  <input className="checkbox" type="checkbox" name={fabricLineAdjective.name||''} checked={this.state.fabricLineStatus[index] || false} onChange={this.handlefabricLineChange}/> {fabricLineAdjective.name}
                </div>))
            }   
            </div>
            <h5 className="page-title mx-auto">Outfit Type</h5>      
              <div className="buttonDiv row">
                <div className="col-8">
                  <input className="checkbox" type="radio" value="false" name="pantsMustMatchJacket" checked={!this.state.pantsMustMatchJacket} onChange={this.handlePantsMustMatchJacket}/>{' '}
                  Jacket / Pants Combo
                </div>
                <div className="col-4">
                  <input className="checkbox" type="radio" value="true" name="pantsMustMatchJacket" checked={this.state.pantsMustMatchJacket} onChange={this.handlePantsMustMatchJacket}/>{' '}
                  Suit
                </div>
              </div>
              <div className="buttonDiv">
                <input className="checkbox" type="checkbox" name="inOrOut" checked={this.state.includeSoldOut} onChange={this.handleIncludeSoldOut}/> Include Sold out
              </div>
              { 
              OutfitItems.map(si => (<AdjectiveSearchBox key={"Searchbox"+getName(si)} 
                adjectiveSuggestions = {this.state.adjectives}
                fabricSuggestions = {this.state.fabrics}
                includeSoldOut={this.state.includeSoldOut}
                pantsMustMatchJacket = {this.state.pantsMustMatchJacket}
                fabricLineAdjectives = {this.state.fabricLineAdjectives}
                fabricLineStatus = {this.state.fabricLineStatus}
                fabricLineStatusChanged = {this.state.fabricLineStatusChanged}
                onSelectionChanged = {fabric => {
                  this.swatchChange(si, fabric);
                }} 
                onChange={(tags) => this.handleSelectedTagsChange(si, tags)} 
                OutfitItem={si}/>))}              
              <div className="buttonDiv">
                <Button className="recommendationbtn" color="secondary" onClick={e => this.getRecommendations()}> Shown New Recommendations </Button>                              
              </div>
              <div className="buttonDiv">
                <Button className="viewbtn" color="secondary" onClick={e => this.setViewMode()}> View </Button>                 
                <Button className="addbtn" color="secondary" onClick={() =>this.toggleAddModal()}> Add / Edit </Button>
              </div>
            </div>     
          </div>
          <Button className="camerabtn" color="secondary" onClick={e =>this.resetCamera()}> Reset Camera</Button>
        </div>                
      </div>
    );
  }
}
export default App;