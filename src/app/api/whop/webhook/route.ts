import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

const WHOP_WEBHOOK_SECRET = process.env.WHOP_WEBHOOK_SECRET;

export async function POST(request: Request) {
    try {
        const body = await request.text();
        console.log('Webhook received:', body);

        const signature = request.headers.get('whop-signature');

        // Verify signature (optional for now, but recommended)
        if (WHOP_WEBHOOK_SECRET && signature) {
            // Verification logic here
        }

        const event = JSON.parse(body);
        // Cast to any to bypass strict type checking for now
        const supabase: any = createAdminClient();

        if (event.type === 'payment.succeeded' || event.type === 'checkout.completed') {
            const { metadata } = event.data;
            const transactionId = metadata?.transaction_id;

            if (transactionId) {
                // Update transaction status
                const { error: updateError } = await supabase
                    .from('transactions')
                    .update({ status: 'completed' })
                    .eq('id', transactionId);

                if (updateError) {
                    console.error('Error updating transaction:', updateError);
                    return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
                }

                // Update user balance
                const { data: transaction } = await supabase
                    .from('transactions')
                    .select('user_id, amount')
                    .eq('id', transactionId)
                    .single();

                if (transaction) {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('balance')
                        .eq('id', transaction.user_id)
                        .single();

                    const currentBalance = profile?.balance || 0;
                    const newBalance = currentBalance + transaction.amount;

                    await supabase
                        .from('profiles')
                        .update({ balance: newBalance })
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
