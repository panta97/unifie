import React from "react";
import MicroQR from "./MicroQR";
import "./Barcode.css";

function Barcode2({ lblLeft, lblMid, lblRight, id }) {
    return (
      <div className="type-3">
        <div className="container">
          {(
              <div>
              <h2 className="price">{lblLeft.price}</h2>
              <div className="barcode">
                <MicroQR
                  codeType={"microqrcode"}
                  value={lblLeft.code}
                  scale={12}
                  size={100}
                  id={`${id}l`}
                ></MicroQR>
              </div>
              <p className="code">{lblLeft.code}</p>
            </div>
          )}
          {lblMid && (
            <div>
            <h2 className="price">{lblMid.price}</h2>
            <div className="barcode">
              <MicroQR
                codeType={"microqrcode"}
                value={lblMid.code}
                scale={12}
                size={100}
                id={`${id}m`}
              ></MicroQR>
            </div>
            <p className="code">{lblMid.code}</p>
          </div>
          )}
          {lblRight && (
            <div>
            <h2 className="price">{lblRight.price}</h2>
            <div className="barcode">
              <MicroQR
                codeType={"microqrcode"}
                value={lblRight.code}
                scale={12}
                size={100}
                id={`${id}r`}
              ></MicroQR>
            </div>
            <p className="code">{lblRight.code}</p>
          </div>
          )}
        </div>
      </div>
    );
}

export default Barcode2;
