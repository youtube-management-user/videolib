
async function go() {
  const { getOpenOrders } = require('./libs/utils.js')

  const email = process.argv[2];

  const orders = await getOpenOrders(email);
  console.log(orders)
}

go();
