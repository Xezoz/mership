import { createWhopCheckout } from '@/lib/whop';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { amount } = body;

        if (!amount || isNaN(amount) || amount <= 0) {
            return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
        }

        // Create pending transaction
        const { data: transaction, error: txError } = await supabase
            .from('transactions')
            .insert({
                user_id: user.id,
                type: 'deposit',
                amount: amount,
                status: 'pending',
                payment_method: 'whop',
                description: `Deposit of $${amount.toFixed(2)} via Card/Whop`,
                metadata: {
                    checkout_session_id: null // Will be updated after Whop response
                }
            })
            .select()
            .single();

        if (txError) {
            console.error('Error creating transaction:', txError);
            return NextResponse.json({ error: 'Database error' }, { status: 500 });
        }

        // Create Whop checkout session
        const checkout = await createWhopCheckout({
            amount,
            redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/payments`,
            userId: user.id,
            metadata: {
                transaction_id: transaction.id
            }
        });

        // The checkout URL is usually in the response, but Whop structure might vary.
        // It is likely wrapped in a 'data' property.
        const checkoutUrl =
            checkout.url ||
            checkout.checkout_url ||
            checkout.link ||
            checkout.purchase_url || // Found this in the error message!
            checkout.data?.url ||
            checkout.data?.checkout_url ||
            checkout.data?.link ||
            checkout.data?.purchase_url;

        // Update transaction with checkout session ID for verification
        if (checkout.id) {
            await supabase
                .from('transactions')
                .update({
                    metadata: { checkout_session_id: checkout.id }
                })
                .eq('id', transaction.id);
        }

        return NextResponse.json({
            url: checkoutUrl,
            checkout_session_id: checkout.id,
            transaction_id: transaction.id,
            ...checkout // Return full object for debugging
        });

    } catch (error: any) {
        console.error('Whop checkout error:', error);
        return NextResponse.json({ error: error.message || 'Checkout failed' }, { status: 500 });
    }
}
