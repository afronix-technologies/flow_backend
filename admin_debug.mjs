// Quick debug script to capture the exact ERR_REQUIRE_ESM module
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

try {
  // Try each import individually in CJS mode
  const modules = [
    '@nestjs/core',
    '@nestjs/typeorm', 
    'typeorm',
    'bcrypt',
    'adminjs',
    '@adminjs/typeorm',
    '@adminjs/express',
  ];
  
  for (const mod of modules) {
    try {
      require(mod);
      console.log('✓ CJS require OK:', mod);
    } catch(e) {
      if (e.code === 'ERR_REQUIRE_ESM') {
        console.error('✗ ERR_REQUIRE_ESM:', mod);
        console.error('  -> This module requires dynamic import()');
      } else {
        console.log('✓ require threw (non-ESM):', mod, '-', e.code || e.message.substring(0, 60));
      }
    }
  }
} catch(e) {
  console.error('Outer error:', e);
}
