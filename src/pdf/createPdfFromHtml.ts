import puppeteer from 'puppeteer';

/**
 * Converts HTML content to a PDF buffer.
 * Uses puppeteer to render the HTML and generate a PDF.
 *
 * @param {string} html - The HTML content to convert.
 * @returns {Promise<Uint8Array>} A promise that resolves with the PDF content as a Uint8Array.
 * @throws {Error} If puppeteer fails to launch, create a page, set content, or generate the PDF.
 *
 * @example
 * const htmlContent = '<h1>Hello, PDF!</h1><p>This is a test.</p>';
 * try {
 *   const pdfBytes = await htmlToPdfBuffer(htmlContent);
 *   // Now you can save or use the pdfBytes
 *   console.log(`PDF generated with ${pdfBytes.length} bytes.`);
 * } catch (error) {
 *   console.error('Failed to generate PDF:', error);
 * }
 */
export async function createPdfFromHtml(html: string): Promise<Uint8Array> {
  const browser = await puppeteer.launch({
    headless: true, // Changed from 'new' to satisfy type checker
  });
  const page = await browser.newPage();

  await page.setContent(html, { waitUntil: 'networkidle0' });

  const pdfBuffer = await page.pdf({ format: 'A4' });

  await browser.close();
  return new Uint8Array(pdfBuffer);
}
