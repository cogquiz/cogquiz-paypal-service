import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PaypalService } from './paypal.service';
import { PaypalController } from './paypal.controller';
import { PayPalPayment } from './entities/paypal-payment.entity';
import { PurchesedAssignTest } from './entities/purchesed-assign-test.entity';
import { Tests } from './entities/tests.entity';
import { User } from './entities/user.entity';
import { UserProfile } from './entities/user-profile.entity';
import { Provider } from './entities/provider.entity';
import { WinstonLoggerModule } from '../common/logger.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Provider,
      User,
      UserProfile,
      PayPalPayment,
      PurchesedAssignTest,
      Tests,
    ]),
    WinstonLoggerModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'secret',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [PaypalController],
  providers: [PaypalService],
})
export class PaypalModule {}
