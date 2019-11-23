import React from 'react';
import logo from './logo.svg';
import './App.css';
import Simulation from './simulation.js';

// https://philna.sh/blog/2018/09/27/techniques-for-animating-on-the-canvas-in-react/

class ToggleFrozenButton extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    return (
      <button type="button" className={"btn btn-primary"} onClick={this.props.toggleSimulationFrozen}>
        {this.props.frozen ? "Frozen" : "Running"}
      </button>
    );
  }
}

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.toggleSimulationFrozen = this.toggleSimulationFrozen.bind(this);
    this.state = {
      width: 1000,
      height: 1000,
      frozen: false,
    };
  }

  toggleSimulationFrozen() {
    this.setState((prevState) => ({
      frozen: !prevState.frozen,
    }));
  }
  
  render() {
    return (
      <div className="container">
        <div className="row">
          <div className="col-11">
            <Simulation
              width={this.state.width}
              height={this.state.height}
              frozen={this.state.frozen}
            />
          </div>
          <div className="col-1">
            <ToggleFrozenButton
              toggleSimulationFrozen={this.toggleSimulationFrozen}
              frozen={this.state.frozen}
            />
          </div>
        </div>
      </div>
      
    );
  }
}
