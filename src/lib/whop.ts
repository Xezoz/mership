const WHOP_API_KEY = process.env.WHOP_API_KEY;
const WHOP_API_URL = 'https://api.whop.com/v2';

if (!WHOP_API_KEY) {
    console.warn('WHOP_API_KEY is not set in environment variables');
}

export async function createWhopCheckout({
    amount,
    redirectUrl,
    userId,
    metadata = {}
}: {
    amount: number;
    redirectUrl: string;
    userId: string;
    metadata?: Record<string, any>;
}) {
    // Whop requires a plan_id or price parameter
    // For dynamic amounts, we need to use a plan that supports custom pricing
    // or create a price on the fly

    // Map amounts to plan IDs
    const planMapping: Record<number, string | undefined> = {
        10: process.env.WHOP_PLAN_ID_10,
        25: process.env.WHOP_PLAN_ID_25,
        50: process.env.WHOP_PLAN_ID_50,
        100: process.env.WHOP_PLAN_ID_100,
    };

    const planId = planMapping[amount];

    if (!planId) {
        throw new Error(`No Whop plan configured for $${amount}. Please set WHOP_PLAN_ID_${amount} in your environment variables.`);
    }

    // Create a checkout session
    // Documentation: https://dev.whop.com/api-reference/v2/checkout-sessions/create-a-checkout-session
    const response = await fetch(`${WHOP_API_URL}/checkout_sessions`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${WHOP_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            plan_id: planId,
            // Store custom amount and user info in metadata
            metadata: {
                user_id: userId,
                type: 'deposit',
                amount: amount.toString(),
                ...metadata
            },
            success_url: `${redirectUrl}?success=true`,
            cancel_url: `${redirectUrl}?canceled=true`
        })
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Whop API Error: ${error}`);
    }

    return response.json();
}
