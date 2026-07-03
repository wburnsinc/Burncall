/**
 * Delete Plan API Endpoint
 * DELETE /api/copilot/plans/:id
 * 
 * Deletes a plan
 */

export default async function handler(req, res) {
  // Only allow DELETE requests
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Plan ID is required'
      });
    }

    // TODO: Validate plan exists
    // TODO: Delete plan from database
    // TODO: Validate user has permission to delete
    // TODO: Handle cascade deletes if needed

    return res.status(200).json({
      success: true,
      message: `Plan ${id} deleted successfully`
    });
  } catch (error) {
    console.error('Error deleting plan:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete plan'
    });
  }
}
