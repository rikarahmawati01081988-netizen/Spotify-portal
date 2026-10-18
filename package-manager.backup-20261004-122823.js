const fs = require("fs");

function loadCustomer(customerId) {
  const file = `./customers/${customerId}.json`;

  if (!fs.existsSync(file)) {
    return null;
  }

  const customer = JSON.parse(fs.readFileSync(file, "utf8"));

  const packageFile = `./packages/${customer.package}.json`;

  if (!fs.existsSync(packageFile)) {
    return null;
  }

  const packageData = JSON.parse(
    fs.readFileSync(packageFile, "utf8")
  );

  return {
    ...customer,
    features: packageData.features
  };
}

module.exports = {
  loadCustomer
};
