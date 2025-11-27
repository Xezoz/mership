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
        const { data: existingTx } = await supabase
            .from('transactions')
            .select('status, user_id, amount')
            .eq('id', transaction_id)
            .single();

        if (!existingTx) {
            return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
        }

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
