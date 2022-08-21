import React from 'react';
import Barcode from './Barcode/Barcode';
import Barcode2 from './Barcode/Barcode2';

function Labels({bcType, labelsUniq}) {

  function updateQuantities(lbls) {
    let labelsQ = [];
    for(let i = 0; i< lbls.length; i++) {
      let label = Object.assign({}, lbls[i]);
      // qttInMen
      for (let l = 0; l < label.qtt; l++)
        labelsQ.push(label);
    }
    return labelsQ;
  }

  const labels = updateQuantities(labelsUniq);
  let htmlType;

  if (bcType === 1) {
    htmlType = (
      <div id="section-to-print-type1">
        {labels.map((label, index) => (
          <Barcode key={index} label={label} type={bcType} id={index}/>
        ))}
      </div>
    );
  } else if (bcType === 2) {
    htmlType = (
      <div id="section-to-print-type2">
        {labels.map((label, index) => (
          <Barcode key={index} label={label} type={bcType} id={index}/>
        ))}
      </div>
    );
  } else if (bcType === 3) {
    // TO COMPLETE A LABEL
    // [qr] | null | null -> [qr] | [] | []
    let [lblsLeft, lblsMid, lblsRight] = [[], [], []];
    const lblsLen = labels.length; // OPTIMIZING ?
    for (let i = 0; i < lblsLen; i += 3) {
      lblsLeft.push(labels[i]);
      lblsMid.push(labels[i+1]);
      lblsRight.push(labels[i+2]);
    }

    htmlType = (
      <div id="section-to-print-type2">
        {lblsLeft.map((_, i) => (
          <Barcode2
            key={i}
            lblLeft={lblsLeft[i]}
            lblMid={lblsMid[i]}
            lblRight={lblsRight[i]}
            id={i}
          ></Barcode2>
        ))}
      </div>
    );
  } else if (bcType === 4) {
    htmlType = (
      <div id="section-to-print-type2">
        {labels.map((label, index) => (
          <Barcode key={index} label={label} type={bcType} id={index}/>
        ))}
      </div>
    );
  }

  return htmlType;
}

export default Labels;
