import React from 'react';
import './App.css';
import {FullScaleOutfitPreview} from './OutfitPreview';
import AdjectiveSearchBox from './AdjectiveSearch';
import {RecommendationsCarousel} from './RecommendationPreviewer'
import {Fabric, PerOutfitItemFabrics} from './Fabrics';
import {AdjectiveTag} from './Adjectives';
import {PerOutfitItemData, OutfitItem, OutfitItems, getName} from './OutfitItem';
import {endpointUrl} from './Consts';
import {deserialize} from 'serialize-ts';

class AppState {
  activeSuggestion: PerOutfitItemFabrics;
  selectedSuggestion: PerOutfitItemFabrics;
  recommendations: PerOutfitItemFabrics[];
  Adjectives: AdjectiveTag[];
  selectedAdjectives: PerOutfitItemData<AdjectiveTag[]>;
}

class App extends React.Component<{}, AppState> {
  constructor(props, state) {
    super(props, state);
    this.refreshSuggestions = this.refreshSuggestions.bind(this);
    this.handleSelectedTagsChange = this.handleSelectedTagsChange.bind(this);
    this.resetAdjectives = this.resetAdjectives.bind(this);
    this.state = {
      selectedAdjectives: new PerOutfitItemData<AdjectiveTag[]>([]),
      selectedSuggestion: new PerOutfitItemFabrics(),
      activeSuggestion: new PerOutfitItemFabrics(),
      Adjectives: [],
      recommendations: []
    };
  }

  clothingPreview: FullScaleOutfitPreview;

  render() {
    return (
      <div className="App">
        <div className="Menu">
          {OutfitItems.map(si => (<AdjectiveSearchBox key={getName(si)} suggestions={this.state.Adjectives} onChange={tags => this.handleSelectedTagsChange(si, tags)} OutfitItem={si}/>))}
          <button className="RerollButton" onClick={e => this.refreshSuggestions()}> Reroll Suggestions </button>
          <RecommendationsCarousel recommendations={this.state.recommendations} onSelectionChanged={suggestion => {
              this.setState({selectedSuggestion: suggestion});
              this.clothingPreview.updateFabrics(suggestion);
          }}/>
        </div>
        <FullScaleOutfitPreview ref={ref => this.clothingPreview = ref}/>
      </div>
    );
  }

  async refreshSuggestions() {
    // Build the body for the new reccomendation request
    var adjs: any[] = [];
    for(var [OutfitItem, Adjectives] of this.state.selectedAdjectives)
      for (let adj of Adjectives)
        adjs.push({Part: OutfitItem, AdjectiveId: adj.id});

    var response = await fetch(`${endpointUrl}/recommendations/${5}`, {method: "POST", body: JSON.stringify(adjs), headers: [["accept", "text/plain"], ["Content-Type", "application/json"]]});
    if (!response.ok) {
      console.error(response.statusText);
      console.error(await response.text());
      return;
    }
    var json = await response.json();
    var recommendations: PerOutfitItemFabrics[] = [];
    for (var recJsonObj of json) {
      var rec = new PerOutfitItemFabrics();
      for (var si of rec.keys())
        rec.set(si, deserialize(recJsonObj[getName(si).toLowerCase()], Fabric));
      recommendations.push(rec);
    }

    this.setState({recommendations: recommendations});
  }

  componentDidMount() {
    this.resetAdjectives();
  }

  async resetAdjectives() {
    // Get all Adjective tags
    var response = await fetch(endpointUrl + "/adjectives", {method: "GET"});
    var json = await response.json();
    var adjs: AdjectiveTag[] = [];
    for (var jsonSubObj of json)
      adjs.push(deserialize(jsonSubObj, AdjectiveTag));
    this.setState({Adjectives: adjs});
    // this.forceUpdate();
    // this.handleSelectedTagsChange(OutfitItem.Jacket, []);
  }

  async handleSelectedTagsChange(part: OutfitItem, newTags: AdjectiveTag[]) {
    // Update the selected Adjectives
    var newSelectedAdjectives = this.state.selectedAdjectives;
    newSelectedAdjectives.set(part, newTags);

    // Update the state to force a redraw
    this.setState({selectedAdjectives: newSelectedAdjectives});

    // Refresh the suggestions for the first time
    this.refreshSuggestions();
  }
}

export default App;