import React, { useState, useEffect, useRef } from "react";
import QRCode from "react-qr-code";
import { jsPDF } from "jspdf";
import './styles/App.css';

const App: React.FC = () => {
  const [inputValue, setInputValue] = useState<string>("");
  const [qrSize, setQrSize] = useState<number>(300);
  const [format, setFormat] = useState<"png" | "jpeg" | "pdf">("png");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (inputValue && canvasRef.current) {
      QRCode.toCanvas(
        canvasRef.current,
        inputValue,
        { width: qrSize },
        (error) => {
          if (error) console.error(error);
        }
      );
    }
  }, [inputValue, qrSize]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setQrSize(Number(e.target.value));
  };

  const handleFormatChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormat(e.target.value as "png" | "jpeg" | "pdf");
  };

  const downloadQRCode = () => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    if (format === "pdf") {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF();
      pdf.addImage(imgData, "PNG", 10, 10, 100, 100);
      pdf.save("qr-code.pdf");
    } else {
      const url = canvas.toDataURL(`image/${format}`);
      const link = document.createElement("a");
      link.href = url;
      link.download = `qr-code.${format}`;
      link.click();
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>Generador de Código QR</h1>
      <input
        type="text"
        placeholder="Escribe algo..."
        value={inputValue}
        onChange={handleInputChange}
        style={{ padding: "10px", width: "300px", fontSize: "16px" }}
      />
      <div style={{ margin: "20px auto" }}>
        <canvas ref={canvasRef} />
      </div>
      <div style={{ margin: "20px auto" }}>
        <label style={{ marginRight: "10px" }}>Tamaño:</label>
        <select
          value={qrSize}
          onChange={handleSizeChange}
          style={{ padding: "5px", fontSize: "16px" }}
        >
          <option value={200}>200x200</option>
          <option value={300}>300x300</option>
          <option value={400}>400x400</option>
        </select>
      </div>
      <div style={{ margin: "20px auto" }}>
        <label style={{ marginRight: "10px" }}>Formato:</label>
        <select
          value={format}
          onChange={handleFormatChange}
          style={{ padding: "5px", fontSize: "16px" }}
        >
          <option value="png">PNG</option>
          <option value="jpeg">JPG</option>
          <option value="pdf">PDF</option>
        </select>
      </div>
      <button
        onClick={downloadQRCode}
        style={{
          padding: "10px 20px",
          fontSize: "16px",
          marginTop: "20px",
          cursor: "pointer",
        }}
      >
        Descargar QR
      </button>
    </div>
  );
};

export default App;
