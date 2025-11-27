import { Webhook } from 'coinbase-commerce-node';
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

const COINBASE_WEBHOOK_SECRET = process.env.COINBASE_WEBHOOK_SECRET;

export async function POST(request: Request) {
    try {
        const rawBody = await request.text();
        const signature = request.headers.get('x-cc-webhook-signature');

        if (!COINBASE_WEBHOOK_SECRET || !signature) {
            console.error('Missing webhook secret or signature');
            return NextResponse.json({ error: 'Configuration error' }, { status: 500 });
        }

        // Verify signature
        try {
            Webhook.verifySignature(signature, rawBody, COINBASE_WEBHOOK_SECRET);
        } catch (error) {
            console.error('Invalid signature:', error);
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }

        const event = JSON.parse(rawBody);
        const supabase: any = createAdminClient();

        console.log('Coinbase Webhook Event:', event.type, event.id);

        if (event.type === 'charge:confirmed' || event.type === 'charge:resolved') {
            const charge = event.data;
            const { metadata, payments } = charge;
            const userId = metadata?.user_id;

            // Find transaction by charge ID stored in metadata
            // Note: We might need to query by metadata->>charge_id if we indexed it, 
            // or we can try to find the pending transaction for this user and amount if charge_id wasn't saved perfectly.
            // But ideally we saved charge_id in the checkout route.

            // For now, let's assume we can find it or we just update the user balance directly if we trust the metadata.

            if (userId) {
                // Find the transaction
                const { data: transaction } = await supabase
                    .from('transactions')
                    .select('*')
                    .eq('metadata->>charge_id', charge.id)
                    .single();

                if (transaction && transaction.status !== 'completed') {
                    // Update transaction
                    await supabase
                        .from('transactions')
                        .update({ status: 'completed' })
                        .eq('id', transaction.id);

                    // Update user balance
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('balance')
                        .eq('id', userId)
                        .single();

                    const currentBalance = profile?.balance || 0;
                    // Use the actual amount paid from the charge data if available, or the transaction amount
                    const amountPaid = parseFloat(charge.pricing.local.amount);

                    await supabase
                        .from('profiles')
                        .update({ balance: currentBalance + amountPaid })
                        .eq('id', userId);

                    console.log(`Updated balance for user ${userId} by $${amountPaid}`);
                } else if (!transaction) {
                    // Fallback: Transaction not found (maybe created before we saved charge_id correctly?)
                    // We should still credit the user if the metadata is valid
                    console.warn(`Transaction not found for charge ${charge.id}, crediting user directly.`);

                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('balance')
                        .eq('id', userId)
                        .single();

                    const currentBalance = profile?.balance || 0;
                    const amountPaid = parseFloat(charge.pricing.local.amount);

                    await supabase
                        .from('profiles')
                        .update({ balance: currentBalance + amountPaid })
                        .eq('id', userId);

                    // Create a completed transaction record for history
                    await supabase.from('transactions').insert({
                        user_id: userId,
                        type: 'deposit',
                        amount: amountPaid,
                        status: 'completed',
                        payment_method: 'coinbase',
                        description: `Deposit of $${amountPaid.toFixed(2)} via Coinbase (Webhook)`,
                        metadata: { charge_id: charge.id, charge_code: charge.code, source: 'webhook_fallback' }
                    });
                }
            }
        }

        return NextResponse.json({ received: true });
    } catch (error: any) {
        console.error('Webhook handler error:', error);
        return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
    }
}
