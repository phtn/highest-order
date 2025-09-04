import { Webhook } from "svix";

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET ?? "";

export const verifySignature = async (
  id: string,
  payload: string,
  signature: string,
  timestamp: string,
) => {
  const svix = new Webhook(WEBHOOK_SECRET);
  return await svix.verify(payload, {
    "svix-id": id,
    "svix-timestamp": timestamp,
    "svix-signature": signature,
  });
};
