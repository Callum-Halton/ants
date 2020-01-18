import React from 'react';
import './App.css';
import Simulation from './simulation/simulation.js';
import CssBaseline from '@material-ui/core/CssBaseline';

export default class App extends React.Component {
  /*
  constructor(props) {
    super(props);
  }
  */

  render() {
    return (
      <React.Fragment>
        <CssBaseline />
        <div className="page>">
          <div className="page-content">
            <Simulation />
          </div>
        </div>
      </React.Fragment>
    );
  }
}
