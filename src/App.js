import React from 'react';
import './App.css';
import Simulation from './simulation.js';

export default class App extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className="container top-level">
        <Simulation />
      </div>
    );
  }
}
