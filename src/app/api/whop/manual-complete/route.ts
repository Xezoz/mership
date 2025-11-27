import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

// TEMPORARY: Manual endpoint to complete pending transactions
// This is for testing while we debug the webhook
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { transaction_id } = body;

        if (!transaction_id) {
            return NextResponse.json({ error: 'transaction_id required' }, { status: 400 });
        }

        const supabase: any = createAdminClient();

        // Update transaction status
        const { error: updateError } = await supabase
            .from('transactions')
            .update({ status: 'completed' })
            .eq('id', transaction_id);

        if (updateError) {
            console.error('Error updating transaction:', updateError);
            return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
        }

        // Update user balance
        const { data: transaction } = await supabase
            .from('transactions')
            .select('user_id, amount')
            .eq('id', transaction_id)
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

            return NextResponse.json({
                success: true,
                old_balance: currentBalance,
                new_balance: newBalance,
                amount_added: transaction.amount
            });
        }

        return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });

    } catch (error: any) {
        console.error('Manual complete error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
