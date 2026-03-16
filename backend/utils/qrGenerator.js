import QRCode from 'qrcode';

// Generate QR code as base64 image
export const generateQRCode = async (data) => {
  try {
    const qrImage = await QRCode.toDataURL(data, {
      width: 300,
      margin: 2
    });
    // Return base64 without the data URL prefix
    return qrImage.split(',')[1];
  } catch (error) {
    throw new Error('QR code generation failed');
  }
};
