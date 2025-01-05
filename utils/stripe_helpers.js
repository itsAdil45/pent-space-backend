/** @format */

const { stripe } = require("@/configs/stripe");

async function createCustomer({ email }) {
  const customer = await stripe.customers.create({
    name: "name",
    email,
  });

  return customer;
}

async function createConnectedAccount(email) {
  const account = await stripe.accounts.create({
    type: "custom",
    country: "US",
    email,
    capabilities: {
      card_payments: {
        requested: true,
      },
      transfers: {
        requested: true,
      },
    },
  });
  return account.id;
}

async function verifyCreatedAccount(accountId) {
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: "http://localhost:3000/reauth",
    return_url: "http://localhost:3000/return",
    type: "account_onboarding",
  });
  return accountLink.url;
}

async function acceptTermsAndConditions(accountId) {
  const date = Math.floor(new Date().getTime() / 1000);
  console.log(date);
  const account = await stripe.accounts.update(accountId, {
    tos_acceptance: {
      date,
      ip: "8.8.8.8",
    },
  });
  return account;
}

async function getAccountDetails(accountId) {
  const account = await stripe.accounts.retrieve(accountId);
  return account;
}

async function createBankAccount({
  account_id,
  account_number,
  routing_number,
}) {
  let external_account;
  if (routing_number) {
    external_account = {
      account_number,
      routing_number,
      country: "US",
      currency: "usd",
      object: "bank_account",
    };
  } else {
    external_account = {
      account_number,
      country: "US",
      currency: "usd",
      object: "bank_account",
    };
  }
  const externalAccount = await stripe.accounts.createExternalAccount(
    account_id,
    { external_account }
  );
  return externalAccount;
}

async function getAllBankAccounts(account_id) {
  const externalAccounts = await stripe.accounts.listExternalAccounts(
    account_id,
    {
      object: "bank_account",
    }
  );
  return externalAccounts;
}

async function createPayout({ amount, destination, account_id }) {
  const payout = await stripe.payouts.create(
    {
      amount,
      currency: "usd",
      source_type: "card",
      destination,
    },
    {
      stripeAccount: account_id,
    }
  );
  return payout;
}

async function getBalance({ account_id }) {
  const balance = await stripe.balance.retrieve({
    stripeAccount: account_id,
  });
  return balance;
}

async function getBalanceTransactions({ account_id }) {
  const balanceTransactions = await stripe.refunds.list({
    stripeAccount: account_id,
  });
  return balanceTransactions;
}

async function createPaymentIntent({ amount, metadata, customer }) {
  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency: "usd",
    customer,
    setup_future_usage: "off_session",
    metadata,
  });

  return paymentIntent;
}

async function createBusinessTransferAccount({
  amount,
  metadata,
  connectedAccountId,
}) {
  const transfer = await stripe.transfers.create({
    amount,
    currency: "usd",
    destination: connectedAccountId,
    metadata,
  });

  return transfer;
}

async function createBusinessTransferReverse({ amount, transferId }) {
  const transferReversal = await stripe.transfers.createReversal(transferId, {
    amount,
  });

  return transferReversal;
}

module.exports = {
  createCustomer,
  createPaymentIntent,
  createConnectedAccount,
  verifyCreatedAccount,
  getAccountDetails,
  createBankAccount,
  getAllBankAccounts,
  createPayout,
  createBusinessTransferAccount,
  createBusinessTransferReverse,
  getBalance,
  getBalanceTransactions,
  acceptTermsAndConditions,
};
