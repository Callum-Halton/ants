import React from 'react';
import { Paper, AppBar, Tabs, Tab, Fab } from '@material-ui/core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpa, faMountain, faFlask, faEgg, faSquare, faPlus, faMapMarker} from '@fortawesome/free-solid-svg-icons';
import { colorString } from './utils.js';

export default class FeatureEditor extends React.Component {
  constructor(props) {
    super(props);
    this.tabOrder = ['agent', 'marker', 'colony', 'resource', 'barrier'];
    this.featureTypeDisplayInfo = {
      agent: {name: 'agents', iconName: faMapMarker},
      resource: {name: 'resources', iconName: faSpa},
      marker: {name: 'markers', iconName: faFlask},
      barrier: {name: 'barriers', iconName: faMountain},
      colony: {name: 'colonies', iconName: faEgg},
    };
    Object.freeze(this.featureTypeDisplayInfo);
  }

  render() {
    let tabs = [];
    for (let featureType of this.tabOrder) {
      let { name, iconName} = this.featureTypeDisplayInfo[featureType];
        tabs.push(<Tab key={featureType} icon={<FontAwesomeIcon icon={iconName} />} label={name} />);
    }

    let profileCards = [];
    let featureProfilesNeeded = this.props.featureProfilesNeeded;
    for (let featureID in featureProfilesNeeded) {
      profileCards.push(
        <ProfileCard
          key={featureID}
          featureType={this.props.selectedFeatureType}
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
            {profileCards}
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

class ProfileCard extends React.Component {
  constructor(props) {
    super(props);
    this.attributeCardOrders = {
      resource: ['name', 'color'],
      barrier: ['name', 'color'],
      marker: ['name', 'color', 'fadeRate', 'minimumIntensity'],
      colony: ['name', 'color', 'agentID', 'meanStepsBetweenSpawns', 'maxAgents'],
      agent: ['name', 'color', 'radius', 'homeID', 'markerIDs', 'speed', 'vision', 'agitated', 'resourceCarryingCapacity', 'forgetRate']
    };
    Object.freeze(this.attributeCardOrders);

    this.attributeNLNames = {
      name: 'Name',
      color: 'Color',
      fadeRate: 'Rate of fading',
      minimumIntensity: 'Minimum detectable intensity',
      agentID: 'Name of ant spawned',
      meanStepsBetweenSpawns: 'Average time to spawn an ant',
      maxAgents: 'Maximum number of ants to spawn',
      radius: 'Size of ant (diameter)',
      homeID: "Name of ant's colony",
      markerIDs: "Names of markers:",
      speed: 'Speed',
      vision: 'Radius of perception',
      agitated: 'Likelihood of changing direction',
      resourceCarryingCapacity: 'Resource carrying capacity',
      forgetRate: 'Rate at which agent forgets'
    };
    Object.freeze(this.attributeNLNames);
  }

  render() {
  
    let attributeCards = this.attributeCardOrders[this.props.featureType].map(
      (attribute) => <AttributeCard 
                          key={attribute}
                          attribute={attribute}
                          attributeName={this.attributeNLNames[attribute]}
                         />
    );
    
    return (
      <Paper style={{margin: 20, overflow: 'hidden', paddingBottom: 5,}}> 
        <div style={{
          height: 30, 
          background: '#dddddd', 
          display: 'flex',
          justifyContent: 'space-between',
          padding: 5,
        }}>
          <span>
            <FontAwesomeIcon icon={faSquare} color={colorString(this.props.profile.color)} size="lg" />
            {' ' + this.props.profile.name}
          </span>
          <span>
            {'ID: ' + this.props.featureID}
          </span>
        </div>
        {attributeCards}
      </Paper>
    );
  }
}

function AttributeCard(props) {
  return (
    <div style={{
      height: 40, 
      background: '#eeeeee',
      marginTop: 5,
      lineHeight: '30px',
      fontSize: 20,
      padding: 5,
      display: 'flex',
      justifyContent: 'space-between',
    }} >
      {props.attributeName}
    </div>
  );
}


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





/*
  this.attributeTypes = {
    name: {
      attributeFormat: 'text',
      NLName: 'Name',
    },
    color: {
      attributeFormat: 'color',
      NLName: 'Color',
    },
    fadeRate: {
      attributeFormat: 'number',
      NLName: 'Rate of fading',
      flippedValue: true
    }
    minimumIntensity: {
      attributeFormat: 'number',
      NLName: 'Minimum detectable intensity',
      flippedValue: false
    }
    agentID: {
      attributeFormat: 'idSelection',
      NLName: 'ID of agent spawned'
    }
    meanStepsBetweenSpawns: {
      attributeFormat: 'number',
      NLName: 'Average time to spawn agent',
      flippedValue: false
    }
    maxAgents: {
      attributeFormat: 'number',
      NLName: 'Average time to spawn agent',
      flippedValue: false
    }
  };
*/