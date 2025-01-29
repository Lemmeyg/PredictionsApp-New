'use server'

import { updateFixtures } from '../../../scripts/update-fixtures'

export async function runFixtureUpdate() {
  try {
    await updateFixtures()
    return { success: true }
  } catch (error) {
    console.error('Failed to update fixtures:', error)
    return { success: false, error: 'Failed to update fixtures' }
  }
} 