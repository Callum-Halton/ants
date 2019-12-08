import React from 'react';
import './progBar.css';

function Style(width, height, backgroundColor) {
  this.width = width;
  this.height = height;
  this.backgroundColor = backgroundColor;
}

function colorString(color) {
  return `rgba(${color[0]}, ${color[1]}, ${color[2]})`;
}

export default class ProgBar extends React.Component {
  constructor(props) {
    super(props)
    this.mouser = this.mouser.bind(this);
    this.dragToggle = this.dragToggle.bind(this);
    this.state = {
      dragged: false,
      shadowProgress: this.props.progress,
    };
  }

  getProgressFromMouseEvent(event) {
    let x = event.nativeEvent.offsetX;
    x = (x < 0) ? 0 : (x > this.props.width) ? this.props.width : x;
    return (x / this.props.width);
  }

  resetProgress(progressVal) {
    this.setState({
      shadowProgress: progressVal,
    }); 
    this.props.updateProgress(progressVal)
  }

  mouser(event) {
    let progressVal = this.getProgressFromMouseEvent(event);
    if (this.state.dragged) {
      this.resetProgress(progressVal)
    } else {
      this.setState({
        shadowProgress: progressVal,
      });
    }
  }

  dragToggle(event, dragged) {
    this.setState({
      dragged: dragged,
    });
    if (this.state.dragged) {
      let progressVal = this.getProgressFromMouseEvent(event);
      this.resetProgress(progressVal);
    }
  }

  render() {
    let {width, height, color, background} = this.props;
    return (
      <div className={'progBar'} style={new Style(width, height, colorString(background))} onMouseMove={(event) => {this.mouser(event)}} onMouseDown={(event) => {this.dragToggle(event, true)}} onMouseUp={(event) => {this.dragToggle(event, false)}} onMouseLeave={(event) => {this.dragToggle(event, false)}}>
        <div className={'valueTag'}>
              {this.props.progress.toFixed(2)}
        </div>
        <div className={'progBarBar'} style={new Style(width * this.props.progress, height, colorString(color))}>
          <div className={'progBarBar'} style={new Style(width * this.state.shadowProgress, height, 'rgba(0,0,0,0.1)')}/>
        </div>
      </div>
    );
  }
}