import { clientOnboardingSchema } from '../src/validators/auth.validator';
import { z } from 'zod';

async function test() {
  console.log('Testing clientOnboardingSchema...');
  console.log('Schema instance:', clientOnboardingSchema ? 'Defined' : 'UNDEFINED');
  
  if (clientOnboardingSchema) {
    try {
      console.log('Attempting parse...');
      const result = await clientOnboardingSchema.parseAsync({
        body: {
          name: "Test User",
          pan: "ABCDE1234F",
          stakeholderType: "Individual"
        }
      });
      console.log('Parse result:', result);
    } catch (e: any) {
      console.log('Parse error catch triggered:', e.message || e);
      if (e.stack) console.log('Stack trace:', e.stack);
    }
  }
}

test();
