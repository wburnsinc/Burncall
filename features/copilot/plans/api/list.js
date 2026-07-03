/**
 * List Plans API Endpoint
 * GET /api/copilot/plans
 * 
 * Returns a list of all available plans for the current user
 */

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // TODO: Implement database query to fetch user's plans
    const plans = [
      {
        id: 'plan-1',
        name: 'Q1 Execution Plan',
        template: 'quick-burn-plan',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'active'
      }
    ];

    return res.status(200).json({
      success: true,
      data: plans,
      count: plans.length
    });
  } catch (error) {
    console.error('Error fetching plans:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch plans'
    });
  }
}
