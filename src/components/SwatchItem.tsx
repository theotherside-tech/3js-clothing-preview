import React from 'react';

class SwatchItemState {
	hover: boolean;
  }
  
  class SwatchItemProps {
	id: number;
	soldOut: boolean;
	name: string;
	url: string;
	appliesTo: number;
	scale: number;
	onClick: () => void;
	selected: boolean;
  }
  class SwatchItem extends React.Component<SwatchItemProps, SwatchItemState> {
	constructor(props: SwatchItemProps, state: SwatchItemState) {
	  super(props, state);
	  this.state = {
		hover: false,
	  };
	}
	render() {
	  return (
		<div className="swatchFrame">
		  <div className={"swatch" + (this.props.selected ? " Selected" : "") + (this.state.hover && !this.props.selected ? " Hover" : "")} 
			key={this.props.id}
			onMouseOver={(e) => this.setState({hover: true})} 
			onMouseLeave={() => this.setState({hover: false})} 
			onClick={this.props.onClick}>
			<div className="TextBackdrop" style={{backgroundImage: 'url(' + this.props.url + ')'}}></div>          
		  </div>
		  <h6 className="swatchText">{this.props.name}</h6>
		</div>
	  );
	}
  }

  export { SwatchItem }