import { clientOnboardingSchema } from '../src/validators/auth.validator';

async function test() {
  try {
    const result = await clientOnboardingSchema.parseAsync({
      body: {
        name: "Test User",
        pan: "ABCDE1234F",
        stakeholderType: "Individual",
        riskLevel: null // Sending null like Flutter would
      }
    });
    console.log('Parse result:', result);
  } catch (e: any) {
    if (e.issues) {
      console.log('Validation errors:', e.issues);
    } else {
      console.log('Error:', e.message);
    }
  }
}

test();
