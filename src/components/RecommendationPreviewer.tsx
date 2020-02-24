import React from 'react';
import { PerOutfitItemFabrics } from './modules/Fabrics';
import { OutfitPreview } from './OutfitPreview';
import '../assets/css/RecommendationPreviewer.css';

class RecommendationsCarouselProps {
  recommendations: PerOutfitItemFabrics[];
  textures:any[];
}

class RecommendationsCarouselStates {
  selection: PerOutfitItemFabrics;
  // recommendationPreviews: OutfitPreview[];
}
class RecommendationsCarousel extends React.Component<RecommendationsCarouselProps, RecommendationsCarouselStates> {
  constructor(props, state) {
    super(props, state);
    this.state = {
      selection: null
    };
  }
  recommendationPreviews : OutfitPreview[] = [];

  componentDidMount() {
    var recommendationCount = parseInt(process.env.REACT_APP_RECOMMENDATION_COUNT, 10);
    const recommendationPreviews: OutfitPreview[] = [];
    for (var i=0; i<recommendationCount; i++) {
      var recommendationPreview : OutfitPreview;
      recommendationPreviews.push(recommendationPreview);
    }
    this.recommendationPreviews = recommendationPreviews;
  }

  resetCamera() {
    this.recommendationPreviews.forEach(recommendationPreview => recommendationPreview.resetCamera());
  }

  resetRecommendations() {
    this.recommendationPreviews.forEach(recommendationPreview => recommendationPreview.resetRecommendations());
  }
  
  setRecommendations() {
    this.props.recommendations.forEach((recommendation, index) => {
      var min = (this.recommendationPreviews.length - this.props.recommendations.length) / 2;
      min = ~~min;
      if(this.recommendationPreviews[index + min])
      {
        this.recommendationPreviews[index + min].setTexture(this.props.textures[index]);
        this.recommendationPreviews[index + min].setRecommendation(recommendation);
        this.recommendationPreviews[index + min].updateFabrics();
        this.recommendationPreviews[index + min].resetCamera();
      }
    });
  }

  render() {
    return (
      <div className="HorizontalScrollContainer">
        <div className="row h-100 w-100">
          {
            this.recommendationPreviews.map((recommendationPreview, index)=> (
              <OutfitPreview type = {"Recommendation"} key={index} ref={ref => this.recommendationPreviews[index] = ref}/>
            ))
          }
        </div>
      </div>
    );
  }
}

export { RecommendationsCarousel };