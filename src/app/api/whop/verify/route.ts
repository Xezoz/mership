import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

const WHOP_API_KEY = process.env.WHOP_API_KEY;
const WHOP_API_URL = 'https://api.whop.com/api/v2';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        console.log('Verify endpoint called with body:', body);

        const { transaction_id } = body;

        if (!transaction_id) {
            console.error('No transaction_id provided');
            return NextResponse.json({ error: 'transaction_id required' }, { status: 400 });
        }

        console.log('Creating admin client...');
        const supabase: any = createAdminClient();

        // Check if already completed
        const { data: existingTx, error: fetchError } = await supabase
            .from('transactions')
            .select('status, user_id, amount, metadata')
            .eq('id', transaction_id)
            .single();

        if (fetchError) {
            console.error('Error fetching transaction:', fetchError);
            return NextResponse.json({ error: 'Transaction fetch failed' }, { status: 500 });
        }

        if (!existingTx) {
            return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
        }

        console.log('Transaction data:', JSON.stringify(existingTx, null, 2));

        if (existingTx.status === 'completed') {
            // Get current balance
            const { data: profile } = await supabase
                .from('profiles')
                .select('balance')
                .eq('id', existingTx.user_id)
                .single();

            return NextResponse.json({
                completed: true,
                already_processed: true,
                balance: profile?.balance || 0
            });
        }

        // CRITICAL: Verify with Whop API that the checkout was actually completed
        // Get the checkout session ID from transaction metadata
        const checkoutSessionId = existingTx.metadata?.checkout_session_id;

        if (!checkoutSessionId) {
            console.error('No checkout_session_id in transaction metadata');
            return NextResponse.json({
                error: 'Cannot verify payment - missing checkout session ID'
            }, { status: 400 });
        }

        console.log('Verifying checkout session with Whop:', checkoutSessionId);

        // Verify with Whop API
        const whopResponse = await fetch(`${WHOP_API_URL}/checkout_sessions/${checkoutSessionId}`, {
            headers: {
                'Authorization': `Bearer ${WHOP_API_KEY}`,
            }
        });

        if (!whopResponse.ok) {
            console.error('Whop API error:', await whopResponse.text());
            return NextResponse.json({
                error: 'Failed to verify payment with Whop'
            }, { status: 500 });
        }

        const checkoutData = await whopResponse.json();
        console.log('Whop checkout status:', checkoutData.status);

        // Check if payment was actually completed
        const isCompleted = checkoutData.status === 'completed' || checkoutData.completed === true;

        if (!isCompleted) {
            console.log('Payment not completed, status:', checkoutData.status);
            return NextResponse.json({
                completed: false,
                status: checkoutData.status,
                message: 'Payment not completed yet'
            });
        }

        console.log('Payment verified as completed, updating balance...');

        // Mark as completed and update balance
        await supabase
            .from('transactions')
            .update({ status: 'completed' })
            .eq('id', transaction_id);

        const { data: profile } = await supabase
            .from('profiles')
            .select('balance')
            .eq('id', existingTx.user_id)
            .single();

        const currentBalance = profile?.balance || 0;
        const newBalance = currentBalance + existingTx.amount;

        await supabase
            .from('profiles')
            .update({ balance: newBalance })
            .eq('id', existingTx.user_id);

        return NextResponse.json({
            completed: true,
            balance_updated: true,
            new_balance: newBalance,
            amount_added: existingTx.amount
        });

    } catch (error: any) {
        console.error('Verify error:', error);
        console.error('Error stack:', error.stack);
        console.error('Error details:', JSON.stringify(error, null, 2));
        return NextResponse.json({
            error: error.message || 'Verification failed',
            details: error.toString()
        }, { status: 500 });
    }
}
