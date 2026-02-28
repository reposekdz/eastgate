#!/usr/bin/env node

/**
 * Payment Gateway Configuration Checker
 * Verifies all payment gateways are properly configured
 */

const requiredEnvVars = {
  stripe: ['STRIPE_SECRET_KEY', 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'],
  paypal: ['PAYPAL_CLIENT_ID', 'PAYPAL_CLIENT_SECRET', 'PAYPAL_MODE'],
  flutterwave: ['FLW_SECRET_KEY', 'FLW_PUBLIC_KEY'],
  app: ['NEXT_PUBLIC_URL', 'WEBHOOK_SECRET']
};

console.log('🔍 Checking Payment Gateway Configuration...\n');

let allConfigured = true;

Object.entries(requiredEnvVars).forEach(([gateway, vars]) => {
  console.log(`\n${gateway.toUpperCase()}:`);
  vars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      console.log(`  ✅ ${varName}: Configured`);
    } else {
      console.log(`  ❌ ${varName}: Missing`);
      allConfigured = false;
    }
  });
});

console.log('\n' + '='.repeat(50));
if (allConfigured) {
  console.log('✅ All payment gateways are configured!');
  console.log('\n📝 Next steps:');
  console.log('1. Restart your development server');
  console.log('2. Test payments at http://localhost:3000/book');
  console.log('3. Use test cards for Stripe');
  console.log('4. Use sandbox accounts for PayPal');
  console.log('5. Use test mode for Flutterwave');
} else {
  console.log('❌ Some payment gateways are not configured');
  console.log('\n📝 Add missing variables to .env file');
  process.exit(1);
}
