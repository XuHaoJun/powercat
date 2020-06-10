import * as React from "react";
import Card from "@material-ui/core/Card";
import CardHeader from "@material-ui/core/CardHeader";
import Typography from "@material-ui/core/Typography";
import CardContent from "@material-ui/core/CardContent";
import CardActions from "@material-ui/core/CardActions";
import Button from "@material-ui/core/Button";
import IconButton from "@material-ui/core/IconButton";
import Divider from "@material-ui/core/Divider";
import Grid from "@material-ui/core/Grid";
import ReplayIcon from "@material-ui/icons/Chat";
import MoreIcon from "@material-ui/icons/MoreVert";
import seedrandom from "seedrandom";
import moment from "moment";
import { isNumber, isObject, isFunction } from "lodash";

import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";

import PostEditor from "@Components/post/PostEditor";
import { isNode } from "@Utils";

const MoreMenu = () => {
  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <div>
      <IconButton
        size="small"
        aria-controls="simple-menu"
        aria-haspopup="true"
        onClick={handleClick}
      >
        <MoreIcon />
      </IconButton>
      <Menu
        id="simple-menu"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleClose}
      >
        <MenuItem onClick={handleClose}>儲存</MenuItem>
        <MenuItem onClick={handleClose}>編輯</MenuItem>
        <MenuItem onClick={handleClose}>刪除</MenuItem>
        <MenuItem onClick={handleClose}>檢舉</MenuItem>
      </Menu>
    </div>
  );
};

const Subheader = ({ data }) => {
  const [isFirstRender, setIsFirstRender] = React.useState(true);
  const { authorName: _authorName, annoymousId, createdAt, updatedAt } = data;
  const authorName = _authorName || "無名氏";
  const isEdited = createdAt !== updatedAt;
  var elapsedTime;
  if (isFirstRender || isNode()) {
    elapsedTime = "";
    if (!isNode()) {
      setTimeout(() => {
        setIsFirstRender(false);
      });
    }
  } else {
    const nowUtc = moment().utc();
    const updatedAtUtc = moment(`${updatedAt}+0000`);
    elapsedTime = updatedAtUtc.from(nowUtc).toString();
  }
  return (
    <Typography variant="subtitle2">
      名稱:{authorName} ID:{annoymousId}
      <span> · </span>
      pid:{data.postId}
      <span> · </span>
      {elapsedTime}
    </Typography>
  );
};

// const PostNode = (props) => {
//   const subheader = <Subheader />;
//   const depth = props.depth || 0;
//   const dividers = times(depth, () => {
//     return <Divider orientation="vertical" flexItem/>;
//   });
//   return (
//     <Grid container spacing={2} style={{ width: "100%" }}>
//       {dividers}
//       <Grid items xs={11}>
//         <Card elevation={0}>
//           <CardHeader title="hahaha" subheader={subheader} />
//           <CardContent>
//             <Typography variant="body" component="p">
//               well meaning and kindly. 中文
//               <br />
//               {'"a benevolent smile"'}
//               <br />
//               中文
//             </Typography>
//           </CardContent>
//           {props.children}
//         </Card>
//       </Grid>
//     </Grid>
//   );
// };

// const PostTree = (props) => {
//   const { data } = props;
//   return (
//     <div>
//       <PostNode />
//       <PostNode depth={1} />
//     </div>
//   );
// };

function getDepthColor(depth = 0) {
  const colorMapping = ["#000000", "#4285F4", "#EA4335", "#FBBC05"];
  if (depth > 3) {
    return colorMapping[0];
  } else {
    return colorMapping[depth];
  }
}

const PostNode = (props) => {
  const { onCancel, onNodeSubmit } = props;
  const [isOpening, setIsOpening] = React.useState(false);
  const [
    disableEditorActionButton,
    setDisableEditorActionButton,
  ] = React.useState(false);
  const data = props.data || {};
  const depth = props.depth || 0;
  const limitDepth = -1;
  if (isNumber(limitDepth) && limitDepth > 0 && depth > limitDepth) {
    return null;
  }
  const subheader = <Subheader data={data} />;
  const { title, children: pChildren } = data;
  const childrenNode = (pChildren || []).map((p) => {
    return (
      <PostNode
        key={`PostNode-${p.postId}`}
        data={p}
        depth={depth + 1}
        onNodeSubmit={onNodeSubmit}
      />
    );
  });
  const borderStyle =
    depth > 0
      ? {
          borderLeft: `10px ${getDepthColor(depth)} solid`,
          borderBottom: "1px #c4c4c4 solid",
        }
      : null;
  var content;
  const handleReplayClick = (event) => {
    setIsOpening(true);
  };
  const handleCancel = (event) => {
    const newPost = { content, parentPostId: data.postId };
    setIsOpening(false);
    if (onCancel) {
      onCancel(event, newPost, data);
    }
  };
  const handleSubmit = (event) => {
    const newPost = { content, parentPostId: data.postId };
    if (onNodeSubmit) {
      const submitResult = onNodeSubmit(event, newPost, "create", data);
      if (isObject(submitResult) && isFunction(submitResult.then)) {
        setDisableEditorActionButton(true);
        submitResult.then(() => {
          setDisableEditorActionButton(false);
          setIsOpening(false);
        });
      }
    }
  };
  const handleChange = (v) => {
    content = v;
  };
  return (
    <li>
      <Card elevation={0} square style={borderStyle}>
        <CardHeader title={title} subheader={subheader} />
        <CardContent>
          <PostEditor readOnly initData={data.content || []} />
        </CardContent>
        {isOpening ? (
          <CardContent
            style={{ border: "1px #4c4c4c solid", paddingBottom: 0 }}
          >
            <PostEditor
              onChange={handleChange}
              editableProps={{ style: { height: "85px" } }}
            />
          </CardContent>
        ) : null}
        <CardActions>
          {isOpening ? (
            <Button onClick={handleCancel} disabled={disableEditorActionButton}>
              取消
            </Button>
          ) : (
            <Button
              size="small"
              startIcon={<ReplayIcon />}
              onClick={handleReplayClick}
            >
              Replay
            </Button>
          )}
          {isOpening ? (
            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmit}
              disabled={disableEditorActionButton}
            >
              送出
            </Button>
          ) : (
            <Button size="small">Share</Button>
          )}
          {isOpening ? null : <MoreMenu />}
        </CardActions>
      </Card>
      {childrenNode.length > 0 ? (
        <ul style={{ listStyle: "none" }}>{childrenNode}</ul>
      ) : null}
    </li>
  );
};

function getRandomColor(id = 0) {
  const rng = seedrandom(id);
  var letters = "0123456789ABCDEF";
  var color = "#";
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(rng() * 16)];
  }
  return color;
}

const PostTree = (props) => {
  const { data, onNodeSubmit } = props;
  const borderLeft = `2px ${getRandomColor(data.postId)} solid`;
  return (
    <ul
      style={{
        listStyle: "none",
        marigin: 0,
        padding: 0,
        borderLeft: borderLeft,
      }}
    >
      <PostNode data={data} onNodeSubmit={onNodeSubmit} />
    </ul>
  );
};

export default PostTree;
