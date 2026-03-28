import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { PaypalService } from './paypal.service';
import * as paypal from 'paypal-rest-sdk';
import { WinstonLoggerService } from '../common/logger.service';
import { CreatePayPalPaymentDto } from './dto/create-payment.dto';
import { CheckoutPayPalPaymentDto } from './dto/checkout-payment.dto';
import { Response } from 'express';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config();

@Controller('paypal')
export class PaypalController {
  constructor(
    private readonly paypalService: PaypalService,
    private readonly logger: WinstonLoggerService,
  ) {
    this.initializePayPal();
  }

  private baseUrl = 'https://api.sandbox.paypal.com';

  private initializePayPal() {
    paypal.configure({
      mode: process.env.PAYPAL_MODE || 'sandbox',
      client_id: process.env.CLIENT_ID || '',
      client_secret: process.env.CLIENT_SECRET || '',
    });
  }

  @Get('/fetchAllTests')
  async fetchAllTests(@Res() response: Response) {
    try {
      const fetchTest = await this.paypalService.fetchAllTests();
      if (fetchTest) {
        this.logger.info('Fetch Tests successfully');
        return response.status(HttpStatus.OK).json({
          statusCode: HttpStatus.OK,
          data: fetchTest,
          message: 'Fetch Tests successfully',
        });
      }
      this.logger.info('No plan purchased');
      return response.status(HttpStatus.NOT_FOUND).json({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'No plan purchased',
      });
    } catch (error) {
      this.logger.error(error.message);
      return response.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        message: error.message,
      });
    }
  }

  @Get('/fetchPaymentDetail/:userId')
  async fetchPaymentDetail(
    @Param('userId') userId: string,
    @Res() response: Response,
  ) {
    try {
      this.logger.info('No plan purchased');
      return response.status(HttpStatus.NOT_FOUND).json({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'No plan purchased',
      });
    } catch (error) {
      this.logger.error(error.message);
      return response.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        message: error.message,
      });
    }
  }

  @Get('/fetchProviderPurchaseDetail/:userId')
  async fetchProviderPurchaseDetail(
    @Param('userId') userId: string,
    @Res() response: Response,
  ) {
    try {
      const fetchUserPayment = await this.paypalService.fetchProviderPayment(userId);
      if (fetchUserPayment) {
        this.logger.info('Fetch purchase detail successfully');
        return response.status(HttpStatus.OK).json({
          statusCode: HttpStatus.OK,
          data: fetchUserPayment,
          message: 'Fetch purchase detail successfully',
        });
      }
      this.logger.info('No plan purchased');
      return response.status(HttpStatus.NOT_FOUND).json({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'No plan purchased',
      });
    } catch (error) {
      this.logger.error(error.message);
      return response.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        message: error.message,
      });
    }
  }

  @Get('/fetchProviderPurchaseHistoryDetail/:userId')
  async fetchProviderPurchaseHistoryDetail(
    @Param('userId') userId: string,
    @Query('page') page: number,
    @Query('pageSize') pageSize: number,
    @Res() response: Response,
  ) {
    try {
      const fetchUserPayment = await this.paypalService.fetchProviderPaymentHistory({
        userId: userId,
        page: page || 1,
        pageSize: pageSize || 10,
      });
      if (fetchUserPayment) {
        this.logger.info('Fetch purchase history detail successfully');
        return response.status(HttpStatus.OK).json({
          statusCode: HttpStatus.OK,
          data: fetchUserPayment,
          message: 'Fetch purchase history detail successfully',
        });
      }
      this.logger.info('No plan purchased');
      return response.status(HttpStatus.NOT_FOUND).json({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'No plan purchased',
      });
    } catch (error) {
      this.logger.error(error.message);
      return response.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        message: error.message,
      });
    }
  }

  @Post('/checkpaypal/:userId')
  async checkPaypal(
    @Param('userId') userId: string,
    @Body() details: CheckoutPayPalPaymentDto,
    @Res() response: Response,
  ) {
    try {
      const decryptedBytes = CryptoJS.AES.decrypt(
        details.testDetail.replace(/ /g, '+'),
        process.env.ENCRYPTION_KEY || 'secret-key',
      );
      const decryptedData = decryptedBytes.toString(CryptoJS.enc.Utf8);
      const parsedData = JSON.parse(decryptedData);
      const overallTotal = parsedData.reduce(
        (sum: number, item: { price: number; quantity: number }) => {
          return sum + item.price * item.quantity;
        },
        0,
      );
      const items = parsedData.map(
        (product: { name: any; testId: any; price: any; quantity: any }) => ({
          name: product.name,
          sku: product.testId,
          price: product.price,
          currency: 'USD',
          quantity: product.quantity,
        }),
      );

      paypal.payment.create(
        {
          intent: 'sale',
          payer: {
            payment_method: 'paypal',
          },
          redirect_urls: {
            return_url: details.isProvider
              ? `${details.origin}/thankyou?testDetail=${details.testDetail}`
              : `${details.origin}/thankyou?testDetail=${details.testDetail}`,
            cancel_url: details.isProvider
              ? `${details.origin}/profile?tab=purchase-test`
              : `${details.origin}/available-test?name=Tower%20of%20London%20test`,
          },
          transactions: [
            {
              amount: {
                currency: 'USD',
                total: overallTotal.toFixed(2),
                details: {
                  subtotal: overallTotal.toFixed(2),
                },
              },
              item_list: {
                items: items,
              },
            },
          ],
        },
        (error, payment) => {
          if (error) {
            this.logger.error(error.response.message);
            return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
              statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
              message:
                error.response.message || 'Failed to create PayPal payment',
            });
          } else {
            this.logger.info('Link created successfully');
            return response.status(HttpStatus.OK).json({
              statusCode: HttpStatus.OK,
              message: 'Link created successfully',
              data: payment,
            });
          }
        },
      );
    } catch (error) {
      this.logger.error(error.message);
      return response.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Error in PayPal payment creation',
      });
    }
  }

  @Post('createPayment')
  async createPayment(
    @Body() createData: CreatePayPalPaymentDto,
    @Res() response: Response,
  ) {
    try {
      const { paymentId, payerId } = createData;

      const execute_payment_json = {
        payer_id: payerId,
      };

      paypal.payment.execute(
        paymentId,
        execute_payment_json,
        async (error, payment1: any) => {
          if (error) {
            this.logger.info(error.response.message);
            return response.status(error.httpStatusCode).json({
              statusCode: error.httpStatusCode,
              message: error.response.message,
              data: error.response,
            });
          } else {
            try {
              const payment: any = await new Promise((resolve, reject) => {
                paypal.payment.get(payment1.id, (error, payment: any) => {
                  if (error) {
                    return reject(error);
                  }
                  resolve(payment);
                });
              });

              const invoice: any = {
                merchant_info: {
                  email: payment.payer.payer_info.email,
                  first_name: payment.payer.payer_info.first_name,
                  last_name: payment.payer.payer_info.last_name,
                  phone: {
                    country_code: '1',
                    national_number: payment.payer.payer_info.phone || '0000000000',
                  },
                },
                billing_info: [
                  {
                    email: payment.payer.payer_info.email,
                  },
                ],
                items: payment.transactions[0].item_list.items.map(
                  (item: { name: any; quantity: any; price: any }) => ({
                    name: item.name,
                    quantity: item.quantity,
                    unit_price: {
                      currency: 'USD',
                      value: item.price,
                    },
                  }),
                ),
                note: 'Thank you for your business.',
              };

              const createdInvoice: any = await new Promise(
                (resolve, reject) => {
                  paypal.invoice.create(invoice, (error, invoice) => {
                    if (error) {
                      return reject(error);
                    }
                    resolve(invoice);
                  });
                },
              );

              const createPayment =
                !createData.isProvider
                  ? await this.paypalService.createPayPalPayment(createData)
                  : await this.paypalService.createAssignTestPayPalPayment(
                      createData,
                      createdInvoice.id,
                    );
              this.logger.info('Payment is successful');
              return response.status(HttpStatus.OK).json({
                statusCode: HttpStatus.OK,
                message: 'Payment is successful',
                data: createPayment,
              });
            } catch (error) {
              this.logger.error(error);
              return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                message: 'An error occurred during processing.',
                data: error,
              });
            }
          }
        },
      );
    } catch (error) {
      this.logger.error(error.message);
      return response.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        message: error.message,
      });
    }
  }

  @Get('download/:invoiceId')
  async downloadInvoice(
    @Param('invoiceId') invoiceId: string,
    @Res() response: Response,
  ) {
    try {
      const PDFDocument = require('pdfkit');
      const invoiceDetails1: any = await new Promise((resolve, reject) => {
        paypal.invoice.get(invoiceId, (error, invoice) => {
          if (error) {
            return reject(error);
          }
          resolve(invoice);
        });
      });

      const doc = new PDFDocument({ margin: 50 });
      const buffers: any[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', async () => {
        const pdfData = Buffer.concat(buffers);

        response.setHeader(
          'Content-Disposition',
          'attachment; filename=invoice.pdf',
        );
        response.setHeader('Content-Type', 'application/pdf');

        return response.status(200).json({
          statusCode: 200,
          message: 'PDF created successfully',
          data: {
            pdf: `${pdfData.toString('base64')}`,
          },
        });
      });

      const logoPath = path.join(process.cwd(), 'public', 'logo.png');
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 50, 45, { width: 180, height: 50 });
      }
      doc
        .fontSize(10)
        .text('Street Address', 200, 65, { align: 'right' })
        .text('City, State, Zip', 200, 80, { align: 'right' })
        .moveDown();

      doc.fontSize(24).text('INVOICE', 50, 160);

      doc
        .fontSize(10)
        .text(`Invoice Number: ${invoiceDetails1.number}`, 50, 200)
        .text(`Invoice Date: ${invoiceDetails1.invoice_date}`, 50, 215)
        .text(`Invoice Id: ${invoiceDetails1.id}`, 50, 230)
        .moveDown();

      doc
        .fontSize(10)
        .text('Bill To:', 50, 270)
        .text(
          invoiceDetails1.merchant_info.first_name +
            ' ' +
            invoiceDetails1.merchant_info.last_name,
          50,
          285,
        )
        .text(invoiceDetails1.merchant_info.email, 50, 300)
        .text(invoiceDetails1.merchant_info.phone?.national_number || '', 50, 315)
        .moveDown();

      doc
        .fontSize(12)
        .text('Item', 50, 370)
        .text('Qty', 280, 370, { width: 90, align: 'center' })
        .text('Price', 370, 370, { width: 90, align: 'center' })
        .text('Amount', 0, 370, { align: 'right' })
        .moveDown();

      doc.moveTo(50, 390).lineTo(550, 390).stroke();

      let itemPosition = 410;
      invoiceDetails1.items.forEach(
        (item: {
          name: any;
          quantity: any;
          unit_price: { value: any; currency: any };
        }) => {
          doc
            .fontSize(10)
            .text(item.name, 50, itemPosition)
            .text(
              item.quantity,
              280,
              itemPosition,
              { width: 90, align: 'center' },
            )
            .text(
              `${item.unit_price.value} ${item.unit_price.currency}`,
              370,
              itemPosition,
              { width: 90, align: 'center' },
            )
            .text(
              `${(item.quantity * item.unit_price.value).toFixed(2)} ${
                item.unit_price.currency
              }`,
              0,
              itemPosition,
              { align: 'right' },
            );

          itemPosition += 20;
        },
      );

      doc.moveDown();

      doc
        .fontSize(12)
        .text(
          `Total: ${invoiceDetails1.total_amount.value} ${invoiceDetails1.total_amount.currency}`,
          0,
          itemPosition + 20,
          { align: 'right' },
        );

      doc
        .fontSize(10)
        .text('Thank you.', 50, doc.page.height - 100, {
          align: 'center',
          width: 500,
        });

      doc.end();
    } catch (error) {
      this.logger.error(error);
      return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'An error occurred during processing.',
        data: error,
      });
    }
  }
}
