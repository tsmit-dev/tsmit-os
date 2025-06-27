"use client"

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";

interface QrScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanError?: (errorMessage: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const QrScanner: React.FC<QrScannerProps> = ({ onScanSuccess, onScanError, isOpen, onClose }) => {
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const qrCodeRegionId = "qr-code-reader";
  const [isDialogReady, setIsDialogReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraInitializing, setIsCameraInitializing] = useState(false);

  useEffect(() => {
    if (isOpen && isDialogReady) {
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode(qrCodeRegionId);
      }

      const html5QrCode = html5QrCodeRef.current;

      // Only start if not already scanning and no critical error occurred
      if (!html5QrCode.isScanning && !cameraError) { // Removed () from isScanning
        setIsCameraInitializing(true); // Indicate camera is starting
        setCameraError(null); // Clear previous errors on a new attempt

        html5QrCode.start(
          { facingMode: { exact: "environment" } }, // Strongly prefer the environment-facing camera
          { 
            fps: 10, 
            qrbox: { width: 250, height: 250 },
            // Optional: formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
            // You can also add more advanced constraints here, e.g., resolution
            // videoConstraints: { width: 1280, height: 720, facingMode: { exact: "environment" } }
          },
          (decodedText, decodedResult) => {
            const osId = decodedText.split('/').pop();
            if (osId) {
              onScanSuccess(osId);
            } else {
              onScanError?.("Não foi possível extrair o ID da OS do QR Code.");
            }
            onClose(); 
          },
          (errorMessage) => {
            // This callback is for continuous scan errors (e.g., no QR code found), not init errors
            // console.warn("Scan error:", errorMessage); // For debugging, avoid logging too much
            // if (onScanError) { onScanError(errorMessage); }
          }
        ).then(() => {
          setIsCameraInitializing(false); // Camera successfully started
          console.log("Html5Qrcode scanner iniciado com sucesso.");
        }).catch(err => {
          console.error("Falha ao iniciar o scanner de QR Code:", err);
          setCameraError(`Erro ao iniciar a câmera: ${err.message || err}. Por favor, verifique as permissões da câmera e tente novamente.`);
          setIsCameraInitializing(false); // Initialization failed
          // Ensure scanner is stopped if start failed
          if (html5QrCode.isScanning) { // Removed () from isScanning
            html5QrCode.stop().catch(stopErr => console.error("Error stopping scanner after start failure:", stopErr));
          }
        });
      }
    } 

    // Cleanup function: runs when isOpen changes to false, or component unmounts
    return () => {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) { // Removed () from isScanning
        html5QrCodeRef.current.stop()
          .then(() => {
            console.log("Html5Qrcode parado com sucesso.");
          })
          .catch(error => {
            console.error("Falha ao parar Html5Qrcode", error);
          })
          .finally(() => {
            html5QrCodeRef.current = null;
            setIsCameraInitializing(false);
            setCameraError(null); // Clear errors on cleanup
          });
      } else if (html5QrCodeRef.current && !html5QrCodeRef.current.isScanning) { // Removed () from isScanning
         // If scanner was instantiated but not started or already stopped, just nullify ref
         html5QrCodeRef.current = null;
         setIsCameraInitializing(false);
         setCameraError(null);
      }
    };
  }, [isOpen, isDialogReady, onScanSuccess, onScanError, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="sm:max-w-[425px]"
        onOpenAutoFocus={(e) => {
          e.preventDefault(); // Prevents default focus behavior
          setIsDialogReady(true);
        }}
        onCloseAutoFocus={(e) => {
          e.preventDefault(); // Prevents default focus behavior
          setIsDialogReady(false);
        }}
      >
        <DialogHeader>
          <DialogTitle>Escanear QR Code</DialogTitle>
          <DialogDescription>
            Posicione o QR Code dentro da área de leitura.
          </DialogDescription>
        </DialogHeader>
        {cameraError && <p className="text-red-500 text-sm mt-2 text-center">{cameraError}</p>}
        {isCameraInitializing && !cameraError && (
          <p className="text-center text-gray-500 mt-4">Iniciando câmera...</p>
        )}
        {/* Render the scanner div always when dialog is open and ready. Html5Qrcode will populate it. */}
        {isOpen && isDialogReady && <div id={qrCodeRegionId} style={{ width: "100%" }}></div>}
      </DialogContent>
    </Dialog>
  );
};

export default QrScanner;