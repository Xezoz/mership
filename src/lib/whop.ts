const WHOP_API_KEY = process.env.WHOP_API_KEY;
const WHOP_API_URL = 'https://api.whop.com/api/v2';

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

    const response = await fetch(`${WHOP_API_URL}/checkout_sessions`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${WHOP_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            plan_id: planId,
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
