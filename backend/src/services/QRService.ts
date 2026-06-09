import QRCode from "qrcode";

export async function generateQRCode(url: string): Promise<string> {
  return QRCode.toDataURL(url, {
    width: 300,
    margin: 2,
    color: { dark: "#1a1b27", light: "#ffffff" },
  });
}
