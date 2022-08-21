import React from 'react';
import "./Loader.css";


function Loader({loaderType}) {

  if(loaderType === 1) {
    return (
      <div id="section-to-print-type1">
        <div className="loader-type-1"></div>
        <div className="loader-type-1"></div>
        <div className="loader-type-1"></div>
        <div className="loader-type-1"></div>
        <div className="loader-type-1"></div>
        <div className="loader-type-1"></div>
        <div className="loader-type-1"></div>
        <div className="loader-type-1"></div>
        <div className="loader-type-1"></div>
        <div className="loader-type-1"></div>
        <div className="loader-type-1"></div>
        <div className="loader-type-1"></div>
        <div className="loader-type-1"></div>
        <div className="loader-type-1"></div>
        <div className="loader-type-1"></div>
        <div className="loader-type-1"></div>
        <div className="loader-type-1"></div>
        <div className="loader-type-1"></div>
        <div className="loader-type-1"></div>
        <div className="loader-type-1"></div>
        <div className="loader-type-1"></div>
        <div className="loader-type-1"></div>
        <div className="loader-type-1"></div>
        <div className="loader-type-1"></div>
        <div className="loader-type-1"></div>
        <div className="loader-type-1"></div>
        <div className="loader-type-1"></div>
        <div className="loader-type-1"></div>
      </div>
    );
  } else if (loaderType === 2 || loaderType === 3 || loaderType === 4) {
    return (
    <div id="section-to-print-type2">
        <div className="loader-type-2"></div>
        <div className="loader-type-2"></div>
        <div className="loader-type-2"></div>
        <div className="loader-type-2"></div>
        <div className="loader-type-2"></div>
        <div className="loader-type-2"></div>
        <div className="loader-type-2"></div>
        <div className="loader-type-2"></div>
        <div className="loader-type-2"></div>
        <div className="loader-type-2"></div>
        <div className="loader-type-2"></div>
        <div className="loader-type-2"></div>
        <div className="loader-type-2"></div>
        <div className="loader-type-2"></div>
        <div className="loader-type-2"></div>
        <div className="loader-type-2"></div>
        <div className="loader-type-2"></div>
        <div className="loader-type-2"></div>
        <div className="loader-type-2"></div>
        <div className="loader-type-2"></div>
        <div className="loader-type-2"></div>
        <div className="loader-type-2"></div>
        <div className="loader-type-2"></div>
        <div className="loader-type-2"></div>
        <div className="loader-type-2"></div>
        <div className="loader-type-2"></div>
        <div className="loader-type-2"></div>
        <div className="loader-type-2"></div>
        <div className="loader-type-2"></div>
        <div className="loader-type-2"></div>
        <div className="loader-type-2"></div>
        <div className="loader-type-2"></div>
        <div className="loader-type-2"></div>
        <div className="loader-type-2"></div>
        <div className="loader-type-2"></div>
        <div className="loader-type-2"></div>
        <div className="loader-type-2"></div>
        <div className="loader-type-2"></div>
        <div className="loader-type-2"></div>
        <div className="loader-type-2"></div>
        <div className="loader-type-2"></div>
        <div className="loader-type-2"></div>
        <div className="loader-type-2"></div>
        <div className="loader-type-2"></div>
        <div className="loader-type-2"></div>
        <div className="loader-type-2"></div>
        <div className="loader-type-2"></div>
        <div className="loader-type-2"></div>
        <div className="loader-type-2"></div>
        <div className="loader-type-2"></div>
        <div className="loader-type-2"></div>
        <div className="loader-type-2"></div>
        <div className="loader-type-2"></div>
        <div className="loader-type-2"></div>
        <div className="loader-type-2"></div>
        <div className="loader-type-2"></div>
        <div className="loader-type-2"></div>
        <div className="loader-type-2"></div>
        <div className="loader-type-2"></div>
        <div className="loader-type-2"></div>
        <div className="loader-type-2"></div>
        <div className="loader-type-2"></div>
        <div className="loader-type-2"></div>
        <div className="loader-type-2"></div>
        <div className="loader-type-2"></div>
        <div className="loader-type-2"></div>
        <div className="loader-type-2"></div>
    </div>
    );
  }
}

export default Loader;
