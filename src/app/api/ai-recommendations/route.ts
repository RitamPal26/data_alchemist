import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { rows, errors } = await req.json();
    
    console.log('📊 Received data:', { rows: Object.keys(rows), errors: Object.keys(errors) });
    
    // More robust counting logic
    let totalClients = 0, totalTasks = 0, totalWorkers = 0;
    
    Object.entries(rows).forEach(([fileName, data]) => {
      const count = Array.isArray(data) ? data.length : 0;
      const lower = fileName.toLowerCase();
      
      if (lower.includes('client')) totalClients += count;
      else if (lower.includes('task')) totalTasks += count;  
      else if (lower.includes('worker')) totalWorkers += count;
      
      console.log(`📁 ${fileName}: ${count} rows`);
    });

    console.log(`📈 Totals: ${totalClients} clients, ${totalTasks} tasks, ${totalWorkers} workers`);

    return Response.json({
      analyzed: { 
        clients: totalClients, 
        tasks: totalTasks, 
        workers: totalWorkers 
      },
      recommendations: [
        {
          id: 'rec-1',
          title: 'Data Analysis Complete',
          description: `Successfully analyzed ${totalClients + totalTasks + totalWorkers} total records`,
          priority: 'high'
        },
        {
          id: 'rec-2',
          title: 'Validation Rules Needed',
          description: 'Consider adding email format validation for client records',
          priority: 'medium'
        }
      ]
    });
  } catch (error) {
    console.error('❌ API Error:', error);
    return Response.json({
      analyzed: { clients: 0, tasks: 0, workers: 0 },
      recommendations: [{
        id: 'error-1',
        title: 'Error processing data',
        description: error.message,
        priority: 'high'
      }]
    });
  }
}
