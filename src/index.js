import React, { Component } from "react";
import { View } from "react-native";
import PropTypes from "prop-types";
import { WebView } from "react-native-webview";

import { getMinifiedEChartsFramework } from "./chartconfig";
import * as jsBuilder from "./jsBuilder";

class ECharts extends Component {
  static propTypes = {
    onData: PropTypes.func,
    legacyMode: PropTypes.bool,
    canvas: PropTypes.bool,
    onLoadEnd: PropTypes.func,
    backgroundColor: PropTypes.string,
    customTemplatePath: PropTypes.string
  };

  static defaultProps = {
    onData: () => {},
    legacyMode: false,
    canvas: false,
    onLoadEnd: () => {},
    height: '100%',
    width: '100%',
    backgroundColor: "rgba(0, 0, 0, 0)"
  };

  constructor(props) {
    super(props);
    this.onGetHeight = null;
    this.callbacks = {};

    this.html = `
      <!DOCTYPE html>
      <html lang="de">
        <head>
            <meta http-equiv="content-type" content="text/html; charset=utf-8">
            <meta name="viewport" content="initial-scale=1, maximum-scale=3, minimum-scale=1, user-scalable=no">
            <style type="text/css">
                html,body {
                height: 100%;
                width: 100%;
                margin: 0;
                padding: 0;
                background-color: ${props.backgroundColor};
                }
                #main {
                height: ${props.height};
                width: ${props.width};
                background-color: ${props.backgroundColor};
                }
            </style>
            
            <script>
                ${getMinifiedEChartsFramework()}
            </script>
        </head>

        <body>
            <div id="main">
            </div>
        </body>

      </html>`;
  }

  onMessage = e => {
    try {
      if (!e) return null;

      const { onData } = this.props;

      const data = JSON.parse(unescape(unescape(e.nativeEvent.data)));

      if (data.types === "DATA") {
        onData(data.payload);
      } else if (data.types === "CALLBACK") {
        /* eslint-disable no-case-declarations */
        const { uuid } = data;
        /* eslint-enable no-case-declarations */
        this.callbacks[uuid](data.payload);
      }
    } catch (error) {
      console.log(error);
    }
  };

  postMessage = data => {
    this.webview.postMessage(jsBuilder.convertToPostMessageString(data));
  };

  ID = () => (
    `_${Math.random()
      .toString(36)
      .substr(2, 9)}`);

  setBackgroundColor = color => {
    const data = {
      types: "SET_BACKGROUND_COLOR",
      color
    };
    this.postMessage(data);
  };

  getOption = (callback, properties = undefined) => {
    const uuid = this.ID();
    this.callbacks[uuid] = callback;
    const data = {
      types: "GET_OPTION",
      uuid,
      properties
    };
    this.postMessage(data);
  };

  setOption = (option, notMerge, lazyUpdate) => {
    const data = {
      types: "SET_OPTION",
      payload: {
        option,
        notMerge: notMerge || false,
        lazyUpdate: lazyUpdate || false
      }
    };
    this.postMessage(data);
  };

  clear = () => {
    const data = {
      types: "CLEAR"
    };
    this.postMessage(data);
  };

  getWebViewRef = ref => {
    this.webview = ref;
  };

  render() {
    let source = {};

    if (this.props.customTemplatePath) {
      source = {
        uri: this.props.customTemplatePath
      };
    } else {
      source = {
        html: this.html,
        baseUrl: ""
      };
    }

    return (
      <View style={{ flex: 1 }}>
        <WebView
          ref={this.getWebViewRef}
          originWhitelist={["*"]}
          scrollEnabled={false}
          source={source}
          injectedJavaScript={jsBuilder.getJavascriptSource(this.props)}
          onMessage={this.onMessage}
          allowFileAccess
          allowUniversalAccessFromFileURLs
          mixedContentMode="always"
          onLoadEnd={this.props.onLoadEnd}
          style={{ backgroundColor: this.props.backgroundColor }}
        />
      </View>
    );
  }
}

export { ECharts };
