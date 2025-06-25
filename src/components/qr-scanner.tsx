"use client"

import { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";

interface QrScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanError?: (errorMessage: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const QrScanner: React.FC<QrScannerProps> = ({ onScanSuccess, onScanError, isOpen, onClose }) => {
  const scannerInstanceRef = useRef<Html5QrcodeScanner | null>(null);
  const qrCodeRegionId = "qr-code-reader";
  const [isDialogReady, setIsDialogReady] = useState(false); // Novo estado para controlar a prontidão do diálogo

  // Efeito para gerenciar o ciclo de vida do Html5QrcodeScanner
  useEffect(() => {
    // Apenas inicializa e renderiza o scanner se o diálogo estiver aberto E seu conteúdo estiver pronto
    if (isOpen && isDialogReady) {
      if (!scannerInstanceRef.current) {
        scannerInstanceRef.current = new Html5QrcodeScanner(
          qrCodeRegionId,
          { fps: 10, qrbox: { width: 250, height: 250 } },
          false // verbose logging (mudar para true para depuração se necessário)
        );

        scannerInstanceRef.current.render(
          (decodedText, decodedResult) => {
            onScanSuccess(decodedText);
            // Após o escaneamento bem-sucedido, fecha o diálogo. A limpeza do scanner ocorrerá no retorno do useEffect.
            onClose();
          },
          (errorMessage) => {
            // Opcional: Lidar com erros de escaneamento, mas evitar logs excessivos para tentativas contínuas.
            if (onScanError) {
              onScanError(errorMessage);
            }
          }
        );
      }
    }

    // Função de limpeza: Executada quando `isOpen` ou `isDialogReady` muda para `false`, ou o componente é desmontado.
    return () => {
      if (scannerInstanceRef.current) {
        scannerInstanceRef.current.clear()
          .then(() => {
            console.log("Html5QrcodeScanner parado com sucesso.");
          })
          .catch(error => {
            console.error("Falha ao parar Html5QrcodeScanner", error);
          })
          .finally(() => {
            scannerInstanceRef.current = null; // Sempre anula a ref para permitir nova inicialização limpa
          });
      }
    };
  }, [isOpen, isDialogReady, onScanSuccess, onScanError, onClose]); // Dependências

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="sm:max-w-[425px]"
        // onOpenAutoFocus é disparado *depois* que o conteúdo do diálogo está montado e pronto
        onOpenAutoFocus={(e) => {
          // e.preventDefault(); // Opcional: previne o foco automático padrão, se houver conflito
          setIsDialogReady(true); // Sinaliza que o conteúdo do diálogo está pronto
        }}
        // onCloseAutoFocus é disparado *antes* do diálogo ser totalmente fechado, permitindo a limpeza
        onCloseAutoFocus={(e) => {
          // e.preventDefault(); // Opcional: previne o foco automático padrão, se houver conflito
          setIsDialogReady(false); // Sinaliza que o conteúdo do diálogo está desmontando
        }}
      >
        <DialogHeader>
          <DialogTitle>Escanear QR Code</DialogTitle>
          <DialogDescription>
            Posicione o QR Code dentro da área de leitura.
          </DialogDescription>
        </DialogHeader>
        {/* Renderiza a div do scanner apenas quando o diálogo está aberto E seu conteúdo está pronto */}
        {isOpen && isDialogReady && <div id={qrCodeRegionId} style={{ width: "100%" }}></div>}
      </DialogContent>
    </Dialog>
  );
};

export default QrScanner;
