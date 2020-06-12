import React from "react";
import Button from "@material-ui/core/Button";
import RefreshIcon from "@material-ui/icons/Refresh";
import LazyLoad from "react-lazyload";

class LoadMoreButtonOri extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: false,
    };
    this.isFirstMount = false;
  }

  componentDidMount() {
    if (this.isFirstMount == false) {
      this.handleRequireMore();
    } else {
      this.isFirstMount = true;
    }
  }

  componentWillUnmount() {
    this.setState = () => {};
  }

  handleRequireMore = async () => {
    if (this.props.onRequireLoadMore) {
      const promise = this.props.onRequireLoadMore();
      if (promise && promise.then) {
        this.setState({ loading: true });
        await promise;
        this.setState({ loading: false });
      }
    }
  };

  render() {
    const { onRequireLoadMore, onClick, children, ...otherProps } = this.props;
    const handleRequireLoadMore = (event) => {
      if (onClick) {
        onClick(event);
      }
      this.handleRequireMore(event);
    };
    return (
      <Button
        disabled={this.state.loading}
        variant="contained"
        startIcon={<RefreshIcon />}
        {...otherProps}
        onClick={handleRequireLoadMore}
      >
        {children || "Load More"}
      </Button>
    );
  }
}

export default function LoadMoreButton(props) {
  const button = <LoadMoreButtonOri {...props} />;
  return (
    <LazyLoad height={40} unmountIfInvisible>
      {button}
    </LazyLoad>
  );
}
