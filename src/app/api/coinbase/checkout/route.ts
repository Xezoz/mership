import { Client, resources } from 'coinbase-commerce-node';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const COINBASE_API_KEY = process.env.COINBASE_API_KEY;

if (!COINBASE_API_KEY) {
    console.warn('COINBASE_API_KEY is not set');
}

Client.init(COINBASE_API_KEY || '');

const { Charge } = resources;

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

        // Create a charge
        // Documentation: https://docs.cloud.coinbase.com/commerce/docs/charges
        const chargeData = {
            name: 'Balance Top-up',
            description: `Deposit to account balance`,
            local_price: {
                amount: amount.toString(),
                currency: 'USD'
            },
            pricing_type: 'fixed_price',
            metadata: {
                user_id: user.id,
                type: 'deposit'
            },
            redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/payments?success=true`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/payments?canceled=true`
        };

        const charge = await Charge.create(chargeData);

        // Store pending transaction
        const { error: txError } = await supabase
            .from('transactions')
            .insert({
                user_id: user.id,
                type: 'deposit',
                amount: amount,
                status: 'pending',
                payment_method: 'coinbase',
                description: `Deposit of $${amount.toFixed(2)} via Coinbase`,
                metadata: { charge_id: charge.id, charge_code: charge.code }
            });

        if (txError) {
            console.error('Error creating transaction:', txError);
            return NextResponse.json({ error: 'Database error' }, { status: 500 });
        }

        return NextResponse.json({
            url: charge.hosted_url,
            id: charge.id,
            code: charge.code
        });

    } catch (error: any) {
        console.error('Coinbase checkout error:', error);
        return NextResponse.json({ error: error.message || 'Checkout failed' }, { status: 500 });
    }
}
