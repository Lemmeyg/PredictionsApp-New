import { NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function POST() {
  try {
    // Check if user is Gordon (you might want to add proper authentication here)
    
    // Execute the update-fixtures script
    const { stdout, stderr } = await execAsync('npm run update-fixtures')
    
    if (stderr) {
      console.error('Script error:', stderr)
      return NextResponse.json({ error: 'Failed to update fixtures' }, { status: 500 })
    }

    console.log('Script output:', stdout)
    return NextResponse.json({ message: 'Fixtures updated successfully' })
    
  } catch (error) {
    console.error('Error running script:', error)
    return NextResponse.json({ error: 'Failed to update fixtures' }, { status: 500 })
  }
} 