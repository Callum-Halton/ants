import React from 'react';
import FeaturePalette from './FeaturePalette';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faPause, faStepBackward, faPen} from '@fortawesome/free-solid-svg-icons';
import { makeStyles } from '@material-ui/core/styles';
import { Slider, Paper, Button, Fab, MuiThemeProvider, FormControlLabel, Switch }
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
            selectPaletteFeatureAmount={props.selectPaletteFeatureAmount}
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
      control={<Switch color="primary" onClick={props.toggleBrushType} />}
      label=<FontAwesomeIcon icon={faPen} />
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

// We don't want this slider to update the simulation state continually as it's
// being moved. However, we do want it to re-render on its own as it's being
// moved. This component is designed to re-render on its own as it's being moved
// and then to call back up upstream when the value has been committed.
// UNSAFE_componentWillReceiveProps enables the slider value to be set
// from upstream when it's selecting different features given that render()
// only utilizes the internal component state.
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

  updateValue(value, disabled) {
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
