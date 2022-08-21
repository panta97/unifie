import QRCode from "qrcode.react";
import React from "react";
import "./Barcode.css";

function Barcode({label: {code, desc, mCode, cats, price, attr}, type, id}) {

  if (type === 1) {
    return (
      <div className="type-1">
        <div className="container">
          <div className="top">
            <h2 className="price">{price}</h2>
            <p className="cat">{cats}</p>
          </div>
          <div className="middle">
            <div className="d-attr">
              <p className="attr">{attr}</p>
            </div>
            <div className="barcode">
              <QRCode
                value={code}
                size={100}
                level={"H"}
                renderAs={"svg"}
              ></QRCode>
            </div>
            <div className="d-fa-code">
              <p className="fa-code">{mCode}</p>
            </div>
          </div>

          <div className="bottom">
            <p className="code">{code}</p>
            <p className="desc">{desc}</p>
          </div>
        </div>
      </div>
    );
  } else if (type === 2) {
    return (
      <div className="type-2">
        <div className="container">
          <div className="left-side">
            <h2 className="price">{price}</h2>
            <p className="cat">{cats}</p>
            <p className="fa-code">{mCode === '' ? '-' : mCode}</p>
            <p className="desc">{desc}</p>
            <p className="attr">{attr}</p>
          </div>
          <div className="right-side">
            <div className="barcode">
              <QRCode
                value={code}
                size={50}
                level={"H"}
                renderAs={"svg"}
              ></QRCode>
            </div>
            <p className="code">{code}</p>
          </div>
        </div>
      </div>
    );
  } else if (type === 4) {
    return (
      <div className="type-4">
        <div className="container">
          <div className="left-side">
            <h2 className="price">{desc}</h2>
            <p className="cat">{cats}</p>
            <p className="fa-code">{code}</p>
            <p className="fa-code">{mCode}</p>
          </div>
          <div className="right-side">
            <div className="barcode">
              <QRCode
                value={code}
                size={50}
                level={"H"}
                renderAs={"svg"}
              ></QRCode>
            </div>
          </div>
        </div>
      </div>
    );

  }
}

export default Barcode;
