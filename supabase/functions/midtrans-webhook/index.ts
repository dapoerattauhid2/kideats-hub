import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MidtransNotification {
  transaction_status: string;
  order_id: string;
  gross_amount: string;
  payment_type: string;
  transaction_time: string;
  fraud_status?: string;
  signature_key: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const notification: MidtransNotification = await req.json();

    console.log("Received Midtrans notification:", notification);

    const { transaction_status, order_id, fraud_status } = notification;

    // Determine order status based on Midtrans transaction status
    let orderStatus: string;

    if (transaction_status === "capture" || transaction_status === "settlement") {
      // For credit card: capture with fraud_status 'accept'
      // For other payment methods: settlement
      if (fraud_status === "accept" || !fraud_status) {
        orderStatus = "paid"; // Lunas
      } else {
        orderStatus = "failed"; // Gagal (fraud detected)
      }
    } else if (transaction_status === "pending") {
      orderStatus = "pending"; // Pending
    } else if (
      transaction_status === "deny" ||
      transaction_status === "cancel" ||
      transaction_status === "failure"
    ) {
      orderStatus = "failed"; // Gagal
    } else if (transaction_status === "expire") {
      orderStatus = "expired"; // Expired
    } else {
      orderStatus = "pending";
    }

    console.log(`Updating order ${order_id} status to: ${orderStatus}`);

    // Update order status in database
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        status: orderStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", order_id);

    if (updateError) {
      console.error("Failed to update order status:", updateError);
      throw updateError;
    }

    console.log(`Order ${order_id} status updated successfully to ${orderStatus}`);

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in midtrans-webhook function:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
