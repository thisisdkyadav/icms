import PDFDocument from 'pdfkit';

// Generate certificate PDF as buffer
export const generateCertificate = async (participantName, eventName, eventDate) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        margin: 50
      });

      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Certificate border
      doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40)
         .lineWidth(3)
         .stroke('#2c3e50');

      doc.rect(30, 30, doc.page.width - 60, doc.page.height - 60)
         .lineWidth(1)
         .stroke('#3498db');

      // Header
      doc.fontSize(16)
         .fillColor('#666')
         .text('IN-HOUSE CONFERENCE MANAGEMENT SYSTEM', { align: 'center' });

      doc.moveDown(1);

      // Title
      doc.fontSize(40)
         .fillColor('#2c3e50')
         .font('Helvetica-Bold')
         .text('CERTIFICATE', { align: 'center' });

      doc.moveDown(0.5);

      doc.fontSize(20)
         .fillColor('#3498db')
         .font('Helvetica')
         .text('OF PARTICIPATION', { align: 'center' });

      doc.moveDown(2);

      // Body
      doc.fontSize(14)
         .fillColor('#666')
         .font('Helvetica')
         .text('This is to certify that', { align: 'center' });

      doc.moveDown(0.8);

      // Participant name
      doc.fontSize(28)
         .fillColor('#2c3e50')
         .font('Helvetica-Bold')
         .text(participantName.toUpperCase(), { align: 'center' });

      doc.moveDown(0.8);

      // Event info
      doc.fontSize(14)
         .fillColor('#666')
         .font('Helvetica')
         .text('has successfully participated in', { align: 'center' });

      doc.moveDown(0.5);

      doc.fontSize(22)
         .fillColor('#3498db')
         .font('Helvetica-Bold')
         .text(eventName, { align: 'center' });

      doc.moveDown(0.5);

      // Date
      const formattedDate = new Date(eventDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      doc.fontSize(14)
         .fillColor('#666')
         .font('Helvetica')
         .text(`held on ${formattedDate}`, { align: 'center' });

      doc.moveDown(3);

      // Signature line
      doc.fontSize(12)
         .fillColor('#333')
         .text('_________________________', { align: 'center' });
      
      doc.moveDown(0.3);
      
      doc.fontSize(10)
         .fillColor('#666')
         .text('Authorized Signature', { align: 'center' });

      // Footer
      doc.moveDown(2);
      doc.fontSize(8)
         .fillColor('#999')
         .text(`Certificate ID: ${Date.now()}`, { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};
