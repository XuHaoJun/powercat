import * as React from "react";
import { Helmet } from "react-helmet";
import { makeStyles } from "@material-ui/core/styles";
import Container from "@material-ui/core/Container";
import CssBaseline from "@material-ui/core/CssBaseline";
import MyAppBar from "@Components/shared/MyAppBar";

const useStyles = makeStyles((theme) => ({
  "@global": {
    body: {
      backgroundColor: "#E9EBEE",
    },
  },
}));

const MainLayout = (props) => {
  const classes = useStyles();
  return (
    <React.Fragment>
      <CssBaseline classes={classes} />
      <div>
        <Container disableGutters>
          <MyAppBar />
        </Container>
        <Container maxWidth="md" style={{ paddingTop: 48, height: "100vh" }}>
          {props.children}
        </Container>
      </div>
    </React.Fragment>
  );
};

export default MainLayout;
