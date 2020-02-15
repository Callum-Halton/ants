import React from 'react';
import { makeStyles, withStyles } from '@material-ui/core/styles';
import { Paper, Button } from '@material-ui/core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpa, faMountain, faFlask, faEgg, faEraser, faMapMarker} from '@fortawesome/free-solid-svg-icons';
import { colorString } from './utils.js';

const buttonStyles = makeStyles({
    root: {
      width: 120,
      height: 40,
      marginBottom: 10,
    },
    label: {
      marginLeft: 10,
      textTransform: 'none',
      justifyContent: 'left',
    }
});

export default withStyles({
  root: {
    height: 310,
    overflow: 'scroll',
    padding: 10,
    paddingBottom: 0,
  }
})(FeaturePalette);

function FeaturePalette(props) {

  let { featureProfiles, selectedFeatureID, classes } = props;

  let featurePaletteButtons = [
        <FeaturePaletteToolButton
          key={`${'tool'}:${'Eraser'}`}
          selected={selectedFeatureID === 'Eraser'}
          toolType="Eraser"
          selectPaletteFeature={props.selectPaletteFeature}
        />
  ];
  for (let featureType in featureProfiles) {
     let featureTypeIconName = featureType === 'marker' ? faFlask
                             : featureType === 'barrier' ? faMountain
                             : featureType === 'resource' ? faSpa
                             : featureType === 'colony' ? faEgg
                             : faMapMarker;
                             
    let featureProfilesNeeded = featureProfiles[featureType];
    for (let featureID in featureProfilesNeeded) {
      featurePaletteButtons.push(
        <FeaturePaletteButton
          key={`${featureType}:${featureID}`}
          selected={selectedFeatureID  === featureID}
          profile={featureProfilesNeeded[featureID]}
          iconName={featureTypeIconName}
          featureType={featureType}
          featureID={featureID}
          selectPaletteFeature={props.selectPaletteFeature}
        />
      );
    }
    
  }

  return (
    <Paper className={classes.root} elevation={0}>
      {featurePaletteButtons}
    </Paper>
  );

}

function FeaturePaletteButton(props) {
    
  const classes = buttonStyles();
  
  let background = props.selected ? '#dddddd' : '#ffffff';
  return (
    <Button
      style={{background: background}}
      classes={{
        root: classes.root,
        label: classes.label,
      }}
      size="medium"
      selected={props.selected}
      onClick={
        () => {props.selectPaletteFeature(props.featureType, props.featureID)}
      }
      startIcon={     
        <FontAwesomeIcon
          icon={props.iconName} 
          color={colorString(props.profile.color)} 
          size="lg" 
        />
      }
    >
      {props.profile.name}
    </Button>    
  );
}

function FeaturePaletteToolButton(props) {
  
  const classes = buttonStyles();

  let iconName;
  let iconColor;
  if (props.toolType === 'Eraser') {
    iconName = faEraser;
    iconColor = 'rgb(100, 100, 100)';
  }
  
  let background = props.selected ? '#dddddd' : '#ffffff';
  return (
    <Button
      style={{background: background}}
      classes={{
        root: classes.root,
        label: classes.label,
      }}
      size="medium"
      selected={props.selected}
      onClick={() => {props.selectPaletteFeature('tool', props.toolType)}}
      startIcon={<FontAwesomeIcon icon={iconName} color={iconColor} size="lg"/>}
    >
      {props.toolType}
    </Button>    
  );
}