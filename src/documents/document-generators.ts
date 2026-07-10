import { PDFDocument, rgb, StandardFonts, PDFFont } from 'pdf-lib';
import * as fs from 'fs';

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

  let customFontUsed = false;
  let fontRegular: PDFFont;
  let fontBold: PDFFont;

  try {
    const regularFontPath = '/System/Library/Fonts/Supplemental/Arial.ttf';
    const boldFontPath = '/System/Library/Fonts/Supplemental/Arial Bold.ttf';
    if (fs.existsSync(regularFontPath) && fs.existsSync(boldFontPath)) {
      const regBytes = fs.readFileSync(regularFontPath);
      const boldBytes = fs.readFileSync(boldFontPath);
      fontRegular = await pdfDoc.embedFont(regBytes);
      fontBold = await pdfDoc.embedFont(boldBytes);
      customFontUsed = true;
    } else {
      fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
      fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    }
  } catch {
    fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  }

  const clean = (text: string): string => {
    if (customFontUsed) return text;
    return text
      .replace(/ą/g, 'a')
      .replace(/Ą/g, 'A')
      .replace(/ć/g, 'c')
      .replace(/Ć/g, 'C')
      .replace(/ę/g, 'e')
      .replace(/Ę/g, 'E')
      .replace(/ł/g, 'l')
      .replace(/Ł/g, 'L')
      .replace(/ń/g, 'n')
      .replace(/Ń/g, 'N')
      .replace(/ó/g, 'o')
      .replace(/Ó/g, 'O')
      .replace(/ś/g, 's')
      .replace(/Ś/g, 'S')
      .replace(/ź/g, 'z')
      .replace(/Ź/g, 'Z')
      .replace(/ż/g, 'z')
      .replace(/Ż/g, 'Z')
      .replace(/–/g, '-')
      .replace(/„/g, '"')
      .replace(/”/g, '"');
  };

  let page = pdfDoc.addPage([595.28, 841.89]); // A4 size
  const { width, height } = page.getSize();
  let yOffset = height - 50;

  const checkPage = (heightNeeded: number) => {
    if (yOffset - heightNeeded < 50) {
      page = pdfDoc.addPage([595.28, 841.89]);
      yOffset = height - 50;
    }
  };

  const maxLineWidth = width - 100;

  const getLines = (text: string, font: PDFFont, size: number): string[] => {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    for (const word of words) {
      const testLine = currentLine + word + ' ';
      const testWidth = font.widthOfTextAtSize(testLine, size);
      if (testWidth > maxLineWidth && currentLine !== '') {
        lines.push(currentLine.trim());
        currentLine = word + ' ';
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine.trim() !== '') {
      lines.push(currentLine.trim());
    }
    return lines;
  };

  const drawParagraph = (
    text: string,
    isBold = false,
    size = 10,
    lineSpacing = 14,
  ) => {
    const font = isBold ? fontBold : fontRegular;
    const lines = getLines(text, font, size);
    const heightNeeded = lines.length * lineSpacing;
    checkPage(heightNeeded);
    for (const line of lines) {
      page.drawText(line, {
        x: 50,
        y: yOffset,
        size,
        font,
      });
      yOffset -= lineSpacing;
    }
  };

  const drawSection = (title: string, paragraphs: string[]) => {
    yOffset -= 10;
    drawParagraph(clean(title), true, 11, 15);
    yOffset -= 5;
    for (const p of paragraphs) {
      drawParagraph(clean(p), false, 10, 14);
    }
  };

  // Title
  const titleText = clean('UMOWA O ŚWIADCZENIE USŁUG INFORMATYCZNYCH (B2B)');
  page.drawText(titleText, {
    x: 50,
    y: yOffset,
    size: 14,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  yOffset -= 30;

  const dateText = clean(
    `Zawarta w dniu ${new Date().toLocaleDateString('pl-PL')} r. w Warszawie, pomiędzy:`,
  );
  page.drawText(dateText, {
    x: 50,
    y: yOffset,
    size: 10,
    font: fontRegular,
  });
  yOffset -= 25;

  // Parties
  const clientInfo =
    data.clientName ||
    'Firma A Sp. z o.o. z siedzibą w Warszawie, ul. Przykładowa 1, 00-001 Warszawa, NIP: 1234567890, reprezentowana przez: Jana Kowalskiego – Prezesa Zarządu';
  const clientText = `Zamawiającym: ${clientInfo}`;
  drawParagraph(clean(clientText), false, 10, 14);
  yOffset -= 10;

  drawParagraph(clean('a'), false, 11, 15);
  yOffset -= 10;

  const contractorInfo =
    data.contractorName ||
    'Firma B Jan Nowak z siedzibą w Krakowie, ul. Testowa 2, 30-002 Kraków, NIP: 0987654321';
  const contractorText = `Wykonawcą: ${contractorInfo}`;
  drawParagraph(clean(contractorText), false, 10, 14);

  // Sections
  const services =
    data.servicesDescription ||
    'programowaniu oraz utrzymaniu systemów informatycznych Zamawiającego';
  drawSection('§ 1 Przedmiot Umowy', [
    `1. Zamawiający zleca, a Wykonawca zobowiązuje się do świadczenia usług informatycznych polegających na: ${services}.`,
    '2. Wykonawca oświadcza, że posiada odpowiednią wiedzę, doświadczenie i kwalifikacje niezbędne do prawidłowego wykonania przedmiotu umowy.',
  ]);

  drawSection('§ 2 Obowiązki Stron', [
    '1. Wykonawca zobowiązuje się świadczyć usługi z należytą starannością, zgodnie z najlepszą wiedzą fachową.',
    '2. Zamawiający zobowiązuje się do współdziałania z Wykonawcą w zakresie niezbędnym do prawidłowego wykonania usług, w tym udostępnienia niezbędnych materiałów i dostępów do systemów.',
  ]);

  drawSection('§ 3 Prawa Autorskie', [
    '1. Z chwilą zapłaty wynagrodzenia, Wykonawca przenosi na Zamawiającego autorskie prawa majątkowe do wszelkich utworów (w tym kodu źródłowego) stworzonych w ramach wykonywania niniejszej umowy.',
    '2. Przeniesienie praw obejmuje następujące pola eksploatacji: utrwalanie, zwielokrotnianie, wprowadzanie do obrotu, wprowadzanie do pamięci komputera oraz modyfikowanie.',
  ]);

  const fee =
    data.monthlyFee || '[kwota] PLN netto za każdą przepracowaną godzinę';
  drawSection('§ 4 Wynagrodzenie i Warunki Płatności', [
    `1. Z tytułu świadczenia usług Wykonawcy przysługuje wynagrodzenie w wysokości: ${fee}.`,
    '2. Płatność nastąpi na podstawie prawidłowo wystawionej faktury VAT, przelewem na rachunek bankowy Wykonawcy w terminie 14 dni od daty otrzymania faktury przez Zamawiającego.',
  ]);

  drawSection('§ 5 Poufność (NDA)', [
    'Wykonawca zobowiązuje się do zachowania w tajemnicy wszelkich informacji poufnych dotyczących działalności Zamawiającego, do których uzyska dostęp w związku z wykonywaniem niniejszej umowy, zarówno w trakcie jej trwania, jak i po jej rozwiązaniu.',
  ]);

  const notice = data.noticePeriod || '1-miesięcznego';
  drawSection('§ 6 Postanowienia Końcowe', [
    `1. Umowa zostaje zawarta na czas nieokreślony, z możliwością jej wypowiedzenia przez każdą ze stron z zachowaniem ${notice} okresu wypowiedzenia.`,
    '2. Wszelkie zmiany umowy wymagają formy pisemnej pod rygorem nieważności.',
    '3. W sprawach nieuregulowanych niniejszą umową mają zastosowanie przepisy Kodeksu Cywilnego oraz ustawy o prawie autorskim i prawach pokrewnych.',
  ]);

  // Signatures
  yOffset -= 30;
  checkPage(40);
  page.drawText(clean('Zamawiający: ___________________'), {
    x: 50,
    y: yOffset,
    size: 11,
    font: fontRegular,
  });
  page.drawText(clean('Wykonawca: ___________________'), {
    x: 300,
    y: yOffset,
    size: 11,
    font: fontRegular,
  });

  return pdfDoc.save();
}

export interface MsaData {
  clientName?: string;
  providerName?: string;
  effectiveDate?: string;
  governingLaw?: string;
  servicesDescription?: string;
}

export async function generateMsaPdf(data: MsaData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let page = pdfDoc.addPage([595.28, 841.89]); // A4 size
  const { width, height } = page.getSize();
  let yOffset = height - 50;

  const checkPage = (heightNeeded: number) => {
    if (yOffset - heightNeeded < 50) {
      page = pdfDoc.addPage([595.28, 841.89]);
      yOffset = height - 50;
    }
  };

  const maxLineWidth = width - 100;

  const getLines = (text: string, font: PDFFont, size: number): string[] => {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    for (const word of words) {
      const testLine = currentLine + word + ' ';
      const testWidth = font.widthOfTextAtSize(testLine, size);
      if (testWidth > maxLineWidth && currentLine !== '') {
        lines.push(currentLine.trim());
        currentLine = word + ' ';
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine.trim() !== '') {
      lines.push(currentLine.trim());
    }
    return lines;
  };

  const drawParagraph = (
    text: string,
    isBold = false,
    size = 10,
    lineSpacing = 14,
  ) => {
    const font = isBold ? helveticaBoldFont : helveticaFont;
    const lines = getLines(text, font, size);
    const heightNeeded = lines.length * lineSpacing;
    checkPage(heightNeeded);
    for (const line of lines) {
      page.drawText(line, {
        x: 50,
        y: yOffset,
        size,
        font,
      });
      yOffset -= lineSpacing;
    }
  };

  const drawSection = (title: string, paragraphs: string[]) => {
    yOffset -= 10;
    drawParagraph(title, true, 11, 15);
    yOffset -= 5;
    for (const p of paragraphs) {
      drawParagraph(p, false, 10, 14);
    }
  };

  // Title
  page.drawText('MASTER SERVICES AGREEMENT', {
    x: 50,
    y: yOffset,
    size: 16,
    font: helveticaBoldFont,
    color: rgb(0, 0, 0),
  });
  yOffset -= 30;

  const dateVal = data.effectiveDate || new Date().toLocaleDateString('en-US');
  page.drawText(`Effective Date: ${dateVal}`, {
    x: 50,
    y: yOffset,
    size: 10,
    font: helveticaFont,
  });
  yOffset -= 25;

  // Parties
  const provider = data.providerName || 'Provider Company LLC';
  const client = data.clientName || 'Client Company Inc.';
  drawParagraph(
    `This Master Services Agreement ("Agreement") is entered into by and between ${provider} ("Provider") and ${client} ("Client").`,
    false,
    10,
    14,
  );

  // Sections
  const services =
    data.servicesDescription ||
    'general software engineering, DevOps, IT consulting, and project management services';
  drawSection('1. Scope of Services', [
    `Provider shall perform services for Client as described in individual Statements of Work ("SOW") executed by both parties from time to time. This Agreement establishes the general terms and conditions under which all such ${services} will be provided.`,
  ]);

  drawSection('2. Fees and Payment Terms', [
    'Fees, expenses, and billing terms will be set forth in each respective SOW. Unless specified otherwise in an SOW, all invoices are due net 30 days from the invoice date. Late payments shall bear interest at the rate of 1.5% per month or the highest rate permitted by law.',
  ]);

  drawSection('3. Intellectual Property Rights', [
    'Except as explicitly set forth in an SOW, all deliverables, code, designs, and materials created specifically for Client shall become the sole property of Client upon full payment of the associated fees. Provider retains all rights to its pre-existing tools, methodologies, and general know-how.',
  ]);

  drawSection('4. Confidentiality', [
    'Each party shall maintain the confidentiality of all proprietary or confidential information disclosed by the other party during the term of this Agreement, using at least the same degree of care it uses for its own confidential information, but no less than reasonable care.',
  ]);

  drawSection('5. Limitation of Liability', [
    "Except for breaches of confidentiality or IP infringement, neither party shall be liable for any indirect, incidental, or consequential damages. Each party's maximum aggregate liability arising under this Agreement or any SOW shall be limited to the total fees paid by Client to Provider under the applicable SOW in the 12 months preceding the claim.",
  ]);

  const law = data.governingLaw || 'the State of Delaware';
  drawSection('6. Governing Law & Dispute Resolution', [
    `This Agreement and all SOWs shall be governed by and construed in accordance with the laws of ${law}, without regard to conflict of law principles. Any dispute arising out of this Agreement shall be resolved through good faith negotiations, and if unresolved, by binding arbitration.`,
  ]);

  // Signatures
  yOffset -= 30;
  checkPage(40);
  page.drawText('Provider: ___________________', {
    x: 50,
    y: yOffset,
    size: 11,
    font: helveticaBoldFont,
  });
  page.drawText('Client: ___________________', {
    x: 300,
    y: yOffset,
    size: 11,
    font: helveticaBoldFont,
  });

  return pdfDoc.save();
}
