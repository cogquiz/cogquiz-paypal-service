import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaypalModule } from './paypal/paypal.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        url: process.env.DATABASE_URL,
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: false,
        logging: process.env.NODE_ENV === 'development',
      }),
    }),
    PaypalModule,
  ],
})
export class AppModule {}
