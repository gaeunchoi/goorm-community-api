import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

JwtModule.registerAsync({
  inject: [ConfigService],
  useFactory: (config: ConfigService) => ({
    secret: config.get('JWT_SECRET'),
    signOptions: { expiresIn: '365d' },
  }),
});
