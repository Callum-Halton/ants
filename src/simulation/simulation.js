import React from 'react';
import Controls from './controls';
import Terrain from './terrain.js';
import Test from './test.js';

class PureCanvas extends React.Component {

  shouldComponentUpdate() {
    return false;
  }

  render() {
    return (
      <canvas
        className="canvas"
        onClick={(event) => this.props.canvasClick(event.nativeEvent)}
        width={this.props.width}
        height={this.props.height}
        ref={node =>
          node ? this.props.contextRef(node.getContext('2d')) : null
        }
      />
    );
  }
}

export default class Simulation extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      width: 1000,
      height: 1000,
      cellSize: 20,
      frozen: true,
      activePaletteFeature: {
                             featureType : "resource",
                             featureID   : "food",
                            },
      paletteFeatureAmount: 0.1,
    };
    this.saveContext = this.saveContext.bind(this);
    this.updateAnimationState = this.updateAnimationState.bind(this);
    this.canvasClick = this.canvasClick.bind(this);
    this.terrain = new Terrain(this.state.width, this.state.height,
                               this.state.cellSize);
    this.toggleSimulationFrozen = this.toggleSimulationFrozen.bind(this);
    this.selectPaletteFeature = this.selectPaletteFeature.bind(this);
    this.selectPaletteFeatureAmount = this.selectPaletteFeatureAmount.bind(this);
    this.resetSimulation = this.resetSimulation.bind(this);
    this.runTests = this.runTests.bind(this);
    this.paletteFeatures = {resource: ["food"], barrier: ["wall"], marker: ["R0", "H0", "R1", "H1"]};
    this.times = [];
    this.fps = null;
    this.framesLeftToShowNotice = 3 * 30;
  }
  
  componentDidMount() {
    this.rAF = requestAnimationFrame(this.updateAnimationState);
  }

  showFps() {
    this.ctx.fillStyle = "#000000";
    this.ctx.font = "30px Courier";
    const xPos = this.state.width-240;
    this.ctx.fillText(this.terrain.getAgentsCount() + " AGENTS", xPos, this.state.height-50);
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
      this.terrain.draw(this.ctx, this.state.frozen);
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
    this.width = this.ctx.canvas.width;
    this.height = this.ctx.canvas.height;
  }

  toggleSimulationFrozen() {
    this.setState((prevState) => ({
      frozen: !prevState.frozen,
    }));
  }

  selectPaletteFeature(featureBucket, featureVal) {
    this.setState({
      activePaletteFeature: {
                             featureType : featureBucket,
                             featureID   : featureVal,
                            },
    });
  }

  selectPaletteFeatureAmount(amount) {
    this.setState({
      paletteFeatureAmount: amount,
    });
  }

  runTests() {
    const test = new Test();
    test.runAll();
  }

  // componentDidUpdate() { }

  canvasClick(nativeEvent) {
    let clickPoint = {};
    clickPoint.x = nativeEvent.offsetX;
    clickPoint.y = nativeEvent.offsetY;
    this.terrain.addFeature(clickPoint, this.state.activePaletteFeature.featureType,
      this.state.activePaletteFeature.featureID, this.state.paletteFeatureAmount);
  }
  
  resetSimulation() {
    this.terrain.reset();
  }

  render() {
    return (
      <div className="row">
        <div className="col">
          <PureCanvas
            canvasClick={this.canvasClick}
            width={this.state.width}
            height={this.state.height}
            contextRef={this.saveContext}
          />
        </div>
        <Controls
          toggleSimulationFrozen={this.toggleSimulationFrozen}
          frozen={this.state.frozen}
          selectPaletteFeature={this.selectPaletteFeature}
          activePaletteFeature={this.state.activePaletteFeature}
          paletteFeatures={this.paletteFeatures}
          selectPaletteFeatureAmount={this.selectPaletteFeatureAmount}
          paletteFeatureAmount={this.state.paletteFeatureAmount}
          resetSimulation={this.resetSimulation}
          runTests={this.runTests}
        />
      </div>
    );
  }
}

