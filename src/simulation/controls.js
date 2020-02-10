import React from 'react';
import FeaturePalette from './FeaturePalette';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faPause, faStepBackward, faPaintRoller, faPen} from '@fortawesome/free-solid-svg-icons';
import { makeStyles } from '@material-ui/core/styles';
import { Grid, Slider, Paper, Button, Fab, createMuiTheme, MuiThemeProvider}
  from '@material-ui/core';

const useStyles = makeStyles({
  root : {
    width: 190,
    paddingTop: 1,
    paddingBottom: 1,
    paddingLeft: 10,
    paddingRight: 10,
    background: 'rgb(240, 240, 240)',
  },
});

let flexBoxStyles = {
  display: 'flex',
  justifyContent: 'space-between',
  marginTop: 10,
  marginBottom: 10,
};

/*
const theme = createMuiTheme({
  overrides: {
    MuiFab: {
      root: {
        margin: 10,
        padding: 10
      }
    }
  }
});
*/

export default function Controls(props) {

  const classes = useStyles();
  
  let sliderValue = props.selectedFeatureType === 'tool' ? null :
    props.featureProfiles[props.selectedFeatureType][props.selectedFeatureID].paletteAmount;
  
  return (
    <Paper className={classes.root}>
      {/*<MuiThemeProvider theme={theme}>*/}
        <div style={flexBoxStyles}>
          <ToggleBrushTypeButton
            toggleBrushType={props.toggleBrushType}
            brushType={props.brushType}
          />
          <ResetSimulation resetSimulation={props.resetSimulation}/>
          <ToggleFrozenButton
            toggleSimulationFrozen={props.toggleSimulationFrozen}
            frozen={props.frozen}
          />
        </div>
        <div style={flexBoxStyles}>
          <FeaturePalette 
            featureProfiles={props.featureProfiles}
            selectedFeatureType={props.selectedFeatureType}
            selectedFeatureID={props.selectedFeatureID}
            selectPaletteFeature={props.selectPaletteFeature}
          />
          <SelectFeatureAmountSlider
            value={ sliderValue }
            selectedFeatureType={props.selectedFeatureType}
            selectedFeatureID={props.selectedFeatureID}
            selectPaletteFeatureAmount={props.selectPaletteFeatureAmount}
          />
        </div>
        {/*<RunTests runTests={props.runTests}/>*/}
      {/*</MuiThemeProvider>*/}
    </Paper>
  );
}

function ResetSimulation(props) {
  return (
    <Fab onClick={props.resetSimulation} size="medium">
      <FontAwesomeIcon icon={faStepBackward} />
    </Fab>
  );
}

function ToggleBrushTypeButton(props) {
  return (
    <Fab onClick={props.toggleBrushType} size="medium">
      <FontAwesomeIcon
        icon={props.brushType === 'dot' ? faPaintRoller : faPen}
      />
    </Fab>
  );
}

function ToggleFrozenButton(props) {
  return (
    <Fab onClick={props.toggleSimulationFrozen} size="medium">
      <FontAwesomeIcon
        icon={props.frozen ? faPlay : faPause}
      />
    </Fab>
  );
}

function RunTests(props) {
  return (
    <Button variant="contained" color="primary" onClick={props.runTests}>
      Run Tests
    </Button>
  );
}

class SelectFeatureAmountSlider extends React.Component {
  
  constructor(props) { 
    super(props);
    let [ value, disabled ] = this.getValueAndDisabled(props.value);
    this.state = {
      unprocessedValue: props.value,
      value: value,
      disabled: disabled,
    };
  }
  
  UNSAFE_componentWillReceiveProps(props) {
    if (props.value !== this.state.unprocessedValue) {
      let [ value, disabled ] = this.getValueAndDisabled(props.value);
      this.setState({
        unprocessedValue: props.value,
        value: value,
        disabled: disabled
      });
    }

  }

  getValueAndDisabled(unProcessedValue) {
    if (unProcessedValue === null) {
      return [0.5, true];
    } else {
      return [unProcessedValue, false];
    }
  }

  updateValue(value) {
    this.setState({
      unprocessedValue: value,
      value: value
    });
  }
  
  render() {
    return(
      <div style={{height: 310, width: 20, textAlign: 'center', marginLeft: 3}}>
        <Slider
          onChange={(event, value) => this.updateValue(value)}
          onChangeCommitted={(event, value) => this.props.selectPaletteFeatureAmount(
            this.props.selectedFeatureType, this.props.selectedFeatureID, value)}
          value={this.state.value}
          orientation="vertical"
          defaultValue={0.5}
          disabled={this.state.disabled}
          min={0}
          step={0.01}
          max={1}
          valueLabelDisplay="auto"
        />
      </div>
    );
  }
}


/*
function SelectPaletteFeatureButtons(props) {
  let radioButtons = props.paletteFeatures.map(featureID =>
    <FormControlLabel
      control={<Radio color="primary" />}
      onChange={() => {props.selectPaletteFeature(props.featureType, featureID)}}
      checked={props.activePaletteFeature.featureID === featureID &&
               props.activePaletteFeature.featureType === props.featureType}
      value={featureID}
      label={featureID}
      labelPlacement="start"
    />
  );

  return (
    <RadioGroup>
      {radioButtons}
    </RadioGroup>
  );
}
*/
