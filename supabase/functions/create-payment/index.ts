import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PaymentRequest {
  order_id: string;
  gross_amount: number;
  customer_name: string;
  customer_email: string;
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const serverKey = Deno.env.get("MIDTRANS_SERVER_KEY");
    if (!serverKey) {
      throw new Error("MIDTRANS_SERVER_KEY is not configured");
    }

    const { order_id, gross_amount, customer_name, customer_email, items }: PaymentRequest = await req.json();

    console.log("Creating Midtrans transaction for order:", order_id);

    // Midtrans Snap API endpoint (sandbox)
    // For production, use: https://app.midtrans.com/snap/v1/transactions
    const midtransUrl = "https://app.sandbox.midtrans.com/snap/v1/transactions";

    // Create transaction payload
    const transactionDetails = {
      transaction_details: {
        order_id: order_id,
        gross_amount: Math.round(gross_amount),
      },
      customer_details: {
        first_name: customer_name,
        email: customer_email,
      },
      item_details: items.map((item) => ({
        id: item.id,
        name: item.name.substring(0, 50), // Midtrans has max 50 chars for item name
        price: Math.round(item.price),
        quantity: item.quantity,
      })),
    };

    console.log("Transaction payload:", JSON.stringify(transactionDetails));

    // Create authorization header (Base64 encoded server key)
    const authString = btoa(serverKey + ":");

    const response = await fetch(midtransUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Basic ${authString}`,
      },
      body: JSON.stringify(transactionDetails),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Midtrans error:", data);
      throw new Error(data.error_messages?.[0] || "Failed to create transaction");
    }

    console.log("Midtrans transaction created successfully:", data);

    return new Response(
      JSON.stringify({
        token: data.token,
        redirect_url: data.redirect_url,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in create-payment function:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
