import PDFDocument from 'pdfkit';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_CERTIFICATE_CONFIG = {
  certificateDate: '',
  instituteLogoImage: '',
  instituteTitle: 'Indian Institute of Technology Indore',
  subtitle: 'Center for Pedagogy and Curricular Excellence (CPCE)',
  title: 'CERTIFICATE OF PARTICIPATION',
  bodyParagraph: 'This certificate is presented to Mr./Ms. {{participant.name}} of the Department of {{participant.department}} for participating in the {{event.name}} organised by the Centre for Pedagogy and Curricular Excellence on {{certificate.dateLong}}.',
  bodyRecipientLine: 'This certificate is presented to Mr./Ms. {{participant.name}} of the',
  bodyDepartmentLine: 'Department of {{participant.department}} for',
  bodyProgramLine: 'participating in the {{event.name}}',
  bodyClosingLine: 'organised by the Centre for Pedagogy and Curricular Excellence on {{certificate.dateLong}}.',
  additionalLines: [],
  leftSignatory: 'Convener, CPCE',
  rightSignatory: 'Program Coordinator, TAOP',
  leftDatePrefix: 'Date:',
  leftSignatureImage: '',
  rightSignatureImage: ''
};

const CONFIG_TEXT_KEYS = [
  'instituteTitle',
  'subtitle',
  'title',
  'bodyParagraph',
  'bodyRecipientLine',
  'bodyDepartmentLine',
  'bodyProgramLine',
  'bodyClosingLine',
  'leftSignatory',
  'rightSignatory',
  'leftDatePrefix'
];

const asString = (value) => (value == null ? '' : String(value));

const safeDate = (value, fallbackValue) => {
  const parsed = new Date(value || fallbackValue || Date.now());
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
};

const formatDateVariants = (date) => ({
  iso: date.toISOString().slice(0, 10),
  short: date.toLocaleDateString('en-GB'),
  long: date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
});

const SIGNATURE_IMAGE_MAX_WIDTH = 130;
const SIGNATURE_IMAGE_MAX_HEIGHT = 42;
const LOGO_IMAGE_WIDTH = 84;
const LOGO_IMAGE_HEIGHT = 84;

const CONFIG_IMAGE_KEYS = ['instituteLogoImage', 'leftSignatureImage', 'rightSignatureImage'];

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FONTS_DIR = path.resolve(__dirname, '../assets/fonts');

const FONT_CANDIDATES = {
  calibri: {
    regular: [
      path.join(FONTS_DIR, 'calibri.ttf'),
      path.join(FONTS_DIR, 'Calibri.ttf'),
      '/usr/share/fonts/truetype/msttcorefonts/calibri.ttf',
      '/usr/share/fonts/truetype/msttcorefonts/Calibri.ttf'
    ],
    bold: [
      path.join(FONTS_DIR, 'calibrib.ttf'),
      path.join(FONTS_DIR, 'Calibri Bold.ttf'),
      '/usr/share/fonts/truetype/msttcorefonts/calibrib.ttf',
      '/usr/share/fonts/truetype/msttcorefonts/Calibri_Bold.ttf'
    ],
    italic: [
      path.join(FONTS_DIR, 'calibrii.ttf'),
      path.join(FONTS_DIR, 'Calibri Italic.ttf'),
      '/usr/share/fonts/truetype/msttcorefonts/calibrii.ttf'
    ],
    boldItalic: [
      path.join(FONTS_DIR, 'calibriz.ttf'),
      path.join(FONTS_DIR, 'Calibri Bold Italic.ttf'),
      '/usr/share/fonts/truetype/msttcorefonts/calibriz.ttf'
    ]
  },
  arial: {
    regular: [
      path.join(FONTS_DIR, 'arial.ttf'),
      path.join(FONTS_DIR, 'Arial.ttf'),
      '/usr/share/fonts/truetype/msttcorefonts/arial.ttf',
      '/usr/share/fonts/truetype/msttcorefonts/Arial.ttf'
    ],
    bold: [
      path.join(FONTS_DIR, 'arialbd.ttf'),
      path.join(FONTS_DIR, 'Arial Bold.ttf'),
      '/usr/share/fonts/truetype/msttcorefonts/arialbd.ttf'
    ],
    italic: [
      path.join(FONTS_DIR, 'ariali.ttf'),
      path.join(FONTS_DIR, 'Arial Italic.ttf'),
      '/usr/share/fonts/truetype/msttcorefonts/ariali.ttf'
    ],
    boldItalic: [
      path.join(FONTS_DIR, 'arialbi.ttf'),
      path.join(FONTS_DIR, 'Arial Bold Italic.ttf'),
      '/usr/share/fonts/truetype/msttcorefonts/arialbi.ttf'
    ]
  },
  timesNewRoman: {
    regular: [
      path.join(FONTS_DIR, 'times.ttf'),
      path.join(FONTS_DIR, 'times new roman.ttf'),
      path.join(FONTS_DIR, 'Times New Roman.ttf'),
      '/usr/share/fonts/truetype/msttcorefonts/times.ttf'
    ],
    bold: [
      path.join(FONTS_DIR, 'timesbd.ttf'),
      path.join(FONTS_DIR, 'Times New Roman Bold.ttf'),
      '/usr/share/fonts/truetype/msttcorefonts/timesbd.ttf'
    ],
    italic: [
      path.join(FONTS_DIR, 'timesi.ttf'),
      path.join(FONTS_DIR, 'Times New Roman Italic.ttf'),
      '/usr/share/fonts/truetype/msttcorefonts/timesi.ttf'
    ],
    boldItalic: [
      path.join(FONTS_DIR, 'timesbi.ttf'),
      path.join(FONTS_DIR, 'Times New Roman Bold Italic.ttf'),
      '/usr/share/fonts/truetype/msttcorefonts/timesbi.ttf'
    ]
  }
};

const FALLBACK_FONTS = {
  calibri: {
    regular: 'Helvetica',
    bold: 'Helvetica-Bold',
    italic: 'Helvetica-Oblique',
    boldItalic: 'Helvetica-BoldOblique'
  },
  arial: {
    regular: 'Helvetica',
    bold: 'Helvetica-Bold',
    italic: 'Helvetica-Oblique',
    boldItalic: 'Helvetica-BoldOblique'
  },
  timesNewRoman: {
    regular: 'Times-Roman',
    bold: 'Times-Bold',
    italic: 'Times-Italic',
    boldItalic: 'Times-BoldItalic'
  }
};

const firstExistingFontPath = (paths = []) => {
  return paths.find((fontPath) => fontPath && fs.existsSync(fontPath)) || null;
};

const resolveFontFiles = (familyCandidates) => {
  return {
    regular: firstExistingFontPath(familyCandidates.regular),
    bold: firstExistingFontPath(familyCandidates.bold),
    italic: firstExistingFontPath(familyCandidates.italic),
    boldItalic: firstExistingFontPath(familyCandidates.boldItalic)
  };
};

const RESOLVED_FONT_FILES = {
  calibri: resolveFontFiles(FONT_CANDIDATES.calibri),
  arial: resolveFontFiles(FONT_CANDIDATES.arial),
  timesNewRoman: resolveFontFiles(FONT_CANDIDATES.timesNewRoman)
};

const registerFontVariant = (doc, alias, filePath, fallbackName) => {
  if (!filePath) {
    return fallbackName;
  }

  doc.registerFont(alias, filePath);
  return alias;
};

const buildCertificateFontMap = (doc) => {
  const calibri = RESOLVED_FONT_FILES.calibri;
  const arial = RESOLVED_FONT_FILES.arial;
  const times = RESOLVED_FONT_FILES.timesNewRoman;

  return {
    title: {
      regular: registerFontVariant(doc, 'ICMS-Calibri-Regular', calibri.regular, FALLBACK_FONTS.calibri.regular),
      bold: registerFontVariant(doc, 'ICMS-Calibri-Bold', calibri.bold, FALLBACK_FONTS.calibri.bold),
      italic: registerFontVariant(doc, 'ICMS-Calibri-Italic', calibri.italic, FALLBACK_FONTS.calibri.italic),
      boldItalic: registerFontVariant(doc, 'ICMS-Calibri-BoldItalic', calibri.boldItalic, FALLBACK_FONTS.calibri.boldItalic)
    },
    body: {
      regular: registerFontVariant(doc, 'ICMS-Arial-Regular', arial.regular, FALLBACK_FONTS.arial.regular),
      bold: registerFontVariant(doc, 'ICMS-Arial-Bold', arial.bold, FALLBACK_FONTS.arial.bold),
      italic: registerFontVariant(doc, 'ICMS-Arial-Italic', arial.italic, FALLBACK_FONTS.arial.italic),
      boldItalic: registerFontVariant(doc, 'ICMS-Arial-BoldItalic', arial.boldItalic, FALLBACK_FONTS.arial.boldItalic)
    },
    base: {
      regular: registerFontVariant(doc, 'ICMS-Times-Regular', times.regular, FALLBACK_FONTS.timesNewRoman.regular),
      bold: registerFontVariant(doc, 'ICMS-Times-Bold', times.bold, FALLBACK_FONTS.timesNewRoman.bold),
      italic: registerFontVariant(doc, 'ICMS-Times-Italic', times.italic, FALLBACK_FONTS.timesNewRoman.italic),
      boldItalic: registerFontVariant(doc, 'ICMS-Times-BoldItalic', times.boldItalic, FALLBACK_FONTS.timesNewRoman.boldItalic)
    }
  };
};

const toPlainParticipant = (participant) => {
  const raw = participant && typeof participant.toObject === 'function'
    ? participant.toObject({ flattenMaps: true })
    : (participant || {});

  const dataFields = raw.dataFields && typeof raw.dataFields === 'object' ? raw.dataFields : {};
  return { ...raw, dataFields };
};

const normalizeConfig = (certificateConfig = {}) => {
  const normalized = { ...DEFAULT_CERTIFICATE_CONFIG };

  if (!certificateConfig || typeof certificateConfig !== 'object') {
    return normalized;
  }

  CONFIG_TEXT_KEYS.forEach((key) => {
    if (typeof certificateConfig[key] === 'string') {
      normalized[key] = certificateConfig[key];
    }
  });

  if (typeof certificateConfig.certificateDate === 'string') {
    normalized.certificateDate = certificateConfig.certificateDate;
  }

  if (Array.isArray(certificateConfig.additionalLines)) {
    normalized.additionalLines = certificateConfig.additionalLines
      .map((line) => asString(line).trim())
      .filter(Boolean);
  }

  CONFIG_IMAGE_KEYS.forEach((key) => {
    if (typeof certificateConfig[key] === 'string') {
      normalized[key] = certificateConfig[key];
    }
  });

  return normalized;
};

const getValueByPath = (source, path) => {
  return path
    .split('.')
    .reduce((acc, segment) => (acc && acc[segment] !== undefined ? acc[segment] : undefined), source);
};

const resolveTemplate = (template, context) => {
  return asString(template).replace(/{{\s*([\w.]+)\s*}}/g, (_, tokenPath) => {
    const value = getValueByPath(context, tokenPath);
    return value == null ? '' : String(value);
  });
};

const safeNumber = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const parseDataUrlImage = (dataUrl) => {
  const raw = asString(dataUrl).trim();
  if (!raw) {
    return null;
  }

  const match = raw.match(/^data:image\/(png|jpe?g|webp);base64,(.+)$/i);
  if (!match) {
    return null;
  }

  try {
    const base64Payload = match[2];
    const imageBuffer = Buffer.from(base64Payload, 'base64');
    return imageBuffer.length > 0 ? imageBuffer : null;
  } catch {
    return null;
  }
};

const buildStyledParagraphLines = (doc, template, context, contentWidth, bodyFonts) => {
  const normalizedTemplate = asString(template).replace(/\s+/g, ' ').trim();
  if (!normalizedTemplate) {
    return [];
  }

  const segments = [];
  const tokenRegex = /{{\s*([\w.]+)\s*}}/g;
  let lastIndex = 0;
  let match = tokenRegex.exec(normalizedTemplate);

  while (match) {
    const [fullMatch, tokenPath] = match;
    const matchIndex = match.index;

    if (matchIndex > lastIndex) {
      segments.push({ text: normalizedTemplate.slice(lastIndex, matchIndex), dynamic: false });
    }

    const tokenValue = getValueByPath(context, tokenPath);
    segments.push({ text: asString(tokenValue), dynamic: true });

    lastIndex = matchIndex + fullMatch.length;
    match = tokenRegex.exec(normalizedTemplate);
  }

  if (lastIndex < normalizedTemplate.length) {
    segments.push({ text: normalizedTemplate.slice(lastIndex), dynamic: false });
  }

  if (segments.length === 0) {
    segments.push({ text: resolveTemplate(normalizedTemplate, context), dynamic: false });
  }

  const tokens = [];
  segments.forEach((segment) => {
    const pieces = asString(segment.text).match(/\S+|\s+/g) || [];
    pieces.forEach((piece) => {
      const isSpace = /^\s+$/.test(piece);
      tokens.push({ text: isSpace ? ' ' : piece, dynamic: segment.dynamic, isSpace });
    });
  });

  const trimTrailingSpaces = (line) => {
    while (line.tokens.length > 0 && line.tokens[line.tokens.length - 1].isSpace) {
      const removed = line.tokens.pop();
      line.width -= safeNumber(removed.width, 0);
    }
  };

  const lines = [];
  let currentLine = { tokens: [], width: 0 };

  tokens.forEach((token) => {
    if (token.isSpace && currentLine.tokens.length === 0) {
      return;
    }

    doc.font(token.dynamic ? bodyFonts.bold : bodyFonts.regular);
    const tokenWidth = safeNumber(doc.widthOfString(token.text), 0);
    const wouldOverflow = currentLine.width + tokenWidth > contentWidth;

    if (wouldOverflow && !token.isSpace && currentLine.tokens.length > 0) {
      trimTrailingSpaces(currentLine);
      lines.push(currentLine);
      currentLine = { tokens: [], width: 0 };
    }

    if (token.isSpace && currentLine.tokens.length === 0) {
      return;
    }

    currentLine.tokens.push({ ...token, width: tokenWidth });
    currentLine.width += safeNumber(tokenWidth, 0);
  });

  trimTrailingSpaces(currentLine);
  if (currentLine.tokens.length > 0) {
    lines.push(currentLine);
  }

  return lines;
};

const buildTemplateContext = (participant, event, certificateDate) => {
  const plainParticipant = toPlainParticipant(participant);
  const participantDepartment =
    plainParticipant.department ||
    plainParticipant.dataFields?.department ||
    plainParticipant.dataFields?.Department ||
    '';

  const eventDate = safeDate(event?.date, certificateDate);
  const eventDateParts = formatDateVariants(eventDate);
  const certificateDateParts = formatDateVariants(certificateDate);

  const participantContext = {
    ...plainParticipant,
    department: participantDepartment,
    dataFields: plainParticipant.dataFields || {}
  };

  return {
    participant: participantContext,
    event: {
      name: asString(event?.name),
      dateIso: eventDateParts.iso,
      dateShort: eventDateParts.short,
      dateLong: eventDateParts.long
    },
    certificate: {
      dateIso: certificateDateParts.iso,
      dateShort: certificateDateParts.short,
      dateLong: certificateDateParts.long
    },
    name: asString(participantContext.name),
    eventName: asString(event?.name)
  };
};

// Generate certificate PDF as buffer
export const generateCertificate = async ({ participant, event, certificateConfig } = {}) => {
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

      const fonts = buildCertificateFontMap(doc);

      const config = normalizeConfig(certificateConfig);
      const certificateDate = safeDate(config.certificateDate, event?.date);
      const context = buildTemplateContext(participant, event, certificateDate);

      const resolved = {};
      CONFIG_TEXT_KEYS.forEach((key) => {
        resolved[key] = resolveTemplate(config[key], context);
      });

      const resolvedAdditionalLines = config.additionalLines.map((line) => resolveTemplate(line, context));
      const instituteLogoImageBuffer = parseDataUrlImage(config.instituteLogoImage);
      const leftSignatureImageBuffer = parseDataUrlImage(config.leftSignatureImage);
      const rightSignatureImageBuffer = parseDataUrlImage(config.rightSignatureImage);
      const fallbackParagraphTemplate = [
        config.bodyRecipientLine,
        config.bodyDepartmentLine,
        config.bodyProgramLine,
        config.bodyClosingLine,
        ...config.additionalLines
      ].filter(Boolean).join(' ');
      const paragraphTemplate = asString(config.bodyParagraph || fallbackParagraphTemplate)
        .replace(/\s+/g, ' ')
        .trim();

      const width = doc.page.width;
      const height = doc.page.height;

      // Background color
      doc.rect(0, 0, width, height).fill('#f9f9f9');

      // Top-Left corner shapes
      doc.polygon([0, 0], [300, 0], [70, 100]);
      doc.fill('#f49c54'); 
      doc.polygon([0, 0], [70, 100], [0, 300]);
      doc.fill('#5ca4df');

      // Bottom-Right corner shapes
      doc.polygon([width, height], [width - 300, height], [width - 70, height - 100]);
      doc.fill('#f49c54');
      doc.polygon([width, height], [width - 70, height - 100], [width, height - 300]);
      doc.fill('#5ca4df');

      const headingBlockX = 56;
      const headingBlockWidth = width - (headingBlockX * 2);
      const logoY = 18;
      const instituteTitleY = 146;
      const subtitleY = 188;
      const certificateTitleY = 226;

      if (instituteLogoImageBuffer) {
        const logoX = (width - LOGO_IMAGE_WIDTH) / 2;
        doc.image(instituteLogoImageBuffer, logoX, logoY, {
          fit: [LOGO_IMAGE_WIDTH, LOGO_IMAGE_HEIGHT],
          align: 'center',
          valign: 'center'
        });
      }

      // Heading block
      doc.fontSize(26)
        .fillColor('#10206b')
        .font(fonts.base.regular)
        .text(resolved.instituteTitle, headingBlockX, instituteTitleY, {
          width: headingBlockWidth,
          align: 'center'
        });

      doc.fontSize(18)
        .fillColor('#10206b')
        .font(fonts.base.italic)
        .text(resolved.subtitle, headingBlockX, subtitleY, {
          width: headingBlockWidth,
          align: 'center'
        });

      doc.fontSize(22)
        .fillColor('#ff0000')
        .font(fonts.title.bold)
        .text(resolved.title, headingBlockX, certificateTitleY, {
          width: headingBlockWidth,
          align: 'center'
        });

      doc.fontSize(14.5)
         .fillColor('#000000')
        .font(fonts.body.regular);

      // Body paragraph block with auto-wrap and centered alignment
      const startX = 100;
      const contentWidth = width - (startX * 2);
      const sigY = height - 100;
      const paragraphTop = 228;
      const paragraphBottom = sigY - 50;
      const paragraphAreaHeight = Math.max(paragraphBottom - paragraphTop, 80);
      const paragraphLines = buildStyledParagraphLines(doc, paragraphTemplate, context, contentWidth, fonts.body);
      const paragraphLineHeight = 23;
      const paragraphHeight = paragraphLines.length * paragraphLineHeight;
      const paragraphY = paragraphTop + Math.max((paragraphAreaHeight - paragraphHeight) / 2 - 18, 0);

      paragraphLines.forEach((line, lineIndex) => {
        const lineWidth = safeNumber(line.width, 0);
        let cursorX = startX + ((contentWidth - lineWidth) / 2);
        const lineY = paragraphY + (lineIndex * paragraphLineHeight);

        line.tokens.forEach((token) => {
          const tokenWidth = safeNumber(token.width, 0);
          doc.font(token.dynamic ? fonts.body.bold : fonts.body.regular);
          doc.text(token.text, cursorX, lineY, {
            lineBreak: false
          });

          cursorX += tokenWidth;
        });
      });

      // Signatures
      const leftSignatureAreaX = 110;
      const rightSignatureAreaX = width - 360;
      const signatureImageY = sigY - 54;

      if (leftSignatureImageBuffer) {
        doc.image(leftSignatureImageBuffer, leftSignatureAreaX, signatureImageY, {
          fit: [SIGNATURE_IMAGE_MAX_WIDTH, SIGNATURE_IMAGE_MAX_HEIGHT],
          align: 'center',
          valign: 'center'
        });
      }

      if (rightSignatureImageBuffer) {
        doc.image(rightSignatureImageBuffer, rightSignatureAreaX + (250 - SIGNATURE_IMAGE_MAX_WIDTH), signatureImageY, {
          fit: [SIGNATURE_IMAGE_MAX_WIDTH, SIGNATURE_IMAGE_MAX_HEIGHT],
          align: 'center',
          valign: 'center'
        });
      }

      doc.font(fonts.base.bold).fontSize(14);
      doc.text(resolved.leftSignatory, 120, sigY);
      doc.font(fonts.base.regular).fontSize(12).text(`${resolved.leftDatePrefix} ${context.certificate.dateShort}`, 120, sigY + 20);

      doc.font(fonts.base.bold).fontSize(14);
      doc.text(resolved.rightSignatory, width - 360, sigY, { width: 250, align: 'right' });

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

