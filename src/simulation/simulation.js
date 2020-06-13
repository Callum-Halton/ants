import React from 'react';
import Controls from './controls';
import Terrain from './terrain';
import Test from './test';
import SimulationPane from './PureCanvas';
import {Grid, Fab} from '@material-ui/core';
import FeatureEditor from './FeatureEditor';
import { Point, capitalize, DropContext, FeatureObjectCounts } from './utils.js';
import { DefaultFeatureProfiles, DefaultMarkerProfile, 
         DefaultColonyProfile, DefaultAgentProfile } from './defaults.js';

class Simulation extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      featureProfiles: new DefaultFeatureProfiles(),
      width: 1500,
      height: 800,
      cellSize: 20,
      frozen: true,
      selectedPaletteFeatureType: 'resource',
      selectedPaletteFeatureID: 'food',
      brushTypeIsLine: true,
      featureTypeInEdit: 'agent',
    };
    this.changeProfile = this.changeProfile.bind(this);
    this.updateAnimationState = this.updateAnimationState.bind(this);
    this.setFeatureTypeInEdit = this.setFeatureTypeInEdit.bind(this);
    this.saveContext = this.saveContext.bind(this);
    this.canvasClick = this.canvasClick.bind(this);
    this.canvasMouseMovement = this.canvasMouseMovement.bind(this);
    this.toggleSimulationFrozen = this.toggleSimulationFrozen.bind(this);
    this.toggleBrushType = this.toggleBrushType.bind(this);
    this.setMouseOnCanvas = this.setMouseOnCanvas.bind(this);
    this.selectPaletteFeature = this.selectPaletteFeature.bind(this);
    this.selectPaletteFeatureAmount = this.selectPaletteFeatureAmount.bind(this);
    this.resetSimulation = this.resetSimulation.bind(this);
    this.instantiateProfile = this.instantiateProfile.bind(this);
    this.runTests = this.runTests.bind(this);

    this.nonStateFeatureProfiles = new DefaultFeatureProfiles();
    this.terrain = new Terrain(this.state.width, this.state.height,
                           this.state.cellSize, this.nonStateFeatureProfiles);
    this.featureObjectCounts = new FeatureObjectCounts;
                           
    this.mouseLoc = null;
    this.mouseOnCanvas = false;
    this.featureTypeAbreviations = {
      marker: 'MA',
      colony: 'CO',
      agent: 'AG',
    };
    Object.freeze(this.featureTypeAbreviations);
    this.nextAvailableBaseIDs = {
        agent: 1,
        colony: 1,
        marker: 1,
    };
    
    this.times = [];
    this.fps = null;
    this.framesLeftToShowNotice = 3 * 30;
  }
  
  componentDidMount() {
    this.rAF = requestAnimationFrame(this.updateAnimationState);
    this.instantiateProfile('colony');
    this.instantiateProfile('agent');
    this.instantiateProfile('marker');
    this.instantiateProfile('marker');
  }

  showFps() {
    this.ctx.fillStyle = "#000000";
    this.ctx.font = "30px Courier";
    const xPos = this.state.width-240;
    this.ctx.fillText(this.featureObjectCounts.agent + " AGENTS", xPos, this.state.height-50);
    this.ctx.fillText(this.fps + " FPS", xPos, this.state.height-20);
  }

  showNotice() {
    if (this.framesLeftToShowNotice > 0) {
      this.framesLeftToShowNotice -= 1;
      this.ctx.fillStyle = "#000000";
      this.ctx.font = "30px Courier";
      const xPos = this.state.width / 2 - 150;
      const yPos = this.state.height / 2 - 20;
      this.ctx.fillText("GO ANTS!", xPos, yPos);
    }
  }

  updateAnimationState() {
    this.rAF = requestAnimationFrame(() => {
      this.featureObjectCounts = this.terrain.draw(this.ctx, this.state.frozen);
      this.showFps();
      this.showNotice();
      const now = performance.now();
      while (this.times.length > 0 && this.times[0] <= now - 1000) {
        this.times.shift();
      }
      this.times.push(now);
      this.fps = this.times.length;
      this.updateAnimationState();
    });
  }

  // Duncan commented this back in. I think it's important for when we hide
  // the simulation, or don't render it for some reason.
  componentWillUnmount() {
    cancelAnimationFrame(this.rAF);
  }

  saveContext(ctx) {
    this.ctx = ctx;
  }

  toggleBrushType() {
    this.setState(prevState => ({
      brushTypeIsLine: !prevState.brushTypeIsLine,
    }));
  }
  
  toggleSimulationFrozen() {
    this.setState((prevState) => ({
      frozen: !prevState.frozen,
    }));
  }
  
  setMouseOnCanvas(newMouseOnCanvas) {
    this.mouseOnCanvas = newMouseOnCanvas;
  }
  
  selectPaletteFeature(featureType, featureID) {
    this.setState({
      selectedPaletteFeatureType : featureType,
      selectedPaletteFeatureID   : featureID,
    });
  }

  selectPaletteFeatureAmount(featureType, featureID, amount) {
    this.changeProfile(featureType, featureID, 'paletteAmount', amount);
  }
  
  changeProfile(featureType, featureID, attributeName, attributeValue) {
    this.setState(prevState => ({
      featureProfiles : {
        ...prevState.featureProfiles,
        [featureType] : {
          ...prevState.featureProfiles[featureType],
          [featureID] : {
            ...prevState.featureProfiles[featureType][featureID],
            [attributeName] : attributeValue,
          }
        }
      }
    }));
    this.nonStateFeatureProfiles[featureType][featureID][attributeName] = attributeValue;
  }
  
  addProfile(featureType, featureID, featureProfile) {
    this.setState(prevState => ({
      featureProfiles : {
        ...prevState.featureProfiles,
        [featureType] : {
          ...prevState.featureProfiles[featureType],
          [featureID] : featureProfile,
        }
      }
    }));
    this.nonStateFeatureProfiles[featureType][featureID] = featureProfile;
  }

  runTests() {
    const test = new Test();
    test.runAll();
  }

  // componentDidUpdate() { }

  canvasMouseMovement(nativeEvent) {
    if (this.state.brushTypeIsLine && this.mouseOnCanvas) {
      this.canvasClick(nativeEvent);
    }
  }
  
  canvasClick(nativeEvent) {
    let { offsetX, offsetY } = nativeEvent;
    if (offsetX >= 0 && offsetX <= this.state.width && offsetY >= 0 && offsetY <= this.state.height) {
      let clickPoint = new Point(offsetX, offsetY);
      let { selectedPaletteFeatureType, selectedPaletteFeatureID, featureProfiles } = this.state;
      
      if (selectedPaletteFeatureType === 'tool') {
        if (selectedPaletteFeatureID === 'Eraser') {
          this.terrain.resetCell(clickPoint);
        }
      } else {
        let { paletteAmount } = featureProfiles[selectedPaletteFeatureType][selectedPaletteFeatureID];
        if (paletteAmount === null) {
          paletteAmount = 1;
        }
        this.terrain.addFeature(new DropContext(clickPoint, 'click'), selectedPaletteFeatureType, selectedPaletteFeatureID, paletteAmount);
      }
    }
  }
  
  resetSimulation() {
    this.terrain.reset();
  }
  
  setFeatureTypeInEdit(featureType) {
    this.setState({
      featureTypeInEdit: featureType,
    });
  }
  
  instantiateProfile(featureType) {
    let { nextAvailableBaseIDs } = this;
    let baseID = nextAvailableBaseIDs[featureType];
    nextAvailableBaseIDs[featureType] += 1;
    let id = `${this.featureTypeAbreviations[featureType]}${baseID}`;
    let name = `${capitalize(featureType)} ${baseID}`;
    
    let color = [];
    for (let colorComponent = 0; colorComponent < 3; colorComponent++) {
      color.push(15 + (Math.random() * 225));
    }
    
    let featureProfile = featureType === 'marker' ? new DefaultMarkerProfile(id, name, color, true) :
                         featureType === 'agent' ? new DefaultAgentProfile(id, name, color, false, this.state.cellSize) :
                         new DefaultColonyProfile(id, name, color, false);
    
    this.addProfile(featureType, id, featureProfile);
  }

  render() {
    return (
      <React.Fragment>
        <Grid container justify="center" spacing={2} style={{width: '100vw', marginTop: 10}}>
            <Grid key={0} item>
              <Controls
                toggleBrushType={this.toggleBrushType}
                brushTypeIsLine={this.state.brushTypeIsLine}
                featureProfiles={this.state.featureProfiles}
                toggleSimulationFrozen={this.toggleSimulationFrozen}
                frozen={this.state.frozen}
                selectPaletteFeature={this.selectPaletteFeature}
                selectedFeatureType={this.state.selectedPaletteFeatureType}
                selectedFeatureID={this.state.selectedPaletteFeatureID}
                selectPaletteFeatureAmount={this.selectPaletteFeatureAmount}
                resetSimulation={this.resetSimulation}
                runTests={this.runTests}
              />
            </Grid>
            <Grid key={1} item>
                <SimulationPane
                  setMouseOnCanvas={this.setMouseOnCanvas}
                  canvasMouseMovement={this.canvasMouseMovement}
                  canvasClick={this.canvasClick}
                  paneWidth={1150}
                  paneHeight={700}
                  canvasWidth={this.state.width}
                  canvasHeight={this.state.height}
                  contextRef={this.saveContext}
                />
            </Grid>
        </Grid>
        <FeatureEditor
          changeProfile={this.changeProfile}
          selectedFeatureType={this.state.featureTypeInEdit}
          setSelectedFeatureType={this.setFeatureTypeInEdit}
          featureProfilesNeeded={this.state.featureProfiles[this.state.featureTypeInEdit]}
          addProfile={this.instantiateProfile}
        />
        </React.Fragment>
    );
  }
}

export default Simulation;