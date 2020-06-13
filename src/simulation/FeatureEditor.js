import React from 'react';
import { Paper, AppBar, Tabs, Tab, Fab, Slider } from '@material-ui/core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpa, faMountain, faFlask, faEgg, faSquare, faPlus, faMapMarker} from '@fortawesome/free-solid-svg-icons';
import { colorString, NumericAttributeInfo } from './utils.js';

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
          changeProfile={this.props.changeProfile}
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
          <div style={{height: 600, overflow: 'scroll'}}>
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
    
    this.changeAttribute = this.changeAttribute.bind(this);
  }

  changeAttribute(attribute, attributeVal) {
    let { featureType, featureID } = this.props;
    this.props.changeProfile(featureType, featureID, attribute, attributeVal);
  }

  render() {
    let attributeCards = this.attributeCardOrders[this.props.featureType].map(
      (attribute) => <AttributeCard 
                        key={attribute}
                        attribute={attribute}
                        attributeVal={this.props.profile[attribute]}
                        attributeNLName={this.attributeNLNames[attribute]}
                        changeAttribute={this.changeAttribute}
                      />
    );
    
    return (
      <Paper style={{
        margin: 20, 
        overflow: 'hidden', 
        paddingBottom: 5, 
        background: '#f9f9f9'
      }}> 
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


const AttributeCardFieldStyles = {
  height: '100%', 
  width: '50%',
  paddingLeft: 20,
  paddingRight: 20,
};
      
function AttributeCard(props) {
  let attributesOfTypeIDSelect = ['homeID', 'agentID', 'markerIDs'];
  
  let { attribute, attributeVal } = props;
  let attributeInput = <div style={{background: 'red', height: '100%'}}/>;
  if (attribute === 'name') {
  } else if (attribute === 'color') {
  } else if (attributesOfTypeIDSelect.includes(attribute)) {
  } else {
    attributeInput =
      <AttributeSlider
        attribute={attribute}
        value={attributeVal}
        changeAttribute={props.changeAttribute}
      />;
  }
  
  return (
    <div style={{
      height: 40, 
      background: '#ffffff',
      marginTop: 5,
      display: 'flex',
    }} >
      <div style={AttributeCardFieldStyles}>
        <span style={{lineHeight: '40px', fontSize: 20}}>
          {props.attributeNLName}
        </span>
      </div>
      <div style={AttributeCardFieldStyles}>
        {attributeInput}
      </div>
    </div>
  );
}

class AttributeSlider extends React.Component {
  constructor(props) {
    super(props);
    this.numericAttributesInfo = {
      fadeRate: new NumericAttributeInfo(0, 0.0006, 0.006),
      minimumIntensity: new NumericAttributeInfo(0, 0.0002, 0.02),
      meanStepsBetweenSpawns: new NumericAttributeInfo(0, 1, 200),
      maxAgents: new NumericAttributeInfo(0, 10, 2000),
      radius: new NumericAttributeInfo(3, 1, 20),
      speed: new NumericAttributeInfo(1, 1, 20),
      vision: new NumericAttributeInfo(0, 1, 100),
      agitated: new NumericAttributeInfo(0, 0.0002, 0.02),
      resourceCarryingCapacity: new NumericAttributeInfo(0, 0.0004, 0.04),
      forgetRate: new NumericAttributeInfo(0, 0.01, 1),
    };
  }
  render() {
    let { attribute } = this.props;
    let { min, step, max} = this.numericAttributesInfo[attribute];
    let valueProcessing = v => v;
    if (attribute === 'fadeRate' || attribute === 'forgetRate') {
      valueProcessing = v => 1 - v;
    }
    
    return(
      <React.Fragment>
        <Slider 
          style={{
            width: '70%',
            height: '50%',
            margin: 0,
            padding: 0,
            paddingTop: 20
          }}
          onChange={(event, value) => this.props.changeAttribute(attribute, valueProcessing(value))}
          value={valueProcessing(this.props.value)}
          min={min}
          step={step}
          max={max}
        />
        <div style={{
          background: 'rgb(65, 84, 175)',
          width: 'calc( 30% - 15px)', 
          height: 'calc( 100% - 10px)',
          margin: 5,
          marginLeft: 15,
          marginRight: 0,
          borderRadius: 5,
          display: 'inline-block',
          overflow: 'hidden',
          fontSize: 20,
          color: 'white',
        }}>
          {valueProcessing(this.props.value)}
        </div>
      </React.Fragment>
    );
  }
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