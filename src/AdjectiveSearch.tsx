import React from 'react';
import './AdjectiveSearch.css'
import { AdjectiveTag } from './Adjectives';
import { getName, OutfitItem } from './OutfitItem';
import ReactTags from 'react-tag-autocomplete'

class AdjectiveSearchBox extends React.Component<{suggestions: AdjectiveTag[], onChange: (adjs: AdjectiveTag[]) => void, OutfitItem: OutfitItem}, {tags: AdjectiveTag[]}> {
  constructor(props, state) {
    super(props, state);
    this.state = {
      tags: []
    };
    this.handleAddition = this.handleAddition.bind(this);
    this.handleDelete = this.handleDelete.bind(this);
  }

  tagSearchBox: ReactTags;

  render () {
    return (
      <div>
        {getName(this.props.OutfitItem)} <br/>
        <ReactTags
              ref={ref => this.tagSearchBox = ref}
              tags={this.state.tags}
              suggestions={this.props.suggestions}
              handleDelete={this.handleDelete.bind(this)}
              handleAddition={this.handleAddition.bind(this)} 
              placeholder={`Enter ${getName(this.props.OutfitItem)} Adjectives`}
              allowNew={false}
              autoresize={false}/>
      </div>
    )
  }
 
  handleDelete (i: number) {
    if (this.state.tags.length === 0)
      return;
    const tags = this.state.tags.slice(0);
    tags.splice(i, 1);
    this.setState({ tags: tags });
    this.props.onChange(tags);
  }
 
  handleAddition (tag: AdjectiveTag) {
    for (var existingTag of this.state.tags)
      if (existingTag.id === tag.id)
        return;
    const tags = [].concat(this.state.tags, tag);
    this.setState({ tags: tags });
    this.props.onChange(tags);
  }
}

export default AdjectiveSearchBox;
