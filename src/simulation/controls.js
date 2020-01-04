import React from 'react';
import FeatureBar from './progBar.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faPause, faStepBackward } from '@fortawesome/free-solid-svg-icons';

export default function Controls(props) {
  return(
    <div className="col">
      <div className="row">
        <div className="col">
          <ResetSimulation resetSimulation={props.resetSimulation}/>
          <ToggleFrozenButton
            toggleSimulationFrozen={props.toggleSimulationFrozen}
            frozen={props.frozen}
          />
          <FeatureBar updateProgress={props.selectPaletteFeatureAmount}
            progress={props.paletteFeatureAmount}
            width={200} height={50} color={[0, 100, 200]}
            background={[0, 200, 200]}
          />
          <SelectPaletteFeatureButtons
            selectPaletteFeature={props.selectPaletteFeature}
            activePaletteFeature={props.activePaletteFeature}
            paletteFeatures={props.paletteFeatures}
          />
          <RunTests runTests={props.runTests}/>
        </div>
      </div>
      {/* Duncan put this here to play with it
      <div className="row">
        <div className="col">
          <label for="customRange1">Example range</label>
          <input type="range" class="custom-range" id="customRange1"/>
        </div>
      </div>
      */}
    </div>
  );
}

function ResetSimulation(props) {
  const reset = <FontAwesomeIcon icon={faStepBackward} />
  return (<button type="button" className={"btn btn-secondary"}
          onClick={props.resetSimulation}>{reset}</button>);
}

function ToggleFrozenButton(props) {
  const play = <FontAwesomeIcon icon={faPlay} />
  const pause = <FontAwesomeIcon icon={faPause} />
  return (
    <button type="button" className={"btn btn-secondary"} onClick={props.toggleSimulationFrozen}>
      {props.frozen ? pause : play}
    </button>
  );
}

function SelectPaletteFeatureButtons(props) {
  let radioButtons = props.paletteFeatures.map(feature =>
    <button key={`${feature}Selection`} className={`btn btn-secondary ${props.activePaletteFeature === feature ?
      "active" : ""}`} onClick={() => {props.selectPaletteFeature(feature)}}>
      {feature}
    </button>
  );

  return (
    <div className="btn-group">
      {radioButtons}
    </div>
  );
}

function RunTests(props) {
  return (<button type="button" className={"btn btn-secondary"}
          onClick={props.runTests}> Run Tests </button>);
}
