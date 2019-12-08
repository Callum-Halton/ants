import React from 'react';
import './App.css';
import Simulation from './simulation/simulation.js';

export default class App extends React.Component {
  /*
  constructor(props) {
    super(props);
  }
  */

  render() {
    return (
      <div className="page>">
        <div className="page-content">
          <Simulation />
        </div>
      </div>
    );
  }
}
