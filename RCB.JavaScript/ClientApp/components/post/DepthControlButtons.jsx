import React from "react";
import Button from "@material-ui/core/Button";
import ButtonGroup from "@material-ui/core/ButtonGroup";
import IconButton from "@material-ui/core/IconButton";
import { withStyles } from "@material-ui/core/styles";
import RefreshIcon from "@material-ui/icons/Refresh";
import CircularProgress from "@material-ui/core/CircularProgress";
import { throttle } from "lodash";
import LocationOnIcon from "@material-ui/icons/LocationOn";
import NavigationIcon from "@material-ui/icons/Navigation";

const styles = (theme) => ({
  root: {
    userSelect: "none",
    display: "flex",
    "& > *": {
      margin: theme.spacing(1),
    },
  },
});

class DepthControlButtons extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: false,
      maxDepth: Infinity,
    };
  }

  componentWillUnmount() {
    this.setState = () => {};
  }

  _handleRefresh = throttle(async (event) => {
    const { loading } = this.state;
    if (this.props.onRequireRefresh) {
      if (loading == false) {
        const promise = this.props.onRequireRefresh();
        if (promise && promise.then) {
          this.setState({ loading: true });
          await promise;
          this.setState({ loading: false });
        }
      }
    }
  }, 1500);

  handleRefresh = async (event) => {
    return this._handleRefresh();
  };

  handleDepthLimit = (maxDepth) => (event) => {
    this.setState({ maxDepth });
    if (this.props.onRequireDepthLimit) {
      this.props.onRequireDepthLimit(maxDepth);
    }
  };

  backToTop = () => {
    window.scrollTo(0, 0);
  };

  render() {
    const { loading, maxDepth } = this.state;
    const { classes } = this.props;
    return (
      <div className={classes.root}>
        <ButtonGroup
          orientation="vertical"
          aria-label="vertical outlined primary button group"
        >
          <IconButton
            style={{ backgroundColor: "#ffffff", height: 80, width: 80 }}
            onClick={this.handleRefresh}
            disabled={loading}
          >
            {loading ? <CircularProgress /> : <RefreshIcon />}
          </IconButton>
          <Button
            onClick={this.handleDepthLimit(0)}
            style={{
              backgroundColor: "#ffffff",
              height: 80,
              width: 80,
              color: "black",
            }}
          >
            {maxDepth == 0 ? <LocationOnIcon /> : <span />}
          </Button>
          <Button
            onClick={this.handleDepthLimit(1)}
            style={{ backgroundColor: "#4285F4", height: 80, color: "white" }}
          >
            {maxDepth == 1 ? <LocationOnIcon /> : <span />}
          </Button>
          <Button
            onClick={this.handleDepthLimit(2)}
            style={{ backgroundColor: "#EA4335", height: 80, color: "white" }}
          >
            {maxDepth == 2 ? <LocationOnIcon /> : <span />}
          </Button>
          <Button
            onClick={this.handleDepthLimit(3)}
            style={{ backgroundColor: "#FBBC05", height: 80, color: "white" }}
          >
            {maxDepth == 3 ? <LocationOnIcon /> : <span />}
          </Button>
          <Button
            onClick={this.handleDepthLimit(Infinity)}
            style={{ backgroundColor: "#000000", height: 80, color: "white" }}
          >
            {maxDepth == Infinity ? <LocationOnIcon /> : <span />}
          </Button>
          <Button style={{ height: 60 }} onClick={this.backToTop}>
            <NavigationIcon />
          </Button>
        </ButtonGroup>
      </div>
    );
  }
}

export default withStyles(styles)(DepthControlButtons);
