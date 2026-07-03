/**
 * Create Plan API Endpoint
 * POST /api/copilot/plans
 * 
 * Creates a new plan based on provided template or custom configuration
 */

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, template, tasks, duration } = req.body;

    // Validate required fields
    if (!name || !template) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, template'
      });
    }

    // TODO: Validate template exists
    // TODO: Generate plan ID
    // TODO: Save to database

    const newPlan = {
      id: `plan-${Date.now()}`,
      name,
      template,
      tasks: tasks || [],
      duration: duration || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'draft'
    };

    return res.status(201).json({
      success: true,
      data: newPlan,
      message: 'Plan created successfully'
    });
  } catch (error) {
    console.error('Error creating plan:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create plan'
    });
  }
}
