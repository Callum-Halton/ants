import React from 'react';
import FeatureBar from './progBar.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faPause, faStepBackward } from '@fortawesome/free-solid-svg-icons';
import { Button, Fab, TextField, createMuiTheme,
         MuiThemeProvider, RadioGroup, Radio,
         FormControlLabel} from '@material-ui/core';

const theme = createMuiTheme({
  overrides: {
    MuiFab: {
      root: {
        margin: "10px",
        padding: "10px"
      }
    }
  }
});

export default class Controls extends React.Component {

  render() {
    let featureButtonSets = [];
    for (let featureType in this.props.paletteFeatures) {
      featureButtonSets.push(
        <SelectPaletteFeatureButtons
          key={featureType}
          featureType={featureType}
          selectPaletteFeature={this.props.selectPaletteFeature}
          activePaletteFeature={this.props.activePaletteFeature}
          paletteFeatures={this.props.paletteFeatures[featureType]}
        />
      );
    }
    return (
      <MuiThemeProvider theme={theme}>
        {/* <Button variant="contained" color="primary">
          Hello World
        </Button> */}
        <ResetSimulation resetSimulation={this.props.resetSimulation}/>
        <ToggleFrozenButton
          toggleSimulationFrozen={this.props.toggleSimulationFrozen}
          frozen={this.props.frozen}
        />
        <FeatureBar updateProgress={this.props.selectPaletteFeatureAmount}
          progress={this.props.paletteFeatureAmount}
          width={200} height={50} color={[0, 100, 200]}
          background={[0, 200, 200]}
        />
        <div>
          {featureButtonSets}
        </div>
        <RunTests runTests={this.props.runTests}/>
      </MuiThemeProvider>
    );
  }
}

function ResetSimulation(props) {
  const reset = <FontAwesomeIcon icon={faStepBackward} />;
  return (
    <Fab color="extended" onClick={props.resetSimulation} padding={10}>
      {reset}
    </Fab>
  );
}

function ToggleFrozenButton(props) {
  const play = <FontAwesomeIcon icon={faPlay} />;
  const pause = <FontAwesomeIcon icon={faPause} />;
  return (
    <Fab color="extended" onClick={props.toggleSimulationFrozen}>
      {props.frozen ? play : pause}
    </Fab>
  );
}

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

function RunTests(props) {
  return (
    <Button variant="contained" color="primary" onClick={props.runTests}>
      Run Tests
    </Button>
  );
}



            /*
            <SelectPaletteFeatureButtons
              featureBucket={"things"}
              selectPaletteFeature={this.props.selectPaletteFeature}
              activePaletteFeature={this.props.activePaletteFeature}
              paletteFeatures={this.props.paletteFeatures.things}
            />

            <SelectPaletteFeatureButtons
              featureBucket={"markers"}
              selectPaletteFeature={this.props.selectPaletteFeature}
              activePaletteFeature={this.props.activePaletteFeature}
              paletteFeatures={this.props.paletteFeatures.markers}
            />
            */