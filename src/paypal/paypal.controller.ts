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
import { WinstonLoggerService } from '../common/logger.service';
import { CreatePayPalPaymentDto } from './dto/create-payment.dto';
import { CheckoutPayPalPaymentDto } from './dto/checkout-payment.dto';
import { Response } from 'express';

@Controller('paypal')
export class PaypalController {
  constructor(
    private readonly paypalService: PaypalService,
    private readonly logger: WinstonLoggerService,
  ) {}

  @Get('/fetchAllTests')
  async fetchAllTests(@Res() response: Response) {
    try {
      // Return free access to all tests
      const fetchTest = await this.paypalService.fetchAllTests();
      if (fetchTest) {
        this.logger.info('Fetch Tests successfully - FREE ACCESS');
        return response.status(HttpStatus.OK).json({
          statusCode: HttpStatus.OK,
          data: fetchTest,
          message: 'All tests available for free',
        });
      }
      this.logger.info('No tests found');
      return response.status(HttpStatus.NOT_FOUND).json({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'No tests found',
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
      // Return FREE ACCESS for all users - no payment required
      this.logger.info('Free access granted - no payment required');
      return response.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        data: { hasAccess: true, freeAccess: true },
        message: 'Free access granted',
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
      // Return FREE ACCESS for all providers
      this.logger.info('Provider free access granted');
      return response.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        data: { hasAccess: true, freeAccess: true },
        message: 'Free access granted to all tests',
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
      // Return empty history with free access
      this.logger.info('Free access - returning empty history');
      return response.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        data: {
          combinedData: [],
          page: page || 1,
          pageSize: pageSize || 10,
          totalCount: 0,
          freeAccess: true
        },
        message: 'Free access - no purchase history needed',
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
      // FREE ACCESS - Return immediate success without PayPal
      this.logger.info('Free access - bypassing PayPal payment');
      return response.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: 'Free access granted',
        data: {
          links: [
            {
              href: `${details.origin}/thankyou?testDetail=${details.testDetail}&freeAccess=true`,
              rel: 'approval_url',
            },
            {
              href: `${details.origin}/thankyou?free=true`,
              rel: 'self',
            },
          ],
          freeAccess: true,
        },
      });
    } catch (error) {
      this.logger.error(error.message);
      return response.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Free access error',
      });
    }
  }

  @Post('createPayment')
  async createPayment(
    @Body() createData: CreatePayPalPaymentDto,
    @Res() response: Response,
  ) {
    try {
      // FREE ACCESS - Return immediate success without PayPal
      this.logger.info('Free access - payment recorded automatically');
      return response.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: 'Free access granted - payment recorded',
        data: {
          freeAccess: true,
          paymentId: `free_${Date.now()}`,
          payerId: 'free_payer',
        },
      });
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
      // Return a simple PDF for free access
      const PDFDocument = require('pdfkit');
      const doc = new PDFDocument({ margin: 50 });
      const buffers: any[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', async () => {
        const pdfData = Buffer.concat(buffers);
        response.setHeader('Content-Disposition', 'attachment; filename=free-access.pdf');
        response.setHeader('Content-Type', 'application/pdf');
        return response.status(200).json({
          statusCode: 200,
          message: 'PDF created successfully',
          data: {
            pdf: `${pdfData.toString('base64')}`,
          },
        });
      });

      doc.fontSize(24).text('Free Access Confirmation', 50, 160);
      doc.fontSize(12).text('Thank you for using CogQuiz!', 50, 200);
      doc.fontSize(10).text('All tests are now available for free access.', 50, 230);
      doc.fontSize(10).text(`Confirmation ID: FREE-${invoiceId}`, 50, 260);
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