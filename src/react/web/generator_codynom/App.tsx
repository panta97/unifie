import React, { useState, useEffect, useRef } from "react";
import { 
  TextField, 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  CircularProgress,
  IconButton,
  Alert,
  Fade,
  Paper
} from "@mui/material";
import { 
  Search as SearchIcon, 
  QrCode as QrCodeIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  ContentCopy as CopyIcon
} from "@mui/icons-material";
import { QRCodeCanvas } from "qrcode.react";
import toast, { Toaster } from "react-hot-toast";

interface Product {
  barcode: string | false;
  name: string;
}

const App: React.FC = () => {
  const [barcode, setBarcode] = useState("");
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSearch = async (code: string) => {
    if (!code) return;
    
    setLoading(true);
    setError(null);
    setProduct(null);

    try {
      const response = await fetch(`/api/product-rpc/product/search_barcode?barcode=${code}`);
      const data = await response.json();

      if (data.result === "SUCCESS" && data.products && data.products.length > 0) {
        setProduct(data.products[0]);
        setBarcode("");
      } else {
        setError("Producto no encontrado.");
      }
    } catch (err) {
      setError("Error de conexión.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch(barcode);
    }
  };

  const reset = () => {
    setBarcode("");
    setProduct(null);
    setError(null);
    if (inputRef.current) inputRef.current.focus();
  };

  const qrValue = product ? `${product.barcode || barcode}/${product.name}` : "";

  const copyToClipboard = () => {
    if (!qrValue) return;
    navigator.clipboard.writeText(qrValue);
    toast.success("Copiado!", {
      duration: 2000,
      style: {
        borderRadius: "12px",
        background: "#4e73df",
        color: "#fff",
        fontWeight: 600
      },
    });
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center p-6 sm:p-12 font-sans text-[#2e3b4e]">
      <Toaster position="top-right" />
      
      <Fade in={true} timeout={800}>
        <Box sx={{ maxWidth: 500, width: "100%" }}>
          <Box className="flex items-center justify-between mb-10">
            <Box>
              <Typography variant="h4" sx={{ 
                fontWeight: 900, 
                color: "#4e73df", 
                fontSize: { xs: "1.75rem", sm: "2.25rem" },
                lineHeight: 1.1
              }}>
                Cody<span className="text-[#1a202c]">Nom</span>
              </Typography>
              <Typography variant="body2" sx={{ 
                color: "#718096", 
                fontWeight: 500,
                fontSize: { xs: "0.85rem", sm: "0.95rem" },
                mt: 0.5
              }}>
                Generador de etiquetas inteligentes
              </Typography>
            </Box>
            <IconButton 
              onClick={reset} 
              sx={{ 
                bgcolor: "white", 
                boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                "&:hover": { bgcolor: "#f8f9fc" }
              }}
            >
              <RefreshIcon sx={{ color: "#4e73df" }} />
            </IconButton>
          </Box>

          <Paper 
            elevation={0}
            sx={{ 
              borderRadius: "24px", 
              p: "6px",
              mb: 4, 
              bgcolor: "white",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.04)",
              border: "1px solid #edf2f7"
            }}
          >
            <TextField
              fullWidth
              placeholder="Escanea o escribe el código..."
              variant="outlined"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              onKeyDown={onKeyDown}
              inputRef={inputRef}
              autoComplete="off"
              disabled={loading}
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: "#a0aec0", mr: 1.5, ml: 1 }} />,
                endAdornment: loading && <CircularProgress size={20} thickness={5} />,
                sx: { 
                  borderRadius: "20px",
                  "& fieldset": { border: "none" },
                  height: "56px",
                  fontSize: "1.05rem",
                  fontWeight: 500
                }
              }}
            />
          </Paper>

          {error && (
            <Fade in={true}>
              <Box className="bg-red-50 border border-red-100 p-4 rounded-2xl mb-6 flex items-center text-red-600">
                <ErrorIcon sx={{ mr: 1.5, fontSize: "1.2rem" }} />
                <Typography sx={{ fontWeight: 600, fontSize: "0.95rem" }}>{error}</Typography>
              </Box>
            </Fade>
          )}

          {product ? (
            <Fade in={true}>
              <Paper 
                elevation={0}
                sx={{ 
                  p: 4, 
                  textAlign: "center", 
                  bgcolor: "white",
                }}
              >
                <Typography variant="h6" sx={{ 
                  fontWeight: 800, 
                  mb: 0.5, 
                  lineHeight: 1.3,
                  fontSize: { xs: "1.15rem", sm: "1.25rem" }
                }}>
                  {product.name}
                </Typography>
                <Typography variant="caption" sx={{ color: "#a0aec0", fontWeight: 700, letterSpacing: "1px", mb: 4, display: "block" }}>
                  {product.barcode || "SIN CÓDIGO"}
                </Typography>

                <Box className="mb-8">
                  <Box className="bg-white p-4 sm:p-6 rounded-[2rem] sm:rounded-[2.5rem] inline-block shadow-[0_10px_30px_rgba(0,0,0,0.05)] relative">
                    <QRCodeCanvas 
                      value={qrValue} 
                      size={window.innerWidth < 400 ? 160 : 200}
                      level={"H"} 
                      includeMargin={false}
                    />
                  </Box>
                </Box>

                <Box 
                  onClick={copyToClipboard}
                  className="bg-[#f8f9fc] p-3 sm:p-4 rounded-2xl cursor-pointer hover:bg-[#f1f3f9] transition-all group mb-8 flex items-center justify-between gap-3 w-full border border-dashed border-gray-200"
                >
                  <Typography variant="body2" sx={{ 
                    color: "#718096", 
                    fontFamily: "monospace", 
                    fontSize: { xs: "0.75rem", sm: "0.85rem" },
                    wordBreak: "break-all",
                    textAlign: "left",
                    lineHeight: 1.4,
                    flex: 1
                  }}>
                    {qrValue}
                  </Typography>
                  <Box className="bg-white p-2 rounded-xl shadow-sm border border-gray-100 flex-shrink-0">
                    <CopyIcon sx={{ fontSize: "1.1rem", color: "#4e73df" }} />
                  </Box>
                </Box>

                <Box className="mt-5">
                  <IconButton 
                    onClick={copyToClipboard} 
                    sx={{ 
                      bgcolor: "#4e73df", 
                      color: "white",
                      "&:hover": { bgcolor: "#375ad5", transform: "translateY(-2px)" },
                      borderRadius: "16px",
                      px: { xs: 4, sm: 8 },
                      py: 1.8,
                      transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                      boxShadow: "0 8px 20px rgba(78, 115, 223, 0.3)",
                      width: { xs: "100%", sm: "auto" }
                    }}
                  >
                    <Typography variant="button" sx={{ fontWeight: 700, textTransform: "none", mr: 1, fontSize: "1rem" }}>
                      Copiar CodyNom
                    </Typography>
                  </IconButton>
                </Box>
              </Paper>
            </Fade>
          ) : !loading && !error && (
            <Box className="mt-10 text-center opacity-20">
              <QrCodeIcon sx={{ fontSize: 100 }} />
              <Typography variant="body2" sx={{ mt: 1, fontWeight: 600 }}>LISTO PARA ESCANEAR</Typography>
            </Box>
          )}
        </Box>
      </Fade>
    </div>
  );
};

export default App;