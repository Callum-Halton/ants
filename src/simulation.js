
import React from 'react';
import Terrain from './simulation_framework'

class PureCanvas extends React.Component {
  shouldComponentUpdate() {
    return false;
  }

  render() {
    return (
      <canvas
        className="canvas"
        width={this.props.width}
        height={this.props.height}
        // (node) => { return (node ? callback(node.getContext('2d')) : null); }
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
    this.saveContext = this.saveContext.bind(this);
    this.updateAnimationState = this.updateAnimationState.bind(this);
    this.terrain = new Terrain(this.props.width, this.props.height);
    this.state = {
      angle: 0,
    };
  }
  
  componentDidMount() {
    this.rAF = requestAnimationFrame(this.updateAnimationState);
  }

  updateAnimationState() {
    // pass in one parameter and return object literal
    this.setState(prevState => ({angle: prevState.angle + 1 }));
    if (!this.props.frozen) {
      this.terrain.draw(this.ctx);
    }
    this.rAF = requestAnimationFrame(this.updateAnimationState);
  }

  /* componentWillUnmount() {
    cancelAnimationFrame(this.rAF);
  } */

  saveContext(ctx) {
    this.ctx = ctx;
    this.width = this.ctx.canvas.width;
    this.height = this.ctx.canvas.height;
  }

  /*
  componentDidUpdate() {
  }
  */
  
  render() {
    return <PureCanvas 
      width={this.props.width}
      height={this.props.height}
      contextRef={this.saveContext} 
    />;
  }
}