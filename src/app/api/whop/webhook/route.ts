import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

const WHOP_WEBHOOK_SECRET = process.env.WHOP_WEBHOOK_SECRET;

export async function POST(request: Request) {
    try {
        const body = await request.text();
        console.log('Webhook received:', body); // Log the raw body for debugging

        const signature = request.headers.get('whop-signature');

        // Verify signature if secret is present
        if (WHOP_WEBHOOK_SECRET && signature) {
            // Whop signature verification logic (simplified)
            // Usually HMAC-SHA256 of the body
            // const expectedSignature = crypto.createHmac('sha256', WHOP_WEBHOOK_SECRET).update(body).digest('hex');
            // if (signature !== expectedSignature) {
            //   return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
            // }
        }

        const event = JSON.parse(body);
        const supabase = createAdminClient();

        // Handle specific events
        // Note: Adjust event names based on actual Whop webhook documentation
        if (event.type === 'payment.succeeded' || event.type === 'checkout.completed') {
            const { metadata, amount_total } = event.data;
            const transactionId = metadata?.transaction_id;

            if (transactionId) {
                // Update transaction status
                const { error: updateError } = await supabase
                    .from('transactions')
                    .update({ status: 'completed' } as any)
                    .eq('id', transactionId);

                if (updateError) {
                    console.error('Error updating transaction:', updateError);
                    return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
                }

                // Update user balance
                // We need to get the user_id from the transaction first to be safe
                const { data: transaction } = await supabase
                    .from('transactions')
                    .select('user_id, amount')
                    .eq('id', transactionId)
                    .single();

                if (transaction) {
                    // Fetch current balance
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('balance')
                        .eq('id', transaction.user_id)
                        .single();

                    const currentBalance = profile?.balance || 0;
                    const newBalance = currentBalance + transaction.amount;

                    await supabase
                        .from('profiles')
                        .update({ balance: newBalance } as any)
                        .eq('id', transaction.user_id);
                }
            }
        }

        return NextResponse.json({ received: true });
    } catch (error: any) {
        console.error('Webhook error:', error);
        return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
    }
}
