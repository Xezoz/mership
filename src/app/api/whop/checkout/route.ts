import { createClient } from '@/lib/supabase/server';
import { createWhopCheckout } from '@/lib/whop';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { amount } = body;

        if (!amount || amount <= 0) {
            return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
        }

        // Create a pending transaction record
        const { data: transaction, error: txError } = await supabase
            .from('transactions')
            .insert({
                user_id: user.id,
                type: 'deposit',
                amount: amount,
                status: 'pending',
                payment_method: 'whop',
                description: `Deposit of $${amount.toFixed(2)} via Whop`
            })
            .select()
            .single();

        if (txError) {
            console.error('Transaction creation error:', txError);
            return NextResponse.json({ error: 'Failed to create transaction record' }, { status: 500 });
        }

        // Create Whop checkout session
        const checkoutSession = await createWhopCheckout({
            amount,
            redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/payments`,
            userId: user.id,
            metadata: {
                transaction_id: transaction.id
            }
        });

        console.log('Whop checkout session created:', JSON.stringify(checkoutSession, null, 2));

        // Handle different response structures (e.g. data.url, url, id)
        // Whop v2 API returns purchase_url
        const checkoutUrl = checkoutSession.purchase_url || checkoutSession.url || checkoutSession.data?.url || checkoutSession.checkout_url;

        if (!checkoutUrl) {
            console.error('Could not find URL in Whop response:', checkoutSession);
            return NextResponse.json({ error: 'Invalid response from payment provider' }, { status: 502 });
        }

        return NextResponse.json({ url: checkoutUrl });
    } catch (error: any) {
        console.error('Whop checkout error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
