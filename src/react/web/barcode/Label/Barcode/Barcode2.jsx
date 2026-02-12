import QRCode from "react-qr-code";
import React from "react";
import MicroQR from "./MicroQR";
import "./Barcode.css";

function Barcode2({ lblLeft, lblMid, lblRight, id }) {
  const renderCode = (code) => {
    if (!code) return null;
    return code.includes("/") ? (
      <>
        <span
          style={{ display: "block", fontSize: "7px", textAlign: "center" }}
        >
          {code.split("/")[0]}
        </span>
        <span
          style={{
            display: "block",
            fontSize: "7px",
            fontWeight: "bold",
            textAlign: "center",
          }}
        >
          {code.split("/")[1]}
        </span>
      </>
    ) : (
      code
    );
  };

  const renderQR = (code, suffix) => {
    if (!code) return null;
    if (code.includes("/")) {
      return <QRCode value={code} size={50} level={"H"} />;
    } else {
      return (
        <MicroQR
          codeType={"microqrcode"}
          value={code}
          scale={12}
          size={100}
          id={`${id}${suffix}`}
        />
      );
    }
  };

  return (
    <div className="type-3">
      <div className="container">
        {lblLeft && (
          <div>
            <h2 className="price">{lblLeft.price}</h2>
            <div className="barcode">{renderQR(lblLeft.code, "l")}</div>
            <p className="code">{renderCode(lblLeft.code)}</p>
          </div>
        )}
        {lblMid && (
          <div>
            <h2 className="price">{lblMid.price}</h2>
            <div className="barcode">{renderQR(lblMid.code, "m")}</div>
            <p className="code">{renderCode(lblMid.code)}</p>
          </div>
        )}
        {lblRight && (
          <div>
            <h2 className="price">{lblRight.price}</h2>
            <div className="barcode">{renderQR(lblRight.code, "r")}</div>
            <p className="code">{renderCode(lblRight.code)}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Barcode2;
