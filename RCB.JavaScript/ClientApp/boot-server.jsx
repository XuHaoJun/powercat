import * as React from "react";
import SessionManager from "@Core/session";
import configureStore from "@Store/configureStore";
import { createServerRenderer } from "aspnet-prerendering";
import { replace } from "connected-react-router";
import { addDomainWait, getCompletedTasks } from "domain-wait";
import { createMemoryHistory } from "history";
import { renderToString } from "react-dom/server";
import { Helmet } from "react-helmet";
import { Provider } from "react-redux";
import { StaticRouter } from "react-router-dom";
import { routes } from "./routes";
import responseContext from "@Core/responseContext";
import { ServerStyleSheets, ThemeProvider } from "@material-ui/core/styles";
import theme from "./styles/theme";

var renderHelmet = () => {
  var helmetData = Helmet.renderStatic();
  var helmetStrings = "";
  for (var key in helmetData) {
    if (helmetData.hasOwnProperty(key)) {
      helmetStrings += helmetData[key].toString();
    }
  }
  return helmetStrings;
};

var createGlobals = (session, initialReduxState, helmetStrings, css = "") => {
  return {
    completedTasks: getCompletedTasks(),
    session,
    initialReduxState,
    helmetStrings,
    css,
  };
};

export default createServerRenderer((params) => {
  SessionManager.resetSession();
  SessionManager.initSession(params.data);

  return new Promise((resolve, reject) => {
    // Prepare Redux store with in-memory history, and dispatch a navigation event.
    // corresponding to the incoming URL.
    const basename = params.baseUrl.substring(0, params.baseUrl.length - 1); // Remove trailing slash.
    const urlAfterBasename = params.url.substring(basename.length);
    const store = configureStore(createMemoryHistory());
    store.dispatch(replace(urlAfterBasename));

    // Prepare an instance of the application and perform an inital render that will
    // cause any async tasks (e.g., data access) to begin.
    const routerContext = {};

    const _app = (
      <ThemeProvider theme={theme}>
        <Provider store={store}>
          <StaticRouter
            basename={basename}
            context={routerContext}
            location={params.location.path}
            children={routes}
          />
        </Provider>
      </ThemeProvider>
    );

    const renderApp = ({ enableCss = true } = { enableCss: true }) => {
      if (enableCss) {
        const sheets = new ServerStyleSheets();
        const app = sheets.collect(_app);
        const html = renderToString(app);
        const css = sheets.toString();
        return { css, html };
      } else {
        const app = _app;
        const html = renderToString(app);
        return { html };
      }
    };

    addDomainWait(params);

    renderApp({ enableCss: false });

    // If there's a redirection, just send this information back to the host application.
    if (routerContext.url) {
      resolve({
        redirectUrl: routerContext.url,
        globals: createGlobals(params.data, store.getState(), renderHelmet()),
        statusCode: responseContext.statusCode,
      });
      return;
    }

    // Once any async tasks are done, we can perform the final render.
    // We also send the redux store state, so the client can continue execution where the server left off.
    const { html, css } = renderApp();
    params.domainTasks.then(() => {
      resolve({
        html: html,
        globals: createGlobals(
          params.data,
          store.getState(),
          renderHelmet(),
          css
        ),
        statusCode: responseContext.statusCode,
      });
    }, reject); // Also propagate any errors back into the host application.
  });
});
