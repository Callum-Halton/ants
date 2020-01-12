import React from 'react';
import FeatureBar from './progBar.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faPause, faStepBackward } from '@fortawesome/free-solid-svg-icons';

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
      <div className="col">
        <div className="row">
          <div className="col">
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
      {props.frozen ? play : pause}
    </button>
  );
}

function SelectPaletteFeatureButtons(props) {
  let radioButtons = props.paletteFeatures.map(featureID =>
    <button
      key={`${featureID}Selection`}
      className={`btn btn-secondary ${props.activePaletteFeature.feature === featureID
        && props.activePaletteFeature.featureType === props.featureType ? "active" : ""}`}
      onClick={() => {props.selectPaletteFeature(props.featureType, featureID)}}>
          {featureID}
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