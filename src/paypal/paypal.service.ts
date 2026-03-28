import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { PayPalPayment } from './entities/paypal-payment.entity';
import { PurchesedAssignTest } from './entities/purchesed-assign-test.entity';
import { Tests } from './entities/tests.entity';
import { CreatePayPalPaymentDto } from './dto/create-payment.dto';
import * as CryptoJS from 'crypto-js';

@Injectable()
export class PaypalService {
  constructor(
    @InjectRepository(PayPalPayment)
    private readonly payPalPaymentTable: Repository<PayPalPayment>,
    @InjectRepository(PurchesedAssignTest)
    private readonly payPalPaymentAssignedTestTable: Repository<PurchesedAssignTest>,
    @InjectRepository(Tests)
    private readonly testsTable: Repository<Tests>,
  ) {}

  async fetchUserPayment(userId: string) {
    return await this.payPalPaymentTable.findOne({ where: { userId: userId } });
  }

  async fetchProviderPayment(userId: string) {
    const assignedTests = await this.payPalPaymentTable.find({
      where: { userId: userId },
      order: { lastModified: 'DESC' },
    });
    const testIds = assignedTests.map(assignedTest => assignedTest.testId);
    const tests = await this.testsTable.find({ where: { id: In(testIds) } });

    const testNameMap = new Map();
    tests.forEach(test => {
      testNameMap.set(test.id, test.name);
    });

    const combinedData = assignedTests.map(assignedTest => ({
      ...assignedTest,
      testName: testNameMap.get(assignedTest.testId),
    }));

    return combinedData;
  }

  async fetchProviderPaymentHistory(data: { userId: string; page: number; pageSize: number }) {
    const filteredAssignedTests = await this.payPalPaymentAssignedTestTable.find({
      where: { providerId: data.userId },
      order: { lastModified: 'DESC' },
    });

    const testIds = filteredAssignedTests.map(assignedTest => assignedTest.testId);
    const tests = await this.testsTable.find({ where: { id: In(testIds) } });

    const testNameMap = new Map();
    tests.forEach(test => {
      testNameMap.set(test.id, test.name);
    });

    const combinedData = filteredAssignedTests.map(assignedTest => ({
      ...assignedTest,
      testName: testNameMap.get(assignedTest.testId),
    }));

    const groupedData = combinedData.reduce((acc: any, item) => {
      if (!acc[item.paypalId]) {
        acc[item.paypalId] = {
          ...item,
          testNames: item.testName,
        };
      } else {
        acc[item.paypalId].testNames += `, ${item.testName}`;
      }
      return acc;
    }, {});

    const allGroupedData = Object.values(groupedData);
    const page = Number(data.page) || 1;
    const pageSize = Number(data.pageSize) || 10;
    const startIndex = (page - 1) * pageSize;
    const endIndex = page * pageSize;
    const paginatedGroupedData = allGroupedData.slice(startIndex, endIndex);
    const totalCount = allGroupedData.length;

    return {
      combinedData: paginatedGroupedData,
      page,
      pageSize,
      totalCount,
    };
  }

  async fetchAllTests() {
    return await this.testsTable.find();
  }

  async createPayPalPayment(data: CreatePayPalPaymentDto) {
    const decryptedBytes = CryptoJS.AES.decrypt(
      data.testDetail.replace(/ /g, '+'),
      process.env.ENCRYPTION_KEY || 'secret-key',
    );
    const decryptedData = decryptedBytes.toString(CryptoJS.enc.Utf8);
    const parsedData = JSON.parse(decryptedData);

    await Promise.all(
      parsedData.map(async (detail: { testId: string; quantity: string; userId: string }) => {
        const existingPayment = await this.payPalPaymentTable.findOne({
          where: { userId: data.userId, testId: detail.testId },
        });

        if (existingPayment) {
          existingPayment.total_purchased += parseInt(detail.quantity);
          existingPayment.total_remaining += parseInt(detail.quantity);
          await this.payPalPaymentTable.save(existingPayment);
        } else {
          const newPayment: PayPalPayment = new PayPalPayment();
          newPayment.payerId = data.payerId;
          newPayment.paymentId = data.paymentId;
          newPayment.userId = data.userId;
          newPayment.testId = detail.testId;
          newPayment.is_provider = false;
          newPayment.total_purchased = parseInt(detail.quantity);
          newPayment.total_remaining = parseInt(detail.quantity);
          await this.payPalPaymentTable.save(newPayment);
        }
      }),
    );
    return parsedData;
  }

  async createAssignTestPayPalPayment(data: any, invoiceId: string) {
    const decryptedBytes = CryptoJS.AES.decrypt(
      data.testDetail.replace(/ /g, '+'),
      process.env.ENCRYPTION_KEY || 'secret-key',
    );
    const decryptedData = decryptedBytes.toString(CryptoJS.enc.Utf8);
    const parsedData = JSON.parse(decryptedData);

    await Promise.all(
      parsedData.map(async (detail: { testId: string; quantity: string; userId: string }) => {
        const createPayment: PurchesedAssignTest = new PurchesedAssignTest();
        createPayment.testId = detail.testId;
        createPayment.providerId = data.userId;
        createPayment.paypalId = data.paymentId;
        createPayment.quantity = detail.quantity;
        createPayment.invoiceId = invoiceId;
        await this.payPalPaymentAssignedTestTable.save(createPayment);

        const existingPayment = await this.payPalPaymentTable.findOne({
          where: { userId: data.userId, testId: detail.testId },
        });

        if (existingPayment) {
          existingPayment.total_purchased += parseInt(detail.quantity);
          existingPayment.total_remaining += parseInt(detail.quantity);
          await this.payPalPaymentTable.save(existingPayment);
        } else {
          const newPayment: PayPalPayment = new PayPalPayment();
          newPayment.payerId = data.payerId;
          newPayment.paymentId = data.paymentId;
          newPayment.userId = data.userId;
          newPayment.testId = detail.testId;
          newPayment.is_provider = true;
          newPayment.total_purchased = parseInt(detail.quantity);
          newPayment.total_remaining = parseInt(detail.quantity);
          await this.payPalPaymentTable.save(newPayment);
        }
      }),
    );

    const createdPayment = await this.payPalPaymentTable.findOne({
      where: { userId: data.userId, testId: parsedData[0].testId },
    });
    return createdPayment;
  }
}
