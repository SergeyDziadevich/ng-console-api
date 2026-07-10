import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export interface InvoiceData {
  customerName?: string;
  description?: string;
  amount?: string;
}

export async function generateInvoicePdf(
  data: InvoiceData,
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const { height } = page.getSize();
  let yOffset = height - 50;

  page.drawText('INVOICE', {
    x: 50,
    y: yOffset,
    size: 24,
    font: helveticaBoldFont,
    color: rgb(0, 0, 0),
  });
  yOffset -= 40;

  page.drawText(`Date: ${new Date().toLocaleDateString()}`, {
    x: 50,
    y: yOffset,
    size: 12,
    font: helveticaFont,
  });
  yOffset -= 20;

  page.drawText(`Customer: ${data.customerName || 'N/A'}`, {
    x: 50,
    y: yOffset,
    size: 12,
    font: helveticaFont,
  });
  yOffset -= 40;

  page.drawText('Description:', {
    x: 50,
    y: yOffset,
    size: 14,
    font: helveticaBoldFont,
  });
  yOffset -= 20;

  page.drawText(`${data.description || 'No description provided'}`, {
    x: 50,
    y: yOffset,
    size: 12,
    font: helveticaFont,
  });
  yOffset -= 40;

  page.drawText(`Total Amount: $${data.amount || '0.00'}`, {
    x: 50,
    y: yOffset,
    size: 16,
    font: helveticaBoldFont,
  });

  return pdfDoc.save();
}

export interface ContractData {
  partyA?: string;
  partyB?: string;
  terms?: string;
}

export async function generateContractPdf(
  data: ContractData,
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const { width, height } = page.getSize();
  let yOffset = height - 50;

  page.drawText('CONTRACT', {
    x: 50,
    y: yOffset,
    size: 24,
    font: helveticaBoldFont,
    color: rgb(0, 0, 0),
  });
  yOffset -= 40;

  page.drawText(`Date: ${new Date().toLocaleDateString()}`, {
    x: 50,
    y: yOffset,
    size: 12,
    font: helveticaFont,
  });
  yOffset -= 30;

  page.drawText(
    `Between: ${data.partyA || 'Party A'} AND ${data.partyB || 'Party B'}`,
    {
      x: 50,
      y: yOffset,
      size: 12,
      font: helveticaFont,
    },
  );
  yOffset -= 40;

  page.drawText('Terms and Conditions:', {
    x: 50,
    y: yOffset,
    size: 14,
    font: helveticaBoldFont,
  });
  yOffset -= 20;

  const terms = data.terms || 'No terms specified.';
  const maxLineWidth = width - 100;
  let currentLine = '';
  const words = terms.split(' ');

  for (const word of words) {
    const testLine = currentLine + word + ' ';
    const testWidth = helveticaFont.widthOfTextAtSize(testLine, 12);
    if (testWidth > maxLineWidth && currentLine !== '') {
      page.drawText(currentLine, {
        x: 50,
        y: yOffset,
        size: 12,
        font: helveticaFont,
      });
      currentLine = word + ' ';
      yOffset -= 16;
    } else {
      currentLine = testLine;
    }
  }
  page.drawText(currentLine, {
    x: 50,
    y: yOffset,
    size: 12,
    font: helveticaFont,
  });

  return pdfDoc.save();
}

export interface B2BContractPlData {
  clientName?: string;
  contractorName?: string;
  servicesDescription?: string;
  monthlyFee?: string;
  noticePeriod?: string;
}

export async function generateB2BContractPlPdf(
  data: B2BContractPlData,
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const { width, height } = page.getSize();
  let yOffset = height - 50;

  page.drawText('B2B IT SERVICES AGREEMENT', {
    x: 50,
    y: yOffset,
    size: 20,
    font: helveticaBoldFont,
    color: rgb(0, 0, 0),
  });
  yOffset -= 30;

  page.drawText(`Concluded on ${new Date().toLocaleDateString()} in Poland`, {
    x: 50,
    y: yOffset,
    size: 12,
    font: helveticaFont,
  });
  yOffset -= 30;

  page.drawText('BETWEEN:', {
    x: 50,
    y: yOffset,
    size: 12,
    font: helveticaBoldFont,
  });
  yOffset -= 20;

  page.drawText(`1. ${data.clientName || 'Client Name'} ("The Client")`, {
    x: 50,
    y: yOffset,
    size: 12,
    font: helveticaFont,
  });
  yOffset -= 15;
  page.drawText(
    `2. ${data.contractorName || 'Contractor Name'} ("The Contractor")`,
    {
      x: 50,
      y: yOffset,
      size: 12,
      font: helveticaFont,
    },
  );
  yOffset -= 30;

  const sections = [
    {
      title: '§1 Subject of the Agreement',
      content: `The Contractor independently undertakes to provide IT services described as follows: ${data.servicesDescription || 'IT Services'}. The Contractor is not under direct supervision and decides on the time and place of performing tasks.`,
    },
    {
      title: '§2 Remuneration',
      content: `For the proper performance of the services, the Contractor shall receive a net remuneration of ${data.monthlyFee || '0.00'} PLN per settlement period. Payment will be made within 14 days of receiving a VAT invoice.`,
    },
    {
      title: '§3 Intellectual Property',
      content:
        'Upon payment of the remuneration, the Contractor transfers to the Client all economic copyrights to the works created in the course of providing services under this Agreement.',
    },
    {
      title: '§4 Confidentiality',
      content:
        'The Contractor agrees to keep all information regarding the Client’s business, technology, and clients strictly confidential.',
    },
    {
      title: '§5 Term and Termination',
      content: `This agreement is concluded for an indefinite period. It may be terminated by either party with a notice period of ${data.noticePeriod || '1 month(s)'}.`,
    },
  ];

  const maxLineWidth = width - 100;
  for (const section of sections) {
    page.drawText(section.title, {
      x: 50,
      y: yOffset,
      size: 12,
      font: helveticaBoldFont,
    });
    yOffset -= 15;

    let currentLine = '';
    const words = section.content.split(' ');

    for (const word of words) {
      const testLine = currentLine + word + ' ';
      const testWidth = helveticaFont.widthOfTextAtSize(testLine, 10);
      if (testWidth > maxLineWidth && currentLine !== '') {
        page.drawText(currentLine, {
          x: 50,
          y: yOffset,
          size: 10,
          font: helveticaFont,
        });
        currentLine = word + ' ';
        yOffset -= 14;
      } else {
        currentLine = testLine;
      }
    }
    page.drawText(currentLine, {
      x: 50,
      y: yOffset,
      size: 10,
      font: helveticaFont,
    });
    yOffset -= 25;
  }

  yOffset -= 20;
  page.drawText('Client Signature:', {
    x: 50,
    y: yOffset,
    size: 12,
    font: helveticaBoldFont,
  });
  page.drawText('Contractor Signature:', {
    x: 300,
    y: yOffset,
    size: 12,
    font: helveticaBoldFont,
  });

  yOffset -= 40;
  page.drawText('_________________________', {
    x: 50,
    y: yOffset,
    size: 12,
    font: helveticaFont,
  });
  page.drawText('_________________________', {
    x: 300,
    y: yOffset,
    size: 12,
    font: helveticaFont,
  });

  page.drawText(
    'DISCLAIMER: This document is a template generated for demonstration purposes and does not constitute formal legal advice. Please consult with a Polish legal professional.',
    {
      x: 50,
      y: 40,
      size: 8,
      font: helveticaFont,
      color: rgb(0.5, 0.5, 0.5),
    },
  );

  return pdfDoc.save();
}
