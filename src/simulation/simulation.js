import React from 'react';
import Controls from './controls';
import Terrain from './terrain.js';

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
      frozen: true,
      activePaletteFeature: "resource",
      paletteFeatureAmount: 0.1,
    };
    this.saveContext = this.saveContext.bind(this);
    this.updateAnimationState = this.updateAnimationState.bind(this);
    this.canvasClick = this.canvasClick.bind(this);
    this.terrain = new Terrain(this.state.width, this.state.height);
    this.toggleSimulationFrozen = this.toggleSimulationFrozen.bind(this);
    this.selectPaletteFeature = this.selectPaletteFeature.bind(this);
    this.selectPaletteFeatureAmount = this.selectPaletteFeatureAmount.bind(this);
    this.resetSimulation = this.resetSimulation.bind(this);
    this.paletteFeatures = ["resource", "resourceMarker", "homeMarker"];
  }
  
  componentDidMount() {
    this.rAF = requestAnimationFrame(this.updateAnimationState);
  }

  updateAnimationState() {
    this.terrain.draw(this.ctx, this.state.frozen);
    this.rAF = requestAnimationFrame(this.updateAnimationState);
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

  selectPaletteFeature(feature) {
    this.setState({
      activePaletteFeature: feature,
    });
  }

  selectPaletteFeatureAmount(amount) {
    this.setState({
      paletteFeatureAmount: amount,
    });
  }

  // componentDidUpdate() { }

  canvasClick(nativeEvent) {
    let clickPoint = {};
    clickPoint.x = nativeEvent.offsetX;
    clickPoint.y = nativeEvent.offsetY;
    this.ctx.fillStyle = "white"; this.ctx.beginPath(); this.ctx.arc(clickPoint.x, clickPoint.y, 3, 0, Math.PI * 2); this.ctx.fill();
    this.terrain.changeFeature(clickPoint, this.state.activePaletteFeature,
                               this.state.paletteFeatureAmount);
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
        />
      </div>
    );
  }
}