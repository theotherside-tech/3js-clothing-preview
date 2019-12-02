import React from 'react';
import './RecommendationPreviewer.css';
import { Col, Row } from "react-grid-system";
import { PerOutfitItemFabrics } from './Fabrics';
import { OutfitItem, OutfitItems, getName } from './OutfitItem';

class OutfitPartFabricDisplay extends React.Component<{OutfitItem: OutfitItem, recommendation: PerOutfitItemFabrics}, {}> {
  render() {
    return (
      <div className="OutfitPartFabricDisplay" style={{backgroundImage: 'url(' + this.props.recommendation.get(this.props.OutfitItem).url + ')'}}>
        <div className="TextBackdrop">
          <h3>{getName(this.props.OutfitItem)}</h3>
          <p>{this.props.recommendation.get(this.props.OutfitItem).name}</p>
        </div>
      </div>
    );
  }
}

class RecDisplayState {
  hover: boolean
}

class RecDisplayProps {
  recommendation: PerOutfitItemFabrics;
  onClick: () => void;
  selected: boolean;
}

class RecommendationDisplay extends React.Component<RecDisplayProps, RecDisplayState> {
  constructor(props: RecDisplayProps, state: RecDisplayState) {
    super(props, state);
    this.state = {
      hover: false
    };
  }

  render() {
    return (
      <Col className={"Recommendation" + (this.props.selected ? " Selected" : "") + (this.state.hover && !this.props.selected ? " Hover" : "")} 
      onMouseOver={(e) => this.setState({hover: true})} onMouseLeave={() => this.setState({hover: false})} onClick={this.props.onClick}>
        {OutfitItems.map(si => (<OutfitPartFabricDisplay recommendation={this.props.recommendation} OutfitItem={si} key={si}/>))}
      </Col>
    );
  }
}

class RecommendationsCarousel extends React.Component<{recommendations: PerOutfitItemFabrics[], onSelectionChanged: (recommendation: PerOutfitItemFabrics) => void}, {selection: PerOutfitItemFabrics}> {
  constructor(props, state) {
    super(props, state);
    this.state = {
      selection: null
    };
  }
  previouslyClickedElement: HTMLDivElement = null;

  render() {
    var items = this.props.recommendations.map(recommendation => {
      var key = "";
      for (var si of recommendation.keys())
        key += `${getName(si)}: ${recommendation.get(si).name}`;
      return (
        <Row key={key} className="Row">
          <Col className="Col">
            <RecommendationDisplay recommendation={recommendation}
              selected={this.state.selection != null && this.state.selection.equals(recommendation)}
              onClick={() => {
                this.props.onSelectionChanged(recommendation);
                this.setState({selection: recommendation});
              }}
            />
            {recommendation === this.props.recommendations[this.props.recommendations.length - 1] ? (<br/>) : (<div><br/><hr/><br/></div>)}
          </Col>
        </Row>
      )
    });
    return (<div className="RecommendationsCarousel HorizontalScrollContainer"><Col>{items}</Col></div>);
  }
}

export {RecommendationsCarousel, RecommendationDisplay};