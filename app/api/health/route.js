export async function GET() {
  return Response.json({ 
    status: 'ok', 
    message: 'Gilda HR Assistant API is running',
    timestamp: new Date().toISOString()
  });
}

