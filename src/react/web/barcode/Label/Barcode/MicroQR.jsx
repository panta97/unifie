import React, { Component } from "react";
import bwipjs from "bwip-js";

class MicroQR extends Component {
  componentDidMount() {
    try {
      // The return value is the canvas element

      var barcodeProps = {
        bcid: this.props.codeType, // Barcode type
        text: this.props.value, // Text to encode
        scale: this.props.scale, // 3x scaling factor
        includetext: false, // Show human-readable text
        textxalign: "center", // Always good to set this
      };

      bwipjs.toCanvas(this.props.id, barcodeProps);
      // console.log(canvas);
    } catch (e) {
      // `e` may be a string or Error object
    }
  }

  render() {
    return <canvas id={this.props.id} style={{width: '45px'}}/>;
  }
}

export default MicroQR;
