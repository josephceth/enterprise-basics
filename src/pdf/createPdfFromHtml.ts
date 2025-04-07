// import { z } from 'zod';
// import { validateWithZod } from '../utilities/zodUtility';
// import { createPdf } from 'html-pdf-node';

// const validationSchema = z.object({
//   html: z.string().min(1, 'HTML content is required'),
//   options: z
//     .object({
//       format: z.enum(['A4', 'Letter', 'Legal']).optional(),
//       orientation: z.enum(['portrait', 'landscape']).optional(),
//       margin: z
//         .object({
//           top: z.string().optional(),
//           right: z.string().optional(),
//           bottom: z.string().optional(),
//           left: z.string().optional(),
//         })
//         .optional(),
//       printBackground: z.boolean().optional(),
//       preferCSSPageSize: z.boolean().optional(),
//     })
//     .optional(),
// });

// type PdfOptions = z.infer<typeof validationSchema>['options'];

// /**
//  * Converts HTML content to a PDF file and returns it as a byte array.
//  * Uses html-pdf-node for high-quality HTML rendering.
//  *
//  * @param {string} html - HTML content to convert to PDF
//  * @param {Object} [options] - Optional PDF generation options
//  * @param {'A4' | 'Letter' | 'Legal'} [options.format='A4'] - Page format
//  * @param {'portrait' | 'landscape'} [options.orientation='portrait'] - Page orientation
//  * @param {Object} [options.margin] - Page margins
//  * @param {string} [options.margin.top='1cm'] - Top margin
//  * @param {string} [options.margin.right='1cm'] - Right margin
//  * @param {string} [options.margin.bottom='1cm'] - Bottom margin
//  * @param {string} [options.margin.left='1cm'] - Left margin
//  * @param {boolean} [options.printBackground=true] - Whether to print background colors and images
//  * @param {boolean} [options.preferCSSPageSize=true] - Whether to use CSS page size
//  *
//  * @returns {Promise<Uint8Array>} PDF file as a byte array
//  *
//  * @throws {Error} If:
//  * - HTML content is empty
//  * - PDF generation fails
//  *
//  * @example
//  * const html = '<html><body><h1>Hello World</h1></body></html>';
//  * const pdfBytes = await createPdfFromHtml(html, {
//  *   format: 'A4',
//  *   orientation: 'portrait',
//  *   margin: {
//  *     top: '2cm',
//  *     right: '2cm',
//  *     bottom: '2cm',
//  *     left: '2cm'
//  *   },
//  *   printBackground: true,
//  *   preferCSSPageSize: true
//  * });
//  */
// export async function createPdfFromHtml(html: string, options?: PdfOptions): Promise<Uint8Array> {
//   // Validate inputs
//   const validationResult = validateWithZod(validationSchema, { html, options });
//   if (validationResult.isError) {
//     throw new Error(`PDF creation validation failed: ${JSON.stringify(validationResult.error)}`);
//   }

//   try {
//     const pdfOptions = {
//       format: options?.format || 'A4',
//       orientation: options?.orientation || 'portrait',
//       margin: {
//         top: options?.margin?.top || '1cm',
//         right: options?.margin?.right || '1cm',
//         bottom: options?.margin?.bottom || '1cm',
//         left: options?.margin?.left || '1cm',
//       },
//       printBackground: options?.printBackground ?? true,
//       preferCSSPageSize: options?.preferCSSPageSize ?? true,
//     };

//     const pdfBuffer = await createPdf({ content: html }, pdfOptions);
//     return new Uint8Array(pdfBuffer);
//   } catch (error) {
//     throw new Error(`PDF creation failed: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
//   }
// }
