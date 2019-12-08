import React from 'react';
import FeatureBar from './progBar.js';

export default function Controls(props) {
  return(
    <div className="col-1">
      <ToggleFrozenButton
        toggleSimulationFrozen={props.toggleSimulationFrozen}
        frozen={props.frozen}
      />
      <SelectPaletteFeatureButtons
        selectPaletteFeature={props.selectPaletteFeature}
        activePaletteFeature={props.activePaletteFeature}
        paletteFeatures={props.paletteFeatures}
      />
      <FeatureBar updateProgress={props.selectPaletteFeatureAmount}
        progress={props.paletteFeatureAmount}
        width={200} height={50} color={[0, 100, 200]}
        background={[0, 200, 200]} 
      />
      <ResetSimulation resetSimulation={props.resetSimulation}/>
    </div>
  );
}

function ToggleFrozenButton(props) {
  return (
    <button type="button" className={"btn btn-primary"} onClick={props.toggleSimulationFrozen}>
      {props.frozen ? "Frozen" : "Running"}
    </button>
  );
}

function SelectPaletteFeatureButtons(props) {
  let radioButtons = props.paletteFeatures.map(feature =>
    <label key={`${feature}Selection`} className={`btn btn-secondary ${props.activePaletteFeature === feature ?
      "active" : ""}`} onClick={() => {props.selectPaletteFeature(feature)}}>
      {feature}
    </label>
  );

  return (
    <div className="btn-group">
      {radioButtons}
    </div>
  );
}

function ResetSimulation(props) {
  return (<button type="button" className={"btn btn-secondary"}
          onClick={props.resetSimulation}> Reset </button>);
}