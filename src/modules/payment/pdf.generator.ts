import PDFDocument from 'pdfkit-table';
import fs from 'fs';
import moment from 'moment';
import { PDF } from './commons/payment.types';

export class PDFGenerator {
  public async generatePDF(data: PDF): Promise<Buffer> {
    return new Promise<Buffer>((resolve) => {
      // Create a document
      const doc = new PDFDocument({
        margin: 10,
      });

      doc.pipe(fs.createWriteStream('output.pdf'));
      doc
        .font('Helvetica-Bold')
        .fontSize(20)
        .text('RESULT STATEMENT', { align: 'center' })
        .moveDown(1);
      doc.fontSize(10).text(`Customer Name: ${data.userName}`).moveDown(0.3);
      doc.text(`Period: ${data.from} - ${data.to}`).moveDown(0.3);
      doc.text(`Issue date: ${data.issueDate}`).moveDown(1);
      doc.fontSize(16).text('PERIOD RESULTS', { align: 'center' }).moveDown(1);
      doc
        .fontSize(16)
        .fillColor('green')
        .text(data.profit, { align: 'center' })
        .moveDown(1);
      // doc.fontSize(16).fillColor('black').text('US$ 27.56', { align: 'center' }).moveDown(1);

      doc.fontSize(10).text(`Charge amount: US$ ${data.charges}`).moveDown(0.3);
      doc
        .fontSize(10)
        .text(`Contracted Performance Fee: ${data.preformanceFee}%`)
        .moveDown(2);

      const tableTwo = {
        title: 'FINISHED ORDERS',
        headers: [
          { label: 'Date', property: 'date', width: 140, renderer: null },
          { label: 'Stack', property: 'stack', width: 140, renderer: null },
          {
            label: 'Variation',
            property: 'variation',
            width: 140,
            renderer: null,
          },
          { label: 'Profit', property: 'Profit', width: 140, renderer: null },
        ],
        // complex data
        datas: data.trades.map((m: any) => {
          return {
            date: moment(Number(m.date) * 1000).format('MM-DD-YYYY HH:mm:ss'),
            stack: m.stack,
            variation: m.variation,
            takeProfit: m.profit,
          };
        }),
      };

      doc.table(tableTwo, {
        prepareHeader: () => doc.font('Helvetica-Bold').fontSize(8),
        prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => {
          doc.font('Helvetica').fontSize(8);
        },
      });

      doc
        .fontSize(10)
        .fillColor('green')
        .text(`US$ ${data.profit}`, {
          align: 'right',
        })
        .moveDown(0.3);

      // Finalize PDF file
      doc.end();
      const buffer = [];
      doc.on('data', buffer.push.bind(buffer));
      doc.on('end', () => {
        const data = Buffer.concat(buffer);
        resolve(data);
      });
    });
  }
}
