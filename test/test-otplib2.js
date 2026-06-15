const otplib = require('otplib');
async function test() {
  const secret = otplib.generateSecret();
  const tokenObj = await otplib.generate({ secret });
  console.log("token:", tokenObj);
  console.log("valid token verify:", await otplib.verify({ token: tokenObj, secret }));
  console.log("invalid token verify:", await otplib.verify({ token: '000000', secret }));
}
test().catch(console.error);
