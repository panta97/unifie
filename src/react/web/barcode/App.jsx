import { parse as PapaParse } from "papaparse";
import React, { useEffect, useRef, useState } from "react";
import "./animation.css";
import getBarcodes from "./api/barcodes";
import "./App.css";
import "./btngroup.css";
import Labels from "./Label/Labels";
import Loader from "./Loader/Loader";
import "./modal.css";
import correctCodeFormat from "./Modals/ErrorModal/errorHandler";
import ErrorModal from "./Modals/ErrorModal/ErrorModal";
import QttyModal from "./Modals/QttyModal/QttyModal";
import getLabel from "./utils/label";

function App() {
  const [labelsUniq, setLabelsUniq] = useState([]);

  const [filename, setFilename] = useState("");

  const [bcType, setBcType] = useState(1);
  const [bt1Active, setBt1Active] = useState(true);
  const [bt2Active, setBt2Active] = useState(false);
  const [bt3Active, setBt3Active] = useState(false);
  const [bt4Active, setBt4Active] = useState(false);
  const [bt5Active, setBt5Active] = useState(false);
  const [bt6Active, setBt6Active] = useState(false);

  const [modalActive, setModalActive] = useState(false);

  const [validCode, setValidCode] = useState(true);
  const [errorMsgs, setErrorMsgs] = useState([]);

  const [isLoading, setIsLoading] = useState(false);
  const [loaderType, setLoaderType] = useState(1);

  const getData = (data, fileInfo) => {
    let lblType = "";
    if (data[0].length === 9) lblType = "INGRESAR";
    else if (data[0].length === 7) lblType = "REPO-CON-ATTR";
    else if (data[0].length === 6) lblType = "REPO-SIN-ATTR";

    // update labels unique
    let labels = getLabel(data, lblType);

    // check excel code format
    const error = correctCodeFormat(labels, fileInfo.name);
    if (!error.validCode) labels = [];
    setValidCode(error.validCode);
    setErrorMsgs(error.msgs);

    setFilename(fileInfo.name);

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setLabelsUniq(labels);
    }, 1);
  };

  const hiddenCsvInput = useRef(null);
  const handleCsvInput = (_) => hiddenCsvInput.current.click();
  // ADDED OWN IMPLEMENTATION BASED ON react-csv-reader
  const csvReader = (e) => {
    if (e.target.files.length > 0) {
      const reader = new FileReader();
      const data = e.target.files[0];
      const fileInfo = { name: e.target.files[0].name };
      reader.onload = (_event) => {
        const csvData = PapaParse(
          reader.result,
          Object.assign(
            {},
            {
              encoding: "UTF-8",
            }
          )
        );
        getData(csvData.data, fileInfo);
      };
      reader.readAsText(data, "UTF-8");
    }
  };

  useEffect(() => {
    async function populateFromAPI() {
      // GET LABELS IF QUERY STRING IS SET IN URL
      const params = new URLSearchParams(window.location.search);
      let urlLabels = [];
      if (params.has("model")) {
        setIsLoading(true);
        const barcodeResult = await getBarcodes(params);
        // set purchase order id as filename
        if (params.get("model") === "purchase-order")
          setFilename(barcodeResult.purchase_order_name);
        urlLabels = getLabel(barcodeResult.labels, "LAMBDA");
        // check errors in case there are
        const error = correctCodeFormat(urlLabels, "api-file");
        if (!error.validCode) urlLabels = [];
        setValidCode(error.validCode);
        setErrorMsgs(error.msgs);
      }
      setTimeout(() => {
        setIsLoading(false);
        setLabelsUniq(urlLabels);
      }, 1);
    }
    populateFromAPI();
  }, []);

  const setActive = (type) => {
    let btns = {
      1: false,
      2: false,
      3: false,
      4: false,
      5: false,
      6: false,
    };
    btns[String(type)] = true;
    setBt1Active(btns["1"]);
    setBt2Active(btns["2"]);
    setBt3Active(btns["3"]);
    setBt4Active(btns["4"]);
    setBt5Active(btns["5"]);
    setBt6Active(btns["6"]);
    setIsLoading(true);
    setLoaderType(Number(type));
    setTimeout(() => {
      setIsLoading(false);
      setBcType(Number(type));
    }, 1);
  };

  const showModal = () => {
    setModalActive(true);
  };

  const closeErrorModal = () => {
    setValidCode(true);
    setErrorMsgs([]);
  };

  return (
    <div>
      <div className="top-header">
        <div className="header">
          <div className="col-1">
            {/* btn CHOOSE FILE */}
            <button
              className="btn-csv"
              onClick={handleCsvInput}
              tabIndex={modalActive ? -1 : 0}
            >
              Seleccionar
            </button>
            {/* CSV HIDDEN INPUT */}
            <input
              type="file"
              accept=".csv, text/csv"
              ref={hiddenCsvInput}
              style={{ display: "none" }}
              onChange={csvReader}
              onClick={(event) => {
                event.target.value = null;
              }}
            />

            {/* btn PRINT */}
            <div id="no-print">
              <button
                className="btn-print"
                onClick={() => window.print()}
                tabIndex={modalActive ? -1 : 0}
              >
                Imprimir
              </button>
            </div>

            {/* btn QUANTITIES */}
            <button
              className="btn-modal"
              onClick={showModal}
              tabIndex={modalActive ? -1 : 0}
            >
              Cantidades
            </button>
          </div>
          <div className="col-2">
            <div className="filename">{filename}</div>
          </div>
          <div className="col-3">
            <div className="btn-group">
              <button
                className={bt1Active ? "btn-bctype active" : "btn-bctype"}
                onClick={() => setActive(1)}
                tabIndex={modalActive ? -1 : 0}
              >
                <div className="img-type-1" />
              </button>
              <button
                className={bt2Active ? "btn-bctype active" : "btn-bctype"}
                onClick={() => setActive(2)}
                tabIndex={modalActive ? -1 : 0}
              >
                <div className="img-type-2" />
              </button>
              <button
                className={bt3Active ? "btn-bctype active" : "btn-bctype"}
                onClick={() => setActive(3)}
                tabIndex={modalActive ? -1 : 0}
              >
                <div className="img-type-3" />
              </button>
              <button
                className={bt4Active ? "btn-bctype active" : "btn-bctype"}
                onClick={() => setActive(4)}
                tabIndex={modalActive ? -1 : 0}
              >
                <div className="img-type-4" />
              </button>
              <button
                className={bt5Active ? "btn-bctype active" : "btn-bctype"}
                onClick={() => setActive(5)}
                tabIndex={modalActive ? -1 : 0}
              >
                <div className="img-type-1" />
              </button>
              <button
                className={bt6Active ? "btn-bctype active" : "btn-bctype"}
                onClick={() => setActive(6)}
                tabIndex={modalActive ? -1 : 0}
              >
                <div className="img-type-2" />
              </button>
            </div>
          </div>
        </div>
        <h1 className="lbl-total">
          Etiquetas:{" "}
          {isLoading
            ? "cargando"
            : labelsUniq.reduce((acc, curr) => (acc += curr.qtt), 0)}
          {isLoading ? <div className="lds-dual-ring"></div> : null}
        </h1>
      </div>

      {isLoading ? (
        <Loader loaderType={loaderType} />
      ) : (
        <Labels bcType={bcType} labelsUniq={labelsUniq} />
      )}

      {/* modal html */}
      {modalActive ? (
        <QttyModal
          labels={labelsUniq}
          setLabelsUniq={setLabelsUniq}
          setModalActive={setModalActive}
          modalActive={modalActive}
          setIsLoading={setIsLoading}
        />
      ) : null}

      {/* modal error */}
      {validCode ? null : (
        <ErrorModal errorMsgs={errorMsgs} closeErrorModal={closeErrorModal} />
      )}
    </div>
  );
}

export default App;
