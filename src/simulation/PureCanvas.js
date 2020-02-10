import React from 'react';
import Paper from '@material-ui/core/Paper';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';

const styles = {
  paper: {
    padding: '10px',
    background:'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
  },
  scrollableFrame: {
    overflow: 'scroll'
  }
};

class SimulationPane extends React.Component {

  shouldComponentUpdate() {
    return false;
  }

  render() {
    
    const { classes } = this.props;
    
    return (
      <Paper className={classes.paper}>
        <div className={classes.scrollableFrame} style={{width: this.props.paneWidth, height: this.props.paneHeight}}>
          <canvas
            onClick={(event) => this.props.canvasClick(event.nativeEvent)}
            onMouseDown={() => this.props.setMouseOnCanvas(true)}
            onMouseUp={() => this.props.setMouseOnCanvas(false)}
            onMouseLeave={() => this.props.setMouseOnCanvas(false)}
            onMouseMove={(event) => this.props.canvasMouseMovement(event.nativeEvent)}
            width={this.props.canvasWidth}
            height={this.props.canvasHeight}
            ref={node =>
              node ? this.props.contextRef(node.getContext('2d')) : null
            }
          />
        </div>
      </Paper>
    );
  }
}

SimulationPane.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(SimulationPane);
