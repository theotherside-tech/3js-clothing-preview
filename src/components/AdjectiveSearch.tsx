import React from 'react';
import { AdjectiveTag } from './modules/Adjectives';
import { Fabric } from './modules/Fabrics';
import { getName, OutfitItem } from './modules/OutfitItem';
import ReactTags from 'react-tag-autocomplete';
import { deserialize } from 'serialize-ts';
import { SwatchItem } from './SwatchItem'
import '../assets/css/AdjectiveSearch.css'

class AdjectiveSearchBoxProps {
  adjectiveSuggestions: AdjectiveTag[];
  pantsMustMatchJacket:boolean;
  includeSoldOut: boolean;
  fabricLineAdjectives: AdjectiveTag[];
  fabricLineStatus: boolean[];
  fabricLineStatusChanged: boolean;
  fabricSuggestions: Fabric[];
  onChange: (attrs: any[]) => void;
  onSelectionChanged: (fabric: Fabric) => void;
  OutfitItem: OutfitItem;
}

class AdjectiveSearchBoxStates {
  tags: any[];
  fabricSuggestions: Fabric[];
  adjectiveSuggestions: AdjectiveTag[];
  selection: Fabric;
  isLoading: boolean;
  filterType: string;
}
class AdjectiveSearchBox extends React.Component<AdjectiveSearchBoxProps,AdjectiveSearchBoxStates> 
{
  constructor(props, state) {
    super(props, state);
    this.state = {
      tags: [],
      fabricSuggestions: [],
      adjectiveSuggestions: [],
      selection: null,
      isLoading: false,
      filterType: "Attribute"
    }
    this.onChangeFilterTypeHandler = this.onChangeFilterTypeHandler.bind(this);
  }

  tagSearchBox: ReactTags;
  fabricLineStatus:boolean[] = [];

  getViewTags(tags: AdjectiveTag[]) {
    var viewTags: AdjectiveTag[] = []
    tags.forEach(e => {
      viewTags.push({...e, name:`${e.type} : ${e.name}`});
    })
    return viewTags;
  }

  setSelection(fabric) {
    if(this.state.selection && this.state.selection.equals(fabric))
    {
      this.setState({selection: new Fabric()});
      this.props.onSelectionChanged(null);
    }
    else
    {
      this.setState({selection: fabric});
      this.props.onSelectionChanged(fabric);
    }
  }

  componentDidMount() {
    this.getFabrics([]);
  }

  componentWillReceiveProps(nextProps) {    
    if (nextProps.includeSoldOut !== this.props.includeSoldOut)
      this.getFabrics(this.state.tags, true);
    if (nextProps.pantsMustMatchJacket !== this.props.pantsMustMatchJacket && this.props.OutfitItem === OutfitItem.Pants) {
      const tags = [];
      this.setState({ tags: tags });
    }
    if (nextProps.adjectiveSuggestions !== this.props.adjectiveSuggestions) {
      const adjectives = nextProps.adjectiveSuggestions;
      this.setState({ adjectiveSuggestions: adjectives });
    }
    if (nextProps.fabricLineStatus !== this.props.fabricLineStatus) {
      this.fabricLineStatus = nextProps.fabricLineStatus;
      this.getFabrics(this.state.tags);
    }
    if (nextProps.fabricLineStatusChanged !== this.props.fabricLineStatusChanged) {
      this.fabricLineStatus = nextProps.fabricLineStatus;
      this.getFabrics(this.state.tags);
    }
    if (nextProps.fabricSuggestions !== this.props.fabricSuggestions) {
      this.getFabrics(this.state.tags);
    }
  }

  async getFabrics(tags, includeSoldOutState = false) {
    // Get all Fabric tags
    this.setState({isLoading:true});
    var includeSoldOut = this.props.includeSoldOut;
    if(includeSoldOutState)
      includeSoldOut = !includeSoldOut;
    var aTagList=[];
    for (let attr of tags)
      aTagList.push(attr.id);
    var fabricAttrs: Fabric[] = [];
    const promises = [];
    if(this.fabricLineStatus.length === 0)
      return;
    if(this.props.OutfitItem !== OutfitItem.Shoes) {
      this.fabricLineStatus.forEach((item, index) => {
        if(item) {
          const aList = [...aTagList];        
          aList.push(this.props.fabricLineAdjectives[index].id)
          promises.push(fetch(`${process.env.REACT_APP_END_POINT_URL}/fabrics?appliesTo=${getName(this.props.OutfitItem)}&includeSoldOut=${includeSoldOut}`, {
            method: "PUT", 
            body: JSON.stringify(aList), 
            headers: [["accept", "text/plain"], ["Content-Type", "application/json"]]
          }));
        }
      })
    }
    else {
      const aList = [...aTagList];
      promises.push(fetch(`${process.env.REACT_APP_END_POINT_URL}/fabrics?appliesTo=${getName(this.props.OutfitItem)}&includeSoldOut=${includeSoldOut}`, {
        method: "PUT", 
        body: JSON.stringify(aList), 
        headers: [["accept", "text/plain"], ["Content-Type", "application/json"]]
      }));
    }
    try{
      const results = await Promise.all(promises);
      const jsonPromises = [];
      results.forEach((result, index) => jsonPromises.push(result.json()));
      const jsonFabricList = await Promise.all(jsonPromises);
      for (const jsonFabric of jsonFabricList) {
        for (var jsonFabricObj of jsonFabric) {
          var same = false;
          for (var fabricAttr of fabricAttrs) {
            if (fabricAttr.name === deserialize(jsonFabricObj, Fabric).name)
              same = true;
          }
          if(!same)
            fabricAttrs.push(deserialize(jsonFabricObj, Fabric));
        }
      }
      this.setState({fabricSuggestions: fabricAttrs}); 
      this.props.onChange(fabricAttrs);
    }
    catch(err) {
      console.log(err);
      this.setState({isLoading:false});
      return;
    }
    this.setState({isLoading:false});
  }

  handleDelete(i: number) {
    if (i === -1) return false;
    const tags = this.state.tags.slice(0)
    tags.splice(i, 1);
    const removedTag = this.state.tags[i];   
    removedTag.name = removedTag.name.replace(removedTag.type+" : ", ""); 
    this.setState({ tags });
    if (this.state.filterType === "Attribute") {
      const suggestions = [].concat(this.state.adjectiveSuggestions, removedTag);
      this.setState({ adjectiveSuggestions: suggestions });
      this.getFabrics(tags);
    }
    else if (this.state.filterType === "Fabric") {
      const suggestions = [].concat(this.state.fabricSuggestions, removedTag);
      this.setState({ fabricSuggestions: suggestions });
      if(tags.length !== 0)
        this.props.onChange(tags);
      else
        this.props.onChange(suggestions);
    }
  }
 
  handleAddition(tag) {
    for (var existingTag of this.state.tags)
      if (existingTag.id === tag.id)
        return;
    const tags = [].concat(this.state.tags, tag);    
    this.setState({ tags });    
    if (this.state.filterType === "Attribute") {
      const suggestions = this.state.adjectiveSuggestions.filter(x => x.id !== tag.id);
      this.setState({ adjectiveSuggestions: suggestions });
      this.getFabrics(tags);
    }
    else if (this.state.filterType === "Fabric") {
      const suggestions = this.state.fabricSuggestions.filter(x => x.id !== tag.id);
      this.setState({ fabricSuggestions: suggestions });
      this.props.onChange(tags);
    }
  }

  onChangeFilterTypeHandler(e) {
    const { value } = e.target;
    this.setState({ filterType: value });
    const tags = [];
    this.setState({ tags });
    if (value === "Fabric") {      
      const adjectives = this.props.adjectiveSuggestions;
      this.setState({ adjectiveSuggestions: adjectives });
      this.getFabrics(tags);
    }
    else if (value === "Attribute") {
      this.getFabrics(tags);
      this.props.onChange(tags);
    }
  }

  render () {
    return (
      this.props.pantsMustMatchJacket && this.props.OutfitItem === OutfitItem.Pants?
      null:
      <div className="w-100 pb-2" key={"div"+getName(this.props.OutfitItem)}>
        <div className="col-12" key={"col-12"+getName(this.props.OutfitItem)}>
          <h5 className="page-title mb-0 text-center">{getName(this.props.OutfitItem)}</h5> 
          <div className="row pb-2">
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
            <div className="row">
              <div className="w-100" >
                <ReactTags
                  ref={ref => this.tagSearchBox = ref}
                  tags={this.state.tags}
                  suggestions={this.getViewTags(this.state.adjectiveSuggestions)}
                  handleDelete={this.handleDelete.bind(this)}
                  handleAddition={this.handleAddition.bind(this)} 
                  placeholder={`Attributes`}
                  allowNew={false}
                  autoresize={false}/><br/>
              </div>
            </div>
            : null
          }
          {this.state.filterType === "Attribute" ?
            <div className="row swatchBox"  key={"swatchBox"+getName(this.props.OutfitItem)}>
              {
                this.state.fabricSuggestions.map( fabric => (
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
                      this.setSelection( fabric );
                    }}/>
                ))            
              }            
            </div>
            : null
          }
          {this.state.filterType === "Fabric" ?
            <div className="row">
              <div className="w-100" >
                <ReactTags
                  ref={ref => this.tagSearchBox = ref}
                  tags={this.state.tags}
                  suggestions={this.state.fabricSuggestions}
                  handleDelete={this.handleDelete.bind(this)}
                  handleAddition={this.handleAddition.bind(this)} 
                  placeholder={`Fabric number`}
                  allowNew={false}
                  autoresize={false}/><br/>
              </div>
            </div>
            : null
          }
          {this.state.filterType === "Fabric" ?
            <div className="row swatchBox"  key={"swatchBox"+getName(this.props.OutfitItem)}>
            {
              this.state.tags.length === 0 ?
              this.state.fabricSuggestions.map( fabric => (
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
                    this.setSelection( fabric );
                  }}/>
              ))    
              :
              this.state.tags.map( fabric => (
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
                    this.setSelection( fabric );
                  }}/>
              ))            
            }            
            </div>
            : null
          }
          <div className="small-circle col-9" style={this.state.isLoading ? {} : {display: "none"}}><div></div></div>
        </div>        
      </div>
    )
  }
}

export { AdjectiveSearchBox };
