import React from 'react';
import { Modal, ModalHeader, ModalBody, Button, ListGroup, ListGroupItem } from "reactstrap";
import { OutfitItem } from './modules/OutfitItem';
import { AdjectiveTag } from './modules/Adjectives';
import { Fabric } from './modules/Fabrics';
import { Rule } from './modules/Rules';
import { AddFabric } from './AddFabric'
import { EditFabric } from './EditFabric'

class AddModalDialogState {
  adjectives: AdjectiveTag[];
  fabrics: Fabric[];
  attributeTypes: string[];
  addType: string;
  conditionAttributeType: string;
  conditionAttribute: number;
  consequenceAttributeType: string;
  consequenceAttribute: number;
  mustBe: string;
  selectedRuleID: number;
  rules: Rule[];
}

class AddModalDilaogProps {
  policyAddModal: boolean;
  toggleAddModal: () => void;
  toggleAlertModal: (msg: string, type?: string) => void;
  toggleConfirmModal: () => void;
  removeSelectedRule: (id: number) => void;
  removeSelectedFabric: (id: number) => void;
  refreshRules: () => void;
  refreshFabrics: () => void;
  adjectives: AdjectiveTag[];
  fabrics: Fabric[];
  rules: Rule[];
  fabricLines: AdjectiveTag[];
}

class AddModalDialog extends React.Component<AddModalDilaogProps, AddModalDialogState> {
  constructor(props: AddModalDilaogProps, state: AddModalDialogState) {
    super(props, state);
    this.onChangeAddTypeHandler = this.onChangeAddTypeHandler.bind(this);
    this.onChangeRuleHandler = this.onChangeRuleHandler.bind(this);
    this.onSelectRemoveRule = this.onSelectRemoveRule.bind(this);
    this.onDeleteClicked = this.onDeleteClicked.bind(this);
    this.state = {
      attributeTypes: [],
      addType: "addFabric",
      conditionAttributeType: "",
      conditionAttribute: 0,
      consequenceAttributeType: "",
      consequenceAttribute: 0,
      mustBe: "false",
      adjectives: [],
      fabrics: [],
      selectedRuleID: -1,
      rules: [],
    };
  }
  addFabric: AddFabric;
  editFabric: EditFabric;

  componentWillReceiveProps(nextProps) {
    if (nextProps.adjectives !== this.props.adjectives) {
      const adjectives = nextProps.adjectives;
      this.setState({ adjectives });
      this.getAllAttributeType();
    }
    if (nextProps.fabrics !== this.props.fabrics) {
      const fabrics = nextProps.fabrics;
      this.setState({ fabrics });
    }
    if (nextProps.rules !== this.props.rules) {
      const rules = nextProps.rules;
      this.setState({ rules });
    }
  }

  formatModalDatas() {
    this.setState({
      mustBe: "false",
      selectedRuleID: -1,
    });
  }

  getFabricLineStr(str) {
    let fabricLineStr = str;
    for (let i = 1; i < str.length; i++) {
      if (str.charAt(i) === str.charAt(i).toUpperCase()) {
        fabricLineStr = str.replace(str.slice(0, i), str.slice(0, i) + " ");
      }
    }
    return fabricLineStr.toLowerCase();
  }

  async getAllAttributeType() {
    //Get all attribute type
    var responseAdjectiveType = await fetch(`${process.env.REACT_APP_END_POINT_URL}/attributetypes`, { method: "GET" });
    var jsonAdjectiveType = await responseAdjectiveType.json();
    var AttrTypes: string[] = [];
    for (let attrType of jsonAdjectiveType)
      AttrTypes.push(attrType);
    console.log("AttrTypes =>", AttrTypes);
    this.setState({ attributeTypes: AttrTypes });
    for (let i = 0; i < AttrTypes.length; i++) {
      if (AttrTypes[i] !== "FabricLine") {
        this.setState({ conditionAttributeType: AttrTypes[i] });
        this.setState({ consequenceAttributeType: AttrTypes[i] })
        for (let j = 0; j < this.props.adjectives.length; j++) {
          const adjective = this.props.adjectives[j];
          if (adjective.type === AttrTypes[i]) {
            this.setState({ conditionAttribute: j });
            this.setState({ consequenceAttribute: j });
            break;
          }
        }
        break;
      }
    }
  }

  onChangeAddTypeHandler(e) {
    const { value } = e.target;
    this.setState({ addType: value });
    this.formatModalDatas();
  }

  onChangeRuleHandler(e) {
    // conditionA    
    const { value } = e.target;
    if (e.target.name === "conditionAType") {
      this.setState({ conditionAttributeType: value });
      for (let i = 0; i < this.state.adjectives.length; i++) {
        const adjective = this.state.adjectives[i];
        if (adjective.type === value) {
          this.setState({ conditionAttribute: i });
          break;
        }
      }
    }
    else if (e.target.name === "conditionA")
      this.setState({ conditionAttribute: value });
    else if (e.target.name === "consequenceAType") {
      this.setState({ consequenceAttributeType: value });
      for (let i = 0; i < this.state.adjectives.length; i++) {
        const adjective = this.state.adjectives[i];
        if (adjective.type === value) {
          this.setState({ consequenceAttribute: i });
          break;
        }
      }
    }
    else if (e.target.name === "consequenceA")
      this.setState({ consequenceAttribute: value });
    else if (e.target.name === "mustBe")
      this.setState({ mustBe: value });
  }

  onSelectRemoveRule(e) {
    const target = e.target;
    this.setState({ selectedRuleID: parseInt(target.value) });
  }

  async deleteRule() {
    this.props.toggleAlertModal("Deleting", "loader");
    try {
      var response = await fetch(`${process.env.REACT_APP_END_POINT_URL}/rules/${this.state.selectedRuleID}`, {
        method: "DELETE"
      });
      if (response.ok) {
        this.props.removeSelectedRule(this.state.selectedRuleID);
        this.props.toggleAlertModal("Success");
      }
      else this.props.toggleAlertModal("failure");
    }
    catch (err) {
      this.props.toggleAlertModal("failure");
    }
  }

  onDeleteClicked() {
    this.props.toggleConfirmModal();
  }

  async addRecommendationRule() {
    this.props.toggleAlertModal("Saving", "loader");
    var conditionAttribute = (
      {
        id: this.state.adjectives[this.state.conditionAttribute].id,
        type: this.state.conditionAttributeType,
        name: this.state.adjectives[this.state.conditionAttribute].name
      }
    )

    var recommendedAttribute = (
      {
        id: this.state.adjectives[this.state.consequenceAttribute].id,
        type: this.state.consequenceAttributeType,
        name: this.state.adjectives[this.state.consequenceAttribute].name
      }
    )
    var mustBe: Boolean = false;
    if (this.state.mustBe === "true")
      mustBe = true;
    var body = (
      {
        id: 0,
        negativeRule: mustBe,
        conditionOutfitParts: OutfitItem.Jacket + OutfitItem.Pants + OutfitItem.Shirt,
        conditionAttribute: conditionAttribute,
        recommendedOutfitParts: OutfitItem.Jacket + OutfitItem.Pants + OutfitItem.Shirt,
        recommendedAttribute: recommendedAttribute
      }
    )

    try {
      var response = await fetch(`${process.env.REACT_APP_END_POINT_URL}/rules`, {
        method: "POST",
        body: JSON.stringify(body),
        headers: [["accept", "text/plain"], ["Content-Type", "application/json"]]
      });
      if (response.ok) {
        this.props.refreshRules();
        this.props.toggleAlertModal("Success");
      }
      else this.props.toggleAlertModal("failure");
    }
    catch (err) {
      if (err === "SyntaxError: Unexpected end of JSON input")
        this.props.toggleAlertModal("failure");
      else
        this.props.toggleAlertModal("failure");
      return
    }

    this.setState({ mustBe: "false" });
    const conditionAttributeType = this.state.attributeTypes[1];
    this.setState({ conditionAttributeType });
    this.setState({ consequenceAttributeType: conditionAttributeType });
  }

  async updateFabrics() {
    this.editFabric.updateFabrics();
  }

  deleteFabrics() {
    this.editFabric.deleteFabrics();
  }

  async addData() {
    this.addFabric.addData();
  }

  render() {
    return (
      <Modal
        size="xl"
        isOpen={this.props.policyAddModal}
        toggle={() => this.props.toggleAddModal()}
      >
        <ModalHeader>Add / Edit</ModalHeader>
        <ModalBody>
          <div className="container-fluid row m-0">
            <div className="row pb-3 col-12">
              <div className="col-12">
                Select Type
				        <select
                  name="filterType"
                  className="form-control"
                  value={this.state.addType}
                  onChange={this.onChangeAddTypeHandler}
                >
                  <option value="addFabric">Add Fabric</option>
                  <option value="addRule">Add Rule</option>
                  <option value="editFabrics">Edit Fabrics</option>
                  <option value="editRules">View / Delete Rules</option>
                </select>
              </div>
            </div>
            <hr />
            {this.state.addType === "editFabrics" ?
              <EditFabric 
                ref={ref => this.editFabric = ref} 
                adjectives = {this.state.adjectives}
                fabrics = {this.state.fabrics}
                removeSelectedFabric = {(id) => this.props.removeSelectedFabric(id)}
                toggleAlertModal = {(msg, type = "Alert") => {this.props.toggleAlertModal(msg, type)}}
                refreshFabrics = {() => this.props.refreshFabrics()}
              />
              : null
            }
            {this.state.addType === "addFabric" ?
              <AddFabric 
                ref={ref => this.addFabric = ref} 
                adjectives = {this.state.adjectives}
                fabrics = {this.props.fabrics}
                toggleAlertModal = {(msg, type = "Alert") => {this.props.toggleAlertModal(msg, type)}}
                refreshFabrics = {() => this.props.refreshFabrics()}
              />
              : null
            }
            {/* {this.state.addType === "addFabric" || this.state.addType === "editFabrics" ?
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
              : null
            } */}
            {this.state.addType === "editRules" ?
              <div className="row pb-2 w-100">
                <div className="col-12">
                  <ListGroup className="rulesList">
                    {
                      this.props.rules.map(rule => (
                        <ListGroupItem tag="button" action onClick={(e) => this.onSelectRemoveRule(e)} value={rule.id} key={rule.id}>If a fabric {rule.conditionAttribute.type.toLowerCase()} is {rule.conditionAttribute.name.toLowerCase()} then all other fabrics {this.getFabricLineStr(rule.conditionAttribute.type).toLowerCase()} {rule.negativeRule ? "must not be" : "must be"} {rule.recommendedAttribute.name.toLowerCase()}</ListGroupItem>
                      ))
                    }
                  </ListGroup>
                </div>
              </div>
              : null
            }
            {this.state.addType === "addRule" ?
              <div className="row pb-3">
                <div className="mt-1 pl-2 pt-1 col-1">
                  If fabric
				        </div>
                <div className="col-4 pb-2">
                  <select
                    name="conditionAType"
                    className="form-control"
                    value={this.state.conditionAttributeType}
                    onChange={this.onChangeRuleHandler}>
                    {this.state.attributeTypes.map((type, index) => (type === "FabricLine" ? null : <option key={index} value={type}>{this.getFabricLineStr(type)}</option>))}
                  </select>
                </div>
                <div className="mt-1 pt-1">
                  is
				        </div>
                <div className="col-4">
                  <select
                    name="conditionA"
                    className="form-control"
                    value={this.state.conditionAttribute}
                    onChange={this.onChangeRuleHandler}>
                    {this.state.adjectives.map((attribute, index) => (attribute.type === this.state.conditionAttributeType ? <option key={index} value={index}>{attribute.name.toLowerCase()}</option> : null))}
                  </select>
                </div>
                <div className="mt-1 col-2">
                  then other
				        </div>
                <div className="mt-1 pl-3 ml-1 col-1">
                  fabric
				        </div>
                <div className="col-4 pl-2">
                  <select
                    name="consequenceAType"
                    className="form-control"
                    value={this.state.consequenceAttributeType}
                    onChange={this.onChangeRuleHandler}>
                    {this.state.attributeTypes.map((type, index) => (type === "FabricLine" ? null : <option key={index} value={type}>{this.getFabricLineStr(type)}</option>))}
                  </select>
                </div>
                <div className="col-2 p-0">
                  <select
                    name="mustBe"
                    className="form-control"
                    value={this.state.mustBe}
                    onChange={this.onChangeRuleHandler}>
                    <option value="false">must be</option>
                    <option value="true">must not be</option>
                  </select>
                </div>
                <div className="col-4 ml-2">
                  <select
                    name="consequenceA"
                    className="form-control"
                    value={this.state.consequenceAttribute}
                    onChange={this.onChangeRuleHandler}>
                    {this.state.adjectives.map((attribute, index) => (attribute.type === this.state.consequenceAttributeType ? <option key={index} value={index}>{attribute.name.toLowerCase()}</option> : null))}
                  </select>
                </div>
              </div>
              : null
            }
            <div className="col-12 row pb-1 pt-3">
              <div className="col-6 text-right">
                {this.state.addType === "addRule" ?
                  <Button color="secondary ml-3" onClick={() => this.addRecommendationRule()}> Add Recommendation Rule</Button>
                  : null
                }
                {this.state.addType === "editRules" ?
                  <Button color="secondary ml-3" onClick={() => this.onDeleteClicked()}> Delete </Button>
                  :
                  null
                }
                {this.state.addType === "editFabrics" ?
                  <Button color="secondary ml-3" onClick={() => this.updateFabrics()}> Save </Button>                  
                  :
                  null
                }
                {this.state.addType === "editFabrics" ?
                  <Button color="secondary ml-3" onClick={() => this.deleteFabrics()}> Delete </Button>
                  :
                  null
                }
              </div>
              <div className="col-6">
                {this.state.addType === "addFabric" ?
                  <Button color="secondary ml-3" onClick={() => this.addData()}> Add </Button>
                  :
                  null
                }
                {this.state.addType !== "editRules" && this.state.addType !== "editFabrics" ?
                  <Button color="secondary ml-3" onClick={() => this.props.toggleAddModal()}> Cancel </Button>
                  :
                  <Button color="secondary ml-3" onClick={() => this.props.toggleAddModal()}> Return </Button>
                }
              </div>
            </div>
          </div>
        </ModalBody>
      </Modal>
    )
  }
}

export { AddModalDialog }