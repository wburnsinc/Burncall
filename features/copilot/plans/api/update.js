/**
 * Update Plan API Endpoint
 * PUT /api/copilot/plans/:id
 * 
 * Updates an existing plan
 */

export default async function handler(req, res) {
  // Only allow PUT requests
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    const { name, tasks, duration, status } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Plan ID is required'
      });
    }

    // TODO: Validate plan exists
    // TODO: Update plan in database
    // TODO: Validate user has permission to update

    const updatedPlan = {
      id,
      name: name || 'Updated Plan',
      tasks: tasks || [],
      duration: duration || 0,
      status: status || 'active',
      updatedAt: new Date().toISOString()
    };

    return res.status(200).json({
      success: true,
      data: updatedPlan,
      message: 'Plan updated successfully'
    });
  } catch (error) {
    console.error('Error updating plan:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update plan'
    });
  }
}
