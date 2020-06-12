import * as React from "react";
import { Helmet } from "react-helmet";
import { connect } from "react-redux";
import { wait } from "domain-wait";
import { map, isArray, isString, isObject } from "lodash";

import Paper from "@material-ui/core/Paper";
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import * as PostStore from "@Store/PostStore";

import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";

import PostTree from "@Components/post/PostTree";
import PostEditor from "@Components/post/PostEditor";

const PostVariantTabs = ({ onChange }) => {
  const [value, setValue] = React.useState(0);
  const indexVariantMapping = {
    0: "post",
    1: "image/video",
    2: "link",
    3: "poll",
  };
  const handleChange = (event, newValue) => {
    setValue(newValue);
    if (onChange) {
      onChange(event, indexVariantMapping[newValue]);
    }
  };
  return (
    <Tabs
      value={value}
      indicatorColor="primary"
      textColor="primary"
      onChange={handleChange}
      aria-label="post variant select"
    >
      <Tab label="Post" />
      <Tab label="Image/Video" disabled />
      <Tab label="Link" disabled />
      <Tab label="Poll" disabled />
    </Tabs>
  );
};

const OrderByTabs = () => {
  const [value, setValue] = React.useState(0);
  const handleChange = (event, newValue) => {
    setValue(newValue);
  };
  return (
    <Tabs
      value={value}
      indicatorColor="primary"
      textColor="primary"
      onChange={handleChange}
      aria-label="root post orderby select"
    >
      <Tab label="New" />
      <Tab label="Hot" disabled />
      <Tab label="Best" disabled />
    </Tabs>
  );
};

const PostCreateBusttons = ({ onClick }) => {
  const handleClick = (event) => {
    if (onClick) {
      onClick(event);
    }
  };
  return (
    <TextField
      id="post-form"
      label="撰寫貼文......"
      variant="outlined"
      onClick={handleClick}
      style={{ width: "50%" }}
    />
  );
};

function contentHasMinText(nodes, targetCount, _count = 0) {
  if (_count >= targetCount) {
    return true;
  } else {
    var i;
    var children = [];
    var nextCount = _count;
    for (i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      console.log("node", node);
      console.log("node.text", node.text);
      if (isString(node.text)) {
        nextCount += node.text.length;
        if (nextCount >= targetCount) {
          return true;
        }
      }
      if (isArray(node.children)) {
        children = [...children, ...node.children];
      }
    }
    if (children.length > 0) {
      return contentHasMinText(children, targetCount, nextCount);
    } else {
      return false;
    }
  }
}

import Grid from "@material-ui/core/Grid";

const LinkForm = () => {
  const [formData, setFormData] = React.useState({});
  return (
    <Grid container spacing={3} alignItems="center">
      <Grid xs={12}>
        <TextField
          required
          fullWidth
          id="post-title-form"
          label="Title"
          variant="outlined"
        />
      </Grid>
      <Grid xs={12}>
        <TextField
          required
          fullWidth
          id="post-title-form"
          label="Url"
          rows={4}
          variant="outlined"
        />
      </Grid>
    </Grid>
  );
};

const PostForm = ({ onSubmit, onCancel, disabled = false }) => {
  const [formData, setFormData] = React.useState({});
  const [title, setTitle] = React.useState("");
  const [titleFirstFocusing, setTitleFirstFocusing] = React.useState(false);
  const handleTitleChange = (event) => {
    setTitle(event.target.value.trim());
  };
  const [content, setContent] = React.useState([]);
  const [error, setError] = React.useState(null);
  const handleContentChange = (nextContent) => {
    setContent(nextContent);
  };
  const getNewPost = () => {
    return { title, content, ...formData };
  };
  const newPost = getNewPost();
  const titleError = "Require more than 5 char.";
  const contentError = "Content require more than 5 char.";
  const hasErrors = (err) => {
    return err == titleError || err == contentError;
  };
  const validateTitle = (t) => {
    if (isString(t)) {
      if (t.length < 5) {
        return titleError;
      } else {
        return true;
      }
    } else {
      return false;
    }
  };
  const validate = (p) => {
    if (isObject(p)) {
      const vResult = validateTitle(p.title);
      if (hasErrors(vResult)) {
        return vResult;
      }
      if (isObject(p.content)) {
        if (!contentHasMinText(p.content, 5)) {
          return contentError;
        }
      } else {
        return contentError;
      }
      return true;
    } else {
      return false;
    }
  };
  var valResult = validateTitle(newPost.title);
  if (hasErrors(valResult)) {
    if (error != valResult) {
      setError(valResult);
    }
  } else {
    if (error != null) {
      setError(null);
    }
  }
  const handleSubmit = (event) => {
    event.preventDefault();
    const newPost = getNewPost();
    var valResult = validate(newPost);
    setTitleFirstFocusing(true);
    if (!hasErrors(valResult)) {
      if (onSubmit) {
        onSubmit(event, newPost);
      }
    }
  };
  const handleCancel = (event) => {
    if (onCancel) {
      const newPost = getNewPost();
      onCancel(event, newPost);
    }
  };
  const handleFormChange = (prop) => (event) => {
    setFormData({ ...formData, [prop]: event.target.value.trim() });
  };
  return (
    <Paper elevation={0} style={{ minHeight: 30, padding: 10 }}>
      <Grid container spacing={3} alignItems="center">
        <Grid item xs={12}>
          <PostVariantTabs />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Name"
            variant="outlined"
            value={formData.authorName}
            onChange={handleFormChange("authorName")}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Email"
            variant="outlined"
            value={formData.email}
            onChange={handleFormChange("email")}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="AccessToken"
            variant="outlined"
            size="small"
            helperText="編輯或刪除用。英數8字元以內"
            value={formData.accessToken}
            onChange={handleFormChange("accessToken")}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            onFocus={() => {
              setTitleFirstFocusing(true);
            }}
            onBlur={() => {
              // setTitleFocusing(false);
            }}
            required
            fullWidth
            error={error == titleError && titleFirstFocusing}
            helperText={
              error == titleError && titleFirstFocusing ? error : null
            }
            id="post-title-form"
            label="Title"
            variant="outlined"
            value={title}
            onChange={handleTitleChange}
          />
        </Grid>
        <Grid item xs={12}>
          <div
            style={{
              border: "1px solid #C4C4C4",
              padding: 5,
              marginBottom: 30,
            }}
          >
            <PostEditor
              data={content}
              onChange={handleContentChange}
              editableProps={{ style: { minHeight: 160 } }}
            />
          </div>
        </Grid>
      </Grid>
      <div>
        <Button onClick={handleCancel} disabled={disabled}>
          取消
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSubmit}
          disabled={disabled}
          type="submit"
        >
          送出
        </Button>
      </div>
    </Paper>
  );
};

import DepthControlButtons from "@Components/post/DepthControlButtons";
import LoadMoreButton from "@Components/shared/LoadMoreButton";

class BoardPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      page: 1,
      postFormVariant: null,
      isFething: false,
      maxDepth: Infinity,
    };
    wait(async () => {
      await props.getByPage(1);
    }, "BoardPage init Task");
  }

  handleClickCreateButton = (event) => {
    this.setState({ postFormVariant: "post" });
  };

  handleSubmit = async (event, newPost) => {
    this.setState({ isFething: true });
    const result = await this.props.add(newPost);
    if (!result.hasErrors) {
      this.setState({ postFormVariant: null });
    }
    this.setState({ isFething: false });
  };

  handleCancel = (event) => {
    this.setState({ postFormVariant: null });
  };

  render() {
    const props = this.props;
    const postForest = map(props.collection, (tree) => {
      return (
        <div key={`PostForest-${tree.postId}`} style={{ marginBottom: 20 }}>
          <PostTree
            data={tree}
            onNodeSubmit={this.handleSubmit}
            maxDepth={this.state.maxDepth}
          />
        </div>
      );
    });
    return (
      <React.Fragment>
        <Helmet>
          <title>PowerCat</title>
        </Helmet>

        <div>
          {!this.state.postFormVariant ? (
            <div style={{ marginBottom: 20 }}>
              <Paper elevation={0}>
                <PostCreateBusttons onClick={this.handleClickCreateButton} />
              </Paper>
            </div>
          ) : null}
          {this.state.postFormVariant ? (
            <div style={{ marginBottom: 20 }}>
              <PostForm
                onSubmit={this.handleSubmit}
                onCancel={this.handleCancel}
                disabled={this.state.isFething}
              />
            </div>
          ) : null}
          <div style={{ marginBottom: 20 }}>
            <Paper elevation={0}>
              <OrderByTabs />
            </Paper>
          </div>

          <div style={{ marginBottom: 20 }}>{postForest}</div>
          <div style={{ marginBottom: 20 }}>
            <Paper>
              <LoadMoreButton
                fullWidth
                onRequireLoadMore={async () => {
                  const nextPage = this.state.page + 1;
                  await this.props.getByPage(nextPage);
                  this.setState({ page: nextPage });
                }}
              />
            </Paper>
          </div>
          <div style={{ position: "fixed", bottom: "30vh", marginLeft: -150 }}>
            <DepthControlButtons
              onRequireDepthLimit={(maxDepth) => {
                this.setState({ maxDepth: maxDepth });
              }}
              onRequireRefresh={() => {
                this.setState({ page: 1 });
                this.props.getByPage(1);
              }}
            />
          </div>
        </div>
      </React.Fragment>
    );
  }
}

const connectedComponent = connect(
  (state) => state.post, // Selects which state properties are merged into the component's props.
  PostStore.actionCreators
)(BoardPage);

export default connectedComponent;
