import React from 'react';
import FeaturePalette from './FeaturePalette';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faPause, faStepBackward, faPaintRoller, faPen} from '@fortawesome/free-solid-svg-icons';
import { makeStyles } from '@material-ui/core/styles';
import { Grid, Slider, Paper, Button, Fab, createMuiTheme, MuiThemeProvider, FormControlLabel, Switch }
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
          <ToggleBrushTypeSwitch
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

function ToggleBrushTypeSwitch(props) {
  return (
    <FormControlLabel
      value='top'
      control={<Switch color="primary" />}
      label=<FontAwesomeIcon icon={faPaintRoller} size='small'/>
      labelPlacement="top"
      style={{margin: 0}}
    />/*
    <Fab onClick={props.toggleBrushType} size="medium">
      <FontAwesomeIcon
        icon={props.brushType === 'dot' ? faPen : faPaintRoller}
      />
    </Fab>*/
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
    let [ displayValue, disabled ] = this.getDisplayValueAndDisabled(props.value);
    this.state = {
      unprocessedValue: props.value,
      displayValue: displayValue,
      disabled: disabled,
    };
  }
  
  UNSAFE_componentWillReceiveProps(props) {
    if (props.value !== this.state.unprocessedValue) {
      let [ displayValue, disabled ] = this.getDisplayValueAndDisabled(props.value);
      this.setState({
        unprocessedValue: props.value,
        displayValue: displayValue,
        disabled: disabled
      });
    }
  }

  getDisplayValueAndDisabled(unProcessedValue) {
    if (unProcessedValue === null) {
      return [0.5, true];
    } else {
      return [unProcessedValue, false];
    }
  }

  updateValue(value) {
    this.setState({
      unprocessedValue: value,
      displayValue: value
    });
  }
  
  render() {
    return(
      <div style={{height: 310, width: 20, textAlign: 'center', marginLeft: 3}}>
        <Slider
          onChange={(event, value) => this.updateValue(value)}
          onChangeCommitted={(event, value) => this.props.selectPaletteFeatureAmount(
            this.props.selectedFeatureType, this.props.selectedFeatureID, this.state.displayValue)}
          value={this.state.displayValue}
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
