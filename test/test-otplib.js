const otplib = require('otplib');
async function test() {
  const secret = otplib.generateSecret();
  const token = otplib.generate(secret);
  console.log('valid token verify:', await otplib.verify({ token, secret }));
  console.log(
    'invalid token verify:',
    await otplib.verify({ token: '000000', secret }),
  );
}
test().catch(console.error);
