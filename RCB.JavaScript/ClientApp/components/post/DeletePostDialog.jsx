import React from "react";
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import DeleteIcon from "@material-ui/icons/Delete";

export default function DeletePostDialog(props) {
  const { accessTokenTextFieldProps, ...otherProps } = props;
  const handleDelete = (event) => {
    if (props.onClose) {
      props.onClose(event, "delete");
    }
  };
  return (
    <Dialog aria-labelledby="form-dialog-accesstoken" {...otherProps}>
      <DialogTitle id="form-dialog-accesstoken">Delete Post</DialogTitle>
      <DialogContent>
        <DialogContentText>
          To delete to this post, please enter access token here.
        </DialogContentText>
        <TextField
          autoFocus
          margin="dense"
          id="access-token"
          label="Access Token"
          fullWidth
          {...accessTokenTextFieldProps}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={props.onClose}>Cancel</Button>
        <Button
          onClick={handleDelete}
          color="primary"
          color="secondary"
          variant="contained"
          startIcon={<DeleteIcon />}
        >
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
}
