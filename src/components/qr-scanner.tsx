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
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Efeito para enumerar câmeras e selecionar a traseira, se disponível
  useEffect(() => {
    if (isOpen && isDialogReady) {
      Html5Qrcode.getCameras().then(cameras => {
        if (cameras && cameras.length) {
          const rearCamera = cameras.find(camera => camera.label.toLowerCase().includes('back') || camera.label.toLowerCase().includes('environment'));
          if (rearCamera) {
            setSelectedCameraId(rearCamera.id);
          } else {
            setSelectedCameraId(cameras[0].id);
          }
          setCameraError(null);
        } else {
          setCameraError("Nenhuma câmera encontrada.");
          setSelectedCameraId(null);
        }
      }).catch(err => {
        console.error("Erro ao enumerar câmeras:", err);
        setCameraError("Não foi possível acessar as câmeras. Verifique as permissões.");
        setSelectedCameraId(null);
      });
    } else {
      setSelectedCameraId(null);
      setCameraError(null);
    }
  }, [isOpen, isDialogReady]);

  // Efeito para gerenciar o ciclo de vida do Html5Qrcode (o scanner real)
  useEffect(() => {
    if (isOpen && isDialogReady && selectedCameraId) {
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode(qrCodeRegionId);
      }

      const html5QrCode = html5QrCodeRef.current;

      if (!html5QrCode.isScanning) {
        html5QrCode.start(
          selectedCameraId, 
          { 
            fps: 10, 
            qrbox: { width: 250, height: 250 } 
          },
          (decodedText, decodedResult) => {
            // Extrai o ID da OS da URL completa
            const osId = decodedText.split('/').pop();
            if (osId) {
              onScanSuccess(osId);
            } else {
              onScanError?.("Não foi possível extrair o ID da OS do QR Code.");
            }
            onClose();
          },
          (errorMessage) => {
            if (onScanError) {
              onScanError(errorMessage);
            }
          }
        ).catch(err => {
          console.error("Falha ao iniciar o scanner de QR Code:", err);
          setCameraError(`Erro ao iniciar o scanner: ${err.message || err}`);
        });
      }
    } else if (!isOpen && html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      html5QrCodeRef.current.stop()
        .then(() => {
          console.log("Html5Qrcode parado com sucesso.");
        })
        .catch(error => {
          console.error("Falha ao parar Html5Qrcode", error);
        })
        .finally(() => {
          html5QrCodeRef.current = null;
        });
    }
  }, [isOpen, isDialogReady, selectedCameraId, onScanSuccess, onScanError, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="sm:max-w-[425px]"
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          setIsDialogReady(true);
        }}
        onCloseAutoFocus={(e) => {
          e.preventDefault();
          setIsDialogReady(false);
        }}
      >
        <DialogHeader>
          <DialogTitle>Escanear QR Code</DialogTitle>
          <DialogDescription>
            Posicione o QR Code dentro da área de leitura.
          </DialogDescription>
        </DialogHeader>
        {cameraError && <p className="text-red-500 text-sm mt-2">{cameraError}</p>}
        {isOpen && isDialogReady && selectedCameraId && <div id={qrCodeRegionId} style={{ width: "100%" }}></div>}
        {isOpen && isDialogReady && !selectedCameraId && !cameraError && (
          <p className="text-center text-gray-500 mt-4">Procurando câmeras...</p>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default QrScanner;