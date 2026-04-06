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



// import PDFDocument from 'pdfkit';
// import fs from 'fs';
// import path from 'path';
// import { fileURLToPath } from 'url';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);


// const logoPath = path.join(__dirname, 'iit_indore_logo.png'); 

// export const generateCertificate = async (participantName, departmentName, eventDate) => {
//   return new Promise((resolve, reject) => {
//     try {
//       const doc = new PDFDocument({
//         size: 'A4',
//         layout: 'landscape',
//         margin: 40
//       });

//       const chunks = [];
//       doc.on('data', chunk => chunks.push(chunk));
//       doc.on('end', () => resolve(Buffer.concat(chunks)));
//       doc.on('error', reject);

//       const pageWidth = doc.page.width;
//       const pageHeight = doc.page.height;

//       // Background corner blocks
//       doc.save();
//       doc.fillColor('#f7941d') // Orange
//          .moveTo(0, 0)
//          .lineTo(150, 0)
//          .lineTo(0, 100)
//          .fill();

//       doc.fillColor('#3498db') // Blue
//          .moveTo(0, pageHeight)
//          .lineTo(0, pageHeight - 100)
//          .lineTo(150, pageHeight)
//          .fill();

//       doc.fillColor('#f7941d') // Orange
//          .moveTo(pageWidth, pageHeight)
//          .lineTo(pageWidth - 150, pageHeight)
//          .lineTo(pageWidth, pageHeight - 100)
//          .fill();

//       doc.fillColor('#3498db') // Blue
//          .moveTo(pageWidth, 0)
//          .lineTo(pageWidth, 100)
//          .lineTo(pageWidth - 150, 0)
//          .fill();
//       doc.restore();

//       // Logo
//       if (fs.existsSync(logoPath)) {
//         doc.image(logoPath, pageWidth / 2 - 40, 20, { width: 80 });
//       }

//       doc.moveDown(5);

//       // Header text
//       doc.fontSize(20)
//          .fillColor('#0b1a6d')
//          .font('Helvetica-Bold')
//          .text('Indian Institute of Technology Indore', { align: 'center' });

//       doc.moveDown(0.5);

//       doc.fontSize(16)
//          .fillColor('#0b1a6d')
//          .font('Helvetica-Oblique')
//          .text('Center for Pedagogy and Curricular Excellence (CPCE)', { align: 'center' });

//       doc.moveDown(1.5);

//       // Title
//       doc.fontSize(28)
//          .fillColor('#ff0000')
//          .font('Helvetica-Bold')
//          .text('CERTIFICATE OF PARTICIPATION', { align: 'center' });

//       doc.moveDown(2);

//       // Body text
//       doc.fontSize(14)
//          .fillColor('#000000')
//          .font('Helvetica')
//          .text(`This certificate is presented to Mr./Ms. ${participantName}`, { align: 'center' });

//       doc.moveDown(0.5);

//       doc.text(`of the Department of ${departmentName}`, { align: 'center' });

//       doc.moveDown(0.5);

//       doc.text(`for participating in the one-day Teaching Assistant Orientation Program (TAOP)`, { align: 'center' });

//       doc.moveDown(0.5);

//       doc.text(`organised by the Centre for Pedagogy and Curricular Excellence on ${eventDate}`, { align: 'center' });

//       // Signature lines
//       doc.moveDown(5);
//       const sigY = doc.y;

//       doc.fontSize(12)
//          .text('Convener, CPCE', 100, sigY, { align: 'left' });

//       doc.text('Program Coordinator, TAOP', -100, sigY, { align: 'right' });

//       doc.moveDown(0.5);

//       doc.fontSize(10)
//          .text(`Date: ${eventDate}`, 100, doc.y, { align: 'left' });

//       doc.end();
//     } catch (error) {
//       reject(error);
//     }
//   });
// };

// // Example usage
// (async () => {
//   const buffer = await generateCertificate('Brijeshwar Singh', 'Mehta Family School of Biosciences and Biomedical Engineering', '09/03/2026');
//   fs.writeFileSync('certificate.pdf', buffer);
// })();

