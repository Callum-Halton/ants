import React from 'react';
import './App.css';
import Simulation from './simulation/simulation';
import CssBaseline from '@material-ui/core/CssBaseline';
import NavBar from './components/NavBar';

export default function App(props) {
  return (
    <div>
      <CssBaseline />
      <NavBar />
      <Simulation />
    </div>
  );
}
