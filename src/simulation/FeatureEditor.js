import React from 'react';
import { makeStyles, withStyles } from '@material-ui/core/styles';
import ToggleButton from '@material-ui/lab/ToggleButton';
import { Paper, AppBar, Tabs, Tab, Fab } from '@material-ui/core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpa, faMountain, faFlask, faEgg, faSquare, faPlus, faMapMarker} from '@fortawesome/free-solid-svg-icons';
import { colorString } from './utils.js';

export default class FeatureEditor extends React.Component {
  constructor(props) {
    super(props);
    this.tabOrder = ['agent', 'marker', 'colony', 'resource', 'barrier'];
  }
  
  render() {
    let tabs = [];
    let featureTypeIconName = null;
    let featureTypeName = null;
    for (let featureType of this.tabOrder) {
        if (featureType === 'agent') {
          featureTypeIconName = faMapMarker;
          featureTypeName = 'agents';
        } else if (featureType === 'resource') {
          featureTypeIconName = faSpa;
          featureTypeName = 'resources';
        } else if (featureType === 'marker') { 
          featureTypeIconName = faFlask;
          featureTypeName = 'markers';
        } else if (featureType === 'barrier') { 
          featureTypeIconName = faMountain;
          featureTypeName = 'barriers';
        } else {
          featureTypeIconName = faEgg;
          featureTypeName = 'colonies';
        }
        tabs.push(<Tab key={featureType} icon={<FontAwesomeIcon icon={featureTypeIconName} />} label={featureTypeName} />);
    }
    
    let featureProfileCards = [];
    let featureProfilesNeeded = this.props.featureProfilesNeeded;
    for (let featureID in featureProfilesNeeded) {
      featureProfileCards.push(
        <FeatureProfileCard 
          key={featureID}
          featureID={featureID}
          profile={featureProfilesNeeded[featureID]}
        />
      );
    }
    
    return (
      <div style={{margin: 20}}>
        <AppBar position="static" style={{width: 800}}>
          <Tabs
            variant="scrollable" 
            value={this.tabOrder.indexOf(this.props.selectedFeatureType)} 
            onChange={(event, newValue) => {
              this.props.setSelectedFeatureType(this.tabOrder[newValue]);
            }}
          >
            {tabs}
          </Tabs>
        </AppBar>
        <div style={{background:'rgb(240, 240, 240)', width: 800}}>
          <div style={{height: 400, overflow: 'scroll'}}>
            {featureProfileCards}
          </div>
          <AddProfileButtonBar 
            selectedFeatureType={this.props.selectedFeatureType}
            addProfile={this.props.addProfile}
          />
        </div>
      </div>
    );
    }
}

function FeatureProfileCard(props) {
  return (
    <Paper style={{margin: 10, height: 50}}> 
      <FontAwesomeIcon icon={faSquare} color={colorString(props.profile.color)} size="lg" />
      {props.profile.name}
      {props.featureID}
    </Paper>
  );
}

let AddProfileButtonStyles = {
  
};

function AddProfileButtonBar(props) {
    let addProfileButton;
    if (props.selectedFeatureType === 'resource' || props.selectedFeatureType === 'barrier') {
      addProfileButton = 
        <div style={{width: 50, height: 50}} />;
    } else {
      addProfileButton = 
        <Fab
          onClick={() => props.addProfile(props.selectedFeatureType)}
          size="medium"
          color='secondary'
        >
          <FontAwesomeIcon icon={faPlus} />
        </Fab>;
    }
    return (
    <AppBar position="static" style={{width: 800, height: 60, padding: 5}} >
      {addProfileButton}
    </AppBar>
  );
}