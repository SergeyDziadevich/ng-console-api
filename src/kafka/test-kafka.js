const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../../dist/app.module');
const { ProducerService } = require('../../dist/kafka/producer.service');

async function bootstrap() {
  console.log('Initializing NestJS application context...');
  const app = await NestFactory.createApplicationContext(AppModule);
  console.log('NestJS application context initialized successfully.');

  const producer = app.get(ProducerService);
  console.log('Got ProducerService, sending a test message...');

  await producer.produce({
    topic: 'email.notification',
    messages: [
      {
        value: JSON.stringify({
          to: 'test@example.com',
          name: 'Test User',
          message: 'Hello from Kafka!',
        }),
      },
    ],
  });

  console.log('Message produced successfully to email.notification topic!');
  console.log('Waiting 3 seconds for ConsumerService to process it...');

  // Wait a bit to let consumer process
  await new Promise((resolve) => setTimeout(resolve, 3000));

  await app.close();
  console.log('Application closed.');
}
bootstrap().catch((err) => {
  console.error('Error during Kafka test:', err);
  process.exit(1);
});
