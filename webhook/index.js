/** @format */

const { prisma } = require("@/configs/prisma");
const stripe = require("stripe");

const webhookHandler = (request, response) => {
  //   express.json({ type: "application/json" }),
  const sig = request.headers["stripe-signature"];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      request.body,
      sig,
      process.env.WEBHOOK_SECRET_KEY
    );
  } catch (err) {
    response.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  async function updateDonationRecord(paymentIntent, type) {
    try {
      if (type == "success") {
        console.log("success");
        await prisma.donations.update({
          data: {
            is_paid: true,
            // payment_intent_id: paymentIntent.id,
          },
          where: {
            id: Number(paymentIntent.metadata.donation_id),
          },
        });
      } else {
        console.log("failed to pay");
      }
    } catch (error) {
      console.log(error);
    }
  }

  // Handle the event
  const paymentIntent = event.data.object;
  if (event.type == "payment_intent.succeeded") {
    updateDonationRecord(paymentIntent, "success");
  } else if (event.type == "payment_intent.payment_failed") {
    updateDonationRecord(paymentIntent, "failed");
  }

  // Return a response to acknowledge receipt of the event
  response.json({ received: true });
};

module.exports = webhookHandler;
